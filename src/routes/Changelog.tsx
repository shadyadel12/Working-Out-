/** Public, non-technical overview of the app's features and latest updates. */
import { Link } from 'react-router-dom';

const sections = [
  ['For Coaches', [
    'Manage linked players, subscriptions, expiry dates, and daily check-ups.',
    'Build weekly programs with rest days, workouts, exercises, targets, notes, and videos.',
    'Copy weeks, days, and exercises, or save workouts for reuse with another player.',
    'Create diet plans with meals, snacks, food amounts, and coaching notes.',
    'Copy or save diet plans for reuse while keeping each player’s changes separate.',
    'Import complete workout and diet plans from Excel through Settings.',
    'Review workout progress, diet adherence, player notes, and submitted videos.',
    'Send general or exercise-specific guidance and use private live chat.',
    'Contact the administrator through private support chat.',
  ]],
  ['For Players', [
    'View weekly workouts and diet plans one day at a time.',
    'Record sets, repetitions, weight, completion, comments, videos, and video links.',
    'Review workout progress using workout, exercise, and date filters.',
    'Record completed meals and review diet adherence over time.',
    'Exchange private text, pictures, videos, audio, and voice messages with a coach.',
    'Renew expired access with a new subscription key.',
  ]],
  ['For Administrators', [
    'Manage coaches, players, invitation keys, subscription keys, renewals, and revoked access.',
    'Review and reply to coach support conversations from one inbox.',
    'Use additional account verification before accessing administration tools.',
  ]],
  ['Convenience and Protection', [
    'Unread badges highlight new chat and support messages.',
    'Loading placeholders keep pages clear while information is prepared.',
    'Large progress histories load in smaller pages only after filters are applied.',
    'Private information and files are limited to the correct player, coach, or administrator.',
    'Uploads, links, spreadsheets, access keys, and important changes receive safety checks.',
    'Player videos are cleaned up automatically after the coach has viewed them.',
  ]],
] as const;

export default function Changelog() {
  return (
    <div className="container" style={{ maxWidth: 820, padding: '2rem 1rem' }}>
      <Link to="/" className="muted" style={{ fontSize: '0.85rem' }}>← Back to sign in</Link>
      <h1 style={{ margin: '1rem 0 0.25rem' }}>App Features &amp; Updates</h1>
      <p className="muted">Last updated: July 18, 2026</p>
      <div className="stack" style={{ marginTop: '1.5rem' }}>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Latest improvements</h2>
          <ul>
            <li>This Changelog is now available before sign-in.</li>
            <li>Workout and diet plans can be saved and reused without changing other players’ plans.</li>
            <li>Progress and diet pages load only the information requested by the user.</li>
            <li>Private chat supports text, pictures, videos, audio, and recorded voice messages.</li>
          </ul>
        </section>
        {sections.map(([title, items]) => (
          <section key={title} className="card">
            <h2 style={{ marginTop: 0 }}>{title}</h2>
            <ul>{items.map((item) => <li key={item} style={{ marginBottom: '0.45rem' }}>{item}</li>)}</ul>
          </section>
        ))}
      </div>
    </div>
  );
}
