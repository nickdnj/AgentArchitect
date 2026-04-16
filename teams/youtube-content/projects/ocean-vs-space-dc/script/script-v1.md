# Video Script: Why Are We Building Data Centers in Space?

**Version:** 1.0
**Date:** 2026-04-15
**Target:** Documentary, 13-14 minutes
**Narration voice:** ElevenLabs Josh
**Word count target:** ~2,000 words (~150 wpm)
**Chapters:** 7
**Scenes:** 28

---

# Chapter 1: The Hook

## [SCENE 1: Cold Open — 0:00-0:15]

[VISUAL: Slow orbital shot of Earth from space. Dawn light creeps across the Pacific Ocean. Camera drifts downward toward the blue surface.]
[MUSIC: Low electronic hum, building tension]

NARRATION:
"In December 2025, a startup called Starcloud put a single NVIDIA H100 GPU into orbit. Sixty kilograms. One chip. They trained a small language model on it, and investors responded with a hundred and seventy million dollars and a billion-dollar valuation."

[TEXT OVERLAY: "$170M raised. 1 GPU in orbit."]

[TRANSITION: Hard cut to black, 0.5s]

---

## [SCENE 2: The Question — 0:15-0:30]

[VISUAL: Dark screen. Text types itself on screen in clean white monospace font, one line at a time.]
[TEXT OVERLAY: Line 1: "88,000 satellites." Line 2: "Filed with the FCC." Line 3: "February 2026."]

NARRATION:
"Two months later, they filed with the FCC to build a constellation of eighty-eight thousand satellites. That would be nearly nine times the size of Starlink. Not for internet. For computing."

[PAUSE: 1s]

[TRANSITION: Crossfade, 1s]

---

## [SCENE 3: Title Card — 0:30-0:40]

[VISUAL: Cinematic split — left half shows a satellite glinting in orbit against black space, right half shows an offshore wind turbine rising from dark ocean water. A thin white dividing line separates them.]
[TEXT OVERLAY: "WHY ARE WE BUILDING DATA CENTERS IN SPACE?" — large, clean sans-serif, centered]
[MUSIC: Title theme hit, then settle into background track]

[TRANSITION: Crossfade, 1s]

---

# Chapter 2: The Space Pitch

## [SCENE 4: The VC Narrative — 0:40-1:25]

[VISUAL: Sleek rendering of a satellite array in orbit, solar panels extended, Earth below. Clean, aspirational — the way a pitch deck would show it.]

NARRATION:
"To be fair, the pitch is compelling. In orbit, solar panels generate roughly five times more energy than on the ground — no clouds, no night cycle in a sun-synchronous orbit, no atmosphere to filter the light. Radiative cooling to the vacuum of space means you never need water for cooling. And you never have to negotiate with a county planning board for a building permit."

[VISUAL: Animated graphic showing solar efficiency comparison: ground vs. orbit, 5x multiplier]
[TEXT OVERLAY: "Solar: 5x more efficient in orbit"]

[TRANSITION: Crossfade, 1s]

---

## [SCENE 5: The Players — 1:25-2:10]

[VISUAL: Clean company logo cards appearing one at a time against dark background, with key stats beside each]

NARRATION:
"The money is real. Starcloud, backed by Benchmark and EQT, has raised two hundred million and is building its second satellite for October launch. Orbital, funded by Andreessen Horowitz just this month, is targeting an April 2027 test flight with NVIDIA GPUs. Thales, the European defense giant, has a concept design for a ten-megawatt orbital data center — but their target date is 2036. And Google and NVIDIA have run exploratory joint tests."

[TEXT OVERLAY: Company cards with funding amounts:
"Starcloud — $200M raised, $1.1B valuation"
"Orbital (a16z) — Seed, April 2027 test"
"Thales — Concept design, 2036 target"
"Google/NVIDIA — Exploratory"]

[TRANSITION: Crossfade, 1s]

---

## [SCENE 6: The Ambition — 2:10-2:35]

[VISUAL: Artist rendering of a massive orbital data center — solar arrays spanning hundreds of meters, glowing blue LEDs on server modules against the blackness of space. Aspirational and grand.]

NARRATION:
"The long-term vision goes even further. Some proponents invoke the Dyson sphere — the theoretical structure that captures all energy from a star. Space data centers, they argue, are the first step toward that future."

[PAUSE: 0.5s]

"It is a beautiful idea. But there is a problem."

[TRANSITION: Hard cut to black, 0.5s]

---

# Chapter 3: The Math That Kills It

## [SCENE 7: The Cost Bomb — 2:35-3:20]

[VISUAL: Clean data visualization. Two columns building upward like a bar chart. Left column labeled "Space" in red, right column labeled "Ocean" in blue. Numbers animate in.]

NARRATION:
"A ten-megawatt data center in orbit — roughly enough to run a mid-size AI training cluster — would cost between one point six and eleven billion dollars in capital alone. Its operational lifespan? Two to five years. There is no maintenance. When a component fails, the entire satellite is a write-off. You cannot send a technician to low Earth orbit."

[TEXT OVERLAY: Animated stats:
"10MW Space DC: $1.6-11B capital"
"Lifespan: 2-5 years"
"Maintenance: impossible"]

[TRANSITION: Crossfade, 0.5s]

---

## [SCENE 8: The Ocean Alternative — 3:20-3:55]

[VISUAL: Same data visualization format. The blue "Ocean" column now fills in with dramatically lower numbers.]

NARRATION:
"A ten-megawatt ocean-based data center — floating on an offshore wind platform or housed inside a repurposed oil rig — costs between a hundred and sixty and five hundred thirty million dollars. It lasts twenty-five to thirty years. And when something breaks, you dispatch a remotely operated vehicle. An ROV. Thirty thousand dollars a day to rent. They already exist by the thousands."

[TEXT OVERLAY: Animated stats:
"10MW Ocean DC: $160-530M capital"
"Lifespan: 25-30 years"
"Maintenance: ROV, $30K/day"]

[TRANSITION: Crossfade, 0.5s]

---

## [SCENE 9: Twenty-Five Year Math — 3:55-4:25]

[VISUAL: Full-screen animated cost comparison chart. Timeline running left to right — 0 to 25 years. Space line rockets upward with replacement cycles every 3-5 years. Ocean line stays relatively flat after initial build.]

NARRATION:
"Over twenty-five years, the total cost of ownership for a ten-megawatt space data center exceeds twenty-five billion dollars. Replacements, launches, orbital decay, insurance — if you can even get it. The same capacity in the ocean? Three to four billion, total. And that includes the platform, the power, the cooling, the maintenance, everything."

[TEXT OVERLAY: "25-year TCO: Space $25B+ vs. Ocean $3-4B"]

[TRANSITION: Crossfade, 1s]

---

## [SCENE 10: The Latency Problem — 4:25-4:55]

[VISUAL: Animated diagram showing signal path. Space path arcs up 600km to LEO and back with "20-50ms" label. Ocean path runs 130km along seafloor cable with "+0.65ms" label.]

NARRATION:
"And then there is latency. A data center in low Earth orbit adds twenty to fifty milliseconds of round-trip delay. For AI inference — the workload that actually makes money, the one that answers your questions and generates your images in real time — that delay is a dealbreaker. An ocean data center a hundred and thirty kilometers offshore? Zero point six five milliseconds. Effectively invisible."

[TEXT OVERLAY: "Latency: Space 20-50ms vs. Ocean +0.65ms"]

[TRANSITION: Crossfade, 1s]

---

# Chapter 4: The Ocean Is Already Working

## [SCENE 11: The Natick Story — 4:55-5:50]

[VISUAL: Real footage or detailed rendering of Microsoft's Project Natick capsule — the white cylindrical pod being lowered into the ocean off Scotland's Orkney Islands. Underwater shot of the capsule on the seafloor, cables trailing upward.]

NARRATION:
"In 2018, Microsoft sank eight hundred and sixty-four servers to the bottom of the ocean off Scotland. Project Natick. They sealed them in a nitrogen-filled capsule, dropped it thirty-five meters down, and left it there for two years."

[PAUSE: 0.5s]

"The results were remarkable. The failure rate was eight times lower than an equivalent land-based data center. Eight times. The cold, stable temperature of the deep ocean and the absence of human intervention — no one opening doors, no dust, no humidity fluctuations — made the servers dramatically more reliable."

[TEXT OVERLAY: "Project Natick: 864 servers, 35m deep, 2 years"]
[TEXT OVERLAY: "8x lower failure rate than land"]
[TEXT OVERLAY: "PUE: 1.07"]

[TRANSITION: Crossfade, 1s]

---

## [SCENE 12: The Natick Pivot — 5:50-6:15]

[VISUAL: The Natick capsule being lifted from the ocean, dripping water, barnacles on the hull. Transition to a Microsoft Azure data center campus on land — massive, industrial, power-hungry.]

NARRATION:
"Microsoft cancelled Natick in 2024. Not because it failed — it was one of the most successful infrastructure experiments of the decade. They cancelled it because the economics of cloud computing changed. Microsoft needed hyperscale campus capacity for AI, and Natick's pod model did not fit their new strategy. The technology was proven. The business case just pointed somewhere else."

"But other companies were paying attention."

[TRANSITION: Crossfade, 1s]

---

## [SCENE 13: The Companies That Are Doing It — 6:15-7:20]

[VISUAL: World map with glowing dots appearing at each location as companies are named. Lines connecting offshore sites to nearby cities. Each dot pulses with a company name label.]

NARRATION:
"In Hainan, China, Highlander has deployed the world's first commercial underwater data center. It is operational right now — twelve hundred servers in sealed capsules on the seafloor, with plans for a hundred capsules. They have connected a separate facility near Shanghai directly to an offshore wind farm. The first wind-powered underwater data center on Earth."

[VISUAL: Map dot lights up at Hainan, then Shanghai]

"In the North Sea, Aikido Technologies is deploying a prototype this year — a floating wind platform with a data center built into the ballast tanks underneath. NVIDIA is a partner. Their commercial launch targets the UK in 2028. Their projected PUE? One point zero eight."

[VISUAL: Map dot at Norway/North Sea]

"In California, Nautilus Data Technologies built a seven-megawatt floating data center in Stockton — a barge that uses river water for cooling. Eighty-six percent occupied."

[VISUAL: Map dot at Stockton, CA]

"In the Gulf of Mexico, Hyperscale Data ran a data center on a repurposed oil platform from November 2024 through February 2025 — proving the concept with existing infrastructure."

[VISUAL: Map dot at Gulf of Mexico]

[TEXT OVERLAY: "Operational ocean data centers: China, California, Gulf of Mexico, Norway"]

[TRANSITION: Crossfade, 1s]

---

## [SCENE 14: Underwater Pods — 7:20-7:50]

[VISUAL: Rendering of sleek underwater data center capsules on the ocean floor — cylindrical pods with blinking lights, cables running between them, fish swimming past. Moody blue-green lighting.]

NARRATION:
"Below the surface, NetworkOcean — a Y Combinator startup — is testing a one-megawatt underwater capsule in San Francisco Bay. Subsea Cloud has projects in Washington State, the Gulf of Mexico, and the North Sea. These are not concepts. They are in the water."

[TEXT OVERLAY: "NetworkOcean — YC W24, SF Bay test"
"Subsea Cloud — WA, Gulf of Mexico, North Sea"]

[TRANSITION: Crossfade, 1s]

---

# Chapter 5: The Infrastructure Is Already There

## [SCENE 15: The Cable Map — 7:50-8:25]

[VISUAL: Animated submarine cable map — the real one. Thousands of lines crisscrossing every ocean, glowing like a neural network. Camera slowly zooms in on a dense node near New York or London.]

NARRATION:
"Here is something most people do not realize. Ninety-nine percent of all international internet traffic already travels through the ocean. One point five million kilometers of submarine fiber-optic cable sit on the seafloor right now. The backbone of the internet is not in the cloud. It is underwater. An ocean data center does not need a new network. It plugs into the one that already exists."

[TEXT OVERLAY: "1.5 million km of submarine cable"]
[TEXT OVERLAY: "99% of international data traffic"]

[TRANSITION: Crossfade, 1s]

---

## [SCENE 16: The Platform Problem — 8:25-9:15]

[VISUAL: Aerial shot of an aging offshore oil platform in the North Sea — rusting steel, gas flare burning, grey sky. Then transition to a graphic showing the cost of demolition versus repurposing.]

NARRATION:
"There are twelve thousand offshore oil and gas platforms in the world. Many are approaching end of life. And here is the absurdity: governments are about to spend staggering amounts of money to destroy them. The UK alone has budgeted forty-four billion pounds — fifty-six billion dollars — to decommission its North Sea platforms. The Gulf of Mexico faces forty to seventy billion in demolition costs."

"Every one of those platforms already has gas turbines for power, cranes for lifting equipment, helipads for access, and seawater intakes for cooling. Everything a data center needs. We are paying to demolish ready-made data center sites while investing in orbital ones."

[TEXT OVERLAY: "UK decommissioning: $56 billion"
"Gulf of Mexico: $40-70 billion"
"12,000 platforms globally"]

[TRANSITION: Crossfade, 1s]

---

## [SCENE 17: The Flare Gas Play — 9:15-9:50]

[VISUAL: Nighttime satellite image of gas flares burning across the Gulf of Mexico and North Africa — bright orange dots scattered across dark landscape. Then transition to Crusoe Energy's modular data center units on a wellpad.]

NARRATION:
"Right now, the global oil industry flares a hundred and fifty-one billion cubic meters of natural gas every year. Just burns it. Wasted. That is enough energy to power every data center in the United States. Crusoe Energy proved the model on land — they put data centers next to wellheads, captured the flared gas, converted it to electricity, and used it to run AI workloads. Sixty-three percent CO2 reduction versus just letting it burn. They have deployed over two hundred fifty megawatts and are now worth billions."

[TEXT OVERLAY: "151 BCM flared annually = enough to power every US data center"]
[TEXT OVERLAY: "Crusoe: 63% CO2 reduction, 250+ MW deployed"]

[TRANSITION: Crossfade, 1s]

---

## [SCENE 18: Offshore Wind Scale — 9:50-10:15]

[VISUAL: Sweeping aerial shot of a massive offshore wind farm — dozens of turbines stretching to the horizon, ocean spray, dramatic sky. Scale is the message.]

NARRATION:
"And offshore wind is no longer experimental. Eighty-four point five gigawatts of capacity is installed worldwide today. That is nearly enough to power every data center on Earth. The energy is already being generated. It just needs somewhere to go."

[TEXT OVERLAY: "84.5 GW offshore wind installed globally"]

[TRANSITION: Crossfade, 1s]

---

# Chapter 6: The Environmental Case

## [SCENE 19: The Water Crisis — 10:15-10:55]

[VISUAL: Split screen. Left: aerial shot of a massive land-based data center in a desert or arid landscape — Phoenix, maybe, with cooling towers steaming. Right: drone shot of a reservoir or river at visibly low water levels.]

NARRATION:
"Land-based data centers have a water problem that is getting worse every year. In 2023, US data centers consumed an estimated sixty-six billion liters of water directly — and eight hundred billion liters indirectly through electricity generation. Google alone used eight point one billion gallons. Two-thirds of new data center construction is happening in water-stressed regions. The AI boom is draining aquifers."

[PAUSE: 0.5s]

"An ocean data center uses zero freshwater. The ocean is the heat sink. Cold seawater flows through heat exchangers and returns to the sea a few degrees warmer. No evaporative cooling towers. No municipal water draw. No competing with farms and families for a resource that is running out."

[TEXT OVERLAY: "US DCs: 66 billion liters direct water use (2023)"
"2/3 of new DCs built in water-stressed areas"
"Ocean DCs: zero freshwater"]

[TRANSITION: Crossfade, 1s]

---

## [SCENE 20: Space Pollution — 10:55-11:35]

[VISUAL: Dramatic shot of a Falcon 9 rocket ascending through the atmosphere, exhaust plume spreading. Then transition to visualization of orbital debris — thousands of tracked objects swirling around Earth in accelerating density.]

NARRATION:
"Now consider what eighty-eight thousand satellites would do to the sky. Each Falcon 9 launch deposits roughly four hundred and twenty-five tonnes of CO2 into the atmosphere. But the real damage is the black carbon — soot particles injected directly into the stratosphere, where they are five hundred times more effective at trapping heat than the same particles at ground level."

"A 2025 study from ETH Zurich found that projected launch rates will measurably slow the recovery of the ozone layer. Every satellite that reaches end of life burns up on reentry, scattering rare earth metals and aluminum oxide as aerosols into the upper atmosphere. There is no recycling. There is no recovery. It is one hundred percent e-waste, vaporized into the air we breathe."

[TEXT OVERLAY: "Each Falcon 9: ~425 tonnes CO2"
"Black carbon: 500x more warming in stratosphere"
"100% e-waste on reentry — zero recovery"]

[TRANSITION: Crossfade, 1s]

---

## [SCENE 21: Kessler Syndrome — 11:35-11:55]

[VISUAL: Animated visualization of Kessler cascade — one collision event creating expanding debris clouds, which cause more collisions, which create more debris. The animation accelerates. Counter in corner shows tracked objects climbing from 54,000 upward.]

NARRATION:
"There are already fifty-four thousand tracked objects in orbit. The predicted interval between significant collision events — the CRASH clock — sits at two point eight days. Adding eighty-eight thousand more objects to that environment is not a calculated risk. It is a bet against physics."

[TEXT OVERLAY: "54,000 tracked orbital objects"
"CRASH clock: 2.8 days between events"
"Proposed addition: 88,000 satellites"]

[TRANSITION: Crossfade, 1s]

---

## [SCENE 22: Ocean Environmental Wins — 11:55-12:20]

[VISUAL: Beautiful underwater shot of a marine ecosystem thriving around an artificial reef structure — the base of an oil platform teeming with fish, coral, and sea life. Warm, inviting color palette.]

NARRATION:
"Meanwhile, in the ocean, something unexpected happens when you put structures in the water. Oil platform bases in the Gulf of Mexico have become some of the most productive artificial reefs on the planet — twelve to fourteen thousand fish per structure. The Rigs-to-Reefs program has been converting decommissioned platforms into permanent marine habitats for decades. A data center on a platform does not just preserve the reef. It funds its protection."

[TEXT OVERLAY: "12,000-14,000 fish per platform structure"
"Rigs-to-Reefs: decades of proven results"]

[TRANSITION: Crossfade, 1s]

---

# Chapter 7: The Verdict

## [SCENE 23: The Dyson Sphere Line — 12:20-12:45]

[VISUAL: Split screen fading from a fantastical CGI Dyson sphere rendering on the left to a real offshore wind turbine on the right. The rendering slowly fades to translucent as the real turbine becomes dominant.]

NARRATION:
"Look — I respect the ambition. The dream of computing in space is genuinely inspiring. Someday, maybe. But a Dyson sphere is not a roadmap. It is a thought experiment. Meanwhile, offshore wind is already spinning. Submarine cables are already carrying your data. Oil platforms are already standing in the water, waiting for their next job."

[TRANSITION: Crossfade, 1s]

---

## [SCENE 24: The Funding Gap — 12:45-13:15]

[VISUAL: Clean infographic. Two sides of the screen. Left: "SPACE" with $200M for 1 GPU and a question mark for 88,000 satellites. Right: "OCEAN" with a stack of operational facilities, megawatt capacities, real customers, and real revenue.]

NARRATION:
"Two hundred million dollars bought one GPU in orbit. That same capital could fund multiple megawatt-scale ocean data centers that are operational today. Starcloud has raised money to build a second satellite. Aikido has an NVIDIA partnership and a prototype going into the water this year. Highlander is already running commercial operations. The ocean is not a concept. It is a business."

[TEXT OVERLAY: "$200M = 1 GPU in orbit"
"vs."
"$200M = multiple MW-scale ocean DCs"]

[TRANSITION: Crossfade, 1s]

---

## [SCENE 25: The Real Opportunity — 13:15-13:45]

[VISUAL: Montage sequence — quick cuts between: offshore wind turbines spinning at sunset, an underwater data center capsule on the seafloor, an ROV performing maintenance, a submarine cable being laid from a ship, a gas platform with compute containers on deck. Each shot is 2-3 seconds, building energy.]

NARRATION:
"The infrastructure is there. The power is there. The cooling is literally infinite. The economics work today, not in 2036. The environmental math is not just neutral — it is regenerative. Every argument for putting data centers in space is an argument that works better in the ocean."

[TRANSITION: Crossfade, 1s]

---

## [SCENE 26: The Call to Action — 13:45-14:05]

[VISUAL: Calm wide shot of the ocean at golden hour. A single offshore wind turbine in the distance, blades slowly turning. Peaceful. Enormous. Obvious.]

NARRATION:
"We do not need to solve the hardest problem in engineering to build the next generation of data centers. We need to solve the obvious one. The ocean has been waiting. And honestly — it is a little strange that we are looking up, when the answer is right there."

[PAUSE: 1s]

[TRANSITION: Crossfade to black, 2s]

---

## [SCENE 27: End Card — 14:05-14:20]

[VISUAL: Clean end screen. Vistter logo. Subscribe button. Video recommendation cards.]
[TEXT OVERLAY: "Sources and research links in the description"]
[TEXT OVERLAY: "VISTTER"]
[MUSIC: Background track fade out]

[TRANSITION: Fade to black]

---

## [SCENE 28: Thumbnail Concept]

**Option A:** Split image — left half is a glowing satellite in dark space (red/orange tint), right half is a floating offshore wind data center on blue ocean. Bold text overlay: "SPACE vs. OCEAN" with a red X over space and green checkmark over ocean.

**Option B:** Single striking image of a data center capsule being lowered into the ocean from a crane, with text: "$25 BILLION MISTAKE?" in large impact font. Starcloud logo small in corner.

**Option C:** Earth from orbit with an overlaid question mark made of satellite icons, text: "88,000 SATELLITES... FOR THIS?" with a small inset of an ocean data center.

---

# Production Notes

## Word Count
- Total narration: ~2,050 words
- Estimated runtime at 150 wpm: ~13 minutes 40 seconds
- With pauses, transitions, and title card: ~14 minutes 15 seconds

## Key Sources for Description
- Starcloud FCC filing: 88,000 satellites, Feb 2026
- Starcloud Series A: $170M at $1.1B valuation, Mar 2026
- Orbital (a16z): Seed funding, Apr 2026, test flight Apr 2027
- Microsoft Project Natick: 864 servers, 8x reliability, cancelled 2024
- Highlander/HiCloud: Operational Hainan, wind-powered Shanghai demo
- Aikido Technologies: Norway prototype 2026, UK commercial 2028
- Nautilus Data: 7MW floating DC, Stockton CA, 86% occupied
- Hyperscale Data (GPUS): Gulf of Mexico oil platform DC, Nov 2024-Feb 2025
- Crusoe Energy: 250+ MW deployed, $1B+ revenue trajectory
- ETH Zurich 2025: Rocket emissions slowing ozone recovery
- US DC water consumption: 66 billion liters direct (2023)

## Music Direction
- Opening: Low electronic tension, building
- Space pitch section: Aspirational synth, slightly grandiose
- Math section: Stripped back, percussive — the numbers speak
- Ocean section: Warmer, more grounded electronic — confidence
- Environmental section: Darker undertone returns for space pollution, brightens for ocean wins
- Closing: Reflective, open, warm
