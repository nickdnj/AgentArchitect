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
- Tailscale installed on iPhone and Mac (Mac install pending VPN permission approval)
- VistterStream already had Tailscale and appeared in the tailnet automatically

## Artifacts Created

- DuckDNS domain: d3marco.duckdns.org
- Verizon router port forward rule: OpenVPN UDP 1194 → 192.168.1.76
- Tailscale installed on iPhone and Mac
- Memory file updated: network-gateway.md

## Open Items

- [ ] Finish Tailscale Mac setup (approve VPN configuration in System Settings if stuck)
- [ ] Test Tailscale connectivity from phone on cellular
- [ ] Consider enabling Tailscale exit node on Mac for full traffic routing
- [ ] Consider installing Tailscale on UniFi gateway via SSH

## Context for Next Session

The UniFi Gateway Ultra is deployed and online with Verizon 5G Home as the ISP. OpenVPN was configured with DuckDNS and port forwarding, but Verizon 5G Home's CGNAT makes inbound connections impossible. Pivoted to Tailscale for remote access. Tailscale is installed on the iPhone (working) and Mac (install in progress — may need VPN permission approval in macOS System Settings). VistterStream already had Tailscale and joined the tailnet. Nick's use case is emergency/rare remote access to home network devices, not always-on VPN.
