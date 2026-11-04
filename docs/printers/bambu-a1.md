# Bambu Lab A1 (and A1 mini) - research for a procedural three.js model

Coordinates: mm, origin = centre of the footprint at floor level, X = width (+x right seen from the front), Y = up,
Z = towards the front. Confidence: **O** official/retailer spec, **R** review/third party text, **P** measured/inferred
from photos (not re-verified here: the Bambu wiki and store blocked automated fetches), **E** estimate.
Honest summary: the official wiki (maintenance/disassembly pages) could not be fetched, so most internal geometry below
is E. Verify against wiki.bambulab.com/en/a1/maintenance/* photos before fine-tuning.

## 1. Identity

| | A1 | A1 mini |
|---|---|---|
| Names | Bambu Lab A1 (printer only), A1 Combo (with AMS lite) | A1 mini, A1 mini Combo |
| Model code (Bambu Studio / BamBuddy) | `N2S` (E, from memory of Bambu Studio printer ids; serial prefix `03W`) | `N1` (serial prefix `030`) |
| Release | Dec 2023 (O/R: Slice Lab "late 2023") | Sep 2023 (E) |
| Type | open-frame Cartesian bed slinger (bed moves Y) | same, smaller |

## 2. Overall numbers

| | A1 | A1 mini |
|---|---|---|
| Size W x D x H | 385 x 410 x 430 (spec sheet; many retailers print 465 x 410 x 430, see note) | 347 x 315 x 365 |
| Net weight | 8.3 kg | 5.5 kg |
| Build volume | 256 x 256 x 256 | 180 x 180 x 180 |
| Nozzles | 1 (0.4 default; 0.2 / 0.6 / 0.8 optional, quick swap hotend) | 1 |
| Max nozzle / bed | 300 C / 100 C | 280 C / 80 C |
| Speed / accel | 500 mm/s / 10 000 mm/s2 | similar, 150 W max power |
| Power | 100-240 V, 1300 W max @220 V (350 W @110 V) | 150 W |
| Screen | 3.5" IPS touch, 320x240 | 2.4" touch |
| Noise | 48-49 dB | - |
| Filament | 1.75 mm, one external spool holder or AMS lite (4 colours) | same |

Note on the width: 385 mm is the machine; 465 mm in many listings is probably the width including the spool holder
arm / filament side (E - the dimension is not explained anywhere I could read). Model the machine at 385 and let the
spool holder stick out. With AMS lite: the mini Combo package is 385 x 430 x 495 (R, packaging), AMS lite is a
separate 397 x 208 x 342 unit placed beside the printer or on the top beam; "workspace 90 x 60 x 45 cm" (R) for the
printer + AMS lite side by side.

Depth 410 is the overall extent with the bed at one end of its travel (E: the bed overhangs front or back by
roughly 40-60 mm at the extremes; at mid-travel the machine is ~340 deep, the base ~ 340 deep).
Height 430 includes the spool holder on top (E).

## 3. Frame (E unless noted)

- **Base**: rectangular cast/sheet-metal + plastic box, ~385 W x ~340 D x ~50-60 H (E), the bed's Y linear guide
  (metal rail with wheels/linear guide, covered by a plastic housing, R) runs on top of it; Y motor + belt are inside
  the base; the PSU and mainboard live in the base (R: "150 W PSU is fanless, base gets warm" is for the mini).
- **Gantry (A1)**: two Z uprights, one at each side of the base (R: bambureviews, all3dp-style comparison "two Z
  uprights with a horizontal gantry beam"; A1 mini = one upright, cantilever, R: 3dprintbeginner says on the right).
  Uprights ~ 30 x 30 mm, rising from the rear half of the base sides (E), steel + extruded aluminium (O: "steel and
  extruded aluminum"). Frame is screwed to the base with four screws at assembly (R).
- **Z motion**: two lead screws, one in each upright, driven by one Z motor via a **Z belt** under/in the base ("Z Belt -
  A1" is a store part that drives the Z lead screws, R-ish) plus a guide bar per upright (forum: "the bar", R). Lead
  screw positions ~ (+-165, z -90) E.
- **X beam**: horizontal aluminium beam between the uprights, ~385 W, ~30 x 30 mm (E) with a linear rail on the front;
  at Z=0 (bed touching nozzle) the beam is at about Y = 55 + 70 + 25 = 150..190 (E); at max Z it is at Y ~ 360-395.
  Beam rides on the uprights; the toolhead rides the front of the beam.
- **Y axis**: bed carriage on a linear rail/guide on top of the base, belt-driven from a motor at the back (E).
- **Motors**: X (on toolhead side of the beam, right end, E), Y (base rear), Z (base, one, belt to two screws), extruder
  (direct drive, on the toolhead).
- **Screen**: 3.5" touch (about 80 x 60 mm active), on the front of the base at the right or centre-right, tilted back
  ~ 30-45 degrees (E; position not stated in any source I could read).
- **Spool holder**: single holder screwed on top of the gantry (R: "attaches to the top"), a bar on a bracket; spool axis
  along X; hangs ~ (x 0 to +60, y 405-430, z -30..+20) (E).
- **Cable/tube chain**: ribbon cable from the toolhead through the rear of the X beam along the top/back to the
  rear of the base (E); Y bed cable bundle in a flat flexible strip under the bed at the back.

## 4. Heights (E)

- Bed top (plate surface) = nozzle tip at layer 0: **TIP ~ 55 mm** above the floor (base ~ 45 + bed stack ~ 10-14).
  The bed stack is thin (steel plate + heater + magnetic PEI sheet, ~ 6-8 mm) on a carriage.
- Max Z travel: build height 256 mm (O). Nozzle tip highest = TIP + 256 ~ 311.
- Toolhead (E, from toolhead photos/wiki): ~ 60 W x 60 D x 80 H; hotend below (nozzle ~ 25 tall, quick-swap lever on the
  right side of the toolhead, R printer-hub), toolhead body with the cooling fan on the side, the front cover
  (the plastic "face") ~ 55 mm wide; total from tip to top of head ~ 75-85. Part-fan duct a curved radial blower on one
  side (R: "custom radial fan with integrated duct", mini).
- Cutter: a cutter lever blade on the toolhead's right side (R: voxelmatters "repositioned to the right side"); a small
  plastic cam on the gantry (the right end of the beam, E) presses it so the filament is cut at the right end of X.
  (The filament cutter is the A1's own - not the side cutters in the box.)

## 5. Fans (E except where marked)

| Fan | Type | Position / facing |
|---|---|---|
| Part cooling | radial blower with integrated duct (R, mini) | toolhead side (left), duct to nozzle |
| Hotend (heatsink) | small axial, ~ 20-25 mm, speed follows nozzle temp (R, mini) | side of the toolhead, blowing into the heatsink |
| Mainboard / driver | small fan on the board (R, mini) | in the base |
| PSU | none (fanless 150 W, R, mini); A1 PSU in the base, no known fan (E) | - |

## 6. Lights, camera, ports

- Camera: yes (O: "low-rate camera up to 1080p", ~1 fps, timelapse); on the A1 the camera sits at the right side of the
  X axis (R, mini review; for the A1 position E) with an **LED light** and a rotatable diffuser that covers the lens as
  a privacy shutter (R). One toolhead-side LED, no enclosure light.
- microSD slot: at the front/side of the base next to the screen (E); Wi-Fi only (no Ethernet).
- Power: IEC inlet + rocker switch at the back of the base (E), selector 110/220 not needed (100-240 V).

## 7. Filament path

- **AMS lite**: 397 x 208 x 342 mm, 1.6 kg (O: store / retailers). Open stand with four rotary spool "claws" (spool width
  40-68 mm, ID 53-58 mm). Stands beside the printer or is mounted on the top beam (Bambu FAQ, R). Combo adds
  ~ 2 kg gross. Four PTFE tubes from the spools go to a hub on the AMS lite stand, a single PTFE tube
  (~ 4 mm) runs from the hub up over the gantry and down to the toolhead's filament inlet at the top-back of the
  toolhead (E), hanging in a loop. A1 mini variant has the same AMS lite.
- External spool holder: top of the gantry, filament goes into a small guide on top of the toolhead (R, E).
- **Purge / waste**: purge wiper (store part "Purge Wiper - A1 series", wiper is a rubber piece with a metal plate on
  the heatbed) and the purge chute through which the waste falls: at the **rear-left** of the bed on the base frame
  (E from memory of the A1 reference photos: "poop chute" / waste tray at the back; third-party chute prints are
  screwed to the existing screws on either side of the chute, R); user puts a box under it.
- **Cutter**: on toolhead, right side, see above.

## 8. Features and positions (A1, mm, centre footprint on floor, E)

| Feature | x | y | z |
|---|---|---|---|
| Base box centre | 0 | 0..55 | 0 (footprint ~ 385 x 340, bed at mid-travel) |
| Feet (4 rubber) | +-170 | 0..5 | +-140 |
| Z uprights (2) | +-175 | 55..385 | -90 (30 x 30) |
| Z lead screws / bars | +-160 | 60..380 | -90 / -110 |
| X beam | 0 | TIP+~95 .. +~125 above the bed at Z0 | -60 |
| Toolhead (x travel +-130 over the bed) | -128..+128 | Y beam | -35 |
| Bed (256 x 256, plate) | 0 | 55 | travel: z centre -50 (back) to +90 (front) (E: bed travel ~ 140 mm) |
| Screen (tilted) | +95 | 40 | +160 (front face) |
| Logo "BAMBU LAB" | on the front of the base, left | 30 | +172 |
| Spool holder | 0..+60 | 405..430 | -30 |
| Purge chute | -150 | 20..55 | -150 |
| microSD | right of screen | 40 | +165 |

## 9. A1 mini differences (brief)

180 mm bed, 347 x 315 x 365, 5.5 kg, one upright (cantilever, R: on the right in 3dprintbeginner's review), 2.4" screen,
80 C bed, single Z screw in the column, "N1", same AMS lite and quick-swap hotend family, same toolhead concept
(radial part fan, side hotend fan, camera light on the right of the X axis).

## 10. Number table

| Number | Value | Source | Conf. |
|---|---|---|---|
| A1 size 385 x 410 x 430 | machine | https://printer-hub.com/posts/bambu-lab-a1-review ; https://www.3djake.com/bambu-lab/a1 | O/R |
| A1 size 465 x 410 x 430 | listing variant | https://www.crcibernetica.com/bambu-lab-a1/ ; https://bambureviews.com/posts/bambu-a1-vs-a1-mini/ | O (listings), meaning unclear |
| Weight 8.3 kg | | https://cdn.shopify.com/s/files/1/0635/8247/0318/files/A1_Spec_EN_1.pdf (via retailers) | O |
| Build 256^3, 300 C, 100 C bed | | https://cdn.shopify.com/s/files/1/0635/8247/0318/files/A1_Spec_EN_1.pdf ; crcibernetica | O |
| 500 mm/s, 10 000 mm/s2, 1300 W | | https://www.crcibernetica.com/bambu-lab-a1/ | O |
| Screen 3.5" 320x240 | | https://printer-hub.com/posts/bambu-lab-a1-review | R |
| Camera 1 fps, privacy shutter | | https://printer-hub.com/posts/bambu-lab-a1-review | R |
| Noise 48/49 dB | | same | R |
| Two Z uprights (A1), one (mini) | | https://bambureviews.com/posts/bambu-a1-vs-a1-mini/ | R (not verified in photos) |
| Z belt drives Z lead screws (A1) | | https://eu.store.bambulab.com/products/z-belt-a1 (search snippet) | R |
| AMS lite 397 x 208 x 342, 1.6 kg, spool 40-68 / ID 53-58 | | https://eu.store.bambulab.com/products/ams-lite (search snippets) ; https://www.galaxus.ch/en/s1/product/bambu-lab-ams-lite-accessories-3d-printer-accessories-46262511 | O |
| A1 mini 347 x 315 x 365, 5.5 kg, 180^3 | | https://eu.store.bambulab.com/en-bg/products/a1-mini ; https://www.tomshardware.com/reviews/bambu-lab-a1-mini | O |
| Mini column on the right, camera right of X, fans, 150 W PSU fanless | | https://3dprintbeginner.com/bambu-lab-a1-mini-and-ams-lite-review/ | R |
| Cutter on the toolhead's right side | | https://www.voxelmatters.com/bambu-lab-a1-review-does-it-live-up-to-the-hype/ | R |
| Quick-swap lever on the toolhead's right | | https://printer-hub.com/posts/bambu-lab-a1-review | R |
| Release late 2023 | | https://slice-lab.com/en/guide-bambu-a1 | R |
| Model codes N2S / N1 | | memory of Bambu Studio profiles, not fetched | E |
| Everything else (base, beam, TIP 55, toolhead size, Z positions, screen angle, chute, feet) | | inferred from product photos in memory + 430 / 256 / 410 totals; no drawing found | E |

## 11. Wiki photo findings (second pass, supersedes the E values above where they conflict)

Legend: **W** = read from a wiki photo / text, **PM** = measured from a photo (scale from the official outer size, perspective
makes it +-10 %), **E** = estimate.

| Finding | Value | Source | Conf. |
|---|---|---|---|
| Frame colour | light silver aluminium; base light grey plastic with a dark grey lower edge; dark grey caps at the top corners and feet of the uprights | https://wiki.bambulab.com/en/a1/maintenance/printer (title photo) | W |
| A1 frame | two uprights + top beam; X beam between them with a row of steel balls on the front; the beam end at the right is a white motor block ("Bambu Lab A1") with a white handle/pin on top | same | W |
| Upright spacing / size | centres +-152 (inner gap ~268 so the 256 bed passes), 36 x 34 | photo, bed width | PM/E |
| Right block | camera lives here (wiki label "Live view camera"; the camera is a small white pill with lens + LED on a cable under the motor cover) | https://wiki.bambulab.com/en/a1/maintenance/camera-replacement-guide | W |
| Purge wiper | black wiper on a bracket hanging at the LEFT end of the X beam, blade at nozzle height; slides into a slot at the X-axis end from the back; waste falls to a box beside the left of the printer | unboxing guide step 15 + photo, https://wiki.bambulab.com/en/a1/manual/unboxing-a1-combo | W |
| Screen | small tilted stand at the front right of the base, ~ +125 mm from centre, tilt ~30 deg, light grey bezel, black glass; folds out | printer photo, unboxing step 14 | W/PM |
| USB-C cable | black cable, leaves the toolhead top (right, back), arcs ~140 mm above the top beam, comes down outside the right upright and ends in a dark cable box at the rear right of the base | printer photo, https://wiki.bambulab.com/en/a1/maintenance/usb-c-cable-replacement-guide | W |
| Toolhead | light grey square front with a round black fan (pale ring), "Bambu Lab" under it, dark extruder motor behind right, silver filament inlet cylinder on top left of centre, black hotend with sock below | printer photo | W |
| Spool holder | white "F" part: square clip with logo hooks on the beam facing forward, arm to the back, shaft sticks out sideways, PTFE connector at the arm's end; installed "middle right of the beam, close to the right side beam" | https://wiki.bambulab.com/en/a1/maintenance/spool-holder ; unboxing appendix | W (position), arm length E |
| A1 mini | one column on the right (silver, black rail strip with screws on the front, rounded dark top), the X arm is a bare linear rail cantilevered to the left, white X motor box with a white handle on the right of the column, wiper bracket at the left end, screen set into the front of the base right of centre (~ +108 mm), bed carriage housing white | https://wiki.bambulab.com/en/a1-mini/maintenance/a1-mini-com | W/PM |
| Mini camera | on the column below the arm (task note, label on the wiki overview) | https://wiki.bambulab.com/en/a1-mini | W |
| AMS Lite shape | flat light grey peanut-shaped plate, tilted ~20 deg (left end low), on a dark grey stand (foot along the shaft axis); one shaft through each lobe, a rotary spool holder on each face = 4 spools (orange / green shaft ends); two smoked feeder modules with orange knobs on the upper edge; official 397 x 208 x 342 | https://wiki.bambulab.com/en/a1/manual/unboxing-a1-combo step 16 | W (shape), part sizes E |
| AMS Lite hub | NOT on the AMS: a white hub on the toolhead top; 4 PTFE tubes (ports 1-2 short, 3-4 long, ~15 cm from the silicone organizer) from the AMS Lite stand up and over to it; placed on the right of the printer | https://wiki.bambulab.com/en/a1/maintenance/filament_hub_cleaning ; unboxing step 16 | W |
| External spool | short PTFE from the holder to the head's inlet | unboxing appendix | W |

## 12. Values used by the model package `card/models/bambu.a1/`

Nozzle line = z 0; A1 base 385 x 350 (z -150..200), 40 high; bed top 62 (mini 56, base 34); A1 columns x +-152, 36 x 34,
top beam 402..430 (official height 430); mini column x +128, 50 x 40, top 336, arm to x -128; X beam centre 52 over the
nozzle, 46 behind; head 54 x 52, 78 high; screen x +125 (mini +108, scale 0.82); holder A1 x +115 / mini on the column,
shaft 175 behind the beam. AMS Lite: lobes R 108 at +-100, 30 thick, tilt 19 deg, centre 188 high, spools +-53 from the
mid plane. Still estimated: part sizes (head, blocks, stand), holder arm length, cable route, spool positions on the
AMS Lite shafts. The old section 11 (all-E values) is replaced by this one.
