# UX Design Specification: StoveIQ Mobile App

**Version:** 1.0
**Last Updated:** 2026-03-26
**Author:** Nick DeMarco with AI Assistance
**Status:** Draft
**PRD Reference:** `teams/stoveiq/PRD.md`
**Architecture Reference:** `teams/stoveiq/ARCHITECTURE.md`
**Platform:** Flutter (iOS 16+ / Android 12+)

---

## 1. Executive Summary

### 1.1 Design Vision

StoveIQ's app must serve two fundamentally different users simultaneously: a safety-anxious caregiver who needs zero-friction alerts she cannot miss, and a cooking enthusiast who wants a rich thermal visualization he can geek out on. The design thread that connects them is **immediate comprehension** — the heat map must communicate stove state at a glance, alerts must be impossible to ignore, and setup must be achievable by someone with no technical confidence. Every design decision filters through this question: "Could an anxious 55-year-old understand this at 11pm?"

### 1.2 Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Heat map color scale | Blue-cyan-green-yellow-orange-red (perceptual rainbow) | Matches universal "cold to hot" intuition; distinguishable by most color vision deficiencies |
| Alert design | Full-screen takeover with persistent haptics | Safety-critical; cannot be a subtle banner that gets missed |
| Calibration metaphor | "Drag circles onto glowing spots" | Tactile, visual, no text instructions required |
| Navigation | Bottom tab bar (5 items) | Mobile-first; primary actions thumb-reachable; always visible |
| Onboarding | Linear wizard with step indicators | Non-technical users need hand-holding; no branching confusion |
| Remote monitoring | Dedicated simplified view | Caregivers have different mental model than primary users |
| Dark mode | Mandatory (not optional) | Kitchen use at night; bright white UI is hostile in a dark kitchen |

### 1.3 Design Principles

1. **Safety first, always** — Alert states must preempt everything else on screen. Never let a UI pattern reduce the urgency of a safety notification.
2. **Glanceable** — The dashboard must communicate stove state in under 2 seconds without reading any text.
3. **Forgiving setup** — Calibration can be redone at any time with zero friction. A miscalibrated device is worse than no device.
4. **Progressive depth** — Casual users see a simple status view. Power users can drill into temperature graphs, sensor data, and fine controls.
5. **Local resilience** — The app must show current stove state even without internet. Connection status must be honest and clear.
6. **Accessible by default** — Large touch targets, high-contrast text, and meaningful haptics are not add-ons; they are the baseline.

---

## 2. User Personas

### 2.1 Primary Persona: Sarah (Safety-Conscious Parent)

**Demographics:**
- Age: 42
- Technical comfort: Moderate (uses Ring, Nest, iPhone)
- Device preference: iPhone (primary), iPad (occasional)
- Primary use: Peace of mind when leaving the house; remote monitoring of her mother's stove

**Goals:**
- Know instantly if a burner has been on too long
- Monitor her elderly mother's stove from her own phone
- Quick stove status check without opening the full app (widget)

**Pain Points:**
- Anxious when she cannot verify "did I leave the stove on?"
- Worried about her mother forgetting a burner
- Frustrated by apps with too many settings she does not need

**Quote:** "I just want to know if I left the stove on after I left the house."

**Design Implications:**
- Dashboard must lead with status summary, not heat map
- Widget is a must-have for her use case
- Alert flow must be dead simple: see it, acknowledge it, done

### 2.2 Secondary Persona: Marcus (Cooking Enthusiast)

**Demographics:**
- Age: 35
- Technical comfort: High (early adopter, Android)
- Device preference: Android phone
- Primary use: Precise temperature monitoring, boil detection, cooking timers

**Goals:**
- See actual burner temperatures, not just on/off
- Get notified when water boils so he can walk away
- Review cooking session history to improve technique

**Pain Points:**
- Cannot accurately judge stovetop temperatures from dial positions
- Misses the boil transition when multitasking

**Quote:** "I want to know the actual temperature of my pan, not just that the dial is on medium."

**Design Implications:**
- Heat map is the hero; must look impressive and accurate
- Burner detail view with temperature graph is important to him
- Boil detection notification must be timely and reliable

### 2.3 Secondary Persona: Linda (Remote Caregiver)

**Demographics:**
- Age: 55
- Technical comfort: Moderate (iPhone user)
- Device preference: iPhone
- Primary use: Monitoring her 82-year-old father's stove from 45 minutes away

**Goals:**
- Know when her father's stove is on and for how long
- Receive alerts if something seems wrong
- View a usage log to share with his doctor

**Pain Points:**
- Cannot always call him to check in; does not want to alarm him
- Needs reassurance without creating dependency

**Quote:** "I need to know he's safe without moving him into a facility."

**Design Implications:**
- Remote monitoring view must be simplified (not the full heat map)
- Duration and "last seen cooking" are the key data points
- Alert sensitivity and escalation contacts must be configurable

---

## 3. Information Architecture

### 3.1 App Map

```
StoveIQ App
├── Onboarding (first launch only)
│   ├── Welcome (3 screens)
│   ├── Account Creation
│   ├── Device Pairing (BLE)
│   ├── WiFi Provisioning
│   ├── Physical Mounting Guide
│   ├── Aiming Guide (live thermal preview)
│   └── Calibration Wizard
│       ├── Step 1: Light all burners
│       ├── Step 2: Define stovetop corners (perspective)
│       ├── Step 3: Map burner positions
│       ├── Step 4: Validation test
│       └── Step 5: Success
│
├── Tab: Home (Dashboard)
│   ├── Heat Map (full interactive)
│   ├── Burner status cards
│   ├── Active timers overlay
│   └── Burner Detail (modal/sheet)
│       ├── Temperature graph (30 min)
│       ├── State history
│       ├── Active timer controls
│       └── Set temperature alert
│
├── Tab: Alerts
│   ├── Active alert (if any) — full-screen overlay
│   ├── Alert history log
│   └── Alert detail
│
├── Tab: Timers
│   ├── Active timers (per burner)
│   ├── Add timer
│   │   ├── Select burner
│   │   ├── Duration (presets + custom)
│   │   └── Custom name
│   └── Timer history
│
├── Tab: History
│   ├── Cooking sessions timeline
│   ├── Session detail
│   │   ├── Duration, peak temps, alerts
│   │   └── Per-burner timeline
│   └── Weekly / Monthly summary
│
└── Tab: Settings
    ├── Device Settings
    │   ├── Rename device
    │   ├── Recalibrate
    │   ├── WiFi settings
    │   └── Firmware update
    ├── Alert Preferences
    │   ├── Unattended stove threshold
    │   ├── Temperature alert thresholds
    │   ├── Quiet hours
    │   └── Emergency contacts
    ├── Household & Sharing
    │   ├── Manage members
    │   ├── Invite family / caregivers
    │   └── Remote monitoring view (for caregivers)
    ├── Units (°F / °C)
    ├── Notification preferences
    └── Account
```

### 3.2 Navigation Model

- **Primary navigation:** Bottom tab bar (5 tabs: Home, Alerts, Timers, History, Settings)
- **Contextual navigation:** Tap burner on heat map opens Burner Detail as a bottom sheet (keeps heat map visible)
- **Alert overlay:** Full-screen modal that floats above all navigation when a safety alert fires
- **Onboarding:** Linear wizard, no tab bar visible

### 3.3 Content Hierarchy

| Content Type | Priority | Location |
|--------------|----------|----------|
| Stove on/off + duration | Critical | Dashboard hero, widget, lock screen notification |
| Active alerts | Critical | Full-screen overlay, alert badge on tab |
| Heat map | High | Dashboard center stage |
| Per-burner temperatures | High | Heat map overlay, burner cards |
| Active timers | High | Dashboard overlay near burners |
| Connection status | Medium | Dashboard header, subtle indicator |
| History / analytics | Low | History tab |
| Settings | Low | Settings tab |

---

## 4. User Flows

### 4.1 First-Time Setup Flow

**Entry Point:** Fresh app install, no account or device

**Happy Path:**

```
Install App
    │
    ▼
Welcome Screens (3)
    │
    ▼
Create Account
    │ (or Apple / Google sign-in)
    ▼
Find Device (BLE Scan)
    │
    ▼
Connect to Device (BLE pairing)
    │
    ▼
WiFi Provisioning
    │ (select network, enter password via app, app pushes to device)
    ▼
Device confirms WiFi connected
    │
    ▼
Mounting Guide
    │ (user physically mounts device)
    ▼
Aiming Guide
    │ (live thermal preview, user adjusts device aim)
    ▼
"All burners visible?" confirmation
    │
    ▼
Calibration Wizard (see Section 4.2)
    │
    ▼
Setup Complete — Dashboard
```

**Error Scenarios:**

| Error | User Sees | Recovery |
|-------|-----------|----------|
| Device not found via BLE | "Make sure StoveIQ is plugged in and the LED is blue" | Retry / troubleshoot link |
| WiFi password wrong | "Couldn't connect to [network]. Check your password." | Re-enter password |
| WiFi not 2.4GHz | "StoveIQ requires a 2.4GHz network." | Link to help article |
| Device disconnects during setup | "Lost connection. Let's try again from WiFi setup." | Resume from last saved step |
| Not all burners visible in aiming | Warning overlay on live view showing coverage gaps | Adjust mount before proceeding |

### 4.2 Calibration Wizard Flow

**Entry Point:** End of first-time setup, or "Recalibrate" from Settings

**Step-by-Step:**

1. User sees "Light all burners" instruction with illustration
2. User confirms burners are lit
3. App shows live thermal view with bright heat spots visible
4. User taps 4 corners of the stovetop outline (perspective definition)
   - App draws perspective grid in real-time as corners are placed
   - Corrected view previews alongside
5. App auto-detects heat spots and suggests burner circles
6. User drags/resizes circles to match each burner; assigns labels
7. User confirms mapping
8. App instructs: "Turn off burners one at a time"
9. As each burner cools, app validates the mapping (green check per burner)
10. All burners validated — success screen

**Error Scenarios:**

| Error | User Sees | Recovery |
|-------|-----------|----------|
| Fewer heat spots than expected | "We only detected [N] hot spots. Did all burners light?" | Re-check and retry |
| Mapping validation fails (wrong burner cools) | "Burner mapping may be off. Want to adjust?" | Jump back to step 6 |
| Only 2-3 corners tappable | Auto-calculate 4th corner from aspect ratio | Note shown: "4th corner estimated" |

### 4.3 Forgotten Stove Alert Flow

```
Burner on 30+ min, no thermal change
    │
    ▼
Push notification delivered (high priority)
    │
    ▼
User taps notification
    │
    ▼
App opens to full-screen Alert overlay
    │
    ├── "Still cooking" → Alert dismissed, 30-min snooze starts
    │
    └── "Turn it off" → App shows heat map; burner temp graph displayed
            │
            ▼
        Burner cools → Alert auto-resolves, logged to history
```

**Escalation Path (if unanswered):**
```
Alert arrives on phone (push)
    │ 5 min, no acknowledgment
    ▼
Device piezo buzzer activates (85dB audible)
    │ 5 min, still no acknowledgment
    ▼
Push notification sent to emergency contacts
    │ User responds or burner turns off
    ▼
Alert resolved, all escalations cancelled
```

### 4.4 Caregiver Monitoring Flow

```
Caregiver opens app
    │
    ▼
Home screen shows "Monitoring: Dad's Kitchen"
(simplified view — not full heat map)
    │
    ▼
Status card: "Stove OFF" or "Stove ON — 23 min"
    │
    ▼
Tap for detail → burner detail, temperature graph
    │
    ▼
Alerts tab → shared alert history for monitored device
    │
    ▼
"Call Dad" button always visible on caregiver view
```

### 4.5 Boil Detection and Timer Flow

```
User puts water on to boil
    │
    ▼
Tap burner on heat map
    │
    ▼
Burner Detail sheet opens
    │
    ▼
Tap "Notify when boiling"
    │
    ▼
User leaves kitchen
    │
    ▼
[StoveIQ detects boil pattern]
    │
    ▼
Push notification: "Burner 1: Water is boiling!"
    │
    ▼
User opens app — timer suggestion: "Set a pasta timer?"
    │ (accept)
    ▼
10-minute timer starts, linked to Burner 1
    │
    ▼
Timer expires → notification + in-app alert
```

---

## 5. Wireframe Specifications

### 5.1 Onboarding — Welcome Screens

**Purpose:** Communicate value proposition quickly; set expectations; get user to sign up

**Screen 1 of 3:**
```
┌─────────────────────────────────┐
│                                 │
│                                 │
│   [Full-bleed thermal heat map  │
│    image — glowing orange/red   │
│    burners on dark background]  │
│                                 │
│                                 │
│   ┌─────────────────────────┐   │
│   │  See Your Stove.        │   │
│   │  Really See It.         │   │
│   │                         │   │
│   │  Real-time heat map for │   │
│   │  every burner.          │   │
│   └─────────────────────────┘   │
│                                 │
│      ● ○ ○   (page dots)        │
│                                 │
│   ┌─────────────────────────┐   │
│   │     Get Started  →      │   │
│   └─────────────────────────┘   │
│                                 │
│        Already have an account? │
└─────────────────────────────────┘
```

**Screen 2 of 3:**
```
┌─────────────────────────────────┐
│                                 │
│   [Illustration: phone showing  │
│    alert notification, person   │
│    on couch looks relieved]     │
│                                 │
│   Never Wonder             │
│   "Did I Leave It On?"          │
│                                 │
│   StoveIQ alerts you before     │
│   an unattended burner becomes  │
│   a problem.                    │
│                                 │
│      ○ ● ○                      │
│                                 │
│   [Next →]  [Skip to sign up]   │
└─────────────────────────────────┘
```

**Screen 3 of 3:**
```
┌─────────────────────────────────┐
│                                 │
│   [Illustration: two phones,    │
│    one labeled "Mom's Kitchen", │
│    one labeled "Your Phone"]    │
│                                 │
│   Keep Your Family Safe         │
│   From Anywhere                 │
│                                 │
│   Share access with caregivers. │
│   Get alerts. Stay connected.   │
│                                 │
│      ○ ○ ●                      │
│                                 │
│   [Create Free Account]         │
│   [Sign in with Apple]          │
│   [Sign in with Google]         │
└─────────────────────────────────┘
```

### 5.2 Onboarding — Account Creation

```
┌─────────────────────────────────┐
│  ←   Create Your Account        │
│                                 │
│   ┌─────────────────────────┐   │
│   │ Email address           │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌─────────────────────────┐   │
│   │ Password                │   │
│   └─────────────────────────┘   │
│   [password strength bar]       │
│                                 │
│   ┌─────────────────────────┐   │
│   │ Confirm password        │   │
│   └─────────────────────────┘   │
│                                 │
│   ☐ Email me tips and updates   │
│                                 │
│   By continuing you agree to    │
│   [Terms] and [Privacy Policy]  │
│                                 │
│   ┌─────────────────────────┐   │
│   │    Create Account  →    │   │
│   └─────────────────────────┘   │
│                                 │
│   ─────────── or ───────────    │
│                                 │
│   [  Sign in with Apple  ]      │
│   [  Sign in with Google ]      │
└─────────────────────────────────┘
```

**States:**
- Email field: inline validation on blur (invalid format → red border + "Enter a valid email")
- Password strength: real-time bar (weak/fair/strong/very strong) below field
- Confirm field: validates on blur ("Passwords must match")
- Create Account button: disabled until form valid

### 5.3 Onboarding — Device Pairing

```
┌─────────────────────────────────┐
│  Step 2 of 5  ●●○○○             │
│  Connect Your StoveIQ           │
│                                 │
│  [Illustration: StoveIQ device  │
│   with LED glowing blue, pulse  │
│   animation]                    │
│                                 │
│  Plug in your StoveIQ.          │
│  The LED should glow blue.      │
│                                 │
│  ┌─────────────────────────┐    │
│  │  Searching for device…  │    │
│  │  [animated scan ring]   │    │
│  └─────────────────────────┘    │
│                                 │
│                                 │
│  ─ ─ Found ─ ─                  │
│                                 │
│  ┌─────────────────────────┐    │
│  │  ◉  StoveIQ-A3F2        │    │
│  │     Tap to connect      │    │
│  └─────────────────────────┘    │
│                                 │
│  Don't see your device?         │
│  [Troubleshoot]                 │
└─────────────────────────────────┘
```

**Behavior:**
- BLE scan begins automatically on screen load
- Devices appear as they are discovered (no pull-to-refresh required)
- Tapping the device card initiates BLE connection; card shows spinner then checkmark

### 5.4 Onboarding — WiFi Provisioning

```
┌─────────────────────────────────┐
│  Step 3 of 5  ●●●○○             │
│  Connect to WiFi                │
│                                 │
│  StoveIQ needs WiFi for remote  │
│  alerts. Select your network:   │
│                                 │
│  ┌─────────────────────────┐    │
│  │  ▓▓▓ HomeNetwork_2.4G   │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │  ▓▓░ Neighbor_WiFi      │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │  ▓░░ Office_Guest       │    │
│  └─────────────────────────┘    │
│                                 │
│  [Enter network manually]       │
│                                 │
│  [Refresh networks ↻]           │
│                                 │
│  Note: StoveIQ uses 2.4GHz      │
│  WiFi only. 5GHz not supported. │
└─────────────────────────────────┘
```

After network selection:
```
┌─────────────────────────────────┐
│  HomeNetwork_2.4G               │
│                                 │
│  ┌─────────────────────────┐    │
│  │  WiFi Password    👁    │    │
│  └─────────────────────────┘    │
│                                 │
│  [Connect →]                    │
│                                 │
│  Your password is sent directly │
│  to the device. StoveIQ never   │
│  stores your WiFi password.     │
└─────────────────────────────────┘
```

### 5.5 Onboarding — Mounting Guide

```
┌─────────────────────────────────┐
│  Step 4 of 5  ●●●●○             │
│  Mount Your StoveIQ             │
│                                 │
│  [Tab selector: Under Cabinet | Wall Mount]
│                                 │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │  [Detailed illustration  │    │
│  │   showing device mounted │    │
│  │   under cabinet, cable   │    │
│  │   routing, 18-24 inch    │    │
│  │   height callout]        │    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  Mount 18-24 inches above your  │
│  cooktop. The included adhesive │
│  pad holds up to 3 lbs.         │
│                                 │
│  [  Download full guide PDF  ]  │
│                                 │
│  [Device is mounted →]          │
└─────────────────────────────────┘
```

### 5.6 Onboarding — Aiming Guide

**Purpose:** User physically aims the device while seeing a live thermal preview

```
┌─────────────────────────────────┐
│  Step 5 of 5  ●●●●●             │
│  Aim the Sensor                 │
│                                 │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │  [Live thermal preview  │    │
│  │   — currently ambient,  │    │
│  │   blue/green tones]     │    │
│  │                         │    │
│  │  [Dashed rectangle      │    │
│  │   labeled "Aim stove    │    │
│  │   inside this box"]     │    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  Tilt the device until your     │
│  entire stovetop is visible.    │
│  Adjust the mounting angle      │
│  using the tilt screw.          │
│                                 │
│  [Tip: Turn on one burner       │
│   to see a bright spot appear]  │
│                                 │
│  [Stovetop is fully visible →]  │
└─────────────────────────────────┘
```

**Behavior:**
- Live thermal view updates at ~4 fps
- Guide rectangle pulses green when the system detects the stovetop area is covered
- "Stovetop is fully visible" button activates when coverage is detected (or user can force-tap to override)

### 5.7 Calibration — Step 1: Light All Burners

```
┌─────────────────────────────────┐
│  Calibration  1 of 5            │
│  ━━━━━━░░░░░░░░░░░░░░           │
│                                 │
│  [Illustration: stovetop with   │
│   all 4 burners lit, flame      │
│   icons on each]                │
│                                 │
│  Light All Burners              │
│                                 │
│  Turn on every burner on your   │
│  stove — even back burners.     │
│  Set them to medium or higher.  │
│                                 │
│  Give it 30 seconds for the     │
│  heat to show up clearly.       │
│                                 │
│  [Start 30-second countdown]    │
│   or                            │
│  [My burners are on →]          │
│                                 │
│  [Why do I need all burners on?]│
└─────────────────────────────────┘
```

### 5.8 Calibration — Step 2: Define Corners (Perspective)

**Purpose:** User taps 4 corners of their stovetop on the thermal image to define the perspective transform

```
┌─────────────────────────────────┐
│  Calibration  2 of 5            │
│  ━━━━━━━━━━░░░░░░░░░░           │
│                                 │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │  [Live thermal view     │    │
│  │   showing orange/red    │    │
│  │   heat spots from all   │    │
│  │   4 burners lit]        │    │
│  │                         │    │
│  │  [Corner dots appear    │    │
│  │   as user taps them,    │    │
│  │   connected by glowing  │    │
│  │   green lines]          │    │
│  │                         │    │
│  └─────────────────────────┘    │
│                                 │
│  Tap the 4 corners of your      │
│  stovetop to define its edges   │
│                                 │
│  ○ Front-left corner            │
│  ○ Front-right corner           │
│  ○ Back-right corner            │
│  ○ Back-left corner             │
│                                 │
│  Tap a dot to move it           │
└─────────────────────────────────┘
```

**Behavior:**
- Corner guide highlights which corner to tap next (pulsing ring)
- Each tap places a draggable dot with a numbered label
- Green quadrilateral draws between corners as they are placed
- Perspective-corrected preview appears in a small inset panel (picture-in-picture) once all 4 corners are placed
- Dots are draggable for fine adjustment
- "Looks good, continue" button appears once all 4 corners are placed and the quadrilateral is non-self-intersecting

### 5.9 Calibration — Step 3: Burner Mapping

**Purpose:** User confirms or adjusts auto-detected burner positions

```
┌─────────────────────────────────┐
│  Calibration  3 of 5            │
│  ━━━━━━━━━━━━━━░░░░░░           │
│                                 │
│  ┌─────────────────────────┐    │
│  │  [Perspective-corrected │    │
│  │   top-down thermal view │    │
│  │                         │    │
│  │    ⊙         ⊙          │    │
│  │  Front L    Front R     │    │
│  │  482°F      331°F       │    │
│  │                         │    │
│  │    ⊙         ⊙          │    │
│  │   Back L     Back R     │    │
│  │  418°F      511°F       │    │
│  └─────────────────────────┘    │
│                                 │
│  We found 4 burners. Drag the   │
│  circles to match your stove.   │
│                                 │
│  Tap a burner to rename it      │
│                                 │
│  [Add burner +]  [Remove]       │
│                                 │
│  [Looks right, continue →]      │
└─────────────────────────────────┘
```

**Behavior:**
- Auto-detected circles appear on the perspective-corrected view centered on heat peaks
- Each circle is draggable (center to reposition) and has a resize handle (drag edge to resize)
- Tap circle to edit label (pre-filled: Front Left, Front Right, Back Left, Back Right)
- "Add burner" allows manually adding a circle for a burner not detected
- Circle color reflects current temperature (matching the heat map scale)

### 5.10 Calibration — Step 4: Validation

```
┌─────────────────────────────────┐
│  Calibration  4 of 5            │
│  ━━━━━━━━━━━━━━━━━░░░           │
│                                 │
│  ┌─────────────────────────┐    │
│  │  [Thermal view]         │    │
│  │                         │    │
│  │    ✓         ⊙          │    │
│  │  Front L    Front R     │    │
│  │  (cooling)  (hot)       │    │
│  │                         │    │
│  │    ⊙         ⊙          │    │
│  │   Back L     Back R     │    │
│  └─────────────────────────┘    │
│                                 │
│  Turn off burners one at a time │
│                                 │
│  ✓ Front Left — confirmed!      │
│  ○ Front Right — waiting...     │
│  ○ Back Left — waiting...       │
│  ○ Back Right — waiting...      │
│                                 │
│  As each burner cools, we       │
│  confirm the mapping is correct │
│                                 │
│  [Skip validation]              │
└─────────────────────────────────┘
```

### 5.11 Calibration — Step 5: Success

```
┌─────────────────────────────────┐
│                                 │
│    [Checkmark animation —       │
│     green ring draws itself]    │
│                                 │
│    You're all set!              │
│                                 │
│    StoveIQ is now monitoring    │
│    your stove.                  │
│                                 │
│    ┌─────────────────────────┐  │
│    │  4 burners mapped       │  │
│    │  Front Left  ✓          │  │
│    │  Front Right ✓          │  │
│    │  Back Left   ✓          │  │
│    │  Back Right  ✓          │  │
│    └─────────────────────────┘  │
│                                 │
│    Alerts are ON by default     │
│    You can change this in       │
│    Settings anytime             │
│                                 │
│    [Go to Dashboard →]          │
│                                 │
└─────────────────────────────────┘
```

### 5.12 Main Dashboard

**Purpose:** Primary interface; must communicate stove state at a glance

```
┌─────────────────────────────────┐
│  StoveIQ       [●LOCAL] [⚙]    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  2 burners active       │    │
│  │  Longest: 23 min        │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │  [HEAT MAP — full color │    │
│  │   thermal visualization]│    │
│  │                         │    │
│  │   ╔══════╗  ╔══════╗   │    │
│  │   ║ 312°F║  ║      ║   │    │
│  │   ║ ACTV ║  ║  OFF ║   │    │
│  │   ╚══════╝  ╚══════╝   │    │
│  │                         │    │
│  │   ╔══════╗  ╔══════╗   │    │
│  │   ║ 487°F║  ║      ║   │    │
│  │   ║ HOT  ║  ║  OFF ║   │    │
│  │   ╚══════╝  ╚══════╝   │    │
│  │                         │    │
│  │  [timer badge: 8:42]   │    │
│  └─────────────────────────┘    │
│                                 │
│  [+ Timer]  [Silence] [History] │
│                                 │
│  [Home] [Alerts] [Timer] [Hist] [⚙]
└─────────────────────────────────┘
```

**Heat Map Behavior:**
- Renders perspective-corrected top-down view of stovetop
- Color scale: blue (ambient, ~70°F) through cyan, green, yellow, orange to red (600°F+)
- Per-burner overlay boxes show: temperature, status label
- Status labels: OFF (gray), WARMING (yellow), ACTIVE (orange), BOILING (red + animated wave)
- Active timer badge overlays the associated burner (countdown visible without tapping)
- Pinch-to-zoom supported (up to 3x)
- Tap any burner region to open Burner Detail sheet
- Heat map updates at minimum 1 fps (smooth interpolation between frames)

**Connection Status Indicator (top right):**
- Green dot + "LOCAL" — connected directly to device on local network
- Yellow dot + "CLOUD" — connected via cloud (device on different network)
- Red dot + "OFFLINE" — no connection; last state shown with timestamp

**Status Summary Bar:**
- When all burners off: "Stove is off" with green background tint
- When burners active: "N burners active — longest: X min" with amber background tint
- When alert active: replaced by alert banner (red)

### 5.13 Burner Detail View (Bottom Sheet)

**Trigger:** Tap any burner on heat map

```
┌─────────────────────────────────┐
│  ━━━━━━  [drag handle]          │
│                                 │
│  Front Left Burner      [Edit]  │
│  487°F  ●  ACTIVE               │
│                                 │
│  ┌─────────────────────────┐    │
│  │  [Temperature graph     │    │
│  │   30 min spark line,    │    │
│  │   labeled x-axis]       │    │
│  │                         │    │
│  │  Peak: 512°F  Avg: 431°F│    │
│  └─────────────────────────┘    │
│                                 │
│  State History                  │
│  11:32 AM  Burner ON            │
│  11:38 AM  Reached 400°F        │
│  11:51 AM  Now: ACTIVE 23 min   │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Active Timer: 8:42       │  │
│  │  [Pause] [+1 min] [Stop]  │  │
│  └───────────────────────────┘  │
│                                 │
│  [Notify when boiling]          │
│  [Set temperature alert]        │
│  [Add timer for this burner]    │
│                                 │
└─────────────────────────────────┘
```

**Behavior:**
- Sheet pulls up 60% of screen height; can pull to full-screen for graph detail
- Background heat map remains live and visible behind the sheet
- "Notify when boiling" button is prominent when water-range temperatures detected
- Temperature graph is interactive (tap to see exact reading at a point)

### 5.14 Alert Overlay (Full-Screen)

**Purpose:** Safety-critical alert; must be impossible to miss

```
┌─────────────────────────────────┐
│                                 │
│  ████████████████████████████   │
│  █                            █ │
│  █   [!]                      █ │
│  █                            █ │
│  █   Stove Left On            █ │
│  █                            █ │
│  █   Front Left burner has    █ │
│  █   been on for 32 minutes   █ │
│  █   with no activity.        █ │
│  █                            █ │
│  █   ┌─────────────────────┐  █ │
│  █   │ [Live heat map       │  █ │
│  █   │  thumbnail]         │  █ │
│  █   └─────────────────────┘  █ │
│  █                            █ │
│  █                            █ │
│  █   [Still Cooking — Snooze] █ │
│  █                            █ │
│  █   [I Forgot — View Stove]  █ │
│  █                            █ │
│  ████████████████████████████   │
│                                 │
└─────────────────────────────────┘
```

**Behavior:**
- Full-screen red overlay; appears over any screen including lock screen
- Persistent: cannot be dismissed by pressing back or home; only by tapping a response button
- Haptic pattern: escalating rumble every 5 seconds until acknowledged
- Sound: alert chime (respects silent mode via Critical Alert entitlement on iOS)
- "Still Cooking — Snooze" dismisses for 30 minutes
- "I Forgot — View Stove" opens dashboard with burner highlighted; alert stays active until burner cools
- If triggered from push notification while app is closed, same full-screen experience opens

**Alert Variants by Type:**
| Alert Type | Icon | Color | Haptic |
|------------|------|-------|--------|
| Unattended stove | Flame clock | Red | Escalating |
| High temperature | Thermometer exclamation | Deep orange | Pulse |
| Boil detected | Bubbles | Amber | Single firm |
| Timer expired | Bell | Blue | 3 taps |
| Gas detected | Warning cloud | Purple | Escalating |

### 5.15 Timers Screen

```
┌─────────────────────────────────┐
│  Timers                [+ Add]  │
│                                 │
│  Active                         │
│  ┌─────────────────────────┐    │
│  │  Front Left — Pasta     │    │
│  │  ████████░░░░░  8:42    │    │
│  │  [Pause] [+1 min] [X]   │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  Back Right — Sauce     │    │
│  │  ██░░░░░░░░░░  22:05    │    │
│  │  [Pause] [+5 min] [X]   │    │
│  └─────────────────────────┘    │
│                                 │
│  Suggestions                    │
│  Based on current heat pattern: │
│  ┌──────────┐  ┌──────────┐     │
│  │ Soft boil│  │  Simmer  │     │
│  │  6 min   │  │  20 min  │     │
│  └──────────┘  └──────────┘     │
│                                 │
│  Recent                         │
│  Pasta (10 min)   Yesterday     │
│  Eggs (7 min)     Mon           │
│                                 │
│  [Home][Alerts][Timer][Hist][⚙] │
└─────────────────────────────────┘
```

**Add Timer Sheet:**
```
┌─────────────────────────────────┐
│  ━━━━━━                         │
│  New Timer                      │
│                                 │
│  Burner                         │
│  [Front Left ▼]                 │
│                                 │
│  Duration                       │
│  [  5 min  ] [  10 min ] [15 min]│
│  [  20 min ] [  30 min ] [Custom]│
│                                 │
│  Name (optional)                │
│  ┌─────────────────────────┐    │
│  │  e.g. Pasta, Rice...    │    │
│  └─────────────────────────┘    │
│                                 │
│  [Start Timer →]                │
│                                 │
└─────────────────────────────────┘
```

### 5.16 History Screen

```
┌─────────────────────────────────┐
│  Cooking History                │
│                                 │
│  [Week ▼]    [< Mar 18-24 >]    │
│                                 │
│  Summary                        │
│  ┌─────────────────────────┐    │
│  │  8 sessions · 4h 22min  │    │
│  │  0 unacknowledged alerts│    │
│  └─────────────────────────┘    │
│                                 │
│  Today — Thursday Mar 26        │
│  ┌─────────────────────────┐    │
│  │  11:30 AM – 12:14 PM    │    │
│  │  44 min · 2 burners     │    │
│  │  Peak: 512°F            │    │
│  └─────────────────────────┘    │
│                                 │
│  Wednesday Mar 25               │
│  ┌─────────────────────────┐    │
│  │  7:02 PM – 7:38 PM      │    │
│  │  36 min · 1 burner      │    │
│  │  Peak: 445°F            │    │
│  └─────────────────────────┘    │
│  ┌─────────────────────────┐    │
│  │  ⚠ Unattended alert     │    │
│  │  7:43 PM — acknowledged │    │
│  └─────────────────────────┘    │
│                                 │
│  [Home][Alerts][Timer][Hist][⚙] │
└─────────────────────────────────┘
```

**Session Detail:**
```
┌─────────────────────────────────┐
│  ←  Thursday, Mar 26            │
│     11:30 AM – 12:14 PM         │
│                                 │
│  ┌─────────────────────────┐    │
│  │  [Mini heat map still   │    │
│  │   — shows thermal state │    │
│  │   at peak of session]   │    │
│  └─────────────────────────┘    │
│                                 │
│  Duration     44 min            │
│  Burners used Front L, Back R   │
│  Peak temp    512°F (Front L)   │
│  Alerts       0                 │
│                                 │
│  Front Left Burner Timeline     │
│  ┌─────────────────────────┐    │
│  │  [Temperature graph]    │    │
│  └─────────────────────────┘    │
│  ON at 11:30 · Peak 11:44       │
│  OFF at 12:14                   │
│                                 │
│  Back Right Burner Timeline     │
│  ┌─────────────────────────┐    │
│  │  [Temperature graph]    │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

### 5.17 Remote Monitoring View (Caregiver)

**Trigger:** User who is set up as a caregiver on another person's device

```
┌─────────────────────────────────┐
│  Monitoring: Dad's Kitchen      │
│                                 │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │   Stove is ON           │    │
│  │   Front Left · 31 min   │    │
│  │                         │    │
│  │   Last used: Today      │    │
│  │   11:30 AM              │    │
│  └─────────────────────────┘    │
│                                 │
│  [Call Dad  ☎]                  │
│                                 │
│  This Week                      │
│  ┌─────────────────────────┐    │
│  │  Mon  ██░░  18 min      │    │
│  │  Tue  ████  42 min      │    │
│  │  Wed  ███░  31 min      │    │
│  │  Thu  ██░░  ─ so far    │    │
│  └─────────────────────────┘    │
│                                 │
│  Alerts This Week               │
│  None — all clear               │
│                                 │
│  [Full Details]  [Alert History]│
│                                 │
│  [Home][Alerts][Timer][Hist][⚙] │
└─────────────────────────────────┘
```

**Design Notes:**
- No thermal heat map shown here by default (too technical for quick check)
- "Call Dad" button is prominently placed — always one tap away
- Bar chart gives a quick sense of cooking routine
- "Full Details" reveals the heat map for caregivers who want more

### 5.18 Settings Screen

```
┌─────────────────────────────────┐
│  Settings                       │
│                                 │
│  MY DEVICE                      │
│  ┌─────────────────────────┐    │
│  │  Kitchen StoveIQ        │    │
│  │  Serial: SQ-A3F2        │    │
│  │  Firmware: 1.2.3  [Update!]  │
│  └─────────────────────────┘    │
│  Rename device                  │
│  Recalibrate burners            │
│  WiFi settings                  │
│                                 │
│  ALERTS                         │
│  Unattended stove               │
│  After  [30 min ▼]              │
│                                 │
│  Temperature limit              │
│  Alert above  [600°F ▼]         │
│                                 │
│  Quiet hours                    │
│  Off [toggle]                   │
│                                 │
│  Emergency contacts   [Manage]  │
│                                 │
│  HOUSEHOLD                      │
│  Members  [2]         [Manage]  │
│                                 │
│  DISPLAY                        │
│  Units          [°F / °C]       │
│  Dark mode      [Auto ▼]        │
│                                 │
│  ACCOUNT                        │
│  nickd@email.com                │
│  Manage subscription            │
│  Sign out                       │
│                                 │
│  [Home][Alerts][Timer][Hist][⚙] │
└─────────────────────────────────┘
```

---

## 6. Component Library

### 6.1 Buttons

| Type | Usage | Shape | States |
|------|-------|-------|--------|
| Primary | Main CTAs (Continue, Start Timer) | Rounded pill, full-width | Default, Pressed (scale 0.97), Disabled (40% opacity), Loading (spinner replaces label) |
| Secondary | Alternate actions (Skip, Cancel) | Rounded outline, full-width | Default, Pressed, Disabled |
| Tertiary | Low-emphasis (Edit, View history) | Text only, no border | Default, Pressed (bg tint), Disabled |
| Destructive | Delete, Remove device | Rounded pill, red | Default, Confirmation state required |
| Alert Action | Alert overlay responses | Full-width, high contrast, extra large | Default, Pressed |
| FAB | Quick add timer | Circle, floating | Default, Pressed (scale 0.95) |

**Minimum touch target:** 48x48 dp (larger for alert buttons: 64dp height)

### 6.2 Heat Map Component

The heat map is the most complex component in the app.

**Rendering Pipeline:**
1. Raw 32x24 temperature array from device
2. Bicubic upsampling to display resolution (nearest-neighbor would look blocky)
3. Per-pixel color mapping via temperature-to-color LUT
4. Perspective transform (using saved corner calibration points)
5. Burner overlay circles (draggable in calibration, static in monitoring)
6. Temperature label badges at burner centers
7. Status badges below temperature labels
8. Timer countdown badges pinned near associated burner

**Color Scale (default):**
| Temperature (°F) | Color | Hex |
|-----------------|-------|-----|
| < 90 | Deep blue (ambient) | #0A1628 |
| 120 | Blue | #1E3A8A |
| 200 | Cyan | #06B6D4 |
| 300 | Green | #16A34A |
| 400 | Yellow | #EAB308 |
| 500 | Orange | #EA580C |
| 600+ | Red | #DC2626 |

**Gesture Support:**
- Pinch to zoom (1x to 3x; default 1x)
- Double-tap to reset zoom
- Tap on burner region (within 20dp of burner center) to open Burner Detail
- During calibration: tap to place corner points; drag existing points to adjust

**States:**
- Live (streaming): normal rendering
- Connecting: skeleton shimmer animation; last frame preserved under overlay
- Offline: last known frame with "Last updated: X minutes ago" banner
- Calibration mode: corner tap targets visible; existing calibration faded

### 6.3 Status Badge (Per-Burner)

```
┌─────────────────┐
│  487°F          │  ← temperature in large text
│  ● ACTIVE       │  ← colored dot + status label
└─────────────────┘
```

| Status | Dot Color | Label | Background |
|--------|-----------|-------|------------|
| OFF | Gray | OFF | Transparent |
| WARMING | Yellow | WARMING | Subtle warm tint |
| ACTIVE | Orange | ACTIVE | Subtle orange tint |
| BOILING | Animated red | BOILING | Subtle red tint |
| HIGH HEAT | Deep red | HIGH HEAT | Red tint |

### 6.4 Alert Banner (Non-Critical)

For less urgent notifications (boil detected, timer expiring in 1 min):
```
┌──────────────────────────────────┐
│ 🔵  Burner 1: Water is boiling!  │  [View →]
└──────────────────────────────────┘
```
- Slides in from top
- Dismisses after 5 seconds or on tap
- Does not block navigation or interaction

### 6.5 Temperature Graph (Sparkline)

Used in Burner Detail and Session History:

```
     512°F ┤             ╭─╮
           │          ╭──╯  ╰─
     400°F ┤       ╭──╯
           │   ╭───╯
     200°F ┤───╯
           └──────────────────
           11:30  11:40  11:50
```

**Behavior:**
- Interactive: tap/drag to see reading at exact timestamp
- Threshold lines: dashed line if user has set a temperature alert
- Boil range: shaded band showing boiling zone (210-215°F for water)
- Updates live when viewing current session

### 6.6 Cards

**Device Status Card (Dashboard summary):**
- Background: semantic color (green/amber/red) at 10% opacity
- Content: stove on/off state, active burner count, longest duration
- Tap: no action (informational only)

**Session History Card:**
- Time range, duration, burner count, peak temp
- Alert indicator if any alerts were triggered
- Tap: opens session detail

**Timer Card:**
- Burner name, timer name, remaining time, progress bar
- Inline controls: pause/resume, +1 min, stop
- Background: countdown urgency colors (blue → yellow → red at last 60 sec)

### 6.7 Form Elements

**Text Input:**
- Label: floating (animates up when focused)
- Border: gray at rest; brand blue when focused; red when error
- Error: red border + inline message below field
- Helper text: small gray text below field when relevant

**Toggle:**
- Size: 51x31 dp (iOS standard scale)
- On: brand color (StoveIQ orange-red)
- Transitions: spring animation

**Picker / Dropdown:**
- Inline segment control for 2-4 options
- Bottom sheet picker for longer lists
- Value wheel for numeric durations

**Stepper (for thresholds):**
```
  [−]   30 minutes   [+]
```
- Tap to increment/decrement
- Long-press for continuous change

---

## 7. Interaction Design

### 7.1 Heat Map Micro-Interactions

**Burner Status Change (OFF → ACTIVE):**
```
Temperature reaches threshold
  → Badge background fades from transparent to warm tint (300ms ease-in)
  → Status label crossfades from "OFF" to "WARMING" (150ms)
  → Temperature number counts up with each new frame
```

**Boil Detected:**
```
Boil pattern confirmed
  → Status badge pulses red (3x, 400ms each)
  → Boil banner slides in from top
  → If "Notify when boiling" was set: push notification + in-app full-screen alert
```

**Burner Tap (open detail):**
```
Tap registered
  → Burner badge scales to 1.05x (100ms) then returns to 1.0x
  → Haptic: light impact
  → Burner Detail sheet slides up from bottom (350ms spring)
```

### 7.2 Alert Transitions

**Alert Fires (in-app):**
```
Alert triggered
  → Screen content dims and blurs (400ms)
  → Red overlay fades in from edges (300ms)
  → Alert card slides up from bottom (350ms spring)
  → Haptic: heavy impact repeated every 5 seconds
  → Chime plays (unless silent mode, then critical alert on iOS)
```

**Alert Acknowledged:**
```
User taps response button
  → Haptic: medium impact
  → Overlay fades out (250ms)
  → Content unblurs (300ms)
  → Toast confirms action ("Snoozed for 30 min")
```

### 7.3 Calibration Interactions

**Corner Placement:**
```
User taps on thermal view
  → Dot appears with scale-in animation (200ms spring)
  → Connecting line draws from previous dot (150ms)
  → Haptic: light impact
  → Guide highlight moves to next corner (pulse)
```

**Burner Circle Drag:**
```
Long press on circle
  → Circle enlarges slightly (1.1x scale, 150ms)
  → Haptic: selection changed pattern begins
  → Drag moves circle; real-time temperature average updates
  → Release: circle settles (spring), haptic stops
```

### 7.4 Page Transitions

| Transition | Animation |
|------------|-----------|
| Tab switch | Crossfade (150ms) |
| Burner Detail open | Slide up from bottom (350ms spring) |
| Burner Detail dismiss | Slide down (250ms ease-in) |
| Alert overlay open | Fade + scale from center (300ms) |
| Alert overlay dismiss | Fade out (200ms) |
| Onboarding step forward | Slide left (300ms ease-in-out) |
| Onboarding step back | Slide right (250ms ease-in-out) |
| Settings push | Slide left standard iOS/Material |
| Modal sheet open | Slide up standard |

### 7.5 Haptic Feedback Map

| Event | Haptic Type |
|-------|------------|
| Burner status change | Light impact |
| Timer complete | 3 medium impacts (spaced 100ms) |
| Safety alert active | Heavy impact, repeated every 5 sec |
| Alert acknowledged | Medium impact |
| Button press (primary) | Light impact |
| Calibration corner placed | Light impact |
| Calibration validation success | Success pattern (iOS) / double medium |
| Connection lost | 2 slow heavy impacts |
| Connection restored | Success pattern |
| Boil detected | Medium impact × 2 |
| Error (form validation) | Error pattern (iOS) / short heavy |

### 7.6 Pull-to-Refresh

Available on the Dashboard when connection is "CLOUD" or "OFFLINE":
- Standard pull gesture triggers a manual device poll
- Shows "Checking connection..." spinner
- Updates connection status indicator
- Not available in LOCAL mode (stream is already live)

---

## 8. Responsive Design

### 8.1 Device Targets

| Size | Target | Layout Changes |
|------|--------|----------------|
| Small phone (< 375pt wide) | iPhone SE, compact Androids | Single column; heat map height capped at 40vh |
| Standard phone (375-430pt) | iPhone 14/15, Pixel 8 | Default design target |
| Large phone (430pt+) | iPhone Pro Max, large Androids | Heat map expands; dashboard cards side by side |
| Tablet (600pt+) | iPad, Android tablets | Split-pane: heat map left, detail right |

### 8.2 Tablet Layout (iPad / Large Android)

Dashboard in landscape on tablet:
```
┌──────────────────────┬─────────────────────┐
│                      │  2 burners active    │
│   [HEAT MAP]         │  Longest: 23 min     │
│                      ├─────────────────────┤
│   Full thermal view  │  Front Left Burner   │
│   (no detail sheet   │  487°F — ACTIVE      │
│    needed — it's     │  [graph]             │
│    always visible    ├─────────────────────┤
│    in right panel)   │  Timers              │
│                      │  Pasta: 8:42         │
└──────────────────────┴─────────────────────┘
```

### 8.3 Orientation

- Portrait is the primary orientation for phones
- Landscape supported on tablets (split-pane)
- Heat map visualization should work in both; calibration wizard is portrait-only

### 8.4 Dynamic Type / Font Scaling

All text elements use scalable font sizes. At the largest accessibility sizes:
- Temperature labels on heat map maintain minimum 14pt (do not scale down)
- Alert text can grow to fill screen; buttons remain visible below
- Navigation labels may truncate with ellipsis; icons always remain

---

## 9. Accessibility Specifications

### 9.1 WCAG Compliance Target

**Level AA** across all screens. Safety-critical screens (alerts, status summary) to meet AAA contrast requirements.

### 9.2 Color and Contrast

| Element | Minimum Contrast | Target |
|---------|-----------------|--------|
| Body text | 4.5:1 | 7:1 |
| Large text (18pt+) | 3:1 | 4.5:1 |
| Alert text on red | 4.5:1 | White text on red: 5.5:1 |
| Status badges | 4.5:1 | |
| Button text | 4.5:1 | |

**Color-blindness considerations:**
- Heat map gradient is chosen to be distinguishable for deuteranopia (red-green) and protanopia. Blue-to-red is largely safe; add iconographic indicators (snowflake for cold, flame for hot) as supplementary cues.
- Burner status is never conveyed by color alone — the text label (ACTIVE, OFF) is always present.
- Alert states use icons + text, not color alone.

### 9.3 Touch Targets

| Element | Minimum Target Size |
|---------|-------------------|
| Navigation tabs | 64dp height |
| Primary buttons | 48dp height × full width |
| Alert response buttons | 64dp height |
| Burner tap region on heat map | 44dp radius circle |
| Timer controls (+1 min, pause) | 48x48dp |
| Calibration drag handles | 44x44dp minimum |
| Close / dismiss controls | 44x44dp |

### 9.4 Screen Reader Support

**VoiceOver / TalkBack support:**

- Heat map: announces active burner count and their states when focused. Example: "Stovetop heat map. 2 burners active. Front Left at 487 degrees, active 23 minutes. Front Right off. Tap to select a burner."
- Burner status badges: role = "button", label = "Front Left burner, 487°F, ACTIVE, 23 minutes. Tap for details."
- Alert overlay: announced immediately on appearance with role = "alert". Buttons labeled clearly: "Still cooking, snooze alert" and "I forgot, view stove."
- Temperature graph: described as data table (timestamp, temperature columns) for screen reader users.
- Calibration corner dots: labeled "Corner 1 of 4, Front-left corner. Placed. Double-tap to move."
- Navigation tabs: standard tab bar semantics with badge count for Alerts tab.

**ARIA live regions (mapped to Flutter semantics):**
- Connection status indicator: polite live region (announces changes)
- Burner status changes: off (do not announce every frame update)
- Active alerts: assertive live region (announces immediately)
- Timer countdown: polite update every 1 minute, not every second

### 9.5 Focus Management

- Alert overlay traps focus until dismissed
- After alert dismissal, focus returns to previous screen location
- Calibration wizard: focus moves to first interactive element on each step
- Bottom sheets: focus moves to sheet content on open; returns to trigger on close

### 9.6 Reduced Motion

When "Reduce Motion" is enabled in system settings:
- Crossfades replace all slide transitions
- Heat map updates without interpolation animation (raw frame switching)
- Calibration corner animations: instant placement, no spring
- Alert overlay: fade only, no scale
- Pulsing status badges: static state instead of pulse

---

## 10. Dark Mode

### 10.1 Dark Mode Philosophy

Dark mode is the **default recommended mode** for StoveIQ, not an afterthought. Kitchen use at night — checking the stove status, setting a timer — should not blind the user with a white screen. The heat map also reads better against a dark background.

System default (Auto) follows OS dark/light setting. User can override in Settings.

### 10.2 Dark Mode Color Mapping

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| Background (primary) | #FFFFFF | #0F0F0F |
| Background (secondary) | #F5F5F5 | #1A1A1A |
| Background (elevated card) | #FFFFFF | #242424 |
| Text primary | #111111 | #F0F0F0 |
| Text secondary | #666666 | #999999 |
| Border / divider | #E5E5E5 | #2E2E2E |
| Brand primary | #DC4A18 (StoveIQ orange-red) | #EF5C25 (slightly lighter for dark) |
| Alert red background | #FEF2F2 | #2D0A0A |
| Alert red text | #991B1B | #FCA5A5 |
| Success green | #16A34A | #22C55E |
| Warning amber | #D97706 | #F59E0B |
| Heat map background | #000000 (always dark) | #000000 |

### 10.3 Heat Map in Both Modes

The heat map itself is always dark-background (thermal camera aesthetic). The surrounding UI adapts to light/dark mode; the heat map canvas does not change.

---

## 11. Home Screen Widget

### 11.1 Widget Sizes

**Small (2x2):**
```
┌─────────────────┐
│ StoveIQ         │
│                 │
│   Stove OFF     │
│                 │
│  Last: 12:14 PM │
└─────────────────┘
```

**Medium (4x2):**
```
┌──────────────────────────────────┐
│ StoveIQ                          │
│                                  │
│  ● Stove ON · Front Left · 23min │
│                                  │
│  ⏱ Pasta: 8:42 remaining        │
└──────────────────────────────────┘
```

**Large (4x4):**
```
┌──────────────────────────────────┐
│ StoveIQ               2 active   │
│                                  │
│  [Simplified heat map view       │
│   showing colored blocks for     │
│   burner positions]              │
│                                  │
│  Front L  487°F  ACTIVE  23min   │
│  Back R   331°F  ACTIVE  ---     │
│                                  │
│  ⏱ Pasta timer: 8:42             │
└──────────────────────────────────┘
```

### 11.2 Widget Behavior

- Widget updates every 15 minutes (platform limit)
- Tapping widget deep-links to Dashboard
- When stove is OFF: green border accent
- When stove ON: amber border accent
- When alert active: red border + "! Alert" label
- Widget is available for both iOS (WidgetKit) and Android (Glance)
- Lock screen widget (iOS 16+): small widget showing stove on/off + longest active duration

---

## 12. Design Tokens

### 12.1 Color Palette

**Brand Colors:**
| Token | Hex | Usage |
|-------|-----|-------|
| `--color-brand-primary` | #DC4A18 | Primary buttons, active indicators, brand accent |
| `--color-brand-primary-dark` | #B83A12 | Hover/pressed primary |
| `--color-brand-primary-light` | #FEE5DC | Primary button background tint |
| `--color-brand-secondary` | #1E3A8A | Cool contrast (offline state, informational) |

**Heat Map Scale:**
| Token | Hex | Temperature |
|-------|-----|-------------|
| `--heatmap-cold` | #0A1628 | Ambient < 90°F |
| `--heatmap-cool` | #1E3A8A | 90-150°F |
| `--heatmap-cyan` | #06B6D4 | 150-250°F |
| `--heatmap-green` | #16A34A | 250-350°F |
| `--heatmap-yellow` | #EAB308 | 350-450°F |
| `--heatmap-orange` | #EA580C | 450-550°F |
| `--heatmap-red` | #DC2626 | 550°F+ |

**Semantic Colors:**
| Token | Hex (Light) | Hex (Dark) | Usage |
|-------|-------------|------------|-------|
| `--color-success` | #16A34A | #22C55E | Stove off, calibration success |
| `--color-warning` | #D97706 | #F59E0B | Stove on but no alert |
| `--color-danger` | #DC2626 | #EF4444 | Active alerts, high temp |
| `--color-info` | #2563EB | #3B82F6 | Connection status, informational |
| `--color-neutral` | #6B7280 | #9CA3AF | Disabled, secondary text |

**Neutral Grays:**
| Token | Light | Dark |
|-------|-------|------|
| `--gray-50` | #F9FAFB | #111111 |
| `--gray-100` | #F3F4F6 | #1A1A1A |
| `--gray-200` | #E5E7EB | #2A2A2A |
| `--gray-300` | #D1D5DB | #3A3A3A |
| `--gray-400` | #9CA3AF | #555555 |
| `--gray-600` | #4B5563 | #999999 |
| `--gray-900` | #111827 | #F0F0F0 |

### 12.2 Typography

**Font:** System fonts preferred for legibility and size scaling.
- iOS: SF Pro Text / SF Pro Display
- Android: Google Sans / Roboto

**Scale:**
| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-xs` | 11pt | Regular | 1.3 | Timestamps, captions |
| `--text-sm` | 13pt | Regular | 1.4 | Secondary labels, helper text |
| `--text-base` | 15pt | Regular | 1.5 | Body text, form labels |
| `--text-lg` | 17pt | Medium | 1.4 | Section headers, card titles |
| `--text-xl` | 22pt | Semibold | 1.2 | Page titles |
| `--text-2xl` | 28pt | Bold | 1.1 | Dashboard stove status |
| `--text-temp` | 20pt | Semibold Mono | 1.0 | Burner temperature readouts (monospaced to prevent layout shift) |

### 12.3 Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4dp | Tight: icon-to-label gap |
| `--space-2` | 8dp | Component internal padding (small) |
| `--space-3` | 12dp | Between related elements |
| `--space-4` | 16dp | Standard card padding, section padding |
| `--space-5` | 20dp | Between card groups |
| `--space-6` | 24dp | Section spacer |
| `--space-8` | 32dp | Major section breaks |
| `--space-12` | 48dp | Screen top/bottom padding |

### 12.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6dp | Chips, tags |
| `--radius-md` | 12dp | Cards, input fields |
| `--radius-lg` | 16dp | Bottom sheets, modals |
| `--radius-xl` | 24dp | Primary buttons |
| `--radius-full` | 9999dp | Pills, badges, toggles |

### 12.5 Shadows (elevation)

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | 0 1px 3px rgba(0,0,0,0.12) | Cards at rest |
| `--shadow-md` | 0 4px 12px rgba(0,0,0,0.15) | Cards on press, focused inputs |
| `--shadow-lg` | 0 8px 24px rgba(0,0,0,0.20) | Bottom sheets, modals |
| `--shadow-alert` | 0 0 0 4px rgba(220,38,38,0.4) | Alert overlay glow ring |

### 12.6 Animation Timing

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `--duration-fast` | 150ms | ease-out | Button press, icon swap |
| `--duration-normal` | 250ms | ease-in-out | Crossfades, overlays |
| `--duration-slow` | 350ms | spring (stiffness 300, damping 30) | Sheets, modals |
| `--duration-alert` | 300ms | ease-in | Alert appearance (never delay a safety alert) |

---

## 13. Content Guidelines

### 13.1 Voice and Tone

StoveIQ talks like a calm, competent kitchen companion — not a legal disclaimer, not a nanny, not a startup chatbot.

- **Calm and factual for normal states:** "2 burners active. Longest: 23 minutes." Not "Hey! Your stove is on!"
- **Clear and urgent for alerts:** "Front Left has been on 32 minutes." Not "A burner situation may require your attention."
- **Human for encouragement:** "You're all set! StoveIQ is now watching your stove." Not "Configuration complete."
- **Never blame:** "We couldn't connect" not "You failed to connect the device."

### 13.2 Microcopy Standards

**Button labels:**
| Context | Label | Avoid |
|---------|-------|-------|
| Start calibration | "Start Calibration" | "Begin Process" |
| Dismiss alert (cooking) | "Still Cooking — Snooze" | "Dismiss" |
| Dismiss alert (forgot) | "I Forgot — View Stove" | "OK" |
| Complete setup | "Go to Dashboard" | "Finish" |
| Add household member | "Invite Someone" | "Add User" |

**Alert messages:**
| Situation | Title | Body |
|-----------|-------|------|
| Unattended stove | "Stove Left On" | "[Burner] has been on for [N] minutes with no change. Still cooking?" |
| High temperature | "High Heat Alert" | "[Burner] reached [temp]. That's unusually hot — check on it." |
| Boil detected | "Water is Boiling!" | "[Burner] water is boiling. Time to add ingredients." |
| Timer done | "Timer's Up" | "Your [name] timer on [Burner] is done." |
| Connection lost | "Lost Connection" | "Reconnecting... Last status: [time]." |

**Empty states:**
| Screen | Message |
|--------|---------|
| Timers (no timers set) | "No active timers. Tap + to start one." |
| History (new user) | "No cooking sessions yet. Start cooking and StoveIQ will remember everything." |
| Alerts (all clear) | "All clear. No alerts in the last 7 days." |
| History (no alerts this week) | "No alerts this week — great cooking!" |

**Error messages:**
| Error | Message |
|-------|---------|
| WiFi password wrong | "Couldn't connect to that network. Double-check your password and try again." |
| Device not found | "Can't find your StoveIQ. Make sure it's plugged in and the LED is solid blue." |
| Server error | "Something went wrong on our end. Your device is still monitoring locally." |
| Calibration failed | "The burner mapping didn't look right. Want to try again?" |

---

## 14. Notification Design

### 14.1 Push Notification Copy

| Trigger | Title | Body |
|---------|-------|------|
| Unattended stove (30 min) | "StoveIQ Alert" | "Front Left has been on 30 min with no change. Still cooking?" |
| High temperature | "High Heat Alert" | "Front Left hit 600°F. Check on it." |
| Boil detected | "Water's Boiling" | "Front Left: looks like it's boiling. Tap to set a timer." |
| Timer expired | "Timer's Up!" | "Your Pasta timer on Front Left is done." |
| Stove on when you leave | "Left the stove on?" | "Front Left is still on. Tap to check." |
| Caregiver: stove on | "Dad's stove is on" | "Front Left turned on at 11:42 AM." |
| Caregiver: long session | "Dad's stove alert" | "Front Left has been on for 48 minutes." |
| Device offline | "StoveIQ offline" | "We lost contact with your device. Check WiFi." |

### 14.2 Notification Grouping

- All StoveIQ notifications group under "StoveIQ" thread
- Safety alerts are Critical Alerts (iOS) — bypass silent mode
- Boil detection and timers are Time Sensitive (iOS) — break through Focus modes
- Usage summaries are standard notifications

### 14.3 Lock Screen Behavior

- Alert notifications: expand to show heat map thumbnail + action buttons (snooze / view)
- Timer notifications: expand to show timer name and controls (stop / +1 min)
- Standard notifications: compact, tap to open app

---

## 15. Onboarding Edge Cases

### 15.1 Taking Over an Existing Device

When a user adds a device that is already configured (e.g., a caregiver inheriting setup from the device owner):
- Skip device pairing
- Skip WiFi provisioning
- Still require: aims verification + recalibration offered but optional

### 15.2 Multiple Devices

A user with StoveIQ units at their home and their parent's home:
- Dashboard shows a device selector at the top ("My Kitchen / Dad's Kitchen")
- All tabs filter to the selected device
- Alerts tab shows alerts across all devices with device name as context

### 15.3 Recalibration from Settings

- Exactly the same wizard as first-time calibration
- Begins at Step 1 (light all burners)
- Previous calibration is preserved until the new one is confirmed
- If calibration is abandoned, old calibration remains in effect

---

## 16. Open Questions

- [ ] Should the app support multiple stoves per account (e.g., also monitoring a second home)?
- [ ] Is there a web dashboard for caregivers who do not have the mobile app?
- [ ] What is the max number of household members per device?
- [ ] Should temperature alerts be per-burner or global thresholds?
- [ ] Do we support gas leak detection UI in MVP or is that a v2 feature?
- [ ] Is cooking history stored locally (offline-capable) or cloud-only?
- [ ] What is the data retention policy for cooking session history?

---

## 17. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-26 | Nick DeMarco with AI Assistance | Initial complete draft |
