# Web to Mobile Parity Checklist

Last audited: July 19, 2026

This is a live evidence checklist. “Complete” means a native mobile implementation exists against the same Supabase data and permissions. “Remaining” is intentionally visible and is not counted as finished.

## Shared access and safety

- Complete — Coach, player, and administrator sign-in.
- Complete — Coach-owner, team-member, and player key registration.
- Complete — Administrator authenticator verification.
- Complete — Role-specific navigation and Supabase row-level access rules.
- Complete — Active-subscription blocking and renewal-key flow.
- Complete — Protected native session storage.
- Complete — Terms and feature/update screens before sign-in.
- Complete — Picture, video, audio, and voice chat with content and size checks.
- Complete — Workout video quarantine and server safety scan.
- In progress — Arabic is persistent with RTL direction across shared navigation, sign-in/account creation, invitation fields, validation messages, and library tools; remaining dynamic phrases are being audited screen by screen.
- Complete — VIP-unread conversations sort first, followed by other unread conversations, with persistent read state.

## Coach

- Complete — Dashboard summaries and daily focus.
- Complete — Searchable player list, VIP labels, pending keys, and subscription status.
- Complete — Full player workspace: details, workout/diet analysis, notes, goals, injuries, equipment, check-up, renewal, and guidance.
- Complete — Scheduled check-up list with daily VIP priority.
- Complete — Player chat with text and media.
- Complete — Weekly plan viewing, training/rest days, manual workouts/diets, duplication/deletion, saved template assignment, and full-program assignment.
- Complete — Exercise library fields: category, equipment, muscles, movement, tracking, instructions, note, and video.
- Complete — Reusable workout, diet, and program libraries.
- Complete — Subscription keys with VIP and spaced weekly frequency.
- Complete — Team invitations, roles, client assignment, and revocation.
- Complete — Administrator support chat and account controls.
- Complete — Native Excel workout/diet import and template sharing with file, size, row, and atomic replacement validation.
- Complete — Field-by-field editing of existing workout/program library details, exercises, and scheduled days.
- Ready to deploy — Team-role-specific navigation and server permissions are implemented; database migration 0047 must be applied to the hosted project before production use.

## Player

- Complete — Personal home dashboard and subscription status.
- Complete — All required personal and sports profile fields, first-use completion, and editing.
- Complete — Weekly program and diet plans.
- Complete — Guided set-by-set logging with required reps, optional weight, final comment and video.
- Complete — Guided meal flow with free Back/Next navigation and final Done action.
- Complete — Apply-based workout/diet progress filters and paged history.
- Complete — Coach chat with text, pictures, video, audio files, and recorded voice.
- Complete — Expired-access renewal and account sign-out.

## Administrator

- Complete — Overview metrics.
- Complete — Coach list/search and coach invitation keys.
- Complete — Player access keys, renewal state, restore, and revoke actions.
- Complete — Support inbox and replies.
- Complete — Authenticator verification and account controls.

## Mobile equivalents

- Browser popups are native cards/screens with large touch targets.
- Browser tabs become bottom navigation and in-screen segmented controls.
- Browser file inputs use the phone photo, video, audio, or document picker.
- Browser video links open through the phone’s secure URL handling.
