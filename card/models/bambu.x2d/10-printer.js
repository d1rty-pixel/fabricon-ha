// The printer itself (_build) and the table under it.
Object.assign(MODEL, {
  // ------------------------------------------------------------------ the machine

  _build() {
    const T3 = this.T, M = this.M, e = this._e.bind(this);
    const hw = W / 2, hd = D / 2, slabXY = this._slabXY.bind(this);

    // shell: corner posts, side / back panels, plinth, header, top frame
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) this._cyl(R, H - 8, "y", M.body, x * (hw - R), 8 + (H - 8) / 2, z * (hd - R), null, null, 24);
    // side walls (outer panel and inner lining) with the window opening cut out
    const winY = H - 40 - 53, sideWall = (w, h, y0, d, mat, x) => {
      const sh = new T3.Shape(), hole = new T3.Path(), hw2 = 156, hh2 = 53, yc = winY - y0 - h / 2, q = 10;
      sh.moveTo(-w / 2, -h / 2); sh.lineTo(w / 2, -h / 2); sh.lineTo(w / 2, h / 2); sh.lineTo(-w / 2, h / 2); sh.lineTo(-w / 2, -h / 2);
      hole.moveTo(-hw2 + q, yc - hh2); hole.lineTo(hw2 - q, yc - hh2); hole.quadraticCurveTo(hw2, yc - hh2, hw2, yc - hh2 + q);
      hole.lineTo(hw2, yc + hh2 - q); hole.quadraticCurveTo(hw2, yc + hh2, hw2 - q, yc + hh2); hole.lineTo(-hw2 + q, yc + hh2);
      hole.quadraticCurveTo(-hw2, yc + hh2, -hw2, yc + hh2 - q); hole.lineTo(-hw2, yc - hh2 + q); hole.quadraticCurveTo(-hw2, yc - hh2, -hw2 + q, yc - hh2);
      sh.holes.push(hole);
      const g = new T3.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false, curveSegments: 6 }).translate(0, 0, -d / 2).rotateY(Math.PI / 2);
      return this._m(g, mat, x, y0 + h / 2, 0);
    };
    for (const s of [-1, 1]) sideWall(D - 2 * R, H - 8, 8, T, M.body, s * (hw - T / 2));
    // back wall and inner back lining, both with the purge chute's opening cut out
    const backWall = (w, h, y0, d, mat, z) => {
      const sh = new T3.Shape();
      sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h); sh.lineTo(-w / 2, h); sh.lineTo(-w / 2, 0);
      const hole = new T3.Path(), [cx, cy, cw, ch] = CHUTE, q = 8, x0 = cx - cw / 2, x1 = cx + cw / 2, ya = cy - ch / 2 - y0, yb = cy + ch / 2 - y0;
      hole.moveTo(x0 + q, ya); hole.lineTo(x1 - q, ya); hole.quadraticCurveTo(x1, ya, x1, ya + q); hole.lineTo(x1, yb - q);
      hole.quadraticCurveTo(x1, yb, x1 - q, yb); hole.lineTo(x0 + q, yb); hole.quadraticCurveTo(x0, yb, x0, yb - q); hole.lineTo(x0, ya + q);
      hole.quadraticCurveTo(x0, ya, x0 + q, ya);
      sh.holes.push(hole);
      return this._m(new T3.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false, curveSegments: 6 }).translate(0, 0, -d / 2), mat, 0, y0, z);
    };
    backWall(W - 2 * R, H - 8, 8, T, M.body, -hd + T / 2);
    this._box(W - 2 * R, DOOR_Y0 - 8, T, M.body, 0, 8 + (DOOR_Y0 - 8) / 2, hd - T / 2);         // sill under the door
    this._box(W - 2 * R, H - DOOR_Y1, T, M.body, 0, (H + DOOR_Y1) / 2, hd - T / 2);              // front cover band
    this._box(W - 2 * R, T, 34, M.body, 0, H - T / 2, hd - 17);
    this._box(W - 2 * R, T, 34, M.body, 0, H - T / 2, -hd + 17);
    for (const s of [-1, 1]) this._box(34, T, D - 2 * R, M.body, s * (hw - 17), H - T / 2, 0);
    this._box(W - 60, 4, D - 60, M.glass, 0, H - 4, 0);                                 // glass lid
    this._box(W - 2 * T, 6, D - 2 * T, M.inner, 0, FLOOR - 3, 0);                        // chamber floor
    backWall(W - 2 * T - 2, H - 8 - FLOOR, FLOOR, 2, M.inner, -hd + T + 1);                                // inner back
    for (const s of [-1, 1]) sideWall(D - 2 * T, H - 8 - FLOOR, FLOOR, 2, M.inner, s * (hw - T - 1));
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) this._cyl(9, 8, "y", M.black, x * (hw - 30), 4, z * (hd - 30));

    // side windows (side panel photos, Bambu wiki): 312 x 106 mm, rounded, black rim, centred front to back with
    // the top edge 40 mm under the top
    for (const s of [-1, 1]) {
      const yc = winY;
      (this._winRims ||= []).push(this._m(slabXY(322, 116, 14, 1.4, [310, 104, 9]).rotateY(Math.PI / 2), M.black, s * (hw + 0.2), yc, 0));
      this._m(slabXY(312, 106, 10, 1).rotateY(Math.PI / 2), M.tint, s * (hw + 1.2), yc, 0);
    }
    // side fans: left carries the chamber heater, right recirculates through the filter
    this._fans = {
      aux_l: this._fan(52, "x-", -hw - 2, 168, 52, e("fan", "left_auxiliary_fan")),
      aux_r: this._fan(52, "x+", hw + 2, 168, 52, e("fan", "right_auxiliary_fan")),
    };
    // External Exhaust Fan kit (optional): a rounded box with a filter over the rear exhaust grille, its fan grille
    // protruding at the back
    if (this._cfg.exhaust_box) {
      const bw = 148, bh = 110, bd = 56, by = 201, bx = 40;                  // over the exhaust grille
      const sh = new T3.Shape(), x = bw / 2, y = bh / 2, q = 18;
      sh.moveTo(-x + q, -y); sh.lineTo(x - q, -y); sh.quadraticCurveTo(x, -y, x, -y + q); sh.lineTo(x, y - q);
      sh.quadraticCurveTo(x, y, x - q, y); sh.lineTo(-x + q, y); sh.quadraticCurveTo(-x, y, -x, y - q); sh.lineTo(-x, -y + q);
      sh.quadraticCurveTo(-x, -y, -x + q, -y);
      const g = new T3.ExtrudeGeometry(sh, { depth: bd - 8, bevelEnabled: true, bevelThickness: 4, bevelSize: 4, bevelSegments: 4, curveSegments: 12 });
      this._m(g, M.bodyDark, bx, by, -hd - bd + 4, null, e("fan", "exhaust_fan"));
      this._fans.exhaust = this._fan(40, "z-", bx, by, -hd - bd - 1, e("fan", "exhaust_fan"));
    }
    this._heaterRing = new T3.Object3D();                     // the heater sits behind the left fan: label anchor only
    this._heaterRing.position.set(-hw + 12, 168, 52);
    this._scene.add(this._heaterRing);
    // rear panel (Bambu wiki, X2D rear panel guide; seen from behind, the printer's +x is on the left): the big
    // exhaust grille in the middle with the filament buffer above it, the purge chute opening beside it, the PSU
    // grilles at the left edge, the auxiliary extruder in the upper left corner, the filament inlet slot at the top,
    // power switch / socket and the spool holder plates on the right
    const RZ = -hd;
    const perf = (w, h, x, y) => {                                      // UVs in 8 mm tiles: holes at a 4 mm pitch
      const g = new T3.PlaneGeometry(w, h).rotateY(Math.PI), uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 8, uv.getY(i) * h / 8);
      return this._m(g, this._perfMat(), x, y, RZ - 0.4);
    };
    this._filter = perf(141, 102, 40, 201);                                              // exhaust grille
    this._filter.userData.entity = e("fan", "ventilation"); this._clickable.push(this._filter);
    perf(41, 100, -124, 203); perf(41, 110, -124, 82);                                   // PSU grilles
    // purge chute: a rounded rim around the opening outside. Inside, a slim vertical shaft in the gap between the bed
    // carrier's back edge (z -140) and the inner back lining, so it never enters the build volume: open at the top
    // just under the nozzle with a lip leaning into the chamber, a ramp at the bottom that drops the purged
    // filament through the opening and out of the back
    this._m(slabXY(CHUTE[2] + 8, CHUTE[3] + 8, 10, 2, [CHUTE[2], CHUTE[3], 8]), M.bodyDark, CHUTE[0], CHUTE[1], RZ - 1);
    {
      const mat = this._chuteMat ||= new T3.MeshStandardMaterial({ color: 0x141416, roughness: 0.8, side: T3.DoubleSide });
      const [cx, , cw] = CHUTE, zb = -hd + T + 2, zf = -152, top = TIP - 18, low = CHUTE[1] - CHUTE[3] / 2;
      const rampY = low + (zf - zb), ramp = Math.hypot(zf - zb, rampY - low);   // 45 degrees, front edge to sill
      this._box(cw + 4, top - rampY, 2, mat, cx, (top + rampY) / 2, zf);                            // front wall
      for (const s of [-1, 1]) this._box(2, top - low, zf - zb, mat, cx + s * (cw / 2 + 1), (top + low) / 2, (zf + zb) / 2);
      this._m(new T3.BoxGeometry(cw, 2, ramp).rotateX(-Math.atan2(rampY - low, zf - zb)), mat, cx, (rampY + low) / 2, (zf + zb) / 2);
      this._m(new T3.BoxGeometry(cw + 4, 2, 14).rotateX(-Math.PI / 4), mat, cx, top + 5, zf + 5);     // entry lip
    }
    // filament buffer: two lanes (left / right nozzle) with orange sliders behind windows
    this._buffer = this._m(slabXY(95, 58, 6, 24), M.bodyDark, 38, 297, RZ - 12, null, e("select", "active_nozzle"));
    for (const dy of [12, -12]) {
      this._box(44, 13, 1, M.black, 52, 297 + dy, RZ - 24.4);
      this._box(30, 9, 2, M.orange, 50, 297 + dy, RZ - 24.6);
    }
    // auxiliary extruder (feeds the right nozzle; wiki photos): upright block in the upper corner, its top just under
    // the panel's top edge; filament in through a push fitting on its outer side, out through a lock nut on its
    // inner side, from where a short straight tube runs into the inlet slot. Beside it, in the very corner, the
    // orange filament tube bracket: the left-nozzle lane goes straight through the panel there.
    this._auxExt = this._m(slabXY(52, 72, 8, 50), M.bodyDark, -135, 419, RZ - 25, null, e("select", "active_nozzle"));
    this._cyl(4.5, 6, "x", M.black, -164, 444, RZ - 30, null, null, 14);                     // inlet push fitting
    this._cyl(4.5, 5, "x", M.steel, -107, 446, RZ - 30, null, null, 6);                      // outlet lock nut
    this._cyl(5.5, 20, "x", M.orange, -176, 463, RZ - 9, null, null, 16);                    // tube bracket
    this._cyl(4, 4, "x", M.black, -188, 463, RZ - 9, null, null, 14);
    this._m(slabXY(42, 10, 4, 4), M.black, -14, 459, RZ - 1);                           // filament inlet slot
    // power switch and socket, spool holder bases, tube clip
    this._box(32, 46, 4, M.black, 131, 69, RZ - 2);
    this._box(14, 9, 2, M.screenBezel, 131, 80, RZ - 4.5);
    this._box(28, 26, 6, M.black, 138, 410, RZ - 3);
    // spool holders (wiki, X2D unboxing guides): two bases on the panel, each a plate with two square slots the
    // holder's bracket slides into. The upper holder carries the PTFE tube holder and feeds the right-nozzle lane of
    // the buffer (the AMS feeds the left one); the lower one is only there without an AMS and never gets a tube.
    for (const y of [367, 134]) {
      this._m(slabXY(44, 60, 6, 4), M.bodyDark, 145, y, RZ - 2);
      for (const dy of [13, -13]) this._box(15, 15, 1, M.black, 145, y + dy, RZ - 4.1);
    }
    this._holders = { right: this._spoolHolder(145, 367, "right", true), left: this._spoolHolder(145, 134, "left", false) };
    this._holders.left.grp.visible = false;                                // shown while no AMS is connected (_amsChanged)

    // front: header band with the logo, tiltable 5" screen on the left corner. Logo after the product photos:
    // printed dark, high on the right -- "Bambu" over "Lab", then "X2D" in wide lettering, its right end at x 157
    const logo = this._text("X2D", 40, 10, { color: "#0c0d0f", weight: 700, stretch: 1.45, align: "left", px: 256, fit: true });
    logo.position.set(138, H - 15, hd + 0.6);
    const brand = this._text("Bambu\nLab", 22, 10, { color: "#0c0d0f", weight: 700, align: "left", px: 256, fit: true });
    brand.position.set(104, H - 15, hd + 0.6);
    this._scene.add(logo, brand);
    const scr = new T3.Group();
    scr.position.set(-100, H - 34, hd + 12);       // on the front cover's mount (left half), its top just above the lid line
    scr.rotation.x = -0.32;
    scr.scale.setScalar(0.72);
    this._scene.add(scr);
    this._box(138, 84, 10, M.screenBezel, 0, 0, 0, scr, e("sensor", "print_status"));
    this._box(30, 30, 30, M.bodyDark, 0, 0, -20, scr);                       // mount, centred behind the screen
    this._screenCanvas = document.createElement("canvas");
    this._screenCanvas.width = 512; this._screenCanvas.height = 300;
    this._screenTex = new T3.CanvasTexture(this._screenCanvas);
    this._screenTex.colorSpace = T3.SRGBColorSpace;
    const sm = new T3.Mesh(new T3.PlaneGeometry(124, 72), new T3.MeshBasicMaterial({ map: this._screenTex, toneMapped: false }));
    sm.position.z = 5.2;
    scr.add(sm);

    // USB-A port (reviews: on the top behind the screen, upper left like the H2D): the receptacle is sunk into the
    // top frame, a stick plugs in from above. The stick = SanDisk Ultra Fit (14.3 x 5 mm, black, low profile): only
    // its short body with the lanyard slot shows; visible while binary_sensor usb_drive is on (_apply)
    const ux = -100, uz = hd - 20, usbEnt = e("binary_sensor", "usb_drive");
    this._box(18, 1, 9, M.screenBezel, ux, H + 0.5, uz, null, usbEnt);                 // port bezel
    this._box(13, 0.4, 5.6, M.black, ux, H + 1.05, uz);                                 // opening
    this._usb = new T3.Group();
    this._usb.position.set(ux, H + 1, uz);
    this._scene.add(this._usb);
    const fit = new T3.MeshStandardMaterial({ color: 0x141416, metalness: 0.15, roughness: 0.42 });
    this._box(14.3, 8, 5, fit, 0, 4, 0, this._usb, usbEnt);
    this._box(14.3, 0.6, 4.4, fit, 0, 8.3, 0, this._usb, usbEnt);                       // softened top edge
    this._box(6, 2, 5.2, M.black, 0, 6, 0, this._usb);                                  // lanyard slot
    this._usb.visible = false;

    // door (product photos): smoked glass from the sill to the front cover band, 24 mm in from the left edge and
    // nearly to the right one, a 16 mm black print around its edge on the inside. Hinged on the left from the inside:
    // per hinge two black round pads behind the glass, only a small steel tab shows at the glass edge. The handle:
    // a fixed light-silver pill, 45 x 16, at 240 mm, just over the glass's right edge, "Bambu Lab" printed on it
    this._door = new T3.Group();
    this._door.position.set(-hw + 24, 0, hd + 3);
    this._scene.add(this._door);
    const dw = W - 24 - 6, dx = dw / 2, dh = DOOR_Y1 - DOOR_Y0 - 2, dy = DOOR_Y0 + 1 + dh / 2;
    this._m(slabXY(dw, dh, 3, 4), M.tint, dx, dy, 0, this._door);
    const frit = this._fritMat ||= new T3.MeshPhysicalMaterial({ color: 0x030304, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 });
    this._m(slabXY(dw, dh, 3, 0.4, [dw - 32, dh - 32, 2]), frit, dx, dy, 2.2, this._door);   // the print, seen through the glass
    for (const [y, ty] of [[DOOR_Y1 - 19, DOOR_Y1 - 10], [DOOR_Y0 + 19, DOOR_Y0 + 7]]) {
      for (const x of [24, 53]) {
        this._cyl(6, 4, "z", M.bodyDark, x, y, -4.6, this._door, null, 20);
        this._cyl(2, 1, "z", M.steel, x, y, -2.4, this._door, null, 12);                       // its screw
      }
      this._box(16, 3, 5, M.steel, 8, ty, 0.6, this._door);                                  // over the print
    }
    {
      const hl = 45, hh = 16, sh = new T3.Shape();
      sh.absarc(hl / 2 - hh / 2, 0, hh / 2, -Math.PI / 2, Math.PI / 2, false);
      sh.absarc(-hl / 2 + hh / 2, 0, hh / 2, Math.PI / 2, Math.PI * 1.5, false);
      const g = new T3.ExtrudeGeometry(sh, { depth: 5, bevelEnabled: true, bevelThickness: 1.5, bevelSize: 1.5, bevelSegments: 4, curveSegments: 16 });
      const grip = this._m(g, M.handle, dw + 4 - hl / 2, 240, 2, this._door, e("binary_sensor", "door"));
      const txt = this._text("Bambu Lab", 30, 8, { color: "#1b1c1e", weight: 600, px: 256, fit: true });
      txt.position.z = 6.6;
      grip.add(txt);
    }

    // chamber light: LED bar along the top of the left wall
    this._ledBar = this._box(10, 4, 220, M.led, -hw + T + 10, H - 22, 0);
    const lamp = new T3.PointLight(0xfff1dc, 0, 900, 1.6);
    lamp.position.set(-hw + 60, H - 40, 0);
    this._scene.add(lamp);
    this._lights = { chamber: { lamp, bar: this._ledBar, power: 1.4 } };
    this._doors = { front: { g: this._door, open: -1.75 } };

    // CoreXY gantry (P2S / X2D platform): an 8 mm Y rod along each side wall, the carriage = a slider block on each
    // rod holding two stacked 10 mm hollow-steel X shafts; the toolhead runs on them on graphite sleeves. The XY
    // motors sit in the rear corners (belts left out). Only the carriage and the head move.
    const ylen = D - 2 * T - 24;
    for (const s of [-1, 1]) {
      this._cyl(4, ylen, "z", M.steel, s * YR_X, YR_Y, 0, null, null, 20);
      for (const z of [-1, 1]) this._box(16, 26, 12, M.bodyDark, s * (YR_X + 2), YR_Y, z * (ylen / 2 - 2));      // rod brackets
      this._box(42, 40, 42, M.black, s * 152, 400, -hd + T + 23);                                             // NEMA 17
      this._cyl(6, 16, "y", M.alu, s * 152, 428, -hd + T + 23, null, null, 20);                               // pulley
    }
    this._carriage = new T3.Group();
    this._scene.add(this._carriage);
    const xlen = 2 * (YR_X + 4);
    for (const y of [XR_LO, XR_HI]) this._cyl(5, xlen, "x", M.steel, 0, y, XR_Z, this._carriage, null, 24);
    for (const s of [-1, 1]) {
      // slider: block on the Y rod with bushing collars front and back, clamping the shaft ends
      this._box(22, 50, 30, M.bodyDark, s * (YR_X - 3), (XR_LO + XR_HI) / 2, XR_Z, this._carriage);
      for (const dz of [-17, 17]) this._cyl(8, 6, "z", M.black, s * YR_X, YR_Y, XR_Z + dz, this._carriage, null, 20);
    }

    // toolhead (after Bambu's front photo): matte grey rounded body, chrome-framed logo window on top, radial
    // part-cooling fan in a round recess (fine impeller ring around a large motor cap), black base with a centre
    // nose underneath; PTFE couplings on top, toolhead camera on the right; the hotends hang below the base
    this._head = new T3.Group();
    this._scene.add(this._head);
    const hb = TIP + HOT;                                                  // underside of the black base
    const HW = 64, HD = 56, BASE_H = HEAD_BASE, BODY_H = HEAD_BODY, FZ = HD / 2;   // FZ: front face
    const outline = (w, h, r) => {
      const sh = new T3.Shape(), x = w / 2, y = h / 2;
      sh.moveTo(-x + r, -y); sh.lineTo(x - r, -y); sh.quadraticCurveTo(x, -y, x, -y + r); sh.lineTo(x, y - r);
      sh.quadraticCurveTo(x, y, x - r, y); sh.lineTo(-x + r, y); sh.quadraticCurveTo(-x, y, -x, y - r); sh.lineTo(-x, -y + r);
      sh.quadraticCurveTo(-x, -y, -x + r, -y);
      return sh;
    };
    const slab = (sh, depth, bevel) => {
      const g = new T3.ExtrudeGeometry(sh, { depth: Math.max(0.1, depth - 2 * bevel), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 12 });
      return g.translate(0, 0, -(depth - 2 * bevel) / 2);
    };
    const rounded = (w, h, d, r, bevel = 2.5) => slab(outline(w, h, r), d, bevel);
    const grey = new T3.MeshStandardMaterial({ color: 0x3d3f43, metalness: 0.2, roughness: 0.66 });
    const baseMat = new T3.MeshStandardMaterial({ color: 0x17181a, metalness: 0.15, roughness: 0.7 });
    this._shell.push(grey, baseMat);
    const bodyY = hb + BASE_H + BODY_H / 2, fanY = hb + BASE_H + BODY_H * 0.35, fanR = 22;
    // grey body: a block plus a front plate with the fan opening
    this._m(slab(outline(HW - 2, BODY_H, 9), HD - 6, 2.5), grey, 0, bodyY, -3, this._head, e("sensor", "print_stage"));
    const front = outline(HW, BODY_H, 10), opening = new T3.Path();
    opening.absarc(0, fanY - bodyY, fanR, 0, Math.PI * 2, true);
    front.holes.push(opening);
    this._m(slab(front, 6, 1.5), grey, 0, bodyY, FZ - 3, this._head, e("sensor", "print_stage"));
    this._fans.part = this._fan(fanR, "z+", 0, fanY, FZ - 0.5, e("fan", "part_cooling_fan"), this._head, "blower");
    // logo window: chrome frame, light panel, dark lettering
    const win = new T3.Group();
    win.position.set(0, hb + BASE_H + BODY_H - 13, FZ);
    this._head.add(win);
    this._m(slab(outline(50, 17, 3), 3, 0.8), M.steel, 0, 0, 0.6, win);
    this._m(slab(outline(45, 12, 2), 2, 0.4), new T3.MeshStandardMaterial({ color: 0xb4b7bc, metalness: 0.1, roughness: 0.25 }), 0, 0, 1.6, win);
    const tl = this._text("Bambu Lab", 34, 7, { color: "#1b1c1e", weight: 700 });
    tl.position.set(0, -0.5, 2.75);
    win.add(tl);
    // top corner steps
    for (const sx of [-1, 1]) this._box(8, 3, HD - 10, baseMat, sx * (HW / 2 - 4), hb + BASE_H + BODY_H + 0.5, -3, this._head);
    // black base with its centre nose and side feet
    this._m(slab(outline(HW, BASE_H, 5), HD, 1.5), baseMat, 0, hb + BASE_H / 2, 0, this._head);
    this._m(slab(outline(22, 6, 1.5), 16, 0.8), baseMat, 0, hb - 2.5, FZ - 9, this._head);
    for (const sx of [-1, 1]) this._box(4, 3, 10, baseMat, sx * (HW / 2 - 3), hb - 1.5, FZ - 8, this._head);
    // top: PTFE couplings (main + bowden for the right nozzle)
    for (const [dx, dz] of [[-10, -8], [14, -14]]) {
      this._cyl(6, 8, "y", M.black, dx, hb + BASE_H + BODY_H + 4, dz, this._head);
      this._cyl(4.5, 3, "y", M.steel, dx, hb + BASE_H + BODY_H + 9, dz, this._head);
    }
    // back: bearing block around the X shafts
    this._box(46, XR_HI - XR_LO + 14, 14, baseMat, 0, (XR_LO + XR_HI) / 2, XR_Z - 1, this._head);
    // right side: toolhead camera
    this._m(slab(outline(16, 30, 4), 10, 1), M.screenBezel, HW / 2 + 5, hb + BASE_H + 14, 6, this._head);
    this._cyl(3.6, 3, "y", new T3.MeshPhysicalMaterial({ color: 0x0a1018, metalness: 0.4, roughness: 0.05 }), HW / 2 + 5, hb + BASE_H - 2, 8, this._head, null, 20);
    this._headCover = null;

    // hotends
    this._nozzles = {};
    const gold = new T3.MeshStandardMaterial({ color: 0xc9a040, metalness: 0.9, roughness: 0.3 });
    const sock = new T3.MeshStandardMaterial({ color: 0x2b2b2d, metalness: 0, roughness: 0.92 });
    for (const [k, x] of [["left", -16], ["right", 16]]) {
      const g = new T3.Group();
      g.position.x = x;
      this._head.add(g);
      const ent = e("number", `${k}_nozzle_target_temperature`);
      this._m(rounded(24, 15, 24, 4, 1.2), M.screenBezel, 0, TIP + 14.5, 0, g, ent);     // hotend shell
      for (let f = 0; f < 4; f++) this._box(26, 1.2, 20, M.alu, 0, TIP + 9.5 + f * 3.4, -1, g, ent);  // fins at the sides
      this._box(12, 5, 1, gold, 0, TIP + 17, 12.4, g, ent);                              // badge
      this._box(4, 11, 2.4, M.handle, 9.5, TIP + 14, 12.6, g, ent);                      // quick-swap clip
      this._m(rounded(17, 8, 17, 3, 1), sock, 0, TIP + 7, 0, g, ent);                    // silicone sock
      const tip = this._cyl(1.1, 5, "y", new T3.MeshStandardMaterial({ color: 0xb08d57, metalness: 0.9, roughness: 0.3, emissive: 0x000000 }),
        0, TIP + 2.5, 0, g, ent, 16, 4.5);
      this._nozzles[k] = { g, tip };
    }
    this._heat = { nozzle_l: { mat: this._nozzles.left.tip.material, lo: 60, hi: 300 },
                   nozzle_r: { mat: this._nozzles.right.tip.material, lo: 60, hi: 300 } };

    // Z: three 8 mm lead screws turned together by a belt under the floor, three 10 mm guide rods (ZS / ZR),
    // flange bearings on the floor, brackets at the top
    const screw = this._screwMat ||= new T3.MeshStandardMaterial({ color: 0x9a9da3, metalness: 0.9, roughness: 0.45 });
    const brassNut = this._nutMat ||= new T3.MeshStandardMaterial({ color: 0xb8893a, metalness: 0.9, roughness: 0.3 });
    const zlen = Z_TOP - FLOOR;
    for (const [x, z] of ZS) {
      this._cyl(4, zlen, "y", screw, x, FLOOR + zlen / 2, z, null, null, 16);
      this._cyl(11, 4, "y", M.black, x, FLOOR + 2, z, null, null, 24);
    }
    for (const [x, z] of ZR) {
      this._cyl(5, zlen, "y", M.steel, x, FLOOR + zlen / 2, z, null, null, 20);
      this._cyl(9, 6, "y", M.black, x, FLOOR + 3, z, null, null, 20);
    }
    for (const s of [-1, 1]) this._box(26, 10, 54, M.bodyDark, s * 172, Z_TOP + 5, 160);  // front top brackets
    this._box(76, 10, 20, M.bodyDark, 24, Z_TOP + 5, -184);                              // rear top bracket

    // bed: textured plate on the heatbed, carrier frame with arms to the Z sliders
    this._bed = new T3.Group();
    this._scene.add(this._bed);
    this._box(280, 10, 280, M.bodyDark, 0, -11, 0, this._bed);
    this._bedPlate = this._box(258, 6, 258, M.plateTex, 0, -3, 0, this._bed, e("number", "bed_target_temperature"));
    this._heat.bed = { mat: this._bedPlate.material, lo: 30, hi: 120 };
    this._box(258, 1, 258, M.plate, 0, -6.5, 0, this._bed);
    // sliders: one block per screw / rod pair (front corners, rear), brass nut on the screw, bushing on the rod
    for (const s of [-1, 1]) {
      this._box(40, 10, 44, M.bodyDark, s * 150, -11, 152, this._bed);                   // arm from the frame corner
      this._box(26, 26, 56, M.bodyDark, s * 170, -3, 160, this._bed);
    }
    this._box(40, 10, 50, M.bodyDark, 0, -11, -160, this._bed);
    this._box(80, 26, 22, M.bodyDark, 24, -3, -184, this._bed);
    for (const [x, z] of ZS) this._cyl(10, 6, "y", brassNut, x, 13, z, this._bed, null, 6);
    for (const [x, z] of ZR) this._cyl(11, 6, "y", M.black, x, 13, z, this._bed, null, 24);

    // filament path: AMS exit (rear) -> back of the printer -> toolhead, and the bowden from the rear extruder
    this._tubes = [];
    this._tubeMat = this.M.ptfe;

    // labels: anchors with the components shown there (filled in _apply from the spec). Parts that sit close
    // together share a box: the toolhead (nozzles, its fans), the chamber (heater, light, side fans), the rear air
    // path (filter, exhaust kit)
    this._labelSpec = [
      { anchor: this._head, off: [0, HEAD_TOP + 4, 0], title: "TOOLHEAD", rows: ["heater:nozzle_l", "heater:nozzle_r", "fan:part", "fan:hotend"] },
      { anchor: this._heaterRing, off: [0, 60, 0], title: "CHAMBER", rows: ["heater:chamber", "light:chamber", "fan:aux_l", "fan:aux_r"] },
      { anchor: this._filter, off: [0, 40, 0], title: "REAR AIR", rows: ["fan:ventilation", "fan:exhaust"] },
      { anchor: this._bedPlate, off: [120, 4, 120], rows: ["heater:bed"] },
      { anchor: this._door.children[this._door.children.length - 1], off: [0, 20, 0], rows: ["door:front"] },
      { anchor: this._holders.right.spool.g, off: [0, 100, 0], rows: ["external:right"] },
      { anchor: this._holders.left.spool.g, off: [0, 100, 0], rows: ["external:left"] },
    ];
  },
});
