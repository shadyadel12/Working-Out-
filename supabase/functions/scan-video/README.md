# Video malware scanner setup

The `scan-video` Edge Function moves new videos from the private R2 quarantine
prefix to the final private R2 prefix only after VirusTotal reports no
malicious or suspicious detections. It also supports legacy Supabase uploads.

## Hosted setup

1. Create a VirusTotal account and obtain an API key.
2. Set the Edge Function secret:
   `supabase secrets set VIRUSTOTAL_API_KEY=YOUR_KEY`
3. Deploy the function:
   `supabase functions deploy scan-video`
4. Configure the R2 secrets described in `docs/cloudflare-r2-setup.md`.
5. Apply migration `0050_private_r2_files.sql`.

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
provided automatically to hosted Supabase Edge Functions. Never expose the
VirusTotal or service-role key in a `VITE_` variable.

If the scanner fails, times out, rate-limits, or returns an inconclusive result,
the quarantined object is deleted and is never copied to the final prefix.
