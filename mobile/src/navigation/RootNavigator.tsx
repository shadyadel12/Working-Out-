import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../auth/AuthProvider';
import LoginScreen from '../screens/LoginScreen';
import ProgramScreen from '../screens/player/ProgramScreen';
import DietScreen from '../screens/player/DietScreen';
import PlayersScreen from '../screens/coach/PlayersScreen';
import { AccountScreen, AdminScreen, ChatScreen, ProgressScreen } from '../screens/SharedScreens';
import { colors } from '../theme';

const Tabs=createBottomTabNavigator();
function PlayerTabs(){return <Tabs.Navigator screenOptions={{headerShown:false,tabBarStyle:{backgroundColor:colors.surface,borderTopColor:colors.border},tabBarActiveTintColor:colors.accent,tabBarInactiveTintColor:colors.muted}}><Tabs.Screen name="Program" component={ProgramScreen}/><Tabs.Screen name="Diet" component={DietScreen}/><Tabs.Screen name="Progress" component={ProgressScreen}/><Tabs.Screen name="Chat" component={ChatScreen}/><Tabs.Screen name="Account" component={AccountScreen}/></Tabs.Navigator>}
function CoachTabs(){return <Tabs.Navigator screenOptions={{headerShown:false,tabBarStyle:{backgroundColor:colors.surface,borderTopColor:colors.border},tabBarActiveTintColor:colors.accent,tabBarInactiveTintColor:colors.muted}}><Tabs.Screen name="Players" component={PlayersScreen}/><Tabs.Screen name="Progress" component={ProgressScreen}/><Tabs.Screen name="Chat" component={ChatScreen}/><Tabs.Screen name="Account" component={AccountScreen}/></Tabs.Navigator>}
function AdminTabs(){return <Tabs.Navigator screenOptions={{headerShown:false,tabBarStyle:{backgroundColor:colors.surface,borderTopColor:colors.border},tabBarActiveTintColor:colors.accent,tabBarInactiveTintColor:colors.muted}}><Tabs.Screen name="Users & Keys" component={AdminScreen}/><Tabs.Screen name="Support" component={ChatScreen}/><Tabs.Screen name="Account" component={AccountScreen}/></Tabs.Navigator>}
export default function RootNavigator(){const{session,profile,loading}=useAuth();if(loading)return <View style={{flex:1,backgroundColor:colors.background,justifyContent:'center'}}><ActivityIndicator color={colors.accent}/></View>;return <NavigationContainer theme={{...DarkTheme,colors:{...DarkTheme.colors,background:colors.background,card:colors.surface,border:colors.border,primary:colors.accent,text:colors.text}}}>{!session||!profile?<LoginScreen/>:profile.role==='player'?<PlayerTabs/>:profile.role==='coach'?<CoachTabs/>:<AdminTabs/>}</NavigationContainer>}
