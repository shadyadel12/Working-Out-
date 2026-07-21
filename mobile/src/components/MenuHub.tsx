import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMobileTheme } from '../theme/MobileTheme';
import { AppText, Surface } from './core/Primitives';

export type MenuHubItem = {
  title: string;
  description: string;
  icon: LucideIcon;
  screen: string;
};

export type MenuHubProps = {
  title: string;
  subtitle: string;
  items: MenuHubItem[];
};

export default function MenuHub({ title, subtitle, items }: MenuHubProps) {
  const theme = useMobileTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: theme.colors.surfaceSubtle }]}>
      <View style={[styles.hub, { paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.xl }]}>
        <AppText variant="screenTitle">{title}</AppText>
        <AppText color={theme.colors.ink500}>{subtitle}</AppText>
        <View style={{ gap: theme.spacing.md }}>
          {items.map(({ title: itemTitle, description, icon: Icon, screen }) => (
            <Pressable
              key={screen}
              accessibilityRole="button"
              accessibilityLabel={`${itemTitle}. ${description}`}
              onPress={() => navigation.navigate(screen)}
              style={({ pressed }) => ({ opacity: pressed ? .72 : 1, transform: [{ scale: pressed ? .98 : 1 }] })}
            >
              <Surface style={styles.row}>
                <View style={[styles.icon, { backgroundColor: theme.colors.brand50 }]}>
                  <Icon size={20} strokeWidth={1.875} color={theme.colors.brand600} />
                </View>
                <View style={styles.grow}>
                  <AppText variant="rowTitle">{itemTitle}</AppText>
                  <AppText variant="metadata" color={theme.colors.ink500}>{description}</AppText>
                </View>
                <AppText color={theme.colors.ink500}>›</AppText>
              </Surface>
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  hub: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 16 },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center' },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  grow: { flex: 1, minWidth: 0 },
});
