import { UpdatesScreen as SharedUpdatesScreen } from '../LegalUpdatesScreen';

export type UpdatesScreenProps = { back: () => void };

export default function UpdatesScreen(props: UpdatesScreenProps) {
  return <SharedUpdatesScreen {...props} />;
}
