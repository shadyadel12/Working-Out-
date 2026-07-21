import { Bell, ClipboardCheck, Moon, Settings, ShieldQuestion, UsersRound } from 'lucide-react-native';
import MenuHub from '../../components/MenuHub';

export default function SettingsHomeScreen() {
  return (
    <MenuHub
      title="Settings"
      subtitle="Manage your coaching workspace and account"
      items={[
        { title: 'Appearance', description: 'Choose the website light or dark theme.', icon: Moon, screen: 'Appearance' },
        { title: 'Coach command center', description: 'See unread messages, programming gaps and low activity.', icon: Bell, screen: 'CommandCenter' },
        { title: 'Daily check-ups', description: 'Work through players due for follow-up.', icon: ClipboardCheck, screen: 'Checkups' },
        { title: 'Coach team', description: 'Invite teammates, assign clients and manage roles.', icon: UsersRound, screen: 'CoachTeam' },
        { title: 'Admin support', description: 'Message the platform support team.', icon: ShieldQuestion, screen: 'CoachSupport' },
        { title: 'Coach tools', description: 'Subscriptions, account, updates and legal information.', icon: Settings, screen: 'CoachTools' },
      ]}
    />
  );
}
