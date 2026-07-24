import { useState } from 'react';
import { Alert, Pressable, Text } from 'react-native';
import { useAuth } from '../../auth/AuthProvider';
import { clearMobileLocalData, supabase } from '../../lib/supabase';
import { Button, Input } from '../../components/Controls';
import { Card, Screen, textStyles } from '../../components/Screen';
import { CommunityStandardsScreen, PrivacyScreen, SupportScreen, TermsScreen } from '../LegalUpdatesScreen';

type Page = 'account' | 'privacy' | 'terms' | 'standards' | 'support';

export default function AccountPrivacyScreen() {
  const { profile, signOut } = useAuth();
  const [page, setPage] = useState<Page>('account');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  if (page === 'privacy') return <PrivacyScreen back={() => setPage('account')} />;
  if (page === 'terms') return <TermsScreen back={() => setPage('account')} />;
  if (page === 'standards') return <CommunityStandardsScreen back={() => setPage('account')} />;
  if (page === 'support') return <SupportScreen back={() => setPage('account')} />;

  async function deleteAccount() {
    if (!profile || confirmation !== 'DELETE' || !acknowledged) return;
    setBusy(true);
    try {
      if (password) {
        const { error } = await supabase.auth.signInWithPassword({ email: profile.email, password });
        if (error) throw new Error('The password is incorrect.');
      }
      const { error } = await supabase.functions.invoke('account-delete', { body: {} });
      if (error) throw error;
      await clearMobileLocalData();
    } catch (error) {
      setBusy(false);
      Alert.alert('Could not delete account', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  function confirmDeletion() {
    Alert.alert('Permanently delete account?', 'This cannot be undone. Private files will be deleted or scheduled for deletion.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete account', style: 'destructive', onPress: () => void deleteAccount() },
    ]);
  }

  return <Screen title="Account & Privacy">
    <Card><Text style={textStyles.heading}>{profile?.name || profile?.email}</Text><Text style={textStyles.muted}>{profile?.role}</Text><Button secondary onPress={signOut}>SIGN OUT</Button></Card>
    {([['privacy','Privacy Policy'],['standards','Community Standards'],['terms','Terms of Use'],['support','Support & copyright']] as const).map(([key,label]) => <Pressable key={key} onPress={() => setPage(key)}><Card><Text style={textStyles.heading}>{label} ›</Text></Card></Pressable>)}
    <Card>
      <Text style={textStyles.heading}>Delete account</Text>
      <Text style={textStyles.body}>Your sign-in and account data will be removed. Minimal pseudonymous legal, security, and moderation records may remain for up to 24 months.</Text>
      <Input value={password} onChangeText={setPassword} secureTextEntry placeholder="Current password (required)" />
      <Pressable onPress={() => setAcknowledged((value) => !value)}><Text style={textStyles.body}>{acknowledged ? '☑' : '☐'} I understand this cannot be undone.</Text></Pressable>
      <Input value={confirmation} onChangeText={setConfirmation} autoCapitalize="characters" placeholder="Type DELETE" />
      <Button danger disabled={busy || !acknowledged || confirmation !== 'DELETE' || !password} onPress={confirmDeletion}>{busy ? 'DELETING…' : 'PERMANENTLY DELETE ACCOUNT'}</Button>
    </Card>
  </Screen>;
}
