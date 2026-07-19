import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer, DarkTheme, DefaultTheme, type InitialState } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../auth/AuthProvider";
import LoginScreen from "../screens/LoginScreen";
import ProgramScreen from "../screens/player/ProgramScreen";
import DietScreen from "../screens/player/DietScreen";
import {
  AccountScreen,
  AdminScreen,
  ChatScreen,
  ProgressScreen,
} from "../screens/SharedScreens";
import { colors } from "../theme";
import MfaScreen from "../screens/MfaScreen";
import AdminSupportScreen from "../screens/admin/AdminSupportScreen";
import RenewSubscriptionScreen from "../screens/RenewSubscriptionScreen";
import { supabase } from "../lib/supabase";
import PlayerHomeScreen from "../screens/player/PlayerHomeScreen";
import AdminOverviewScreen from "../screens/admin/AdminOverviewScreen";
import PlayerProgressScreen from "../screens/player/PlayerProgressScreen";
import AdminManagementScreen from "../screens/admin/AdminManagementScreen";
import { tr, useLanguage } from "../i18n/MobileLanguage";
import MobileLoading from "../components/MobileLoading";
import CoachTabShell from "./CoachTabShell";
import { useMobileTheme } from "../theme/MobileTheme";

const Tabs = createBottomTabNavigator();
const tabOptions = {
  headerShown: false,
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: 70,
    paddingTop: 6,
    paddingBottom: 10,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 22,
    position: "absolute" as const,
    borderTopWidth: 0,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 12,
  },
  tabBarActiveTintColor: colors.accent,
  tabBarInactiveTintColor: colors.muted,
  tabBarLabelStyle: { fontSize: 11, fontWeight: "700" as const },
};
const tabIcon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: string; size: number }) => <Ionicons name={name} color={color} size={size} />;
function PlayerTabs() {
  const { language } = useLanguage();
  const { session } = useAuth();
  const [active, setActive] = useState<boolean | null>(null);
  async function check() {
    const { data } = await supabase
      .from("coach_player_links")
      .select("status,subscription_end_date")
      .eq("player_id", session!.user.id)
      .order("subscription_end_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    setActive(
      !!data &&
        data.status === "active" &&
        data.subscription_end_date >= new Date().toISOString().slice(0, 10),
    );
  }
  useEffect(() => {
    void check();
  }, [session]);
  if (active === null)
    return <MobileLoading variant="player" />;
  if (!active) return <RenewSubscriptionScreen onRenewed={check} />;
  return (
    <Tabs.Navigator screenOptions={tabOptions}>
      <Tabs.Screen
        name="Home"
        component={PlayerHomeScreen}
        options={{ tabBarLabel: tr("Home", language), tabBarIcon: tabIcon("home-outline") }}
      />
      <Tabs.Screen
        name="Program"
        component={ProgramScreen}
        options={{ tabBarLabel: tr("Program", language), tabBarIcon: tabIcon("barbell-outline") }}
      />
      <Tabs.Screen
        name="Diet"
        component={DietScreen}
        options={{ tabBarLabel: tr("Diet", language), tabBarIcon: tabIcon("nutrition-outline") }}
      />
      <Tabs.Screen
        name="Progress"
        component={PlayerProgressScreen}
        options={{ tabBarLabel: tr("Progress", language), tabBarIcon: tabIcon("stats-chart-outline") }}
      />
      <Tabs.Screen
        name="Coach"
        component={ChatScreen}
        options={{ tabBarLabel: tr("Coach", language), tabBarIcon: tabIcon("chatbubble-outline") }}
      />
    </Tabs.Navigator>
  );
}
function CoachTabs() {
  return <CoachTabShell />;
}
function AdminTabs() {
  const { language } = useLanguage();
  return (
    <Tabs.Navigator screenOptions={tabOptions}>
      <Tabs.Screen
        name="Overview"
        component={AdminOverviewScreen}
        options={{ tabBarLabel: tr("Overview", language), tabBarIcon: tabIcon("speedometer-outline") }}
      />
      <Tabs.Screen
        name="Users & Keys"
        component={AdminManagementScreen}
        options={{ tabBarLabel: tr("Users & Keys", language), tabBarIcon: tabIcon("key-outline") }}
      />
      <Tabs.Screen
        name="Support"
        component={AdminSupportScreen}
        options={{ tabBarLabel: tr("Support", language), tabBarIcon: tabIcon("help-buoy-outline") }}
      />
      <Tabs.Screen
        name="Account"
        component={AccountScreen}
        options={{ tabBarLabel: tr("Account", language), tabBarIcon: tabIcon("person-outline") }}
      />
    </Tabs.Navigator>
  );
}
export default function RootNavigator() {
  const { session, profile, loading, aal2 } = useAuth();
  const mobileTheme = useMobileTheme();
  const [initialState, setInitialState] = useState<InitialState | undefined>();
  const [navigationReady, setNavigationReady] = useState(false);
  const persistenceKey = `navigation-state-v2-${profile?.role ?? "guest"}`;
  useEffect(() => {
    let active = true;
    setNavigationReady(false);
    AsyncStorage.getItem(persistenceKey).then((stored) => {
      if (!active) return;
      try { setInitialState(stored ? JSON.parse(stored) as InitialState : undefined); }
      catch { setInitialState(undefined); }
      setNavigationReady(true);
    });
    return () => { active = false; };
  }, [persistenceKey]);
  if (loading)
    return <MobileLoading variant="launch" />;
  if (!navigationReady) return <MobileLoading variant="launch" />;
  return (
    <NavigationContainer
      key={persistenceKey}
      initialState={initialState}
      onStateChange={(state) => { void AsyncStorage.setItem(persistenceKey, JSON.stringify(state)); }}
      theme={{
        ...(mobileTheme.dark ? DarkTheme : DefaultTheme),
        colors: {
          ...(mobileTheme.dark ? DarkTheme.colors : DefaultTheme.colors),
          background: mobileTheme.colors.surfaceSubtle,
          card: mobileTheme.colors.surface,
          border: mobileTheme.colors.line,
          primary: mobileTheme.colors.brand500,
          text: mobileTheme.colors.ink950,
        },
      }}
    >
      {!session || !profile ? (
        <LoginScreen />
      ) : profile.role === "player" ? (
        <PlayerTabs />
      ) : profile.role === "coach" ? (
        <CoachTabs />
      ) : aal2 ? (
        <AdminTabs />
      ) : (
        <MfaScreen />
      )}
    </NavigationContainer>
  );
}
