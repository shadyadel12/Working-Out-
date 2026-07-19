import { Check, Moon, Sun } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Surface } from '../../components/core/Primitives';
import { type ThemeMode, useMobileTheme } from '../../theme/MobileTheme';

export default function AppearanceSettingsScreen() {
  const theme = useMobileTheme();
  const choices: Array<{ mode: ThemeMode; title: string; description: string; icon: typeof Sun }> = [
    { mode: 'light', title: 'Light mode', description: 'Use the website white and teal theme.', icon: Sun },
    { mode: 'dark', title: 'Dark mode', description: 'Use the website charcoal and orange theme.', icon: Moon },
  ];
  return <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.safe, { backgroundColor: theme.colors.surfaceSubtle }]}><View style={[styles.content, { padding: theme.spacing.xl }]}><AppText color={theme.colors.ink500}>Choose one theme for every page. The app refreshes once to apply it everywhere.</AppText>{choices.map(({ mode, title, description, icon: Icon }) => { const selected = theme.mode === mode; return <Pressable key={mode} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`${title}. ${description}`} onPress={() => void theme.setMode(mode)} style={({ pressed }) => ({ opacity: pressed ? .72 : 1 })}><Surface style={[styles.row, selected && { borderColor: theme.colors.brand500 }]}><View style={[styles.icon, { backgroundColor: theme.colors.brand50 }]}><Icon color={theme.colors.brand600} size={21} /></View><View style={styles.copy}><AppText variant="rowTitle">{title}</AppText><AppText variant="metadata" color={theme.colors.ink500}>{description}</AppText></View>{selected ? <Check accessibilityLabel="Selected" color={theme.colors.brand500} size={21} /> : null}</Surface></Pressable>; })}</View></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 12 }, row: { minHeight: 76, flexDirection: 'row', alignItems: 'center' }, icon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }, copy: { flex: 1, minWidth: 0 } });
