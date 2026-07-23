import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { assignLibraryItem, cancelPlayerAssignment, listAssignableItems, type AssignmentType, type PlayerAssignment } from '../../../api/playerAssignments';

export default function AssignmentSection({ type, title, description, coachId, playerId, assignments }: { type: AssignmentType; title: string; description: string; coachId: string; playerId: string; assignments: PlayerAssignment[] }) {
  const qc = useQueryClient(); const [itemId, setItemId] = useState(''); const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const items = useQuery({ queryKey: ['assignable-library', type, coachId], queryFn: () => listAssignableItems(type, coachId) });
  const refresh = () => qc.invalidateQueries({ queryKey: ['player-assignments', playerId] });
  const assign = useMutation({ mutationFn: () => assignLibraryItem(coachId, playerId, type, items.data!.find((item) => item.id === itemId)!, date), onSuccess: async () => { setItemId(''); await refresh(); } });
  const cancel = useMutation({ mutationFn: cancelPlayerAssignment, onSuccess: refresh });
  const rows = assignments.filter((assignment) => assignment.item_type === type);
  return <section className="card stack assignment-section"><div><h2>{title}</h2><p className="muted">{description}</p></div><div className="assignment-controls"><select aria-label={`Choose ${title}`} value={itemId} onChange={(event) => setItemId(event.target.value)}><option value="">Choose a published item…</option>{(items.data ?? []).map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select><input aria-label="Schedule date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /><button disabled={!itemId || !date || assign.isPending} onClick={() => assign.mutate()}>{assign.isPending ? 'Assigning…' : 'Assign'}</button></div>{items.isSuccess && items.data.length === 0 && <small className="muted">Publish an item in this library before assigning it.</small>}{rows.map((row) => <div className="assignment-row" key={row.id}><span><strong>{row.snapshot.title ?? title}</strong><small>{new Date(row.scheduled_for).toLocaleDateString()} · {row.status}</small></span><button className="danger" disabled={cancel.isPending} onClick={() => cancel.mutate(row.id)}>Remove</button></div>)}{(items.error || assign.error || cancel.error) && <p className="error">{((items.error || assign.error || cancel.error) as Error).message}</p>}</section>;
}

