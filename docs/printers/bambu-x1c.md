# Bambu Lab X1 Carbon (X1C) and X1E - reference for a procedural three.js model

## 0. Checked against the wiki photos

Sources: GL = https://wiki.bambulab.com/en/x1/manual/glossary (X1 front + toolhead photos), GL-P1 = https://wiki.bambulab.com/en/p1/manual/glossary,
RP = https://wiki.bambulab.com/en/x1/maintenance/replace-rear-panel and https://wiki.bambulab.com/en/p1/maintenance/p1s-rear-panel (flat panel photos),
FC = https://wiki.bambulab.com/en/x1/maintenance/replace-front-cover, SC = .../x1/maintenance/replace-high-resolution-screen,
CAM = .../x1/maintenance/replace-chamber-camera and .../p1/maintenance/chamber-camera, LED = .../x1/maintenance/replace-the-chamber-led,
WIP = .../x1/maintenance/replace-nozzle-wiper. "photo" = measured on the photo (+/- 5 %, scale from the 389 x 457 mm outline),
"estimate" = judgement. Section 0 supersedes any conflicting number further down.

| Item | Value (source) |
|---|---|
| Body colour | silver-grey metal/plastic, light grey side panel (photo, GL; FC: "silver-gray" front cover) |
| Screen | 5" touchscreen with silver housing and a hinge knob on its right; stands on the top front edge at the LEFT, tilted back, top ~20 mm above the lid; module ~140 x 80 mm, x -188..-48 (photo GL, SC) |
| microSD | lower right edge of the screen module (GL marker 8) |
| Door | glass from ~y 22 (estimate) to 393 (photo: top band ~62 mm), no frame print, no visible handle (photo); hinged left (kept) |
| Top band lettering | "Bambu Lab X1-Carbon" right of centre, x ~ +116 (photo) |
| Side logo | right panel: Bambu mark ~50 x 70 mm centre y ~250, "Bambu Lab" below at y ~200, z ~ -20 (photo GL) |
| Camera | black wedge with lens on the left front of the top beam, ~40 x 14 mm, y ~315 (CAM photo, GL marker 4) |
| Chamber LED | black housing with a bright face, ~108 mm long, x -148..-40, ~64 mm under the door top (LED photo + GL; height estimate) |
| Purge chute / wiper | chute opening 52 x 101 mm at x +68 (seen from the front), y centre 194 (RP photo, scaled by panel height 449); nozzle wiper = black S bracket with a blue silicone roller on the chute's front edge; white "Bambu Lab" badge on the chute front, y ~215 (WIP, GL) |
| Rear panel | same panel as the P1S: filament slot 51 x 11 at x +62, y 444; belt tensioner windows 34 x 34 at (-132, 392) and (+132, 363); power cut-out 31 x 51 at (-127, 54); big grille 89 x 102 at x -98 (chamber fan), narrow grille 32 x 102 at x +126; embossed bracket 94 x 47 at (3, 287) for the spool holder (RP). Orientation (inside view, chute at the back right as in the front photos) is an inference |
| Toolhead | light grey/silver housing, black duct, round part-fan intake on the front face, cutter lever on the left (photo GL toolhead view); X1C adds the micro lidar underneath |
| Top cap | a small round cap near the middle of the lid at the back, visible in both front photos (estimate, purpose unknown) |

Variants: X1E has the same chassis in dark grey with an enclosure and an active chamber heater (estimate, no photo checked); the plain X1 has no camera and no lidar (CAM: camera is optional for the X1). P1P (see p1s doc): no door, no lid, open frame (not checked on a photo).


Research status: wiki.bambulab.com and bambulab.com could not be fetched (HTTP 402/403 for every page), so no wiki
photos or CAD were seen. Only search snippets (which quote the wiki), retailer / review pages and my own recollection
of the machine were used. Everything not marked "official" is a reviewer figure or an estimate; read the confidence
column in section 10. Coordinates: mm, origin = centre of the footprint at floor level, X right (seen from the front),
Y up, Z towards the front. "Left/right" = as seen from the front unless stated.

## 1. Identity

| Item | Value |
|---|---|
| Names | X1 Carbon (X1C, "X1-Carbon"), X1 Carbon Combo (with AMS), X1 (plain: polycarbonate panels, no hardened parts, no Carbon edition extras), X1E (enterprise) |
| Release | X1 / X1C 2022 (Kickstarter, shipped 2022), X1E 2024 |
| End of life | X1 series production ended 2026-03-31 (X2D is named as the successor); spares promised to ~2031 |
| Model codes | Not verified from a source. Recollection: X1C = `BL-P001` (MQTT / BamBuddy name "X1C", `3DPrinter-X1-Carbon`), X1 = `BL-P002`?, X1E = `C13`. Check the printer's MQTT `info` / BamBuddy `model` before hard-coding |

## 2. Outer dimensions, weight, enclosure

- Outer size 389 (W) x 389 (D) x 457 (H) mm without spool holder / AMS; net weight 14.13 kg (gross ~18 kg; Combo with AMS ~22.3 kg).
  Spool holder and carbon filter protrude behind: add ~40-60 mm depth at the back (estimate); the door handle adds a few mm in front.
- Build volume 256 x 256 x 256 mm; bed (textured / smooth PEI spring-steel plate) 257 x 257 mm class, i.e. the model's `BED` ~256.
- 1 nozzle (0.4 mm hardened steel), direct-drive, all-metal hotend, 300 C max (X1E 320 C); bed 120 C max (some sheets say 110 C); 500 mm/s tool head, 20 m/s2.
- Chamber heater: X1C no (passive; the chamber fan + aux fan only manage temperature). X1E: yes, active chamber heater up to 60 C
  (a PTC heater, in the left side duct area; this is the same place as the X1C's big side fan).
- Power 100-240 VAC, 1000 W at 220 V / 350 W at 110 V.
- Enclosure: front tinted-glass door held by magnets (aluminium handle on the right per review, so it is hinged on the left - hinge side not confirmed by a photo; door sensor in the frame),
  rubber seal; removable tinted glass top lid; solid side panels, no side windows (aluminium / sheet metal on the X1C; polycarbonate on the plain X1);
  painted grey-black sheet-metal back; black bottom plinth with feet. Colour: black / dark graphite body, silver-aluminium handle, orange accents inside (cutter lever, wiper).
- Frame: steel chassis; corner radius of the vertical posts ~10-15 mm (estimate).

## 3. Kinematics

- CoreXY, moving bed on Z (bed only moves in Z; the toolhead moves X/Y).
- X axis: two hollow carbon-fibre rods carrying the toolhead carriage (Bambu part "X-axis carbon rods assembly"), ends on two Y carriages.
- Y axis: two steel rods (8 mm class, estimate) along the left and right inner walls; the XY motors sit at the rear corners (behind the Y rod ends, upper rear, estimate).
- Z: three lead screws (wiki: "3 lead screws", two near the front door pillars, one at the back). Rear Z support rod exists (forum); whether the front pair also has smooth guide rods is NOT verified.
  Reasonable layout (estimate, same as the X2D model): screws at x = +/-170, z = +170 and x = 0, z = -170; guide rod behind each front screw plus one rear. Z stepper under the base. The bed rests on the carriage ("heatbed carrier"), held by 3 screws reachable through the front door.
- Under the bed: three piezo / strain sensors at the bed corners (leveling and nozzle-touch detection); the bed cable (flat ribbon) runs to the rear.

## 4. Heights (all estimates, no published drawing)

- Chamber floor top: ~45 mm (bed lowest position sits just above it). Plinth/feet ~30-35 mm.
- Nozzle tip at layer 0 (TIP): ~ 300 mm (+/-15). Derivation: max Z travel 256 + bed stack ~15 + floor 45 -> bed top when lowered ~ 45+15 = 60 ... TIP = 60 + 256 = ~316 when the bed is at the bottom, minus a few mm bottom clearance; I would use ~305.
- Max Z travel 256 mm (equals build height).
- Toolhead (about 100 mm tall incl. the nozzle, ~55-60 W x ~55 D, estimates): nozzle + hotend heatsink (~25 below the carriage), carriage with extruder motor + cutter lever on the left/back,
  front cover with part-cooling fan duct (radial 5015 blower, nozzle ducts left/right of the nozzle, wide "fork" shape), hotend fan on the back side, glowing Bambu logo on the front cover, Micro Lidar module at the bottom front of the head (wiki: "bottom of the toolhead, 2 screws"; red line laser, visible as a thin dark window ~35 mm wide under the cover).
  No nozzle camera on the X1 (that is H2D / X2D).
- Top of the head at the top of the chamber: roughly TIP + 80-100 (estimate). X rods at ~TIP + 60-80, Y rods at the same height at the sides.

## 5. Fans

| Fan | Type / size | Position | Notes |
|---|---|---|---|
| Part cooling | radial blower 5015 (review) | toolhead front cover, ducts to both sides of the nozzle | PWM, closed loop |
| Hotend | axial ~4010 (estimate) | toolhead rear / side of the heatsink | closed loop |
| Auxiliary part cooling | large radial blower, 12 W (review) | outside-mounted duct on the LEFT side wall near the top of the chamber, blowing into the chamber; has the chamber LED strip above its duct (review) | on the X1E this duct also carries the chamber heater |
| Chamber (exhaust) fan | axial (size unconfirmed) | rear, through the activated-carbon filter cartridge in the back panel (upper area) | air leaves the chamber through the filter; HEPA / carbon filter cover is plastic |
| Control board / MCU | 4010 axial (review) | electronics compartment at the back | |
| PSU | fanless (review, ~100 W 24 V) | back / lower rear | grilles in the back panel |
| Bed power supply | AC direct | | |

## 6. Lights, cameras, screen, ports

- Lights: chamber LED(s) at the front of the chamber roof, with a protective cover to remove at setup (X1E manual); the review says the LED sits above the left side-fan duct; illuminated Bambu logo on the toolhead front cover.
- Chamber camera: 1080p wide-angle, upper front-left inside the chamber looking at the bed (review: "front left"). P1S has only 720p.
- Lidar: Micro Lidar on the toolhead bottom front (first-layer inspection, flow calibration); a calibration plate sits on the right edge of the bed area (review: "on the right side of the bed").
- Screen: 5 inch capacitive touchscreen 1280 x 720 (manual; reviewer says 5.5 inch, 4.3 inch in some listings - official manual number 5 inch is used), flat ribbon cable. Position: front of the printer; the review writes "top left" while my recollection is the lower right of the front face with the microSD slot beside it. CONFLICT: confirm with a photo before placing it. Estimate if used: 110 x 70 mm.
- Ports: microSD slot on the right of the screen (flush); internal 4 GB eMMC; no front USB; Wi-Fi 2.4 GHz only on the X1C; X1E adds an RJ45 Ethernet jack at the back.
  Pause / screen-wake button beside the screen.
- Power: AC inlet and rocker power switch on the back panel, low (estimate: right-hand lower corner seen from behind, ~y 70).

## 7. Filament

- AMS compatible: AMS (original, 4 spools), AMS lite NOT supported on the X1 (it is for A1); AMS 2 Pro and AMS HT (via the filament buffer / hub and the 4-pin AMS 2 Pro cable) also work with X1 series per Bambu's compatibility, not verified here. The X1E manual shows the AMS standing on top (on the lid) with a filament buffer connected by a 4-pin cable and an AMS cable of 6 pins.
- Original AMS size 355 (W) x 301 (D) x 240 (H)? (estimate from memory; official numbers not retrieved).
- External spool holder: a plate screwed to the back panel at the top, on the rear (reviews: "attached with two screws using Allen key H2"); spool sits behind the printer. Filament enters through a PTFE tube into the top-rear of the machine (inlet near the top, centre-left; estimate).
- PTFE routing: AMS output hub -> PTFE tube -> buffer -> tube through the top rear -> toolhead (filament enters at the top of the toolhead carriage via a Bowden coupler ("PTFE tube coupler") at the back of the head).
- Purge / waste chute: back-left of the enclosure (review): chute at the rear left corner of the bed with a small PTFE wiper; waste drops out of the back (estimate: x ~ -130, z -170, 0 to 40 high at the rear).
- Filament cutter in the toolhead; filament run-out sensor (tangle detection in AMS).

## 8. Front / back / side features (approximate, estimate unless stated)

- Front: glass door x -170..+170, y ~ 45..415 (the door glass). Aluminium handle at x ~ +150, mid-height. Screen near the lower right of the front (see above). Black "BAMBU LAB" silk logo, bottom right of the front glass edge (recollection).
- Top: removable tinted glass lid, ~340 x 340. The X1C logo "X1 CARBON" on the front lower corner.
- Left side: aux-fan duct high (y ~ 330), chamber LED strip above it.
- Right side: plain panel (X1E: ... same). Calibration plate is on the bed.
- Back: carbon filter cartridge (upper), spool holder plate (top), power inlet + switch (lower), PSU grilles, purge chute at rear left (y 0..60), Ethernet (X1E only).
- Inside: orange wiper block near the rear of the bed; textured PEI plate with 3 screws fix the bed.

## 9. Differences

vs P1S:
- X1C has Micro Lidar, 1080p camera, touchscreen 5 in (P1S: 2.7 in non-touch display), hardened-steel nozzle and extruder gear, active spaghetti-detection AI, a wider bed plate included, internal eMMC,
  glass lid and solid side panels shared; the P1S has an aux fan and chamber fan too but no active chamber control; frame and kinematics are shared (P1/X1 family).
vs X2D (existing model in card/):
- X1C is smaller: 389 x 389 x 457 vs X2D 392 x 406 x 478 ; build 256^3 vs 256 x 256 x 260 (dual nozzle).
- One nozzle, no filament buffer window, no auxiliary extruder, no side windows on the X1C (the X2D has side windows), glass lid is similar.
- Door hinged and magnetic in both; X2D has a heated chamber (X1E's 60 C is the closest to it).
- AMS: AMS (original) on the lid vs AMS 2 Pro; spool holder on the back top in both but X1C has one.
- X1E vs X1C: chamber heater (to 60 C), 320 C hotend, Ethernet, 3-stage air filtration, enterprise firmware (LAN only), same body and size, X1E door and panels the same (X1E has no visible exterior differences except the Ethernet jack and "X1E" badge).

## 10. Numbers, sources, confidence

| Number | Value | Source | Confidence |
|---|---|---|---|
| Outer size | 389 x 389 x 457 mm | https://3dprintbeginner.com/bambu-lab-x1-carbon-review, retailer spec sheets (e.g. https://shop3duniverse.com/collections/3d-printers/products/bambu-lab-x1-carbon-3d-printer) | official (as quoted) |
| Weight | 14.13 kg | https://hotend.pages.dev/en/printers/bambu-x1c/ and the review above | official (as quoted) |
| Build volume | 256 x 256 x 256 | same | official |
| Nozzle max | 300 C (X1E 320 C) | review; https://siraya.tech/blogs/news/bambu-lab-x1e-vs-x1-carbon-whats-different-and-why-your-siraya-tech-filament-settings-stay-the-same | official / third party |
| Bed max | 120 C (110 C listed elsewhere) | review / hotend.pages.dev | conflicting |
| Chamber heater | none on X1C; X1E up to 60 C | https://forum.bambulab.com/t/difference-between-x1-models/106886 | third party |
| Power | 1000 W at 220 V, 350 W at 110 V | https://cdn.ozdisan.com/ETicaret_Dosya/1200577_1089424407..pdf | distributor sheet |
| Release | 2022; X1E 2024; end 2026-03-31 | https://hotend.pages.dev/en/printers/bambu-x1c/, https://www.hackster.io/news/bambu-lab-retires-the-x1-series-of-fff-3d-printers-but-promises-spares-out-to-2031-ccce61958d08 | third party |
| Screen | 5 in, 1280 x 720 | https://www.manualslib.com/manual/4069841/Bambu-Lab-X1.html | official manual |
| Screen position | top-left (review) vs lower right front (memory) | review above | conflicting |
| Lidar position | bottom of toolhead, 2 screws | https://wiki.bambulab.com/x1/maintenance/replace-micro-lidar (snippet only) | official wiki (snippet) |
| Z lead screws | 3, two near front pillars, one rear | https://wiki.bambulab.com/en/x1/maintenance/replace-Z-axis-lead-screw-assembly (snippet) | official wiki (snippet) |
| Guide rods | rear Z rod exists; front rods unknown | https://forum.bambulab.com/t/z-axis-rod-came-installed-incorrectly/15678 | forum |
| Fans: part 5015, side 12 W radial, board 4010, LED above side duct, camera front left | review | https://3dprintbeginner.com/bambu-lab-x1-carbon-review | reviewer |
| Door/handle | magnetic glass door, aluminium handle right | review | reviewer |
| Purge chute | back left | review | reviewer |
| All heights, toolhead size, positions in sections 3-8 not listed above | | derived from the 256 mm build height, 457 mm body and the X2D model's conventions | estimate |

## Summary

1. X1C: 389 x 389 x 457 mm, 14.13 kg, 256^3 build, single 300 C nozzle, no chamber heater; X1E adds 60 C chamber heater, 320 C, Ethernet.
2. CoreXY with bed on 3 Z lead screws (2 front, 1 rear) and a rear guide rod; carbon X rods; lidar at the toolhead bottom; 1080p camera front-left.
3. Fans: toolhead part 5015 + hotend, left-side aux blower with LED above, rear carbon-filter exhaust, board 4010; ports only microSD (+ Ethernet on X1E).
4. wiki.bambulab.com was unreachable (402): screen position, door hinge, fan sizes, all heights and the Z-rod layout are estimates and must be checked against photos.
5. Versus the X2D: smaller, single nozzle, no side windows, no buffer / aux extruder, no heated chamber on the X1C.

## 11. Model `bambu.x1` (card/models/bambu.x1) - numbers actually used

Shared with the P1S (same chassis): 389 x 389 x 457, TIP 305, chamber floor 30, door glass up to y 393, Y rods y 374,
X rods y 358 / 390, Z screws (+/-158, 160) and (0, -170), rods 22 mm outside / (36, -170). Source: the P1S photo
measurements (docs/printers/bambu-p1s.md), medium confidence. The X1C-only choices below are NOT from photos
(wiki unreachable, the X1 glossary image is not at the P1 URL): touchscreen 124 x 78 mm at the lower right of the front
base (x +96, base 66 mm tall, door glass from y 66; recollection, low confidence, conflicts with the review's
"top left"), microSD slot left of it (x 28), lidar window 36 mm wide under the duct, dark-grey head, carbon-filter
frame round the rear fan opening, "X1 CARBON" on the front band at the right. The door sensor row is registered
(`door:front`).
