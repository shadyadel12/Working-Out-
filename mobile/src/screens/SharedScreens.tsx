import { Pressable, StyleSheet, Text } from 'react-native';
import { Card, Screen, textStyles } from '../components/Screen';
import { useAuth } from '../auth/AuthProvider';
import { colors } from '../theme';

export function ProgressScreen(){return <Screen title="Progress"><Card><Text style={textStyles.heading}>Workout and diet progress</Text><Text style={textStyles.muted}>Detailed mobile charts and filters are the next mobile milestone.</Text></Card></Screen>}
export function ChatScreen(){return <Screen title="Chat"><Card><Text style={textStyles.heading}>Private coach chat</Text><Text style={textStyles.muted}>Text and media conversation support will use the same private conversation as the website.</Text></Card></Screen>}
export function AdminScreen(){return <Screen title="Administration"><Card><Text style={textStyles.heading}>Users & Keys</Text><Text style={textStyles.muted}>Administrator mobile management and verification are the next mobile milestone.</Text></Card></Screen>}
export function AccountScreen(){const{profile,signOut}=useAuth();return <Screen title="Account"><Card><Text style={textStyles.heading}>{profile?.name||profile?.email}</Text><Text style={textStyles.muted}>{profile?.role}</Text><Pressable style={styles.button} onPress={signOut}><Text style={styles.text}>SIGN OUT</Text></Pressable></Card></Screen>}
const styles=StyleSheet.create({button:{backgroundColor:colors.accent,padding:13,borderRadius:10,alignItems:'center',marginTop:8},text:{color:'#fff',fontWeight:'800'}});
