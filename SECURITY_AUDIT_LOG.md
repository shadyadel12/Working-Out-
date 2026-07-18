# Consolidated Security Audit Log

Code baseline: `8168a02`  
Date: 2026-07-18

| # | Scenario/Test performed | Status | Result/fix |
|---:|---|---|---|
| 1 | SQL injection through form and API parameters | Safe | Supabase query builders and typed RPC parameters are used; no raw user-built SQL was found. |
| 2 | NoSQL injection | Not applicable | The project uses PostgreSQL/Supabase and has no NoSQL query interface. |
| 3 | Command injection | Safe | No user input reaches a shell, process launcher, or command interpreter. |
| 4 | LDAP injection | Not applicable | No LDAP integration exists. |
| 5 | Stored XSS in messages, names, comments, and diet content | Safe | React renders these values as escaped text; no `dangerouslySetInnerHTML` sink was found. |
| 6 | Reflected XSS | Safe | No route/query value is rendered as raw HTML. |
| 7 | DOM-based XSS | Safe | Unsafe URL schemes are rejected and external values are not assigned to HTML sinks. |
| 8 | CSRF | Low exposure | Supabase uses bearer authorization rather than ambient application session cookies. |
| 9 | Weak password handling | Partially open | Passwords are handled by Supabase Auth; client minimum remains six characters and production password policy must be configured in Supabase. |
| 10 | Insecure token storage | Conditional | Supabase persists its browser session; any future XSS would expose it, but no XSS sink was found. |
| 11 | Session fixation | Safe | Supabase issues and refreshes signed sessions; the application does not accept caller-selected session IDs. |
| 12 | Missing MFA | Infrastructure required | MFA should be enabled and required for administrators through Supabase Auth. |
| 13 | Broken access control | Was vulnerable | Server-side RLS was hardened in migration `0022`; UI guards are no longer the only boundary. |
| 14 | Privilege escalation through signup metadata | Fixed | New profiles always receive the player role; user metadata can no longer select `admin`. |
| 15 | Privilege escalation through profile update | Fixed | Authenticated users can update only their `name`, not `role` or `email`. |
| 16 | IDOR through arbitrary coach/player IDs | Fixed | Renewal RPCs and RLS now verify the caller's coach-player relationship. |
| 17 | Sensitive data at rest | Infrastructure controlled | Production data is hosted by Supabase; encryption and regional controls must be verified in the Supabase plan/settings. |
| 18 | Sensitive data in transit | Safe | Hosted Supabase and Vercel endpoints use HTTPS/WSS; HSTS is configured. |
| 19 | Hardcoded secret/API keys | Safe | No service-role or private key is tracked; only the intentionally public Supabase publishable key is bundled. |
| 20 | Sensitive logs | Safe | No password/token logging was found; local environment and generated logs are ignored by Git. |
| 21 | Missing general API rate limits | Infrastructure required | Direct browser-to-Supabase traffic needs hosted Supabase/gateway or Edge Function rate controls. |
| 22 | Improper input validation | Was vulnerable | Length, row-count, file-size, URL, database, and structured import validation were added. |
| 23 | Mass assignment | Fixed | Profile columns are restricted and privileged mutations use self-authorizing RPCs. |
| 24 | Unrestricted upload types | Fixed | Explicit allowlists exist in the client and Storage bucket metadata. |
| 25 | Upload path traversal | Fixed | Null bytes/separators are rejected and generated UUID filenames are used. |
| 26 | Dependency CVEs | Fixed | Vulnerable `xlsx@0.18.5` was replaced with ExcelJS; its transitive `uuid` was overridden to a patched release. `npm audit` reports zero known vulnerabilities. |
| 27 | CORS configuration | Managed externally | Supabase and the Edge Function control CORS; the scanner accepts authenticated cross-origin calls. |
| 28 | Content Security Policy | Partially hardened | CSP, frame denial, HSTS, nosniff and referrer policy exist; inline style allowances remain for the current UI. |
| 29 | HTTP security headers | Safe | Vercel config includes HSTS, CSP, frame denial, nosniff, referrer and permissions policies. |
| 30 | Database least privilege | Was vulnerable | Role changes, RPC execution, RLS, storage writes, and relationship checks were tightened in migrations `0022`–`0025`. |
| 31 | Parameterized database queries | Safe | Supabase filters and RPC arguments are parameterized. |
| 32 | Backup and restore security | Infrastructure required | Backups and restore exercises must be configured and tested in hosted Supabase staging. |
| 33 | Exposed database ports | Safe for hosted design | The browser reaches Supabase's public API, not a raw PostgreSQL credential or direct database port. |
| 34 | Null values and empty inputs | Hardened | Required fields, SQL constraints, and RPC payload validation reject invalid empty/null state. |
| 35 | Integer overflow or extreme counts | Hardened | Weeks, rows, meals, workouts, exercises, sets and payload sizes have practical ceilings. |
| 36 | Business workflow bypass | Was vulnerable | Active subscriptions and ownership are enforced in RLS instead of only React routes. |
| 37 | Price/payment manipulation | Not applicable | No payment processing is implemented. |
| 38 | Missing state validation | Fixed | Coach role, linked-player state, active subscriptions and import structure are checked server-side. |
| 39 | Error stack/internal detail leakage | Partially fixed | Login errors are uniform; some authenticated Supabase mutation errors may still expose schema detail. |
| 40 | OWASP Top 10 mapping | Reviewed | Access control, injection, authentication, vulnerable dependencies, integrity and logging/configuration were assessed. |
| 41 | OWASP Mobile Top 10 | Not applicable yet | No mobile application source exists in this repository. |
| 42 | Obsolete cryptography/protocols | Safe | No MD5, SHA-1, TLS 1.0 or TLS 1.1 application usage was found. |
| 43 | Unauthorized direct data access | Was vulnerable | RLS now protects direct REST calls and no longer relies on hidden UI controls. |
| 44 | Malformed request payloads | Hardened | Database checks and RPC validation reject malformed structured content. |
| 45 | Replay of key claims | Safe | Key claims use row locking and single-use state. |
| 46 | Brute-force login and key checks | Partially addressed | Local Auth limits were added; hosted Supabase limits/CAPTCHA must be configured separately. |
| 47 | Injection through every visible form | Safe | Values remain data in parameterized Supabase requests and escaped React output. |
| 48 | Script injection through text fields | Safe | React escaping was confirmed for chat, notes, names, foods and comments. |
| 49 | Command injection through file names | Safe | Upload code never invokes an operating-system command. |
| 50 | Oversized strings/files crashing the app | Fixed | Database text constraints, 50 MB video, 25 MB attachment and 2 MB workbook limits were added. |
| 51 | Changing IDs in URLs or requests | Fixed | Coach-player ownership is validated by RLS and RPCs. |
| 52 | Login bypass by token/cookie manipulation | Safe | Supabase validates JWT signatures and expiry server-side. |
| 53 | Login without lockout | Infrastructure required | Repository local limits are present; hosted per-IP/account controls require Supabase dashboard/gateway settings. |
| 54 | Normal user reaching admin actions | Fixed | Role creation/update escalation paths were closed and admin RPCs self-authorize. |
| 55 | Expired or tampered JWT acceptance | Safe | Supabase rejects invalid JWTs; expired subscriptions are independently enforced in RLS. |
| 56 | Script renamed to MP4/MOV/WebM | Fixed | Extension, reported MIME, container signature, quarantine and server-side malware scan must all pass. |
| 57 | Oversized upload storage exhaustion | Fixed | Client and Storage buckets enforce maximum sizes; upload quotas still benefit from gateway rate limiting. |
| 58 | `javascript:`, `data:`, `file:` and private URLs | Fixed | Only public HTTP/HTTPS links without credentials are accepted. |
| 59 | `../../` upload traversal | Fixed | Final paths are generated inside authorized owner prefixes. |
| 60 | Fake upload MIME | Fixed | Storage allowlists, signature checks and VirusTotal scanning are applied before final storage. |
| 61 | Replaying old write requests | Mostly safe | Claims and imports are atomic/idempotent where critical; repeated chat sends can intentionally create separate messages. |
| 62 | Manipulated hidden/disabled fields | Fixed | Database policies and RPC validation enforce the same rules independently of the UI. |
| 63 | Double-submit race conditions | Hardened | UI pending states, uniqueness constraints, row locks and atomic import RPCs protect critical flows. |
| 64 | Calling APIs directly instead of the UI | Fixed for authorization | Direct calls still pass through Supabase RLS, constraints, RPC authorization and final-bucket upload restrictions. |
| 65 | Keys visible in developer tools | Safe by design | Only the publishable Supabase key is present; true secrets remain in server/Edge Function environments. |
| 66 | Error messages revealing account existence | Fixed for login | All login role/email/password failures return one uniform message. |
| 67 | Double/mixed URL encoding bypass | Safe | The standards-based URL parser requires a literal valid HTTP/HTTPS protocol. |
| 68 | Null-byte filename injection | Fixed | Video filenames containing null bytes or path separators are rejected. |
| 69 | Unicode homoglyph attacks | Low risk | Authorization uses UUIDs and exact high-entropy ASCII keys; URL hostnames are normalized by the URL parser. |
| 70 | ZIP/decompression bomb | Fixed | Workbook ZIP metadata is inspected before parsing, with entry, ZIP64, expanded-size and compression-ratio limits. |
| 71 | Polyglot video file | Fixed | Files stay quarantined until VirusTotal reports no malicious or suspicious detections. |
| 72 | Sort/filter/page injection | Safe | Sort/filter choices are fixed application fields, not user-provided SQL identifiers. |
| 73 | Spreadsheet formula injection | Proactively fixed | Generated CSV/XLSX values beginning with `=`, `+`, `-` or `@` are prefixed with an apostrophe. |
| 74 | Expensive search queries | Conditional | Filters are local/fixed and PostgREST has a 1,000-row response ceiling; rapid pagination needs gateway rate limiting. |
| 75 | Search information leakage | Safe | RLS filters unauthorized rows before any client-side filtering occurs. |
| 76 | Forged webhook/callback | Not applicable | No webhook or callback endpoint exists. |
| 77 | OAuth state/open redirect | Not applicable | No OAuth/social login is implemented. |
| 78 | SSRF from preview/import URL | Safe | No submitted URL is fetched server-side; private/local URL targets are rejected. |
| 79 | Email/notification spam | Not applicable currently | There is no contact, arbitrary email or notification-sending endpoint. |
| 80 | Connection loss during program replacement | Fixed | One `replace_program_import` RPC performs validation, deletion and nested insertion in one PostgreSQL transaction. |
| 81 | Connection loss during diet replacement | Fixed | One `replace_diet_import` RPC replaces diet rows and food-library entries atomically. |
| 82 | Backup restoring deleted access | Infrastructure required | Restore procedures must be tested in isolated staging and followed by access/RLS verification. |
| 83 | Soft-deleted records reachable | Not applicable | The schema does not implement soft deletion. |
| 84 | Local database file tampering | Not applicable to production | Production uses hosted Supabase; local development data inherits workstation access controls. |
| 85 | Sensitive temporary/cache files | Safe in repository | `.env`, local Supabase state, build output and local configuration are excluded from Git. |
| 86 | Plaintext passwords/secrets | Safe for production source | Auth passwords are handled by Supabase; local seed credentials are development-only and no private production secret is tracked. |
| 87 | User/account enumeration timing/messages | Hardened | Login messages are uniform; hosted Auth anti-enumeration and rate limits should also remain enabled. |
| 88 | Malware scanner failure/inconclusive result | Fixed | Scan errors, timeouts, suspicious results and inconclusive results delete quarantine and never create a final video. |
| 89 | Bypassing malware scan via final bucket | Fixed | Player/coach insert policies on `videos` are removed; only the service-role Edge Function can promote a clean file. |
| 90 | Server-side global 429 rate limiting | Infrastructure required | The direct-to-Supabase architecture requires hosted gateway/Edge Function routing for reliable per-IP limits and HTTP 429 responses. |

## Semgrep and dependency retest — 2026-07-18

Semgrep Pro 1.169.0 scanned 104 Git-tracked files with 2,944 code rules and
85,615 supply-chain rules. It originally reported 10 non-blocking findings.
Repeated findings against multiple source files are grouped below by root cause.

| Test/finding | Original result | Action taken | Current result |
|---|---|---|---|
| `xlsx` CVE-2024-22363 (ReDoS), reported in program and diet imports | 2 reachable HIGH findings | Removed `xlsx@0.18.5`; replaced import/export with ExcelJS while retaining the 2 MB and ZIP/archive validation limits | Fixed; vulnerable package is absent |
| `xlsx` CVE-2023-30533 (prototype pollution), reported in program and diet imports | 2 reachable HIGH findings | Removed `xlsx@0.18.5` and migrated both workbook parsers | Fixed; vulnerable package is absent |
| Mutable GitHub Action references | 5 non-blocking code findings | Pinned checkout, setup-node, configure-pages, upload-pages-artifact, and deploy-pages to full 40-character commit SHAs | Fixed |
| Browser `console.log` unsafe-format-string warning | 1 non-blocking code finding | Reviewed data flow; the only interpolated value is the trusted local year from `Date`, with no user-controlled input | False positive; no vulnerability |
| ExcelJS transitive `uuid` advisory discovered during remediation | 1 MODERATE dependency finding | Overrode `uuid` to patched version `^11.1.1` | Fixed |
| npm dependency audit after remediation | Not previously clean because of `xlsx` | Ran `npm audit` against the updated lockfile | Pass: 0 known vulnerabilities |
| TypeScript validation after remediation | Required regression check | Ran `tsc --noEmit` | Pass |
| Production build after remediation | Required regression check | Ran `tsc -b && vite build` | Pass |

### Current summary

| Classification | Count/status |
|---|---:|
| Earlier application/security scenarios reviewed | 90 |
| Semgrep raw findings reviewed | 10 |
| Semgrep root causes after deduplication | 3 |
| High-severity dependency root causes remaining | 0 |
| Known npm vulnerabilities remaining | 0 |
| Confirmed Semgrep false positives | 1 |
| Repository fixes requiring deployment/migration | Migrations `0022`–`0025` and the current dependency/workflow changes |
| Production/infrastructure items still requiring configuration | MFA, password policy, hosted rate limits/CAPTCHA, backups/restore testing, encryption/region verification |
