import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Screen, textStyles } from '../../components/Screen';
import { Button, Input } from '../../components/Controls';
import { useAuth } from '../../auth/AuthProvider';
import { getDiet, saveDietCheckin } from '../../api/player';
import { dayNames } from '../../lib/dates';
import { colors } from '../../theme';
export default function DietScreen(){
  const{session}=useAuth();
  const[days,setDays]=useState<any[]|null>(null);
  const[week,setWeek]=useState(1);
  useEffect(()=>{getDiet(session!.user.id).then(setDays).catch(e=>Alert.alert('Could not load diet',e.message));},[session]);
  const weeks=[...new Set((days??[]).map(d=>d.week_number))];
  return <Screen title="My Diet">
    {!days ? <ActivityIndicator/> : <>
      {weeks.length>1 ? <View style={styles.pills}>{weeks.map(w=><Pressable key={w} onPress={()=>setWeek(Number(w))} style={[styles.pill,w===week&&styles.active]}><Text style={textStyles.body}>W{w}</Text></Pressable>)}</View> : null}
      {days.filter(d=>d.week_number===week).map(day=><DietDay key={day.id} day={day}/>)}
    </>}
  </Screen>;
}
function DietDay({day}:{day:any}){const[checked,setChecked]=useState<boolean[]>(()=>day.meals.map(()=>false));const[comment,setComment]=useState('');const[busy,setBusy]=useState(false);async function save(){setBusy(true);try{await saveDietCheckin(day,checked.filter(Boolean).length,comment);Alert.alert('Saved','Today’s diet progress was saved.');}catch(e){Alert.alert('Could not save',(e as Error).message);}finally{setBusy(false);}}return <Card><Text style={textStyles.heading}>{dayNames[day.day_of_week]}</Text>{day.meals.map((meal:any,i:number)=><View key={i} style={styles.meal}><Pressable onPress={()=>setChecked(a=>a.map((v,j)=>j===i?!v:v))}><Text style={textStyles.body}>{checked[i]?'☑':'☐'} {meal.label}</Text></Pressable>{(meal.items??[]).map((item:any,j:number)=><Text key={j} style={textStyles.muted}>{item.food}{item.grams?` · ${item.grams} g`:''}</Text>)}</View>)}{day.comment?<Text style={textStyles.muted}>Coach: {day.comment}</Text>:null}<Input value={comment} onChangeText={setComment} placeholder="Optional note" multiline/><Button onPress={save} disabled={busy}>{busy?'SAVING…':'SAVE TODAY’S PROGRESS'}</Button></Card>}
const styles=StyleSheet.create({pills:{flexDirection:'row',flexWrap:'wrap',gap:8},pill:{padding:10,borderRadius:10,borderWidth:1,borderColor:colors.border},active:{backgroundColor:colors.accent},meal:{paddingVertical:8,borderBottomWidth:1,borderBottomColor:colors.border,gap:3}});
