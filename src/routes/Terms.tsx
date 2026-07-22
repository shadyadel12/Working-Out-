import { Link } from 'react-router-dom';

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
            All workout programs, logs, and personal data belong to the respective users.
            We do not sell or share your data with third parties.
          </p>
        </section>

        <section>
          <h2>4. Accounts &amp; Access</h2>
          <p>
            Access to this platform requires a valid subscription key issued by an administrator.
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

        <section>
          <h2>6. Changes to These Terms</h2>
          <p>
            We reserve the right to update these terms at any time. Continued use of the platform
            after changes constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2>7. Contact</h2>
          <p>
            For permissions or inquiries, contact us through your coach or platform administrator.
          </p>
        </section>
      </div>

      <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-muted, #888)' }}>
        © {year} Trainova. All rights reserved.
      </p>
    </div>
  );
}
