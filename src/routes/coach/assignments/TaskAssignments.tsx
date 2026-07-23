import AssignmentSection from './AssignmentSection'; import type { AssignmentProps } from './types';
export default function TaskAssignments(props: AssignmentProps) { return <AssignmentSection {...props} type="task" title="Tasks" description="Actions and reminders the player should complete." />; }
