import { ActivityIndicator, View } from 'react-native';
import { useEffect, useState } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../auth/AuthProvider';
import LoginScreen from '../screens/LoginScreen';
import ProgramScreen from '../screens/player/ProgramScreen';
import DietScreen from '../screens/player/DietScreen';
import PlayersScreen from '../screens/coach/PlayersScreen';
import { AccountScreen, AdminScreen, ChatScreen, ProgressScreen } from '../screens/SharedScreens';
import { colors } from '../theme';
import MfaScreen from '../screens/MfaScreen';
import CoachSettingsScreen from '../screens/coach/CoachSettingsScreen';
import AdminSupportScreen from '../screens/admin/AdminSupportScreen';
import CoachPlanScreen from '../screens/coach/CoachPlanScreen';
import RenewSubscriptionScreen from '../screens/RenewSubscriptionScreen';
import { supabase } from '../lib/supabase';
import CoachSupportScreen from '../screens/coach/CoachSupportScreen';
import CoachCheckupsScreen from '../screens/coach/CoachCheckupsScreen';
import CoachMoreScreen from '../screens/coach/CoachMoreScreen';
import CoachDashboardScreen from '../screens/coach/CoachDashboardScreen';
import PlayerHomeScreen from '../screens/player/PlayerHomeScreen';
import AdminOverviewScreen from '../screens/admin/AdminOverviewScreen';
import PlayerProgressScreen from '../screens/player/PlayerProgressScreen';
import AdminManagementScreen from '../screens/admin/AdminManagementScreen';

const Tabs=createBottomTabNavigator();
const tabOptions={headerShown:false,tabBarStyle:{backgroundColor:colors.surface,borderTopColor:colors.border,height:64,paddingTop:6,paddingBottom:8},tabBarActiveTintColor:colors.accent,tabBarInactiveTintColor:colors.muted,tabBarLabelStyle:{fontSize:11,fontWeight:'700' as const}};
function PlayerTabs(){const{session}=useAuth();const[active,setActive]=useState<boolean|null>(null);async function check(){const{data}=await supabase.from('coach_player_links').select('status,subscription_end_date').eq('player_id',session!.user.id).order('subscription_end_date',{ascending:false}).limit(1).maybeSingle();setActive(!!data&&data.status==='active'&&data.subscription_end_date>=new Date().toISOString().slice(0,10));}useEffect(()=>{void check();},[session]);if(active===null)return <View style={{flex:1,backgroundColor:colors.background,justifyContent:'center'}}><ActivityIndicator color={colors.accent}/></View>;if(!active)return <RenewSubscriptionScreen onRenewed={check}/>;return <Tabs.Navigator screenOptions={tabOptions}><Tabs.Screen name="Home" component={PlayerHomeScreen}/><Tabs.Screen name="Program" component={ProgramScreen}/><Tabs.Screen name="Diet" component={DietScreen}/><Tabs.Screen name="Progress" component={PlayerProgressScreen}/><Tabs.Screen name="Coach" component={ChatScreen}/></Tabs.Navigator>}
function CoachTabs(){return <Tabs.Navigator screenOptions={tabOptions}><Tabs.Screen name="Home" component={CoachDashboardScreen}/><Tabs.Screen name="Players" component={PlayersScreen}/><Tabs.Screen name="Plans" component={CoachPlanScreen}/><Tabs.Screen name="Messages" component={ChatScreen}/><Tabs.Screen name="More" component={CoachMoreScreen}/></Tabs.Navigator>}
function AdminTabs(){return <Tabs.Navigator screenOptions={tabOptions}><Tabs.Screen name="Overview" component={AdminOverviewScreen}/><Tabs.Screen name="Users & Keys" component={AdminManagementScreen}/><Tabs.Screen name="Support" component={AdminSupportScreen}/><Tabs.Screen name="Account" component={AccountScreen}/></Tabs.Navigator>}
export default function RootNavigator(){const{session,profile,loading,aal2}=useAuth();if(loading)return <View style={{flex:1,backgroundColor:colors.background,justifyContent:'center'}}><ActivityIndicator color={colors.accent}/></View>;return <NavigationContainer theme={{...DarkTheme,colors:{...DarkTheme.colors,background:colors.background,card:colors.surface,border:colors.border,primary:colors.accent,text:colors.text}}}>{!session||!profile?<LoginScreen/>:profile.role==='player'?<PlayerTabs/>:profile.role==='coach'?<CoachTabs/>:aal2?<AdminTabs/>:<MfaScreen/>}</NavigationContainer>}
