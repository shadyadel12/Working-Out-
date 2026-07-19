import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../auth/AuthProvider";
import LoginScreen from "../screens/LoginScreen";
import ProgramScreen from "../screens/player/ProgramScreen";
import DietScreen from "../screens/player/DietScreen";
import PlayersScreen from "../screens/coach/PlayersScreen";
import {
  AccountScreen,
  AdminScreen,
  ChatScreen,
  ProgressScreen,
} from "../screens/SharedScreens";
import { colors } from "../theme";
import MfaScreen from "../screens/MfaScreen";
import CoachSettingsScreen from "../screens/coach/CoachSettingsScreen";
import AdminSupportScreen from "../screens/admin/AdminSupportScreen";
import CoachPlanScreen from "../screens/coach/CoachPlanScreen";
import RenewSubscriptionScreen from "../screens/RenewSubscriptionScreen";
import { supabase } from "../lib/supabase";
import CoachSupportScreen from "../screens/coach/CoachSupportScreen";
import CoachCheckupsScreen from "../screens/coach/CoachCheckupsScreen";
import CoachMoreScreen from "../screens/coach/CoachMoreActiveScreen";
import CoachDashboardScreen from "../screens/coach/CoachDashboardScreen";
import PlayerHomeScreen from "../screens/player/PlayerHomeScreen";
import AdminOverviewScreen from "../screens/admin/AdminOverviewScreen";
import PlayerProgressScreen from "../screens/player/PlayerProgressScreen";
import AdminManagementScreen from "../screens/admin/AdminManagementScreen";
import { tr, useLanguage } from "../i18n/MobileLanguage";
import MobileLoading from "../components/MobileLoading";

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
  const { language } = useLanguage();
  const { teamMembership } = useAuth();
  const role = teamMembership?.role;
  return (
    <Tabs.Navigator screenOptions={tabOptions}>
      {!role || role === "head_coach" ? (
        <Tabs.Screen
          name="Home"
          component={CoachDashboardScreen}
          options={{ tabBarLabel: tr("Home", language), tabBarIcon: tabIcon("home-outline") }}
        />
      ) : null}
      <Tabs.Screen
        name="Analysis"
        component={PlayersScreen}
        options={{ tabBarLabel: tr("Analysis", language), tabBarIcon: tabIcon("analytics-outline") }}
      />
      {!role || role === "head_coach" ? (
        <Tabs.Screen
          name="Plans"
          component={CoachPlanScreen}
          options={{ tabBarLabel: tr("Plans", language), tabBarIcon: tabIcon("clipboard-outline") }}
        />
      ) : null}
      {!role || role === "head_coach" || role === "chat" ? (
        <Tabs.Screen
          name="Messages"
          component={ChatScreen}
          options={{ tabBarLabel: tr("Messages", language), tabBarIcon: tabIcon("chatbubbles-outline") }}
        />
      ) : null}
      {!role || role === "sales" ? (
        <Tabs.Screen
          name="More"
          component={CoachMoreScreen}
          options={{ tabBarLabel: tr("More", language), tabBarIcon: tabIcon("grid-outline") }}
        />
      ) : null}
      {role ? (
        <Tabs.Screen
          name="Account"
          component={AccountScreen}
          options={{ tabBarLabel: tr("Account", language), tabBarIcon: tabIcon("person-outline") }}
        />
      ) : null}
    </Tabs.Navigator>
  );
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
  if (loading)
    return <MobileLoading variant="launch" />;
  return (
    <NavigationContainer
      theme={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.background,
          card: colors.surface,
          border: colors.border,
          primary: colors.accent,
          text: colors.text,
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
