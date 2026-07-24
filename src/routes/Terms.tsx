import { Link } from 'react-router-dom';
import { COMMUNITY_STANDARDS_URL, PRIVACY_URL, SUPPORT_EMAIL, SUPPORT_URL } from '../config/legal';

export default function Terms() {
  const year = new Date().getFullYear();
  return (
    <div className="container" style={{ maxWidth: 720, padding: '2rem 1rem' }}>
      <Link to="/" className="muted" style={{ fontSize: '0.85rem' }}>← Back</Link>
      <h1 style={{ marginTop: '1rem' }}>Terms of Use</h1>
      <p className="muted" style={{ fontSize: '0.85rem' }}>Last updated: July {year}</p>

      <div className="stack" style={{ marginTop: '1.5rem', lineHeight: 1.7 }}>
        <section>
          <h2>1. Ownership &amp; Copyright</h2>
          <p>
            All content, design, code, graphics, and features of this platform are the exclusive
            intellectual property of Trainova and are protected under applicable copyright
            laws. © {year} Trainova. All rights reserved.
          </p>
        </section>

        <section>
          <h2>2. Prohibited Actions</h2>
          <p>You may not, without prior written permission:</p>
          <ul>
            <li>Copy, reproduce, or redistribute any part of this platform</li>
            <li>Reverse-engineer, decompile, or rebuild this platform or any portion of it</li>
            <li>Use automated tools (including AI) to replicate the platform's design, features, or code</li>
            <li>Scrape, crawl, or systematically extract content or data from this platform</li>
            <li>Resell or sublicense access to this platform or its content</li>
          </ul>
        </section>

        <section>
          <h2>3. User Data</h2>
          <p>
            Users retain rights in their own content. Trainova does not sell personal data. We use
            service providers such as Supabase, Cloudflare/R2, Vercel, Expo/EAS, and VirusTotal where
            applicable to operate and secure the service. Their access is limited to processing for
            those purposes. See the <a href={PRIVACY_URL}>Privacy Policy</a>.
          </p>
        </section>

        <section>
          <h2>4. Accounts &amp; Access</h2>
          <p>
            Access to coaching requires a valid coaching access key issued by an administrator or coach.
            Sharing, transferring, or selling your account or key is strictly prohibited.
          </p>
        </section>

        <section>
          <h2>5. Disclaimer</h2>
          <p>
            This platform is provided for fitness coaching and informational purposes only.
            Always consult a qualified medical professional before starting any exercise program.
          </p>
        </section>

        <section><h2>6. Public content and conduct</h2><p>Public catalog publishers confirm that content is original, licensed, or lawfully linked and provide required attribution. Users must follow the <a href={COMMUNITY_STANDARDS_URL}>Community Standards</a>. Trainova may filter, quarantine, hide, remove, restore, or investigate content and accounts to protect users and rights holders.</p></section>

        <section>
          <h2>7. Changes to These Terms</h2>
          <p>
            We reserve the right to update these terms at any time. Continued use of the platform
            after changes constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2>8. Contact</h2>
          <p>
            Support, privacy, and copyright/takedown inquiries: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Public support: <a href={SUPPORT_URL}>{SUPPORT_URL}</a>.
          </p>
        </section>
      </div>

      <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-muted, #888)' }}>
        © {year} Trainova. All rights reserved.
      </p>
    </div>
  );
}
