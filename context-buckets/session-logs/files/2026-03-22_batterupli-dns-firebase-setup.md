# BatterUpLI.com DNS Setup for Firebase Hosting

**Date:** 2026-03-22 (updated 2026-03-23)
**Session type:** execution
**Agents involved:** Voice mode (direct assistance, no team delegation)

## Summary

Configured DNS records at Network Solutions for batterupli.com to point to Firebase Hosting (batterup-li.web.app). After multiple rounds of troubleshooting — including Network Solutions' "website forwarding" overriding DNS, wrong IPs, and Firebase domain verification issues — the root domain is now connected and serving content over HTTPS.

## Key Findings

- Domain registrar: Network Solutions (networksolutions.com)
- Nameservers: `ns1.mydomain.com` / `ns2.mydomain.com` (Network Solutions default)
- Firebase project: `batterup-li` → `https://batterup-li.web.app`
- Firebase Hosting workspace: `~/Workspaces/batterupli/`
- Network Solutions has a "website forwarding" feature that auto-creates an A record to their parking page (`205.178.189.129` = `underconstruction.networksolutions.com`). Nick had to call their support to disable this.
- Network Solutions is slow to push DNS changes to nameservers (10-30 min delay after saving in panel)
- Firebase expected IP changed from old Fastly IPs (`151.101.1.195`, `151.101.65.195`) to Google IP (`199.36.158.100`)
- Firebase Hosting REST API: `https://firebasehosting.googleapis.com/v1beta1/projects/batterup-li/sites/batterup-li/domains` (requires `x-goog-user-project: batterup-li` header)

## DNS Records (Final State)

| Type | Host | Value | Status |
|------|------|-------|--------|
| A | `@` | `199.36.158.100` | Propagated |
| CNAME | `www` | `batterup-li.web.app` | Propagated |
| TXT | `@` | `hosting-site=batterup-li` | Added, propagating |
| A | `email` | `66.96.163.48` | Unchanged |
| A | `ftp` | `66.96.163.132` | Unchanged |
| A | `imap` | `66.96.163.132` | Unchanged |
| CNAME | `dkim._domainkey` | `cur.dkim.v.eigmail.net` | Unchanged |

## Decisions Made

- Replaced old Fastly A records with single Google IP `199.36.158.100`
- Added CNAME: `www` → `batterup-li.web.app`
- Removed and re-added custom domain in Firebase Console to reset verification (old domain had `DOMAIN_VERIFICATION_LOST` status from March 7)
- Added TXT verification record `hosting-site=batterup-li`
- Do NOT touch email/ftp/imap/DKIM records

## Timeline

1. **Mar 22 session 1**: Diagnosed DNS pointing to NS parking page. Guided Nick through A record and www CNAME changes.
2. **Mar 22 session 2**: A record was propagated but with old Fastly IPs. Guided Nick to replace with `199.36.158.100`.
3. **Mar 22-23**: A record propagated correctly. Firebase showed `DOMAIN_VERIFICATION_LOST` with `CERT_PROPAGATING`. SSL cert issued (`CN=batterupli.com` by Google Trust Services) but site returned 404 ("Site Not Found").
4. **Mar 23**: Deleted stale domain via Firebase API, re-added via Firebase Console UI. Firebase requested TXT record for verification. After TXT added (pending propagation), Firebase status changed to **"Connected"** and site returned HTTP 200 with correct content.

## Open Items

- [x] Root domain A record → `199.36.158.100`
- [x] www CNAME → `batterup-li.web.app`
- [x] Firebase custom domain added and verified (status: Connected)
- [x] SSL cert provisioned for `batterupli.com`
- [x] `https://batterupli.com` serving correct content (HTTP 200)
- [ ] `www.batterupli.com` needs to be added as separate custom domain in Firebase for its own SSL cert (currently shows cert mismatch)
- [ ] Nick reported "not secure" in browser — likely DNS cache; advised hard refresh / incognito / DNS flush
- [ ] TXT record `hosting-site=batterup-li` still propagating through NS nameservers
- [ ] Remove old redirect server at 209.17.116.163 (openresty) once everything is confirmed stable

## Context for Next Session

The root domain `https://batterupli.com` is live and serving content from Firebase Hosting (confirmed via curl: HTTP 200, valid SSL, correct HTML). Firebase Console shows "Connected" status. The `www` subdomain's CNAME is correct but needs to be added as a separate custom domain in Firebase to get its own SSL cert — currently HTTPS to www fails with a cert mismatch (serves `firebaseapp.com` cert). Nick may also need to clear browser DNS cache to see the secure connection.
