// Bambu Lab A1 / A1 mini constants (units mm, X = width, Y = up, Z = towards the front). The nozzle line is z 0: the
// core slides the bed under it (bed.z = -bed y). Sources: outer sizes and build volume = spec sheet; shapes, colours and
// part positions = the wiki photos (https://wiki.bambulab.com/en/a1/maintenance/printer for the A1,
// https://wiki.bambulab.com/en/a1-mini/maintenance/a1-mini-com for the mini, scale from the official outer size);
// the single numbers are listed in docs/printers/bambu-a1.md with their confidence.
// base: footprint of the base box (x half width, z rear / front, height); cols: x of the Z column centres (the mini has one
// on the right, the X arm cantilevers to the left); top: height of the top beam's underside (null: none); beam: x range
// of the X beam (A1: wiper bracket at the left end, motor block at the right end); scr: [x of the screen, scale].
const CFG = {
  a1: { w: 385, d: 410, h: 430, bed: 256, tip: 62, base: { hw: 192, z0: -150, z1: 200, h: 40 }, cols: [-152, 152], top: 402,
        beam: [-170, 170], colTop: 430, scr: [125, 1], idle: 50, amsGap: [60, 60], colW: 36, colD: 34 },
  a1mini: { w: 347, d: 315, h: 365, bed: 180, tip: 56, base: { hw: 173, z0: -110, z1: 175, h: 34 }, cols: [128], top: null,
        beam: [-128, 128], colTop: 336, scr: [108, 0.82], idle: 40, amsGap: [60, 60], colW: 50, colD: 40 },
};
const HEAD_H = 78;                       // nozzle tip to the top of the toolhead body (photo: ~75-85)
const BEAM_Y = 52, BEAM_Z = -46;         // X beam centre above the nozzle tip, and behind the nozzle line
// colours read off the wiki photos: anodised light silver frame, light grey plastic base / head, dark grey end caps and stand
const COL_AL = 0xa9adb2, COL_PLASTIC = 0xc4c7ca, COL_DARK = 0x55585d;
