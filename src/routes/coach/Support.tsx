import { useAuth } from '../../auth/AuthContext';
import SupportChatWindow from '../../components/SupportChatWindow';

export default function CoachSupport() {
  const { session } = useAuth();
  const coachId = session!.user.id;

  return (
    <div className="stack">
      <div>
        <h1>Support</h1>
        <p className="muted" style={{ margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
          Chat directly with the admin team. You can send text, screenshots, images, or videos.
        </p>
      </div>
      <SupportChatWindow coachId={coachId} currentUserId={coachId} />
    </div>
  );
}
