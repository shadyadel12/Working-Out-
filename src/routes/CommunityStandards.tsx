import { SUPPORT_EMAIL } from '../config/legal';
import { LegalPage } from './Privacy';

export default function CommunityStandards() {
  return <LegalPage title="Trainova Community Standards" updated="24 July 2026">
    <p>These standards apply to public exercises, workouts, ingredients, recipes, meal plans, chats, support messages, and uploaded media.</p>
    <h2>Be safe and respectful</h2>
    <p>Do not post harassment, hateful or sexual content, graphic violence, threats, spam, scams, malicious links, dangerous fitness or nutrition instructions, illegal material, or content that exposes another person's private information. Do not encourage users to ignore medical advice or warning symptoms.</p>
    <h2>Own what you publish</h2>
    <p>Publish only original content, content you are licensed to use, or a lawful link. Third-party material must include an accurate source, license, and attribution. Public copies preserve provenance. Copyright owners can send a takedown notice identifying the work, location, contact details, good-faith statement, and authority to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
    <h2>Fitness responsibility</h2>
    <p>Describe exercises and nutrition accurately, include material safety context, and do not present coaching content as medical diagnosis or emergency advice.</p>
    <h2>Reports and enforcement</h2>
    <p>Users can report content and block public creators. Trainova may quarantine, hide, remove, restore, or restrict accounts. Urgent safety reports are targeted for review within 24 hours and normal reports within 72 hours. Records needed for safety and appeals may be retained. Contact emergency services for immediate danger.</p>
  </LegalPage>;
}
