import AssignmentSection from './AssignmentSection'; import type { AssignmentProps } from './types';
export default function RecipeBookAssignments(props: AssignmentProps) { return <AssignmentSection {...props} type="recipe_book" title="Recipe Books" description="Collections of recipes shared with this player." />; }
