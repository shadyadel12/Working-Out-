export const dayNames=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export const todayISO=()=>new Date().toISOString().slice(0,10);
export function currentProgramWeek(startedAt:string,maxWeek=Number.MAX_SAFE_INTEGER){const started=new Date(startedAt).getTime();if(Number.isNaN(started))return 1;return Math.min(Math.max(1,maxWeek),Math.floor(Math.max(0,Date.now()-started)/(7*24*60*60*1000))+1);}
