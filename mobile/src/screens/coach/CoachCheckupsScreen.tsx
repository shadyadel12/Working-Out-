import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Card, Screen, textStyles } from '../../components/Screen';
import { Button, Input } from '../../components/Controls';
import { useAuth } from '../../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
import { todayISO } from '../../lib/dates';
import { colors } from '../../theme';

export default function CoachCheckupsScreen(){
 const{session}=useAuth();const[date,setDate]=useState(todayISO());const[rows,setRows]=useState<any[]|null>(null);const[busy,setBusy]=useState('');
 async function load(){setRows(null);const weekday=new Date(`${date}T12:00:00`).getDay();const{data:links,error}=await supabase.from('coach_player_links').select('*,profiles!coach_player_links_player_id_fkey(id,name,email)').eq('coach_id',session!.user.id).eq('status','active').not('player_id','is',null);if(error)return Alert.alert('Could not load',error.message);const{data:checks}=await supabase.from('checkups').select('*').eq('coach_id',session!.user.id).eq('check_date',date);const map=new Map((checks??[]).map(x=>[x.player_id,x.is_checked]));setRows((links??[]).filter((x:any)=>x.is_vip||(x.checkup_weekdays??[]).includes(weekday)).sort((a:any,b:any)=>Number(b.is_vip)-Number(a.is_vip)).map((x:any)=>({...x,checked:map.get(x.player_id)??false})));}
 useEffect(()=>{void load();},[date,session]);
 async function toggle(row:any){setBusy(row.player_id);const next=!row.checked;const{error}=await supabase.from('checkups').upsert({coach_id:session!.user.id,player_id:row.player_id,check_date:date,is_checked:next},{onConflict:'coach_id,player_id,check_date'});setBusy('');if(error)Alert.alert('Could not save',error.message);else setRows(current=>current?.map(x=>x.player_id===row.player_id?{...x,checked:next}:x)??[]);}
 return <Screen title="Daily Check-ups"><Card><Text style={textStyles.heading}>Date</Text><Input value={date} onChangeText={setDate} placeholder="YYYY-MM-DD"/><Text style={textStyles.muted}>VIP players appear every day. Other players appear only on their scheduled days.</Text></Card>{!rows?<ActivityIndicator/>:rows.length===0?<Text style={textStyles.muted}>No players scheduled for this day.</Text>:rows.map(row=><Card key={row.player_id}><View style={styles.title}><Text style={textStyles.heading}>{row.profiles?.name||row.profiles?.email}</Text>{row.is_vip?<Text style={styles.vip}>VIP</Text>:null}</View><Text style={textStyles.muted}>{row.profiles?.email}</Text><Button secondary={!row.checked} disabled={busy===row.player_id} onPress={()=>toggle(row)}>{row.checked?'CHECKED ✓':'MARK CHECKED'}</Button></Card>)}</Screen>
}
const styles=StyleSheet.create({title:{flexDirection:'row',alignItems:'center',gap:8},vip:{color:'#ffb020',fontWeight:'900',fontSize:12,backgroundColor:'#4b2b00',paddingHorizontal:8,paddingVertical:3,borderRadius:99}});
