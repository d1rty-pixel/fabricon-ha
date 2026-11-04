// X2D model constants (units mm, X = width, Y = up, Z = towards the front; origin = footprint centre on the floor).
const { W: AMS_W, D: AMS_D } = window.FabriconCard.AMS;
const W = 392, D = 406, H = 478, R = 14, T = 8;
// Height budget (no published drawing; estimated from photos, the 260 mm build height and the 478 mm body):
// chamber floor at 64, bed stack 16 under the plate top, so the bed bottoms out at TIP - 260 - 16 = 66; the head
// (22 hotend + 20 base + 70 body) ends 12 under the top frame (470). X shafts and Y rods sit at head height.
const TIP = 342;                          // nozzle tip height (bed top at layer 0)
const FLOOR = 64;                         // chamber floor top
const TUBE_R = 100;                       // minimum bend radius of the PTFE tubes (stiff; Bambu: don't kink them)
const CHUTE = [-62, 203, 50, 98];         // purge chute opening in the back panel: centre x, y, width, height
const DOOR_Y0 = 44, DOOR_Y1 = H - 64;     // door glass from the sill to the front cover band (wiki photos)
const HOT = 22, HEAD_BASE = 20, HEAD_BODY = 70, HEAD_TOP = TIP + HOT + HEAD_BASE + HEAD_BODY;
const XR_LO = 404, XR_HI = 434, XR_Z = -35;  // X guide shafts (2x hollow steel, 10 mm), behind the head's centre
const YR_X = 180, YR_Y = 419;             // Y rods (8 mm) along the side walls
// Z (Bambu wiki): three lead screws, the front two at the front door pillars, the rear one behind the inner lining's
// edge; three guide rods (three shaft holes in the base): left / right directly behind the front screws, one at the
// rear (its bearing is reached through the rear panel). The bed rests on the three sliders.
const ZS = [[-170, 174], [170, 174], [0, -184]], ZR = [[-170, 146], [170, 146], [48, -184]], Z_TOP = 372;
const AMS_Z = D / 2 - 26 - AMS_D / 2, AMS_Y = H + 4;      // a single AMS on the lid
