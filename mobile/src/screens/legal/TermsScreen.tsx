import { TermsScreen as SharedTermsScreen } from '../LegalUpdatesScreen';

export type TermsScreenProps = { back: () => void };

export default function TermsScreen(props: TermsScreenProps) {
  return <SharedTermsScreen {...props} />;
}
