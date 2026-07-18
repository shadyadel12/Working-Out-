# Cleanup player videos

Deploy after migration `0027_player_video_retention.sql`:

```sh
supabase functions deploy cleanup-player-videos --no-verify-jwt
```

Create a daily Supabase Cron job that POSTs to
`https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-player-videos` with
`Authorization: Bearer YOUR_SERVICE_ROLE_KEY`. Store that key in Supabase
Vault/Cron secrets, never in committed SQL. Each run processes 100 videos;
schedule hourly if more than 100 may expire in one day.
