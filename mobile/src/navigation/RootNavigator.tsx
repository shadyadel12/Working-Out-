import { useEffect, useState } from "react";
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
  type InitialState,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../auth/AuthProvider";
import LoginScreen from "../screens/LoginScreen";
import ProgramScreen from "../screens/player/ProgramScreen";
import DietScreen from "../screens/player/DietScreen";
import AccountScreen from "../screens/admin/AccountScreen";
import ChatScreen from "../screens/shared/ChatScreen";
import { colors } from "../theme";
import MfaScreen from "../screens/MfaScreen";
import AdminSupportScreen from "../screens/admin/AdminSupportScreen";
import RenewSubscriptionScreen from "../screens/RenewSubscriptionScreen";
import { supabase } from "../lib/supabase";
import PlayerHomeScreen from "../screens/player/PlayerHomeScreen";
import AdminOverviewScreen from "../screens/admin/AdminOverviewScreen";
import PlayerProgressScreen from "../screens/player/PlayerProgressScreen";
import AssignmentsScreen from "../screens/player/AssignmentsScreen";
import AdminManagementScreen from "../screens/admin/AdminManagementScreen";
import AdminLibraryModerationScreen from "../screens/admin/AdminLibraryModerationScreen";
import { tr, useLanguage } from "../i18n/MobileLanguage";
import MobileLoading from "../components/MobileLoading";
import CoachTabShell from "./CoachTabShell";
import { useMobileTheme } from "../theme/MobileTheme";
import { Text, useWindowDimensions } from "react-native";
import {
  BarChart3,
  Dumbbell,
  Gauge,
  Home,
  KeyRound,
  ShieldCheck,
  LifeBuoy,
  MessageCircle,
  UserRound,
  Utensils,
  type LucideIcon,
} from "lucide-react-native";

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
const tabIcon =
  (Icon: LucideIcon) =>
  ({ color, size }: { color: string; size: number }) => (
    <Icon color={color} size={size} strokeWidth={1.9} />
  );
const tabLabel =
  (label: string) =>
  ({ color }: { focused: boolean; color: string }) => (
    <Text numberOfLines={1} style={{ color, fontSize: 11, fontWeight: "700" }}>
      {label}
    </Text>
  );
function useTabOptions() {
  const { width } = useWindowDimensions();
  return {
    ...tabOptions,
    tabBarLabelPosition:
      width >= 600 ? ("beside-icon" as const) : ("below-icon" as const),
  };
}
function PlayerTabs() {
  const { language } = useLanguage();
  const { session } = useAuth();
  const adaptiveTabOptions = useTabOptions();
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
  if (active === null) return <MobileLoading variant="player" />;
  if (!active) return <RenewSubscriptionScreen onRenewed={check} />;
  return (
    <Tabs.Navigator screenOptions={adaptiveTabOptions}>
      <Tabs.Screen
        name="Home"
        component={PlayerHomeScreen}
        options={{
          tabBarLabel: tabLabel(tr("Home", language)),
          tabBarIcon: tabIcon(Home),
        }}
      />
      <Tabs.Screen
        name="Program"
        component={ProgramScreen}
        options={{
          tabBarLabel: tabLabel(tr("Program", language)),
          tabBarIcon: tabIcon(Dumbbell),
        }}
      />
      <Tabs.Screen
        name="Diet"
        component={DietScreen}
        options={{
          tabBarLabel: tabLabel(tr("Diet", language)),
          tabBarIcon: tabIcon(Utensils),
        }}
      />
      <Tabs.Screen
        name="Assignments"
        component={AssignmentsScreen}
        options={{
          tabBarLabel: tabLabel(tr("Assignments", language)),
          tabBarIcon: tabIcon(Gauge),
        }}
      />
      <Tabs.Screen
        name="Progress"
        component={PlayerProgressScreen}
        options={{
          tabBarLabel: tabLabel(tr("Progress", language)),
          tabBarIcon: tabIcon(BarChart3),
        }}
      />
      <Tabs.Screen
        name="Coach"
        component={ChatScreen}
        options={{
          tabBarLabel: tabLabel(tr("Coach", language)),
          tabBarIcon: tabIcon(MessageCircle),
        }}
      />
    </Tabs.Navigator>
  );
}
function CoachTabs() {
  return <CoachTabShell />;
}
function AdminTabs() {
  const { language } = useLanguage();
  const adaptiveTabOptions = useTabOptions();
  return (
    <Tabs.Navigator screenOptions={adaptiveTabOptions}>
      <Tabs.Screen
        name="Overview"
        component={AdminOverviewScreen}
        options={{
          tabBarLabel: tabLabel(tr("Overview", language)),
          tabBarIcon: tabIcon(Gauge),
        }}
      />
      <Tabs.Screen
        name="Users & Keys"
        component={AdminManagementScreen}
        options={{
          tabBarLabel: tabLabel(tr("Users & Keys", language)),
          tabBarIcon: tabIcon(KeyRound),
        }}
      />
      <Tabs.Screen
        name="Support"
        component={AdminSupportScreen}
        options={{
          tabBarLabel: tabLabel(tr("Support", language)),
          tabBarIcon: tabIcon(LifeBuoy),
        }}
      />
      <Tabs.Screen
        name="Libraries"
        component={AdminLibraryModerationScreen}
        options={{
          tabBarLabel: tabLabel(tr("Libraries", language)),
          tabBarIcon: tabIcon(ShieldCheck),
        }}
      />
      <Tabs.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarLabel: tabLabel(tr("Account", language)),
          tabBarIcon: tabIcon(UserRound),
        }}
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
      try {
        setInitialState(
          stored ? (JSON.parse(stored) as InitialState) : undefined,
        );
      } catch {
        setInitialState(undefined);
      }
      setNavigationReady(true);
    });
    return () => {
      active = false;
    };
  }, [persistenceKey]);
  if (loading) return <MobileLoading variant="launch" />;
  if (!navigationReady) return <MobileLoading variant="launch" />;
  return (
    <NavigationContainer
      key={persistenceKey}
      initialState={initialState}
      onStateChange={(state) => {
        void AsyncStorage.setItem(persistenceKey, JSON.stringify(state));
      }}
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
