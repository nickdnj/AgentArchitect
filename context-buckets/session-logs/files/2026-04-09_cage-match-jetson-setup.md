# Cage Match — Jetson Orin Nano Super Setup Session

**Date:** 2026-04-09
**Session type:** execution
**Agents involved:** Direct (no team orchestrator)

## Summary

Prepared the Jetson Orin Nano Super for Cage Match deployment. Created an automated bootstrap script, researched the correct JetPack download, and identified a potential firmware stepping-stone requirement. The Jetson is powered on but has no OS — JetPack 6.2.1 needs to be flashed via SD card.

## Key Findings

- Jetson is NOT on the network (confirmed via ARP scan + ping sweep) — consistent with needing JetPack flash
- JetPack 6.2.1 SD card image: `jp62-r1-orin-nano-sd-card-image.zip` from https://developer.nvidia.com/embedded/jetpack-sdk-621
- No separate "Super" image — same Orin Nano image, MAXN SUPER power mode enabled after boot
- **Critical**: If Jetson firmware < 36.0, must flash JetPack 5.1.3 first to update QSPI firmware, then flash 6.2.1
- JetPack 6.2.2 exists (L4T 36.5) but has no SD image — flash 6.2.1, then apt upgrade
- NVIDIA's official tutorial at https://www.jetson-ai-lab.com/tutorials/initial-setup-jetson-orin-nano/ covers firmware check process
- Existing setup guide already in repo at `cage-match/docs/jetson-setup.md` (comprehensive, 10 sections)

## Decisions Made

- Will use SD card flash method (not SDK Manager) since Nick is on Mac
- OOBE config: username `cage`, hostname `cage-match-01`
- Need HDMI monitor + USB keyboard + Ethernet for initial setup, then go headless via SSH
- Bootstrap script automates everything post-OOBE (Docker, NVIDIA runtime, venv, repo clone, systemd)

## Research Sources

- https://developer.nvidia.com/embedded/jetpack-sdk-621 — JetPack 6.2.1 download page
- https://www.jetson-ai-lab.com/tutorials/initial-setup-jetson-orin-nano/ — NVIDIA official setup tutorial (firmware check, stepping-stone process)
- https://etcher.balena.io/ — Balena Etcher for SD card flashing

## Artifacts Created

- `cage-match/scripts/jetson-bootstrap.sh` — Automated post-flash setup script (9 steps: platform verify, packages, Docker+NVIDIA, venv, OpenCV verify, repo clone, hostname, performance mode, systemd service)

## Open Items

- [ ] Flash JetPack 6.2.1 (check firmware version at UEFI first)
- [ ] Run bootstrap script after OOBE
- [ ] Connect Arducam IMX477 when it arrives tonight
- [ ] Test CV pipeline with real camera (tennis ball toss)

## Context for Next Session

The Jetson Orin Nano Super is physically powered on but has no OS. Next physical step is: plug in HDMI + keyboard, press Esc during boot to check firmware version, then flash JetPack 6.2.1 via SD card. After OOBE, SCP over `jetson-bootstrap.sh` and run it. The Arducam IMX477 camera arrives tonight — connect to CAM0 (22-pin CSI) with Jetson powered off, then verify with `dmesg | grep imx477`.
