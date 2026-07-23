import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assignLibraryItem, cancelPlayerAssignment, listAssignableItems, type AssignmentType, type PlayerAssignment } from '../../../api/playerAssignments';

interface Props {
  type: AssignmentType;
  title: string;
  description: string;
  coachId: string;
  playerId: string;
  assignments: PlayerAssignment[];
}

export default function AssignmentSection({ type, title, description, coachId, playerId, assignments }: Props) {
  const qc = useQueryClient();
  const [itemId, setItemId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const items = useQuery({ queryKey: ['assignable-library', type, coachId], queryFn: () => listAssignableItems(type, coachId) });
  const refresh = () => qc.invalidateQueries({ queryKey: ['player-assignments', playerId] });
  const assign = useMutation({ mutationFn: () => assignLibraryItem(coachId, playerId, type, items.data!.find((item) => item.id === itemId)!, date), onSuccess: async () => { setItemId(''); await refresh(); } });
  const cancel = useMutation({ mutationFn: cancelPlayerAssignment, onSuccess: refresh });
  const rows = assignments.filter((assignment) => assignment.item_type === type);
  const empty = items.isSuccess && items.data.length === 0;

  return <section className="card assignment-section">
    <header className="assignment-section-header">
      <div><h2>{title}</h2><p>{description}</p></div>
      <span>{rows.length} assigned</span>
    </header>
    <div className="assignment-form">
      <label><span>Library item</span><select value={itemId} onChange={(event) => setItemId(event.target.value)} disabled={empty}><option value="">{empty ? `No published ${title.toLowerCase()}` : 'Choose a published item…'}</option>{(items.data ?? []).map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
      <label><span>Due date</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <button className="assignment-submit" disabled={!itemId || !date || assign.isPending} onClick={() => assign.mutate()}>{assign.isPending ? 'Assigning…' : `Assign ${title.replace(/s$/, '')}`}</button>
    </div>
    {empty && <div className="assignment-empty">Publish an item in the {title} library before assigning it.</div>}
    {rows.length > 0 && <div className="assignment-list">{rows.map((row) => <div className="assignment-row" key={row.id}><span><strong>{row.snapshot.title ?? title}</strong><small>Due {new Date(row.scheduled_for).toLocaleDateString()} · {row.status}</small></span><button className="secondary" disabled={cancel.isPending} onClick={() => cancel.mutate(row.id)}>Remove</button></div>)}</div>}
    {(items.error || assign.error || cancel.error) && <p className="error">{((items.error || assign.error || cancel.error) as Error).message}</p>}
  </section>;
}
