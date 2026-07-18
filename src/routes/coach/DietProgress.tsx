import { Link, useParams } from 'react-router-dom';
import DietProgressView from '../../components/DietProgressView';
export default function DietProgress() { const { playerId } = useParams<{ playerId: string }>(); return <div className="stack"><div><Link to="/coach/dashboard" className="muted">← Dashboard</Link><h1>Diet Progress</h1></div>{playerId && <DietProgressView playerId={playerId} />}</div>; }
