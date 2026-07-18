import { useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { Card, Screen, textStyles } from '../../components/Screen';
import { useAuth } from '../../auth/AuthProvider';
import { supabase } from '../../lib/supabase';

export default function ProgramScreen(){const{session}=useAuth();const[days,setDays]=useState<any[]|null>(null);useEffect(()=>{supabase.from('program_days').select('*').eq('player_id',session!.user.id).order('week_number').order('day_of_week').then(({data})=>setDays(data??[]));},[session]);return <Screen title="My Program">{!days?<ActivityIndicator/>:days.length===0?<Text style={textStyles.muted}>No program assigned yet.</Text>:days.slice(0,14).map(day=><Card key={day.id}><Text style={textStyles.heading}>Week {day.week_number} · Day {day.day_of_week+1}</Text><Text style={textStyles.muted}>{day.day_type==='rest'?'Rest day':day.title||'Training day'}</Text></Card>)}</Screen>}
