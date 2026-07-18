import type { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function Screen({ title, children }: PropsWithChildren<{ title: string }>) {
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.body}><Text style={styles.title}>{title}</Text>{children}</ScrollView></SafeAreaView>;
}
export function Card({ children }: PropsWithChildren) { return <View style={styles.card}>{children}</View>; }
export const textStyles = StyleSheet.create({ body: { color: colors.text, fontSize: 16 }, muted: { color: colors.muted, fontSize: 14 }, heading: { color: colors.text, fontSize: 18, fontWeight: '700' } });
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, body: { padding: 18, gap: 12 }, title: { color: colors.text, fontSize: 28, fontWeight: '800', marginBottom: 8 }, card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 16, gap: 8 } });
