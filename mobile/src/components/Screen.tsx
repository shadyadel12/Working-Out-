import type { PropsWithChildren } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';

export function Screen({title,children,subtitle,refreshing=false,onRefresh}:{title:string;subtitle?:string;refreshing?:boolean;onRefresh?:()=>void}&PropsWithChildren) {
  return <SafeAreaView style={styles.safe}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body} refreshControl={onRefresh?<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent}/>:undefined}><View style={styles.header}><Text style={styles.title}>{title}</Text>{subtitle?<Text style={styles.subtitle}>{subtitle}</Text>:null}</View>{children}</ScrollView></SafeAreaView>;
}
export function Card({ children }: PropsWithChildren) { return <View style={styles.card}>{children}</View>; }
export const textStyles=StyleSheet.create({body:{color:colors.text,fontSize:15,lineHeight:21},muted:{color:colors.muted,fontSize:13,lineHeight:19},heading:{color:colors.text,fontSize:17,fontWeight:'800',lineHeight:23},eyebrow:{color:colors.accent,fontSize:11,fontWeight:'900',letterSpacing:1.2,textTransform:'uppercase'}});
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background},body:{padding:spacing.lg,paddingBottom:spacing.xxl,gap:spacing.md},header:{gap:spacing.xs,marginBottom:spacing.sm},title:{color:colors.text,fontSize:28,lineHeight:34,fontWeight:'900',letterSpacing:-.5},subtitle:{color:colors.muted,fontSize:14,lineHeight:20},card:{backgroundColor:colors.surface,borderColor:colors.border,borderWidth:1,borderRadius:radius.lg,padding:spacing.lg,gap:spacing.sm,shadowColor:'#000',shadowOpacity:.2,shadowRadius:12,shadowOffset:{width:0,height:6},elevation:3}});
