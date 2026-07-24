import { Link } from 'react-router-dom';
import { SUPPORT_EMAIL, SUPPORT_URL } from '../config/legal';

export default function Privacy() {
  return <LegalPage title="Trainova Privacy Policy" updated="24 July 2026">
    <p>Trainova provides fitness coaching, workout, nutrition, progress, messaging, and support tools. This policy explains what we collect and how we use it.</p>
    <h2>Information we collect</h2>
    <ul>
      <li>Account and profile details, including name, email, role, authentication and coaching-access records.</li>
      <li>Fitness, health-context, workout, nutrition, meal, measurement, goal, check-in, and progress information you choose to provide.</li>
      <li>Messages and support conversations, plus photos, videos, voice messages, files, and their upload status.</li>
      <li>Security and operational data such as login events, moderation reports, audit records, device/platform type, app version, error and network information.</li>
    </ul>
    <h2>Why we use information</h2>
    <p>We use it to operate coaching features, deliver plans, show progress, enable communication, provide support, secure accounts, prevent abuse, moderate public content, comply with law, and improve reliability. We do not sell personal data or use health information for advertising.</p>
    <h2>Processors and limited sharing</h2>
    <p>Trainova does not make personal data public unless you intentionally publish catalog content. Service providers process limited data for us under their terms and safeguards: Supabase for accounts, databases and private storage; Cloudflare and R2 for delivery, security and private media; Vercel for the website; Expo/EAS for mobile builds and updates; and VirusTotal where enabled to scan uploaded files. Authorized coaches and permitted team members can access the players they support. We may disclose data when legally required or needed to protect users.</p>
    <h2>Retention and deletion</h2>
    <p>Active account data is kept while the account or coaching relationship is needed. Temporary uploads, expired evidence, and operational logs follow their configured retention periods. In-app account deletion removes the Auth account and deletes or schedules deletion of private files. We may retain minimal pseudonymous security, fraud, legal, transaction, and moderation audit records for up to 24 months, or longer only when law requires it. Backups expire through normal rotation and are not restored for ordinary product use.</p>
    <h2>Your choices and rights</h2>
    <p>You may request access, correction, export, restriction, objection, or deletion where applicable. You can delete your account inside Account settings. You may withdraw optional permissions in device settings; affected media features will then stop working.</p>
    <h2>Children, security, and international processing</h2>
    <p>Trainova is not intended for children under 13. Local age or parental-consent rules may impose a higher age. We use access controls, private storage, short-lived media links, and encrypted transport, but no system can guarantee absolute security. Providers may process data in other countries under appropriate safeguards.</p>
    <h2>Contact</h2>
    <p>Privacy, support, and data-rights requests: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Public support page: <a href={SUPPORT_URL}>{SUPPORT_URL}</a>.</p>
  </LegalPage>;
}
export function LegalPage({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return <div className="container" style={{ maxWidth: 820, padding: '2rem 1rem', lineHeight: 1.7 }}>
    <Link to="/" className="muted">← Trainova</Link><h1>{title}</h1>{updated && <p className="muted">Last updated: {updated}</p>}
    <div className="stack">{children}</div>
  </div>;
}
