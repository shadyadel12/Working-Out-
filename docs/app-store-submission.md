# Trainova App Store submission worksheet

## Public metadata

- Support email: trainova5@gmail.com
- Support URL: https://working-out-rho.vercel.app/support
- Privacy URL: https://working-out-rho.vercel.app/privacy
- Community Standards: https://working-out-rho.vercel.app/community-standards
- Suggested age rating: 17+ until App Store Connect's health/fitness, unrestricted web/media, and user-generated-content questionnaire is completed accurately.
- What's New: “Trainova now includes private and public coaching libraries, clearer creator attribution, content reporting and blocking, Community Standards, privacy controls, and in-app account deletion.”

## Review Notes

Trainova connects an individual fitness coach with that coach's players. The current intended business model is real-time person-to-person fitness coaching; access keys only identify an existing coaching relationship and are labelled “coaching access.” The iOS app contains no price, external purchase link, or checkout. Please review this under Guideline 3.1.3(d). If Trainova instead sells one-to-many programs, catalog access, or standalone digital functionality, submission must pause until StoreKit/RevenueCat purchase, restore, entitlement, and receipt validation are implemented.

Public exercise, workout, ingredient, recipe, and meal-plan libraries are user-generated content. Clean submissions publish immediately after server-side checks. Users can report items, block public creators, report/block chat participants, and read Community Standards. Administrators can hide/remove/restore items and suspend users. Public creator labels never use email addresses.

Account deletion: Account & Privacy → Permanently Delete Account. The user confirms their password or recent MFA, checks the destructive acknowledgement, and types DELETE. This removes the Auth account, revokes sessions through deletion, deletes or queues private-file deletion, clears device storage, and returns to sign in.

Camera/photo/microphone requests occur only after a user chooses workout evidence, an assignment/progress photo, chat media, or a voice message. Media is private and delivered through authorized short-lived URLs.

Administrator accounts use TOTP MFA. Provide the reviewer with a current one-time code using the App Review contact channel; do not disable MFA or publish a shared TOTP secret in Review Notes.

## Demo accounts to provision before submission

Create these in a review-only environment with populated sample workout, meal, assignment, progress-photo, chat, and public-library data. Never reuse production personal data.

- Coach: `[APP_REVIEW_COACH_EMAIL]` / `[ROTATED_PASSWORD]`
- Player linked to that coach with active access: `[APP_REVIEW_PLAYER_EMAIL]` / `[ROTATED_PASSWORD]`
- Administrator with review-safe MFA procedure: `[APP_REVIEW_ADMIN_EMAIL]` / `[ROTATED_PASSWORD]`

Navigation: coach public libraries are Build → Private & public libraries; player plans are Home/Program/Diet/Assignments/Progress; privacy and deletion are Account & Privacy; admin reports are Libraries.

## App Privacy answers to confirm in App Store Connect

Collected and linked to the user for app functionality: name, email, user ID, fitness and health-context information, photos/videos, audio, messages/other user content, customer support content, product interaction, crash/diagnostic data, and coarse device/platform/network information. Security and fraud-prevention data is used for app functionality and security. Trainova does not track users across other companies' apps/websites and does not use data for third-party advertising.

The final nutrition label must be reconciled against the production SDK inventory and actual analytics/crash configuration after `expo prebuild` and the archived binary's privacy report are inspected.

## Copyright and safety operations

Notices go to trainova5@gmail.com and should identify the copyrighted work, public item/location, contact details, authority, and good-faith statement. Preserve the report and audit event; promptly hide credible urgent material, notify the creator where lawful, review counter-notices, then remove or restore with an auditable reason. Target urgent safety reports within 24 hours and normal reports within 72 hours. Escalate imminent danger to appropriate emergency/legal channels.

## Before pressing Submit

- Confirm ownership/availability of `com.trainova.app` in Apple Developer and Google Play; update it if the registered identity differs.
- Add the three stable review accounts and current MFA instructions.
- Upload final iPhone and iPad screenshots from the reviewed binary.
- Complete age rating, privacy nutrition label, export-compliance, content-rights, and UGC declarations.
- Test a real iPhone/iPad, denied permissions, offline startup, IPv6-only networking, media indicators, account deletion, and every reviewer path.
