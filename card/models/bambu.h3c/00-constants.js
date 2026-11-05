// H3C constants (mm; X = width, Y = up, Z = towards the front; origin = footprint centre on the floor).
// Sizes: Bambu wiki FAQ (printer 493 x 571 x 587, AMS 3H 480 x 562 x 460, assembled 1016 tall). Everything else is read
// off the wiki photos (H3C overview page, Swaptek-rack replacement guide, front-cover / rear-panel guides), +/- 10-15 mm;
// see docs/printers/bambu-h3c.md.
const W = 493, D = 571, H = 587, T = 8;
const HW = W / 2, HD = D / 2;
const TIP = 410;                          // nozzle tip height at layer 0 (estimate; rack tool tips stand 20 mm higher)
const FLOOR = 50;                         // chamber floor top
const TUBE_R = 100;                       // minimum bend radius of the PTFE tubes
const HDR = 65, DOOR_Y0 = 44, DOOR_Y1 = H - HDR;          // silver front cover band (overview photo ~ 60-65), door under it
const PIL = 40;                           // front pillar width
// Swaptek rack (rack photo): nine docks in a row, ~36 mm apart, at the front of the chamber behind the cover band
const N_TOOLS = 9, PITCH = 36, RACK_Z = HD - 62, RACK_TIP = TIP + 20, TOOL_H = 90, TOOL_W = 28, TOOL_D = 36;
const RACK_DROP = 60;                     // how far the rack goes down on a tool change (wiki workflow: "drops to working height")
// The tool on the head: index 0 = PrintTool 1. There is no tool-changer entity in BamBuddy yet: bind it in _h3cActive().
const ACTIVE_TOOL = 0;
// head: carriage body with the tool plugged into its bottom (the tool's upper 20 mm are inside it)
const HEAD_BOT = TIP + TOOL_H - 20, HEAD_H = 60, HEAD_TOP = HEAD_BOT + HEAD_H, HEAD_W = 84, HEAD_D = 70;
const XR_Y = HEAD_BOT + 38, XR_Z = -44;   // X rail
const YR_X = 222;                         // Y rods along the side walls
const CHUTE = [87, 335, 50, 120];         // purge chute opening in the rear panel: centre x, y, width, height (rear photo)
const ZS = [[-215, 185], [215, 185], [0, -225]], ZR = [[-214, 214], [214, 214], [45, -225]], Z_TOP = TIP + 40;
// AMS 3H, built into the top: 480 x 562 x 460, overlapping the printer by 31 mm
const AMS3_Y = H - 31, AMS3_H = 460, AMS3_W = 480, AMS3_D = 562, AMS3_BAY = 90;   // BAY: the open band of tube bracket under the dome
const BRACKET_Y = AMS3_Y + 80, BRACKET_Z = -60;          // tube bracket in the AMS band (estimate)
const SPOOLS = ["#d9d9d6", "#1d1d1f", "#e63946", "#f4a261", "#2a9d8f", "#457b9d", "#8d5fd3", "#f1c40f", "#6b705c"];
