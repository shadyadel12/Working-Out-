# Cloudflare R2 deployment

The application stores only opaque `r2:<uuid>` references. Cloudflare keys are
used by Supabase Edge Functions and must never be added to website or mobile
environment variables.

## 1. Configure the private bucket

Use the existing private bucket named `coach-platform-private`. The repository
keeps the production policy in `docs/r2-cors.json`. Apply and verify it with an
authenticated Wrangler session:

```sh
npx wrangler login
npx wrangler r2 bucket cors set coach-platform-private --file docs/r2-cors.json
npx wrangler r2 bucket cors list coach-platform-private
```

The equivalent dashboard policy is:

```json
[
  {
    "AllowedOrigins": [
      "https://working-out-rho.vercel.app",
      "http://localhost:5173"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

Add the production custom domain later if the website moves away from the
current Vercel address. Keep public development URLs out of the list.

## 2. Create an R2 API token

In Cloudflare, create an R2 API token scoped only to Object Read & Write for
`coach-platform-private`. Record the Account ID, Access Key ID, and Secret
Access Key in a password manager. Do not paste them into source files or chat.

## 3. Configure Supabase secrets

Confirm the account ID before setting the secrets. It must be the 32-character
hexadecimal **Account ID** shown by this command, without a token prefix or any
extra character:

```sh
npx wrangler whoami
```

From a terminal already linked to the hosted Supabase project, run this locally
with the real values:

```sh
npx supabase secrets set R2_ACCOUNT_ID=YOUR_ACCOUNT_ID
npx supabase secrets set R2_BUCKET_NAME=coach-platform-private
npx supabase secrets set R2_ACCESS_KEY_ID=YOUR_ACCESS_KEY_ID
npx supabase secrets set R2_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
```

The existing `VIRUSTOTAL_API_KEY` secret must remain configured.

The shared R2 connector rejects malformed account IDs before generating upload
URLs. After changing any R2 secret, verify one small chat image before testing a
large workout video.

## 4. Apply and deploy

Apply migrations 0048, 0049, 0050, and 0051 in order if they are not already hosted,
then deploy the storage functions:

```sh
npx supabase db push
npx supabase functions deploy r2-storage
npx supabase functions deploy scan-video
npx supabase functions deploy cleanup-player-videos --no-verify-jwt
```

Keep the existing scheduled call to `cleanup-player-videos`. It now deletes
expired R2 workout videos as well as legacy Supabase videos.

## 5. Verify before production use

1. Upload a chat image as a player and open it as the linked coach.
2. Confirm a different account cannot request its download URL.
3. Upload a workout video and confirm it appears only after the malware scan.
4. Send a support attachment and open it from the admin account.
5. Confirm the bucket still shows **Public access: Disabled**.

Existing Supabase-hosted attachments remain readable. Only new uploads move to
R2, so no bulk migration is required for launch.
