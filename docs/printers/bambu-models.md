# Bambu Lab printers - inventory of every series and variant (state 2026-11-06)

Research: wiki.bambulab.com series index pages (`/en/h2`, `/en/x-series`, `/en/p-series`, `/en/a-series`, `/en/r1`,
`/en/h3c`), FAQ pages of H3C / X2D / A2L / R1, laser and cutting index, launch posts and press via web search. The wiki
home lists exactly these sections: **H3C, H2 Series (H2D, H2C, H2S, H2D Pro), X Series (X2D, X1), P Series (P2S, P1
Series), A Series (A2L, A1, A1 mini), R1 (laser machine)**. Confidence: O = Bambu wiki / blog, S = press / retailer
(search), M = from memory / existing docs, E = estimate. "Doc" = which file in docs/printers/ covers it
(NOT covered = no dedicated file or only a mention). Older machines (X1, P1P, A1 mini) are from memory plus the existing
docs, not re-checked this session. "Not announced / only FCC" items are listed at the end so nobody models them by accident.

## 1. Printers (3D printers)

| Name | Series | Release / announced | Enclosed | Kinematics | Build volume (W x D x H mm) | Nozzles | Chamber heater | Filament systems | Laser / cutter / other modules | Doc |
|---|---|---|---|---|---|---|---|---|---|---|
| X1 Carbon (X1C) | X | 2022 (Kickstarter 2022-05, shipping mid / late 2022, S: 2022-07) | yes | CoreXY, bed Z | 256 x 256 x 256 | 1 | no (passive; 'chamber' sensor only) | AMS gen 1 (4 slots, up to 4 units = 16 colours), external spool; AMS 2 Pro / HT via firmware (E) | micro lidar; no laser / cutter | bambu-x1c.md |
| X1 (non-carbon) | X | 2022, same as X1C but plain extruder and no hardened parts (M) | yes | CoreXY, bed Z | 256^3 | 1 | no | AMS gen 1 | lidar | bambu-x1c.md (same body, mention only) |
| X1E | X | 2023-10 (enterprise) (S) | yes | CoreXY, bed Z | 256^3 | 1 | **active, to 60 C** (M) | AMS gen 1; Ethernet | no | bambu-x1c.md |
| X1 series end of life | - | lifecycle notice 2026-03-31 (BambuHub, single source) | - | - | - | - | - | - | - | - |
| **X2D** | X | **2026-04-14** (O/S); 649 / 899 USD | yes | CoreXY, bed Z | 256 x 256 x 260 main; 235.5 x 256 x 256 both nozzles | **2** (identical, one toolhead; remote auxiliary extruder on the rear panel) | **active 65 C** (PTC left, airflow unit right) | AMS 2 Pro (up to 4), AMS HT (up to 8), AMS gen 1; 25 colours; Filament Track Switch (accessory) | none | **bambu-x2d.md (new)**; geometry in card/models |
| P1P | P | 2022-11 (M) | **no** (open frame) | CoreXY, bed Z | 256^3 | 1 | no | AMS gen 1 (E) | none | NOT covered (body = P1S without panels |
| P1S | P | 2023-06 (S: matterhackers) | yes | CoreXY, bed Z | 256^3 | 1 | no | AMS gen 1, AMS 2 Pro / HT (E) | none | bambu-p1s.md |
| **P2S** | P | **2025-10-14** (M/S) | yes | CoreXY, bed Z | 256^3 | 1 | no (chamber sensor only) | AMS 2 Pro (Combo), AMS HT, filament buffer | none | bambu-p2s.md |
| A1 mini | A | 2023-09 | no (open) | bed slinger (bed Y), gantry Z | 180^3 | 1 | no | AMS lite | none | bambu-a1.md |
| A1 | A | 2023-12 | no (open) | bed slinger | 256^3 | 1 | no | AMS lite (Combo) | none | bambu-a1.md |
| **A2L** | A | **2026-06-01** (O/S); 469 / 569 USD | **no** (open; ambient sensor) | bed slinger, "I3" with dual Z screws | **330 x 320 x 325** | 1 | no (bed 80 C) | AMS lite (+ up to 4 AMS, 19 colours) | **no laser**; **cutting / pen module** on an external mounting point | **bambu-a2l.md (new)** |
| H2D | H2 | 2025-03 (S: all3dp; matterhackers says 2025-04) | yes | CoreXY, bed Z | 350 x 320 x 325 (both nozzles 300 wide) | 2 (left lifts) | **active 65 C** | AMS 2 Pro (up to 4), AMS HT (up to 8), AMS gen 1; 2 spool holders, filament buffer | **laser 10 W / 40 W, cutting, pen** (Laser Full Combo with BirdsEye) | bambu-h2d.md |
| H2D Pro | H2 | 2025-08 silent launch (S: notebookcheck; ship about 2025-08-20) | yes | same as H2D | 350 x 320 x 325 | 2 (tungsten nozzles) | 65 C | same + Ethernet, 5.8 GHz, vision encoder in box | laser 10 W / 40 W compatible (S), cutting | bambu-h2d.md (section 12) |
| H2S | H2 | 2025-08 (S); 1,249 USD, standalone in 2025-10 | yes | CoreXY, bed Z | 340 x 320 x 340 | **1** | 65 C (H2 Pro / H2C FAQ; H2S: see h2d doc) | AMS 2 Pro / HT | **laser 10 W only** (40 W not supported), cutting, pen | bambu-h2d.md (section 12) |
| H2C | H2 | 2025-11 (Formnext 2025-11-18, S) | yes | CoreXY, bed Z | 330 x 320 x 325 | 2: 1 normal + 1 **Vortek induction** hotend, **rack of 5 spare hotends** on the right wall (6 total) | 65 C | AMS 2 Pro / HT | **laser 10 W / 40 W** (Laser Full Combo), cutting, pen; 'support module' SLA027 | bambu-h2d.md (section 12) |
| **H3C** | H3C ("third generation") | **2026-11-03** (O); 2,499 USD | yes | CoreXY, bed Z | 330 x 320 x 325 | **9 PrintTools** (Swaptek rack at the front of the chamber, each tool with own heater) | **active 65 C**, dual zone (right + rear units) | **AMS 3H built in on top** (9 slots, 2 dry slots 85 C); older AMS via tool 1 up to 24 colours; 1.75 and 2.85 mm | **no laser**; CraftTool bases (CutTool / DrawTool, foil, deboss) hang on the rack | **bambu-h3c.md (new)** |

## 2. Laser machine

| Name | Series | Date | Enclosed | Kinematics | Work area | Laser | Doc |
|---|---|---|---|---|---|---|---|
| **R1** | R1 | 2026-09-22 (O/S); 2,499 USD | yes (PC lid) | XY gantry, Z rack and pinion | 600 x 300 mm (up to 3 m with feeder) | **55 W CO2 tube**, Class 1 / 4 | **bambu-r1.md (new)** |

## 3. Variants and bundles that change the look (for the model code)

| Variant | What differs |
|---|---|
| H2D Laser Full Combo (10 W / 40 W), H2S Laser (10 W), H2C Laser Full Combo | green PC door and side windows, black top plate, emergency stop on the right side, smoke pipe adapter + air pump at the rear, BirdsEye camera pre-fitted, laser platform; module on the toolhead (see bambu-laser.md) |
| H2D AMS Combo, H2C AMS Combo, X2D Combo ("X2DC"), P2S Combo, A1 / A2L Combo, H3C AMS Combo | with filament unit; the H3C always includes the AMS 3H (the printer is not sold without it) |
| H3C bundles | + PLA Palette / TPU, + Bambu Station Open or Enclosed (stand with drawers 494 x 600 x 570), + E1 air purifier |
| BirdsEye camera | optional for H2D / H2C / H2S / H3C (laser editions pre-fitted); not for A2L |
| Vision Encoder | optional for H2D family, X2D, H3C (shared with the H2C) |
| H2D vs H2D Pro | same shell, Pro adds Ethernet rear jack |

## 4. Not announced (FCC grants only, do not model)

- **P3C**: FCC grant 2026-09-15, no specs. **X2D Pro**: FCC grant 2026-09-11, no specs. **AMS 3P**: FCC grant, unknown.
- **S1 3D scanner**: announced for November 2026 (not a printer).
- No "H3C Laser" or H3C laser module: the FAQ says laser is not supported.

## 5. Gaps in docs/printers/ after this pass

- NOT covered by their own file: P1P (body = P1S minus panels and door, open frame)), X1 / X1E (covered inside bambu-x1c.md), X2D now has bambu-x2d.md (short; the 3D geometry is in card/models), H2S / H2C / H2D Pro are inside bambu-h2d.md only.
- Covered by new files: H3C (bambu-h3c.md), A2L (bambu-a2l.md), X2D (bambu-x2d.md), R1 (bambu-r1.md), laser / cutting (bambu-laser.md).
- Not re-checked this session: dates and numbers of the X1 / P1 / A1 generations (memory plus older docs).
