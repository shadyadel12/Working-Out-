import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applyMealPlan, getActiveMealPlanAssignment, listPublishedMealPlans } from '../../../api/nutritionLibrary';

export default function MealPlanApply({coachId,playerId,totalWeeks,currentWeek}:{coachId:string;playerId:string;totalWeeks:number;currentWeek:number}) {
  const qc=useQueryClient();const[planId,setPlanId]=useState('');const[startWeek,setStartWeek]=useState(currentWeek);
  const plans=useQuery({queryKey:['published-meal-plans',coachId],queryFn:()=>listPublishedMealPlans(coachId)});
  const active=useQuery({queryKey:['active-meal-plan',playerId],queryFn:()=>getActiveMealPlanAssignment(playerId)});
  const selected=plans.data?.find(plan=>plan.id===planId);const endWeek=startWeek+(selected?.weekCount??1)-1;const fits=endWeek<=totalWeeks;
  const apply=useMutation({mutationFn:()=>applyMealPlan(playerId,planId,startWeek),onSuccess:async()=>{await Promise.all([qc.invalidateQueries({queryKey:['diet',playerId]}),active.refetch()]);setPlanId('')}});
  return <section className="card stack meal-plan-apply">
    {active.data&&<div className="active-meal-plan"><span>{active.data.coverUrl?<img src={active.data.coverUrl} alt=""/>:<b>MP</b>}</span><div><small>Currently assigned</small><strong>{active.data.title}</strong><p>Week {active.data.startWeek}{active.data.endWeek>active.data.startWeek?`–${active.data.endWeek}`:''}</p></div></div>}
    <div><strong>Assign published meal plan</strong><p className="muted">Choose a template and the player’s starting program week. Its recipes will appear in Player → Diet.</p></div>
    <div className="meal-plan-apply-controls"><label>Meal plan<select value={planId} onChange={event=>setPlanId(event.target.value)}><option value="">Choose a published meal plan…</option>{(plans.data??[]).map(plan=><option value={plan.id} key={plan.id}>{plan.title} · {plan.weekCount} week{plan.weekCount===1?'':'s'}</option>)}</select></label><label>Starting week<select value={startWeek} onChange={event=>setStartWeek(Number(event.target.value))}>{Array.from({length:totalWeeks},(_,i)=>i+1).map(week=><option value={week} key={week}>Week {week}</option>)}</select></label><button disabled={!selected||!fits||apply.isPending} onClick={()=>{if(confirm(`Assign ${selected?.title} for Week ${startWeek}${endWeek>startWeek?` through Week ${endWeek}`:''}? Existing diet data in those weeks will be replaced.`))apply.mutate()}}>{apply.isPending?'Assigning…':'Assign meal plan'}</button></div>
    {selected&&<small className={fits?'muted':'error'}>{fits?`Player will receive ${selected.title} in Week ${startWeek}${endWeek>startWeek?`–${endWeek}`:''}.`:'This meal plan extends beyond the player’s subscription weeks.'}</small>}
    {plans.isSuccess&&plans.data.length===0&&<small className="muted">Publish a Meal Plan in the library before assigning it.</small>}{apply.isSuccess&&<span className="badge active">Meal plan assigned ✓</span>}{(plans.error||apply.error)&&<p className="error">{((plans.error||apply.error) as Error).message}</p>}
  </section>;
}
