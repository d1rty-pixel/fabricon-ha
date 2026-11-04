// P2S model constants (units mm, X = width, Y = up, Z = towards the front; origin = footprint centre on the floor).
// Sources: wiki.bambulab.com P2S page (photo with part labels), p2s-faq / p2s-intro, "Replace the Rear Panel" photo
// (+/- 10 mm); docs/printers/bambu-p2s.md lists each value with its confidence. The platform and outer size are the X2D's.
const { W: AMS_W, D: AMS_D } = window.FabriconCard.AMS;
const W = 392, D = 406, H = 478, R = 14, T = 8;       // outer size: official
// Heights (estimates, no drawing): floor 30 (rear photo: plinth + feet); the bed bottoms out at TIP - 256 - 16 = 58;
// the head (12 hotend + 14 duct + 64 body) ends 50 under the top frame.
const TIP = 330;                          // nozzle tip height (bed top at layer 0)
const FLOOR = 30;                         // chamber floor top
const TUBE_R = 100;                       // minimum bend radius of the PTFE tubes
const DOOR_Y0 = 24, DOOR_Y1 = H - 46;     // door glass from the sill to the slim front cover band (wiki photo: band ~ 46 mm)
// Rear panel (wiki "replace rear panel" photo, converted to front coordinates): centre x, y, width, height
const CHUTE = [-69, 198, 51, 95];         // purge chute opening
const GRILLE = [-126, 201, 40, 77];       // mesh grille
const BUFFER = [28, 286, 95, 68];         // rectangular recess = where the filament buffer sits
const BRACKET = [137, 400];               // upper spool holder plate (350 mm tube to the buffer)
const SLOT = [-142, 458];                 // cable / filament slot near the top
const HOT = 12, DUCT_H = 14, BODY_H = 64, HEAD_TOP = TIP + HOT + DUCT_H + BODY_H;
const XR_LO = 366, XR_HI = 396, XR_Z = -30;   // hollow steel X rods (wiki: smooth rods), behind the head's centre
const YR_X = 180, YR_Y = 381;             // Y rods along the side frames
// Z (wiki p2s-intro): three lead screws, front left / right and centre rear, one motor + belt; a guide rod beside each
const ZS = [[-160, 165], [160, 165], [0, -175]], ZR = [[-178, 165], [178, 165], [36, -175]], Z_TOP = TIP + 36;
const AMS_Z = D / 2 - 26 - AMS_D / 2, AMS_Y = H + 4;      // a single AMS on the lid
