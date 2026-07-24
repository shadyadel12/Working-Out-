# Apple App Store Tasks To Do Later

Trainova is closer to App Store readiness, but it is not fully ready for submission yet.

## Remaining tasks

- Configure Apple signing certificates and provisioning profiles for `com.trainova.app`.
- Complete a successful production-equivalent iOS EAS build without submitting it.
- Test the final build on real iPhones and iPads, including startup, layouts, denied permissions, offline use, IPv6-only networking, media uploads, and reviewer flows.
- Apply the required Supabase migration and deploy the account-deletion and cleanup Edge Functions.
- Configure the server-only `ACCOUNT_DELETION_HASH_SECRET` and the scheduled private-file cleanup job.
- Create stable App Review coach, player, and administrator demo accounts with sample data and valid coaching access.
- Prepare a safe App Review MFA procedure and clear navigation instructions.
- Add final App Store screenshots, What's New text, age rating, privacy and support URLs, and Review Notes.
- Complete the App Privacy nutrition-label answers and verify them against the final archived iOS binary and SDK privacy manifests.
- Confirm that `com.trainova.app` is owned and available in the Apple Developer account.
- Confirm Trainova's business model:
  - If it sells real-time, one-to-one coaching, explain Guideline 3.1.3(d) in Review Notes.
  - If it sells one-to-many coaching, content libraries, or standalone digital features, implement Apple-compliant in-app purchases, purchase restoration, entitlement validation, and server-side receipt handling before submission.
- Verify the public Privacy Policy, Support page, and Community Standards after the website update is live.
- Perform final functional tests for account deletion, public-content filtering, reporting, blocking, moderation, creator-name privacy, attribution, permissions, and database access isolation.

Apple approval cannot be guaranteed, but these tasks must be completed before Trainova should be submitted.
