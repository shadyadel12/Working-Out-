import { useAuth } from '../../auth/AuthContext';
import DietProgressView from '../../components/DietProgressView';
export default function DietProgress() { const { session } = useAuth(); return <div className="stack"><h1>Diet Progress</h1><DietProgressView playerId={session!.user.id} /></div>; }
