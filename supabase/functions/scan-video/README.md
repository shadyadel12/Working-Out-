# Video malware scanner setup

The `scan-video` Edge Function moves videos from the private
`video-quarantine` bucket to the private `videos` bucket only after VirusTotal
reports no malicious or suspicious detections.

## Hosted setup

1. Create a VirusTotal account and obtain an API key.
2. Set the Edge Function secret:
   `supabase secrets set VIRUSTOTAL_API_KEY=YOUR_KEY`
3. Deploy the function:
   `supabase functions deploy scan-video`
4. Apply migrations `0024_scanned_video_quarantine.sql` and
   `0025_atomic_plan_imports.sql`.

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
provided automatically to hosted Supabase Edge Functions. Never expose the
VirusTotal or service-role key in a `VITE_` variable.

If the scanner fails, times out, rate-limits, or returns an inconclusive result,
the quarantined object is deleted and is never copied to the final bucket.
