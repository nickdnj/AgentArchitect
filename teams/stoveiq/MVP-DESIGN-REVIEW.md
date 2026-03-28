# StoveIQ Safety MVP -- Design Review

**Version:** 1.0
**Date:** 2026-03-27
**Author:** Design Review (AI-assisted)
**Scope:** 4-screen Flutter MVP (Onboarding, Status, Alert History, Settings)
**Primary User:** Caregiver, age 40-65, monitoring aging parent's stove remotely

---

## 1. MVP Screen Inventory

### Screen 1: Onboarding / BLE Provisioning

**Purpose:** Walk a non-technical caregiver through connecting StoveIQ to WiFi so it can start sending alerts.

**Key Elements:**
- Step indicator (Step N of M) with progress bar
- Illustration of physical device with LED state
- BLE scan animation and discovered device card
- WiFi network list (scanned from device, not phone)
- Password entry field with show/hide toggle
- Connection status feedback (spinner, checkmark, error)
- "StoveIQ uses 2.4GHz WiFi only" note
- Privacy reassurance: "Your password is sent directly to the device"

**States:**

| State | What User Sees |
|-------|----------------|
| **Initial** | "Plug in your StoveIQ. The LED should glow blue." with illustration. BLE scan starts automatically. |
| **Scanning** | Animated radar ring. "Searching for device..." Text below: "Make sure StoveIQ is plugged in nearby." |
| **Device Found** | Device card appears: "StoveIQ-A1B2 -- Tap to connect." Scan ring stops. |
| **BLE Connected** | Card shows green checkmark. Auto-advances to WiFi network list. |
| **WiFi Connecting** | Full-screen progress: "Connecting to HomeNetwork..." with spinner. Three sub-steps shown as a checklist: WiFi connecting, Getting IP address, Reaching cloud. |
| **Success** | Big green checkmark animation. "StoveIQ is online and monitoring." Single button: "Go to Status." |
| **Error: No device found** | After 15 seconds: "Can't find your StoveIQ." Troubleshooting checklist: Is it plugged in? Is Bluetooth on? Are you within 10 feet? Button: "Try Again." |
| **Error: Wrong WiFi password** | Inline error below password field: "Couldn't connect. Check your password and try again." Password field retains text for editing. |
| **Error: SSID not found** | "Network not found. It may be out of range of your StoveIQ." Note about 2.4GHz requirement. |
| **Error: MQTT fail** | "WiFi connected but cloud is unreachable. StoveIQ will keep trying. You can continue setup." This is non-blocking -- the device will connect to MQTT on its own. |
| **Error: BLE disconnect mid-flow** | "Lost connection to StoveIQ. Let's try again." Returns to BLE scan step, not the beginning. |

**User Actions:**
- Tap discovered device to connect
- Select WiFi network from list
- Enter WiFi password
- Tap "Try Again" on errors
- Tap "Troubleshoot" for help content
- Tap "Connect" to push credentials to device
- Tap "Go to Status" on success

**Navigation:**
- Entry: First app launch after account creation (or "Add Device" from Settings)
- Exit: Status screen on success
- No back navigation to previous screens once WiFi provisioning begins (to prevent partial-provision states)
- Can close app and resume -- NVS on device retains state

**MVP Simplifications vs. Full UX Spec:**
- No mounting guide (no calibration needed for binary detection)
- No aiming guide (no heat map, no perspective correction)
- No calibration wizard (whole-frame max temperature, no burner mapping)
- Account creation uses Apple/Google sign-in only (skip email/password for MVP friction reduction)

---

### Screen 2: Status Screen (Home)

**Purpose:** Answer the one question that matters: "Is the stove on right now, and for how long?"

**Key Elements:**
- Device name header ("Mom's Kitchen" or "StoveIQ")
- Giant status indicator: circular icon area, either a green shield (OFF) or a pulsing red/amber flame (ON)
- Status text: "Stove is OFF" or "Stove is ON -- 47 minutes"
- Duration counter (live-updating when ON)
- Last activity line: "Last used: Today at 11:30 AM" (when OFF)
- Connection status pill: green "Connected", yellow "Cloud", red "Offline -- last update 3 min ago"
- "Call Mom" / "Call Dad" quick-action button (configurable contact)
- Heartbeat indicator: subtle last-seen timestamp ("Device checked in 42 seconds ago")

**States:**

| State | What User Sees |
|-------|----------------|
| **Stove OFF** | Large green shield icon. "Stove is OFF." Below: "Last used: Today at 2:14 PM (23 minutes)." Calm, reassuring. Background tint: dark with subtle green. |
| **Stove ON** | Large amber/red flame icon, gently pulsing. "Stove is ON -- 12 minutes." Duration counts up live. Background tint: dark with warm amber glow. |
| **Stove ON -- Warning** | Flame icon turns solid amber. "Stove ON -- 34 minutes (unattended)." Warning badge appears. |
| **Stove ON -- Critical** | Flame icon turns red, pulses faster. "STOVE LEFT ON -- 62 minutes." Full red background. Buzzer active indicator: "On-device alarm is sounding." |
| **Loading** | Skeleton shimmer on status area. "Connecting to StoveIQ..." |
| **Offline (recent)** | Status shows last known state with timestamp. Red "Offline" pill. "Last update: 3 minutes ago." Message: "StoveIQ may have lost power or WiFi." |
| **Offline (stale, >10 min)** | Last known state grayed out. Prominent warning: "StoveIQ has been offline for 47 minutes. The on-device alarm still works, but you won't receive push notifications." |
| **Empty (first launch, just provisioned)** | "StoveIQ is connected and monitoring. When the stove turns on, you'll see it here." Illustration of the device watching over a stove. |

**User Actions:**
- Pull to refresh (force Firestore re-fetch)
- Tap "Call Mom/Dad" to initiate phone call
- Tap connection status pill for detail (WiFi signal, last heartbeat time)
- Tap status area to navigate to Alert History (contextual: shows recent activity)
- Navigate to Settings via gear icon
- Navigate to Alert History via tab/button

**Navigation:**
- Entry: Default screen on app open. Push notification taps land here.
- Outbound: Alert History (bottom nav or tap), Settings (gear icon)
- Alert overlay appears OVER this screen when a critical alert fires

---

### Screen 3: Alert History

**Purpose:** Show the caregiver a chronological record of every stove event and alert, providing evidence of patterns and building confidence that the system is working.

**Key Elements:**
- Reverse-chronological list of events
- Event cards with: icon, type label, timestamp, duration, and outcome
- Date section headers ("Today", "Yesterday", "March 25")
- Color-coded left border on each card (green = normal on/off, amber = warning, red = critical)
- Filter chips: "All", "Alerts Only", "Stove Events"

**Event Types in MVP:**
- **Stove ON** -- green dot -- "Stove turned on at 2:14 PM"
- **Stove OFF** -- gray dot -- "Stove turned off at 2:47 PM (33 min)"
- **Unattended Warning** -- amber triangle -- "Stove unattended for 30 min at 2:44 PM"
- **Unattended Critical** -- red triangle -- "CRITICAL: Stove unattended 60 min. Buzzer activated."
- **Device Offline** -- red circle-slash -- "StoveIQ went offline at 4:02 PM"
- **Device Back Online** -- green circle -- "StoveIQ reconnected at 4:08 PM (6 min gap)"
- **Reconnect Summary** -- blue info icon -- "While offline: Stove was ON 4:02-4:07 PM (no alerts missed)"

**States:**

| State | What User Sees |
|-------|----------------|
| **Empty** | Illustration of a calm kitchen. "No activity yet. When your stove turns on, events will appear here. StoveIQ is watching." |
| **Loading** | Skeleton list (3-4 shimmer cards). |
| **Active (with data)** | Scrollable list of event cards grouped by date. Most recent at top. |
| **Active (with active alert)** | Top of list shows a pinned, highlighted "ACTIVE" card for the current unattended event, pulsing amber or red. |
| **Error (Firestore unavailable)** | "Can't load history right now. Pull down to retry." Shows cached events if available. |
| **Offline** | Shows cached events with banner: "You're offline. History may not be current." |

**User Actions:**
- Scroll through history
- Tap event card to see detail (expands inline: shows max temperature, duration, whether buzzer fired, whether alert was acknowledged and by whom)
- Filter by event type
- Pull to refresh

**Navigation:**
- Entry: Bottom tab bar, or tap from Status screen
- No outbound navigation from individual events in MVP (no heat map to link to)

---

### Screen 4: Settings

**Purpose:** Let the caregiver configure the safety thresholds and verify the system is working.

**Key Elements:**

**Device section:**
- Device name (editable)
- Connection status (WiFi signal strength, cloud status)
- Device serial number
- "Test Buzzer" button -- sends MQTT command to chirp the on-device buzzer

**Alert Thresholds section:**
- Unattended stove timer: picker with options (15, 20, 30, 45, 60 minutes). Default: 30 min.
- Label: "Alert me if the stove is on for more than [X] minutes"

**Notifications section:**
- Push notifications toggle (ON/OFF)
- Warning below if turned off: "With notifications off, you will only hear the on-device buzzer. You will NOT receive alerts on your phone."

**Emergency Contact section (MVP stretch):**
- "Call" contact: name + phone number (used by "Call Mom" button on Status screen)
- This is a local-only setting, not shared with the device

**Account section:**
- Signed in as (email)
- Sign out

**States:**

| State | What User Sees |
|-------|----------------|
| **Normal** | All settings visible and editable. Device shows "Connected" with green indicator. |
| **Device Offline** | Device section shows "Offline" in red. "Test Buzzer" button disabled with explanation: "Device must be online to test buzzer." Timer threshold changes are queued: "Will apply when device reconnects." |
| **Saving** | Changed setting shows inline spinner briefly, then checkmark. Changes sync to Firestore immediately; device picks them up via MQTT subscription. |
| **Error saving** | "Couldn't save. Check your connection." Retry option. |
| **Test Buzzer in progress** | Button shows spinner. On success: "Buzzer chirped! Did you hear it?" with Yes/No. On timeout (5s): "No response from device. It may be offline." |

**User Actions:**
- Edit device name (inline text field)
- Change unattended timer threshold (picker/dropdown)
- Toggle push notifications on/off
- Tap "Test Buzzer"
- Set emergency call contact
- Sign out

**Navigation:**
- Entry: Gear icon on Status screen, or bottom tab
- Test Buzzer response doesn't navigate anywhere
- Sign out returns to onboarding/sign-in screen

---

## 2. Critical UX Issues (Top 5)

### Issue 1: The Offline Silence Problem

**Scenario:** The caregiver is 500 miles away. StoveIQ loses power (unplugged, breaker trip, power outage). The device goes silent. The stove could be on. The caregiver's app shows "Offline" but has no way to know whether the stove is on or off.

**Why this is critical:** The absence of information IS the emergency for a remote caregiver. "Offline" and "everything is fine" look almost identical if the offline indicator is subtle.

**Recommendation:**
- DEVICE_OFFLINE must generate a push notification within 3 minutes (based on missed heartbeats). This is already in the engineering spec.
- The push notification must be HIGH PRIORITY (wakes the phone from Doze).
- The Status screen offline state must be visually alarming -- not a subtle gray. Use a yellow/amber warning state, not just a text label.
- Add an "Offline for X minutes" escalation: after 10 minutes offline with no reconnection, send a second push with higher urgency: "StoveIQ has been offline for 10 minutes. Check the power supply or call [Parent Name]."
- The "Call Mom/Dad" button must be MORE prominent when the device is offline, not less. This is when the caregiver most needs it.

### Issue 2: First-Time Trust Gap

**Scenario:** The caregiver installs StoveIQ, provisions it, and sees "Stove is OFF." They have no evidence this is true. They have never seen it say "ON." They do not trust it.

**Why this is critical:** A safety device that isn't trusted is useless. The caregiver will keep calling their parent to check, defeating the product's purpose. Trust must be established in the first 24 hours or the app gets uninstalled.

**Recommendation:**
- After provisioning, prompt: "To verify StoveIQ is working, turn on a burner for 10 seconds." Show a waiting screen. When the device detects ON, celebrate: "StoveIQ detected your stove! Everything is working." This is the single most important moment in the entire user journey.
- The Test Buzzer in Settings serves a similar purpose but only proves the device is reachable, not that it can detect heat. The heat verification is the real trust moment.
- First ON event should generate a special notification: "StoveIQ detected the stove turning on for the first time. Monitoring is working."
- First OFF event after an ON should also notify: "Stove turned off after 3 minutes. StoveIQ is tracking everything."

### Issue 3: 3 AM Alert Panic

**Scenario:** Caregiver gets an UNATTENDED_CRITICAL push notification at 3 AM. They're groggy, disoriented, adrenaline spikes. They open the app. What do they DO? The stove is 500 miles away. They can't turn it off. They can't walk into the kitchen.

**Why this is critical:** The alert tells them there's a problem but gives them no actionable path. Panic without agency is the worst possible user experience for a safety product.

**Recommendation:**
- Every alert notification and the in-app alert overlay must present exactly two actions:
  1. **"Call [Parent Name]"** -- one tap to dial. This is the primary action for a remote caregiver.
  2. **"Acknowledge"** -- confirms the caregiver has seen the alert. Silences the on-device buzzer via MQTT. This gives them agency even from far away.
- Do NOT show "Still Cooking -- Snooze" to a remote caregiver. That option only makes sense for someone in the house. The MVP should detect whether the user is the device owner (local) or a caregiver (remote) and adjust the alert actions accordingly. If that's too complex for MVP, default to the remote caregiver flow -- it works for both cases.
- Add a third action in the expanded alert detail: "Call 911" or "Call emergency contact #2." For a caregiver who can't reach their parent, this is the next step.
- The alert must include context: "Dad's stove has been on for 62 minutes. The on-device alarm is sounding at 85dB." The caregiver needs to know the parent CAN hear the buzzer even if they can't.

### Issue 4: Notification Permission Failure

**Scenario:** During onboarding, the OS prompts for notification permission. The user taps "Don't Allow" (muscle memory -- most people deny notifications from new apps). StoveIQ is now a $90 paperweight for remote monitoring. The on-device buzzer still works locally, but the caregiver 500 miles away will never receive an alert.

**Why this is critical:** This is the single most likely point of total product failure. One wrong tap during setup silently disables the core value proposition.

**Recommendation:**
- DO NOT request notification permission during onboarding with the default OS dialog. Instead:
  1. Show a pre-permission screen BEFORE the OS prompt. Full-screen, with illustration, explaining exactly why notifications are critical: "StoveIQ needs to wake your phone to alert you if the stove is left on. Without notifications, you won't know."
  2. Use clear, safety-framed language: "This is how StoveIQ reaches you in an emergency."
  3. Then trigger the OS dialog. Acceptance rate will be dramatically higher.
- If the user denies permission: show a persistent but non-blocking banner on the Status screen: "Notifications are off. You won't receive stove alerts on this phone. [Turn On]" The "Turn On" button opens the OS settings page for the app.
- On iOS, apply for the Critical Alerts entitlement. Critical alerts bypass Do Not Disturb and silent mode. This is the correct capability for a safety device. Apple grants this for health and safety products.
- NEVER let the user forget they denied notifications. Check permission state on every app open and show the banner if denied.

### Issue 5: Threshold Confusion

**Scenario:** The caregiver sets the unattended timer to 15 minutes because they're anxious. Their parent cooks dinner normally for 20 minutes. The alert fires. The parent hears the buzzer. The parent is confused, annoyed, and unplugs the device.

**Why this is critical:** False positives destroy trust faster than missed alerts. If the parent (not the caregiver -- the parent living with the device) gets annoyed by false alarms, they will disable or unplug StoveIQ, and the caregiver loses all monitoring.

**Recommendation:**
- Default to 30 minutes. This is already in the engineering spec. Do not let users set it below 15 minutes.
- When the user adjusts the threshold, show context: "Most meals take 15-45 minutes. A 30-minute threshold catches forgotten stoves without interrupting normal cooking."
- Add a "Cooking patterns" insight after 1 week of data: "This week, the stove was used 8 times. Average duration: 28 minutes. Longest: 47 minutes. Your alert threshold of 30 minutes would have triggered during 2 sessions." This helps the caregiver calibrate.
- Provide guidance on the parent's experience: "When the timer expires, the on-device buzzer will sound at 85dB. If your parent is home and cooking normally, this will be disruptive. Set a threshold that allows for normal cooking."
- Consider a "Learning Mode" for the first week: alerts fire to the caregiver's phone but the buzzer does NOT sound. This lets the caregiver see the pattern before the system starts alarming the parent.

---

## 3. Trust Signals

### What Builds Trust

| Trust Signal | Where It Appears | Why It Works |
|---|---|---|
| **Live heartbeat timestamp** | Status screen, small text: "Last check-in: 38 seconds ago" | Proves the system is alive RIGHT NOW. Not 5 minutes ago, not "connected" -- an actual timestamp that updates. |
| **First-use verification** | Post-onboarding: "Turn on a burner to verify" | The user sees the system work with their own eyes. Nothing else comes close. |
| **Connection status honesty** | Status screen header pill | Never say "Connected" when the connection is stale. Show the truth: "Offline since 4:02 PM." Honest bad news builds more trust than optimistic lies. |
| **Alert history completeness** | Alert History screen | Every event logged, including boring ones (stove on at 6pm, off at 6:32pm). The mundane entries prove the system is always watching. |
| **Offline gap disclosure** | Alert History: "Offline 4:02-4:08 PM" | Admitting gaps proves integrity. If the user sees every minute accounted for, including offline gaps, they trust that non-gap periods are fully covered. |
| **Reconnect summary** | Alert History after offline period | "While offline, the stove was ON from 4:02-4:07 PM. No alerts were missed." This resolves the anxiety that offline = unmonitored. The device was still watching locally. |
| **Test Buzzer confirmation** | Settings screen | Physical proof: "I pressed a button, and the thing in Mom's kitchen made a noise." Tangible verification across 500 miles. |
| **"Call Mom" always visible** | Status screen, alert overlay | The system acknowledges its own limitation: it can watch, but it can't act. The call button says "we know you might need to reach them." |
| **Notification permission status** | Status screen banner when denied | The system tells you when it CAN'T protect you. This honesty is a trust signal. |

### What Erodes Trust

| Trust Erosion | Where It Happens | Why It's Destructive |
|---|---|---|
| **Stale "Connected" status** | Status screen showing "Connected" when heartbeat is >5 min old | The user finds out the system was lying when a real event gets missed. Game over. |
| **Silent offline transitions** | No push notification when device goes offline | The caregiver opens the app hours later, sees "Offline since 2 PM." "Why didn't you TELL me?" |
| **Missing history entries** | Gaps in alert history with no explanation | The user wonders: "Was the stove on during that gap? Did the system miss it?" |
| **False positives** | Buzzer fires during normal cooking | The parent unplugs the device. Trust destroyed for both the parent AND the caregiver. |
| **Vague error messages** | "Something went wrong" instead of specific errors | The user cannot diagnose the problem and assumes the system is unreliable. |
| **Push notification that doesn't open to relevant screen** | Tap notification, land on wrong screen or loading state | Urgency created and then frustrated by friction. |
| **Test Buzzer with no feedback** | User taps Test Buzzer, nothing visible happens, no confirmation | "Did it work? Is this thing even connected?" |
| **Empty history on day 2** | No events logged despite stove being used | The caregiver suspects the system isn't working (even if it is -- maybe there were just no alerts). Log ALL events, not just alerts. |

---

## 4. Empty States & First-Time Experience

### Status Screen -- First Launch (Post-Provisioning)

The user just finished connecting StoveIQ. The stove is off. There is nothing to show. This is the most dangerous empty state because it can feel like the product is broken.

**Design:**
- Large illustration: a StoveIQ device perched above a stove, with a subtle green glow (monitoring)
- Headline: "StoveIQ is watching."
- Subtext: "When the stove turns on, you'll see it here instantly."
- Prominent CTA: "Verify it works -- turn on a burner for 10 seconds"
- Below the CTA, a reassurance line: "The on-device buzzer is active even before your first test."

**Do NOT show:**
- A blank screen with just "Stove is OFF" -- this is indistinguishable from a broken state
- A loading spinner that never resolves
- Technical jargon ("Firestore listener active", "MQTT connected")

### Alert History -- Empty

No alerts and no stove events have been recorded yet.

**Design:**
- Illustration: a shield with a checkmark, or a calm kitchen scene
- Headline: "All quiet."
- Subtext: "Stove events and alerts will appear here as they happen. StoveIQ is monitoring."
- Optional helper text: "Try turning on a burner to see your first event appear."

**Do NOT show:**
- A blank white/dark screen
- "No data" or "No alerts"
- A loading spinner

### Settings -- First Launch

Settings are pre-populated with sensible defaults. There is no truly "empty" state. But the user needs orientation.

**Design:**
- Unattended timer shows default: 30 minutes, with a brief explanation: "You'll be alerted if the stove is on this long."
- Push notifications toggle is ON by default. If notification permissions are denied, the toggle shows ON but a warning banner appears: "Notifications are blocked by your phone. [Fix This]"
- Test Buzzer button is prominent with helper text: "Tap to make StoveIQ chirp in [Mom's Kitchen]. This confirms the device is connected."
- Emergency contact shows "Not set" with a prompt: "Add a phone number so you can call with one tap from the alert screen."

### Onboarding -- No Device Found

The user opened the app, Bluetooth is scanning, and nothing shows up. This is a high-anxiety moment.

**Design:**
- Animated scanning visualization (radar ring or pulsing circles) -- shows the app is actively looking
- Headline: "Looking for StoveIQ..."
- After 10 seconds with no results, add troubleshooting tips one at a time (not all at once):
  1. "Is StoveIQ plugged in? The LED should be blue."
  2. "Move closer to the device -- within 10 feet works best."
  3. "Try unplugging StoveIQ and plugging it back in."
- After 30 seconds: "Still can't find it? [Contact Support]"

**Do NOT show:**
- An empty list immediately
- "0 devices found"
- A static screen with no indication of activity

---

## 5. Notification Design

### STOVE_ON

| Field | Value |
|---|---|
| **Title** | Stove turned on |
| **Body** | [Device Name]: The stove turned on at 2:14 PM. |
| **Priority** | Normal |
| **Sound** | Default system sound |
| **Vibration** | Default |
| **Action Buttons** | None |
| **Tap Opens** | Status screen |
| **Notes** | This is informational, not urgent. The caregiver wants to know, but it's not an emergency. Frequency concern: if the parent cooks 3x/day, this fires 3x/day. Consider making this configurable (on by default, can be turned off separately from safety alerts). |

### UNATTENDED_WARNING

| Field | Value |
|---|---|
| **Title** | Stove left on -- 30 minutes |
| **Body** | [Device Name]: The stove has been on for 30 minutes. The on-device alarm has NOT sounded yet. |
| **Priority** | HIGH (breaks through Doze on Android, appears on lock screen) |
| **Sound** | Custom alert tone -- distinct from all other app notifications. Two-tone ascending chime. Not a default ding. |
| **Vibration** | Three firm pulses |
| **Action Buttons** | "Call [Parent Name]" / "Open App" |
| **Tap Opens** | Status screen with warning state |
| **Notes** | This is the early warning. The caregiver has time to act before the buzzer fires. The body text explicitly says the buzzer hasn't sounded -- this reassures the caregiver that the parent hasn't been startled yet and gives them time to call first. |

### UNATTENDED_CRITICAL

| Field | Value |
|---|---|
| **Title** | STOVE ALERT -- [Device Name] |
| **Body** | Stove has been on for 62 minutes. On-device alarm is sounding (85dB). Call [Parent Name] now. |
| **Priority** | CRITICAL (iOS Critical Alert if entitlement approved; Android IMPORTANCE_HIGH with full-screen intent) |
| **Sound** | Urgent alarm tone -- loud, continuous for 3 seconds, distinct from any system sound. On iOS with Critical Alert entitlement, this plays even in silent/DND mode. |
| **Vibration** | Continuous vibration for 3 seconds |
| **Action Buttons** | "Call [Parent Name]" / "Acknowledge" |
| **Tap Opens** | Full-screen alert overlay on Status screen |
| **Notes** | This is the emergency notification. Design it like a fire alarm, not like a text message. On Android, use a full-screen intent so it takes over even the lock screen. The body text tells the caregiver the buzzer IS sounding -- the parent should be able to hear it. Include the "Call" action so the caregiver doesn't even need to open the app. |

### STOVE_OFF

| Field | Value |
|---|---|
| **Title** | Stove turned off |
| **Body** | [Device Name]: Stove turned off after 33 minutes. All clear. |
| **Priority** | Normal |
| **Sound** | Gentle, short chime (different from ON notification) |
| **Vibration** | Single light tap |
| **Action Buttons** | None |
| **Tap Opens** | Status screen |
| **Notes** | This is the relief notification. It resolves anxiety. If the caregiver got a WARNING or CRITICAL notification earlier, this OFF notification is the resolution. The body should explicitly say "All clear" to close the emotional loop. If there was a prior unacknowledged warning, append: "The earlier alert has been automatically resolved." |

### DEVICE_OFFLINE

| Field | Value |
|---|---|
| **Title** | StoveIQ offline -- [Device Name] |
| **Body** | StoveIQ hasn't checked in for 3 minutes. It may have lost power or WiFi. The on-device alarm still works if the stove is on. |
| **Priority** | HIGH |
| **Sound** | Two-tone descending chime (distinct from alert notifications -- this is a system health issue, not a stove issue) |
| **Vibration** | Two firm pulses |
| **Action Buttons** | "Call [Parent Name]" |
| **Tap Opens** | Status screen in offline state |
| **Notes** | The body text is carefully worded: it acknowledges the problem, names possible causes (not scary ones -- "power or WiFi", not "hardware failure"), and reassures that local safety still works. The "Call" action is included because if the caregiver can't remotely verify anything, calling is their only option. If the device comes back online within 2 minutes, suppress this notification (debounce short WiFi blips). |

### DEVICE_BACK_ONLINE (Supplemental)

| Field | Value |
|---|---|
| **Title** | StoveIQ reconnected |
| **Body** | [Device Name] is back online after 6 minutes. During the gap: stove was off the entire time. No events missed. |
| **Priority** | Normal |
| **Sound** | Gentle positive chime |
| **Vibration** | Single light tap |
| **Action Buttons** | None |
| **Tap Opens** | Status screen |
| **Notes** | This resolves the DEVICE_OFFLINE notification. The reconnect summary from NVS is critical here -- it tells the caregiver whether anything happened during the gap. If the stove WAS on during the gap, the body changes to: "During the gap: stove was ON from 4:02-4:07 PM. No alerts were missed -- the on-device alarm was active." |

---

## 6. Accessibility & Readability

### The 3 AM Design Test

Every design decision must pass this test: a 55-year-old caregiver, woken from sleep by their phone at 3 AM, without reading glasses, picks up their phone. Can they understand what is happening and what to do in under 5 seconds?

### Typography

- **Stove status text:** Minimum 32sp. "Stove is ON" must be readable from arm's length without glasses.
- **Duration counter:** Minimum 24sp. "47 minutes" must be immediately legible.
- **Alert notification title:** Minimum 20sp on the alert overlay. "STOVE ALERT" cannot be small.
- **Body text (history, settings descriptions):** Minimum 16sp. Never use 12sp or 14sp for anything the user needs to read.
- **Use system Dynamic Type / font scaling on iOS and Android.** Do not cap the maximum font size. If the user has set their phone to "Extra Large" text, honor it.
- **Font weight matters as much as size.** Status labels (ON/OFF) should be bold/semibold. Body text can be regular weight.

### Color and Contrast

- **Mandatory dark mode.** The full UX spec correctly identifies dark mode as mandatory, not optional. A bright white screen at 3 AM is hostile.
- **WCAG AA minimum contrast ratios everywhere.** But for safety-critical elements (status text, alert labels), target AAA (7:1).
- **Do not rely on color alone.** The ON/OFF status must be conveyed through icon shape, text, and color. A red flame + "Stove is ON" + pulsing animation is three redundant channels. Good.
- **Alert states must have distinct shapes, not just colors.** Shield for OFF, flame for ON, triangle for warning, octagon or exclamation for critical. A color-blind user must be able to distinguish all four states by shape alone.
- **Connection status:** Green/yellow/red dots are not enough. Use "Connected" / "Cloud" / "Offline" text labels alongside the dots.

### Touch Targets

- **Minimum 48x48dp for all interactive elements.** This is Android's recommendation and a reasonable iOS baseline.
- **Alert action buttons: 64dp height minimum, full screen width.** These are pressed in panic. Oversized is correct.
- **"Call Mom/Dad" button: 56dp height minimum.** This button will be pressed with shaking hands. Make it impossible to miss.
- **Settings toggles and pickers: 48dp row height minimum.** Standard, but enforce it.

### Motion and Animation

- **Respect "Reduce Motion" system setting.** Replace pulsing flame animations with static icons. Replace alert overlay transitions with instant appearance.
- **Pulsing animations should be slow (1-2 second cycle), not rapid.** Fast pulsing triggers anxiety. Slow pulsing conveys urgency without panic.
- **No flashing content.** Period. No element should flash more than 3 times per second. This is both an accessibility requirement and a seizure safety requirement.

### Screen Reader Support

- **Status screen:** "Stove is off. Last used today at 2:14 PM for 23 minutes. Device is connected. Last check-in 38 seconds ago."
- **Alert overlay:** "Critical alert. Stove has been on for 62 minutes. On-device alarm is sounding. Button: Call Dad. Button: Acknowledge alert."
- **Alert history entries:** "Today at 2:14 PM. Stove turned on. Duration: 33 minutes. No alerts triggered."
- **Every interactive element must have a meaningful accessibility label.** Never label a button just "Button" or an icon just "Image."

### Haptics

- **Haptics are a primary communication channel, not a nice-to-have.** A caregiver whose phone is in their pocket needs to distinguish "stove on" (single tap) from "unattended warning" (three pulses) from "critical alert" (continuous buzz) by feel alone.
- **Define a haptic vocabulary and stick to it:**
  - Single light tap: informational (stove on/off, device reconnected)
  - Three firm pulses: warning (unattended threshold, device offline)
  - Continuous 3-second buzz: critical (unattended critical)

---

## 7. Wireframe Descriptions

### Screen 1: Onboarding / BLE Provisioning

**Layout (top to bottom):**

1. **Status bar** (system) -- standard OS status bar
2. **Step indicator** -- horizontal progress: "Step 2 of 3" with filled/unfilled dots. Sits at the very top below the status bar. No back button during WiFi provisioning (intentional: prevents partial states).
3. **Hero illustration area** (top 40% of screen) -- large illustration of the StoveIQ device. During BLE scan, this shows the device with a pulsing blue LED and animated scan rings emanating from the phone toward the device. During WiFi setup, this shows the device with WiFi waves connecting to a router. The illustration is not decorative -- it tells the user what's physically happening.
4. **Instructional headline** (below illustration) -- large text, 24sp, centered. "Plug in your StoveIQ" or "Select your WiFi network." One sentence. No paragraphs.
5. **Instructional subtext** -- 16sp, centered, secondary color. One line of context: "The LED should glow blue" or "StoveIQ uses 2.4GHz WiFi only."
6. **Interactive area** (middle of screen) -- this changes per step:
   - **BLE scan step:** Discovered device card with tap target. Card shows device name, signal strength icon, and "Tap to connect."
   - **WiFi step:** Network list (scrollable if needed). Each row is a full-width card with network name and signal strength bars. Tapping a network slides in the password entry view.
   - **Password step:** Single text field (WiFi password) with show/hide eye toggle. Large "Connect" button below.
   - **Connecting step:** Animated checklist: "Connecting to WiFi... Getting IP address... Reaching cloud..." Each item gets a spinner, then a checkmark.
7. **Primary action button** (bottom, pinned above safe area) -- full-width pill button. "Search for Device" / "Connect" / "Continue." Button is disabled until a valid action is available (e.g., disabled until device is selected, disabled until password is entered).
8. **Helper link** (below button) -- "Don't see your device? Troubleshoot" or "Need help?"

**Why this layout:** The illustration-heavy top section makes this feel approachable, not technical. The interactive area is in the thumb zone. The single primary action at the bottom means there's never confusion about what to do next. No sidebar, no hamburger menu, no tabs -- this is a linear tunnel.

---

### Screen 2: Status Screen

**Layout (top to bottom):**

1. **App bar** -- Device name on the left ("Mom's Kitchen"). Gear icon (Settings) on the right. Connection status pill between them: green "Connected", yellow "Cloud", or red "Offline 3m."
2. **Hero status area** (top 50% of screen) -- this is the centerpiece. A large circular area (200dp diameter) containing the status icon:
   - **OFF:** Green shield icon with checkmark. Background: very subtle dark green radial gradient.
   - **ON:** Amber/red flame icon, gently pulsing (2s cycle). Background: subtle warm amber radial gradient.
   - **Critical:** Red flame, faster pulse. Background: deep red gradient. Entire hero area has a subtle red border glow.
3. **Status text** (centered below the icon, inside the hero area) -- "Stove is OFF" or "Stove is ON" in 32sp bold. Below that, in 20sp regular: "Last used: Today at 2:14 PM" (when OFF) or "47 minutes" with a live-counting seconds indicator (when ON).
4. **Heartbeat line** -- small text, 14sp, secondary color, below the hero area: "Last check-in: 38 seconds ago." This updates every ~10 seconds. It's subtle but present for users who need reassurance.
5. **Call button** -- full-width, 56dp tall, prominent but not primary-colored. "Call Dad" with a phone icon. Always visible. When the stove is ON or in alert state, this button becomes primary-colored (filled) instead of outlined.
6. **Quick stats row** -- horizontal card row below the call button:
   - "Today: 2 uses, 47 min total"
   - "This week: 12 uses"
   - This gives context without needing to visit Alert History.
7. **Bottom navigation** -- two items for MVP: "Status" (home icon, selected) and "History" (clock icon). Settings is accessed via the gear icon in the app bar, not a tab. Two tabs, not five -- the MVP doesn't need five.

**Why this layout:** The giant status icon answers "is the stove on?" from across the room. The duration answers "how long?" The call button answers "what do I do?" Everything above the fold. History and settings are secondary actions, pushed to edges.

---

### Screen 3: Alert History

**Layout (top to bottom):**

1. **App bar** -- "Activity" as the title. No back button (this is a top-level tab). Filter icon on the right.
2. **Filter chips** (horizontal scroll, below app bar) -- "All" (selected by default), "Alerts Only", "Stove Events." These are small pill-shaped toggles.
3. **Active alert banner** (conditional, pinned below filters) -- if there is an active unattended alert right now, a red banner sits at the top of the list: "ACTIVE: Stove on for 47 minutes" with a "View" button that opens the Status screen. This banner does not scroll away.
4. **Date section headers** -- "Today", "Yesterday", "March 25" in 14sp caps, secondary color. Sticky headers that pin to the top while scrolling.
5. **Event cards** (the list) -- each card is a row with:
   - **Left edge:** 4dp colored bar (green for normal, amber for warning, red for critical, gray for offline/reconnect)
   - **Left icon:** Status-appropriate icon (green dot, amber triangle, red exclamation, gray circle-slash)
   - **Primary text:** "Stove turned on" or "Unattended -- 30 min warning" in 16sp
   - **Secondary text:** "2:14 PM -- 33 minutes" in 14sp, secondary color
   - **Right indicator:** Chevron for expandable cards (alerts expand to show detail)
   - **Card height:** Minimum 72dp for comfortable tapping
6. **Expanded card detail** (when tapped) -- slides open below the card:
   - Max temperature recorded
   - Duration
   - Whether buzzer fired
   - Whether alert was acknowledged (and by whom, if multi-user)
   - "All clear at 2:47 PM" resolution text
7. **Bottom navigation** -- same two-tab bar as Status screen. "History" tab is selected here.

**Why this layout:** Reverse-chronological list is the most intuitive pattern for event logs. Color-coded left borders give a visual "vitals" scan -- the caregiver can scroll and see "green, green, green, amber, green" and immediately understand the week. The filter chips let anxious caregivers hide the boring events and see only alerts, which is the most common use after the first week.

---

### Screen 4: Settings

**Layout (top to bottom):**

1. **App bar** -- "Settings" title. Back arrow returns to Status screen (if navigated from gear icon) or nothing (if this were a tab -- but in MVP, it's accessed from the gear icon, not a tab).
2. **Device section header** -- "MY DEVICE" in 12sp caps, secondary color.
3. **Device info card** -- rounded card containing:
   - Device name ("Mom's Kitchen") with edit (pencil) icon
   - Connection status: "Connected" green dot or "Offline" red dot
   - Serial: SQ-A3F2 (small, secondary text)
4. **Test Buzzer button** -- full-width, outlined/secondary style, within the device card or just below it. "Test Buzzer" with a speaker icon. Below the button in 14sp: "Chirps the buzzer in Mom's Kitchen to confirm connection."
5. **Section divider**
6. **Alert Thresholds section header** -- "SAFETY ALERTS" in 12sp caps.
7. **Unattended timer row** -- label on left: "Alert if stove is on for more than". Value on right: "30 min" in a tappable dropdown/picker. Tapping opens a bottom sheet with options: 15, 20, 30, 45, 60 minutes. Below the row, helper text in 14sp: "The on-device buzzer sounds 30 minutes after this threshold."
8. **Section divider**
9. **Notifications section header** -- "NOTIFICATIONS"
10. **Push notifications row** -- label on left: "Push notifications". Toggle on right: ON/OFF. When toggled OFF, a red warning card appears below: "You will NOT receive stove alerts on this phone. Only the on-device buzzer will sound."
11. **Stove on/off events row** -- label: "Notify when stove turns on/off". Toggle. This lets the caregiver disable the informational notifications while keeping safety alerts.
12. **Section divider**
13. **Contact section** -- "QUICK CALL"
14. **Contact row** -- "[Parent Name]" with phone number. Edit icon. "Used by the Call button on the home screen."
15. **Section divider**
16. **Account section** -- "ACCOUNT"
17. **Account row** -- email address shown, "Sign Out" as a destructive-styled text button.

**Why this layout:** Grouped sections with clear headers follow the iOS Settings pattern that the target demographic (40-65, iPhone users) already knows. The Test Buzzer is placed in the device section because it's a device operation, but it's visually prominent because it's the most-used setting (for trust building). The notification toggle warning is aggressive on purpose -- turning off notifications on a safety device should feel serious.

---

## Summary of Recommendations

**Must-haves for MVP launch:**

1. Post-provisioning heat verification step ("Turn on a burner to verify")
2. Pre-permission screen before iOS/Android notification dialog
3. Persistent notification-denied banner on Status screen
4. "Call [Parent Name]" as a primary action on every alert notification and overlay
5. DEVICE_OFFLINE push notification within 3 minutes of missed heartbeats
6. Honest connection status -- never show "Connected" with a stale heartbeat
7. Reconnect summaries in Alert History with NVS data
8. Dark mode only (no light mode in MVP)
9. Minimum 32sp for status text, 64dp for alert action buttons
10. iOS Critical Alert entitlement application

**Should-haves (add in first update):**

1. "Learning Mode" first week (alerts to phone, buzzer suppressed)
2. Cooking pattern insights to help calibrate threshold
3. Configurable STOVE_ON/OFF informational notification toggle
4. DEVICE_OFFLINE escalation (second notification at 10 minutes)
5. DEVICE_BACK_ONLINE with reconnect summary push notification
