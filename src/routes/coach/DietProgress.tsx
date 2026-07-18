import { useParams } from 'react-router-dom';
import DietProgressView from '../../components/DietProgressView';
import BackButton from '../../components/BackButton';

export default function DietProgress() {
  const { playerId } = useParams<{ playerId: string }>();
  return <div className="stack"><div><BackButton /><h1>Diet Progress</h1></div>{playerId && <DietProgressView playerId={playerId} />}</div>;
}
