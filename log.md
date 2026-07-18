# Security Testing Log

**Project:** Coach Platform / Workout Program  
**Last updated:** 2026-07-18  
**Stack:** React, TypeScript, Vite, Supabase/PostgreSQL  

## Overall results

| Review | Tests/findings | Current result |
|---|---:|---|
| Manual application and security audit | 90 scenarios | Reviewed and documented |
| Semgrep Pro scan | 10 raw findings | All reviewed |
| Semgrep root causes after deduplication | 3 | 2 fixed, 1 false positive |
| npm dependency audit | Full production dependency tree | 0 known vulnerabilities |
| TypeScript validation | Full project | Passed |
| Production build | Full project | Passed |

## Vulnerability test table

| Area tested | Previous result | Current result / protection |
|---|---|---|
| SQL injection | Safe | Supabase query builders and typed RPC parameters prevent raw user-built SQL |
| NoSQL injection | Not applicable | No NoSQL database or query interface exists |
| Command injection | Safe | User input never reaches a command shell or process launcher |
| LDAP injection | Not applicable | No LDAP integration exists |
| Stored XSS | Safe | React escapes names, messages, comments, foods, and other stored text |
| Reflected XSS | Safe | Route and query values are not rendered as raw HTML |
| DOM XSS | Safe | No unsafe HTML sinks; unsafe URL schemes are rejected |
| CSRF | Low exposure | Supabase uses bearer authorization instead of ambient application cookies |
| Weak passwords | Production configuration required | Supabase handles passwords; strengthen hosted password policy |
| Token storage | Conditional | Browser session persistence is acceptable while XSS protections remain effective |
| Session fixation | Safe | Supabase issues and refreshes signed sessions |
| MFA | Production configuration required | Require MFA for administrators in Supabase Auth |
| Broken access control | Previously vulnerable | Fixed through RLS migration `0022` and server-side checks |
| Signup role escalation | Previously vulnerable | Fixed; new profiles always start as players |
| Profile role escalation | Previously vulnerable | Fixed; users cannot update role or protected profile fields |
| IDOR / changed record IDs | Previously vulnerable | Fixed through coach-player ownership checks in RLS and RPCs |
| Unauthorized direct API access | Previously vulnerable | Fixed; direct Supabase requests are subject to RLS and constraints |
| Subscription bypass | Previously vulnerable | Fixed; active subscriptions are enforced server-side |
| Admin action access | Previously vulnerable | Fixed; admin RPCs authorize the caller server-side |
| Sensitive data in transit | Safe | Production endpoints use HTTPS/WSS and HSTS |
| Sensitive data at rest | Production verification required | Confirm Supabase encryption, region, and plan controls |
| Hardcoded secrets | Safe | No service-role or private production secret is tracked |
| Sensitive logging | Safe | Passwords and tokens are not logged |
| General rate limiting | Production configuration required | Configure Supabase/gateway limits and HTTP 429 handling |
| Brute-force login/key attempts | Partially addressed | Local Auth limits exist; enable hosted limits and CAPTCHA |
| Account enumeration | Hardened | Login errors are uniform; retain hosted anti-enumeration controls |
| Input validation | Previously vulnerable | Fixed with text, row, count, URL, file, and database constraints |
| Null/empty inputs | Hardened | Required fields and SQL/RPC validation reject invalid state |
| Extreme counts/integers | Hardened | Practical limits exist for weeks, rows, meals, exercises, and sets |
| Mass assignment | Previously vulnerable | Fixed through restricted columns and self-authorizing RPCs |
| Malformed request payloads | Hardened | Database constraints and RPC validation reject malformed data |
| Hidden/disabled field manipulation | Previously vulnerable | Fixed; server rules independently enforce UI restrictions |
| Workflow/state bypass | Previously vulnerable | Fixed with server-side role, ownership, and subscription validation |
| Race conditions/double submission | Hardened | Pending states, uniqueness, row locks, and atomic imports are used |
| Key-claim replay | Safe | Claims use row locking and single-use state |
| Replayed write requests | Mostly safe | Critical imports/claims are atomic; repeated chat messages remain intentional |
| Error information leakage | Partially fixed | Login errors are uniform; authenticated mutation errors may expose limited schema detail |
| File type restrictions | Previously vulnerable | Fixed with client and Storage allowlists |
| File size/storage exhaustion | Previously vulnerable | Fixed with 50 MB video, 25 MB attachment, and 2 MB workbook limits |
| Upload path traversal | Previously vulnerable | Fixed using rejected separators/null bytes and generated UUID filenames |
| Fake video MIME/extension | Previously vulnerable | Fixed with extension, MIME, signature, quarantine, and malware scanning |
| Polyglot/malicious videos | Previously vulnerable | Fixed; files remain quarantined until malware scanning passes |
| Malware scanner failure | Previously vulnerable | Fixed; errors and inconclusive results delete quarantine objects |
| Malware-scan bypass | Previously vulnerable | Fixed; users cannot insert directly into the final video bucket |
| Unsafe external URLs | Previously vulnerable | Fixed; only public HTTP/HTTPS URLs without credentials are accepted |
| SSRF | Safe | Submitted URLs are not fetched server-side and private targets are rejected |
| Null-byte filenames | Previously vulnerable | Fixed; null bytes and path separators are rejected |
| ZIP/decompression bombs | Previously vulnerable | Fixed with entry, ZIP64, expanded-size, and compression-ratio limits |
| Spreadsheet formula injection | Previously vulnerable | Fixed by prefixing formula-leading exported cells |
| Spreadsheet parser CVEs | Four reachable HIGH Semgrep findings | Fixed; vulnerable `xlsx@0.18.5` was removed and replaced with ExcelJS |
| ExcelJS transitive UUID advisory | One MODERATE finding during remediation | Fixed with patched `uuid ^11.1.1`; npm audit is clean |
| Atomic workout imports | Previously vulnerable to partial replacement | Fixed with transactional `replace_program_import` RPC |
| Atomic diet imports | Previously vulnerable to partial replacement | Fixed with transactional `replace_diet_import` RPC |
| Search/sort injection | Safe | Sort and filter fields are fixed application values |
| Search information leakage | Safe | RLS filters unauthorized rows before client filtering |
| Expensive searches | Conditional | Fixed filters and row ceilings exist; hosted rate limiting is still recommended |
| Dependency vulnerabilities | Previously open | Fixed; `npm audit` currently reports zero known vulnerabilities |
| Mutable GitHub Actions | Five Semgrep findings | Fixed by pinning all actions to full 40-character commit SHAs |
| Console format-string warning | One Semgrep finding | False positive; interpolated year is local and not attacker-controlled |
| CSP | Partially hardened | CSP exists; current UI still requires inline-style allowances |
| HTTP security headers | Safe | HSTS, frame denial, nosniff, referrer, CSP, and permissions policies exist |
| CORS | Externally managed | Controlled by Supabase and the authenticated Edge Function |
| Database least privilege | Previously vulnerable | Fixed through migrations `0022`–`0025` |
| Parameterized queries | Safe | Supabase filters and RPC parameters are parameterized |
| JWT tampering/expiry | Safe | Supabase validates signature and expiry; subscription expiry is separately enforced |
| Obsolete cryptography | Safe | No application use of MD5, SHA-1, TLS 1.0, or TLS 1.1 was found |
| OAuth/open redirect | Not applicable | OAuth/social login is not implemented |
| Webhook forgery | Not applicable | No webhook or callback endpoint exists |
| Payment manipulation | Not applicable | Payment processing is not implemented |
| Email/notification spam | Not applicable | No arbitrary email or notification endpoint exists |
| Soft-delete access | Not applicable | The schema does not use soft deletion |
| Mobile-specific risks | Not applicable yet | No mobile application source exists in this repository |
| Local database tampering | Not applicable to production | Production uses hosted Supabase |
| Temporary/cache files | Safe in repository | Environment files, local Supabase state, and build output are ignored |
| Backup and restoration | Production configuration required | Configure backups and test isolated restoration procedures |
| Restored access state | Production procedure required | Verify RLS and revoked access after every restoration exercise |

## Semgrep retest details

Semgrep Pro 1.169.0 scanned 104 Git-tracked files using 2,944 code rules and
85,615 supply-chain rules.

| Finding | Raw count | Resolution |
|---|---:|---|
| `xlsx` CVE-2024-22363, ReDoS | 2 | Fixed by removing `xlsx` |
| `xlsx` CVE-2023-30533, prototype pollution | 2 | Fixed by removing `xlsx` |
| Mutable GitHub Action tags | 5 | Fixed with immutable commit SHAs |
| Unsafe console format string | 1 | Confirmed false positive |

## Verification after fixes

| Check | Result |
|---|---|
| `npm audit` | Passed — 0 known vulnerabilities |
| `npm run typecheck` | Passed |
| `npm run build` | Passed |
| Vulnerable `xlsx` package present | No |
| GitHub Actions using mutable tags | No |

## Production actions added

| Action | Repository implementation | Hosted action still required |
|---|---|---|
| Administrator MFA | Added TOTP enrollment/verification UI and migration `0026`, which requires an `aal2` JWT for admin RLS and RPC access | Enable TOTP in Supabase before deploying migration `0026` |
| Strong password policy | Added 10-character, mixed-case, digit, and symbol requirements to `supabase/config.toml` | Mirror the policy and enable leaked-password protection in Supabase Dashboard |
| Rate limiting and CAPTCHA | Retained explicit local Auth limits and documented secure secret handling | Mirror limits and configure CAPTCHA/gateway controls in Supabase Dashboard |
| Encryption and region | Added a production verification checklist | Verify the hosted plan, project region, encryption, dashboard membership, and keys |
| Database hardening | Migrations `0022`–`0026` contain the required RLS, RPC, upload, atomicity, and MFA controls | Apply any migration not yet deployed, in numerical order |

Backup and restore work is intentionally deferred and is not part of the current production-action scope.

The detailed original 90-scenario record remains in `SECURITY_AUDIT_LOG.md`.
