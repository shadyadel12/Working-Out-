import { useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { Card, Screen, textStyles } from '../../components/Screen';
import { useAuth } from '../../auth/AuthProvider';
import { supabase } from '../../lib/supabase';
export default function PlayersScreen(){const{session}=useAuth();const[links,setLinks]=useState<any[]|null>(null);useEffect(()=>{supabase.from('coach_player_links').select('*,profiles!coach_player_links_player_id_fkey(name,email)').eq('coach_id',session!.user.id).order('created_at',{ascending:false}).then(({data})=>setLinks(data??[]));},[session]);return <Screen title="My Players">{!links?<ActivityIndicator/>:links.map(link=><Card key={link.id}><Text style={textStyles.heading}>{link.profiles?.name||link.profiles?.email||'Unclaimed key'}</Text><Text style={textStyles.muted}>{link.status} · ends {link.subscription_end_date}</Text></Card>)}</Screen>}
