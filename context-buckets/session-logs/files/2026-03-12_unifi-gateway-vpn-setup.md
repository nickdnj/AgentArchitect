# UniFi Gateway Ultra - Network, VPN & Tailscale Setup

**Date:** 2026-03-12
**Session type:** execution
**Agents involved:** Voice mode, Chrome browser automation, Gmail (personal)

## Summary

Configured the Wharfside Gateway Ultra (UniFi UCG Ultra) from scratch on Nick's home network. Changed the WAN from a static IP to DHCP, configured OpenVPN with DuckDNS, set up port forwarding on the Verizon router, discovered Verizon 5G Home uses CGNAT (blocking all inbound connections), and pivoted to Tailscale as the remote access solution.

## Key Findings

- Gateway LAN subnet is 192.168.12.0/24 (router at 192.168.12.1)
- WAN port is Port 5 (2.5 GbE), connected to Verizon 5G Home
- Verizon assigns the gateway 192.168.1.76 via DHCP (Verizon LAN subnet is 192.168.1.x)
- Public IP: 75.203.102.180 (SHARED via CGNAT — not directly reachable)
- **Verizon 5G Home uses CGNAT** — confirmed via traceroute showing 10.184.x.x private hop after Verizon router
- OpenVPN server was pre-configured with two users: `nickd` and `JBIT`
- Port forward UDP 1194 was configured on Verizon router but is USELESS due to CGNAT
- Verizon router admin: mynetworksettings.com, password YBFKQS39Z

## Decisions Made

- WAN changed from static 192.168.10.253 to DHCP
- DuckDNS set up (d3marco.duckdns.org) for DDNS
- Port forward UDP 1194 → 192.168.1.76 created on Verizon router
- **OpenVPN abandoned** — CGNAT makes it unreachable from outside
- **Switched to Tailscale** — free for personal use, punches through CGNAT via outbound tunnels
- Tailscale installed on iPhone, Mac, and UniFi Gateway
- VistterStream already had Tailscale and appeared in the tailnet automatically
- **Gateway configured as subnet router** (192.168.12.0/24) and **exit node**

## Artifacts Created

- DuckDNS domain: d3marco.duckdns.org
- Verizon router port forward rule: OpenVPN UDP 1194 → 192.168.1.76
- Tailscale installed on iPhone, Mac, and UniFi Gateway (v1.94.2)
- SSH enabled on gateway (root / Wharfside2025!!!)
- IP forwarding config: /etc/sysctl.d/99-tailscale.conf
- Memory file updated: network-gateway.md

## Session 2 — Tailscale Gateway Setup (2026-03-12, ~9:00 AM)

### Actions Taken
1. Enabled SSH on UniFi Gateway via web UI (Settings → Console → Advanced → SSH)
2. Set SSH password to match gateway admin password
3. SSH'd in via `expect` (sshpass unavailable due to Xcode license issue)
4. Installed Tailscale v1.94.2 via official installer (`curl -fsSL https://tailscale.com/install.sh | sh`)
5. Ran `tailscale up --advertise-routes=192.168.12.0/24 --advertise-exit-node --accept-dns=false`
6. Authenticated via Google (auto-signed in from existing browser session)
7. Approved subnet route (192.168.12.0/24) and exit node in Tailscale admin console
8. Enabled IP forwarding: `echo "net.ipv4.ip_forward = 1" > /etc/sysctl.d/99-tailscale.conf`
9. Verified from iPhone on cellular: successfully accessed UniFi admin at 192.168.12.1

### Tailnet Devices
| Device | Tailscale IP | Notes |
|--------|-------------|-------|
| wharfside-gateway-ultra | 100.82.198.114 | Subnet router + Exit node |
| macbook-air | 100.100.193.125 | Client |
| iphone171 | 100.97.209.5 | Client — verified working on cellular |
| visttertream | 100.108.181.24 | Client |

## Open Items

- [x] ~~Finish Tailscale Mac setup~~ — done
- [x] ~~Test Tailscale connectivity from phone on cellular~~ — verified, works
- [x] ~~Install Tailscale on UniFi gateway~~ — done, subnet router + exit node
- [ ] Key expiry renewal in ~6 months (2026-09-12)
- [ ] Consider disabling SSH on gateway when not needed
- [ ] Home dashboard project — network status, thermostat, home automation

## Context for Next Session

Tailscale is fully deployed and working. The UniFi Gateway is a subnet router (exposing 192.168.12.0/24 to the tailnet) and exit node (routing all internet traffic through home). All four devices are on the tailnet. iPhone verified working on cellular — can access home network and use exit node. Tailscale free Personal plan covers all features used. Key expires in 6 months. Nick wants to build a home dashboard for network/automation monitoring as a future project.
