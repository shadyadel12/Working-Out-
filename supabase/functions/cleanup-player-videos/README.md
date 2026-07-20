# Cleanup player videos

Deploy after migrations `0027_player_video_retention.sql` and
`0050_private_r2_files.sql`:

```sh
supabase functions deploy cleanup-player-videos --no-verify-jwt
```

Create a daily Supabase Cron job that POSTs to
`https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-player-videos` with
`Authorization: Bearer YOUR_SERVICE_ROLE_KEY`. Store that key in Supabase
Vault/Cron secrets, never in committed SQL. Each run processes 100 videos;
schedule hourly if more than 100 may expire in one day.

The function supports both legacy Supabase paths and new `r2:` references. R2
secrets are configured as described in `docs/cloudflare-r2-setup.md`.
