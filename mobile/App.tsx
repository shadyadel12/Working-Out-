/** Shared iOS and Android entry point. */
import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/auth/AuthProvider';
import RootNavigator from './src/navigation/RootNavigator';
import { LanguageButton,LanguageProvider } from './src/i18n/MobileLanguage';
export default function App(){return <LanguageProvider><AuthProvider><StatusBar style="light"/><RootNavigator/><LanguageButton/></AuthProvider></LanguageProvider>}
