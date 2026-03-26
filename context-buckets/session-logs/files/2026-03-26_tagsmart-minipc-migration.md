# TagSmart v2: Cloud Run to Mini PC Migration

**Date:** 2026-03-26
**Session type:** execution
**Agents involved:** Direct work (no team orchestrator)

## Summary

Migrated TagSmart v2 from Google Cloud Run + Turso (cloud SQLite) + GCS to a fully self-hosted deployment on the Intel N100 mini PC at Wharfside. All cloud dependencies eliminated. Also set up daily automated backups for both TagSmart and VistterStream to separate Google Drive accounts, created disaster recovery bootstrap scripts (`setup.sh`) for both repos, and wrote READMEs.

## Key Findings

- TagSmart's `@libsql/client` already supports local `file://` URLs — zero database code changes needed
- Storage service used `NODE_ENV === 'production'` to decide GCS vs local — replaced with `STORAGE_BACKEND` env var
- Cloudflare token-based tunnel routing is managed via API, not local config files
- Tunnel API endpoint: `PUT /accounts/{account_id}/cfd_tunnel/{tunnel_id}/configurations`
- DNS CNAME must be created separately from tunnel config (API doesn't auto-create)
- VistterStream's cloudflared container needs `extra_hosts: host.docker.internal:host-gateway` to reach services on the host
- Admin user was `active=0` in the Turso dump (had been deactivated at some point) — required manual fix
- Docker slim images don't include `sqlite3` — backup script must use host sqlite3 via Docker volume path

## Decisions Made

- **SQLite over PostgreSQL** — TagSmart already uses SQLite via Turso; local SQLite is simpler, no extra container needed
- **`STORAGE_BACKEND` env var** — Defaults to `local`, can be set to `gcs` for future flexibility
- **Separate Google Drive accounts for backup** — TagSmart → Wharfside account (gdrive), VistterStream → personal account (gdrive-personal)
- **Host port exposure for tunnel routing** — TagSmart exposes port 8080 on host, cloudflared reaches it via host.docker.internal (avoids coupling Docker networks between separate compose files)
- **30-day backup retention** — Daily DB snapshots, pruned after 30 days
- **setup.sh bootstrap pattern** — Both repos get an interactive setup script: fresh install or restore from backup

## Artifacts Created

### TagSmart v2 (`nickdnj/tagsmart-v2`)
- `server/src/services/storageService.ts` — Added STORAGE_BACKEND and UPLOADS_DIR env vars
- `server/src/app.ts` — Serve /uploads in all environments (not just dev)
- `Dockerfile` — Added /data volume with permissions
- `docker/docker-compose.minipc.yml` — Mini PC deployment compose file
- `scripts/backup-to-gdrive.sh` — Daily rclone backup to Google Drive
- `scripts/deploy-minipc.sh` — SSH deploy script
- `setup.sh` — Bootstrap: fresh install or restore from backup
- `README.md` — Full project documentation
- `.env.example` — Updated with new env vars

### VistterStream (`nickdnj/VistterStream`)
- `docker/docker-compose.rpi.yml` — Added extra_hosts to cloudflared service
- `scripts/backup-to-gdrive.sh` — Daily rclone backup to personal Google Drive
- `setup.sh` — Bootstrap: fresh install or restore from backup
- `README.md` — Updated installation section

### Infrastructure
- GitHub repo: `nickdnj/tagsmart-v2` (private) — created and pushed
- Cloudflare tunnel config v6: `tagsmart.vistter.com` → `http://host.docker.internal:8080`
- DNS CNAME: `tagsmart.vistter.com` → tunnel UUID `.cfargotunnel.com`
- Cloudflare API token: "TagSmart" (Account > Cloudflare Tunnel > Edit + Zone > DNS > Edit)
- rclone remotes on mini PC: `gdrive` (Wharfside) + `gdrive-personal` (nickd@demarconet.com)
- Cron jobs: TagSmart backup at 2 AM, VistterStream backup at 3 AM
- Mini PC .env for TagSmart with generated JWT secret

### Email
- Sent to nickd@demarconet.com: "TagSmart Backup Setup — rclone + Google Drive on Mini PC" (deployment summary + rclone instructions)

## Open Items

- [ ] Decommission Cloud Run service (`tagsmart` in `pdfscribe-prod`) — wait a few days to confirm stability
- [ ] Decommission Turso database (`tagsmart` on account `nickdnj`) — after confirming mini PC is stable
- [ ] Change admin password on mini PC deployment (currently `admin123` from migrated data)
- [ ] Test all TagSmart features on new deployment (QR scan, vision AI, incidents)
- [ ] Delete Cloudflare API token after confirming no further tunnel changes needed
- [ ] Consider backing up TagSmart .env to Google Drive (like VistterStream backup does)

## Context for Next Session

TagSmart v2 is fully operational at `https://tagsmart.vistter.com` on the mini PC alongside VistterStream. All production data (1,047 assets, 192 allocations, 7 users, 4 incidents) has been migrated from Turso. Daily backups run to Google Drive (TagSmart at 2 AM to Wharfside account, VistterStream at 3 AM to personal account). Both repos have `setup.sh` bootstrap scripts for disaster recovery. The old Cloud Run deployment is still running but should be decommissioned once the user confirms the mini PC deployment is stable. The Cloudflare API token ("TagSmart") can be revoked after tunnel configuration is confirmed final.
