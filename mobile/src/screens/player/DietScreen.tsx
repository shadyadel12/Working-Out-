import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Screen, textStyles } from '../../components/Screen';
import { Button, Input } from '../../components/Controls';
import { useAuth } from '../../auth/AuthProvider';
import { getActivePlayerLink, getDiet, saveDietCheckin } from '../../api/player';
import { currentProgramWeek, dayNames } from '../../lib/dates';
import { colors } from '../../theme';
import { CheckCircle2, Circle } from 'lucide-react-native';
export default function DietScreen(){
  const{session}=useAuth();
  const[days,setDays]=useState<any[]|null>(null);
  const[week,setWeek]=useState(1);
  useEffect(()=>{Promise.all([getDiet(session!.user.id),getActivePlayerLink(session!.user.id)]).then(([diet,link])=>{setDays(diet);if(link)setWeek(currentProgramWeek(link.created_at));}).catch(e=>Alert.alert('Could not load diet',e.message));},[session]);
  const weeks=[...new Set([...(days??[]).map(d=>d.week_number),week])].sort((a,b)=>Number(a)-Number(b));
  return <Screen title="My Diet">
    {!days ? <ActivityIndicator/> : <>
      {weeks.length>1 ? <View style={styles.pills}>{weeks.map(w=><Pressable key={w} onPress={()=>setWeek(Number(w))} style={[styles.pill,w===week&&styles.active]}><Text style={textStyles.body}>W{w}</Text></Pressable>)}</View> : null}
      {days.filter(d=>d.week_number===week).map(day=><DietDay key={day.id} day={day}/>)}
    </>}
  </Screen>;
}
function DietDay({day}:{day:any}){
  const[checked,setChecked]=useState<boolean[]>(()=>day.meals.map(()=>false));const[step,setStep]=useState(0);const[comment,setComment]=useState('');const[busy,setBusy]=useState(false);
  const finalStep=step===day.meals.length;const meal=day.meals[step];
  async function save(){setBusy(true);try{await saveDietCheckin(day,checked.filter(Boolean).length,comment);Alert.alert('Done','Today’s diet progress was saved.');}catch(e){Alert.alert('Could not save',(e as Error).message);}finally{setBusy(false);}}
  return <Card><Text style={textStyles.heading}>{dayNames[day.day_of_week]}</Text>{day.comment?<Text style={textStyles.muted}>Coach: {day.comment}</Text>:null}<View style={styles.stepHeader}><Text style={textStyles.heading}>{finalStep?'Finish day':`Meal ${step+1} of ${day.meals.length}`}</Text><Text style={textStyles.muted}>{finalStep?`${checked.filter(Boolean).length} completed`:meal?.label}</Text></View>{!finalStep&&meal?<View style={styles.meal}><Text style={textStyles.heading}>{meal.label}</Text>{(meal.items??[]).map((item:any,j:number)=><View key={j} style={styles.food}><Text style={textStyles.body}>{item.food}</Text><Text style={textStyles.muted}>{item.grams?`${item.grams} g`:''}</Text></View>)}{!(meal.items??[]).length&&meal.content?<Text style={textStyles.body}>{meal.content}</Text>:null}<Pressable accessibilityRole="button" style={[styles.check,checked[step]&&styles.checkDone]} onPress={()=>setChecked(a=>a.map((v,j)=>j===step?!v:v))}>{checked[step]?<CheckCircle2 size={18} color={colors.success}/>:<Circle size={18} color={colors.muted}/>}<Text style={textStyles.body}>{checked[step]?'COMPLETED':'MARK MEAL COMPLETED'}</Text></Pressable></View>:<><Text style={textStyles.muted}>Add an optional note for your coach, then tap Done.</Text><Input value={comment} onChangeText={setComment} placeholder="Optional note" multiline/></>}<View style={styles.navigation}><View style={styles.navButton}><Button secondary onPress={()=>setStep((value:number)=>Math.max(0,value-1))} disabled={step===0}>BACK</Button></View><View style={styles.navButton}>{finalStep?<Button onPress={save} disabled={busy}>{busy?'SAVING…':'DONE'}</Button>:<Button onPress={()=>setStep((value:number)=>Math.min(day.meals.length,value+1))}>NEXT</Button>}</View></View></Card>
}
const styles=StyleSheet.create({pills:{flexDirection:'row',flexWrap:'wrap',gap:8},pill:{padding:10,borderRadius:10,borderWidth:1,borderColor:colors.border},active:{backgroundColor:colors.accent},meal:{paddingVertical:8,gap:10},food:{flexDirection:'row',justifyContent:'space-between',gap:10,borderBottomWidth:1,borderBottomColor:colors.border,paddingVertical:7},stepHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8,borderTopWidth:1,borderTopColor:colors.border,paddingTop:12},check:{minHeight:48,flexDirection:'row',justifyContent:'center',gap:8,borderWidth:1,borderColor:colors.border,borderRadius:10,padding:12,alignItems:'center',marginTop:4},checkDone:{backgroundColor:colors.accentSoft,borderColor:colors.success},navigation:{flexDirection:'row',gap:10,marginTop:8},navButton:{flex:1}});
