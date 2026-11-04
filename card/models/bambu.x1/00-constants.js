// X1 Carbon / P1S model constants (units mm, X = width, Y = up, Z = towards the front; origin = footprint centre on the
// floor). Both printers share the chassis (389 x 389 x 457, official), so one set of numbers serves both; the
// variant (this._spec().profile, "bambu.x1c" / "bambu.p1s") only changes the front, the head and the rear.
// Sources: wiki.bambulab.com X1 / P1 glossary (front photos), "Replace the Rear Metal Panel" guides (flat panel photo,
// scale from the panel height ~449 mm, so +/- 3 %), docs/printers/bambu-x1c.md and bambu-p1s.md list each value.
const { W: AMS_W, D: AMS_D } = window.FabriconCard.AMS;
const W = 389, D = 389, H = 457, R = 12, T = 8;
const TIP = 305;                          // nozzle tip at layer 0 (rear photo: black duct bottom ~311)
const FLOOR = 30;                         // chamber floor top (plinth ~24 + feet ~6)
const TUBE_R = 100;                       // minimum bend radius of the PTFE tubes
const DOOR_Y0 = 22, DOOR_Y1 = 393;        // door glass bottom (photo estimate, both variants) and top (photo: band ~62 mm); the band above carries the logo
// Rear panel openings, measured on the wiki's flat rear panel photo (x seen from the FRONT, i.e. the photo is taken
// as the inside view: the purge wiper / chute is at the back right in the front photos): centre x, y, width, height.
const CHUTE = [68, 194, 52, 101];         // purge chute opening
const FANWIN = [-98, 196, 89, 102];       // chamber fan grille (big perforated block)
const GRILLE2 = [126, 196, 32, 102];      // second, narrow perforated block
const SLOT = [62, 444];                   // filament slot at the top of the back panel (51 x 11)
const BRACKET = [3, 287, 94, 47];         // embossed bracket with five screws: the spool holder mounts here
const HOT = 12, DUCT_H = 16, BODY_H = 62, HEAD_TOP = TIP + HOT + DUCT_H + BODY_H;    // toolhead: duct bottom 10-12 over the nozzle tip
const XR_LO = 358, XR_HI = 390, XR_Z = -26;   // carbon X rods, 32 mm apart, behind the head's centre
const YR_X = 172, YR_Y = 374;             // steel Y rods along the side walls (rear photo: y ~ 372)
// Z: three lead screws (front pair at the front pillars, one at the rear centre), each with a smooth guide rod beside it
// (rear photo: rods 25 mm outside the front screws, 36 mm right of the rear one); the bed rests on three sliders.
const ZS = [[-158, 160], [158, 160], [0, -170]], ZR = [[-180, 160], [180, 160], [36, -170]], Z_TOP = TIP + 30;
const AMS_Z = D / 2 - 26 - AMS_D / 2, AMS_Y = H + 4;     // a single AMS on the lid
