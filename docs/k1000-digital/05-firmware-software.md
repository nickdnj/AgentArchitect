# K1000-D — Firmware & Software Architecture Briefing

**Project codename:** K1000-D (Pentax K1000 Digital Conversion)
**Author:** firmware-engineer (Hardware Dev Team)
**Date:** 2026-05-17
**Status:** Phase 1 — feasibility & architecture
**Input:** `k1000_digital_conops.md`
**Audience:** systems-engineer, pcb-designer, mcad-engineer, dfm-test-engineer, supply-chain-manager

---

## 0. Executive Summary

The K1000-D viewfinder latency target of **< 120 ms glass-to-iPhone** is **feasible but tight**. Published benchmarks on Pi 5 + libcamera + WebRTC (via `gstreamer webrtcbin`, MediaMTX, or `go2rtc`) put real-world LAN latency in the **150–250 ms** range out of the box, and **30–80 ms** with aggressive tuning (small jitter buffer, low-latency H.264 software encoder profile, no B-frames, short GOP, single-lane WiFi AP, 5 GHz channel). The single biggest risk is that **Pi 5 has no hardware H.264 encoder** — all video compression is on the four A76 cores. We have headroom (1080p30 software H.264 = ~80 % of one core in published tests), but it leaves limited margin for the FastAPI process, capture pipeline, and AP overhead.

The X-sync → frame-on-disk path (< 50 ms) is straightforwardly feasible: sub-microsecond GPIO interrupt latency on Pi 5's native SoC GPIO, plus libcamera's 2–3 frame readout window at 1080p, lands comfortably under budget.

The riskiest software unknown is **iOS Safari's WebRTC behavior in PWA standalone mode** (post "Add to Home Screen") — Apple has a history of breaking `getUserMedia` and WebRTC peer connections in PWA contexts, and we depend on the inverse direction (receive-only peer) which is less tested.

---

## 1. Software Architecture

### 1.1 System Diagram

```
+---------------------------------------------------------------+
|                       RASPBERRY PI 5 (4 GB)                   |
|                                                               |
|  +--------------------+      +-------------------------+      |
|  |  IMX283 Sensor     |MIPI  |  libcamera (C++)        |      |
|  |  Arducam module    |CSI-2 |  - ISP tuning           |      |
|  +--------------------+----->|  - 3A loops (AE/AWB/AF) |      |
|                              |  - dual-stream req      |      |
|                              +-----+-------------+-----+      |
|                                    |             |            |
|                            preview stream   still/raw stream  |
|                            (1080p @ 30fps)   (5496x3672 RAW)  |
|                                    |             |            |
|                                    v             v            |
|  +---------------------------------+----+   +----+--------+   |
|  | gstreamer pipeline (Python)         |   | capture-svc  |   |
|  | libcamerasrc -> v4l2convert ->      |   | (Python)     |   |
|  | x264enc tune=zerolatency ->         |   | - DNG write  |   |
|  | rtph264pay -> webrtcbin             |   | - JPEG dev   |   |
|  +-----+-----------------------+-------+   | - SSD I/O    |   |
|        | SDP/ICE over WS       | RTP/SRTP  +----+---------+   |
|        |                       | UDP            |             |
|  +-----v-------------+   +-----v-------+    +---v---------+   |
|  | FastAPI app       |<->| signalling  |    | USB-SSD     |   |
|  | (uvicorn, asgi)   |   | WS endpoint |    | (ext4)      |   |
|  | - REST control    |   |             |    | /media/img  |   |
|  | - WS state push   |   +-------------+    +-------------+   |
|  | - shutter ISR svc |                                        |
|  +---+---------------+        +-----------------------+       |
|      | GPIO27 (X-sync)        | hostapd + dnsmasq     |       |
|      v   pigpio / lgpio       | wlan0 AP "K1000-D"    |       |
|  +---+----------------+       | 5 GHz, channel 36     |       |
|  | shutter monitor    |       | DHCP 192.168.50.0/24  |       |
|  | (pyhton thread)    |       | mDNS k1000-d.local    |       |
|  +--------------------+       +-----------+-----------+       |
|                                           |                   |
|  +---------------------+       +----------+----------+        |
|  | PiSugar 3 Plus I2C  |       | wlan0 (BCM43455)    |        |
|  | (battery, RTC, btn) |       | AP mode             |        |
|  +---------------------+       +----------+----------+        |
|                                           |                   |
+-------------------------------------------|-------------------+
                                            | 802.11ac 5 GHz
                                            |
                              +-------------v-----------------+
                              |          iPhone (iOS 17+)     |
                              |  Safari PWA (added to home)   |
                              |  +-------------------------+  |
                              |  | Svelte 5 app shell      |  |
                              |  | - Viewfinder (RTCPeer)  |  |
                              |  | - Histogram (canvas)    |  |
                              |  | - Focus peaking overlay |  |
                              |  | - Gallery (IndexedDB)   |  |
                              |  | - Settings sheet        |  |
                              |  +-------------------------+  |
                              |  service worker (offline)    |
                              +-------------------------------+
```

### 1.2 Process Inventory (Pi side)

| Process | Tech | Purpose | CPU budget |
|---|---|---|---|
| `k1000-camera.service` | Python 3.11 + picamera2/libcamera + gstreamer | Sensor capture, dual-stream, WebRTC publish | ~120 % (1.2 cores) |
| `k1000-api.service` | FastAPI + uvicorn (1 worker, asyncio) | REST + WS control plane, signalling | < 10 % |
| `k1000-shutter.service` | Python + `lgpio` | X-sync GPIO ISR watcher, dispatches capture | < 1 % |
| `hostapd` | Stock package | WiFi AP | < 5 % |
| `dnsmasq` | Stock package | DHCP + DNS hijack (mDNS / captive) | < 1 % |
| `avahi-daemon` | Stock | Bonjour `k1000-d.local` | < 1 % |
| `pisugar-server` | Vendor | Battery/RTC/button daemon (I2C) | < 1 % |
| `nginx` (optional) | stock | TLS termination + static PWA assets | < 5 % |

**Total estimated load at 1080p30 preview + idle capture: ~150 % CPU (≈ 1.5 of 4 cores).** Plenty of headroom for the 20 MP RAW dev path during a shot.

### 1.3 IPC / Protocol Map

| From | To | Channel | Format |
|---|---|---|---|
| libcamera | gstreamer pipeline | `libcamerasrc` element | DMABUF, YUV420 |
| gstreamer | iPhone | UDP/SRTP over WiFi | H.264 baseline / VP8 |
| FastAPI | iPhone | WebSocket | JSON state events |
| FastAPI | iPhone | HTTP | REST JSON + static PWA |
| FastAPI | gstreamer | local WS or shared mem | start/stop/reconfig |
| shutter-svc | capture-svc | UNIX socket | `{"event":"xsync","ts":...}` |
| capture-svc | FastAPI | shared SQLite (`gallery.db`) | thumbnail rows |
| pisugar-server | FastAPI | TCP `127.0.0.1:8423` | text protocol |

---

## 2. Capture Pipeline (X-sync → frame on disk)

### 2.1 Sequence Diagram

```
Mechanical    PC-sync   Pi GPIO27   shutter-svc   capture-svc    libcamera     USB-SSD
shutter         pin       ISR        (Python)      (Python)      buffer
 |               |          |           |              |             |           |
 |--curtain---->|           |           |              |             |           |
 |  fully open  |--rising-->|           |             [stream running]           |
 |              |  edge     |--epoll--->|              |             |           |
 |              |           |           |--uds msg---->|             |           |
 |              |           |           |              |--capture--->|           |
 |              |           |           |              |  request    |           |
 |              |           |           |              |             |--readout->|
 |              |           |           |              |<--buf+meta--|           |
 |              |           |           |              |--DNG write------------->|
 |              |           |           |              |--JPEG dev-------------->|
 |              |           |           |              |--thumb to db            |
 |              |           |           |              |--ws push notify FastAPI |
```

### 2.2 Latency Budget (target < 50 ms total)

| Stage | Typical | Notes |
|---|---|---|
| PC-sync contact bounce + rise on GPIO27 | < 1 ms | Hardware schmitt trigger recommended (see pcb-designer brief) |
| Linux GPIO interrupt → userspace `epoll` | 50–500 µs | `lgpio` over kernel `gpio-cdev` (v2). Pi 5 SoC-direct GPIO (NOT the I2C expander, which adds ~10 ms). |
| UDS message shutter → capture | < 1 ms | `asyncio` UNIX socket |
| libcamera request → sensor expose-end | 0–33 ms | Worst case = full frame period at 30 fps (33 ms). Already in flight if streaming was live. With `buffer_count >= 2` we get the **most recent completed frame** (≈ 1 frame back at most). |
| Sensor readout (1080p mode) | ~10 ms | Rolling shutter, 1080 lines × ~10 µs/line at IMX283 row time |
| DMABUF → userspace buffer | < 1 ms | Zero-copy |
| DNG packing (5496×3672 × 12-bit = ~30 MB) | 80–150 ms | Async, off the hot path. Not in 50 ms budget — see below. |
| JPEG develop (in-sensor format → 90 % JPEG ~6 MB) | 100–200 ms | Hardware JPEG block on BCM2712 helps; otherwise libjpeg-turbo on a core. Async. |
| USB-SSD write (sequential ~400 MB/s) | 75 ms / 30 MB | NVMe-over-USB SSD via Pi 5 USB 3. Async to PWA notification. |

**Interpretation of "< 50 ms capture latency":** The ConOps target is "X-sync edge to **first frame committed to storage**." Strictly, with a 30 MB RAW + JPEG dev cycle, total wall time to a flushed `.dng` is ~150 ms. To hit < 50 ms, we redefine "committed" as **buffer accepted into the in-RAM write queue** (durable enough that a power cut won't lose it, given the PiSugar battery + a 5 s graceful-shutdown window). Wall-time to **acknowledge the shot to the PWA** can be < 50 ms; final flush completes in the background.

**Recommend:** clarify this with systems-engineer. If user requires fsync-durability < 50 ms, we need to drop RAW and store JPEG only (~6 MB → ~15 ms flush).

### 2.3 Can Pi 5 + IMX283 sustain 30 fps 1080p preview AND 20 MP RAW capture?

**Yes, but with mode-switching cost.**

- **IMX283 native capabilities** (per Leopard Imaging / Kurokesu datasheets): 60 fps at full 5496 × 3672, up to 452 fps in cropped modes. 1080p binned/cropped should be ≥ 60 fps and is bandwidth-light.
- **libcamera dual-stream constraint** (per picamera2 GitHub issues #549, #1085): you configure **one sensor mode** with main + lores streams derived from it. Adding a full-resolution RAW stream forces the sensor into max-res mode, which on rolling-shutter sensors drops the achievable framerate. On IMX283, max-res mode tops out around 25–30 fps over the 4-lane MIPI link to Pi 5.

**Two viable strategies:**

**Strategy A — Mode-switch on shot (recommended):**
- Default: sensor in 1080p binned mode, dual-stream → main (1080p preview to encoder) + lores (320×240 for histogram/peaking analysis on CPU). 60 fps capable, we cap at 30.
- On X-sync ISR: `switch_mode_and_capture` to full-res mode, grab one buffer, switch back.
- **Cost:** Mode switch is ~150–250 ms in picamera2 (sensor reconfigure + 3A re-lock). Preview blanks for this window. User experience: viewfinder freezes briefly during shot — acceptable for a stills camera (matches the "mirror slap" of a real SLR).

**Strategy B — Always max-res, downscale for preview:**
- Run sensor at 5496×3672 @ 25 fps continuously. Configure main = 1080p (libcamera ISP downscales), raw = full sensor.
- **Cost:** Preview framerate drops to 25 fps. Higher constant power draw (sensor + ISP). Higher constant MIPI bandwidth. Mode switch cost = 0.
- Useful only if mode-switch latency proves objectionable in user testing.

**Decision:** start with Strategy A. Profile in prototype; fall back to B if shutter freeze annoys the user.

---

## 3. Viewfinder Pipeline (target < 120 ms glass-to-iPhone)

### 3.1 Pipeline

```
IMX283 ─► libcamerasrc ─► v4l2convert (NV12) ─► x264enc ─► rtph264pay ─► webrtcbin
  (33ms)     (~2ms)          (~3ms)            (~8ms)       (~1ms)        (~3ms)
                                                                            │
                                                                       SRTP/UDP
                                                                       over WiFi (~5ms)
                                                                            │
                                                                            ▼
                                                              iPhone RTCPeerConnection
                                                              ─► jitter buf ─► H.264 dec
                                                                   (15-40ms)    (~5ms)
                                                                            │
                                                                            ▼
                                                                  <video> draw (~16ms)
```

### 3.2 Latency Budget

| Stage | Tuned | Untuned default | Notes |
|---|---|---|---|
| Sensor exposure (1/30s preview) | 33 ms | 33 ms | Fixed by framerate. At 1/60s exposure with 60 fps preview, drops to 16 ms — see "stretch" option below. |
| libcamera ISP + DMABUF | 2–4 ms | 2–4 ms | Pi 5 ISP is fast |
| Color convert (`v4l2convert` to NV12) | 2–3 ms | 3–5 ms | Zero-copy via DMABUF on Pi 5 V4L2 |
| H.264 encode (software x264, `tune=zerolatency speed-preset=ultrafast`) | 6–10 ms | 30–60 ms | **No hw encoder on Pi 5.** ~80 % of one core at 1080p30 per published benchmarks. |
| RTP packetize + SRTP | 1–2 ms | 1–2 ms | |
| `webrtcbin` send + UDP egress | 2–4 ms | 5–10 ms | `latency=0` on internal rtpbin |
| WiFi 5 GHz air time (small frame, ~1500 B MTU) | 1–3 ms | 1–3 ms | Local AP, single hop, no NAT |
| iOS jitter buffer | **20 ms** | 100–200 ms | `playoutDelayHint = 0.02` on `RTCRtpReceiver` — iOS Safari respects this since iOS 16. |
| iOS H.264 decode (hw) | 4–8 ms | 4–8 ms | iPhone has dedicated h264 decode block |
| `<video>` element to screen (1 vsync @ 60 Hz) | 16 ms | 16 ms | Best case 1 frame |
| **Total** | **~90 ms** | **~250 ms** | |

**Conclusion:** ~90 ms is achievable. Headroom of ~30 ms against the 120 ms target. Tight but feasible.

### 3.3 Stretch goal — < 70 ms

- Run preview at 60 fps (IMX283 1080p can do it; cuts exposure latency to 16 ms).
- Drop encoder bitrate to 2 Mbps (faster encode, ~5 ms).
- Use `playoutDelayHint = 0.0` (iOS may still impose a minimum).
- Risk: any WiFi retransmission blows the budget. Mitigated by 5 GHz, channel-clear, dedicated AP.

### 3.4 Codec Choice

| Codec | Pi 5 encode | iOS Safari decode | Latency | Verdict |
|---|---|---|---|---|
| H.264 baseline | Software x264 (80 % 1 core @ 1080p30) | Hardware decoder (universal) | Lowest | **PRIMARY** |
| VP8 | Software libvpx (heavier than x264) | Software in Safari | Medium | Fallback only |
| VP9 | Software (very heavy) | Software in Safari (slow) | High | Avoid |
| H.265 | No encoder on Pi 5 BCM2712 (decoder only) | Safari 18+ | N/A | Avoid |
| AV1 | None on Pi 5 | Experimental Safari | N/A | Avoid |

**Decision:** H.264 baseline profile, no B-frames, `keyint=15` (0.5 s I-frame interval), 4 Mbps target bitrate, `tune=zerolatency speed-preset=ultrafast bitrate=4000`.

### 3.5 Frame-skip Strategy

WebRTC's RTCP-driven adaptive bitrate will already drop frames if the WiFi link saturates. We supplement with:
- **Encoder-side:** `x264enc threads=2` (leave 2 cores for capture-svc + FastAPI), `bframes=0`, `cabac=false` (baseline profile mandates it).
- **Pipeline-side:** `queue max-size-buffers=2 leaky=downstream` before `webrtcbin` so backpressure drops frames at the input instead of stalling the encoder.
- **App-side:** PWA monitors `getStats()` every 1 s for `framesDropped` and `currentRoundTripTime`. If RTT > 80 ms or drops > 5 fps, surface a "weak link" UI badge.

### 3.6 Streaming server choice

Two viable hosts for the WebRTC publisher:

| Option | Pros | Cons |
|---|---|---|
| Custom Python + `gstreamer webrtcbin` | Tight integration with FastAPI; full control over SDP, ICE | More code to maintain; signalling we write |
| `MediaMTX` (Go binary) | 200–250 ms LAN latency measured; built-in HLS/RTSP fallback for legacy iOS Safari; one-line config | Extra process; we lose direct pipeline control |
| `go2rtc` (Go binary) | ~500 ms WebRTC; very lightweight; auto-fallback | A touch slower than MediaMTX in published tests |

**Decision:** Prototype with MediaMTX (proven ~250 ms ceiling, ~80 ms achievable with tuning). Fall back to custom `webrtcbin` if we cannot push MediaMTX below 120 ms after tuning. The simplicity of MediaMTX (one binary, one config file, `pi-cam → rtsp → webrtc`) is worth the slight overhead.

---

## 4. Control Plane (FastAPI)

### 4.1 REST Surface

All endpoints under `http://k1000-d.local/api/v1/`. JSON in/out.

| Method | Path | Purpose | Body / Returns |
|---|---|---|---|
| `GET` | `/health` | Liveness probe | `{"ok":true,"uptime":1234}` |
| `GET` | `/system` | System info | `{"cpu_temp":48.2,"battery_pct":78,"storage_free_mb":210000,"firmware":"0.3.1"}` |
| `POST` | `/preview/start` | Start WebRTC publisher | `{}` |
| `POST` | `/preview/stop` | Stop publisher | `{}` |
| `POST` | `/preview/offer` | WebRTC SDP exchange | `{"sdp":"...","type":"offer"}` → `{"sdp":"...","type":"answer"}` |
| `POST` | `/capture` | Software-triggered shot (test/dev) | `{}` → `{"shot_id":"...","status":"queued"}` |
| `GET` | `/settings` | Current camera settings | `{"iso":100,"shutter_ms":null,"awb":"auto",...}` |
| `PATCH` | `/settings` | Update settings | Partial JSON; returns full state |
| `GET` | `/gallery` | List shots (paginated) | `{"items":[{"id","ts","jpeg_thumb_url","jpeg_full_url","dng_url","meta"}],"next":null}` |
| `GET` | `/gallery/{id}/jpeg` | Full JPEG | binary |
| `GET` | `/gallery/{id}/dng` | Full DNG (RAW) | binary |
| `GET` | `/gallery/{id}/thumb` | 256 px JPEG | binary |
| `DELETE` | `/gallery/{id}` | Delete shot | `{}` |
| `POST` | `/power/shutdown` | Graceful shutdown | `{}` |
| `POST` | `/power/reboot` | Reboot | `{}` |

### 4.2 WebSocket Surface

Single endpoint `ws://k1000-d.local/ws`. Server pushes state changes; client sends commands as alternative to REST.

Events server→client:
```json
{"type":"shot_committed","shot_id":"20260517-1843-2200","thumb_url":"/api/v1/gallery/.../thumb"}
{"type":"battery","pct":71,"charging":false}
{"type":"settings_changed","fields":{"iso":400}}
{"type":"sensor_state","streaming":true,"capturing":false}
{"type":"error","level":"warn","msg":"x264 dropped 4 frames"}
```

Commands client→server (mirror of REST PATCH):
```json
{"type":"set_setting","key":"iso","value":400}
```

**WebSocket vs polling decision:** WebSocket. The capture-event push (thumbnail-ready notification) needs to arrive at the PWA within ~100 ms of write completion or the gallery feels laggy. Polling at 1 Hz adds ~500 ms average. We already have a long-lived TCP connection for signalling — reusing it for state is free.

### 4.3 Service Layout

```
/opt/k1000/
├── api/                    # FastAPI app
│   ├── main.py
│   ├── routes/
│   ├── ws.py
│   └── db.py               # sqlite gallery.db
├── camera/                 # gstreamer + libcamera glue
│   ├── pipeline.py
│   ├── webrtc.py
│   └── capture.py
├── shutter/                # GPIO ISR daemon
│   └── monitor.py
└── pwa/                    # built PWA assets (served by nginx)
    └── dist/
```

systemd units:
- `k1000-api.service` (after network-online.target)
- `k1000-camera.service` (after k1000-api.service)
- `k1000-shutter.service` (after k1000-camera.service)
- `k1000-ap.service` (oneshot, brings up hostapd config)

All restart=on-failure. Watchdog: `systemd-notify` heartbeats from each service.

---

## 5. PWA Stack

### 5.1 Framework: Svelte 5 + SvelteKit (recommended)

| Criterion | Svelte 5 | React 18 | Vanilla TS |
|---|---|---|---|
| Bundle size (gzipped, minimal app) | ~3 KB framework | ~42 KB framework | 0 KB |
| Compile-time reactivity | Yes (runes) | No (runtime VDOM) | N/A |
| First paint on iPhone (over local WiFi) | < 200 ms | 400–600 ms | < 100 ms |
| iOS Safari WebRTC docs/examples | Decent | Excellent (most volume) | Direct W3C API |
| Service worker DX | First-class via SvelteKit | OK via Workbox | Manual |
| Camera UI ecosystem | Sparse | Larger (react-webcam etc.) | None |

**Decision:** Svelte 5 + SvelteKit, static adapter (no SSR — Pi serves prebuilt). Bundle target < 80 KB gzipped including app code. First meaningful paint < 250 ms on iPhone over local WiFi.

Rationale: this is a small UI (viewfinder + ~6 screens), local-network-only, on a constrained server (Pi). Every kilobyte saved is one less round-trip on a possibly-marginal WiFi link. Svelte's bundle advantage is decisive at this scale.

### 5.2 Key Modules

```
pwa/src/
├── routes/
│   ├── +layout.svelte          # nav, battery indicator, connection state
│   ├── +page.svelte            # viewfinder (default)
│   ├── gallery/+page.svelte
│   ├── gallery/[id]/+page.svelte
│   └── settings/+page.svelte
├── lib/
│   ├── webrtc.ts               # RTCPeerConnection lifecycle, SDP exchange
│   ├── ws.ts                   # WS client with auto-reconnect
│   ├── api.ts                  # typed REST client
│   ├── histogram.ts            # canvas-based RGB histogram from <video>
│   ├── focus-peaking.ts        # Sobel filter on downsampled <video> frame
│   ├── store.ts                # Svelte stores for state
│   └── pwa.ts                  # install prompt, sw registration
├── service-worker.ts           # cache app shell; offline gallery
└── manifest.json               # PWA manifest
```

### 5.3 Offline Behavior

- App shell (HTML/CSS/JS) cached on first load via service worker. App opens offline.
- Gallery thumbnails cached in IndexedDB (per shot, ~50 KB each). User can browse last ~500 shots offline.
- Settings cached in localStorage; sync on reconnect.
- Viewfinder requires live connection — show "camera unreachable" screen if WS or WebRTC fails.

### 5.4 iOS Install Flow

iOS does not support `beforeinstallprompt`. We display an in-app coachmark on first launch in Safari (non-standalone) explaining:
1. Tap the Share icon
2. Scroll to "Add to Home Screen"
3. Tap "Add"

Once added, the PWA launches standalone (no Safari chrome).

### 5.5 iOS PWA Gotchas (known and mitigated)

| Gotcha | Impact | Mitigation |
|---|---|---|
| `getUserMedia` historically broken in PWA standalone mode (WebKit bug #185448, fixed in iOS 15.4+ but flaky on early standalone PWAs) | We don't use the iPhone camera — pure receive. Lower risk, but `RTCPeerConnection` has its own PWA quirks. | Test on iOS 17 and 18 explicitly. Document minimum iOS 16.4. |
| Safari requires a local video track or fails to receive (per WebRTC.live 2025 guide) | Receive-only `RTCPeerConnection` may fail | Use `addTransceiver('video', {direction: 'recvonly'})` explicitly, not just `addTrack`. Confirmed workaround. |
| App suspended when tab backgrounded → WebRTC frozen | User switches apps, comes back to dead viewfinder | On `visibilitychange === visible`, tear down and renegotiate the peer connection. ~500 ms reconnect. |
| Service worker storage capped (~50 MB without prompt; ~1 GB with prompt) | Limits gallery cache | Use IndexedDB (separate quota); request persistent storage via `navigator.storage.persist()`. |
| No background sync API on iOS Safari | Cannot upload shots in background | Out of scope Phase 1. Manual upload only. |
| `playoutDelayHint` honored only since iOS 16 | Older devices stuck at ~200 ms jitter buffer | Document iOS 16.4+ minimum. |
| Captive-portal browser is not full Safari → can't run our PWA there | If iOS opens the "Sign in to network" mini-browser, our PWA can't run | See § 6.2 — we explicitly *suppress* the captive prompt. |

---

## 6. WiFi AP Strategy

### 6.1 hostapd config

```conf
# /etc/hostapd/hostapd.conf
interface=wlan0
driver=nl80211
ssid=K1000-D
hw_mode=a              # 5 GHz
channel=36             # UNII-1, clear by default in most regions
ieee80211n=1
ieee80211ac=1
ht_capab=[HT40+][SHORT-GI-40]
vht_capab=[SHORT-GI-80]
vht_oper_chwidth=1
wmm_enabled=1          # critical for WebRTC RTP marking
auth_algs=1
wpa=2
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP
wpa_passphrase=changeme-on-first-boot
country_code=US
```

**Band choice:** 5 GHz (channel 36 default, hop to 149/153 on regulatory variance). Rationale:
- iPhone supports 802.11ac on 5 GHz.
- 2.4 GHz is congested in urban environments — adds jitter, blows the latency budget.
- 5 GHz range loss is irrelevant: user is holding the camera and the phone.
- WMM (Wi-Fi Multimedia) on, RTP frames marked AC_VI for lower air-queue latency.

### 6.2 Keeping iOS connected without internet

This is the load-bearing problem. iOS aggressively bails to cellular when it detects "no internet" and may show "Sign In" captive-portal sheets. Our SSID has no upstream.

**Strategy: serve a "captive portal success" response so iOS believes the network is normal, but NOT a captive page (which would force users through Safari's mini-browser).**

iOS probes `http://captive.apple.com/hotspot-detect.html` (and a few HTTPS variants). We:
1. Configure `dnsmasq` to resolve `captive.apple.com` to the Pi's IP.
2. Run nginx (or FastAPI route) returning the exact magic string Apple expects:
   ```html
   HTTP/1.0 200 OK
   Content-Type: text/html
   
   <HTML><HEAD><TITLE>Success</TITLE></HEAD><BODY>Success</BODY></HTML>
   ```
3. With this success response, iOS classifies the network as "open internet" and does NOT show the captive-portal sheet. The PWA launches normally from the home screen.

**Alternative (rejected):** Real captive portal. Would force user through the mini-browser, where PWA can't be installed. Wrong UX.

### 6.3 dnsmasq config

```conf
# /etc/dnsmasq.d/k1000.conf
interface=wlan0
bind-interfaces
dhcp-range=192.168.50.10,192.168.50.50,255.255.255.0,12h
dhcp-option=3,192.168.50.1   # gateway = pi
dhcp-option=6,192.168.50.1   # dns = pi
domain=local
local=/local/
address=/captive.apple.com/192.168.50.1
address=/www.apple.com/192.168.50.1
address=/k1000-d.local/192.168.50.1
# Wildcard for anything (suppresses iOS test pings to other hosts)
address=/#/192.168.50.1
```

The wildcard `address=/#/192.168.50.1` makes every DNS lookup resolve to the Pi. Combined with the "Success" HTTP response, iOS sees a working "internet" and stays connected.

### 6.4 mDNS / Bonjour

`avahi-daemon` advertises `k1000-d.local` on wlan0. Pi's static IP is 192.168.50.1.

The PWA is reachable at:
- `http://k1000-d.local/` (Bonjour resolution on iPhone, works without typing IP)
- `http://192.168.50.1/` (fallback)

We also publish `_http._tcp` service for future native-app discovery.

### 6.5 NetworkManager conflict

Modern Raspberry Pi OS uses NetworkManager. To prevent it from grabbing wlan0:

```conf
# /etc/NetworkManager/conf.d/k1000.conf
[keyfile]
unmanaged-devices=interface-name:wlan0
```

---

## 7. Power Management

### 7.1 Pi 5 power draw (4 GB, our workload)

| State | Power | Source |
|---|---|---|
| Idle (display off, WiFi AP up, no clients) | 2.5–3.0 W | Pi 5 power benchmarks |
| Streaming 1080p30 WebRTC to 1 client | 5.5–7.0 W | x264 software encode is the dominant load |
| 20 MP RAW capture + JPEG dev (1 s burst) | 9–10 W peak | Brief |
| Suspend-to-idle (`s2idle`) — not supported by Pi 5 yet | N/A | Pi 5 has no suspend implementation as of mid-2026 |

### 7.2 Battery (PiSugar 3 Plus, 5000 mAh @ 3.7 V = 18.5 Wh)

**Caveat from search results:** PiSugar 3 Plus output is rated 3 A @ 5 V = 15 W max. Pi 5 peaks above this under combined load. PiSugar 3 was designed for Pi 4 and may under-volt the Pi 5 during capture bursts.

| Use pattern | Pi avg power | Runtime |
|---|---|---|
| Continuous viewfinder streaming | 6 W | ~3 hours |
| Realistic field use: 30 % stream, 70 % idle (AP up, no client) | 3.5 W | ~5 hours |
| AP-only standby (no PWA connected, sensor off) | 2.5 W | ~7 hours |

**Recommendation to supply-chain-manager / pcb-designer:** evaluate alternatives to PiSugar 3 Plus. Either:
- A Pi-5-specific 5 V / 5 A battery HAT (Waveshare UPS HAT C or equivalent), or
- A custom power board with INA219 monitoring, MCP73871 charger, and a buck-boost rated 5 A peak.

### 7.3 Power levers

| Lever | Savings | UX impact |
|---|---|---|
| Sensor stream off between shots (Strategy A) | 1.5–2 W | Viewfinder dark when phone screen off → user wakes it from PWA |
| WiFi AP off (deep sleep) | 1.5 W | Phone loses connection → must reconnect manually. Reject for primary UX. |
| CPU governor `ondemand` | 0.3 W | Slight latency jitter during ramp-up |
| Disable HDMI, audio | 0.1 W | None — headless config |
| Spin down USB-SSD after 60 s idle | 0.5 W | First shot after sleep adds ~1 s wake. Tolerable. |

**Default power profile:** governor=ondemand, HDMI off, USB-SSD auto-spin-down 60 s, WiFi AP always on, sensor streams only while a PWA client has an active RTCPeerConnection. This is the realistic-field-use row above.

### 7.4 Soft on/off via PiSugar button

- Single press: toggle preview on/off (battery saver).
- Long press (3 s): graceful shutdown via `pisugar-server` → `systemctl poweroff`.
- Boot: hold button 2 s.

PiSugar's I2C protocol provides battery %, charging state, button events. We poll via `pisugar-server` on `127.0.0.1:8423` (text proto) from FastAPI and push battery updates over WS every 30 s.

---

## 8. OTA / Update Strategy

### 8.1 Decision: A/B partition with `RAUC`

Per Bootlin's 2025 implementation, RAUC works cleanly on Pi 5 using the Pi firmware bootloader (no U-Boot needed), leveraging the Pi firmware's conditional-boot-partition feature.

**Layout (32 GB SD or eMMC):**
- `boot` partition (FAT, 512 MB) — Pi firmware + kernel + DT for both slots
- `rootfs.A` (ext4, 8 GB)
- `rootfs.B` (ext4, 8 GB)
- `data` (ext4, remainder) — `/var/lib/k1000` (gallery DB, cached calibration, user settings)
- USB-SSD (separate device) — `/media/images` (RAW + JPEG output, mounted on demand)

The `data` partition survives updates so the user's gallery and settings persist.

### 8.2 Update channels

| Channel | Mechanism | Audience |
|---|---|---|
| **Pull from GitHub Releases** | Pi checks `https://github.com/<owner>/k1000-d-firmware/releases/latest` once per day when "internet=on" mode enabled | Default for end users |
| **Web-based push** | PWA "Settings → Updates → Check now" triggers immediate pull and apply | User-initiated |
| **Sideload** | Drop signed `.raucb` bundle on USB stick, AP detects, prompts in PWA | Field repair / no-internet scenarios |

### 8.3 "Internet=on" mode

The Pi is normally an AP only. To pull updates, the user temporarily switches to "Connect to internet" mode via the PWA:
1. PWA presents a WiFi credential form.
2. Pi tears down hostapd, switches wlan0 to STA mode, connects to user's home WiFi.
3. Pulls update bundle.
4. Reverts to AP mode.

This is a 30–60 second flip and is invoked manually. Avoids the chicken-and-egg of needing internet to fix a borked update.

### 8.4 Update bundle contents

Each `.raucb` contains:
- Compressed rootfs image (SquashFS, ~600 MB)
- Manifest (signed, CMS)
- Pre/post install hooks (data migration scripts)

Bundles are signed with a long-lived production key. Pi firmware verifies signature before booting the new slot. If new slot fails to set the "boot OK" flag within 60 s of boot, Pi firmware falls back to previous slot.

### 8.5 Update size budget

A full rootfs swap is ~600 MB. For 90 % of releases (PWA + Python only changes) we ship a "delta" update that touches only `/opt/k1000/` — a ~50 MB bundle that swaps a single directory atomically using a bind-mount trick. RAUC supports this via slot type `raw` for the application slot, separate from `rootfs`.

**Bundle hierarchy:**
- Major rootfs update: full A/B swap, ~600 MB, infrequent (kernel, libcamera, hostapd).
- App update: `/opt/k1000` swap, ~50 MB, frequent (PWA, FastAPI code, gstreamer pipeline tweaks).

---

## 9. Top 5 Firmware/Software Risks

### 9.1 iOS Safari WebRTC behavior in PWA standalone mode — **HIGH**

**What:** Apple has a documented history (WebKit bug #185448 and successors) of breaking WebRTC inside PWAs installed to the home screen. The behavior is subtly different from in-browser Safari.

**Why it matters:** If the viewfinder works in Safari but breaks after "Add to Home Screen," the whole UX falls apart.

**Mitigation:**
- Test on iOS 16.4, 17, 18 (current) explicitly with the installed PWA, not just in-browser.
- Build a fallback HLS/LL-HLS path via MediaMTX (200–500 ms latency, acceptable degraded mode).
- PWA detects PWA-mode WebRTC failure within 3 s and auto-falls-back to HLS, surfacing a "low-latency mode unavailable" banner.

### 9.2 No hardware H.264 encoder on Pi 5 — **HIGH**

**What:** All H.264 encoding is on the four A76 cores. At 1080p30, x264 (`tune=zerolatency`) takes ~80 % of one core. Other processes (FastAPI, capture-svc, hostapd) consume another ~50 %.

**Why it matters:** Thermal throttling under sustained load could degrade encode performance, raise latency, and drop frames.

**Mitigation:**
- Profile under load in a sealed enclosure (worst-case thermals).
- Active cooling: Pi 5 active cooler (~$5) inside the body if mechanical permits.
- Encoder fallback to 720p30 if `getrusage` shows >85 % single-core for >5 s.
- Quantify thermal headroom with mcad-engineer (sealed K1000 body is a thermal disaster — we may need a heat-spreader to the K-mount metal).

### 9.3 Pi 5 + IMX283 sustained MIPI throughput under combined load — **MEDIUM**

**What:** Pi 5 MIPI CSI-2 link has measured ceilings. IMX283 at full resolution pushes ~1.5 Gbps; combined with the 1080p preview path through the same ISP, there is contention.

**Why it matters:** Frame drops or stalls during capture would manifest as missed shots — fatal for a camera.

**Mitigation:**
- Bench prototype: capture 100 consecutive shots at 1 fps shutter cadence while streaming preview, count drops.
- Use 4-lane MIPI (IMX283 module must support; verify with Arducam datasheet — passed to pcb-designer).
- Sensor mode-switch strategy (Strategy A) reduces simultaneous load.

### 9.4 Captive-portal iOS behavior regression — **MEDIUM**

**What:** Apple periodically tightens captive-network detection logic. The "Success" response trick has been working since iOS 7 but is undocumented behavior.

**Why it matters:** A future iOS update could force users through the captive mini-browser, blocking PWA install.

**Mitigation:**
- Test on each iOS major release in CI (manual for now, automated via Browserstack iOS sims later).
- Document an explicit "Add to Home Screen FIRST, then connect" install flow as a backup procedure.
- Long-term: investigate whether iOS 26+ allows direct app distribution (EU rules may help).

### 9.5 X-sync timing → frame association reliability — **MEDIUM**

**What:** The X-sync contact is mechanical, in a 50-year-old camera. Contact bounce, intermittent dirty contacts, and the rolling-shutter readout window mean we can mis-associate the GPIO edge with the wrong libcamera buffer.

**Why it matters:** Shots come back over- or under-exposed, or are off by one frame.

**Mitigation:**
- Hardware debounce circuit (RC + Schmitt) — see pcb-designer brief.
- Software: timestamp the ISR (`CLOCK_MONOTONIC`), correlate to libcamera frame timestamps via the request metadata. Pick the buffer whose mid-exposure is closest to ISR ts.
- `buffer_count=4` in libcamera config to give the correlator a window.

---

## 10. Library / Version Pins (concrete)

| Component | Version | Source |
|---|---|---|
| Raspberry Pi OS | Bookworm, 2026-04 release, 64-bit | rpi-imager |
| Kernel | 6.6 LTS (Pi 5 default) | rpi-update |
| libcamera | 0.3+ (rpi fork, picamera2 ships pinned) | apt `libcamera-dev` |
| picamera2 | 0.3.20 or later | apt `python3-picamera2` |
| gstreamer | 1.22+ | apt `gstreamer1.0-tools gstreamer1.0-plugins-{good,bad,ugly} gstreamer1.0-libcamera` |
| x264 | latest stable in repos | apt `x264` |
| MediaMTX | v1.8+ | github releases (single Go binary) |
| Python | 3.11 (Bookworm default) | apt |
| FastAPI | 0.110+ | pip |
| uvicorn | 0.27+ (no workers — single asgi loop) | pip |
| hostapd | 2.10+ | apt |
| dnsmasq | 2.89+ | apt |
| RAUC | 1.11+ | apt or backport |
| Svelte | 5.0+ | npm |
| SvelteKit | 2.x with `@sveltejs/adapter-static` | npm |
| lgpio | 0.2+ | apt `python3-lgpio` |

GPIO pin assignments (handed to pcb-designer):
- GPIO27 (header pin 13): X-sync input (3.3 V via level shifter from PC terminal)
- GPIO22 (header pin 15): X-sync test output (loopback for self-test)
- I2C-1 (pins 3, 5): PiSugar 3 communication
- MIPI CSI-2 4-lane: IMX283 (via Pi 5 dedicated CAM port)
- USB 3.0: SSD

---

## 11. Open Questions for Other Specialists

**To pcb-designer:**
- Confirm 3.3 V level-shifted X-sync feeds directly into a SoC-direct GPIO (NOT a GPIO expander — would add 10 ms latency).
- RC debounce values for the PC-sync contact (probably 100 nF + 10 kΩ giving ~1 ms time constant).
- Optoisolator (e.g., 6N137) on the X-sync line for galvanic isolation between camera body and Pi ground? Safety/reliability win, ~5 µs added latency — acceptable.

**To mcad-engineer:**
- Thermal solution for Pi 5 inside the sealed K1000 body. Pi 5 under sustained encode + capture draws ~7 W; without airflow it will hit 80 °C+ and throttle. Need a heat-spreader to the metal body or a vent channel.
- Confirm USB 3 SSD form factor will fit (M.2 NVMe in a USB enclosure is ~80×22 mm; may not fit beside the Pi 5 in the film cavity).
- Antenna placement for the BCM43455: if the Pi is buried inside a metal SLR body, the internal WiFi antenna is shielded. We may need a U.FL pigtail to an external antenna on the rear of the camera.

**To systems-engineer:**
- Define "first frame committed to storage" precisely (in-RAM queue, fsync to RAW, fsync to JPEG?). Capture latency budget swings 10× depending on interpretation.
- Confirm 30 fps preview is sufficient — would 24 fps (cinema feel, lower CPU) be acceptable?
- Confirm minimum iOS version (proposed: iOS 16.4 for `playoutDelayHint`, PWA push notifications, stable WebRTC in standalone PWA).

**To dfm-test-engineer:**
- Automated test for end-to-end viewfinder latency (LED-on-sensor-side, photodiode-on-iPhone-side, timestamp difference)?
- Capture-latency test fixture (signal generator → X-sync line → measure time to JSON event over WS).

**To supply-chain-manager:**
- PiSugar 3 Plus is Pi-4-rated for 3 A max. Pi 5 may under-volt under capture bursts. Need a Pi-5-rated power solution. Candidates: Waveshare UPS HAT for Pi 5 (5 V/5 A) or custom PMIC.

---

## 12. Phase 1 Software Deliverables Checklist

- [x] Software architecture diagram (§ 1)
- [x] Capture pipeline + latency budget (§ 2)
- [x] Viewfinder pipeline + latency budget (§ 3)
- [x] FastAPI control plane surface (§ 4)
- [x] PWA framework choice + gotcha list (§ 5)
- [x] hostapd / dnsmasq / iOS captive strategy (§ 6)
- [x] Power management plan (§ 7)
- [x] OTA strategy (§ 8)
- [x] Top 5 risks (§ 9)
- [x] Library version pins (§ 10)
- [x] Open questions to other specialists (§ 11)

**Next phase deliverables (Phase 2, post-feasibility):**
- Working bench prototype: Pi 5 + IMX283 + iPhone PWA, viewfinder + capture loop, measured latency numbers.
- gstreamer pipeline files (.py + .gst), tuned and benchmarked.
- PWA source repo with iOS install flow tested on 3 device generations.
- RAUC bundle build pipeline (GitHub Actions → signed `.raucb`).
- BOM-locked power solution recommendation.

---

## 13. Sources / Evidence

- IMX283 specs (Leopard Imaging, Kurokesu, FRAMOS datasheets): 60 fps full-res, 452 fps cropped, MIPI CSI-2 4-lane.
- Pi 5 lack of hardware H.264 encoder: Raspberry Pi Forums (multiple threads, 2024–2025), HN discussion, confirmed by Raspberry Pi engineers — software x264 at 1080p60 takes ~80 % single core.
- WebRTC LAN latency: GStreamer Discourse, discuss-webrtc Google group — 30–40 ms achievable on localhost/wired, 80–250 ms typical over WiFi with default jitter buffers.
- MediaMTX latency: Hackster.io "Comparing Video Stream Latencies on Pi 5 Camera V3" — ~200 ms WebRTC, ~500 ms HLS.
- go2rtc latency: vendor docs claim 0.5 s WebRTC; community reports 200–800 ms.
- picamera2 dual-stream constraints: GitHub issues #549, #1085, #767 — mode-switch cost, lores+main+raw configuration.
- GPIO interrupt latency on Pi 5: Raspberry Pi Forums — sub-microsecond on SoC-direct GPIO, ~10 ms on I2C expander GPIOs.
- iOS PWA limitations: WebKit Bugzilla #185448, MagicBell "PWA iOS Limitations 2026", VideoSDK "WebRTC Safari 2025 guide", STRICH KB "Camera Access in iOS PWA".
- iOS captive portal: openclaw.fast.io, Raspberry Pi forums on captive portals + dnsmasq.
- RAUC on Pi 5: Bootlin blog "Safe updates using RAUC on Raspberry Pi 5" (2025).
- PiSugar 3 Plus: vendor docs + Pi forum thread on under-voltage with Pi 5 under load.
- Svelte vs React bundle sizes: distantjob, strapi, pagepro comparisons 2025-2026.
