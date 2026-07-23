import AssignmentSection from './AssignmentSection'; import type { AssignmentProps } from './types';
export default function MealPlanAssignments(props: AssignmentProps) { return <AssignmentSection {...props} type="meal_plan" title="Meal Plans" description="Reusable nutrition schedules built from recipes." />; }
