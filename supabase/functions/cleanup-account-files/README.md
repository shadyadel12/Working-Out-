# Account file cleanup

Invoke this function from a trusted hourly scheduler using the Supabase service-role bearer token. It retries private R2 and Supabase Storage objects queued during in-app account deletion. It is intentionally unavailable to app clients.
