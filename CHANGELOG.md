# App Updates

## July 22, 2026

### Improvements

- Mobile releases can now receive compatible app improvements through Expo updates after the first new store build is installed.

### Fixes

- Repaired coach and player signup so access keys are claimed only after Supabase establishes an authenticated session.
- Aligned hosted email-confirmation behavior and web password validation with the app signup flow while preserving the hosted security policy.
- Signup now displays actionable authentication and database messages instead of hiding them behind a generic failure.
- Restored persistent text labels beside or below every web and mobile navigation icon.
- Expanded Arabic across web and mobile navigation, headings, helper text, placeholders, status labels, accessibility text, validation messages, alerts, confirmations, and other popups, with RTL-aware directional controls.
- Replaced the compact workout editor’s add, remove, save, edit, and confirm action words with accessible icon-only controls.

This page explains what the app can do and what has changed in everyday language. The newest updates appear first.

## July 21, 2026

### Improvements

- Chat inboxes now stay current in real time without repeatedly downloading large message histories, reducing data use and improving responsiveness as more players come online.

- Navigation now keeps inactive destinations icon-only and reveals the active destination label responsively. Action buttons now pair clear icons with their labels across the website and mobile app.
- Login, signup, and administrator key forms now expose clear field names to screen readers and other accessibility tools.
- Delegated coach-team accounts now open the correct assigned players and see only the navigation and actions allowed by their team role.

### Fixes

- Chat attachments now accept only photos and videos, chat videos can be up to 500 MB, and microphone voice messages remain available separately.
- Administrator support attachments now follow the same photo/video-only policy and 500 MB video limit as direct chat.
- Private uploads now have fair per-account pending, hourly, and daily limits, and abandoned uploads are cleaned up sooner.
- Video uploads automatically recover from brief connection interruptions, can be retried with the same file on the website, and handle device video details more reliably in the mobile app.
- Pictures, videos, attachments, and voice messages now connect correctly between the private database registry and cloud file storage.

### Security

- Administrator pages now require both an administrator account and authenticator verification before any management controls or protected data are shown.
- Administrator MFA now protects chat, support, private files, and video scanning consistently. Related users can view shared files without gaining permission to delete someone else's upload.
- The website now blocks inline scripts, database functions use hardened lookup paths, and deployment checks stop security regressions before release.

## July 20, 2026

### New Features


- Players can confirm a complete workout, which marks it done for both the player and coach and locks the submitted details until Edit is selected.
- Coaches can open uploaded or YouTube workout videos in a focused popup player.
- New workout videos, chat media, voice messages, and support attachments can now use private cloud file storage shared by the website and mobile apps.

### Improvements

- Training and diet pages now open on the player’s current subscription week for both players and coaches.
- Chat attachment and voice-recording actions now use clear paperclip and microphone icons.
- Chat media icons now sit inside the message box, and completing an exercise automatically opens the next exercise.
- Chat now uses a compact rounded composer with attachment, emoji, and voice actions. Player weeks now follow the Saturday-to-Friday training calendar, and coach video previews stay inside the app.
- Workout videos can now connect to private cloud storage from the live website, with a clearer message if the connection is interrupted.
- Workout video uploads can now be up to 500 MB on the website and mobile app.
- The landing page now lets visitors choose Sign in or Sign up, then continue as an athlete or coach.
- The website now fits phone screens throughout the coach, player, and admin areas, with compact menus, readable forms, finger-friendly controls, and safely scrollable wide tables.
- Support conversations now open as a focused phone view with a clear way back to the conversation list.

### Security

- Private files now use short-lived upload and viewing links, relationship-based access checks, malware scanning for workout videos, and automatic cleanup without exposing storage credentials to users.

## July 19, 2026

### New Features

- The new five-tab mobile coach shell now connects to real client profiles, programming, exercise/workout/program/diet libraries, direct messages, coach teams, support, check-ups, subscriptions, account tools, and the coaching command center.
- The mobile coach app now has the foundation of a calm five-tab experience for People, Community, Build, Messages, and Alerts, with an accessible azure light/dark design system and locally restored navigation state.
- Landing, login, signup, and signed-in pages now share a persistent light and dark appearance switch. Light mode uses a clean teal workspace style, while dark mode keeps the existing PULSEFIT design.
- Player Training and Diet now use focused three-pane builders with reusable sources, an ordered day canvas, and a detailed prescription or meal inspector.
- Coaches can reorder player exercises, meals, and snacks with accessible controls while keeping the existing assignment and schedule workflow.
- Coaches can now build workouts in a focused three-pane editor using searchable exercises and reusable sections, a clear arrangement canvas, and a detailed prescription inspector.
- Workout prescriptions now support sets, reps or time, rest, load or percentage load, tempo, each-side targets, coaching notes, and linked exercise groups.
- Workouts now support keyboard-accessible ordering, continuous validation, revision publishing, duplication, and safe archiving.
- The coach Library now includes reusable workout sections, tasks, forms, meal plans, ingredients, recipes, recipe books, and metric groups alongside exercises, workouts, and programs.
- Coaches can draft, publish, duplicate, share, and safely archive reusable Library content while preserving assigned player history.
- Program delivery now records an immutable revision snapshot, start date, starting day, and controlled template-update preference.
- Coaches now start from a focused attention center on website and mobile, with priority players, unread conversations, check-ups due, programming gaps, and low-activity alerts in one place.
- The website now opens with a fully redesigned animated PULSEFIT experience that introduces training, nutrition, progress, and coach support.
- Website and mobile loading screens now use distinct branded visuals for different areas of the platform.
- Mobile actions and navigation now use clear, consistent icons with accessible descriptions.

### Improvements

- Mobile pages now use the website's light teal or dark charcoal/orange theme consistently, with a persistent Appearance option in coach Settings.
- The mobile coach app replaces Community with Settings, keeps coach tools, team, and support there, and gives Alerts a simple live feed for VIP messages, completed workouts, and players needing attention today.
- The dashboard's Invite a player shortcut now opens subscriptions directly so coaches can generate a player key.
- Coach utility actions now live in a compact profile menu with the coach name, Team, subscriptions, Settings, Support notifications, and Sign out. The appearance switch is now icon-only.
- Arabic mode now translates newly added Library, Training, Diet, admin, player, dialog, status, loading, and builder text, including content that updates after the page opens.
- Reusable sections expand into their prescribed exercises when a workout is delivered, while remaining one manageable block in the workout editor.
- Library pages now use responsive cards, lifecycle filters, clear empty states, labeled fields, keyboard focus indicators, and accessible editors.
- Coach teams can see only Library content explicitly shared with their workspace, while private content remains owner-only.
- The website coach navigation and dashboard now use a consistent set of original interface icons instead of temporary letters and symbols.
- Coach dashboard actions now lead directly to analysis, messages, check-ups, programming, and roster tools, with clearer priority labels and accessible tap targets.
- Mobile coaches can now filter a player's workout analysis by workout, exercise, and date range, with the same results and pagination as the website.
- Every signed-in website area and mobile screen now has its own subtle background atmosphere while keeping content easy to read.
- Landing-page motion adapts for people who prefer reduced animation and remains responsive on phones, tablets, and desktop screens.

### Security

- Team members now receive separate viewer, chat, head-coach, or sales access, with the same restrictions enforced by the app and database.
- Player renewals now verify that the selected player belongs to the coach making the change.
- Team invitations can no longer be used to convert an existing player account into a staff account.
- VIP and weekly check-up schedules now stay consistent when subscriptions are created or renewed.
- Mobile sign-in sessions now use the phone's protected storage.
- A fresh 400-check safety and quality review now covers the website, mobile app, database, team roles, VIP priority, and weekly check-ups.

### Fixes

- The coach player header once again includes a clearly labeled Diet tab with its own nutrition icon.
- The coach mobile navigation now calls the player-review area Analysis, keeps renewals in More, and opens Plans only after choosing a player.
- Analysis now shows only registered players with active, unexpired access.
- Diet Schedule is now its own Plans option beside the training Schedule, with collapsible meal details.
- Schedule and Diet Schedule now have compact duplication ranges for a day, a full week, or the next four weeks.
- The mobile More menu is now shorter, and library or Excel tools are excluded from the installed mobile app rather than merely hidden.
- Subscription keys now have a one-tap copy icon, and coaches can renew each player for 1, 2, 3, 6, or 12 months.
- The coach mobile Plans page now keeps saved workouts, saved diets, exercise details, and meal details collapsed by default, with compact side-by-side actions that use less screen space.
- The coach mobile Diet tab now includes a daily schedule overview, while rest-day selection has moved from Schedule into Workout.
- Mobile screen headings now stay below the phone status bar and long player names or emails fit without overlapping controls.
- The newest database safety update can now be applied cleanly over the existing VIP renewal functions.
- Meal checkboxes in the player's daily diet check-in now align correctly with their meal names on desktop and mobile.
- Player meal cards now stay closed by default and open only when the player selects a meal.
- Mobile player-key creation and renewals now send the complete subscription choices, preventing an unclear database-function error.

### New Features

- Coaches can now edit saved workouts, individual saved exercises, program details, and every scheduled program day from mobile.
- Mobile sign-in, account creation, invitation fields, validation messages, and new library tools now support Arabic and right-to-left layout.

## July 18, 2026

### New Features

- The complete website can now switch between English and Arabic from the language button on every page.
- Mobile players can now move through an exercise one set at a time with Back and Next buttons. Reps are required before continuing, weight is optional, and comments or video are added on the final step.
- Mobile diet plans now guide players through one meal at a time. They can move freely with Back and Next, mark meals completed, and save the day with Done.
- The coach mobile app now includes daily scheduled check-ups, VIP and subscription tools, team invitations and roles, reusable exercise/workout/diet/program libraries, support, and account controls in a phone-friendly navigation.
- Coach, player, and admin mobile roles now have polished role-specific home dashboards, with one shared visual system for cards, fields, actions, spacing, and status colors.
- Mobile coaches can now open a complete player workspace with personal details, workout and diet analysis, private notes, goals, injuries, equipment, check-ups, renewals, and direct guidance.
- Mobile players can complete and edit every required personal and sports profile field, and use apply-based workout/diet progress filters with paged results.
- Mobile administrators now have organized coach, coach-key, and player-access management with search, key generation, renewal state, restoration, and revocation.
- Coach signup on mobile now supports both owner invitation keys and role-based team-member invitation keys.
- Mobile coach libraries now provide complete reusable exercise fields, workout templates with exercises, diet templates with meals, and program details for later assignment.
- Mobile plan building now includes existing weekly schedules, training/rest days, workout and diet creation, saved-template assignment, day deletion/duplication, and whole-program assignment.
- Mobile team management now shows member identity, role and status, supports client assignment, and allows owner revocation.
- Mobile picture, video, and audio uploads now verify file size, reported format, and actual file content before storage; workout videos still require the server safety scan.
- Terms of Use and the app feature/update overview are now available as native mobile screens.
- Mobile coach conversations now prioritize unread VIP players first, followed by other unread chats, and remember when each conversation was opened.
- Mobile now remembers the selected English or Arabic language, translates shared screens and navigation, and switches shared layouts to right-to-left in Arabic.
- Coaches can now share blank Excel templates and import validated workout or diet workbooks using the phone document picker.
- The mobile app now uses a cinematic editorial fitness design with athlete-image headers, oversized titles, pink/coral accents, outline pills, deeper cards, and floating role navigation.

### Improvements

- Arabic mode now uses a full right-to-left layout across dashboards, forms, menus, dropdowns, popups, and public pages.

- Player subscription key generation and renewals now live on a dedicated Subs page instead of Settings.

- The full website now uses a unified dark charcoal and energetic orange design inspired by PulseFit.
- Coach and player dashboards now use top navigation, with a new gym-photo landing hero.

- Exercise, workout, and program libraries are now grouped inside one expandable Library menu.

- The client list now shows and filters players who still need a training program.

- The coach workspace now has a cleaner sidebar and client table with search, renewal filters, status filters, and compact client actions.
- Coaches can now click a client’s name to open their profile and choose the coaching tool they need.
- Coaches can add a complete workout from one popup, including exercises, targets, notes, videos, or a saved workout from their library.
- Saved workouts now stay collapsed until the coach selects one to view or edit its details.
- Every workout now has its own Add Exercise button, which opens a complete exercise popup without expanding the workout.
- Duplicate and Delete controls now appear beside Add Exercise on every workout, with week selection and deletion confirmation.
- Each client now has a summary workspace showing account details, training activity, workout completion, diet adherence, and direct tabs for training and both analysis pages.
- Back buttons in the coach workspace now return to the previous screen instead of always opening the main client list.
- Coaches can save and edit private coach notes and client goals directly from each client’s summary.

### New Features

- Standard player keys can include one, two, or three spaced check-up days each week; VIP players remain visible every day.

- Coaches can mark a player subscription as VIP when generating or renewing a key.
- VIP players appear first in daily check-ups, and their unread conversations stay above every other message thread.

- Coach owners can generate invitation keys for Read Only, Chat Support, Head Coach, and Sales team roles, then assign clients and revoke access from Team Management.
- Team members can register from the coach signup page using their team invitation key.

- Players must complete their personal and sports profile before using their plan, and coaches can review those details from the client summary.

- The player program page now has a collapsible information bar for limitations and injuries, notes, goals, and available equipment.

- Coaches can assign a complete saved program to a player from any starting week, using the program’s configured duration and full schedule.

- Coaches can create reusable workout templates with descriptions, difficulty, notes, exercise selections, and sections.
- Coaches can create, search, copy, and delete reusable program templates with difficulty and duration.
- Program templates now include an editable week-by-week, seven-day schedule where coaches can add workouts or import them from the workout library.
- Adding a workout inside a program now opens an inline editor with notes and a searchable exercise-library picker.
- The inline program workout editor can now expand into a larger centered popup and return to the compact day view without losing changes.

- Coaches can build a reusable exercise library with categories, target muscle groups, and movement patterns, then select saved exercises while creating player workouts.
- Library exercises can also include equipment, instructions, a default note, video, and up to three tracking fields.
- Muscle groups, movement patterns, and tracking fields now use click-to-open checkbox menus with clear selected choices.

- The first Android and iOS app foundation is now available, with shared sign-in, role-based navigation, player program and diet views, and a coach player list connected to the same accounts as the website.
- The Android and iOS app now supports player workout logging, diet check-ins, progress history, private media chat, and recorded voice messages.
- Coaches can manage check-ups, send guidance, create workout and diet plans, reuse saved plans, and generate player keys from mobile.
- Administrators can use additional verification, manage users and access keys, revoke access, and answer support conversations from mobile.
- A public Changelog page is now available before sign-in, so visitors can review the app's features and latest improvements.
- Coaches can create accounts with an approved invitation key and players can join with an active subscription key.
- Coaches can see all linked players, their subscription status, expiry date, and recent activity from the dashboard.
- Coaches can create weekly training programs with training days, rest days, multiple workouts, and multiple exercises.
- Each exercise can include target sets, repetitions, weight, coaching notes, and a demonstration video or video link.
- Coaches can copy complete weeks, individual days, or exercises into other weeks.
- Coaches can save workouts in a personal library and reuse them for other players. Changes for one player do not alter the saved version or another player's plan.
- Coaches can create weekly diet plans containing meals, snacks, food choices, serving amounts, and daily notes.
- Coaches can copy diet days or complete diet weeks, save diet days in a personal library, and reuse them with other players.
- Coaches can download Excel templates and import complete workout or diet plans for a selected player from Settings.
- Coaches can maintain a reusable list of foods while preparing diet plans.
- Players can view their weekly workout schedule and diet plan one day at a time.
- Players can record every exercise set, including repetitions and weight, add a comment, mark completion, and attach a video or video link.
- Players and coaches can review workout history with filters for workout, exercise, and date range.
- Players can record which planned meals they followed and leave a daily note for their coach.
- Players and coaches can review diet adherence, meals followed, days recorded, and diet notes over time.
- Coaches can complete daily player check-ups and choose the date they want to review.
- Coaches can send general messages or attach guidance to a specific exercise.
- Players and coaches can exchange live private text messages, pictures, videos, audio files, and recorded voice messages.
- Coaches can contact the administrator through private support chat and include approved attachments.
- Administrators can manage coaches, players, coach invitation keys, player subscription keys, renewals, expiry dates, and revoked access.
- Administrators can review and reply to coach support conversations from one inbox.
- Coaches can generate new player keys, renew existing player access, and copy keys for sharing.
- Players whose access has expired can enter a renewed key and continue using their account.
- Unread badges show new coach-player chat and support messages.
- The app includes public Terms of Use and Changelog pages that do not require an account.

### Improvements

- Progress results load in smaller pages. Users choose their filters first and press Apply, reducing unnecessary loading.
- Coach diet plans load only the selected week after Apply is pressed, helping larger accounts remain responsive.
- Important pages show clear loading placeholders while information is being prepared.
- Private videos and attachments use temporary viewing links rather than remaining openly available.
- Player videos are removed automatically 30 days after the coach first views them, helping control storage use.
- Workout and diet screens use clear labels, symbols, confirmation messages, and mobile-friendly controls.
- Workout and diet libraries reduce repeated information while keeping each player's changes independent.
- Program and diet imports replace the selected player's plan in one complete action, avoiding partially updated plans.
- The same account, plan, progress, and file rules are designed to support future mobile apps.

### Fixes

- The program editor popup now uses almost the full browser width, giving the weekly schedule and workout controls more space.
- The program schedule now keeps day cards and workout controls readable on medium-sized screens instead of squeezing them together.
- The program schedule editor now fits all seven day columns cleanly on desktop without clipping the workout editor.

- Administrator verification now recovers correctly if a previous setup was interrupted.
- Coach and player chat updates appear promptly for both participants.
- Program, diet, duplication, exercise, and template labels now display correctly.
- Database updates for workout and diet libraries can safely continue if an earlier setup was interrupted.

### Security

- Login and account access are protected according to each person's role, with additional verification for administrator accounts.
- Active subscriptions are checked before players can use private coaching features.
- Personal plans, progress, conversations, and files are available only to the appropriate player, coach, or administrator.
- Uploaded files are checked for approved type, size, name, and content. Workout videos receive additional safety screening before becoming available.
- Links, form entries, spreadsheets, and access keys are checked carefully before they are accepted.
- Spreadsheet imports have practical limits and safety checks, and exported information is prepared safely.
- Important changes are completed as a single action and guarded against accidental repeated submissions.
- Private files remain private, temporary viewing access expires, and retained player videos are cleaned up automatically.
- The app uses secure connections and modern browser protections, and its software packages are regularly reviewed and updated.
