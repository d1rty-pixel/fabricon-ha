// fabricon-card: interactive, live 3D model of a 3D printer with its AMS units (Fabricon dashboard).
//   type: custom:fabricon-card
//   printer: x2d_01p00a000000000          entity prefix of the printer (required)
//   printer_spec: {...}                    the printer's description (dashboard/spec.py, generated): its components
//                                          with their entities, model (mesh), build volume, kinematics. The machine
//                                          is drawn by the model package spec.mesh (card/models/<key>/, loaded on
//                                          demand; "generic" when there is none)
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
//   camera: camera entity for the overlay over the model when the spec lists none (toolbar key; live picture,
//           fullscreen, snapshot download; a dropdown with several cameras; also opened by a window
//           "fabricon-camera" event, detail.camera = a camera id)
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
// Units are millimetres; X = width, Y = up, Z = towards the front (sizes of each printer: its model package).
// Live: nozzle / bed / chamber heat glow, fan rotors at their speed, chamber light, door, active nozzle lift,
// AMS spool colours and fill, drying glow, toolhead and bed motion while printing. Click a part for its entity.
const V = "0.160.0";
const CDN = `https://cdn.jsdelivr.net/npm/three@${V}`;

// What head and bed do in a print_stage while nothing is extruded (HA reports no position: a choreography per kind,
// card/71-motion.js _stageMotion). Stages not listed (pauses, unknown) keep the head where it is.
const FAB_STAGE_MOTION = {
  park: ["heatbed_preheating", "heating_heatbed", "waiting_for_heatbed", "heating_nozzle", "checking_extruder_temperature",
    "heating_chamber", "waiting_for_chamber", "cooling_chamber", "cooling_heatbed", "thermal_preconditioning", "purifying_chamber_air",
    "identifying_build_plate", "checking_platform", "checking_material", "checking_material_position", "checking_quick_release_lever",
    "checking_door_and_cover", "confirming_birdseye_camera", "preparing", "m400_pause"],
  purge: ["changing_filament", "loading_filament", "unloading_filament", "preparing_ams", "preparing_hotend", "testing_hotend_change"],
  wipe: ["cleaning_nozzle_tip"],
  home: ["homing_toolhead"],
  probe: ["auto_bed_leveling", "high_temperature_bed_leveling", "bed_leveling_phase_1", "bed_leveling_phase_2", "measuring_surface"],
  shake: ["vibration_compensation", "motor_noise_cancellation", "motor_noise_showoff", "measuring_motion_precision",
    "enhancing_motion_precision", "measuring_motion_accuracy"],
  lines: ["calibrating_dynamic_flow", "calibrating_flow_ratio", "printing_calibration_lines", "calibrating_clumping_detection"],
  scan: ["scanning_bed_surface", "inspecting_first_layer", "calibrating_micro_lidar", "calibrating_lidar", "calibrating_nozzle_offset",
    "calibrating_birdseye_camera", "calibrating_live_view_camera", "calibrating_camera_offset"],
};
const FAB_STAGE_KIND = Object.fromEntries(Object.entries(FAB_STAGE_MOTION).flatMap(([k, l]) => l.map((st) => [st, k])));

// AMS 2 Pro (372 x 280 x 226): the unit's own size, the same on every printer; models place it (_geo.amsTop)
const AMS_W = 372, AMS_D = 280, AMS_BASE = 120, AMS_R = 106;
