# BatterUpLI.com DNS Setup for Firebase Hosting

**Date:** 2026-03-22
**Session type:** execution
**Agents involved:** Voice mode (direct assistance, no team delegation)

## Summary

Guided Nick through configuring DNS records at Network Solutions for batterupli.com to enable Firebase Hosting with HTTPS. The domain registrar is Network Solutions. Work is in progress — Nick is adding records.

## Key Findings

- Domain registrar: Network Solutions (networksolutions.com)
- Current DNS state (as of session start):
  - A record: `*` → 151.101.1.195 (wildcard, 2hrs TTL)
  - A record: `@` → 151.101.65.195 (root, 2hrs TTL)
  - A record: `email` → 66.96.163.48 (hosting email)
  - A record: `ftp` → 66.96.163.132 (hosting)
  - A record: `imap` → 66.96.163.132 (hosting)
  - CNAME: `dkim._domainkey` → cur.dkim.v.eigmail.net (email DKIM)
- The existing `@` A record already points to one Firebase IP (151.101.65.195)
- Missing second Firebase A record (151.101.1.195 on `@`)
- No `www` CNAME record exists yet

## Decisions Made

- Add second A record: `@` → 151.101.1.195
- Add CNAME: `www` → batterup-li.web.app
- Wildcard `*` record can be deleted (unnecessary) or left (harmless)
- Do NOT touch email/ftp/imap/DKIM records

## Open Items

- [ ] Nick adding the second A record and www CNAME — awaiting screenshot confirmation
- [ ] Verify Firebase console has batterupli.com added as custom domain
- [ ] Wait for DNS propagation and SSL provisioning (up to 24hrs)
- [ ] Test HTTP and HTTPS after propagation
- [ ] Remove old redirect server at 209.17.116.163 (openresty) once Firebase handles everything

## Context for Next Session

Nick has the DNS panel open at Network Solutions and is actively adding records. He was about to take a screenshot after making changes. The email from March 20 (self-sent) contains the full step-by-step plan including Firebase console setup. Firebase project is `batterup-li` and the web app URL is `batterup-li.web.app`.
