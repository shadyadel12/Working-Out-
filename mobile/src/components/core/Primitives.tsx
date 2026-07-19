import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useMobileTheme } from '../../theme/MobileTheme';

export function AppText({ children, variant = 'body', color, style, numberOfLines }: PropsWithChildren<{ variant?: 'screenTitle' | 'navigationTitle' | 'rowTitle' | 'body' | 'metadata'; color?: string; style?: StyleProp<TextStyle>; numberOfLines?: number }>) {
  const theme = useMobileTheme();
  return <Text allowFontScaling numberOfLines={numberOfLines} style={[theme.typography[variant], { color: color ?? theme.colors.ink950 }, style]}>{children}</Text>;
}

export function Surface({ children, style, accessibilityLabel }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; accessibilityLabel?: string }>) {
  const { colors, radii, spacing } = useMobileTheme();
  return <View accessibilityLabel={accessibilityLabel} style={[{ padding: spacing.lg, gap: spacing.sm, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, backgroundColor: colors.surface }, style]}>{children}</View>;
}

export function IconAction({ icon: Icon, label, onPress, disabled, selected }: { icon: LucideIcon; label: string; onPress: NonNullable<PressableProps['onPress']>; disabled?: boolean; selected?: boolean }) {
  const { colors, radii, sizes } = useMobileTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled, selected }} disabled={disabled} onPress={onPress} style={({ pressed }) => [{ minWidth: sizes.minimumTarget, minHeight: sizes.minimumTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: selected ? colors.brand50 : 'transparent', opacity: disabled ? .45 : pressed ? .72 : 1, transform: [{ scale: pressed ? .98 : 1 }] }]}><Icon size={20} strokeWidth={1.875} color={selected ? colors.brand600 : colors.ink700} /></Pressable>;
}

export function StatePanel({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) {
  const { colors, spacing } = useMobileTheme();
  return <Surface style={{ alignItems: 'center', paddingVertical: spacing.xxxl }}><Icon accessibilityElementsHidden importantForAccessibility="no-hide-descendants" size={28} strokeWidth={1.75} color={colors.brand500} /><AppText variant="navigationTitle" style={{ textAlign: 'center' }}>{title}</AppText><AppText color={colors.ink500} style={{ textAlign: 'center' }}>{description}</AppText>{action}</Surface>;
}
