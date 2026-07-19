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
  const palette = backgrounds[Math.abs([...title].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % backgrounds.length];
  return (
    <SafeAreaView style={styles.safe}>
      <View pointerEvents="none" style={styles.backdrop}>
        <View style={[styles.orb, styles.orbTop, { backgroundColor: palette[0] }]} />
        <View style={[styles.orb, styles.orbBottom, { backgroundColor: palette[1] }]} />
        <View style={styles.gridLine} />
      </View>
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
  safe: { flex: 1, backgroundColor: colors.background, overflow: "hidden" },
  backdrop: { ...StyleSheet.absoluteFillObject },
  orb: { position: "absolute", width: 260, height: 260, borderRadius: 130, opacity: 0.2 },
  orbTop: { top: -110, right: -90 },
  orbBottom: { bottom: 40, left: -150 },
  gridLine: { position: "absolute", top: 150, left: 20, right: 20, height: 1, backgroundColor: "rgba(255,255,255,.05)" },
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

const backgrounds = [
  ["#ff4f8f", "#6d3cff"],
  ["#ff6542", "#ffb52e"],
  ["#23c4a8", "#246bfe"],
  ["#8b5cf6", "#ec4899"],
  ["#3b82f6", "#22d3ee"],
  ["#ef4444", "#f97316"],
];
