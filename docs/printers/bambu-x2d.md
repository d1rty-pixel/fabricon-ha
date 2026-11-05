# Bambu Lab X2D - short reference (facts from the wiki FAQ; geometry lives in card/models/bambu.x2d)

Research status (2026-11-06): read in the user's Chrome: wiki `/en/x2d` (page index) and `/en/x2d/manual/x2d-faq`; web
search for the launch. No photos were measured here (the model in card/models already has the geometry). Coordinates:
mm, origin = footprint centre at floor level, X right (seen from the front), Y up, Z towards the front.

## 1. Identity

| Item | Value |
|---|---|
| Names | X2D (standalone with filament buffer), X2D Combo (with AMS 2 Pro; the FAQ calls the combo "X2DC") |
| Release | announced / on sale **2026-04-14**; US 649 USD, Combo 899 USD |
| Series | successor of the X1 series (not upgradable); X-series flagship |
| Model code (BamBuddy) | see docs/printers/bambuddy-entities.md |
| Laser / cutting | **none** (not in the wiki laser index) |

## 2. Numbers

- Outer size **392 x 406 x 478 mm** (same as the P2S), net weight **16.25 kg**.
- Build volume: main hotend 256 x 256 x 260; auxiliary hotend 235.5 x 256 x 256; common (both nozzles) 235.5 x 256 x 256. Same 256 mm plates as the X / P / A series, not 1st-gen plates.
- Nozzle **300 C**, bed **120 C**, **active chamber heating to 65 C** (PTC heating wire + circulation fan on the **left** of the chamber; adaptive airflow switching unit on the **right** side; exhaust fan on the rear panel). Speed 1000 mm/s travel, 20 000 mm/s2; the auxiliary extruder is limited to 200 mm/s and 1000 mm/s2.
- Power 1600 W @ 220 V / 1100 W @ 110 V; Wi-Fi dual band, no Ethernet; USB-A (no stick in the box), internal storage; noise < 50 dB silent.
- Side panels PC + ABS, **plastic side windows**; top glass cover is the same as the P2S.

## 3. Kinematics

- CoreXY, bed moves in Z; **X axis hollow steel rod** (no carbon rods), belt tensioners at the rear; Z lead screws + Z belt (replacement guides list a "Z-axis leadscrew kit", "Z tensioner cover"; layout like the P2S: three screws, front left / right and rear centre - not verified in this pass).

## 4. Two hotends and two extruders

- **Two identical hotends** (left and right, interchangeable) on one toolhead: the toolhead carries a **main extruder** (self-developed servo motor, hardened-steel gear; feeds the right / main hotend, the only one with automatic dynamic flow calibration and TPU) and the **auxiliary extruder** is a **remote extruder on top of the rear panel**: it pushes filament from the buffer through a 525 mm PTFE tube to the auxiliary hotend (stepper motor). A **flow blocker** replaces the nozzle lift of the H2D.
- No cutter lever on the head: the toolhead goes to the middle of the chamber and a **filament cutter stopper** extends from the rear to push the left / right cutter levers.
- Filament: buffer with two 6-pin ports on top (one AMS chain, one exhaust-fan cable), up to 4 AMS 2 Pro + 8 AMS HT, 25 colours; first-gen AMS works (no drying), no AMS lite / hub. Optional **Filament Track Switch** (arbitrary AMS-to-hotend mapping) and TPU feed assist module.
- Cameras: live view 1920 x 1080 30 fps, toolhead camera 1600 x 1200 30 fps; optional Vision Encoder. Detection: spaghetti, foreign object, clumping, plate type, purge-chute pile-up, door, chamber temperature.
- Wiki part list mentions left LED / AP-board cover ("AP Board Cover/LED Light - Left"), purge wiper assembly, air filter, spool holder, tube organiser, ventilation pipe kit.
- Space: 500 x 700 x 600 mm (X2D), 500 x 700 x 850 mm with AMS on top (X2DC).

## 5. Pointers

- Geometry, fans, light and camera positions: card/models/bambu.x2d (not re-measured here); the P2S doc (bambu-p2s.md) shares the 392 x 406 x 478 frame.
- Unannounced "X2D Pro" appears as an FCC grant (2026-09-11) only.

Confidence: sizes, temperatures, volumes, extruders, fans = official (wiki FAQ); launch date / price = secondary (press, 2026-04).
See also bambu-models.md.
