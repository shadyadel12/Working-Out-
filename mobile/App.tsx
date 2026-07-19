/** Shared iOS and Android entry point. */
import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ComponentType } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider } from './src/auth/AuthProvider';
import { LanguageButton,LanguageProvider } from './src/i18n/MobileLanguage';
import { MobileThemeProvider, useMobileTheme } from './src/theme/MobileTheme';
function ThemedApp(){const theme=useMobileTheme();const [RootNavigator,setRootNavigator]=useState<ComponentType|null>(null);useEffect(()=>{if(theme.ready)void import('./src/navigation/RootNavigator').then((module)=>setRootNavigator(()=>module.default));},[theme.ready]);if(!theme.ready||!RootNavigator)return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:theme.colors.surfaceSubtle}}><StatusBar style={theme.dark?'light':'dark'}/><ActivityIndicator color={theme.colors.brand500}/></View>;return <AuthProvider><StatusBar style={theme.dark?'light':'dark'}/><RootNavigator/><LanguageButton/></AuthProvider>}
export default function App(){return <LanguageProvider><MobileThemeProvider><ThemedApp/></MobileThemeProvider></LanguageProvider>}
