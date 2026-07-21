import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Bell, BookOpen, ClipboardCheck, Dumbbell, LibraryBig, MessageCircle, Moon, Settings, ShieldQuestion, UsersRound, Utensils, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ComponentType } from 'react';
import PlayersScreen from '../screens/coach/PlayersScreen';
import CoachPlanScreen from '../screens/coach/CoachPlanScreen';
import CoachCheckupsScreen from '../screens/coach/CoachCheckupsScreen';
import CoachDashboardScreen from '../screens/coach/CoachDashboardScreen';
import CoachSupportScreen from '../screens/coach/CoachSupportScreen';
import CoachTeam from '../screens/coach/CoachTeam';
import CoachMoreActiveScreen from '../screens/coach/CoachMoreActiveScreen';
import CoachAlertsScreen from '../screens/coach/CoachAlertsScreen';
import AppearanceSettingsScreen from '../screens/coach/AppearanceSettingsScreen';
import { ExerciseLibrary, WorkoutLibrary, DietLibrary } from '../screens/coach/CoachLibraries';
import { ProgramLibrary } from '../screens/coach/ProgramLibrary';
import { ChatScreen } from '../screens/SharedScreens';
import { AppText, Surface } from '../components/core/Primitives';
import { useMobileTheme } from '../theme/MobileTheme';

type TabsParamList = { People: undefined; Build: undefined; Messages: undefined; Alerts: undefined; Settings: undefined };
const Tab = createBottomTabNavigator<TabsParamList>();
const Stack = createNativeStackNavigator<any>();

const tabs: Record<keyof TabsParamList, LucideIcon> = { People: UsersRound, Build: LibraryBig, Messages: MessageCircle, Alerts: Bell, Settings };
const tabIcon = (Icon: LucideIcon) => ({ color, size }: { color: string; size: number }) => <Icon accessibilityElementsHidden importantForAccessibility="no-hide-descendants" color={color} size={size} strokeWidth={1.875} />;

function stackOptions(theme: ReturnType<typeof useMobileTheme>) {
  return { headerShadowVisible: false, headerTintColor: theme.colors.ink950, headerStyle: { backgroundColor: theme.colors.surface }, headerTitleStyle: { fontSize: 17, fontWeight: '600' as const }, contentStyle: { backgroundColor: theme.colors.surfaceSubtle }, animation: 'slide_from_right' as const };
}

function PeopleStack() { const theme = useMobileTheme(); return <Stack.Navigator screenOptions={stackOptions(theme)}><Stack.Screen name="PeopleList" component={PlayersScreen} options={{ headerShown: false }} /></Stack.Navigator>; }
function MessagesStack() { const theme = useMobileTheme(); return <Stack.Navigator screenOptions={stackOptions(theme)}><Stack.Screen name="Inbox" component={ChatScreen} options={{ headerShown: false }} /></Stack.Navigator>; }

function BuildStack() {
  const theme = useMobileTheme();
  return <Stack.Navigator screenOptions={stackOptions(theme)}><Stack.Screen name="BuildHome" options={{ headerShown: false }}>{() => <MenuHub title="Build" subtitle="Create reusable coaching content and deliver it to clients" items={[{ title: 'Client programming', description: 'Schedule training and diet plans for a player.', icon: ClipboardCheck, screen: 'ClientPlans' }, { title: 'Exercises', description: 'Manage your reusable movement library.', icon: Dumbbell, screen: 'Exercises' }, { title: 'Workouts', description: 'Compose and reuse workout templates.', icon: LibraryBig, screen: 'Workouts' }, { title: 'Programs', description: 'Build reusable multi-week programs.', icon: BookOpen, screen: 'Programs' }, { title: 'Diet templates', description: 'Create and reuse nutrition templates.', icon: Utensils, screen: 'DietTemplates' }]} />}</Stack.Screen><Stack.Screen name="ClientPlans" component={CoachPlanScreen} options={{ title: 'Client programming', headerShown: false }} /><Stack.Screen name="Exercises" component={ExerciseLibrary} /><Stack.Screen name="Workouts" component={WorkoutLibrary} /><Stack.Screen name="Programs" component={ProgramLibrary} /><Stack.Screen name="DietTemplates" component={DietLibrary} options={{ title: 'Diet templates' }} /></Stack.Navigator>;
}

function AlertsStack() {
  const theme = useMobileTheme();
  return <Stack.Navigator screenOptions={stackOptions(theme)}><Stack.Screen name="AlertsFeed" component={CoachAlertsScreen} options={{ headerShown: false }} /></Stack.Navigator>;
}

function SettingsStack() {
  const theme = useMobileTheme();
  return <Stack.Navigator screenOptions={stackOptions(theme)}><Stack.Screen name="SettingsHome" options={{ headerShown: false }}>{() => <MenuHub title="Settings" subtitle="Manage your coaching workspace and account" items={[{ title: 'Appearance', description: 'Choose the website light or dark theme.', icon: Moon, screen: 'Appearance' }, { title: 'Coach command center', description: 'See unread messages, programming gaps and low activity.', icon: Bell, screen: 'CommandCenter' }, { title: 'Daily check-ups', description: 'Work through players due for follow-up.', icon: ClipboardCheck, screen: 'Checkups' }, { title: 'Coach team', description: 'Invite teammates, assign clients and manage roles.', icon: UsersRound, screen: 'CoachTeam' }, { title: 'Admin support', description: 'Message the platform support team.', icon: ShieldQuestion, screen: 'CoachSupport' }, { title: 'Coach tools', description: 'Subscriptions, account, updates and legal information.', icon: Settings, screen: 'CoachTools' }]} />}</Stack.Screen><Stack.Screen name="Appearance" component={AppearanceSettingsScreen} options={{ title: 'Appearance' }} /><Stack.Screen name="CommandCenter" component={CoachDashboardScreen} options={{ title: 'Command center', headerShown: false }} /><Stack.Screen name="Checkups" component={CoachCheckupsScreen} options={{ title: 'Daily check-ups', headerShown: false }} /><Stack.Screen name="CoachTeam" component={CoachTeam} options={{ title: 'Coach team' }} /><Stack.Screen name="CoachSupport" component={CoachSupportScreen} options={{ title: 'Admin support', headerShown: false }} /><Stack.Screen name="CoachTools" component={CoachMoreActiveScreen} options={{ title: 'Coach tools', headerShown: false }} /></Stack.Navigator>;
}

function MenuHub({ title, subtitle, items }: { title: string; subtitle: string; items: Array<{ title: string; description: string; icon: LucideIcon; screen: string }> }) {
  const theme = useMobileTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: theme.colors.surfaceSubtle }]}><View style={[styles.hub, { paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.xl }]}><AppText variant="screenTitle">{title}</AppText><AppText color={theme.colors.ink500}>{subtitle}</AppText><View style={{ gap: theme.spacing.md }}>{items.map(({ title: itemTitle, description, icon: Icon, screen }) => <Pressable key={screen} accessibilityRole="button" accessibilityLabel={`${itemTitle}. ${description}`} onPress={() => navigation.navigate(screen)} style={({ pressed }) => ({ opacity: pressed ? .72 : 1, transform: [{ scale: pressed ? .98 : 1 }] })}><Surface style={styles.row}><View style={[styles.icon, { backgroundColor: theme.colors.brand50 }]}><Icon size={20} strokeWidth={1.875} color={theme.colors.brand600} /></View><View style={styles.grow}><AppText variant="rowTitle">{itemTitle}</AppText><AppText variant="metadata" color={theme.colors.ink500}>{description}</AppText></View><AppText color={theme.colors.ink500}>›</AppText></Surface></Pressable>)}</View></View></SafeAreaView>;
}

export default function CoachTabShell() {
  const theme = useMobileTheme();
  const { width } = useWindowDimensions();
  const components: Record<keyof TabsParamList, ComponentType<any>> = { People: PeopleStack, Build: BuildStack, Messages: MessagesStack, Alerts: AlertsStack, Settings: SettingsStack };
  return <Tab.Navigator initialRouteName="People" backBehavior="history" screenOptions={{ headerShown: false, lazy: true, animation: 'fade', tabBarActiveTintColor: theme.colors.brand600, tabBarInactiveTintColor: theme.colors.ink500, tabBarHideOnKeyboard: true, tabBarLabelPosition: width >= 600 ? 'beside-icon' : 'below-icon', tabBarStyle: { minHeight: 68, paddingTop: 6, paddingBottom: 8, backgroundColor: theme.colors.tabBar, borderTopColor: theme.colors.line }, tabBarLabelStyle: { fontSize: 11, lineHeight: 15, fontWeight: '600' }, tabBarItemStyle: { minHeight: theme.sizes.minimumTarget } }}>{(Object.keys(tabs) as Array<keyof TabsParamList>).map((name) => <Tab.Screen key={name} name={name} component={components[name]} options={{ tabBarAccessibilityLabel: `${name} tab`, tabBarLabel: ({ focused, color }) => focused ? <AppText variant="metadata" color={color}>{name}</AppText> : null, tabBarIcon: tabIcon(tabs[name]) }} />)}</Tab.Navigator>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, hub: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: 16 }, row: { minHeight: 72, flexDirection: 'row', alignItems: 'center' }, icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, grow: { flex: 1, minWidth: 0 }, });
