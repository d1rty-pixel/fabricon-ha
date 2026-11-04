# Bambu Lab P2S - reference for a procedural three.js model

Research status: read in the user's Chrome on wiki.bambulab.com (P2S introduction, FAQ, rear panel / front door / front
cover replacement pages with photos). bambulab.com was not readable (extension permission denied), so there is no
official drawing; heights are estimates. Coordinates: mm, origin = centre of the footprint at floor level, X right
(seen from the front), Y up, Z towards the front. "Left / right" = seen from the FRONT unless "from behind" is written.
Rear-photo numbers: panel width 392 mm assumed, scale ~0.78 mm / px, +/- 10 mm. Not verified (no page / photo read):
toolhead photos, the camera position, USB position, the exact LED strip lengths, side-panel details.

Wiki base: `https://wiki.bambulab.com/en/p2s/...` (abbreviated `wiki:`).

## 1. Identity

| Item | Value |
|---|---|
| Names | P2S (standalone, no buffer), P2S Combo (with AMS 2 Pro and the filament buffer installed on the rear) |
| Model code (BamBuddy) | `N7` (docs/printers/bambuddy-entities.md); HA prefix `p2s` |
| Relation | successor to the P1S, but "a comprehensive iteration": frame, mainboard, toolhead, screen and air system redesigned; not upgradable from the P1S (wiki p2s-faq) |

## 2. Size, weight, volume, temperatures

- Outer size **392 x 406 x 478 mm** (W x D x H), net weight **14.9 kg**, print volume **256 x 256 x 256 mm** (wiki p2s-faq). Same outer size as the X2D (card/models/bambu.x2d: 392 x 406 x 478). Keep 4 mm free left / right (side air intakes) and 10 cm behind (tubes, purge chute).
- Nozzle 300 C max, bed 110 C max, 600 mm/s (travel), 20 000 mm/s2. Hardened-steel 0.4 mm nozzle, hardened-steel extruder gears, high-flow nozzles supported (H2D nozzles are compatible).
- **No active chamber heater, no chamber temperature control.** There is a chamber temperature SENSOR (upper side of the front door, inside) - the chamber reading is passive. Heating mode = closed internal circulation through the carbon filter.
- Power 1200 W @ 220 V; noise < 50 dB silent mode. Wi-Fi only (2.4 + 5 GHz), no Ethernet.

## 3. Enclosure

- Shell: grey / dark-grey body. Side panels PC + ABS plastic (wiki p2s-faq), **no windows**; rear panel mid-grey sheet metal (photo); front cover "dark grey panel with P2S printed on it" (wiki replace-front-cover); top: glass lid (not compatible with the P1S one - different size); black plastic top frame; base with soft anti-vibration feet.
- Door: **dark grey glass with a security film** (wiki replace-front-glass-door), black frame, hinges on the **LEFT** (two black hinge brackets at the upper-left and lower-left corners in the wiki drawing), rod / pill handle on the right edge at about mid height (x ~ +180, y ~ 235). Door open detection (sensor); the door screws sit in the hinge brackets; a front silicone pad on the lower edge.
- Front cover (top front band): ~ full width, ~ 45 mm tall (drawing, estimate). Screen cut-out and a port cut-out left of centre (x ~ -125 .. -30), "P2S" logo at the right (x ~ +80 .. +150) - read from the wiki's drawing, medium confidence. LED strip is mounted under the cover (front LED, see section 6).
- Colours: body grey (the wiki photos are mid-grey), door dark grey tinted, rear mid-grey; black plastic parts for the toolhead cover and rear chute.

## 4. Kinematics

- CoreXY, **bed moves in Z**, toolhead in XY. X axis: **smooth hollow steel rods** with belt (no carbon rods, wiki p2s-faq); Y axis: rods on both side frames; Motor A (right) / B (left); belt tensioner + belt tension monitor at the rear.
- Z: **three lead screws + guide rods at front-left, front-right and centre-rear, one Z motor and a belt** (wiki p2s-intro "Z-axis"). Same layout as the P1S (suggested screw positions estimate (-160, +165), (+160, +165), (0, -175); rods next to them).
- Heatbed 256 x 256 print area, magnetic textured PEI plate (QR-coded plates), positioning blocks, silkscreen calibration marks (the live camera calibrates from them), nozzle wiping plate on the bed (fine wipe), heated up to 110 C.
- Eddy-current sensor on the toolhead (adjustable) for levelling and flow calibration.

## 5. Heights (estimates, +/- 20 mm)

- Chamber floor ~ 30 mm (rear photo: base plinth), feet ~ 6 mm. Nozzle tip at layer 0 (TIP) ~ 320 mm (estimate: 478 minus ~ 150 above the nozzle; the X2D, which is the same size, has TIP 342 with a 260 mm bed travel and floor 64 - the P2S has 256 mm travel and a lower floor, so TIP ~ 300 .. 340). Door aperture y ~ 28 .. 410.
- Toolhead: ~ 60 wide x ~ 100 tall x ~ 50 deep incl. duct (no photo read; the P2S head is a P1S class head: cutter lever on the LEFT side, 5815 radial part fan on the front, hotend fan next to the hotend, extruder servo motor (X3508) on the back, eddy sensor, silicone sock with 3 yellow markers).
- Rear panel features from the photo below.

## 6. Fans (wiki p2s-intro / p2s-faq: "3 fans in total")

| Fan | Type / size | Position | Facing |
|---|---|---|---|
| Part cooling | custom **5815 radial** (58 x 15) | toolhead front shell | onto the nozzle via the duct |
| Hotend cooling | small axial (4010 class, estimate) | toolhead next to the heatsink | heatsink |
| Auxiliary part cooling = "adaptive airflow switching unit" | auxiliary fan with external intake, switchable between outside air and the internal filter loop | rear right of the chassis next to the carbon air filter (the wiki says "rear right"; not clear if from the front or behind; low confidence) | blows into the chamber (cooling mode: cool outside air; heating mode: internal circulation via the filter) |
| Optional left auxiliary fan | accessory fan mounted in a slot on the LEFT inner side | left wall | +x into the chamber |
| Chamber exhaust fan | NOT fitted (optional "exhaust kit" exists, wiki P2S Chamber Exhaust Fan Installation Guide) | rear | - |

No MC board fan listed. Hot chamber air leaves through the rear panel vents and the purge wiper gap; side air intakes (hence the 4 mm side clearance). Activated carbon air filter, larger than on the P1S, at the rear right.

## 7. Lights, camera, screen, ports

- **LED lights: two strips - one on the LEFT side and one at the FRONT** (wiki p2s-intro: "one LED strip on the left side and one on the front side"; replace pages: "AP Board Cover/LED Light - Left", "LED Light - Front"). Left strip: on the left inside of the top frame, running front to back (x ~ -180, y ~ 455, z -170 .. +150 estimate). Front strip: under the front cover band, running across the width (x -150 .. +150, y ~ 455, z ~ +185). BamBuddy has one `light.chamber_light` entity for the P2S (it switches the chamber light; no per-strip entity).
- Camera: **1 live view camera**, 1080p30, in the chamber, "angle and lighting redesigned" (no page read for the position; probably at the rear top looking at the bed; unverified). No privacy cover. One `camera.camera` entity.
- Screen: **5 in 854 x 480 full-colour touchscreen** in the front cover, left of centre (drawing, medium confidence). Not the X1 screen.
- USB-A 2.0 port (offline printing, time-lapse): wiki lists "USB Port Replacement Guide"; position unverified, presumably in the front cover next to the screen (the cover drawing shows a second cut-out beside the screen).
- No SD card. Wi-Fi antenna in the front cover. Chamber temperature sensor on the upper side of the front door, inside.
- Power: inlet with a small red / black rocker switch at the lower rear, printer's right (rear photo: from behind lower-left = x ~ +122, y ~ 55, ~ 40 x 35 mm).

## 8. Filament path

- Filament **buffer** (standalone version: none, buy separately; Combo: installed) on the REAR at the top, with a **Y-shaped channel**: the two left channels merge into one, so an AMS and an external spool can both be connected without unplugging tubes; two 6-pin ports on top (only one AMS at a time, the second is a spare / accessory port). Up to 4 AMS 2 Pro + 4 AMS HT (20 slots), 1st-gen AMS with an extra buffer adapter, no AMS hub, no AMS lite.
- Tube lengths (p2s-faq): AMS to buffer 600 mm; external spool "upper left of the rear panel" to buffer 350 mm; "lower left" 280 mm; external mount "on the right of the rear panel" to the chassis intake 180 mm. So external spool holders sit on the rear panel at the upper and lower left (from behind) and one on the right; the rear photo shows two bracket plates for them: at x ~ +137, y ~ 400 and x ~ -133, y ~ 375 (positions from behind converted to front coordinates; which is which is unverified).
- PTFE tubes then follow the cable chain to the toolhead; tube bracket and PTFE couplers at the top rear.
- **Purge chute:** black rectangular opening in the rear panel at x ~ -69 (printer left), y 151 .. 246 (~ 51 x 95 mm); the purge wiper sits at the rear LEFT of the chamber (wiki: "located at the rear left of the chassis and connects to the excess chute at the back"). Cutter stopper on the left side of the chamber (folds out when the X axis goes to the rear).

## 9. Rear panel (from the photo in wiki replace-rear-panel; converted to front coordinates)

Panel width 392 mm = 505 px (0.776 mm / px), height 478 = 607 px (0.787 mm / px), centre x = 0.

| Feature | x (front coords) | y | size |
|---|---|---|---|
| Power inlet + switch | +122 | 55 | ~ 40 x 35 |
| Purge chute opening | -69 | 151 .. 246 | 51 x 95 |
| Mesh grille (intake / exhaust) | -126 | 152 .. 250 | 40 x 77 |
| Rectangular recess with a cable pass-through (buffer / bracket plate) | +28 | 252 .. 320 | 95 x 68 |
| Bracket plate A (tube holder) | +137 | ~ 400 | 37 x 35 |
| Bracket plate B | -133 | ~ 375 | 30 x 35 |
| Slot (cable / strain relief) near the top | -142 | ~ 458 | 25 x 8 |
| Screws: 4 pairs along the edges (11 ST3-4.5 / BT3-6) | edges +/-170 | various | - |

## 10. Entities (docs/printers/bambuddy-entities.md) and what has none

- Entities for the P2S: `part_cooling_fan`, `auxiliary_fan` (the adaptive airflow unit), `left_auxiliary_fan` (accessory), `exhaust_fan` only with the exhaust kit, `ventilation`, `select.airduct_mode` (cooling / heating), `light.chamber_light`, `camera.camera`, `binary_sensor.door`, `usb_drive`, `chamber_temperature` sensor, `hotend_fan`. NO chamber heater number, no `chamber_fan`.
- No entity for: the second LED strip (left vs front), the filament buffer / its sensors, the cutter stopper, the eddy sensor, the chamber air filter state.

## 11. Differences to the P1S (docs/printers/bambu-p1s.md)

Bigger (392 x 406 x 478 vs 389 x 389 x 457) and heavier (14.9 vs 12.95 kg), side panels PC + ABS, hollow steel X rods instead of carbon, 5 in colour touchscreen instead of the 2.7 in LCD, 1080p30 camera, two LED strips (P1S: one bar), no exhaust fan (adaptive airflow unit + carbon filter, inlet from outside), buffer with Y channel and two external spool inlets, purge chute at the rear left, door film glass, Wi-Fi 5 GHz, hardened nozzle, 110 C bed, 600 mm/s.

## 12. Numbers, sources, confidence

| Number | Value | Source | Confidence |
|---|---|---|---|
| Outer size, weight, volume | 392 x 406 x 478, 14.9 kg, 256^3 | wiki/en/p2s/manual/p2s-faq | official |
| Temps / speed | 300 C, 110 C, 600 mm/s, 20 000 mm/s2 | p2s-faq | official |
| Chamber control | none, passive sensor | p2s-faq, p2s-intro | official |
| Z system | 3 screws front-L, front-R, centre-rear, 1 motor, belt | wiki/en/p2s/manual/p2s-intro | official |
| X axis | hollow steel rods | p2s-intro, p2s-faq | official |
| Fans | 5815 part, hotend, auxiliary (adaptive airflow); 3 total | p2s-intro, p2s-faq | official |
| LEDs | one left, one front | p2s-intro | official |
| Camera | 1 x 1080p30 | p2s-intro, p2s-faq | official (position unknown) |
| Screen | 5 in 854 x 480 | p2s-intro | official; position medium-low (cover drawing) |
| Door hinge left, handle right, film glass | wiki/en/p2s/maintenance/replace-front-glass-door | official / drawing |
| Rear panel features | table in section 9 | wiki/en/p2s/maintenance/replace-rear-panel photo | measured, +/- 10 mm |
| Tube lengths | 600 / 350 / 280 / 180 mm | p2s-faq | official |
| Purge wiper rear left, cutter stopper left | p2s-intro | official |
| TIP ~ 320, floor ~ 30, toolhead size | derived | estimate, low |
| Model code N7 | docs/printers/bambuddy-entities.md | from BamBuddy tables |

## Summary

1. P2S: 392 x 406 x 478 mm (same as the X2D), 14.9 kg, 256^3 bed, one hardened 300 C nozzle, 110 C bed, no chamber heater (passive sensor only), model code `N7`.
2. CoreXY with bed on Z: three belt-driven lead screws (front left / right, rear centre), hollow steel X rods, Y rods per side; cutter lever and stopper on the left.
3. Grey shell: left-hinged dark film-glass door (handle right), glass lid, windowless PC+ABS sides, front cover band with 5 in touchscreen left of centre and the P2S logo right; rear panel with the purge chute at x -69, a mesh grille at x -126, power at x +122, buffer recess at x +28.
4. Fans: 5815 radial part fan, hotend fan, adaptive airflow (aux) unit with carbon filter at the rear right, optional left aux fan; no exhaust fan; two LED strips (left + front) behind one HA light; one 1080p camera.
5. Filament: optional rear buffer with Y channel (AMS 600 mm tube, external spools at the rear upper / lower left and one right); heights (TIP ~ 320, floor ~ 30), toolhead size, camera / USB position are estimates.

## 13. Findings while building the model (card/models/bambu.p2s)

Source: wiki.bambulab.com/en/p2s landing page, product photo with part labels (3/4 view from the right front). Own tab, read only.

| Finding | Value used in the model | Confidence |
|---|---|---|
| Screen: 5" touchscreen stands on the top front at the LEFT, tilted back, clearly rising above the lid | centre x -128, bezel 120 x 74, tilt 0.3 rad | photo, medium |
| "P2S" lettering on the slim front band at the RIGHT (dark print on grey, small) | x +122, y 455 | photo, medium |
| Slim front band (~ 46 mm), the dark glass door runs from the sill to it, left edge nearly flush, ~ 34 mm grey pillar on the right | door x -184 .. +162 | photo, medium |
| Right side panel: windowless, large black Bambu mark with "Bambu Lab" under it, centred front to back | mark y 255, text y 205 | photo, high |
| Shell mid-grey (not dark), toolhead dark graphite with a round fan opening | 0x5e6166 shell | photo, high |
| "Live view camera": inside, upper left | estimate: top beam behind the front band at x -150 | low |
| Purge wiper: right of the head's rest position, a white "Bambu Lab" pill on its front | chute x -69, pill y 225 | photo, medium |
| Small round knob on the top near the middle, right of the screen | modelled as the USB-A port (x -40), probably wrong | low |
| Handle: none visible in the photo | slim vertical pill at the glass's right edge (research says handle right) | low |
| Rear panel features, Z layout, tube lengths | section 9 / 8 | as above |

Model choices (estimates): TIP 330, floor 30, head 60 x 50 x 90 (nozzle to top), X rods y 366 / 396, Y rods y 381, aux fan on the right wall (x +181, y 250, z -110), carbon filter module x 140 .. 186 in the rear right corner with the ventilation fan on its front, optional aux_l on the left wall, exhaust kit over the mesh grille. Buffer drawn at the recess (x +28, y 286), AMS and external spool tubes enter its two top ports, one tube leaves towards -x and climbs to the slot (-142, 458). Tube bend radii: AMS / spool tubes >= 96; the tube into the slot ~ 70 (slot is 12 mm under the lid), the slot -> head tube < 100 when the head is near the rear panel.
