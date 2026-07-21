import { BookOpen, ClipboardCheck, Dumbbell, LibraryBig, Utensils } from 'lucide-react-native';
import MenuHub from '../../components/MenuHub';

export default function BuildHomeScreen() {
  return (
    <MenuHub
      title="Build"
      subtitle="Create reusable coaching content and deliver it to clients"
      items={[
        { title: 'Client programming', description: 'Schedule training and diet plans for a player.', icon: ClipboardCheck, screen: 'ClientPlans' },
        { title: 'Exercises', description: 'Manage your reusable movement library.', icon: Dumbbell, screen: 'Exercises' },
        { title: 'Workouts', description: 'Compose and reuse workout templates.', icon: LibraryBig, screen: 'Workouts' },
        { title: 'Programs', description: 'Build reusable multi-week programs.', icon: BookOpen, screen: 'Programs' },
        { title: 'Diet templates', description: 'Create and reuse nutrition templates.', icon: Utensils, screen: 'DietTemplates' },
      ]}
    />
  );
}
