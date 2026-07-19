import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

function buttonLabel(children: ReactNode) {
  return typeof children === 'string' || typeof children === 'number' ? String(children) : 'Action';
}
function iconFor(label: string): keyof typeof Ionicons.glyphMap {
  const value = label.toLowerCase();
  if (value.includes('sign out')) return 'log-out-outline';
  if (value.includes('delete') || value.includes('remove') || value.includes('revoke')) return 'trash-outline';
  if (value.includes('send') || value.includes('message')) return 'send-outline';
  if (value.includes('save') || value.includes('done') || value.includes('assign')) return 'checkmark-outline';
  if (value.includes('add') || value.includes('create') || value.includes('generate')) return 'add-outline';
  if (value.includes('edit')) return 'pencil-outline';
  if (value.includes('copy') || value.includes('duplicate')) return 'copy-outline';
  if (value.includes('share') || value.includes('export')) return 'share-outline';
  if (value.includes('download')) return 'download-outline';
  if (value.includes('upload') || value.includes('import')) return 'cloud-upload-outline';
  if (value.includes('back') || value.includes('previous') || value.includes('cancel')) return 'arrow-back-outline';
  if (value.includes('next')) return 'arrow-forward-outline';
  if (value.includes('renew') || value.includes('restore') || value.includes('refresh')) return 'refresh-outline';
  if (value.includes('key')) return 'key-outline';
  if (value.includes('library')) return 'library-outline';
  if (value.includes('workout') || value.includes('exercise')) return 'barbell-outline';
  if (value.includes('diet') || value.includes('meal')) return 'nutrition-outline';
  return 'arrow-forward-circle-outline';
}
export function Button({children,onPress,disabled=false,secondary=false,danger=false}:PropsWithChildren<{onPress:()=>void;disabled?:boolean;secondary?:boolean;danger?:boolean}>){const label=buttonLabel(children);return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} hitSlop={4} onPress={onPress} disabled={disabled} style={({pressed})=>[styles.button,secondary&&styles.secondary,danger&&styles.danger,disabled&&styles.disabled,pressed&&!disabled&&styles.pressed]}><Ionicons name={iconFor(label)} size={23} color={colors.text}/></Pressable>}
export function Input(props:TextInputProps){return <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input,props.multiline&&{minHeight:80,textAlignVertical:'top'},props.style]}/>}
const styles=StyleSheet.create({button:{width:48,minHeight:48,justifyContent:'center',backgroundColor:colors.accent,borderRadius:radius.md,alignItems:'center',alignSelf:'flex-start'},secondary:{backgroundColor:colors.surfaceSoft,borderWidth:1,borderColor:colors.border},danger:{backgroundColor:colors.danger},disabled:{opacity:.4},pressed:{transform:[{scale:.96}],opacity:.82},input:{minHeight:48,backgroundColor:colors.surfaceSoft,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:12,color:colors.text,fontSize:15}});
