import AssignmentSection from './AssignmentSection'; import type { AssignmentProps } from './types';
export default function MetricGroupAssignments(props: AssignmentProps) { return <AssignmentSection {...props} type="metric_group" title="Metric Groups" description="Measurement check-ins such as weight and body measurements." />; }
