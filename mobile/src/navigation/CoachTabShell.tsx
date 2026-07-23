import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  Bell,
  LibraryBig,
  MessageCircle,
  Settings,
  UsersRound,
  type LucideIcon,
} from "lucide-react-native";
import { useWindowDimensions } from "react-native";
import type { ComponentType } from "react";
import PlayersScreen from "../screens/coach/PlayersScreen";
import CoachPlanScreen from "../screens/coach/CoachPlanScreen";
import CoachCheckupsScreen from "../screens/coach/CoachCheckupsScreen";
import CoachDashboardScreen from "../screens/coach/CoachDashboardScreen";
import CoachSupportScreen from "../screens/coach/CoachSupportScreen";
import CoachTeam from "../screens/coach/CoachTeam";
import CoachMoreActiveScreen from "../screens/coach/CoachMoreActiveScreen";
import CoachAlertsScreen from "../screens/coach/CoachAlertsScreen";
import AppearanceSettingsScreen from "../screens/coach/AppearanceSettingsScreen";
import ExerciseLibraryScreen from "../screens/coach/ExerciseLibraryScreen";
import WorkoutLibraryScreen from "../screens/coach/WorkoutLibraryScreen";
import DietLibraryScreen from "../screens/coach/DietLibraryScreen";
import { ProgramLibrary } from "../screens/coach/ProgramLibrary";
import ChatScreen from "../screens/shared/ChatScreen";
import BuildHomeScreen from "../screens/coach/BuildHomeScreen";
import PublicLibrariesScreen from "../screens/coach/PublicLibrariesScreen";
import SettingsHomeScreen from "../screens/coach/SettingsHomeScreen";
import { AppText } from "../components/core/Primitives";
import { useMobileTheme } from "../theme/MobileTheme";
import { tr, useLanguage } from "../i18n/MobileLanguage";

type TabsParamList = {
  People: undefined;
  Build: undefined;
  Messages: undefined;
  Alerts: undefined;
  Settings: undefined;
};
const Tab = createBottomTabNavigator<TabsParamList>();
const Stack = createNativeStackNavigator<any>();

const tabs: Record<keyof TabsParamList, LucideIcon> = {
  People: UsersRound,
  Build: LibraryBig,
  Messages: MessageCircle,
  Alerts: Bell,
  Settings,
};
const tabIcon =
  (Icon: LucideIcon) =>
  ({ color, size }: { color: string; size: number }) => (
    <Icon
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      color={color}
      size={size}
      strokeWidth={1.875}
    />
  );

function stackOptions(theme: ReturnType<typeof useMobileTheme>) {
  return {
    headerShadowVisible: false,
    headerTintColor: theme.colors.ink950,
    headerStyle: { backgroundColor: theme.colors.surface },
    headerTitleStyle: { fontSize: 17, fontWeight: "600" as const },
    contentStyle: { backgroundColor: theme.colors.surfaceSubtle },
    animation: "slide_from_right" as const,
  };
}

function PeopleStack() {
  const theme = useMobileTheme();
  return (
    <Stack.Navigator screenOptions={stackOptions(theme)}>
      <Stack.Screen
        name="PeopleList"
        component={PlayersScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
function MessagesStack() {
  const theme = useMobileTheme();
  return (
    <Stack.Navigator screenOptions={stackOptions(theme)}>
      <Stack.Screen
        name="Inbox"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function BuildStack() {
  const theme = useMobileTheme();
  const { language } = useLanguage();
  return (
    <Stack.Navigator screenOptions={stackOptions(theme)}>
      <Stack.Screen
        name="BuildHome"
        component={BuildHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ClientPlans"
        component={CoachPlanScreen}
        options={{
          title: tr("Client programming", language),
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Exercises"
        component={ExerciseLibraryScreen}
        options={{ title: tr("Exercises", language) }}
      />
      <Stack.Screen
        name="Workouts"
        component={WorkoutLibraryScreen}
        options={{ title: tr("Workouts", language) }}
      />
      <Stack.Screen
        name="Programs"
        component={ProgramLibrary}
        options={{ title: tr("Programs", language) }}
      />
      <Stack.Screen
        name="DietTemplates"
        component={DietLibraryScreen}
        options={{ title: tr("Diet templates", language) }}
      />
      <Stack.Screen
        name="PublicLibraries"
        component={PublicLibrariesScreen}
        options={{ title: tr("Private & public libraries", language) }}
      />
    </Stack.Navigator>
  );
}

function AlertsStack() {
  const theme = useMobileTheme();
  return (
    <Stack.Navigator screenOptions={stackOptions(theme)}>
      <Stack.Screen
        name="AlertsFeed"
        component={CoachAlertsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function SettingsStack() {
  const theme = useMobileTheme();
  const { language } = useLanguage();
  return (
    <Stack.Navigator screenOptions={stackOptions(theme)}>
      <Stack.Screen
        name="SettingsHome"
        component={SettingsHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Appearance"
        component={AppearanceSettingsScreen}
        options={{ title: tr("Appearance", language) }}
      />
      <Stack.Screen
        name="CommandCenter"
        component={CoachDashboardScreen}
        options={{ title: tr("Command center", language), headerShown: false }}
      />
      <Stack.Screen
        name="Checkups"
        component={CoachCheckupsScreen}
        options={{ title: tr("Daily check-ups", language), headerShown: false }}
      />
      <Stack.Screen
        name="CoachTeam"
        component={CoachTeam}
        options={{ title: tr("Coach team", language) }}
      />
      <Stack.Screen
        name="CoachSupport"
        component={CoachSupportScreen}
        options={{ title: tr("Admin support", language), headerShown: false }}
      />
      <Stack.Screen
        name="CoachTools"
        component={CoachMoreActiveScreen}
        options={{ title: tr("Coach tools", language), headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function CoachTabShell() {
  const theme = useMobileTheme();
  const { language } = useLanguage();
  const { width } = useWindowDimensions();
  const components: Record<keyof TabsParamList, ComponentType<any>> = {
    People: PeopleStack,
    Build: BuildStack,
    Messages: MessagesStack,
    Alerts: AlertsStack,
    Settings: SettingsStack,
  };
  return (
    <Tab.Navigator
      initialRouteName="People"
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        lazy: true,
        animation: "fade",
        tabBarActiveTintColor: theme.colors.brand600,
        tabBarInactiveTintColor: theme.colors.ink500,
        tabBarHideOnKeyboard: true,
        tabBarLabelPosition: width >= 600 ? "beside-icon" : "below-icon",
        tabBarStyle: {
          minHeight: 68,
          paddingTop: 6,
          paddingBottom: 8,
          backgroundColor: theme.colors.tabBar,
          borderTopColor: theme.colors.line,
        },
        tabBarLabelStyle: { fontSize: 11, lineHeight: 15, fontWeight: "600" },
        tabBarItemStyle: { minHeight: theme.sizes.minimumTarget },
      }}
    >
      {(Object.keys(tabs) as Array<keyof TabsParamList>).map((name) => {
        const label = tr(name, language);
        return (
          <Tab.Screen
            key={name}
            name={name}
            component={components[name]}
            options={{
              tabBarAccessibilityLabel: `${label} ${tr("tab", language)}`,
              tabBarLabel: ({ color }) => (
                <AppText variant="metadata" color={color}>
                  {label}
                </AppText>
              ),
              tabBarIcon: tabIcon(tabs[name]),
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
}
