# Cloudflare R2 Setup

R2 is enabled and the private bucket is ready. The application integration was
prepared on July 20, 2026.

## Goal

- Use Cloudflare for basic website protection.
- Store large files, such as workout videos and chat attachments, in Cloudflare R2.
- Keep users, workouts, diets, subscriptions, and chat text in Supabase.
- Make the same system work later with the Android and iOS apps.

## Current website

The app is currently deployed at:

`https://working-out-rho.vercel.app`

This address can continue working while Cloudflare storage is being prepared.

## Cloudflare account setup

1. Sign in to the Cloudflare account.
2. Open **R2 Object Storage**.
3. Click **Enable R2**.
4. Add the payment card if Cloudflare requests it. R2 has a free allowance, but Cloudflare may still require a card.
5. Create a bucket named `coach-platform-private`.
6. Keep the bucket **private**. Do not turn on public access.
7. Tell Codex that R2 is enabled and the private bucket has been created. **Done.**

## Application integration

- [x] Add the Cloudflare storage code to this project.
- [x] Secure uploads so clients cannot view each other's files.
- [x] Connect video uploads and chat attachments to R2.
- [x] Keep file ownership information in Supabase.
- [x] Prepare the storage connection for the website and Android/iOS apps.
- [x] Preserve video scanning and automatic deletion protections.
- [ ] Add the R2 bucket CORS policy and Supabase secrets.
- [x] Apply migrations 0050, 0051, and 0052 and deploy the three Edge Functions.
- [ ] Complete the production verification checklist.

Deployment instructions are in `docs/cloudflare-r2-setup.md`.

## Later: Cloudflare protection for the website

Cloudflare cannot fully protect the shared `vercel.app` address because Vercel owns that domain. To put the website behind Cloudflare later:

1. Buy or use a custom domain, such as `myfitnessapp.com`.
2. Add the domain to Cloudflare's Free plan.
3. Connect the domain to the Vercel project.
4. Use a setup similar to:
   - `app.mydomain.com` for the website.
   - `storage.mydomain.com` for private uploads.

A custom domain is not required to begin the R2 storage work.

## Important safety note

Never put Cloudflare passwords, payment details, API tokens, or secret keys in chat or commit them to Git. Store secrets only in Cloudflare, Vercel, or local environment settings when instructed.
# Coach Library hosted deployment

- Apply `supabase/migrations/0048_coach_library_platform.sql` to the hosted Supabase project before deploying the new Library routes.
- Apply `supabase/migrations/0049_training_blueprint_builder.sql` immediately after `0048` before enabling the workout builder.
- Regenerate hosted database TypeScript types with `npm run db:types` after the migration is live.
- Controlled follow-template update diffs are intentionally not automatic; add an approval UI before propagating published revisions to active deliveries.
