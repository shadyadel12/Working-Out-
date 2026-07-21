import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, type TextInputProps } from 'react-native';
import { ArrowLeft, ArrowRight, Check, CircleArrowRight, CloudUpload, Copy, Download, Dumbbell, KeyRound, LibraryBig, LogOut, Pencil, Plus, RefreshCw, Save, Send, Share2, Trash2, Utensils, type LucideIcon } from 'lucide-react-native';
import { colors, radius } from '../theme';

function buttonLabel(children: ReactNode) {
  return typeof children === 'string' || typeof children === 'number' ? String(children) : 'Action';
}
function iconFor(label: string): LucideIcon {
  const value = label.toLowerCase();
  if (value.includes('sign out')) return LogOut;
  if (value.includes('delete') || value.includes('remove') || value.includes('revoke')) return Trash2;
  if (value.includes('send') || value.includes('message')) return Send;
  if (value.includes('save')) return Save;
  if (value.includes('done') || value.includes('assign') || value.includes('complete') || value.includes('activate')) return Check;
  if (value.includes('add') || value.includes('create') || value.includes('generate')) return Plus;
  if (value.includes('edit')) return Pencil;
  if (value.includes('copy') || value.includes('duplicate')) return Copy;
  if (value.includes('share') || value.includes('export')) return Share2;
  if (value.includes('download')) return Download;
  if (value.includes('upload') || value.includes('import')) return CloudUpload;
  if (value.includes('back') || value.includes('previous') || value.includes('cancel')) return ArrowLeft;
  if (value.includes('next')) return ArrowRight;
  if (value.includes('renew') || value.includes('restore') || value.includes('refresh')) return RefreshCw;
  if (value.includes('key')) return KeyRound;
  if (value.includes('library')) return LibraryBig;
  if (value.includes('workout') || value.includes('exercise')) return Dumbbell;
  if (value.includes('diet') || value.includes('meal')) return Utensils;
  return CircleArrowRight;
}
export function Button({children,onPress,disabled=false,secondary=false,danger=false}:PropsWithChildren<{onPress:()=>void;disabled?:boolean;secondary?:boolean;danger?:boolean}>){const label=buttonLabel(children);const Icon=iconFor(label);return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{disabled}} hitSlop={4} onPress={onPress} disabled={disabled} style={({pressed})=>[styles.button,secondary&&styles.secondary,danger&&styles.danger,disabled&&styles.disabled,pressed&&!disabled&&styles.pressed]}><Icon size={19} strokeWidth={2} color={colors.text}/><Text numberOfLines={1} style={styles.buttonText}>{children}</Text></Pressable>}
export function Input(props:TextInputProps){return <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input,props.multiline&&{minHeight:80,textAlignVertical:'top'},props.style]}/>}
const styles=StyleSheet.create({button:{minHeight:48,flexDirection:'row',gap:8,justifyContent:'center',paddingHorizontal:16,backgroundColor:colors.accent,borderRadius:radius.md,alignItems:'center',alignSelf:'flex-start'},buttonText:{color:colors.text,fontSize:13,fontWeight:'800',letterSpacing:.35},secondary:{backgroundColor:colors.surfaceSoft,borderWidth:1,borderColor:colors.border},danger:{backgroundColor:colors.danger},disabled:{opacity:.4},pressed:{transform:[{scale:.98}],opacity:.82},input:{minHeight:48,backgroundColor:colors.surfaceSoft,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:12,color:colors.text,fontSize:15}});
