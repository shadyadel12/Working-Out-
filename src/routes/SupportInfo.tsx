import { SUPPORT_EMAIL } from '../config/legal';
import { LegalPage } from './Privacy';

export default function SupportInfo() {
  return <LegalPage title="Trainova Support">
    <p>For account, privacy, safety, copyright, billing-access, or technical help, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
    <p>Include the role you use (coach, player, team member, or administrator), a short description, and screenshots only when they do not expose another person's private data. For immediate danger, contact local emergency services.</p>
  </LegalPage>;
}
