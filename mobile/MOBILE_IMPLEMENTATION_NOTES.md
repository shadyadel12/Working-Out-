# Mobile implementation notes

## Existing conventions

- Expo 54, React Native 0.81, React 19 and TypeScript 5.9.
- React Navigation 7 (`native`, `native-stack`, and `bottom-tabs`) is already the routing stack, so the coach shell continues to use it instead of introducing Expo Router.
- Supabase session/profile restoration in `src/auth/AuthProvider.tsx` selects the player, coach, or admin navigator.
- Screens use `react-native-safe-area-context`; shared UI currently lives in `src/components`.
- AsyncStorage is already installed and is appropriate for restoring navigation state without touching server data.
- Existing player and admin navigation remains unchanged during the coach UX rollout.

## Steps 1–3 scope

- Add an original azure light/dark token system and reusable mobile primitives.
- Add Lucide icons through `lucide-react-native`; retain existing icons on untouched player/admin screens until their migration phase.
- Replace the coach bottom navigation with People, Community, Build, Messages and Alerts.
- The initial shell used read-only previews; the follow-up connection pass now routes those destinations to the existing authorized Supabase-backed coach features without changing their domain behavior.
- Persist navigation state locally. No preview interaction performs a Supabase mutation.

## Assumptions

- The device color scheme is the initial theme source.
- Coaches of every team role can see the same five-shell destinations; feature-level permissions remain enforced when existing features are connected.
- Tablet split views and detailed list states belong to steps 4–5, not this shell-only phase.
