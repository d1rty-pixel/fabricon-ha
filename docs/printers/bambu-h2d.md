# Bambu Lab H2D (and H2D Pro / H2S / H2C) - reference for a procedural three.js model

Research status: read in the user's Chrome on wiki.bambulab.com (text of the intro / FAQ / maintenance pages, labelled
screenshots of the rear panel, the front door photos, the toolhead / laser module drawings). bambulab.com itself was not
readable (extension permission denied), so there is NO official drawing; heights come from photo estimates. The
browser/LLM side of the session hit a rate limit near the end: the H2D toolhead photos, the side-panel / front-cover
close-ups, the H2D screen position and the H2D own weight were NOT verified (marked below). Coordinates: mm, origin =
centre of the footprint at floor level, X right (seen from the front), Y up, Z towards the front. "Left / right" = seen
from the FRONT unless "from behind" is written. Rear-photo numbers are +/- 10 mm, heights +/- 30 mm.

Wiki base: `https://wiki.bambulab.com/en/...` (abbreviated `wiki:`).

## 1. Identity

| Item | Value |
|---|---|
| Names | H2D (standard, dual nozzle), H2D AMS Combo, H2D Laser Full Combo (built-in air pump, BirdsEye camera, green PC door / side windows); H2D Pro (enterprise: Ethernet, tungsten nozzle, enhanced toolhead fan, vision encoder); H2S (single nozzle, same frame); H2C (H2D frame + Vortek induction hotend rack) |
| Model codes (BamBuddy, docs/printers/bambuddy-entities.md) | H2D `O1D`, H2D Pro `O1E`, H2C `O1C2`, H2S `O1S` (the table lists "O1D / O1E, O2D / O1C, O1C2 / O1S" - read the real printer's `model` before hard-coding) |
| HA entity prefix | `h2d`, `h2d_pro`, `h2c`, `h2s` |
| Release | H2D 2025 (wiki pages dated 2025-2026); H2D Pro / H2C / H2S later in 2025-2026 |

## 2. Outer size, weight, build volume, temperatures

- Outer size (W x D x H): **492 x 514 x 626 mm** for H2S (wiki h2s-faq), H2D Pro (h2d-pro-faq) and H2C (h2c-faq); the H2D shares the frame (wiki h2d-faq appendix: "H2S and H2D share the same printer framework") so the same size applies. Foot pad hole spacing **435 (W) x 454 (D)** (h2s-faq). Rear spool holders / PTFE / the AMS add to this. Packaging (Pro): 620 x 620 x 755.
- Weight: H2S 30 kg, H2D Pro 31 kg, H2C 32.5 kg (FAQ pages). H2D itself not read (about 31 kg, estimate).
- Build volume / bed: heatbed print area **350 x 320 mm** (H2D). Left nozzle only: X 0..325, right nozzle only: X 25..350 (bed coordinates), both: X 25..325 (300 wide common area), Y 0..320. Heights: left nozzle 320 mm, right nozzle 325 mm (wiki printable-range-for-dual-nozzles). Plate: textured PEI, magnetic, shared H2D / H2D Pro / H2S, not H2C.
- Temperatures: nozzle 350 C max, heatbed 120 C max, **active chamber heater up to 65 C** (H2D Pro / H2C FAQ; PTC plate + circulation fan on the right wall, see section 8). Two heater elements in the bed (high power while heating, small one to hold; up to 4-7 C spread).
- Speed (H2S FAQ): travel 1000 mm/s, accel 20 000 mm/s2, print 600 mm/s. Power: low-power mode caps at ~860 W; H2S peak 1800 W @ 220 V.
- Noise 50 dB avg (H2S / H2C FAQ, 1 m).

## 3. Nozzles (dual) and how the switch works

- Two hotends side by side on one toolhead: **left** and **right**, identical parts and interchangeable (h2d-faq), 0.4 mm standard. Both fed by ONE extruder unit above them.
- **Nozzle lift:** the LEFT hotend is on a lifting rail driven by the "2004 lifting motor". Left hotend up: the left nozzle is raised clear and the right one prints; left down: both are at layer height and the flow blocker (thin steel sheet under the nozzles, swings left / right with the lift linkage) covers the other. So at rest the left nozzle tip sits some mm ABOVE the right one when the right prints (lift stroke not published, estimate 4-5 mm). A wind blocker plate next to the left hotend rises and falls with it (h2d-intro "principle and function of the left hotend rising and falling").
- Extruder (wiki h2d-intro): a switching motor turns a cam that swings two driven-wheel linkages so ONE extrusion drive wheel feeds either the left or the right filament. Cutter on each side: a filament cutter lever on each outer side of the head (H2S: one lever on the right side); foldable cutter stoppers on the printer frame, one each side, retract in the idle position (do not limit travel).
- Nozzle offset calibration coil in the bed (eddy sensors on the toolhead, "left nozzle eddy sensor", "right nozzle eddy sensor"); nozzle camera (1080p, looks at the nozzles) and toolhead camera (1080p / 1600x1200 H2S, motion accuracy, vision encoder plate).
- Printable range: only the left nozzle reaches the far left of the bed, only the right nozzle the far right (see section 2).
- H2S: ONE nozzle (340 x 320 x 340 mm volume, heatbed print area 340 x 320 mm), extruder single path, cutter lever on the RIGHT side of the head, hotend fan duct on the left side of the hotend, no lift mechanism.

## 4. Enclosure

- Frame: all-metal; front pillars: light silver / aluminium-look, rounded vertical posts about 43 mm wide (front photo, scale 1.24 mm / px from 492 mm), black plastic bottom ring (sill) about 35 mm tall ("Enclosure Plastic Bottom Ring"), black top frame with the front cover band.
- Door: **front glass door**, black / dark tinted glass (laser version: green PC), two hinges (top and bottom) on the **LEFT**, handle on the right edge at about mid height (x ~ +195, y ~ 290, a vertical black pill ~15 x 60 mm; the laser version shows a warning label next to it). Door glass about 415 mm wide x ~ 470 tall (photo estimate), fixed with 4 M3 screws (2 top, 2 bottom) into the hinges. Door sensor (Hall) for "door open"; top cover and side panels also have open-detection (h2d-intro).
- Side panels: plastic panels with a **glass window each (left and right)**; H2D / H2D Pro: light-grey panel; H2C: dark-grey panel; **H2S: light-grey panel WITHOUT window** (h2c-faq table "Left/Right Views"). Laser version: green laser-safety windows. Side panels are fixed with 2 ST3x3 at the pillar and 3 BT3x8 behind the top frame (left), the left panel hides the aux fan.
- Top: removable glass cover plate (tempered glass; laser version: black cover), compatible between H2D / H2S / H2C. Automatic top vent (a servo flap, air inlet) in the top front near the screen (FAQ: "automatic top vent near the screen").
- Rear panel: dark grey / black sheet metal (23 + 2 screws), spool holder base on the right edge seen from behind (the printer's left), see section 9.
- Colours: body light silver (pillars, sides), black glass door, black top frame and rear; the H2C has darker side panels.
- Feet: soft anti-vibration feet (rubber pads, 4), foot spacing 435 x 454.

## 5. Kinematics (CoreXY, bed on Z)

- CoreXY: toolhead moves X / Y, bed Z only. X axis: linear guides + belt (H2C intro: "linear guides and belt drive"); Y rods on both side frames. Motor A right, Motor B left (rear of the upper frame). Belt tensioner with belt-tension monitor at the rear (wiki h2d-intro "belt tensioner").
- Z: **three lead screws + linear guide rods, driven by ONE Z motor through a belt** (positions "front-left, front-right and centre-rear of the heatbed", H2C intro / z-axis replace page: left and right pair "near the front door posts", the rear one partially behind the inner liner). 4 screws lock the Z slider for shipping. Suggested coordinates (estimate): screws (-215, +185), (+215, +185), (0, -225); rods beside them (~25 mm outside at the front).
- Nozzle lift: 2004 lifting motor on the toolhead (left hotend), 2004 switching motor for the extruder cam.
- Heatbed: 350 x 320 print area, bed plate carrier ~ 380 x 360 (estimate), positioning blocks, magnetic marker stickers for the BirdsEye / live camera, nozzle wiper steel strip, calibration sticker for the toolhead camera, **status indicator light bar under the front edge of the bed** (wiki h2d-intro heatbed table #7).

## 6. Heights (no official drawing; photo estimates, low confidence)

- Chamber floor: ~45 mm (bottom ring 35 + base). Door sill ~37 mm. Bed lowest top about 150-170 mm (front photo: a large dark gap under a lowered bed).
- **Nozzle tip at layer 0 (TIP): ~480 mm, +/- 30** (derived: 326-mm Z travel puts the lowest bed top at TIP - 325; photo bed-down ~ 167 + 325 = 492; and the 626 height minus ~140 above the nozzle as on the X2D = 486). Treat as low confidence; compare with the X2D (H 478, TIP 342).
- Toolhead: roughly 100 (W, two hotends side by side) wide is NOT measured; estimate 130 x 120 x 70 incl. duct (estimate from the laser module drawing: module wider than a single toolhead; the 40 W laser head is wider than the H2S head, FAQ). Layout (h2d-intro, toolhead guide parts list): front cover, part-cooling duct + 5015 radial fan, hotend-fan duct, left lifting hotend + right fixed hotend, dual extruder unit on top, toolhead camera and nozzle camera on the front, TH board, USB-C and FPC cable up into the cable chain. Cable chain on top of the head going to the rear.
- Laser module (H2D / H2C / H2D Pro / H2S 10 W): a boxy block ~ 50 x 90 x 50 with a quick-release lever on the side, air-assist coupler and connector on top, lens / air concentrator / height probe on the bottom; mounts on the toolhead after removing the toolhead front cover.

## 7. Fans (Bambu names)

| Fan | Type / size | Position | Facing | Source |
|---|---|---|---|---|
| Part cooling | custom **5015 radial** | toolhead front, duct splits to both nozzles | down onto both nozzles | wiki h2d-intro |
| Hotend cooling (+ duct, wind blocker on the left hotend) | axial (4010 class, estimate) | toolhead, duct to both heatsinks | onto the heatsinks | h2d-intro |
| Toolhead enhanced cooling fan | LED row fan | toolhead top (H2D Pro, H2C; optional for H2D) | onto the extruder | h2c-faq / h2d-pro-faq |
| Auxiliary part cooling | axial, "left side of the chamber", soft rubber mounts, behind the left side panel | left wall, upper half (z about -60..-20, y ~ 330, ~ 80 mm estimate) | blowing +x into the chamber | h2d-intro, h2d-faq (rubber screws) |
| Chamber exhaust | axial, on the RIGHT inner lining behind the activated-carbon filter, soft screws | right wall inside, rear | towards the rear louvres (active chamber exhaust grilles in the rear panel, 2 servo grilles) | wiki replace-chamber-exhuast-fan |
| Chamber heat circulation fan | big axial (~90 mm) behind the PTC plate on the right lining | right wall | into the chamber | wiki repalce-right-inner-lining photo |
| MC board fan | small axial | rear electronics | rearwards | wiki list |
| Built-in air pump (laser version only) | pump | rear | air-assist tube to the laser module | h2d-faq |

Chamber air: automatic top vent (inlet, front top) + active chamber exhaust (rear louvres) + filter switch flap (activated carbon filter cover on the right inside; opens during heat-up). Cooling mode: vents open, exhaust speed rises with temperature (min 30 %). Heating mode: vents closed.
Right inner lining: upper cover with two servos + wind blocker; PTC heating plate (finned, ~150 x 100 mm in the photo) and the circulation fan below it.

## 8. Lights, cameras, screen, ports, power

- **Two chamber LED strips:** left and right crossbeam of the top frame (wiki h2d-intro: "left and right beams each equipped with an LED light bar"; replace-top-chamber-led-cover: strips on the left and right sides of the top frame under snap-on covers, plus pillar LEDs). Position: x ~ +/-190, y just below the top frame (~ 560), running front to back (z ~ -170 .. +180, length ~ 340 mm estimate), emitting down / inwards. The Chamber light can be switched off while printing (AI detection may suffer).
- BamBuddy: ONE `light.chamber_light` that switches both lights; no second entity (docs/printers/bambuddy-entities.md).
- Status indicator light bar under the bed front (colour = state). No entity.
- Cameras (H2D, per wiki h2d-intro): **live camera** 1080p30 (chamber, fixed; position front top of the chamber, exact place unverified), **toolhead camera** 1080p30 (on the toolhead, looks down at the bed / vision encoder), **nozzle camera** 1080p10 (toolhead, looks at the nozzles), **BirdsEye camera** 4K 15 fps in the top frame (laser versions pre-installed, optional for printing; under a cover next to the right LED). BamBuddy: ONE `camera.camera` (the live camera) - the toolhead, nozzle and BirdsEye views have no entity.
- Screen: 5 in 1280 x 720 capacitive touchscreen in the front cover (front photo: dark rectangle at the top-left of the front cover band, ~ 115 x 28 mm; medium-low confidence, not verified).
- **Start / pause button: top right of the front cover** (h2d-faq) - small button; confirms laser jobs, pause / resume for printing.
- Ports: USB-A 2.0 (USB port board, location unverified, front cover side), Wi-Fi (H2D Pro: also 100 Mbit Ethernet board), two spare 4-pin and one 6-pin Bambu-Bus (AMS) on the back, safety key socket (back) / emergency-stop button (laser version, fixed place on the right side of the printer: "mounted on the right side", h2s-faq). No SD slot (USB only).
- Power: inlet with switch at the lower rear, **printer's right** (rear photo: x ~ +179, y ~ 56); safety key must be inserted for power-on (shipped on the rear panel).

## 9. Filament path

- AMS: AMS 2 Pro / AMS HT (and 1st-gen AMS without drying); no AMS lite. Up to 4 AMS 2 Pro + 8 AMS HT. AMS sits on the top cover (or beside). H2D has a **filament buffer** on top at the back: **two channels** (upper = right hotend, lower = left hotend), each with a slider, springs and Hall sensors; 6-pin ports for AMS; air-assist coupler in the middle (laser).
- External spool holders: **two** (upper and lower mounts) on the rear, "slide down onto the upper and lower mounts at the back" (wiki unboxing-h2d), PTFE (340 mm class) to the buffer inlets. Holder base fixed with 2 x ST3x12 on the rear panel right edge seen from behind (= printer's LEFT, x ~ -195, y ~ 360-385).
- PTFE: from the buffer (rear top) PTFE tubes (575-610 mm class) run along the cable chain to the extruder top (two tube couplers on the extruder unit). H2S: single tube, 580 mm.
- **Purge chute:** rectangular opening in the rear panel at about x -84, y 280..410 (rear photo estimate), ~ 67 mm wide x 130 tall (photo-derived; low confidence); purge wiper (pushing plate + receiving plate) plus the silicone nozzle wiper behind the bed at the left rear.
- Activated carbon filter: right wall inside, behind a clip-on cover (accessible with the bed down).

## 10. Laser / cutting module (H2D Laser, H2D Pro / H2S upgrade, H2C)

- 10 W or 40 W blue (450 nm) diode laser block replacing the printing-side toolhead front cover area (quick-release lever on its side), 40 W not for the H2S. Laser platform / cutting platform with slats stand on the bed. Smoke exhaust pipe 102 mm diameter, 2 m, adapter on the rear (visible hose); emergency stop button on the right side of the printer, safety key; BirdsEye camera in the top frame; green PC door and green side windows, black top cover. Processing area 310 x 270 (10 W) or 310 x 250 (40 W).
- Cutting module: pen/blade holder, same quick-release.
- Laser modules and exhaust pipe are the visible differences of a laser unit; for a plain printer model they can be left out.

## 11. Front / back / side features (coordinates in the convention above)

- Front: silver pillars (x +/-215..+249 for the posts), black glass door between them (hinge left, handle at x +195 y 290), black base ring, screen top-left in the front cover band (unverified), start/pause button top-right, status light bar under the bed front, Z screws and guide rods visible at the two front pillars, door sensor magnet at the handle side.
- Top: glass lid; automatic top vent at the front; LED covers along the left and right edge; filament buffer / AP board cover behind the lid at the rear (x ~ +0, y ~ 600).
- Left side: light-grey panel with glass window (not on H2S); aux fan behind it; spool holder base on the rear edge.
- Right side: same panel + window; emergency stop button socket / button (laser) halfway up; right inner lining with the chamber heater / exhaust fan inside.
- Back (from behind, converted to front coordinates; scale 1.587 mm / px horizontally, 1.527 vertically, panel 492 wide):
  - active chamber exhaust louvres (right-from-front half): x +122, y 282..412, ~ 138 wide
  - black duct / purge chute: x -84, y 280..412, ~ 67 wide
  - mesh grilles: x +122 and x -114, y 206..270, ~ 130 wide each; a small lower mesh at x +122, y ~ 150
  - two Wi-Fi antennas (orange, top, from behind right = front left): x -173, y ~ 588
  - filament inlets near the top: x ~ +50, y ~ 580 (oval slot) and a second one lower (low confidence)
  - spool holder base + 2 screws: x -195, y 360-385
  - power inlet / switch: x +179, y 56; safety key and the 6-pin / 4-pin sockets next to the AP board cover at upper rear.
- Bottom: black ring, 4 feet at (+/-217, +/-227).

## 12. Differences between the variants

| Aspect | H2D | H2D Pro | H2S | H2C |
|---|---|---|---|---|
| Nozzles | 2 (left lifts) | 2, tungsten carbide | **1** | left standard + right **Vortek induction** hotend with a hotend rack |
| Heatbed print area | 350 x 320 | same | **340 x 320** | **330 x 320** |
| Height | 325 | 325 | **340** | 325 |
| Side window | glass, light panel | same | **none**, light panel | glass, **dark grey** panel |
| Extra | - | Ethernet, 5.8 GHz Wi-Fi, enhanced toolhead fan, vision encoder in the box | 10 W laser only, one cutter lever (right) | **hotend rack on the right side of the chamber** (below), toolhead enhanced fan with LED row, extra LEDs |
| Weight | ~ 31 (unverified) | 31 | 30 | 32.5 |
| Filament paths | 2 (buffer) | 2 | 1 | 2 + Vortek |

- H2C hotend rack (wiki h2c-intro, induction-hotend-rack-workflow): installed on the RIGHT side of the chamber, fixed with 4 screws; two vertical rows of dock assemblies holding **5 spare induction hotends** (6 in total with the one on the toolhead, docks numbered 1-6, odd / even rows), lifted by a servo + belt, with an induction hotend latch actuator at the toolhead's reach (move left to unlock, right to lock) and a status LED per dock. The top-view photo shows a black frame ~ 3 + 2 docks wide with two guide rods and a motor with cable chains at the bottom. Approximate placement (estimate): x +185..+235 (right wall), z 0 .. +120 (front half), y 320..520. The bed print area is 20 mm narrower.
- H2D Pro: outward identical to the H2D (rear panel gets an Ethernet jack).

## 13. HA entities (docs/printers/bambuddy-entities.md) and what has none

- Entities exist: `light.chamber_light` (one, switches both strips), `camera.camera` (one), `fan.part_cooling_fan`, `fan.auxiliary_fan` (left aux), `fan.exhaust_fan` (chamber exhaust), `fan.ventilation`, `select.airduct_mode` (cooling / heating / laser), chamber heater `number.chamber_target_temperature`, `sensor.left_nozzle_temperature` / `right_nozzle_temperature` (H2S: `nozzle_temperature` only), `binary_sensor.door`, `usb_drive`, `wired_network` (H2D Pro only), `hotend_fan` sensor; H2C nozzle types etc. No `chamber_fan` entity (that is the P1S fan).
- No entity for: the **second light strip**, the status indicator light bar, the toolhead / nozzle / BirdsEye cameras, the start/pause button, the automatic top vent flap and the active exhaust louvres as separate things (only via `ventilation` / `airduct_mode`), the chamber heat circulation fan, the left-nozzle lift state (only the active extruder in the status), the Vortek rack (docks, hotend present, slot), the emergency stop button, the filament buffer state.

## 14. Numbers, sources, confidence

| Number | Value | Source | Confidence |
|---|---|---|---|
| Outer size | 492 x 514 x 626 | wiki/en/h2/manual/h2s-faq, h2d-pro-faq, h2c-faq | official (H2D inferred, same frame) |
| Foot spacing | 435 x 454 | wiki/en/h2/manual/h2s-faq | official |
| Weight | 30 / 31 / 32.5 kg (H2S / H2D Pro / H2C) | same | official |
| Build area / heights | 350 x 320 (H2D), 325 / 320 mm | wiki/en/h2/manual/printable-range-for-dual-nozzles | official |
| H2S build | 340 x 320 x 340 | h2s-faq | official |
| H2C bed 330 x 320; H2C Vortek: 5 + 1 hotends | h2c-intro, induction-hotend-rack-workflow | official |
| Temps 350 / 120 / 65 | h2d-intro, h2c-faq, h2d-pro-faq | official |
| 3 Z screws, 1 motor, belt; front-L, front-R, centre-rear | h2d-intro, h2c-intro, wiki/en/h2/replace-z-axis | official |
| Lift of left hotend, flow blocker | h2d-intro | official |
| Part fan 5015 radial | h2d-intro | official |
| Aux fan left side; exhaust fan right lining; heater PTC right lining | h2d-intro, replace-chamber-exhuast-fan, repalce-right-inner-lining | official |
| LEDs: left and right beam | h2d-intro, replace-top-chamber-led-cover | official (length estimated) |
| Door hinges left, handle right, 4 screws | replace-front-glass-door page photo | photo, high |
| Panel colours / windows | replace-side-panel-with-glass-window, h2c-faq table | official / photo |
| Start button top right of the front cover | h2d-faq | official |
| Screen 5 in 1280 x 720 | h2d-intro | official; position estimate low |
| Cameras live 1080p30, toolhead 1080p30, nozzle 1080p10, BirdsEye 4K15 | h2d-intro | official |
| Rear panel feature positions | rear photo in wiki/en/h2/maintenance/replace-rear-panel (panel width 492) | measured from photo, +/- 10 mm |
| TIP ~ 480, floor ~ 45, door sill ~ 37, head size | derived | estimate, low (+/- 30) |
| H2C rack position (right chamber side) | h2c-intro | official side; coordinates estimate |
| Laser module 10 W / 40 W, areas | h2d-faq | official |

## Summary

1. H2D / H2D Pro / H2S / H2C share a 492 x 514 x 626 mm all-metal CoreXY frame (30-32.5 kg), bed on three belt-driven lead screws (front left / right, rear centre); H2D bed 350 x 320, 350 C nozzles, 120 C bed, 65 C active chamber (PTC + fan on the right wall).
2. Two hotends on one head: the left hotend lifts on a rail with a flow blocker, one extruder with a cam-switched drive wheel feeds both; H2S has one nozzle (bed 340 x 320 x 340), H2C swaps the right hotend for a Vortek induction hotend and a 6-hotend rack on the right wall (bed 330 x 320).
3. Look: light silver front pillars, left-hinged tinted glass door with right handle, black base ring, glass lid, side panels with glass windows (none on the H2S, dark on the H2C), dark rear panel with louvres, mesh grilles, purge chute (x -84), spool holder base on the rear left edge.
4. Two LED strips on the left / right top crossbeams (BamBuddy gives one light entity), left aux fan, right exhaust fan, 5015 part fan; cameras: live, toolhead, nozzle, BirdsEye (one camera entity); 5 in touchscreen, start/pause button top right of the front cover, USB-A.
5. Heights (TIP ~ 480, floor ~ 45), toolhead size, screen and USB positions and the H2C rack coordinates are estimates; the wiki gives no drawing - get a side-on photo before fixing them.
