import { useState } from 'react';
import { Alert, Text } from 'react-native';
import { Card, Screen, textStyles } from '../components/Screen';
import { Button, Input } from '../components/Controls';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthProvider';
export default function RenewSubscriptionScreen({onRenewed}:{onRenewed:()=>void}){const{signOut}=useAuth();const[key,setKey]=useState('');const[busy,setBusy]=useState(false);async function renew(){setBusy(true);const{error}=await supabase.rpc('claim_subscription_key',{p_key:key.trim()});setBusy(false);if(error)Alert.alert('Could not renew',error.message);else onRenewed();}return <Screen title="Subscription Required"><Card><Text style={textStyles.body}>Enter a new subscription key from your coach to continue.</Text><Input value={key} onChangeText={setKey} autoCapitalize="characters" placeholder="Subscription key"/><Button onPress={renew} disabled={!key.trim()||busy}>{busy?'CHECKING…':'ACTIVATE'}</Button><Button secondary onPress={signOut}>SIGN OUT</Button></Card></Screen>}
