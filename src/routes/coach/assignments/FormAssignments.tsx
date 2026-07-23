import AssignmentSection from './AssignmentSection'; import type { AssignmentProps } from './types';
export default function FormAssignments(props: AssignmentProps) { return <AssignmentSection {...props} type="form" title="Forms" description="Questionnaires and check-ins for the player." />; }
