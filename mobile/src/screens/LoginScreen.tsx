import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { colors } from '../theme';

export default function LoginScreen() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function signIn() { setBusy(true); setError(''); const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); if (authError) setError('Invalid email or password.'); setBusy(false); }
  return <SafeAreaView style={styles.page}><View style={styles.card}><Text style={styles.brand}>COACH PLATFORM</Text><Text style={styles.title}>Sign in</Text><TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.muted} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} /><TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.muted} secureTextEntry value={password} onChangeText={setPassword} />{error ? <Text style={styles.error}>{error}</Text> : null}<Pressable style={styles.button} disabled={busy || !email || !password} onPress={signIn}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>SIGN IN</Text>}</Pressable></View></SafeAreaView>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:colors.background,justifyContent:'center',padding:22},card:{backgroundColor:colors.surface,borderColor:colors.border,borderWidth:1,borderRadius:18,padding:22,gap:14},brand:{color:colors.accent,fontWeight:'900'},title:{color:colors.text,fontSize:30,fontWeight:'800'},input:{backgroundColor:colors.background,borderColor:colors.border,borderWidth:1,borderRadius:10,padding:14,color:colors.text,fontSize:16},button:{backgroundColor:colors.accent,borderRadius:10,padding:15,alignItems:'center'},buttonText:{color:'#fff',fontWeight:'800'},error:{color:colors.danger}});
