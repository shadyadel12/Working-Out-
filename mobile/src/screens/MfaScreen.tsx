import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text } from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { supabase } from '../lib/supabase';
import { Button, Input } from '../components/Controls';
import { Card, Screen, textStyles } from '../components/Screen';
import { colors } from '../theme';

export default function MfaScreen(){const{refresh,signOut}=useAuth();const[factorId,setFactorId]=useState('');const[secret,setSecret]=useState('');const[code,setCode]=useState('');const[loading,setLoading]=useState(true);
  useEffect(()=>{async function prepare(){const{data:factors,error}=await supabase.auth.mfa.listFactors();if(error){Alert.alert('Verification error',error.message);return;}const verified=factors.totp.find(f=>f.status==='verified');if(verified){setFactorId(verified.id);setLoading(false);return;}for(const factor of factors.all.filter(f=>f.factor_type==='totp'&&f.status==='unverified'))await supabase.auth.mfa.unenroll({factorId:factor.id});const{data,error:enrollError}=await supabase.auth.mfa.enroll({factorType:'totp',friendlyName:'Trainova mobile admin'});if(enrollError){Alert.alert('Verification error',enrollError.message);return;}setFactorId(data.id);setSecret(data.totp.secret);setLoading(false);}void prepare();},[]);
  async function verify(){setLoading(true);const{error}=await supabase.auth.mfa.challengeAndVerify({factorId,code});if(error){Alert.alert('Invalid code',error.message);setLoading(false);return;}await refresh();}
  return <Screen title="Trainova Admin Verification"><Card>{loading?<ActivityIndicator color={colors.accent}/>:<><Text style={textStyles.body}>{secret?'Add this Trainova key to your authenticator app, then enter its six-digit code.':'Enter the six-digit code from your authenticator app.'}</Text>{secret?<Text selectable style={styles.secret}>{secret}</Text>:null}<Input value={code} onChangeText={v=>setCode(v.replace(/\D/g,'').slice(0,6))} placeholder="Six-digit code" keyboardType="number-pad"/><Button onPress={verify} disabled={code.length!==6}>VERIFY</Button><Button secondary onPress={signOut}>SIGN OUT</Button></>}</Card></Screen>;
}
const styles=StyleSheet.create({secret:{color:colors.accent,fontWeight:'900'}});
