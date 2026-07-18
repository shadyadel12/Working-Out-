import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps } from 'react-native';
import { colors } from '../theme';
export function Button({ children, onPress, disabled=false, secondary=false }: PropsWithChildren<{onPress:()=>void;disabled?:boolean;secondary?:boolean}>){return <Pressable onPress={onPress} disabled={disabled} style={[styles.button,secondary&&styles.secondary,disabled&&styles.disabled]}><Text style={styles.buttonText}>{children}</Text></Pressable>}
export function Input(props:TextInputProps){return <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input,props.multiline&&{minHeight:80,textAlignVertical:'top'},props.style]}/>}
const styles=StyleSheet.create({button:{backgroundColor:colors.accent,paddingVertical:12,paddingHorizontal:16,borderRadius:10,alignItems:'center'},secondary:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},disabled:{opacity:.45},buttonText:{color:colors.text,fontWeight:'800'},input:{backgroundColor:colors.background,borderWidth:1,borderColor:colors.border,borderRadius:10,padding:12,color:colors.text,fontSize:15}});
