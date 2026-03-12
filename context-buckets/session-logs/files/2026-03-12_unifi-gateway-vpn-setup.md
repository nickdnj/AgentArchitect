# UniFi Gateway Ultra - WAN, VPN & Dynamic DNS Setup

**Date:** 2026-03-12
**Session type:** execution
**Agents involved:** Voice mode, Chrome browser automation, Gmail (personal)

## Summary

Configured the Wharfside Gateway Ultra (UniFi UCG Ultra) from scratch on Nick's home network. Changed the WAN from a static IP (192.168.10.253, from a previous network) to DHCP, configured the OpenVPN server with a DuckDNS dynamic hostname, and set up automatic DDNS updates.

## Key Findings

- The gateway was previously on a 192.168.10.x network with static WAN IP 192.168.10.253
- Gateway LAN subnet is 192.168.12.0/24 (router at 192.168.12.1)
- WAN port is Port 5 (2.5 GbE), connected to Verizon 5G Home
- Verizon assigns the gateway 192.168.1.76 via DHCP (Verizon LAN subnet is 192.168.1.x)
- Public IP: 75.203.102.180
- OpenVPN server was pre-configured with two users: `nickd` and `JBIT`
- OpenVPN VPN tunnel subnet: 192.168.3.0/24, port 1194
- UniFi OS won't accept a public IP as the VPN server address directly - must use "Alternate Address for Clients"
- Gateway login requires 2FA email verification code (Ubiquiti MFA)

## Decisions Made

- WAN changed from static 192.168.10.253 to DHCP
- DuckDNS chosen as free DDNS provider (Nick already had an account from 2015)
- Created subdomain: d3marco.duckdns.org
- VPN alternate client address set to d3marco.duckdns.org (was raw public IP)
- Network topology: Verizon ONT -> Gateway WAN (Port 5) -> Google Home router on LAN

## Artifacts Created

- DuckDNS domain: d3marco.duckdns.org (token: 52b8715e-f6c9-4af1-a373-e30822625fbc)
- Dynamic DNS entry on gateway: Duckdns service, hostname d3marco, server www.duckdns.org
- Memory file updated: network-gateway.md

## Open Items

- [ ] Port forwarding on Verizon router: UDP 1194 -> 192.168.1.76 (required for VPN from outside)
- [ ] Download OpenVPN config file from gateway and install on phone
- [ ] Test VPN connection from phone on cellular (not on home WiFi)
- [ ] Consider putting Google Home router in bridge mode to avoid double NAT
- [ ] Verizon 5G Home may use CGNAT - verify public IP is truly reachable from outside
- [ ] Gateway password is Wharfside2025!!! (corrected from initial Wharfside2005!!!)

## Context for Next Session

The UniFi Gateway Ultra is deployed and online with Verizon 5G Home as the ISP. WAN is on DHCP, OpenVPN server is configured with d3marco.duckdns.org as the client-facing address. The critical remaining step is port forwarding UDP 1194 on the Verizon router to the gateway at 192.168.1.76. Without this, VPN connections from outside the network will not reach the gateway. There's also a risk that Verizon 5G Home uses CGNAT, which would make direct VPN impossible without a relay service. The OpenVPN config file can be downloaded from the gateway at https://192.168.12.1 under VPN Server settings.
