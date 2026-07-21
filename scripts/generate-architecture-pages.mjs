import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const repo = process.cwd();
const outputs = [join(repo, 'public', 'architecture'), join(repo, 'docs', 'architecture')];

const web = [
  ['public','landing','Landing','/','src/routes/Landing.tsx',['Auth context'],['profiles'],['coach-login','player-login']],
  ['public','terms','Terms','/terms','src/routes/Terms.tsx',[],[],['landing']],
  ['public','changelog','Changelog','/changelog','src/routes/Changelog.tsx',[],[],['landing']],
  ['public','design-preview','Design preview','/design-preview/:view','src/routes/DesignPreview.tsx',['Design system'],[],[]],
  ['auth','coach-login','Coach login','/login/coach','src/routes/auth/CoachLogin.tsx',['signIn','signOut','getMyProfile'],['Supabase Auth','profiles'],['coach-signup']],
  ['auth','player-login','Player login','/login/player','src/routes/auth/PlayerLogin.tsx',['signIn','signOut','getMyProfile'],['Supabase Auth','profiles'],['player-signup']],
  ['auth','admin-login','Administrator login','/login/admin','src/routes/auth/AdminLogin.tsx',['signIn','Administrator MFA'],['Supabase Auth','profiles'],[]],
  ['auth','coach-signup','Coach registration','/signup/coach','src/routes/auth/CoachSignup.tsx',['signUp','signIn','checkCoachKey','claimCoachKey','checkTeamInvite','claimTeamInvite'],['Supabase Auth','coach_keys','coach_team_invites'],['coach-login']],
  ['auth','player-signup','Player registration','/signup/player','src/routes/auth/PlayerSignup.tsx',['signUp','signIn','checkSubscriptionKey','claimSubscriptionKey'],['Supabase Auth','coach_player_links'],['player-login']],
  ['coach','dashboard','Dashboard','/coach/dashboard','src/routes/coach/Dashboard.tsx',['listCheckupsForDate','listCoachChatThreads','listPlayerActivitySummaries','listPlayersForCoach','isSubscriptionActive'],['coach_player_links','checkups','chat_messages','exercise_logs'],['player-profile','checkups','messages']],
  ['coach','player-profile','Player profile','/coach/players/:playerId','src/routes/coach/PlayerProfile.tsx',['getPlayerForCoach','getProgressPage','listDietLogs','listProgramDays','getPlayerCoachingProfile','savePlayerCoachingProfile','getPlayerDetails'],['profiles','player_details','player_coaching_profiles','program_days','exercise_logs','diet_logs'],['dashboard','program-builder','diet-builder','player-analysis','player-chat']],
  ['coach','program-builder','Program builder','/coach/players/:playerId/program','src/routes/coach/ProgramBuilder.tsx',['getPlayerForCoach','listProgramDays','duplicateWeek','assignProgramTemplateToPlayer','listProgramTemplates'],['program_days','workouts','exercises','program_templates','program_deliveries'],['player-profile','program-library','workout-library']],
  ['coach','diet-builder','Diet builder','/coach/players/:playerId/diet','src/routes/coach/Diet.tsx',['getPlayerForCoach','listDietDays','upsertDietDay','duplicateDietWeek','assignDietTemplate'],['diet_days','coach_foods','diet_templates'],['player-profile','diet-progress','meal-plan-library']],
  ['coach','player-analysis','Player analysis','/coach/players/:playerId/analysis','src/routes/coach/PlayerAnalysis.tsx',['getPlayerForCoach','getProgressOptions','getProgressPage'],['exercise_logs','set_logs','workouts','exercises'],['player-profile','program-builder']],
  ['coach','diet-progress','Diet progress','/coach/players/:playerId/diet-progress','src/routes/coach/DietProgress.tsx',['getPlayerForCoach','listDietLogs'],['diet_logs','diet_days'],['player-profile','diet-builder']],
  ['coach','exercise-guidance','Exercise guidance','/coach/players/:playerId/messages','src/routes/coach/Messages.tsx',['listProgramDays','listWorkouts','listExercises','listMessagesForPlayer','sendMessage','deleteMessage'],['program_days','workouts','exercises','messages'],['player-profile','program-builder']],
  ['coach','player-chat','Player chat','/coach/players/:playerId/chat','src/routes/coach/Chat.tsx',['getPlayerForCoach','markCoachThreadRead','listChatMessages','sendChatMessage','uploadChatAttachment','uploadChatVoice'],['chat_messages','private_files','Realtime','Cloudflare R2'],['player-profile','messages']],
  ['coach','messages','Message inbox','/coach/messages','src/routes/coach/ChatInbox.tsx',['listCoachChatThreads','listPlayersForCoach','subscribeToChatMessages'],['chat_messages','coach_player_links','Realtime'],['player-chat','dashboard']],
  ['coach','checkups','Check-ups','/coach/checkups','src/routes/coach/Checkups.tsx',['listPlayersForCoach','listCheckupsForDate','setCheckup'],['coach_player_links','checkups'],['dashboard','player-profile']],
  ['coach','exercise-library','Exercise library','/coach/exercise-library','src/routes/coach/ExerciseLibrary.tsx',['listLibraryExercises','createLibraryExercise','updateLibraryExercise','deleteLibraryExercise'],['exercise_library','library_audit_events'],['workout-library','program-builder']],
  ['coach','workout-library','Workout library','/coach/workout-library','src/routes/coach/WorkoutLibrary.tsx',['listWorkoutTemplates','listWorkoutSections','getWorkoutTemplate','saveWorkoutBlueprint','duplicateWorkoutTemplate','publishWorkoutTemplate','deleteWorkoutTemplate'],['workout_templates','workout_sections','catalog_revisions'],['exercise-library','section-library','program-library']],
  ['coach','section-library','Section library','/coach/section-library','src/routes/coach/LibraryCatalog.tsx',['listCoachLibraryItems','saveCoachLibraryItem','publishCoachLibraryItem','archiveCoachLibraryItem'],['workout_sections','workout_section_exercises'],['workout-library']],
  ['coach','program-library','Program library','/coach/program-library','src/routes/coach/ProgramLibrary.tsx',['listProgramTemplates','getProgramSchedule','saveProgramTemplate','duplicateProgramTemplate','deleteProgramTemplate'],['program_templates','program_template_days','program_template_day_workouts'],['workout-library','program-builder']],
  ['coach','task-library','Task library','/coach/task-library','src/routes/coach/LibraryCatalog.tsx',['listCoachLibraryItems','saveCoachLibraryItem','publishCoachLibraryItem'],['coaching_tasks','scheduled_coaching_items'],['form-library','metric-group-library']],
  ['coach','form-library','Form library','/coach/form-library','src/routes/coach/LibraryCatalog.tsx',['listCoachLibraryItems','listLibraryRelations','addLibraryRelation'],['coach_forms','form_questions','form_responses','form_answers'],['task-library']],
  ['coach','meal-plan-library','Meal-plan library','/coach/meal-plan-library','src/routes/coach/LibraryCatalog.tsx',['listCoachLibraryItems','saveCoachLibraryItem','publishCoachLibraryItem'],['menu_templates','menu_entries'],['recipe-library','ingredient-library','diet-builder']],
  ['coach','recipe-library','Recipe library','/coach/recipe-library','src/routes/coach/LibraryCatalog.tsx',['listCoachLibraryItems','listLibraryRelations','addLibraryRelation'],['dishes','dish_components'],['ingredient-library','recipe-book-library']],
  ['coach','ingredient-library','Ingredient library','/coach/ingredient-library','src/routes/coach/LibraryCatalog.tsx',['listCoachLibraryItems','saveCoachLibraryItem'],['food_items'],['recipe-library','meal-plan-library']],
  ['coach','recipe-book-library','Recipe-book library','/coach/recipe-book-library','src/routes/coach/LibraryCatalog.tsx',['listCoachLibraryItems','listLibraryRelations'],['dish_collections','collection_dishes'],['recipe-library']],
  ['coach','metric-group-library','Metric-group library','/coach/metric-group-library','src/routes/coach/LibraryCatalog.tsx',['listCoachLibraryItems','createMeasurementForGroup','addLibraryRelation'],['measurements','measurement_groups','measurement_group_items','measurement_observations'],['task-library','player-analysis']],
  ['coach','team','Coach team','/coach/team','src/routes/coach/Team.tsx',['listTeamInvites','createTeamInvite','listTeamMembers','assignTeamClient','revokeTeamMember'],['coach_team_invites','coach_team_members','coach_team_assignments'],['player-profile','subscriptions']],
  ['coach','subscriptions','Subscriptions','/coach/subs','src/routes/coach/Subs.tsx',['coachCreatePlayerKey','coachCreateUnclaimedKey','listPlayersForCoach'],['coach_player_links'],['player-profile','team']],
  ['coach','settings','Settings','/coach/settings','src/routes/coach/Settings.tsx',['generateXlsxTemplate','importFromXlsx','generateDietXlsxTemplate','importDietFromXlsx'],['replace_program_import','replace_diet_import'],['program-builder','diet-builder']],
  ['coach','support','Administrator support','/coach/support','src/routes/coach/Support.tsx',['listAdminMessages','sendAdminMessage','uploadSupportAttachment','subscribeToAdminMessages'],['admin_messages','private_files','Realtime','Cloudflare R2'],['dashboard']],
  ['player','program','Program','/player/program','src/routes/player/Program.tsx',['listProgramDays','listWorkouts','listExercises','getLog','upsertLog','replaceSetLogs','confirmWorkout'],['program_days','workouts','exercises','exercise_logs','set_logs','private_files'],['progress','chat']],
  ['player','diet','Diet','/player/diet','src/routes/player/Diet.tsx',['getActivePlayerLink','listDietDays','saveDietLog'],['diet_days','diet_logs'],['diet-progress']],
  ['player','progress','Workout progress','/player/analysis','src/routes/player/Analysis.tsx',['getProgressOptions','getProgressPage'],['exercise_logs','set_logs'],['program']],
  ['player','diet-progress','Diet progress','/player/diet-progress','src/routes/player/DietProgress.tsx',['listDietLogs'],['diet_logs','diet_days'],['diet']],
  ['player','chat','Coach chat','/player/chat','src/routes/player/Chat.tsx',['listChatMessages','sendChatMessage','uploadChatAttachment','uploadChatVoice'],['chat_messages','private_files','Realtime','Cloudflare R2'],['program']],
  ['player','profile','My profile','/player/profile','src/routes/player/Profile.tsx',['getPlayerDetails','savePlayerDetails'],['player_details','profiles'],['program']],
  ['player','blocked','Renew access','/player/blocked','src/routes/player/Blocked.tsx',['validateSubscriptionKey'],['coach_player_links'],['program']],
  ['admin','users-keys','Users & keys','/admin/coaches','src/routes/admin/Coaches.tsx',['listCoaches','listAllKeys','listCoachKeys','adminCreateCoachKey','adminRevokeCoachKey','adminCreateKey','adminUpdateKey'],['profiles','coach_keys','coach_player_links'],['support']],
  ['admin','support','Support inbox','/admin/support','src/routes/admin/Support.tsx',['listCoaches','listCoachThreadSummaries','subscribeToAllAdminMessages'],['admin_messages','profiles','Realtime','private_files'],['users-keys']]
];

const mobile = [
  ['shared','login','Login','Root: signed out','mobile/src/screens/LoginScreen.tsx',['Supabase Auth','AuthProvider'],['profiles'],['terms','updates']],
  ['shared','mfa','Administrator MFA','Root: MFA required','mobile/src/screens/MfaScreen.tsx',['Supabase AAL2/TOTP','AuthProvider'],['Supabase Auth'],['login']],
  ['shared','renew-subscription','Renew subscription','Root: inactive player','mobile/src/screens/RenewSubscriptionScreen.tsx',['validateSubscriptionKey'],['coach_player_links'],['login']],
  ['shared','terms','Terms','Public legal screen','mobile/src/screens/LegalUpdatesScreen.tsx',[],[],['login']],
  ['shared','updates','Updates','Public changelog screen','mobile/src/screens/LegalUpdatesScreen.tsx',[],[],['login']],
  ['player','home','Player home','Player tab: Home','mobile/src/screens/player/PlayerHomeScreen.tsx',['AuthProvider','getActivePlayerLink'],['profiles','coach_player_links'],['program','diet']],
  ['player','program','Program','Player tab: Program','mobile/src/screens/player/ProgramScreen.tsx',['getProgram','getTodayLog','saveTodayLog','uploadPrivateUri','deletePrivateFile'],['program_days','workouts','exercises','exercise_logs','set_logs','private_files','Cloudflare R2'],['home','progress','coach-chat']],
  ['player','diet','Diet','Player tab: Diet','mobile/src/screens/player/DietScreen.tsx',['getDiet','saveDietCheckin'],['diet_days','diet_logs'],['home','progress']],
  ['player','progress','Progress','Player tab: Progress','mobile/src/screens/player/PlayerProgressScreen.tsx',['getProgressPage','getPrivateFileUrl'],['exercise_logs','set_logs','private_files'],['program','diet']],
  ['player','coach-chat','Coach chat','Player tab: Coach','mobile/src/screens/SharedScreens.tsx',['list messages','send message','uploadPrivateUri','getPrivateFileUrl'],['chat_messages','private_files','Realtime','Cloudflare R2'],['program']],
  ['coach','people','People','Coach tab: People','mobile/src/screens/coach/PlayersScreen.tsx',['Supabase client','player filters','subscription actions'],['profiles','player_details','coach_player_links'],['dashboard','client-programming']],
  ['coach','client-programming','Client programming','Build → Client programming','mobile/src/screens/coach/CoachPlanScreen.tsx',['Supabase client','importProgramWorkbook','importDietWorkbook'],['program_days','workouts','exercises','diet_days'],['people','program-library']],
  ['coach','exercise-library','Exercise library','Build → Exercises','mobile/src/screens/coach/CoachLibraries.tsx',['Supabase client'],['exercise_library'],['workout-library']],
  ['coach','workout-library','Workout library','Build → Workouts','mobile/src/screens/coach/CoachLibraries.tsx',['Supabase client'],['workout_templates','workout_template_exercises'],['exercise-library','program-library']],
  ['coach','program-library','Program library','Build → Programs','mobile/src/screens/coach/ProgramLibrary.tsx',['Supabase client'],['program_templates','program_template_days'],['workout-library','client-programming']],
  ['coach','diet-library','Diet templates','Build → Diet templates','mobile/src/screens/coach/CoachLibraries.tsx',['Supabase client'],['diet_templates'],['client-programming']],
  ['coach','messages','Messages','Coach tab: Messages','mobile/src/screens/SharedScreens.tsx',['Supabase client','uploadPrivateUri'],['chat_messages','private_files','Realtime'],['people','alerts']],
  ['coach','alerts','Alerts','Coach tab: Alerts','mobile/src/screens/coach/CoachAlertsScreen.tsx',['Supabase client'],['chat_messages','checkups','exercise_logs'],['dashboard','messages']],
  ['coach','dashboard','Command center','Settings → Command center','mobile/src/screens/coach/CoachDashboardScreen.tsx',['Supabase client','priority queue'],['coach_player_links','checkups','chat_messages','exercise_logs'],['people','alerts','checkups']],
  ['coach','checkups','Daily check-ups','Settings → Daily check-ups','mobile/src/screens/coach/CoachCheckupsScreen.tsx',['Supabase client'],['checkups','coach_player_links'],['dashboard','people']],
  ['coach','team','Coach team','Settings → Coach team','mobile/src/screens/coach/CoachTeam.tsx',['Supabase client'],['coach_team_invites','coach_team_members','coach_team_assignments'],['people']],
  ['coach','support','Administrator support','Settings → Admin support','mobile/src/screens/coach/CoachSupportScreen.tsx',['Supabase client'],['admin_messages','Realtime'],['coach-tools']],
  ['coach','appearance','Appearance','Settings → Appearance','mobile/src/screens/coach/AppearanceSettingsScreen.tsx',['MobileThemeProvider','AsyncStorage'],['Local preferences'],['coach-tools']],
  ['coach','coach-tools','Coach tools','Settings → Coach tools','mobile/src/screens/coach/CoachMoreActiveScreen.tsx',['AuthProvider','Secure Store'],['Supabase Auth','Local preferences'],['appearance','support']],
  ['admin','overview','Overview','Administrator tab: Overview','mobile/src/screens/admin/AdminOverviewScreen.tsx',['Supabase client'],['profiles','coach_keys','coach_player_links','admin_messages'],['users-keys','support']],
  ['admin','users-keys','Users & keys','Administrator tab: Users & Keys','mobile/src/screens/admin/AdminManagementScreen.tsx',['Supabase client','administrator RPCs'],['profiles','coach_keys','coach_player_links'],['overview']],
  ['admin','support','Support','Administrator tab: Support','mobile/src/screens/admin/AdminSupportScreen.tsx',['Supabase client'],['admin_messages','Realtime'],['overview']],
  ['admin','account','Account','Administrator tab: Account','mobile/src/screens/SharedScreens.tsx',['AuthProvider','sign out'],['Supabase Auth'],['overview']]
];

const slugTitle = value => value.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const esc = value => String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const pagePath = (platform, role, slug) => `${platform}/${role}/${slug}.html`;

function pageHtml({platform, role, slug, title, route, source, services, data, related}) {
  const current = pagePath(platform, role, slug);
  const rootHref = relative(dirname(current), 'index.html').replaceAll('\\','/') || 'index.html';
  const platformHref = relative(dirname(current), `${platform}/index.html`).replaceAll('\\','/');
  const roleHref = relative(dirname(current), `${platform}/${role}/index.html`).replaceAll('\\','/');
  const relatedHref = targetSlug => {
    const target = all.find(item => item[0] === platform && item[2] === targetSlug);
    return target ? relative(dirname(current), pagePath(target[0],target[1],target[2])).replaceAll('\\','/') : '#';
  };
  const lanes = [
    {key:'page',title:'Screen',items:[{id:'screen',label:title,detail:route}]},
    {key:'source',title:'Source',items:[{id:'source',label:source.split('/').at(-1),detail:source}]},
    {key:'service',title:'Services & actions',items:services.map((label,index)=>({id:`service-${index}`,label,detail:'Application service or action'}))},
    {key:'data',title:'Data & platform',items:data.map((label,index)=>({id:`data-${index}`,label,detail:'Database, storage, authentication, or realtime dependency'}))}
  ].filter(lane => lane.items.length);
  const edges = [['screen','source'],...services.map((_,index)=>['source',`service-${index}`]),...data.flatMap((_,dataIndex)=>services.length ? services.map((__,serviceIndex)=>[`service-${serviceIndex}`,`data-${dataIndex}`]) : [['source',`data-${dataIndex}`]])];
  const laneMarkup = lanes.map(lane => `<section class="lane" data-lane="${lane.key}"><h2>${esc(lane.title)}</h2>${lane.items.map(item => `<button type="button" class="node" data-id="${item.id}" data-title="${esc(item.label)}" data-detail="${esc(item.detail)}">${esc(item.label)}</button>`).join('')}</section>`).join('');
  const relatedMarkup = related.length ? `<nav class="related" aria-label="Related screens"><span>Related</span>${related.map(item=>`<a href="${relatedHref(item)}">${esc(slugTitle(item))}</a>`).join('')}</nav>` : '';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · PulseFit architecture</title>
<style>
:root{color-scheme:light dark;--bg:light-dark(#f8fafc,#111827);--fg:light-dark(#172033,#f8fafc);--muted:light-dark(#64748b,#9ca3af);--surface:light-dark(#fff,#1f2937);--line:light-dark(#cbd5e1,#475569);--active:light-dark(#2563eb,#60a5fa);--lane1:light-dark(#e0f2fe,#172554);--lane2:light-dark(#fef3c7,#422006);--lane3:light-dark(#dcfce7,#052e16);--lane4:light-dark(#fce7f3,#3b0a24)}*{box-sizing:border-box}body{margin:0;padding:clamp(14px,3vw,32px);background:var(--bg);color:var(--fg);font:14px/1.45 system-ui,sans-serif}main{max-width:1400px;margin:auto}.crumbs,.related{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.crumbs a,.related a{color:var(--fg);text-decoration:none;padding:7px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}.crumbs span,.related span{color:var(--muted)}header{margin:22px 0 18px}h1{font-size:clamp(24px,4vw,40px);margin:0 0 6px}header p{margin:0;color:var(--muted)}.selection{display:grid;grid-template-columns:minmax(150px,.5fr) minmax(220px,1.5fr);gap:14px;padding:14px 16px;background:var(--surface);border:1px solid var(--line);border-radius:14px;margin-bottom:18px}.selection strong,.selection code{overflow-wrap:anywhere}.selection span{color:var(--muted)}.map{position:relative;min-height:280px}.links{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none;overflow:visible}.link{fill:none;stroke:var(--line);stroke-width:1.4;transition:.18s}.link.on{stroke:var(--active);stroke-width:2.5}.link.off{opacity:.12}.lanes{position:relative;z-index:2;display:grid;grid-template-columns:repeat(${lanes.length},minmax(0,1fr));gap:24px}.lane{display:grid;align-content:start;gap:10px}.lane h2{text-align:center;font-size:16px;color:var(--muted);margin:0 0 4px}.node{width:100%;min-height:44px;padding:10px;border:1px solid transparent;border-radius:11px;color:var(--fg);font:inherit;cursor:pointer;overflow-wrap:anywhere}.lane[data-lane=page] .node{background:var(--lane1)}.lane[data-lane=source] .node{background:var(--lane2)}.lane[data-lane=service] .node{background:var(--lane3)}.lane[data-lane=data] .node{background:var(--lane4)}.node[aria-pressed=true]{border-color:var(--active)}.related{margin-top:20px}@media(max-width:700px){.selection{grid-template-columns:1fr}.lanes{grid-template-columns:repeat(2,minmax(0,1fr))}.map{min-height:520px}}@media(max-width:390px){.lanes{grid-template-columns:1fr}.map{min-height:780px}}
</style></head><body><main>
<nav class="crumbs" aria-label="Breadcrumb"><a href="${rootHref}">Atlas</a><span>›</span><a href="${platformHref}">${esc(slugTitle(platform))}</a><span>›</span><a href="${roleHref}">${esc(slugTitle(role))}</a><span>›</span><span>${esc(title)}</span></nav>
<header><h1>${esc(title)}</h1><p>${esc(route)} · ${esc(source)}</p></header>
<section class="selection" aria-live="polite"><strong data-selected>${esc(title)}</strong><span data-detail>${esc(route)}</span></section>
<div class="map"><svg class="links" aria-hidden="true"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker></defs></svg><div class="lanes">${laneMarkup}</div></div>
${relatedMarkup}
</main><script>
const map=document.querySelector('.map'),svg=document.querySelector('.links'),nodes=new Map([...document.querySelectorAll('.node')].map(n=>[n.dataset.id,n]));const edges=${JSON.stringify(edges)},paths=[];
function point(n,side){const a=n.getBoundingClientRect(),b=map.getBoundingClientRect();return{x:(side==='left'?a.left:a.right)-b.left,y:a.top+a.height/2-b.top}}
function draw(){const b=map.getBoundingClientRect();svg.setAttribute('viewBox','0 0 '+Math.max(1,b.width)+' '+Math.max(1,b.height));edges.forEach(([a,b],i)=>{const x=nodes.get(a),y=nodes.get(b);if(!x||!y)return;const s=point(x,'right'),e=point(y,'left'),bend=Math.max(20,Math.abs(e.x-s.x)*.42);let p=paths[i];if(!p){p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('class','link');p.setAttribute('marker-end','url(#arrow)');p.dataset.from=a;p.dataset.to=b;svg.appendChild(p);paths[i]=p}p.setAttribute('d','M '+s.x+' '+s.y+' C '+(s.x+bend)+' '+s.y+', '+(e.x-bend)+' '+e.y+', '+e.x+' '+e.y)})}
nodes.forEach(n=>n.addEventListener('click',()=>{nodes.forEach(x=>x.setAttribute('aria-pressed',String(x===n)));document.querySelector('[data-selected]').textContent=n.dataset.title;document.querySelector('[data-detail]').textContent=n.dataset.detail;paths.forEach(p=>{const on=p.dataset.from===n.dataset.id||p.dataset.to===n.dataset.id;p.classList.toggle('on',on);p.classList.toggle('off',!on)})}));new ResizeObserver(draw).observe(map);requestAnimationFrame(()=>{draw();nodes.get('screen').click()});
</script></body></html>`;
}

function hubHtml(title, subtitle, crumbs, cards, currentPath) {
  const links = cards.map((card,index)=>`<a class="node" data-id="n${index}" href="${card.href}">${esc(card.title)}</a>`).join('');
  const edges = cards.map((_,index)=>['root',`n${index}`]);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · PulseFit architecture</title><style>:root{color-scheme:light dark;--bg:light-dark(#f8fafc,#111827);--fg:light-dark(#172033,#f8fafc);--muted:light-dark(#64748b,#9ca3af);--surface:light-dark(#fff,#1f2937);--line:light-dark(#cbd5e1,#475569);--active:light-dark(#2563eb,#60a5fa)}*{box-sizing:border-box}body{margin:0;padding:clamp(14px,3vw,32px);background:var(--bg);color:var(--fg);font:14px/1.45 system-ui,sans-serif}main{max-width:1200px;margin:auto}.crumbs{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.crumbs a{color:var(--fg);text-decoration:none;padding:7px 10px;border:1px solid var(--line);border-radius:10px;background:var(--surface)}.crumbs span,header p{color:var(--muted)}header{margin:22px 0}h1{font-size:clamp(26px,4vw,42px);margin:0 0 6px}.map{position:relative;min-height:340px}.links{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}.link{fill:none;stroke:var(--line);stroke-width:1.4}.grid{position:relative;z-index:2;display:grid;grid-template-columns:minmax(160px,.3fr) minmax(0,1fr);gap:32px;align-items:center}.children{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.node{display:flex;align-items:center;justify-content:center;min-height:48px;padding:10px;border-radius:12px;background:var(--surface);border:1px solid var(--line);color:var(--fg);text-align:center;text-decoration:none}.root{background:color-mix(in srgb,var(--active) 15%,var(--surface))}@media(max-width:600px){.grid{grid-template-columns:1fr}.map{min-height:620px}}</style></head><body><main><nav class="crumbs">${crumbs}</nav><header><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></header><div class="map"><svg class="links"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker></defs></svg><div class="grid"><div class="node root" data-id="root">${esc(title)}</div><div class="children">${links}</div></div></div></main><script>const map=document.querySelector('.map'),svg=document.querySelector('.links'),nodes=new Map([...document.querySelectorAll('[data-id]')].map(n=>[n.dataset.id,n]));const edges=${JSON.stringify(edges)};function p(n,s){const a=n.getBoundingClientRect(),b=map.getBoundingClientRect();return{x:(s==='left'?a.left:a.right)-b.left,y:a.top+a.height/2-b.top}}function draw(){svg.querySelectorAll('.link').forEach(x=>x.remove());const b=map.getBoundingClientRect();svg.setAttribute('viewBox','0 0 '+b.width+' '+b.height);edges.forEach(([a,b])=>{const s=p(nodes.get(a),'right'),e=p(nodes.get(b),'left'),d=Math.max(24,(e.x-s.x)*.4),x=document.createElementNS('http://www.w3.org/2000/svg','path');x.setAttribute('class','link');x.setAttribute('marker-end','url(#arrow)');x.setAttribute('d','M '+s.x+' '+s.y+' C '+(s.x+d)+' '+s.y+', '+(e.x-d)+' '+e.y+', '+e.x+' '+e.y);svg.appendChild(x)})}new ResizeObserver(draw).observe(map);requestAnimationFrame(draw)</script></body></html>`;
}

const all = [...web.map(x=>['web',...x]), ...mobile.map(x=>['mobile',...x])];
for (const output of outputs) {
  mkdirSync(output,{recursive:true});
  for (const [platform,role,slug,title,route,source,services,data,related] of all) {
    const target=join(output,pagePath(platform,role,slug));
    mkdirSync(dirname(target),{recursive:true});
    writeFileSync(target,pageHtml({platform,role,slug,title,route,source,services,data,related}));
  }
  const rootCards=['web','mobile'].map(platform=>({title:slugTitle(platform),href:`${platform}/index.html`}));
  writeFileSync(join(output,'index.html'),hubHtml('Project screens','Every screen is an individual dependency map.','<span>Atlas</span>',rootCards,'index.html'));
  for (const platform of ['web','mobile']) {
    const roles=[...new Set(all.filter(x=>x[0]===platform).map(x=>x[1]))];
    const cards=roles.map(role=>({title:slugTitle(role),href:`${role}/index.html`}));
    writeFileSync(join(output,platform,'index.html'),hubHtml(`${slugTitle(platform)} screens`,'Choose a screen group.','<a href="../index.html">Atlas</a><span>›</span><span>'+slugTitle(platform)+'</span>',cards,`${platform}/index.html`));
    for (const role of roles) {
      const pages=all.filter(x=>x[0]===platform&&x[1]===role);
      const cards=pages.map(x=>({title:x[3],href:`${x[2]}.html`}));
      writeFileSync(join(output,platform,role,'index.html'),hubHtml(`${slugTitle(role)} screens`,`${slugTitle(platform)} · ${pages.length} individual page maps`,'<a href="../../index.html">Atlas</a><span>›</span><a href="../index.html">'+slugTitle(platform)+'</a><span>›</span><span>'+slugTitle(role)+'</span>',cards,`${platform}/${role}/index.html`));
    }
  }
}

console.log(`Generated ${all.length} individual page maps plus hierarchy indexes in ${outputs.length} destinations.`);
