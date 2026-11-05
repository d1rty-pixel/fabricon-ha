# Bambu Lab laser and cutting modules - what exists, what fits where, what changes the look

Research status (2026-11-06): read in the user's Chrome on wiki.bambulab.com: "Laser and Cutting" index
(`/en/laser-cutting-module`), H2 laser pages (`/en/h2/manual/laser-faq`, `laser-setup`, `cutting-module`, `cutter-setup`,
`/en/h2/laser-safety-document`, `/en/h2/maintenance/laser-module-40w`), the R1 pages (`/en/r1`, `r1/manual/r1-intro`,
`r1/manual/faq`), `a2l/manual/a2l-faq`, `a2l/manual/a2l-intro`, `h3c/manual/faq` ("2D Functions"), `x2d/manual/x2d-faq`.
The Bambu store / product pages were not readable (permission denied), prices come from web search results. The wiki
pages describe the modules but I saw NO close-up photo of the laser module in this session; the module's outline is
taken from the existing docs/printers/bambu-h2d.md (estimate). Coordinates: mm, origin = footprint centre at floor level,
X right (seen from the front), Y up, Z towards the front.

## 1. Overview (who can do what)

| Machine | Laser (blue diode) | Cutting / pen module | Notes |
|---|---|---|---|
| H2D, H2D Laser Full Combo | 10 W and 40 W | yes (blade, pen) | laser editions sold as combos (module + BirdsEye + safety parts) or as upgrade kit |
| H2D Pro | 10 W and 40 W (store lists H2D Pro as compatible) | yes | same frame as the H2D |
| H2S | **10 W only** (40 W not supported) | yes | single nozzle, no side windows; cutting area 297.5 x 300 |
| H2C | 10 W and 40 W ("H2C Laser Full Combo") | yes | Vortek induction hotend rack is on the right wall |
| X2D | **none** (no laser or cutting page in the wiki, laser index lists only H2 series + A2L cutting) | none | one comparison blog claims options; the wiki contradicts it |
| P2S, P1S, P1P, X1C, X1E, A1, A1 mini | none | none | |
| **A2L** | **none** ("for safety reasons related to open-frame machines") | **yes**: cutting / pen module on an "external module mounting point", needs no emergency stop | cutting area 300 x 300 |
| **H3C** | **none** (wiki FAQ) | **yes**, but as "CraftTool": CutTool / DrawTool bases that hang on the Swaptek rack | see section 6 |
| **R1** | **55 W CO2 glass tube** (standalone laser cutter, not a 3D printer) | no | see section 7 |
| P3C, X2D Pro | unknown | unknown | only FCC grants (2026-09-15 / 2026-09-11), not announced |

## 2. H2-series laser module (10 W "SL001", 40 W "SL002")

- **Type:** semiconductor (diode) laser, **455 nm +/- 5 nm blue** processing laser + **850 nm +/- 5 nm infrared** height-measuring laser (micro lidar, +/- 0.1 mm). Module itself is Class 4; with the printer's interlocks the whole machine counts as Class 1 (laser safety document).
- **Power:** 10 W +/- 1 W (spot 0.03 x 0.14 mm; max engraving speed 400 mm/s; max cutting 5 mm basswood plywood) and 40 W +/- 2 W (1000 mm/s; the 40 W module is wider than the H2S head and not supported on the H2S).
- **Work area:** 10 W: 310 x 270 mm, height range 0-280 mm; 40 W: 310 x 250 mm, 0-265 mm (wiki R1 FAQ comparison table).
- **Positioning:** visual, < 0.3 mm, with the BirdsEye camera; "Laser Module Begin Setup" and "Mount Calibration" (after each power-on) put the machine into absolute-position mode.
- **Mounting (wiki laser-setup):** remove the toolhead front cover (press the two top corners), unlock the **quick-release lever** on the side of the module, slide the module down onto the toolhead slots, align the "Click" mark, lock the lever, open the dust cover and plug the connector into the toolhead interface. A black **air-assist tube** runs from the module to the **air-assist coupler in the middle of the filament buffer** on the printer's top rear, along the cable-chain clips (remove it when not lasering, otherwise the chain is restrained). So the module REPLACES the printing toolhead cover and sits at the front of the toolhead, hanging on the carriage in front of / below the hotends (the hotends stay behind it).
- **What the module looks like (wiki maintenance page + h2d doc):** a boxy aluminium-and-black housing with a **heat-sink and fan on top** under a screwed top cover (6 screws), an **LED indicator** plug, the **air-assist tube coupler** at the top rear, and at the bottom: **air-assist nozzle / air concentrator**, laser lens (under the hexagonal nozzle on the 10 W, octagonal on the 40 W), **flame sensor + temperature sensor** at the front end, and the **height probe**. Estimated size 50 x 90 x 50 (+/- 20, no photo read).
- **Built-in air pump:** the laser version of the printer has an air pump (30 kPa, 30 L/min) behind the rear panel; shipping screw to remove first. Smoke: a **ventilation pipe adapter, outer diameter 100 mm** on the rear (2 m pipe; the h2d doc has 102 mm) leads smoke outside or to a purifier; a recommended Bambu Smoke Purifier / E1 (E1 Pro for R1 only).
- **Safety parts (these change the look of the printer):**
  - **Green laser-safety windows**: front door glass and both side windows become green PC; the top glass cover is replaced by a **black laser protection plate** ("The top laser protection plate filters out the laser"; also "top glass cover" interlocked).
  - **Emergency stop button** on the **right side** of the printer (mushroom button, supplied with the module, plugs into the side) and a **safety key** (USB-like key inserted at the rear; laser functions only with the key).
  - **Physical start button**: after sending the job the user must press the **button at the top right of the front cover** (hold about 1 s) or "Start" on the screen.
  - Door, top-cover and window sensors cut the laser; drop / communication protection in the module; flame (sensor + vision + temperature) detection with buzzer; installation detection; platform check (the wrong pad blocks the job).
- **Camera:** **BirdsEye camera** (4K class, in the top frame next to the right LED under a cover) is pre-installed on laser editions, optional for printing and cutting; used for "Capture image" in Bambu Suite. Toolhead camera and nozzle camera exist anyway.
- **Platforms (placed on the heatbed instead of the build plate):** laser platform / base with **slats pack** (support blades) and **grid panel**; cutting platform with cutting mats (StrongGrip / LightGrip); support module SLA027 for charred supports. Without the support the height measurement is 15 mm off.
- **Price (web search, may be stale):** module 10 W 299 USD, 40 W 949 USD; combos 10 W 2549-2799 USD, 40 W 3199-3499 USD; H2C laser combos 2999-4199 USD.
- **What changes in the printer's look when it is fitted** (for the 3D model): green windows and door, black top plate instead of glass, red emergency-stop mushroom on the right wall, a thick smoke pipe on the rear (exact outlet position NOT verified; the rear adapter is a 100 mm round port, likely at the upper rear), the laser box on the toolhead (printing hotends hidden behind it), the laser platform (slatted, light grey/black) on the bed, black air-assist tube along the cable chain.

## 3. H2-series cutting / pen module (also A2L)

- Same quick-release interface: **cutting module base** (aluminium cylinder with a spring-loaded **45 degree fine-point blade** in a blade holder) or **pen module** (shorter, wider bottom aperture, holds marker / coloured pens); plug-in connector on the toolhead, no air tube, **no emergency stop** and no safety key needed ("Do I need an Emergency Stop Button for the Cutting Module? No").
- Work area: cutting 300 x 285 mm (H2D / H2D Pro / H2C), 297.5 x 300 (H2S), 300 x 300 (A2L); drawing 300 x 255 on all. Max cut thickness 0.5 mm (paper, vinyl, thin leather).
- Cutting platform (mat with protection base) replaces the build plate; aligned with the heatbed limit blocks; optional BirdsEye camera (H2) for photo alignment, A2L uses a phone photo (Bambu Handy). Module needs a **mount calibration** after every power-on (blade must touch the mat; a pen cannot do it).
- H2C: while the module is on the head you cannot print; the module is one at a time.

## 4. A2L (open-frame bed slinger)

No laser by design; "CNC Cutting Module" + pen on an external mounting point of the toolhead (adapter board in the toolhead). Cutting Upgrade Kit = cutting module, pen module, cutting platform. No BirdsEye camera. Details: docs/printers/bambu-a2l.md.

## 5. Not available

- X2D: no module (wiki), P2S / P1 / X1 / A1: none.

## 6. H3C CraftTool (cut / draw / foil / deboss, no laser)

- Parts: **CraftTool Base** (same footprint as a PrintTool base, with a thread at the bottom that rotates onto a **Cutting Module Base** or **Pen Housing**; no hotend, no filament cutter), blades: 45 degree fine-point blade, **Deboss Tip**, **Foil Transfer Tip**; pens (8 water-based colours, refill kit). Kits: "CutTool - Fine-point Blade" (1 base, 1 cutting module base, 1 blade), "DrawTool Kit" (1 base, 1 pen housing, 8 pens), "CraftTool Upgrade Kit" (2 bases, cutting module base, pen housing, 2 blades, deboss tip, foil tip, 8 pens, cutting platform).
- Mounting: the tools **hang on the Swaptek rack like PrintTools**; recommended slots **1 and 9** (outer ends of the row; slot 1 and 9 can be reached without removing the AMS housing) so both a CutTool and a DrawTool can stay loaded; the printer picks them with the ToolLock like a PrintTool. Unlike the H2 module, you do not swap by hand and can mix cutting + drawing in one 2D job; a job cannot mix 2D and 3D printing.
- Cutting platform: H3C design, different from the H2C one (markers in a different place, rack clearance), do not reuse the H2C platform. BirdsEye camera optional (alignment from a phone photo works too, enhanced AI monitoring from H1 2027).
- No laser: no green windows, no emergency stop, no safety key, no smoke pipe.

## 7. R1 (standalone CO2 laser cutter / engraver, announced 2026-08-13, launched 2026-09-22, ships ~ November 2026, 2,499 USD)

- Not a 3D printer but a Bambu Lab laser machine, "R1 Platform": **55 W CO2 glass laser tube** (processing wavelength 9-11 um, ranging laser 450 nm blue cross, positioning laser 650 nm red cross), max input power 780 W, 100-240 V.
- Work area **600 x 300 mm** (650 mm long at most for one pass), processing height 0-58 mm (up to 248 mm with the **Riser Base**); with the **Roller Feeder (conveyor)** + extension rails up to 3 m long material. Speed 1000 mm/s, accel 20 000 mm/s2; cuts 18 mm walnut / 20 mm acrylic (medium / long focus lens).
- Mechanics: XY gantry with belt drive, **Z by rack and pinion**, three mirrors (two on the axes, one on the head) and a focusing lens (38.1 mm standard, 50.8 / 63.5 mm optional), air assist nozzle, water cooling (coolant = distilled water + antifreeze, **radiator with fan** and water inlet), smoke ventilation port with fan and filter (hose 2 m, 86.5 / 75 mm), **top lid (PC)** with Hall sensor and **BirdsEye camera + LED fill light** in the lid, toolhead camera, **5 flame sensors** (4 in the body, 1 on the head), emergency-stop switch and a **Start / Stop button on the upper right**, touchscreen, LED lights left and right of the chamber, **safety key** and USB-C, 4-pin ports and fire-extinguisher connector on the **left side panel**. Optional auto fire-extinguishing system (not in China), rotary attachment (57-105 mm diameter, 500 mm), E1 Pro purifier, vision encoder.
- Class 1 as delivered; **Class 4** with riser base + conveyor. Weight about 33.5 kg, noise 68 dB at full load. Wiki R1 pages are the right place for photos if a model is wanted (not read for geometry).

## 8. Summary of the look differences (H2 laser editions vs the plain printer)

| Part | Plain H2D / H2C / H2S | Laser edition |
|---|---|---|
| Front door glass | dark tinted | green (laser-safe PC) |
| Side windows | clear / grey | green |
| Top cover | tempered glass | black laser plate (interlocked) |
| Right wall | plain | emergency stop mushroom button |
| Rear | purge chute, grilles | + 100 mm smoke pipe adapter, air pump behind the panel, safety key socket |
| Toolhead | two hotends + front cover | laser box (heat sink + fan on top, nozzle at the bottom) on the quick-release rail, air tube to the buffer coupler |
| Bed | textured plate | laser platform (slats / grid) or cutting platform |
| Camera | live + toolhead + nozzle | + BirdsEye in the top frame (pre-fitted) |

See also: docs/printers/bambu-h2d.md (section 10), bambu-h3c.md, bambu-a2l.md, bambu-models.md.

## 9. In the 3D model (card/models/bambu.h2d)

Implemented from the facts above, without module photos (confidence: low for outline / positions): module replaces the front half of the toolhead cover (hotends hidden), black air tube to the buffer coupler, beam + spot while `select.airduct_mode` = `laser`, Laser Edition parts (green glass, black plate, E-stop right, key + smoke adapter rear, BirdsEye). Details: bambu-h2d.md section 16.
