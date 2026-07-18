# Coach Platform Mobile

One Expo/React Native application for Android and iOS. It shares the website's Supabase accounts, subscriptions, plans, progress, chat, files, and access rules.

## Current mobile features

- Player and coach signup with invitation/subscription keys.
- Saved login sessions and role-based navigation.
- Expired-player renewal screen.
- Player workout program, set-by-set logging, comments, completion, video links, and scanned video uploads.
- Player diet plan and daily meal-adherence check-ins.
- Player workout progress summaries and history.
- Coach/player real-time chat with text, pictures, videos, audio files, and recorded voice messages.
- Coach player list, subscription status, daily check-ups, progress totals, and direct guidance messages.
- Coach workout/diet creation and saved-template assignment.
- Coach player-key generation and workout library overview.
- Administrator authenticator verification, coach invitations, player keys, revocation, users, and support chat.

## Run locally

1. Copy `.env.example` to `.env`.
2. Put the same public Supabase URL and publishable key used by the website in `.env`.
3. Run `npm install`.
4. Run `npm start` and scan the QR code with Expo Go.
5. Or run `npm run android`. Running the iOS simulator requires macOS; a physical iPhone can use Expo Go from any development computer.

## Create installable builds

1. Install EAS CLI: `npm install --global eas-cli`.
2. Sign in: `eas login`.
3. From this folder, run `eas build --platform android --profile preview` for an internal Android build.
4. Run `eas build --platform ios --profile preview` for an internal iOS build. Apple signing requires an Apple Developer account.
5. Use the `production` profile for store submissions.

The Android package and iOS bundle ID currently use `com.coachplatform.app`. Change them before store release if another organization already owns that identifier.

## Secrets

Only the public Supabase URL and publishable key belong in the mobile app. Never add a service-role key, malware-scanner key, password, or store credential to this repository.
