# Bambu Lab A2L - short reference for a procedural three.js model

Research status (2026-11-06): read in the user's Chrome: wiki `/en/a2l` (page index), `/en/a2l/manual/a2l-intro`,
`/en/a2l/manual/a2l-faq`, the laser / cutting index; web search for date and price. Photos read (second pass, 3D model):
the labelled overview on `/en/a2l`, the photos of `a2l-intro` (front view, toolhead, cutting / pen module, heatbed) and
`/en/a2l/maintenance/replace-spool-holder`. Sizes from the photos are estimates (scaled to the official outer size and
the 330 x 320 plate); see section 7. NOT read: unboxing / frame replacement pages. Coordinates: mm, origin = footprint centre at floor level, X right (seen
from the front), Y up, Z towards the front.

## 1. Identity

| Item | Value |
|---|---|
| Names | A2L, A2L Combo (with AMS lite) |
| Release | announced and on sale **2026-06-01** (4 PM CEST); US 469 USD, Combo 569 USD (EU 379 / 489 EUR) |
| Type | **open-frame Cartesian bed slinger** (heatbed moves in Y, toolhead X on a crossbeam, Z up the two side pillars), "I3 structure"; the A1 concept scaled up ("A-series large format") |
| Model code (BamBuddy) | unknown, read from the printer (not in bambuddy-entities.md) |
| Positioning | "H2S lite" large-format machine for PLA / PETG / TPU, no enclosure, single nozzle |

## 2. Size, weight, volume, temperatures

- Outer size **544 x 529 x 505 mm**, weight **12.8 kg**, print volume **330 x 320 x 325 mm** (+105 % over 256^3; same bed as H2C / H3C, build plates are shared with the H2C).
- Clearance asked: 120 mm front, 250 mm rear, 300 mm above (upright toolhead cable).
- Nozzle **300 C**, bed **80 C** (lower than the A1 on purpose for the grid load), max travel 500 mm/s, acceleration 10 000 mm/s2, 1000 W max.
- Single 0.4 mm stainless-steel hotend (same hotend as the A1, quick-release lever, 0.2 / 0.4 / 0.6 / 0.8 mm, hardened steel optional), hardened-steel extruder gears, **PMSM servo extruder** (filament tangle / air-print detection from the motor resistance), physical nozzle-clumping detection switch in the purge wiper.
- Belts 1.5 GT X / Y, 2 GT Z; 2.4 GHz Wi-Fi only; **MicroSD (32 GB pre-installed), no internal storage**; noise < 49 dB silent / 52 dB standard.

## 3. Kinematics and structure

- Z: **two lead screws + two linear rods** (one on each side pillar), one stepper motor with a synchronous belt linking the screws, quick belt tensioner **next to the right Z pillar**; the crossbeam (gantry) moves up and down.
- X: high-precision **linear rail** on the crossbeam, X motor behind a cover on one end (the live camera sits inside the X-axis motor cover); X belt tension screw at the back of the toolhead.
- Y: heatbed on a horizontal linear guide rail, Y belt tensioner under the Y carriage cover (a lid in the bottom, the wiki mentions two openable covers in the bottom: a small debug port on the left and a larger middle cover over the Y tensioner).
- **Two granular dampers in the frame** (gantry top) suppress resonance. Feet: 4 hard feet + 3 soft ones (one long soft pad in the middle, two small at the front).
- Heatbed: magnets at the four corners to hold the large plate, nozzle wiping plate (steel), textured PEI plate; heatbed also carries the cutting platform for the cutting module.

## 4. Toolhead, filament, 2D

- Toolhead with filament hub (four PTFE lines, filament sensor, tangle detector acting as buffer; AMS lite connects directly), part fan **5015 centrifugal with two opposing outlets**, hotend fan on the **left** side of the toolhead, cutter lever on the extruder, **cutting-module adapter board** in the toolhead, a **Hall sensor for "cutting module present"**.
- AMS: up to 4 AMS + 1 AMS lite = 19 colours; the AMS lite may sit on top of the gantry (more vibration). External spool holder with a 975 mm PTFE tube. The 2nd-gen 4-in-1 adapter is not supported.
- **No laser** (open frame, safety). **Cutting / pen module** on the "external module mounting point": cutting area 300 x 300, drawing 300 x 255, max 0.5 mm; no BirdsEye camera, no emergency stop required; mount calibration each time the motors power on. Cutting Upgrade Kit = module + pen module + cutting platform. See bambu-laser.md.

## 5. Screen, camera, ports

- 3.5 in 240 x 320 touchscreen (compatible with the A1 screen), on a tilted wedge at the front RIGHT of the base (overview photo, label 14), microSD slot at the front of the base (label 15).
- Camera: up to 1080p but only **0.5 fps** live view, fitted in the **X-axis motor cover** (top of the gantry, looks at the bed).
- Power switch assembly + WiFi antenna in the base; purge wiper with chute at the rear of the heatbed area (A1-like, bucket behind the bed).
- No chamber, no chamber light, no door sensor, no chamber fan (so no HA entities for those; only a built-in ambient temperature sensor that warns when enclosed).

## 6. Confidence and gaps

| Number | Value | Source | Confidence |
|---|---|---|---|
| Size / weight / volume | 544 x 529 x 505, 12.8 kg, 330 x 320 x 325 | wiki/en/a2l/manual/a2l-faq | official |
| Temps / speed | 300 C, 80 C, 500 mm/s, 10 m/s2 | same | official |
| Z two screws + two rods, belt | a2l-intro | official |
| Release / price | 2026-06-01, 469 / 569 USD | tomshardware, 3dprinting.com (search) | secondary |
| Geometry (pillar spacing, screen, toolhead size, heights) | none read | - | not researched; scale from bambu-a1.md |

Open points: photos of the frame (wiki `a2l/maintenance/...` replacement guides: frame, X axis, screen) to get the pillar positions, gantry height at the tallest Z and the screen pose. See also bambu-a1.md, bambu-laser.md, bambu-models.md.

## 7. Geometry from the photos (3D model `card/models/bambu.a1/`, variant `a2l`)

| Part | What the photo shows | Value used | Confidence |
|---|---|---|---|
| Frame | A1 concept: two silver extrusion uprights with dark grey caps, a top beam between them, X beam with a dotted steel rail; overview label 1 "Printer Frame" | uprights 40 x 38 at x +-188, top beam underside 468, top 505 | shape photo; numbers estimate |
| Height check | beam top at full Z travel = 70 + 325 + 52 + 13 = 460 < 468 | consistent with 505 total | good |
| Width 544 | base + uprights about 420 wide; the rest is the X beam sticking out (wiper left, motor block right) | base 420, beam +-196 plus wiper / block | estimate |
| Base | white / light grey shallow box, plate almost as wide as the base; screen wedge front right, microSD front | 420 x 430 x 46, screen x +140 | estimate |
| Purge wiper | dark block hanging under the LEFT end of the X beam (label 4) | as A1 | photo |
| Motor block / camera | white box on the RIGHT end of the beam, "A2L" printed; the camera sits in it (label 10) | as A1 block, text "BAMBU LAB A2L" | photo |
| USB-C cable | arcs from the toolhead high over the frame and down the right upright (label 8) | as A1 | photo |
| Toolhead | white front with the round orange-ringed fan face, silver heatsink, DARK GREY hotend cover ("caution hot"), white cutter lever on the right | A1 head | photo (orange ring only approximated) |
| Spool holder | grey two-part arm clipped onto the X CROSSBEAM (not the top beam) at the left end, locking tab at the back; moves with the gantry | post 110 + forearm tilted 17 deg, clip at x -126 | photo for place, sizes estimate |
| Cutting module | charcoal box (about 56 wide) with "Bambu Lab Cutting Module", quick-release lever on the left, small dark nose with the blade at the bottom, takes the place of the toolhead front; pen module: the same box with a white pen in a dark cylinder | 58 x 100 x 46 box, nose 14 x 34, blade tip at the nozzle line (blade version only) | photo for look; sizes from the rail screw pitch, estimate |
| Build plate | textured PEI (brown-gold), black base plate with stickers | 330 x 320 | spec |

Model: `CFG.a2l` in `00-constants.js`; the cutting module appears with `fitted=cutter`; the pen variant is not drawn.
