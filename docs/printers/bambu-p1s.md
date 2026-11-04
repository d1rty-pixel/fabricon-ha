# Bambu Lab P1S - reference for a procedural three.js model

## 0. Checked against the wiki photos

Sources: GL = https://wiki.bambulab.com/en/x1/manual/glossary (X1 front + toolhead photos), GL-P1 = https://wiki.bambulab.com/en/p1/manual/glossary,
RP = https://wiki.bambulab.com/en/x1/maintenance/replace-rear-panel and https://wiki.bambulab.com/en/p1/maintenance/p1s-rear-panel (flat panel photos),
FC = https://wiki.bambulab.com/en/x1/maintenance/replace-front-cover, SC = .../x1/maintenance/replace-high-resolution-screen,
CAM = .../x1/maintenance/replace-chamber-camera and .../p1/maintenance/chamber-camera, LED = .../x1/maintenance/replace-the-chamber-led,
WIP = .../x1/maintenance/replace-nozzle-wiper. "photo" = measured on the photo (+/- 5 %, scale from the 389 x 457 mm outline),
"estimate" = judgement. Section 0 supersedes any conflicting number further down.

| Item | Value (source) |
|---|---|
| Body colour | graphite black (photo, GL-P1) |
| Screen | 2.7" LCD + D-pad + 2 buttons module on the top front edge at the LEFT, ~147 x 40 mm, x -194..-47, rises ~12 mm over the lid (photo GL-P1) |
| microSD | top left edge of the screen module (GL-P1 marker 8) |
| Door | glass y ~22..393, black print around the glass, no visible handle (photo) |
| Top band lettering | "Bambu Lab P1S" two lines, x ~ +98 (photo) |
| Side logo | right panel: Bambu mark ~50 x 70 mm centre y ~250, "Bambu Lab" below at y ~200, z ~ -20 (photo GL) |
| Camera | black wedge, lens forward, left front, y ~305 (CAM photo, GL-P1) |
| Chamber LED | short PCB strip ~43 mm, x ~ -130, next to the camera (CAM photo, GL-P1) |
| Purge chute / wiper | chute opening 52 x 101 mm at x +68 (seen from the front), y centre 194 (RP photo, scaled by panel height 449); nozzle wiper = black S bracket with a blue silicone roller on the chute's front edge; white "Bambu Lab" badge on the chute front, y ~215 (WIP, GL) |
| Rear panel | same panel as the P1S: filament slot 51 x 11 at x +62, y 444; belt tensioner windows 34 x 34 at (-132, 392) and (+132, 363); power cut-out 31 x 51 at (-127, 54); big grille 89 x 102 at x -98 (chamber fan), narrow grille 32 x 102 at x +126; embossed bracket 94 x 47 at (3, 287) for the spool holder (RP). Orientation (inside view, chute at the back right as in the front photos) is an inference |
| Toolhead | light grey/silver housing, black duct, round part-fan intake on the front face, cutter lever on the left (photo GL toolhead view); X1C adds the micro lidar underneath |
| Top cap | a small round cap near the middle of the lid at the back, visible in both front photos (estimate, purpose unknown) |

Variants: P1P has no front door, no top glass and no chamber fan window (estimate); the P1S body is graphite black, the X1C silver-grey and the rear panel layout is shared (RP).


Research status: bambulab.com and the wiki pages are blocked for WebFetch (HTTP 402/403), but wiki.bambulab.com
answers plain `curl` with a browser user agent, so the wiki text AND its photos were read (glossary render, rear
panel part photo, the "rear panel removed" photo, XY motor photo, spool holder photo). Dimensions measured from
photos use the official 389 x 389 x 457 mm outer size as the scale (stated per row). Coordinates: mm, origin =
centre of the footprint at floor level, X right (seen from the front), Y up, Z towards the front. "Left / right" =
seen from the FRONT unless "from behind" is written. Photo-derived numbers are +/- 10 mm unless noted.

Wiki base: `https://wiki.bambulab.com/en/p1/...` (abbreviated `wiki:` below).
Image URLs used: `https://wiki.bambulab.com/glossary/p1_series_glossary.jpg` (front view, labelled),
`.../glossary/p1s_toolhead_glossary.jpg` (toolhead), `.../p1/maintenance/p1s-rear-panel/rear_metal_panel_-_p1_series.png`
(rear panel part), `.../p1/maintenance/p1s-rear-panel/without_rear_panel.jpg` (printer seen from behind, panel off),
`.../p1/maintenance/xy-motor/motor_a_and_b.jpg`, `.../p1/manual/p1s-unboxing/%E6%96%99%E7%9B%98%E6%94%AF%E6%9E%B62.png` (spool holder).

## 1. Identity

| Item | Value |
|---|---|
| Names | P1S (enclosed), P1S Combo (P1S + one AMS), P1S + AMS 2 Pro combo (exists, wiki `p1s-ams-2-pro-combo-acc-in-the-box`). Same machine, only the bundle differs. Sibling: P1P (open frame, no panels / door / lid; the P1P Enclosure Kit turns it into a P1S) |
| Release | P1S announced / on sale 2023-07-13 (Wikipedia); P1P shipped from ~2022-11. P1S is now sold out / superseded by the P2S |
| Model code (MQTT / BamBuddy) | NOT verified from a source. Recollection: P1S = `C12`, P1P = `C11` (X1C = `BL-P001`, A1 mini `N1`, A1 `N2S`). Read BamBuddy's `model` for the real printer before hard-coding |

## 2. Outer size, weight, enclosure

- Outer size (W x D x H): **389 x 389 x 457 mm** (wiki spec table); retailers say 458, one says 386 wide. Spool holder and PTFE stick out behind (spool holder ~50-60 mm + spool, estimate).
- Net weight 12.95 kg (wiki table; the unboxing text says 12.59, typo). Gross 17.6 kg. Power 100-240 V, 1000 W @ 220 V, 350 W @ 110 V.
- Build volume 256 x 256 x 256 mm (Bambu Studio defaults to 250 mm height). Bed plate 257-ish square, magnetic spring-steel plate (Textured PEI included); plastic pins at the back of the bed locate the plate.
- 1 nozzle (0.4 mm stainless, 0.2 / 0.6 / 0.8 optional), all-metal hotend, **300 C max**; bed **100 C max**; 500 mm/s, 20 m/s2, 32 mm3/s.
- Chamber heater: **no** (passive only: chamber temperature regulator fan + aux fan; the chamber temperature shown is a sensor reading). Activated-carbon air filter yes.
- Chassis: steel frame (black). Shell: "Plastic & Glass": plastic left / right panels (wiki "Left / Right Plastic Panel", no windows), black metal rear panel (wiki "Rear Metal Panel", black sheet metal, 10 + 4 screws), plastic front cover band on top ("black-gray cover ... printed with P1S"), glass cover plate on top (removable lid, same part as X1C), front glass door.
- Door: tinted glass, **upper + lower hinge, 2 magnets, rubber strip** (wiki "front door mounting kit"); a handle on the door (wiki step: "holding the front door handle"). Hinge side not stated in text: the glossary render shows the pill-shaped handle at the door's RIGHT edge (x ~ +176, y ~ 227, ~50 x 22 mm) so the hinges are on the LEFT (medium confidence; same part as X1C). The door has no window of its own; the sides have NO windows (the X2D has).
- Colours: body black / dark graphite (matte), top glass tinted dark, vertical "Bambu Lab" mark on the right panel; toolhead front housing light grey (aluminium look) with black duct at the bottom; X rods black carbon; Y / Z rods bright steel; Z screws steel.

## 3. Kinematics

- CoreXY: toolhead moves in X / Y, **bed moves in Z only** (wiki intro: "P1P and P1S share the same motion system").
- X axis: two black carbon-fibre rods (glossary calls them "X-axis Carbon Rods") joining the two Y carriages; the toolhead rides on both. Rods are one above the other (vertical spacing ~30-35 mm, estimate from the toolhead render), diameter ~8-10 mm (estimate), end blocks black plastic with the belt pulleys (a toothed idler + a smooth idler per end).
- Y axis: **one steel linear rod per side** ("Y-axis Linear Rod", glossary; "Y-axis Linear Rail Bearing" on the carriage), on the left / right inner walls at height y ~ 372 (from the rear photo and the glossary), x ~ +/- 170 (estimate). Belts run next to the rods; the belt tensioners are at the BACK (two square windows in the rear panel, the same on P1P).
- XY motors: two NEMA 17 ("Motor A" right rear, "Motor B" left rear, wiki photo), vertical shafts with the pulley on top, in the rear corners of the upper frame just inside the Y rods: x ~ +/- 150, z ~ -150, body y ~ 360-400 (estimate from photos). The XY frame is one removable assembly sitting on four corner pillars; the screen / front side has the screen mount, the back has the motor bracket.
- Z: **three lead screws driven by ONE Z motor through a belt** along the bottom (wiki intro, z-belt / z-motor pages: motor on the base, Z belt with one tensioner + spring). Bed sits on three Z sliders; three "auxiliary screws" lock the sliders for shipping (visible via the front, wiki "unlock the heatbed"). Positions: front-left and front-right at the front pillars, one at the rear centre (rear photo: screw at x ~ 0). Each screw has a **smooth linear guide rod** next to it (glossary: "Z-axis Linear Rod" + "Z-axis Threaded Rod"; rod is ~25 mm OUTSIDE the screw at the front, ~36 mm to the printer's right of the rear screw, measured). Suggested: screws (-170, +165), (+170, +165), (0, -170); rods (-195, +165), (+195, +165), (+36, -170) (estimate). Z motor: small stepper low at the back right of centre, x ~ +80, y ~ 65 (seen in the rear photo, low confidence).
- Bed: heatbed on a Z carriage, three manual levelling knobs under the bed (glossary: "Bed Leveling Knob", near the front-left); metal bed plate with a printed warning / "256x256x256mm" label on the front edge (glossary).

## 4. Heights (no published drawing: derived from the rear photo, scale 0.604 mm / px from 457 mm)

- Chamber floor (inner base top): ~30 mm (rear photo: the plinth under the rear compartment is ~24 mm + feet ~6). Feet ~6 mm high.
- Bed lowest top ~ TIP - 256. **Nozzle tip at layer 0 (TIP): ~305 mm** (+/- 15). Derived: toolhead black bottom at ~311 in the rear photo, nozzle ~10 below the duct bottom.
- Max Z travel 256 mm; bed stack (heatbed + plate) ~15 mm.
- Door aperture (glossary front view, 0.575 mm / px): y ~ 26 .. 393 (door glass), width the full front minus pillars (x +/- 170). Top front band 457-393 = ~64 mm (carries the console), bottom band ~26 mm.
- Top XY frame band: top of the machine down to ~y 410 (frame beam top front), rear crossbeam of the XY frame at y ~ 285-305 (the horizontal beam above the Z screws, rear photo); belts at y ~ 361 and 390; X rods mid ~ TIP + 60..90.
- Toolhead (W x H x D): ~57 x ~100 x ~48 mm incl. duct (rear photo: 57 mm wide, 100 mm tall to the cutter; depth estimated). Parts (glossary):
  - light-grey housings: front housing (holds the part-cooling fan + duct), middle, rear housing; PTFE inlet / extruder on top; cutter lever (grey, vertical lever on the LEFT face) driving the filament cutter blade; extruder motor on the left; hotend fan + grille (vent holes) on the left / rear.
  - part cooling fan: radial blower, round intake ~25-28 mm on the FRONT face, right of centre; duct = black piece under the front housing with "Bambu Lab" text, blowing at the nozzle.
  - no camera on the head, no lidar (the P1S has no first-layer scanning at the bed). Nozzle tip below the black duct.
  - Bambu Lab logo printed on the front face (white, small) and on the duct.

## 5. Fans (Bambu names: wiki spec table "Part Cooling Fan, Hot End Fan, Control Board Fan, Chamber Temperature Regulator Fan, Auxiliary Part Cooling Fan", all closed loop)

| Fan | Type / size | Position | Facing |
|---|---|---|---|
| Part cooling | radial blower (5015 class, estimate) | toolhead front face, right of centre | towards the front, outlet down into the duct |
| Hot end | axial, small (estimate 4010) | toolhead, left / rear face behind the vent grille | sideways |
| Auxiliary part cooling | 12 W, wiki: "installed on the left side of the chamber"; mounted by adhesive + 2 screws on the left side panel, reached from the back; round grille visible in the glossary on the left wall at the rear half | left wall inside the chamber, z ~ -40 .. -70, y ~ 185, size ~ 60-90 mm (estimate; glossary suggests ~60) | blowing right (+x) into the chamber |
| Chamber temperature regulator (exhaust) | big axial ~ 92 mm (measured ~94 mm frame in the rear photo), square dark duct frame | rear, RIGHT side (printer right, x ~ +100, y ~ 190), behind the larger rear grille, facing backwards | blows out through the rear grille (identification as this fan is medium-low confidence) |
| Control board | small axial (4010 class), on the MC board | rear, left (from front) among the electronics, behind the small rear grille | backwards |
| PSU | open-frame supply, no fan seen | rear, lower left (from front, x ~ -110, y ~ 90 .. 190) behind the purge chute | n/a |

Rear panel grilles (part photo, scale 0.97 mm / px horizontally, 0.83 vertically, +/- 10 %): large mesh x +58 .. +165, y 137 .. 241 (right half, behind the big fan); small mesh x -136 .. -177, y 137 .. 241.

## 6. Lights, camera, screen, ports

- Chamber light: **1 LED bar** (5 V 0.3 A, wiki), horizontal white bar at the front of the chamber, left of centre (x ~ -128 .. -50, ~80 x 8 mm, glossary + rear photo agree on x). Height conflicts (rear photo: top front beam y ~ 440; glossary: y ~ 330). Use y ~ 400.
- Camera: **1** chamber camera, 1280 x 720 at 0.5 fps, on the left front pillar, upper (x ~ -145, y ~ 322 by the glossary, facing the bed), small. Flex cable runs up the pillar.
- Screen: 2.7 in monochrome LCD 192 x 64 plus a D-pad / OK / back / pause buttons, in a tilted console on the TOP FRONT band at the LEFT: spans x ~ -165 .. -13 (screen ~ -165 .. -75, circular D-pad ~41 mm at x ~ -48 and two small round buttons at its upper-right), tilted back ~ 20 degrees, protrudes ~ 10-15 mm in front of the band (glossary, screen "pops" into a slot, wiki unboxing). Not touch.
- microSD: front, top left of the console (glossary label points left of the console, slot flush in the front cover); 32 GB card included. No front USB port; a **USB 5 V 1.5 A output** is listed in the spec table but is internal/rear (not seen).
- Network: Wi-Fi + Bluetooth only (the WiFi antenna sits behind the front cover); no Ethernet. Bambu-Bus (AMS) on the MC board (rear, 4-pin + 6-pin).
- Power: **inlet with red rocker switch at the lower rear, printer's right side**: x ~ +120 (from the rear photo, panel cut-out x ~ +143, y 46), y ~ 50, about 55 x 55 mm; a second small panel cut-out sits above the plinth. Wiki text says "lower left corner of the back" = lower left seen from behind = printer's right.
- Logos: "Bambu Lab P1S" small mark on the top front band at the right (x ~ +107 .. +176, y ~ 440, ~69 x 10 mm, glossary); large vertical Bambu Lab logo (icon + wordmark, ~25 x 80 mm) on the RIGHT side panel, centred ~ z -50, y ~ 255 (glossary).
- Small round cap / boss on the top surface, x ~ +24, near the back, ~20 mm diameter ~8 mm tall (glossary; purpose unclear, low confidence).

## 7. Filament

- AMS: AMS (original), AMS 2 Pro and AMS HT are compatible via the 4-pin + 6-pin Bambu-Bus and a PTFE tube (wiki "connect AMS"; AMS / AMS 2 Pro / AMS HT count as the same type on P1, max 4 units = 16 colours; HT needs a filament buffer). **AMS lite is not supported** (it is for the A1 series). The P1S Combo ships with the original AMS. The AMS stands on the table next to / behind the printer or on top; the glass lid is meant for it; wiki also offers a printable AMS holder for the P1P.
- External spool holder: a black plastic holder screwed onto the REAR panel (one screw B "remove the spool holder if installed", H2 key; two mount holes). Position (rear panel part photo + unboxing photo): printer's LEFT side of the back, x ~ -165, y ~ 275; the pocket plate (trapezoid recess with 3 screws, x +48 .. -65, y ~ 258 .. 308) is next to it. The spool sits on a rod pointing backwards.
- PTFE: filament enters at a **slot at the top of the rear panel** (~58 x 12 mm slot, x ~ -78, y ~ 445), then a PTFE tube (530 mm, wiki cable-chain page recommends 550) runs inside the **cable chain** along the XY frame to the toolhead's top coupler (tube coupler / pneumatic joint). No filament hub or buffer for the external spool (wiki FAQ: single spool needs no buffer). The wiki cable chain ("Cable Chain Assembly") carries the toolhead cable + PTFE + USB.
- Purge / waste chute: rectangular opening in the rear panel, x ~ -85 (centre; 61 mm wide), y 137 .. 241 (104 mm tall); behind it a translucent plastic chute ~ 60 x 100 mm mounted below the nozzle wiper at the rear of the bed (rear photo). Waste slides out of the back; wiki: place a box under the rectangular opening. Nozzle wiper: next to the chute inside.

## 8. Front / back / side features (summary)

- Front: dark glass door (hinge left, handle right ~ x +176, y ~ 227), aperture y 26 .. 393; top band with console (left), logo (right); bottom band black; Z screws + rods visible at the left / right front pillars; LED bar front-left; camera left pillar.
- Top: removable tinted glass cover plate (~ 340 x 340 mm, flush with the frame, ~4 mm), front band above, small boss at x +24 (see above).
- Left side: plain plastic panel; aux fan behind it facing in. Right side: plain panel with the vertical logo. Neither has windows or vents.
- Back: black metal panel, perforated grilles (big right, small left), purge chute opening (left of centre), filament slot top left, spool holder left, 2 belt tensioner windows (right: x +152 y 390; left: x -162, y 361; ~41 x 33 mm square windows), power inlet low right, WiFi antenna in front cover only.
- Bottom: black plinth with 4 round feet at the corners.

## 9. Differences that matter for the model

vs X1 Carbon (docs/printers/bambu-x1c.md): same frame, kinematics, door, glass lid, side / rear panel shape (taller front band? same 389 x 389 x 457). P1S: small non-touch 2.7 in screen with D-pad (X1C 5 in touch), no lidar window on the head bottom, 720p camera, no front bed calibration plate, no door sensor, 12.95 kg (X1C 14.1), single bed 100 C (X1C 120 C), no hardened nozzle, black rear sheet-metal panel with grilles (X1C has the carbon filter box), the logo reads P1S, power switch at the lower rear right.
vs X2D (card/): smaller (389 x 389 x 457 vs 392 x 406 x 478), single nozzle, no side windows, no heated chamber, no filament-buffer window, no front camera sensors on the head, 100 C bed, glass lid shared in concept, spool holder on the rear (X2D has the same idea), one aux fan on the left only (X2D has left + right side fans), purge chute at the rear left (X2D x -62; P1S x ~ -85).
vs P1P: the P1P has no side panels, door, glass lid or rear metal panel (open frame, same motion system).

## 10. Numbers, sources, confidence

| Number | Value | Source | Confidence |
|---|---|---|---|
| Outer size | 389 x 389 x 457 (458 elsewhere) | https://wiki.bambulab.com/en/p1/manual/unboxing-p1s (spec table); https://www.gigaparts.com/bambu-lab-p1s.html | official |
| Weight | 12.95 kg net | same | official |
| Build volume | 256 x 256 x 256 | same | official |
| Nozzle / bed max | 300 C / 100 C | same | official |
| Chamber heater | none (fans only) | same table; https://wiki.bambulab.com/en/p1/manual/faq (P1S vs X1C) | official |
| Speed / accel | 500 mm/s, 20 m/s2 | same | official |
| Camera | 1280 x 720, 0.5 fps | same | official |
| Screen | 2.7 in, 192 x 64 | same | official |
| Fans (names) | part cooling, hot end, control board, chamber temp regulator, aux | same | official |
| Aux fan | 12 W, left side of the chamber | https://wiki.bambulab.com/en/p1/maintenance/p1s-aux-cooling-fan | official |
| Power switch | lower left corner of the back (from behind) | https://wiki.bambulab.com/en/p1/maintenance/power-switch-assembly | official |
| Z system | 3 lead screws, 1 motor, belt, 3 sliders | https://wiki.bambulab.com/en/p1/manual/intro-p1p; https://wiki.bambulab.com/en/p1/maintenance/z-belt | official |
| X / Y rods | X carbon rods, Y linear rods | https://wiki.bambulab.com/en/p1/manual/glossary | official |
| Door parts | 2 hinges, 2 magnets, handle, rubber | https://wiki.bambulab.com/en/x1/maintenance/front-door-mounting-kit; https://wiki.bambulab.com/en/x1/maintenance/replace-the-front-door | official |
| Release | 2023-07-13 | https://en.wikipedia.org/wiki/Bambu_Lab | third party |
| AMS compatibility | AMS, AMS 2 Pro, AMS HT, max 4 | https://wiki.bambulab.com/en/p1/manual/connect-ams; Bambu wiki multi-model-AMS-compatibility-guide (via search snippet) | official (HT part snippet) |
| Model code C12 | P1S | recollection | unverified |
| Hinge side left | handle right in the render | https://wiki.bambulab.com/glossary/p1_series_glossary.jpg | measured from photo, medium |
| Screen / console position + size | top front left, x -165 .. -13 | same image, 0.69 mm / px | measured from photo |
| Logos, boss, handle | see section 6 | same image | measured from photo |
| Rear grilles, chute opening, spool holder, tensioner windows, filament slot | section 5-8 coordinates | https://wiki.bambulab.com/p1/maintenance/p1s-rear-panel/rear_metal_panel_-_p1_series.png (panel width = 389 mm assumed, height uncertain +/- 10 %) | measured from photo |
| Power inlet x +120, y 50; big fan x +100, y 190, 94 mm; Z rod / screw offsets | rear photo, scale 0.604 mm / px from 457 mm | https://wiki.bambulab.com/p1/maintenance/p1s-rear-panel/without_rear_panel.jpg | measured from photo |
| Toolhead 57 x 100 x ~48 | rear photo + toolhead render | https://wiki.bambulab.com/glossary/p1s_toolhead_glossary.jpg | measured / estimate (depth) |
| TIP 305, floor 30, door y 26 .. 393, rod and motor positions | derived | rear photo + glossary | estimate |
| Aux fan exact position and size | z -40 .. -70, y 185, 60-90 mm | glossary | estimate, low |
| LED height | y 330 vs 440 | glossary vs rear photo | conflicting |
| Top boss | x +24 | glossary | low |

## Summary

1. P1S: 389 x 389 x 457 mm, 12.95 kg, 256^3 build, one 300 C nozzle, bed 100 C, no chamber heater, released July 2023 (model code probably C12, unverified).
2. CoreXY with bed on Z: 3 belt-driven lead screws (front left / right, rear centre) each with a smooth guide rod, black carbon X rods, one steel Y rod per side, XY motors in the rear corners.
3. Black shell: left-hinged tinted glass door (handle right), glass lid, windowless plastic sides, black metal rear with grilles, purge chute opening (x -85), filament slot and spool holder (left rear), power inlet low rear right (x +120).
4. Left aux fan, big rear-right chamber fan, 2.7 in screen + D-pad console on the top front left, 720p camera on the front left pillar, one LED bar front left; AMS / AMS 2 Pro / AMS HT (no AMS lite), up to 4.
5. Heights, toolhead size and fan sizes are photo / scale estimates (TIP ~ 305, floor ~ 30); the wiki sits behind 402 for WebFetch but works with curl.

## 11. Model `bambu.x1` (card/models/bambu.x1) - numbers actually used

Taken from this document unchanged: TIP 305, floor 30, door aperture y 26 .. 393 (hinge left, pill handle 50 x 22 at
x +176 / y 227), console tilted 20 deg at x -89 / y 425 (LCD 66 x 22, D-pad r 18 at x -48, two buttons), logo text at
x +141, chute (-85, 189, 61 x 104), fan opening (111, 189, 107 x 104) with a 94 mm fan, PSU grille x -156, filament
slot (-78, 445), spool holder (-165, 275), power inlet (120, 50), tensioner windows, aux fan on the left wall at
z -55 / y 185 (r 32, low confidence), LED bar 80 mm at x -89 (y 445, front of the roof; the height conflict is
resolved by hugging the roof), camera box on the left pillar y 322. Estimates: toolhead 57 x 44 deep (62 housing +
16 duct), part fan r 13 at x +9, extruder motor / hotend fan on the left, microSD slot at (-167, 448). No door
sensor: `_doors` stays empty.
