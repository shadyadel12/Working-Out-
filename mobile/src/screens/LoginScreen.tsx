import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { colors } from "../theme";
import TermsScreen from "./legal/TermsScreen";
import UpdatesScreen from "./legal/UpdatesScreen";
import { localizeTree, tr, useLanguage } from "../i18n/MobileLanguage";

export default function LoginScreen() {
  const { language } = useLanguage();
  const [mode, setMode] = useState<"login" | "player" | "coach">("login");
  const [team, setTeam] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [publicPage, setPublicPage] = useState<"terms" | "updates" | null>(
    null,
  );
  async function submit() {
    setBusy(true);
    setError("");
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      } else {
        if (!name.trim() || !key.trim())
          throw new Error("Name and access key are required.");
        if (
          password.length < 10 ||
          !/[a-z]/.test(password) ||
          !/[A-Z]/.test(password) ||
          !/[0-9]/.test(password) ||
          !/[!@#$%^&*]/.test(password)
        )
          throw new Error(
            "Password needs 10 characters with upper/lowercase, a number, and a symbol.",
          );
        const check =
          mode === "coach"
            ? team
              ? await (supabase.rpc as any)("check_team_invite", {
                  p_key: key.trim(),
                })
              : await supabase.rpc("check_coach_key", { p_key: key.trim() })
            : await supabase.rpc("check_subscription_key", {
                p_key: key.trim(),
              });
        if (check.error || check.data !== true)
          throw new Error("That access key is invalid or already used.");
        const { data, error: signError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim() } },
        });
        if (signError) throw signError;
        if (!data.session)
          throw new Error("Check your email, then return to sign in.");
        const claim =
          mode === "coach"
            ? team
              ? await (supabase.rpc as any)("claim_team_invite", {
                  p_key: key.trim(),
                })
              : await supabase.rpc("claim_coach_key", { p_key: key.trim() })
            : await supabase.rpc("claim_subscription_key", {
                p_key: key.trim(),
              });
        if (claim.error) throw claim.error;
        await supabase.auth.refreshSession();
      }
    } catch (e) {
      setError(
        tr(
          mode === "login"
            ? "Invalid email or password."
            : (e as Error).message,
          language,
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  if (publicPage === "terms")
    return <TermsScreen back={() => setPublicPage(null)} />;
  if (publicPage === "updates")
    return <UpdatesScreen back={() => setPublicPage(null)} />;
  return (
    <SafeAreaView style={styles.page}>
      <View style={[styles.card, language === "ar" && styles.rtl]}>
        {localizeTree(
          <>
            <Text style={styles.brand}>COACH PLATFORM</Text>
            <Text style={styles.title}>
              {mode === "login"
                ? "Sign in"
                : mode === "coach"
                  ? team
                    ? "Join coach team"
                    : "Coach signup"
                  : "Player signup"}
            </Text>
            {mode === "coach" ? (
              <View style={styles.authChoice}>
                <Pressable
                  style={[styles.modeButton, !team && styles.modeOn]}
                  onPress={() => setTeam(false)}
                >
                  <Text style={styles.buttonText}>OWNER</Text>
                </Pressable>
                <Pressable
                  style={[styles.modeButton, team && styles.modeOn]}
                  onPress={() => setTeam(true)}
                >
                  <Text style={styles.buttonText}>TEAM MEMBER</Text>
                </Pressable>
              </View>
            ) : null}
            {mode !== "login" ? (
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor={colors.muted}
                value={name}
                onChangeText={setName}
              />
            ) : null}
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {mode !== "login" ? (
              <TextInput
                style={styles.input}
                placeholder={
                  mode === "coach"
                    ? team
                      ? "Team invitation key"
                      : "Coach invitation key"
                    : "Subscription key"
                }
                placeholderTextColor={colors.muted}
                autoCapitalize="characters"
                value={key}
                onChangeText={setKey}
              />
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              style={styles.button}
              disabled={busy || !email || !password}
              onPress={submit}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
                </Text>
              )}
            </Pressable>
            <View style={styles.links}>
              {mode === "login" ? (
                <>
                  <Pressable onPress={() => setMode("player")}>
                    <Text style={styles.link}>Create player account</Text>
                  </Pressable>
                  <Pressable onPress={() => setMode("coach")}>
                    <Text style={styles.link}>
                      Create coach or team account
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Pressable onPress={() => setMode("login")}>
                  <Text style={styles.link}>Back to sign in</Text>
                </Pressable>
              )}
              <Pressable onPress={() => setPublicPage("updates")}>
                <Text style={styles.link}>Features & Updates</Text>
              </Pressable>
              <Pressable onPress={() => setPublicPage("terms")}>
                <Text style={styles.link}>Terms of Use</Text>
              </Pressable>
            </View>
          </>,
          language,
        )}
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
    gap: 14,
  },
  brand: { color: colors.accent, fontWeight: "900" },
  title: { color: colors.text, fontSize: 30, fontWeight: "800" },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    color: colors.text,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "800" },
  error: { color: colors.danger },
  links: { gap: 10, alignItems: "center" },
  link: { color: colors.muted, textDecorationLine: "underline" },
  authChoice: { flexDirection: "row", gap: 8 },
  rtl: { direction: "rtl" },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  modeOn: { backgroundColor: colors.accent },
});
