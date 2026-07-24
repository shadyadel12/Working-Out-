# Account deletion deployment setup

After applying migration `0076_app_store_privacy_ugc.sql`, deploy `account-delete` and `cleanup-account-files`.

Create a random secret of at least 32 characters and store it only as a Supabase Edge Function secret:

```text
npx supabase secrets set ACCOUNT_DELETION_HASH_SECRET=<random-secret>
```

Keep the existing server-only `SUPABASE_SERVICE_ROLE_KEY` and R2 secrets configured. Never add them to `VITE_` or `EXPO_PUBLIC_` variables.

Call `cleanup-account-files` hourly from a trusted scheduler with `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`. The function retries private objects that could not be removed during the user's deletion request.
