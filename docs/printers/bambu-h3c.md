# Bambu Lab H3C (Swaptek nine-tool changer) - reference for a procedural three.js model

Research status (2026-11-06): the H3C was revealed on 2026-11-03, so everything here is three days old. Read in the
user's Chrome: the official launch post (blog.bambulab.com), wiki.bambulab.com/en/h3c (index of ~120 pages), the
FAQ, "Introduction to H3C Main Components", "Introduction to H3C Fans", "SwapTek System Workflow", the front-cover
and rear-panel replacement guides (photos). The wiki sub-pages for rack / PrintTool replacement were NOT opened, the
bambulab.com store and product page were not readable (extension permission denied), so there is no official drawing
and no photo of the rack from the side. Heights, rack position and the screen are estimates. Coordinates: mm, origin =
centre of the footprint at floor level, X right (seen from the front), Y up, Z towards the front. "Left / right" = seen
from the FRONT unless "from behind" is written. Numbers read off photos are +/- 10 mm (rear) / +/- 15 mm (front).

Wiki base: `https://wiki.bambulab.com/en/h3c/...` (abbreviated `wiki:`), blog = launch post of 2026-11-03.

## 1. Identity

| Item | Value |
|---|---|
| Names | **H3C** ("H3C AMS Combo": printer + AMS 3H + 8 x 1.75 mm PrintTool + 1 x 2.85 mm PrintTool in slot 8); bundles: + Filament Bundle (PLA Palette + TPU), + Station Bundle (Bambu Station Open or Enclosed, E1 air purifier) |
| Series | first "third generation" printer; own wiki section "H3C" next to H2 / X / P / A / R1 |
| Release | revealed and on sale **2026-11-03** (US 2,499 USD for the combo; FCC grant 2026-09-11) |
| Model code (BamBuddy) | unknown (not in docs/printers/bambuddy-entities.md); read the real printer's `model` |
| Architecture name | **Swaptek** (nine "PrintTools", each a complete hotend with its own filament path, heater and cable, on a rack that moves) |
| Laser | **NO laser support** (wiki h3c FAQ "2D Functions": "supports cutting and pen functions, but does not support the laser function") |

## 2. Outer size, weight, build volume, temperatures

- Printer alone **493 x 571 x 587 mm** (W x D x H, wiki FAQ). AMS 3H alone 480 x 562 x 460. Assembled (printer + AMS 3H on top) **493 x 571 x 1016** (the AMS 3H overlaps the printer top by about 31 mm). Packaging 600 x 630 x 700 (printer), 550 x 615 x 500 (AMS).
- Net weight **36.28 kg including the AMS 3H** (wiki FAQ / blog); the printer alone is about 24 kg (estimate: AMS 3H packaging 11.9 kg).
- Clearance asked by the wiki (printer + AMS 3H): 593 x 1056 x 1306 mm: front 385 (door), sides 50 each, rear 100 (exhaust fan, power cable), top 290 (AMS lid). With a Bambu Station: height 1900.
- Build volume **330 x 320 x 325 mm** (same as the H2C and the A2L). Nozzles 0.2 / 0.4 / 0.6 / 0.8 mm (hardened steel, HRC 55+, all sizes), filament 1.75 mm and 2.85 mm.
- Temperatures: nozzle **350 C**, heatbed **120 C**, **active chamber heating up to 65 C** ("dual-zone": right and rear heater units, see section 7), contact-type chamber temperature sensor.
- Speed: travel **1400 mm/s**, acceleration **25 000 mm/s2**, toolhead + X axis 40 % lighter than the previous generation. Belts 1.5 GT (X, Y), 2 GT (Z).
- Power: high-voltage 200-240 V max 2250 W, low-voltage 100-120 V max 1850 W; PLA steady state 240 W, PC 540 W; low-power mode 1050 W. Noise 39-46 dBA. Wi-Fi 6 only, no Ethernet. 64 GB eMMC, USB-A 2.0 on the front.

## 3. The tool system (the new part)

- **PrintTool** = hotend (heater, NTC, silicone sock, nozzle, built-in heat sink) embedded in a plastic **base**. The base carries: cutter actuator (handle + blade, one cutter per tool), dock adsorption magnet, **FeedView** window (see the filament enter), an **indicator light** (white = cold, orange = hot / pulsing orange = heating, red = error, off = detached), in-position Hall magnet, dock calibration magnet and two locking pin holes. Each PrintTool has its own power and data cable ("tool control board" behind the PTFE guide) so it can **pre-heat while parked**. The tool number is the port it is plugged into; on the rack the docks are numbered **1 - 9**.
- **Toolhead** (X-axis carriage) holds NO hotend of its own: it carries the shared **FlexFeed extruder** (2521 PMSM servo motor, hardened-steel drive gear and an idler gear with a Hall odometer wheel, driven by the 2012 FlexFeed motor: three states 1.75 mm / 2.85 mm / released), the **ToolLock** (2012 motor, a spring plate that pulls the tool up into a tapered tool holder), the dock alignment Hall sensor, a tool reader, a nozzle eddy sensor, a clumping sensor, a toolhead camera (1920 x 1080, 30 fps), the part-cooling fan (custom 5015 radial + duct) and the hotend cooling fan (**on the right side** of the toolhead). A **cutter push rod on the right side** of the machine extends when the X axis is at the rear and pushes the cutter handle of the tool on the head.
- **Swaptek rack**: fixed with 4 screws at the **front of the chamber**, holds the 8 idle tools. Retractable in Z: lift motor + belt, rack sensor. Standby = raised (so one can see the tools); on a tool change it **drops to the working height**, the toolhead returns its tool to the empty dock and unlocks, the rack lifts, the toolhead picks the next one. After power-off the rack falls down by gravity (FAQ). Docks have a magnet, a status LED each; a **flow blocker** plate is part of the rack. Rack calibration: homing (upper stop, lower stop, standby), "Docking Calibration" in Settings.
- Rack fan: the **PrintTool cooling fan** (in the AMS 3H part? the wiki text says "the AMS 3H is equipped with a dedicated cooling fan" - reads as a fan on the rack side, unclear) keeps the heat break of parked pre-heated tools cold.
- Photo (front-cover guide, door side): behind the glass door a row of **nine tools hangs in a line across the full width, numbered 1..9 left to right**, each with an orange tab / light at the top. Pitch about 36 mm, span x -145 .. +145 (estimate from the photo, +/- 10).
- Tool changes: under 6 s print-to-print (3.4 s for the swap itself in reviews), "near-zero purge" for nine colours. The wiki warns that H2C / A2L build plates leave only about 2 mm to the rack (new H3C plates exist; H2C cutting platforms and plates are NOT compatible).
- 2.85 mm TPU tool is pre-installed in **slot 8**; slot 8 and slot 6 of the AMS 3H are the two drying slots; TPU goes in through the **bypass feed** funnels (only some of the nine slots have one), no TPU feed-assist module needed.
- **Mixed nozzle sizes** (0.2 .. 0.8) and mixed filament diameters can be used in one job; H2D / H2C / X2D get the same feature by firmware (blog).
- The 2D "CraftTool" bases (Cutting Module Base / Pen Housing) also hang on the rack (recommended slots **1 and 9**, no need to take the AMS housing off), see bambu-laser.md section on the H3C.

## 4. Enclosure

- All-metal frame; **silver / light grey** front pillars with rounded corners (front-cover photo: strongly rounded silver side posts), silver front cover band, dark rear panel. Same visual family as the H2D (silver body, black glass) but **taller front header and deeper chamber**.
- **Front cover** (photo): a light-grey metal band across the full width, ~ 85 mm tall (photo estimate, scale 0.74 mm / px from the 493 mm width), at the top of the front. Left part: a dark rectangular cut-out with a **USB-A port** (x about -145 .. -105) and a small round hole (mic / button, x ~ -90) with small black slots (screw covers); right part: logo **"Bambu Lab H3C"** (right-aligned, x ~ +120 .. +185). The **5-inch touchscreen (480 x 854, listed as a separate item in the box: "Screen")** clips into that left cut-out; its pose (upright / tilted, on top of the band) is not shown on the page I read: the unplugged cover shows only the cut-out. Estimate: screen face on the front cover, left, like the X2D / P2S screen area.
- **Front glass door**: dark / tinted glass between the pillars, hinges on the **left** (hinge bracket visible at the upper left in the photo), door-mounting kit on the right (door sensor / handle side: Chamber Hall sensor pack). Door glass spans the full width between the pillars below the cover band. Through it the rack with the nine tools is visible at the top of the chamber, the black chamber interior below.
- Side panels: left, right with **glass windows** (replacement guides "Side Panel - Left", "Side Glass", "Right Side Panel"); colours light grey (estimate, same as H2D).
- Top: the printer carries the **AMS 3H** (fully enclosed, 480 x 562 x 460) directly on the top frame, fixed with screws; the rear of the AMS has an intake **chamber cooling fan** that blows outside air into the chamber. The top glass lid is part of the AMS interface (the AMS and printer behave as one tower; photo with the front cover shows a black open top without AMS).
- Rear panel (photo, section 10): dark grey metal sheet, 10 machine screws + 12 self-tapping.
- Feet: anti-vibration feet. Colours: body light silver / white-grey, black door glass, black rear and top frame.

## 5. Kinematics

- **CoreXY, bed moves in Z** (like the H2 / X / P series): metal rods + bearing sleeves + belt on X, rods on the sides for Y, motors A (right) and B ("XY motor - left" in the part list), belt tensioners at the rear with belt-tension monitor.
- Z: **three lead screws + three linear rods at front-left, front-right and rear-centre of the heatbed**, one Z motor with a belt (wiki main components). Suggested screw positions (estimate, from the H2D): (-215, +185), (+215, +185), (0, -225).
- Heatbed: 330 x 320 print area, textured PEI plate (new H3C plate design, 2 mm leading-edge gap to the rack), RGB status light bar on the heatbed (front edge), build-plate alignment block, calibration sticker for the toolhead camera, nozzle wiping steel strip, nozzle offset calibration sensor (coil). "Heatbed print area 330 x 320" = same as H2C.
- Optional vision encoder (shared with the H2C) for motion calibration to < 50 um.

## 6. Heights (no drawing, estimates)

- Total printer height **587 mm** (official). The AMS 3H adds 460 mm minus ~31 overlap (assembled 1016).
- Chamber floor about 45-50 mm, door sill ~40 mm (same family as the H2D, estimate).
- Nozzle tip at layer 0 (TIP): estimate **~ 440 mm +/- 30** (derived: Z travel 325 mm; the lowest bed top must clear the rack and the 85 mm header; the tool, held in the toolhead, hangs below the carriage). Compare the H2D estimate 430-480.
- Rack: at the front inside the door, tools hang below it; estimate rack frame y 440..520, tool bodies y 330..470, z +215 .. +260 (low confidence).

## 7. Fans (Bambu names)

| Fan | Type / size | Position | Facing | Source |
|---|---|---|---|---|
| Part cooling | custom **5015 centrifugal** + duct | toolhead (on the shared head, not on the tool) | down onto the nozzle of the tool in use | wiki main-components / fans |
| Hotend cooling fan (+ duct) | axial | **right side of the toolhead** | onto the heat sink of the locked tool | wiki fans |
| PrintTool cooling fan | blower | on the rack side (cools the heat breaks of parked, pre-heated tools); the page attributes it to the AMS 3H, unclear | onto the parked tools | wiki fans |
| Auxiliary part cooling fan - left | axial + duct | **left wall** | blowing into the chamber (+x) | wiki fans, "Auxiliary Part Cooling Fan Duct - Left" |
| **Adaptive airflow unit - right** | fan + chamber heater + damper | right wall | cooling mode: aux fan (mirror of the left); heating mode: internal circulation (heater + fan) | wiki fans |
| **Adaptive airflow unit - rear** | fan + chamber heater + damper + filter | rear panel, square window (section 10) | cooling mode: exhaust through the filter; heating mode: internal circulation | wiki fans |
| AMS 3H chamber cooling fan | intake | AMS backplate (rear of the AMS, on the printer top) | outside air into the chamber | wiki fans |
| Power supply cooling fan | axial | inner rear panel (mesh at the lower rear) | out of the rear; on above 45 C | wiki fans |
| MC board fan | small | rear electronics | - | (not listed; estimate) |

Two heater units (right wall, rear) form the "dual-zone" 65 C chamber heater. The activated-carbon filter is on the **left rear inside the chamber** (change after 1440 print hours).

## 8. Lights, cameras, screen, ports, power

- LED strips on the **left and right gantry beams** (wiki), plus a heatbed RGB status bar. Chamber light switch: one entity expected in BamBuddy.
- Cameras: **live view camera** 1920 x 1080 30 fps (chamber), **toolhead camera** 1920 x 1080 30 fps, **optional BirdsEye** 8 MP (3D monitoring 1632 x 1224 / 30 fps; 2D top-down 3264 x 2448 / 10 fps), "dual-camera AI detection" with the BirdsEye.
- Screen 5 in, 480 x 854 touch; USB-A 2.0 next to the screen (front cover left). No SD slot; 64 GB internal storage.
- Ports on the back: power inlet + switch lower left (from behind, section 10), AP / 6-pin BambuBus board for the AMS 3H, two external-spool bracket positions (tabs at the left and right edge of the panel). The H3C has no safety key (no laser).
- Power: inlet on the lower rear, **printer's right** (from front coordinates x ~ +160, y 25-110).

## 9. Filament path

- **AMS 3H** (on top): nine slots, one per PrintTool, airtight, RFID, auto-routing; two drying slots (slots 6 and 8, up to 85 C, can dry while printing); a 9-way filament lane to the tools via a PTFE tube bracket: **9 transparent FEP tubes 415 mm** (bracket to PrintTool) and white / grey PTFE tubes 540 mm (inline connectors, slots 1-4, 7-9) / 565 mm (branched connectors 5 and 6); the tube of tool 1 has a pneumatic connector for the external-AMS path.
- Extra AMS: up to 4 older AMS (AMS, AMS 2 Pro, AMS HT) through **tool 1** with an external filament buffer (looks like the P2S buffer, not compatible with older buffers) = 24 materials.
- Bypass feed (TPU only) for some slots; external spool holders (two bracket positions on the rear panel) for fibre-reinforced / rough filament.
- **Purge chute** at the rear right (from the front), purge wiper behind the bed on the **rear right** inside the chamber ("rear right side of the chamber, connected to the purge chute"), with push plate + receiving plate and the nozzle wiping pad (coarse wipe) next to it.
- Cutter: one cutter per PrintTool, driven by the push rod on the right (section 3). 

## 10. Rear panel (photo in wiki:maintenance/replace-back-panel)

Read from the photo: scale 1.67 mm / px from the printer width (493), panel height ~ 618 mm in the photo (perspective), values +/- 10 mm, converted to FRONT coordinates (mirror of the image); low confidence for heights.

| Feature | x (front coords) | y range | size |
|---|---|---|---|
| Rectangular **purge chute** opening (black duct with 2 lugs under it) | +87 | 275..395 | ~ 50 wide |
| Square **rear adaptive airflow unit** window (plate with two round dots) | -87 | 285..395 | ~ 70 x 105 |
| Mesh grille (power-supply fan) | +112 | 135..200 | ~ 108 x 65 |
| Smaller louvre mesh | -98 | 160..190 | ~ 100 x 30 |
| Power inlet + rocker switch | +160 | 25..110 | ~ 50 x 80 |
| Two lugs for the external spool holder brackets | +/-210 (panel edges) | ~ 400..420 | small tabs |
| Two small vertical slots near the top (buffer / 6-pin board fixings) | x +/-90..100 | ~ 540..580 | slots |

## 11. Front / side features

- Front: silver cover band (USB-A + small hole left, logo right), screen at the left of the band, glass door below with hinges left, **rack with nine tools** visible behind the glass at the top of the chamber, black bed area below, status RGB bar under the bed front edge.
- Left: aux cooling duct on the left wall, side window; filter on the left rear inside.
- Right: adaptive airflow unit (fan + heater) on the right wall, side window; cutter push rod at the right of the X axis; emergency stop is NOT fitted (no laser).
- Top: AMS 3H tower. Back: section 10.

## 12. Numbers, sources, confidence

| Number | Value | Source | Confidence |
|---|---|---|---|
| Outer size | 493 x 571 x 587 (printer), 493 x 571 x 1016 with AMS 3H | wiki/en/h3c/manual/faq, blog 2026-11-03 | official |
| Weight | 36.28 kg incl. AMS 3H | same | official |
| Build volume | 330 x 320 x 325 | same | official |
| Temps | 350 / 120 / 65 | blog, FAQ | official |
| Speed / accel | 1400 mm/s, 25 000 mm/s2 | FAQ | official |
| Tools | 9 PrintTools, rack at the front of the chamber, fixed with 4 screws, retractable | wiki/en/h3c/manual/main-components, swaptek-workflow-and-function | official |
| Tool row photo (9 tools, orange tab each, pitch ~ 36) | span x -145..+145 | wiki/en/h3c/maintenance/replace-front-cover photo | photo, +/- 10 |
| Front cover band ~ 85 tall, USB-A left, logo right | photo | wiki/en/h3c/maintenance/replace-front-cover | photo, +/- 15 |
| Rear panel feature positions | section 10 | wiki/en/h3c/maintenance/replace-back-panel photo | measured from photo, +/- 10 |
| Fans | section 7 | wiki/en/h3c/manual/fan-introduction | official |
| Z axis 3 screws, front-L / front-R / rear-centre | main-components | official |
| Screen 5 in 480 x 854, camera specs | main-components, faq | official |
| TIP ~ 440, rack frame heights | derived | estimate, low |
| Laser: not supported; CutTool / DrawTool supported | faq "2D Functions" | official |

## 13. Differences from the H2C (same build volume, same price class, different concept)

| Aspect | H2C | H3C |
|---|---|---|
| Nozzles | 1 induction (Vortek) hotend + 1 normal, rack of 5 spare hotends on the right wall | 9 independent PrintTools on a front rack, each pre-heated |
| Extruder | on the head, fixed | shared FlexFeed (1.75 / 2.85 mm) |
| Filament unit | external AMS 2 Pro | integrated AMS 3H on top of the printer |
| Height | 626 | 587 (printer) / 1016 with AMS |
| Laser | 10 W / 40 W module | none, CutTool / DrawTool only |
| Chamber | 65 C | 65 C, dual-zone heaters (right + rear) |
| Plates | H2C / A2L plate | new plate (H2C plate only with detection off) |

## 14. HA entities

Not yet in docs/printers/bambuddy-entities.md. Expected from the architecture (unverified): one chamber light (two beam strips), one live camera (toolhead / BirdsEye not exposed), part fan, aux fan, chamber heater / temperature, a nozzle temperature per tool (9) or the active tool only, active tool index, tool-changer state, AMS 3H slots (9). Verify against a real printer before building the model.

## 15. Modelling suggestions for card/models/bambu.h3c

- Reuse the H2D shell (silver pillars, black glass door hinged left) at 493 x 571 x 587, front header ~ 85 mm, deeper rear.
- Replace the dual toolhead by one slim carriage (no hotends) plus one tool "hanging" on it; draw nine small boxes (about 28 x 40 x 70) in a row at the front of the chamber at the rack height; mark the one in use as missing from the rack.
- AMS 3H as a large box on top (480 x 562 x 460) with a lid; the existing AMS drawing code can be scaled.
- Right side wall: heater unit plate + fan; rear: square airflow window left of centre, purge chute at x +87, power inlet lower right (from behind lower left).

## 16. Photo findings for the model (2026-11-06, second pass)

Read in Chrome: wiki.bambulab.com/en/h3c (overview photo with callouts), wiki.bambulab.com/en/h3c/maintenance/replace-swaptek-rack
(photos with the AMS 3H removed). Page text of the main-components page was not found under the guessed URLs.

| Finding | Source | Confidence |
|---|---|---|
| Rack seen from above (AMS removed): black uprights at both ends, a steel rod across the top, a dark back plate with a cut-out per dock, nine tools hanging in a row, each with an **orange tab on top**, a grey base, a **black round foot** (silicone sock) below; a silver rail runs under the feet | rack replacement guide, first photo | photo, good |
| Rack sits at the **front of the chamber directly behind the front cover band**, the tool tops are covered by the band, tools 7 / 8 / 9 numbers are printed on the header at the right | same, step photos | photo, good |
| Tool tips in standby ~ 430 mm over the floor (scaled from the overview photo, 2.16 mm / px), i.e. ~ 20 mm above the nozzle tip at layer 0 | overview photo | estimate +/- 30 |
| Silver rounded pillars, black inner frame, silver cover band (~ 60-65 mm), black top frame; **no glass lid** (the AMS 3H sits on the frame) | overview + rack guide | photo |
| **Only the right side has a window** (dark glass, upper half, ~ 300 x 130 mm); the left side is closed (air filter left rear, aux fan duct) | overview photo callout "Side Window" | photo, medium |
| Screen: landscape-looking 5" panel on the **left of the cover band, standing on its upper edge, tilted back**; logo "Bambu Lab H3C" right of the middle | overview photo | photo |
| Live view camera + privacy cover: inside, upper left under the band | overview callout 2 | photo |
| AMS 3H: rounded, smoked translucent cover (wider than tall, rounded top and rear), nine spools standing in a row side by side behind it, a "AMS 3H" legend at the lower left of the front; under the cover a **band where the nine tubes fan out** and arc down to the printer's top front | overview photo | photo, good |
| Air filter right of the chamber's rear (photo callout 7 "Air Filter", right when seen from the front) vs. wiki text "left rear": the callout wins in the picture, **unresolved** | overview vs. FAQ text | doubt |
| Toolhead without a tool: no photo; drawn as a carriage with extruder, camera, part fan blower at the front, hotend fan on the right; the tool plugs into its bottom (about 20 mm) | wiki text only | low |
| Heights: tool 90 mm (tip to tab, estimate), head body 60, X rail ~ 38 over the head's bottom; TIP 410 | derived | low |

Model decisions (card/models/bambu.h3c): ACTIVE_TOOL = 0 (tool 1 on the head, its dock empty), `_h3cActive()` is the one place to bind a
tool-changer entity; `this._rackDown` / RACK_DROP are prepared but not animated; CutTool / DrawTool hang in docks 9 / 8 when fitted
(wiki: slots 1 and 9 recommended, slot 1 is the head's tool here). PTFE tubes: bracket in the AMS band to each tool top, min bend
radius reached 77 mm (rack tools) / ~ 42 mm (head tool at the rear); 100 mm is geometrically not possible in 80 mm of height.

Note (2026-11-06): the model puts the carbon filter at the **right** rear of the chamber, after the wiki overview
photo (callout 7 points at a dark grille right of centre on the back wall, seen from the front). The wiki text says
"left rear"; it may describe the side seen from behind. Unresolved — check a rear photo.
