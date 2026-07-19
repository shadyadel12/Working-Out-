import type { PropsWithChildren } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../theme";
import { localizeTree, tr, useLanguage } from "../i18n/MobileLanguage";

export function Screen({
  title,
  children,
  subtitle,
  refreshing = false,
  onRefresh,
}: {
  title: string;
  subtitle?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
} & PropsWithChildren) {
  const { language } = useLanguage();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.body, language === "ar" && styles.rtl]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          ) : undefined
        }
      >
        <View style={styles.header}>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.62}
            numberOfLines={2}
            style={[styles.title, language === "ar" && styles.right]}
          >
            {tr(title, language)}
          </Text>
          {subtitle ? <Text style={[styles.subtitle, language === "ar" && styles.right]}>{tr(subtitle, language)}</Text> : null}
        </View>
        {localizeTree(children, language)}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}
export const textStyles = StyleSheet.create({
  body: { color: colors.text, fontSize: 15, lineHeight: 21 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  heading: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 23,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
const styles = StyleSheet.create({
  rtl: { direction: "rtl" },
  right: { textAlign: "right" },
  safe: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  header: { gap: spacing.xs, marginBottom: spacing.sm },
  title: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
});
