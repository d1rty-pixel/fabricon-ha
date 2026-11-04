// The P2S itself: enclosure, front, rear panel, chamber fixtures, gantry, Z, bed.
Object.assign(MODEL, {
  _build() {
    const T3 = this.T, M = this.M, e = this._e.bind(this), slabXY = this._slabXY.bind(this);
    const hw = W / 2, hd = D / 2, RZ = -hd, comp = (r) => this._comp(r), ent = (r) => this._compEntity(r);
    // shell: mid-grey plastic (wiki photos); the rear sheet metal a bit darker so the chamber's back still reads as an interior
    const blk = this._blk = new T3.MeshStandardMaterial({ color: 0x5e6166, metalness: 0.3, roughness: 0.58 });
    const rear = new T3.MeshStandardMaterial({ color: 0x4e5156, metalness: 0.4, roughness: 0.55 });
    this._shell.push(blk, rear);
    const hole = (sh, [cx, cy, cw, ch], y0) => {                 // rounded opening in a back-wall shape (y relative to y0)
      const p = new T3.Path(), x0 = cx - cw / 2, x1 = cx + cw / 2, ya = cy - ch / 2 - y0, yb = cy + ch / 2 - y0, q = 8;
      p.moveTo(x0 + q, ya); p.lineTo(x1 - q, ya); p.quadraticCurveTo(x1, ya, x1, ya + q); p.lineTo(x1, yb - q);
      p.quadraticCurveTo(x1, yb, x1 - q, yb); p.lineTo(x0 + q, yb); p.quadraticCurveTo(x0, yb, x0, yb - q); p.lineTo(x0, ya + q);
      p.quadraticCurveTo(x0, ya, x0 + q, ya);
      sh.holes.push(p);
    };

    // shell: corner posts, windowless side panels (PC + ABS, wiki: no windows) with their inner lining, top frame
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) this._cyl(R, H - 8, "y", blk, x * (hw - R), 8 + (H - 8) / 2, z * (hd - R), null, null, 24);
    for (const s of [-1, 1]) {
      this._box(T, H - 8, D - 2 * R, blk, s * (hw - T / 2), 8 + (H - 8) / 2, 0);
      this._box(2, H - 8 - FLOOR, D - 2 * T, M.inner, s * (hw - T - 1), FLOOR + (H - 8 - FLOOR) / 2, 0);
    }
    {
      const sh = new T3.Shape(), w = W - 2 * R, h = H - 8;
      sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h); sh.lineTo(-w / 2, h); sh.lineTo(-w / 2, 0);
      hole(sh, CHUTE, 8);
      this._m(new T3.ExtrudeGeometry(sh, { depth: T, bevelEnabled: false, curveSegments: 6 }).translate(0, 0, -T / 2), rear, 0, 8, RZ + T / 2);
      const li = new T3.Shape(), lw = W - 2 * T - 2, lh = H - 8 - FLOOR;       // inner back lining
      li.moveTo(-lw / 2, 0); li.lineTo(lw / 2, 0); li.lineTo(lw / 2, lh); li.lineTo(-lw / 2, lh); li.lineTo(-lw / 2, 0);
      hole(li, CHUTE, FLOOR);
      this._m(new T3.ExtrudeGeometry(li, { depth: 2, bevelEnabled: false, curveSegments: 6 }).translate(0, 0, -1), M.inner, 0, FLOOR, RZ + T + 1);
    }
    this._box(W - 2 * R, DOOR_Y0 - 8, T, blk, 0, 8 + (DOOR_Y0 - 8) / 2, hd - T / 2);       // sill under the door
    this._box(W - 2 * R, H - DOOR_Y1, T, blk, 0, (H + DOOR_Y1) / 2, hd - T / 2);            // front cover band (screen, logo)
    this._box(W - 2 * R, T, 34, blk, 0, H - T / 2, hd - 17);
    this._box(W - 2 * R, T, 34, blk, 0, H - T / 2, -hd + 17);
    for (const s of [-1, 1]) this._box(34, T, D - 2 * R, blk, s * (hw - 17), H - T / 2, 0);
    this._box(W - 68, 4, D - 68, M.glass, 0, H - 4, 0);                                      // glass lid
    this._box(W - 2 * T, 6, D - 2 * T, M.inner, 0, FLOOR - 3, 0);                            // chamber floor
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) this._cyl(9, 6, "y", M.black, x * (hw - 30), 3, z * (hd - 30));   // feet
    // the Bambu mark with "Bambu Lab" on the right side panel (wiki photo: black, tall glyph, centred front to back)
    {
      const gm = new T3.MeshBasicMaterial({ color: 0x15161a, side: T3.DoubleSide }), g = new T3.Group();
      for (const pts of [[[-22, -34], [-8, -34], [-8, 34], [-22, 34]], [[8, -34], [22, -34], [22, 34], [8, 34]], [[-8, 4], [8, -12], [8, 4], [-8, 20]]]) {
        const s = new T3.Shape();
        pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
        g.add(new T3.Mesh(new T3.ShapeGeometry(s), gm));
      }
      g.rotation.y = Math.PI / 2;
      g.position.set(hw + 0.6, 255, 0);
      this._scene.add(g);
      const side = this._text("Bambu Lab", 62, 12, { color: "#15161a", weight: 700, px: 256, fit: true });
      side.rotation.set(0, Math.PI / 2, 0);
      side.position.set(hw + 0.6, 205, 0);
      this._scene.add(side);
    }

    // fans. Aux: the adaptive airflow unit at the rear right (wiki: "rear right") = an aux fan on the right wall blowing
    // into the chamber, the carbon filter module with the ventilation fan behind it in the rear right corner
    const ledMat = M.led;
    this._fans = {};
    if (comp("fan:aux")) this._fans.aux = this._fan(30, "x-", hw - T - 7, 250, -110, ent("fan:aux"));
    if (comp("fan:aux_l")) this._fans.aux_l = this._fan(30, "x+", -hw + T + 7, 250, -110, ent("fan:aux_l"));   // accessory, left wall
    const fx = 163, fz0 = RZ + T + 2, fd = 50;                       // filter module: x 140 .. 186, clear of the bed's corner (134)
    this._filter = this._box(46, 150, fd, M.bodyDark, fx, FLOOR + 75, fz0 + fd / 2, null, ent("fan:ventilation"));
    this._clickable.push(this._filter);
    this._fans.ventilation = this._fan(20, "z+", fx, FLOOR + 118, fz0 + fd + 4, ent("fan:ventilation"));
    const carbon = new T3.PlaneGeometry(36, 56), cm = this._m(carbon, this._perfMat(), fx, FLOOR + 40, fz0 + fd + 0.3);
    cm.userData.entity = ent("fan:ventilation");
    this._fanHub = new T3.Object3D();                                // label anchor of the chamber group
    this._fanHub.position.set(-hw + 12, 215, -20);
    this._scene.add(this._fanHub);

    // rear panel (wiki "replace rear panel" photo, front coordinates): mesh grille, purge chute opening, a recess for the
    // filament buffer, two spool-holder plates, a slot near the top, power inlet with a rocker switch
    const perf = (w, h, x, y) => {
      const g = new T3.PlaneGeometry(w, h).rotateY(Math.PI), uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 8, uv.getY(i) * h / 8);
      return this._m(g, this._perfMat(), x, y, RZ - 0.4);
    };
    perf(GRILLE[2], GRILLE[3], GRILLE[0], GRILLE[1]);
    if (comp("fan:exhaust")) {                                       // optional exhaust kit over the grille: a box, its fan at the back
      const bw = 70, bh = 100, bd = 40;
      this._m(slabXY(bw, bh, 14, bd - 4), M.bodyDark, GRILLE[0], GRILLE[1], RZ - bd / 2 - 2, null, ent("fan:exhaust"));
      this._fans.exhaust = this._fan(26, "z-", GRILLE[0], GRILLE[1], RZ - bd, ent("fan:exhaust"));
    }
    this._m(slabXY(CHUTE[2] + 8, CHUTE[3] + 8, 10, 2, [CHUTE[2], CHUTE[3], 8]), M.bodyDark, CHUTE[0], CHUTE[1], RZ - 1);
    this._m(slabXY(BUFFER[2] + 6, BUFFER[3] + 6, 6, 2), M.bodyDark, BUFFER[0], BUFFER[1], RZ - 1);      // recess frame
    this._m(slabXY(37, 35, 4, 4), M.bodyDark, BRACKET[0], BRACKET[1], RZ - 2);                          // spool holder plates
    this._m(slabXY(30, 35, 4, 4), M.bodyDark, -133, 375, RZ - 2);
    this._m(slabXY(25, 8, 3, 2), M.black, SLOT[0], SLOT[1], RZ - 1);
    this._box(40, 35, 5, M.black, 122, 55, RZ - 2.5);
    this._box(14, 9, 3, new T3.MeshStandardMaterial({ color: 0xa01010, roughness: 0.5 }), 122, 62, RZ - 6);
    // filament buffer (Combo): a box in the recess, two ports on top (AMS / external spool), the Y channel (two lanes
    // merging into one that leaves towards -x) printed on its back
    {
      const [bx, by, bw, bh] = BUFFER, bz = RZ - 16;
      this._m(slabXY(bw, bh, 8, 28), M.bodyDark, bx, by, bz);
      for (const dx of [-18, 18]) this._box(14, 5, 12, M.black, bx + dx, by + bh / 2 + 2, bz);          // 6-pin ports
      const ch = this._bufChannel ||= new T3.MeshStandardMaterial({ color: 0x050506, roughness: 0.5 }), zf = RZ - 30.2;
      for (const s of [-1, 1]) {
        this._box(5, 18, 0.6, ch, bx + s * 18, by + 18, zf);                                            // lane down from its port
        this._m(new T3.BoxGeometry(5, 26, 0.6).rotateZ(s * 0.62), ch, bx + s * 9, by - 1, zf);          // joins the other
      }
      this._box(5, 12, 0.6, ch, bx, by - 14, zf);
      this._box(48, 5, 0.6, ch, bx - 28, by - 16, zf);                                                  // out towards -x
    }
    // purge chute inside: a slim shaft between the bed carrier's back edge and the back lining, open at the top under the
    // nozzle, a ramp out through the opening (as on the X2D); the wiper / badge on its front wall (wiki photo: "Bambu Lab" pill)
    {
      const mat = this._chuteMat ||= new T3.MeshStandardMaterial({ color: 0x2a2b2e, roughness: 0.6, transparent: true, opacity: 0.7, side: T3.DoubleSide });
      const [cx, , cw] = CHUTE, zb = RZ + T + 2, zf = -152, top = TIP - 18, low = CHUTE[1] - CHUTE[3] / 2;
      const rampY = low + (zf - zb), ramp = Math.hypot(zf - zb, rampY - low);
      this._box(cw + 4, top - rampY, 2, mat, cx, (top + rampY) / 2, zf);
      for (const s of [-1, 1]) this._box(2, top - low, zf - zb, mat, cx + s * (cw / 2 + 1), (top + low) / 2, (zf + zb) / 2);
      this._m(new T3.BoxGeometry(cw, 2, ramp).rotateX(-Math.atan2(rampY - low, zf - zb)), mat, cx, (rampY + low) / 2, (zf + zb) / 2);
      this._box(30, 9, 1.5, new T3.MeshStandardMaterial({ color: 0xe8e9ea, roughness: 0.4 }), cx, 225, zf + 2);
      const badge = this._text("Bambu Lab", 26, 6, { color: "#55585d", weight: 700, px: 256, fit: true });
      badge.position.set(cx, 225, zf + 2.8);
      this._scene.add(badge);
    }
    this._holders = { main: this._spoolHolder() };

    // front cover band: "P2S" printed on the right (wiki photo; dark on the grey band)
    const logo = this._text("P2S", 34, 10, { color: "#2c2e32", weight: 700, stretch: 1.3, px: 256, fit: true });
    logo.position.set(122, H - 23, hd + 0.6);
    this._scene.add(logo);
    // 5" touchscreen on the top front, left of centre, tilted back, rising above the lid (wiki photo)
    const scr = new T3.Group();
    scr.position.set(-128, H + 14, hd - 34);
    scr.rotation.x = -0.3;
    this._scene.add(scr);
    this._box(120, 74, 10, M.screenBezel, 0, 0, 0, scr, e("sensor", "print_status"));
    this._box(60, 30, 36, M.bodyDark, 0, -22, -20, scr);                                     // hinge housing
    this._screenCanvas = document.createElement("canvas");
    this._screenCanvas.width = 512; this._screenCanvas.height = 300;
    this._screenTex = new T3.CanvasTexture(this._screenCanvas);
    this._screenTex.colorSpace = T3.SRGBColorSpace;
    const sm = new T3.Mesh(new T3.PlaneGeometry(108, 63), new T3.MeshBasicMaterial({ map: this._screenTex, toneMapped: false }));
    sm.position.z = 5.2;
    scr.add(sm);
    // USB-A port (estimate: top front, right of the screen; a stick plugs in from above, shown while the storage sensor is on)
    const ux = -40, uz = hd - 22, usbEnt = e("binary_sensor", "usb_drive");
    this._box(18, 1, 9, M.screenBezel, ux, H + 0.5, uz, null, usbEnt);
    this._box(13, 0.4, 5.6, M.black, ux, H + 1.05, uz);
    this._usb = new T3.Group();
    this._usb.position.set(ux, H + 1, uz);
    this._scene.add(this._usb);
    const fit = new T3.MeshStandardMaterial({ color: 0x141416, metalness: 0.15, roughness: 0.42 });
    this._box(14.3, 8, 5, fit, 0, 4, 0, this._usb, usbEnt);
    this._box(6, 2, 5.2, M.black, 0, 6, 0, this._usb);
    this._usb.visible = false;
    // live view camera (wiki photo: upper left inside; estimate: on the top beam behind the front band, above the head's reach)
    this._box(30, 12, 16, M.screenBezel, -150, 452, hd - T - 14);
    this._cyl(4, 3, "y", M.black, -150, 445, hd - T - 14, null, null, 16);

    // door (wiki photos): dark film glass from the sill to the cover band, hinged on the left with two black brackets,
    // a slim handle at the right edge
    this._door = new T3.Group();
    this._door.position.set(-hw + 12, 0, hd + 3);
    this._scene.add(this._door);
    const dw = W - 12 - 34, dh = DOOR_Y1 - DOOR_Y0 - 2, dy = DOOR_Y0 + 1 + dh / 2;
    this._m(slabXY(dw, dh, 3, 4), M.tint, dw / 2, dy, 0, this._door);
    const frit = this._fritMat ||= new T3.MeshPhysicalMaterial({ color: 0x030304, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 });
    this._m(slabXY(dw, dh, 3, 0.4, [dw - 16, dh - 16, 2]), frit, dw / 2, dy, 2.2, this._door);
    for (const y of [DOOR_Y1 - 26, DOOR_Y0 + 26]) this._box(10, 24, 7, M.black, 4, y, -3, this._door);
    {
      const hl = 46, hh = 10, sh = new T3.Shape();
      sh.absarc(hl / 2 - hh / 2, 0, hh / 2, -Math.PI / 2, Math.PI / 2, false);
      sh.absarc(-hl / 2 + hh / 2, 0, hh / 2, Math.PI / 2, Math.PI * 1.5, false);
      const g = new T3.ExtrudeGeometry(sh, { depth: 4, bevelEnabled: true, bevelThickness: 1.5, bevelSize: 1.5, bevelSegments: 4, curveSegments: 16 }).rotateZ(Math.PI / 2);
      this._doorHandle = this._m(g, M.handle, dw - 10, 235, 2, this._door, ent("door:front"));
    }
    this._doors = comp("door:front") ? { front: { g: this._door, open: -1.75 } } : {};

    // two LED strips behind one light (wiki p2s-intro): one on the left inside of the top frame, one under the front band;
    // both share a material, so the second follows the first
    this._ledBar = this._box(5, 4, 250, ledMat, -hw + T + 7, H - T - 2, -5);
    this._box(260, 4, 5, this._ledBar.material, 0, H - T - 2, hd - T - 9);
    const lamp = new T3.PointLight(0xfff1dc, 0, 900, 1.6);
    lamp.position.set(-hw + 60, H - 40, 0);
    this._scene.add(lamp);
    this._lights = { chamber: { lamp, bar: this._ledBar, power: 1.4 } };

    // CoreXY gantry: 8 mm Y rod per side, a block on each holding the two hollow steel X rods; the XY motors sit in the
    // rear corners (belts left out)
    const ylen = D - 2 * T - 24;
    for (const s of [-1, 1]) {
      this._cyl(4, ylen, "z", M.steel, s * YR_X, YR_Y, 0, null, null, 20);
      for (const z of [-1, 1]) this._box(14, 24, 12, M.bodyDark, s * (YR_X + 2), YR_Y, z * (ylen / 2 - 2));
      this._box(42, 40, 42, M.black, s * 150, 390, RZ + T + 23);                                  // NEMA 17
      this._cyl(6, 16, "y", M.alu, s * 150, 418, RZ + T + 23, null, null, 20);
    }
    this._carriage = new T3.Group();
    this._scene.add(this._carriage);
    for (const y of [XR_LO, XR_HI]) this._cyl(5, 2 * (YR_X + 4), "x", M.steel, 0, y, XR_Z, this._carriage, null, 24);
    for (const s of [-1, 1]) {
      this._box(20, 50, 28, M.bodyDark, s * (YR_X - 3), (XR_LO + XR_HI) / 2, XR_Z, this._carriage);
      for (const dz of [-16, 16]) this._cyl(8, 6, "z", M.black, s * YR_X, YR_Y, XR_Z + dz, this._carriage, null, 20);
    }

    this._toolhead();

    // Z: three lead screws, three guide rods, flange bearings, top brackets; the bed rests on three sliders
    const screw = this._screwMat ||= new T3.MeshStandardMaterial({ color: 0x9a9da3, metalness: 0.9, roughness: 0.45 });
    const brassNut = this._nutMat ||= new T3.MeshStandardMaterial({ color: 0xb8893a, metalness: 0.9, roughness: 0.3 });
    const zlen = Z_TOP - FLOOR;
    for (const [x, z] of ZS) {
      this._cyl(4, zlen, "y", screw, x, FLOOR + zlen / 2, z, null, null, 16);
      this._cyl(11, 4, "y", M.black, x, FLOOR + 2, z, null, null, 24);
    }
    for (const [x, z] of ZR) {
      this._cyl(4, zlen, "y", M.steel, x, FLOOR + zlen / 2, z, null, null, 20);
      this._cyl(8, 6, "y", M.black, x, FLOOR + 3, z, null, null, 20);
    }
    for (const s of [-1, 1]) this._box(40, 8, 40, M.bodyDark, s * 169, Z_TOP + 4, 165);
    this._box(80, 8, 20, M.bodyDark, 18, Z_TOP + 4, -175);

    // bed: textured plate on the heatbed, three sliders joined by arms
    this._bed = new T3.Group();
    this._scene.add(this._bed);
    this._box(268, 10, 268, M.bodyDark, 0, -11, 0, this._bed);
    this._bedPlate = this._box(257, 6, 257, M.plateTex, 0, -3, 0, this._bed, ent("heater:bed"));
    this._heat.bed = { mat: this._bedPlate.material, lo: 30, hi: 120 };
    this._box(257, 1, 257, M.plate, 0, -6.5, 0, this._bed);
    for (const s of [-1, 1]) {
      this._box(40, 10, 44, M.bodyDark, s * 150, -11, 152, this._bed);
      this._box(36, 26, 40, M.bodyDark, s * 170, -3, 165, this._bed);
    }
    this._box(40, 10, 40, M.bodyDark, 0, -11, -154, this._bed);
    this._box(76, 26, 22, M.bodyDark, 18, -3, -175, this._bed);
    for (const [x, z] of ZS) this._cyl(10, 6, "y", brassNut, x, 13, z, this._bed, null, 6);
    for (const [x, z] of ZR) this._cyl(9, 6, "y", M.black, x, 13, z, this._bed, null, 20);

    // PTFE tubes (_tubesUpdate), labels
    this._tubes = [];
    this._tubeMat = M.ptfe;
    this._labelSpec = [
      { anchor: this._head, off: [0, HEAD_TOP + 4, 0], title: "TOOLHEAD", rows: ["heater:nozzle", "fan:part", "fan:hotend"] },
      { anchor: this._fanHub, off: [0, 60, 0], title: "CHAMBER", rows: ["heater:chamber", "light:chamber", "fan:aux", "fan:aux_l"] },
      { anchor: this._filter, off: [0, 100, 0], title: "REAR AIR", rows: ["fan:ventilation", "fan:exhaust"] },
      { anchor: this._bedPlate, off: [120, 4, 120], rows: ["heater:bed"] },
      { anchor: this._doorHandle, off: [0, 30, 0], rows: ["door:front"] },
      { anchor: this._holders.main.spool.g, off: [0, 100, 0], rows: ["external:main"] },
    ];
  },

  // Toolhead (P1S-class head in the wiki photo): dark graphite housing with a round part-fan opening on the front, black
  // duct underneath, cutter lever and hotend fan on the left, PTFE coupling on top, one hotend below the duct.
  _toolhead() {
    const T3 = this.T, M = this.M, ent = (r) => this._compEntity(r), HW = 60, HD = 50, FZ = HD / 2, hb = TIP + HOT;
    const head = this._head = new T3.Group();
    this._scene.add(head);
    const grey = new T3.MeshStandardMaterial({ color: 0x35373b, metalness: 0.25, roughness: 0.62 });
    const duct = new T3.MeshStandardMaterial({ color: 0x131416, metalness: 0.15, roughness: 0.7 });
    this._shell.push(grey, duct);
    const body0 = hb + DUCT_H, bodyY = body0 + BODY_H / 2, fanY = body0 + BODY_H * 0.45, fanR = 19;
    const outline = (w, h, r) => {
      const sh = new T3.Shape(), x = w / 2, y = h / 2;
      sh.moveTo(-x + r, -y); sh.lineTo(x - r, -y); sh.quadraticCurveTo(x, -y, x, -y + r); sh.lineTo(x, y - r);
      sh.quadraticCurveTo(x, y, x - r, y); sh.lineTo(-x + r, y);
      sh.quadraticCurveTo(-x, y, -x, y - r); sh.lineTo(-x, -y + r); sh.quadraticCurveTo(-x, -y, -x + r, -y);
      return sh;
    };
    const slab = (sh, depth) => new T3.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 10 }).translate(0, 0, -depth / 2);
    this._m(slab(outline(HW - 2, BODY_H, 8), HD - 6), grey, 0, bodyY, -3, head, ent("heater:nozzle"));
    const front = outline(HW, BODY_H, 8), opening = new T3.Path();
    opening.absarc(0, fanY - bodyY, fanR, 0, Math.PI * 2, true);
    front.holes.push(opening);
    this._m(slab(front, 6), grey, 0, bodyY, FZ - 3, head, ent("heater:nozzle"));
    this._fans.part = this._fan(fanR, "z+", 0, fanY, FZ - 0.5, ent("fan:part"), head, "blower");
    this._box(HW - 6, DUCT_H, HD - 6, duct, 0, hb + DUCT_H / 2, -1, head);                    // duct block
    this._box(26, 8, 14, duct, 0, hb + DUCT_H - 3, FZ - 4, head);                              // outlet nose
    // left side: cutter lever, hotend fan
    this._box(3, 42, 8, grey, -HW / 2 - 1.5, body0 + 28, 12, head);
    this._box(10, 10, 14, M.steel, -HW / 2 - 3, body0 + 8, 12, head);                          // cutter blade housing
    if (this._comp("fan:hotend")) this._fans.hotend = this._fan(10, "x-", -HW / 2 - 0.5, body0 + 40, -8, ent("fan:hotend"), head);
    // top: PTFE coupling at the rear; back: bearing block around the X rods
    this._cyl(6, 8, "y", M.black, 0, HEAD_TOP + 4, -12, head);
    this._cyl(4.5, 3, "y", M.steel, 0, HEAD_TOP + 9, -12, head);
    this._box(44, XR_HI - XR_LO + 16, 14, duct, 0, (XR_LO + XR_HI) / 2, XR_Z, head);
    // hotend: silicone sock, heater block, nozzle (wiki: hardened nozzle, 3 markers on the sock)
    const gold = new T3.MeshStandardMaterial({ color: 0xb08d57, metalness: 0.9, roughness: 0.3, emissive: 0x000000 });
    const g = new T3.Group();
    g.position.z = 4;
    head.add(g);
    this._box(15, 9, 15, new T3.MeshStandardMaterial({ color: 0x2b2b2d, roughness: 0.92 }), 0, TIP + 8, 0, g, ent("heater:nozzle"));
    const tip = this._cyl(4.5, 5, "y", gold, 0, TIP + 2.5, 0, g, ent("heater:nozzle"), 16, 1.1);
    this._nozzles = { main: { g, tip } };
    this._heat = { nozzle: { mat: tip.material, lo: 60, hi: 300 } };
  },
});
