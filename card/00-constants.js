// fabricon-card: interactive, live 3D model of a Bambu Lab X2D with an AMS 2 Pro on top (Fabricon dashboard).
//   type: custom:fabricon-card
//   printer: x2d_01p00a000000000          entity prefix of the printer (required)
//   ams: true | false                      AMS units (default true): found at runtime as the HA devices under the
//                                          printer (up to 4, lettered A-D by the integration); false: none
//   ams_position: top | left | right       where a single AMS stands (default top); the AMS dropdown overrides it per
//                                          browser. Two or more stand on the table, A B ... from left to right, split
//                                          left and right of the printer; the dropdown is hidden then
//   panels: a panel's `per_ams: [cards]` is repeated for each AMS, before its `cards`; in those cards __AMS__,
//           __AMS_ID__ and __AMS_DEV__ become the unit's entity prefix, letter and device id
//   exhaust_box: true                      the External Exhaust Fan kit on the back (HA can't tell it is fitted)
//   stl: /local/prints/current.stl         optional: the job's model, grown on the bed with the print progress
//   height: fill | <css height>            optional: "fill" = from the card's top edge to the bottom of the window,
//                                          kept up to date when banners above it come and go (default: the parent's)
//   panels: [{key, label, name, icon, gap, cards: [...]}]                    fly-out sidebar sections (Lovelace cards);
//                                                                           gap: a space before it in the rail (a new group)
//   camera: camera entity for the overlay over the model (toolbar key; live picture, fullscreen, snapshot download;
//           also opened by a window "fabricon-camera" event)
//   footer: [cards], footer_columns: CSS grid columns                          control strip under the model
//   footer_narrow: {columns, span: {index: n}, order: [index, ...]}            its layout when the card is under 640 px
// Layout follows the card's own width: under 1500 px panels slide over the model ("narrow"), under 1100 px the print
// dock goes under the model ("stack"), under 900 px of model area the rail and view tools shrink to icons
// ("compact"), under 600 px ("tiny", phones) the model is small with a fixed view (no orbit, swipes scroll), labels
// start hidden, only camera / x-ray stay, the module keys run in a row and a remembered panel is not reopened.
//   serial: printer serial number: the Print dock (left of the model, under it on narrow cards) lists the printer's
//           USB stick through the fabricon proxy (custom_components/fabricon); a picked file goes into the 3D view and its filaments
//           are mapped to slots. footer entry {fab_start: true} = the START key: asks whether the plate is empty,
//           marks it cleared in Bambuddy and queues the file there
// The picked file is kept in this browser (IndexedDB). G-code is replayed: the head follows the real moves of the current layer from the M73 progress mark on, at the
// file's feed rates, and the extruded paths grow on the bed. HA reports no head position, so within a layer this
// is the file's path, not a live readout.
// Units are millimetres; X = width, Y = up, Z = towards the front. Sizes follow the published specs
// (printer 392 x 406 x 478, AMS 2 Pro 372 x 280 x 226, bed 256 x 256, 260 build height).
// Live: nozzle / bed / chamber heat glow, fan rotors at their speed, chamber light, door, active nozzle lift,
// AMS spool colours and fill, drying glow, toolhead and bed motion while printing. Click a part for its entity.
const V = "0.160.0";
const CDN = `https://cdn.jsdelivr.net/npm/three@${V}`;

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
const AMS_W = 372, AMS_D = 280, AMS_BASE = 120, AMS_R = 106;
const AMS_Z = D / 2 - 26 - AMS_D / 2, AMS_Y = H + 4;
