# Website design preview decisions

## Audit summary

- Framework: React 18 + TypeScript + Vite 6.
- Routing: React Router 6 with public, coach, player, and admin route groups.
- UI/CSS: repository-owned React components and one global stylesheet; no component library or Tailwind runtime.
- Data/auth: Supabase with React Query for server state, role guards, active-subscription checks, and MFA handling.
- Localization: a persistent English/Arabic provider that sets document `lang` and `dir`, plus DOM text translation.
- Current feature modules: client management and profiles, training/programming, exercise/workout/program libraries, diet and diet progress, analysis/progress, check-ups, chat/support, teams, subscriptions, settings, and admin management.
- Existing UI surfaces include dashboards, dense tables, responsive cards, builders, forms, modals, drawers, accordions, chat timelines, loading skeletons, empty states, error states, and pagination/filter controls.

## Preview scope

- Added isolated public routes at `/design-preview/dashboard` and `/design-preview/library` so existing product routes and behavior are unchanged.
- Preview data is synthetic and read-only. No Supabase queries or mutations are performed.
- The dashboard represents real existing coach signals: attention, active clients, completion, messages, check-ins, programs, workouts, and invitations.
- The list preview represents the existing exercise library rather than inventing a new product area.

## Architecture decisions

- Canonical tokens live in `src/design-system/tokens.css` and match the supplied values exactly.
- Lucide icons are exposed only through `icon-registry.tsx`; preview pages do not import individual icons.
- Feature color pairing is centralized in `feature-theme.ts`.
- Preview primitives are deliberately small and composable: page header, feature icon, metric card, status badge, icon button, and search field.
- Existing global CSS remains untouched for this approval phase. The preview stylesheet is scoped under `.preview-root`.
- The responsive shell uses a 248px desktop sidebar, 72px tablet rail, and compact small-web header. It does not use a native mobile bottom tab bar.
- Tables remain semantic on desktop and become labelled record cards below 768px.
- English and Arabic use explicit preview copy while continuing to use the existing document-level language and direction state.

## Assumptions

- “Dashboard preview” refers to the signed-in coach dashboard.
- “Library/list preview” refers to Exercise Library because it is a representative dense management screen with real current functionality.
- The existing font stack is suitable; Inter and Noto Sans Arabic are declared as preferred fallbacks without adding remote font loading.
- Full migration, live data integration, overlay replacement, and removal of legacy icon code wait for screenshot approval.
