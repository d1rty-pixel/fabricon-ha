// H2D / H2D Pro / H2S / H2C constants (units mm, X = width, Y = up, Z = towards the front; origin = footprint centre
// on the floor). Sizes: Bambu wiki FAQ pages (492 x 514 x 626 for the whole family); heights below are photo estimates.
const { W: AMS_W, D: AMS_D } = window.FabriconCard.AMS;
const W = 492, D = 514, H = 626, T = 8;
const HW = W / 2, HD = D / 2;
// Height budget (no drawing; wiki toolhead photos): the cover is ~80 wide and ~88 tall, the hotends hang ~48 under it.
// The head's top has to clear the top frame (underside 592), the bed (325 mm travel) must still fit above the floor.
const TIP = 430;                          // nozzle tip height (bed top at layer 0)
const FLOOR = 50;                         // chamber floor top (base ring 35 + plate)
const TUBE_R = 100;                       // minimum bend radius of the PTFE tubes
const HOT = 48, BODY = 88, HEAD_TOP = TIP + HOT + BODY;       // hotend height, cover height, top of the cover
const HEAD_W = 80, HEAD_D = 70;           // cover, from the photo: pair of hotends ~52 wide, cover 1.5x that
const NOZ_DX = 13;                        // nozzle spacing 25 mm (left-only / right-only reach, wiki printable range)
const XR_Y = TIP + HOT + 22, XR_Z = -44;  // X linear rail height: ~22 over the cover's lower edge (hotend photo)
const YR_X = 222;                         // Y rods along the side walls
const DOOR_Y0 = 44, HDR = 66, DOOR_Y1 = H - HDR;          // door glass from the sill to the black front header
const PIL = 43;                           // front pillar width (front photo, 1.24 mm / px)
const CHUTE = [-84, 346, 67, 132];        // purge chute opening in the rear panel: centre x, y, width, height (rear photo)
const WINDOW = { z: 5, y: 377, w: 380, h: 237 };          // side windows from the wiki overview photo (not on the H2S)
// Z: three lead screws (front left / right at the door pillars, rear centre), guide rods beside them
const ZS = [[-215, 185], [215, 185], [0, -225]], ZR = [[-214, 214], [214, 214], [45, -225]], Z_TOP = TIP + 40;
const BUF = [150, 640, -HD - 17];          // filament buffer box behind the rear panel (120 tall): x, top y, z
const AMS_Z = HD - 30 - AMS_D / 2, AMS_Y = H + 4;         // a single AMS on the lid
