// The H2D family: frame, front, rear panel. The machine is built from the helpers in the other files.
Object.assign(MODEL, {
  _build() {
    const sp = this._spec(), dual = (sp.extruders || []).length !== 1;       // one extruder = H2S: no side windows, one nozzle
    this._h2dShell(dual);
    this._h2dFront(dual);
    this._h2dRear();
    this._h2dChamber();
    this._h2dGantry();
    this._h2dHead(dual);
    this._h2dBed();
    this._h2dHolders();
    // labels: the toolhead, the chamber (heater, light and the wall fans together), the rest alone
    const door = this._door.children[this._door.children.length - 1], ext = Object.values(this._holders);
    this._labelSpec = [
      { anchor: this._head, off: [0, HEAD_TOP + 4, 0], title: "TOOLHEAD", rows: ["heater:nozzle_l", "heater:nozzle_r", "heater:nozzle", "fan:part", "fan:hotend"] },
      { anchor: this._chamberAnchor, off: [0, 60, 0], title: "CHAMBER", rows: ["heater:chamber", "light:chamber", "fan:aux", "fan:exhaust", "fan:ventilation"] },
      { anchor: this._bedPlate, off: [130, 4, 130], rows: ["heater:bed"] },
      { anchor: door, off: [0, 20, 0], rows: ["door:front"] },
      ...ext.map((h) => ({ anchor: h.spool.g, off: [0, 100, 0], rows: [`external:${h.id}`] })),
    ];
  },

  // frame: black base ring, silver front pillars and side panels (the panel's window is glass, none on the H2S), black
  // top frame with the front header, glass lid, dark rear panel with the purge chute's opening
  _h2dShell(dual) {
    const T3 = this.T, M = this.M, slabXY = this._slabXY.bind(this);
    const silver = this._silver = new T3.MeshStandardMaterial({ color: 0x7e8186, metalness: 0.5, roughness: 0.42 });
    this._shell.push(silver);
    this._box(W, 32, D, M.black, 0, 24, 0);                                              // base ring, 35 tall (wiki)
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) this._cyl(12, 8, "y", M.black, x * 217, 4, z * 227);   // feet 435 x 454
    // a flat panel (w along z) with an optional rounded window: hole = {z, y, w, h}
    const panel = (w, h, y0, d, mat, x, hole) => {
      const sh = new T3.Shape();
      sh.moveTo(-w / 2, -h / 2); sh.lineTo(w / 2, -h / 2); sh.lineTo(w / 2, h / 2); sh.lineTo(-w / 2, h / 2); sh.lineTo(-w / 2, -h / 2);
      if (hole) {
        const p = new T3.Path(), cx = -hole.z, cy = hole.y - y0 - h / 2, a = hole.w / 2, b = hole.h / 2, q = 12;
        p.moveTo(cx - a + q, cy - b); p.lineTo(cx + a - q, cy - b); p.quadraticCurveTo(cx + a, cy - b, cx + a, cy - b + q);
        p.lineTo(cx + a, cy + b - q); p.quadraticCurveTo(cx + a, cy + b, cx + a - q, cy + b); p.lineTo(cx - a + q, cy + b);
        p.quadraticCurveTo(cx - a, cy + b, cx - a, cy + b - q); p.lineTo(cx - a, cy - b + q); p.quadraticCurveTo(cx - a, cy - b, cx - a + q, cy - b);
        sh.holes.push(p);
      }
      const g = new T3.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false, curveSegments: 6 }).translate(0, 0, -d / 2).rotateY(Math.PI / 2);
      return this._m(g, mat, x, y0 + h / 2, 0);
    };
    const win = dual ? WINDOW : null;
    for (const s of [-1, 1]) {
      panel(D, 556, 40, T, silver, s * (HW - T / 2), win);                                // outer side panel
      panel(D - 2 * T, 542, FLOOR, 2, M.inner, s * (HW - T - 1), win);                      // inner lining
      if (win) {
        (this._winRims ||= []).push(this._m(slabXY(win.w + 12, win.h + 12, 16, 1.4, [win.w, win.h, 12]).rotateY(Math.PI / 2), M.black, s * (HW + 0.2), win.y, win.z));
        this._m(slabXY(win.w, win.h, 12, 1).rotateY(Math.PI / 2), M.tint, s * (HW + 1.2), win.y, win.z);
      }
    }
    // rear panel with the chute's opening
    const back = (w, h, y0, d, mat, z) => {
      const sh = new T3.Shape(), [cx, cy, cw, ch] = CHUTE, q = 8, x0 = cx - cw / 2, x1 = cx + cw / 2, ya = cy - ch / 2 - y0, yb = cy + ch / 2 - y0;
      sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h); sh.lineTo(-w / 2, h); sh.lineTo(-w / 2, 0);
      const hole = new T3.Path();
      hole.moveTo(x0 + q, ya); hole.lineTo(x1 - q, ya); hole.quadraticCurveTo(x1, ya, x1, ya + q); hole.lineTo(x1, yb - q);
      hole.quadraticCurveTo(x1, yb, x1 - q, yb); hole.lineTo(x0 + q, yb); hole.quadraticCurveTo(x0, yb, x0, yb - q); hole.lineTo(x0, ya + q);
      hole.quadraticCurveTo(x0, ya, x0 + q, ya);
      sh.holes.push(hole);
      return this._m(new T3.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false, curveSegments: 6 }).translate(0, 0, -d / 2), mat, 0, y0, z);
    };
    back(W - 2 * T, H - 40, 40, T, M.bodyDark, -HD + T / 2);
    back(W - 4 * T, H - FLOOR - 34, FLOOR, 2, M.inner, -HD + T + 1);
    this._box(W - 2 * T, 6, D - 2 * T, M.inner, 0, FLOOR - 3, 0);                        // chamber floor
    // top frame: front header (the front cover band), rear band, side crossbeams (the LED strips sit under them)
    this._box(W, HDR, 34, M.bodyDark, 0, DOOR_Y1 + HDR / 2, HD - 17);
    this._box(W, 34, 34, M.bodyDark, 0, H - 17, -HD + 17);
    for (const s of [-1, 1]) this._box(34, 34, D - 68, M.bodyDark, s * (HW - 17), H - 17, 0);
    this._box(W - 68, 4, D - 68, M.glass, 0, H - 3, 0);                                   // removable glass lid
    // front pillars and the sill under the door
    for (const s of [-1, 1]) this._box(PIL, DOOR_Y1 - 40, 30, silver, s * (HW - PIL / 2), (40 + DOOR_Y1) / 2, HD - 15);
    this._box(W - 2 * PIL, DOOR_Y0 - 36, T, M.bodyDark, 0, (36 + DOOR_Y0) / 2, HD - T / 2);
  },

  // front: header with the 5" screen (top left), logo, start / pause button, USB port and stick; the tinted glass door
  // hinged on the left with a vertical handle on the right
  _h2dFront(dual) {
    const T3 = this.T, M = this.M, slabXY = this._slabXY.bind(this), ent = (r) => this._compEntity(r);
    const hy = DOOR_Y1 + HDR / 2, model = /H2[CDS]( PRO)?/i.exec(this._spec().model || "")?.[0].toUpperCase() || (dual ? "H2D" : "H2S");
    const logo = this._text(model, 34, 9, { color: "#c9ccd1", weight: 700, stretch: 1.2, align: "left", px: 256, fit: true });
    logo.position.set(122, hy + 8, HD + 0.6);
    const brand = this._text("Bambu Lab", 52, 8, { color: "#8d9096", weight: 600, align: "left", px: 256, fit: true });
    brand.position.set(70, hy + 8, HD + 0.6);
    this._scene.add(logo, brand);
    // screen (wiki overview photo: top left of the front, tilted back a little)
    const scr = new T3.Group();
    scr.position.set(-150, hy, HD + 9);
    scr.rotation.x = -0.3;
    this._scene.add(scr);
    this._box(126, 62, 10, M.screenBezel, 0, 0, 0, scr, this._spec().core?.status);
    this._box(40, 30, 24, M.bodyDark, 0, 0, -14, scr);
    this._screenCanvas = document.createElement("canvas");
    this._screenCanvas.width = 512; this._screenCanvas.height = 300;
    this._screenTex = new T3.CanvasTexture(this._screenCanvas);
    this._screenTex.colorSpace = T3.SRGBColorSpace;
    const sm = new T3.Mesh(new T3.PlaneGeometry(108, 58), new T3.MeshBasicMaterial({ map: this._screenTex, toneMapped: false }));
    sm.position.z = 5.2;
    scr.add(sm);
    // start / pause button, top right of the front cover (H2D FAQ)
    this._cyl(8, 3, "z", M.steel, 205, hy - 14, HD + 1.5, null, null, 24);
    this._cyl(5.5, 4, "z", M.black, 205, hy - 14, HD + 1.5, null, null, 20);
    // USB-A on the header beside the screen (position not verified): the stick plugs in towards the front
    const ux = -50, usbEnt = this._spec().core?.usb;
    this._box(18, 8, 2, M.black, ux, hy - 6, HD + 1, null, usbEnt);
    this._usb = new T3.Group();
    this._usb.position.set(ux, hy - 6, HD + 2);
    this._scene.add(this._usb);
    const fit = new T3.MeshStandardMaterial({ color: 0x141416, metalness: 0.15, roughness: 0.42 });
    this._box(14.3, 5, 16, fit, 0, 0, 8, this._usb, usbEnt);
    this._box(5, 5.2, 3, M.black, 0, 0, 13, this._usb);                                    // lanyard slot
    this._usb.visible = false;
    // live camera, inside under the header at the left (wiki overview photo)
    const cam = ent("camera:chamber");
    this._box(36, 20, 16, M.black, -140, DOOR_Y1 - 12, HD - 44, null, cam);
    this._cyl(5, 4, "z", new T3.MeshPhysicalMaterial({ color: 0x0a1018, metalness: 0.4, roughness: 0.05 }), -140, DOOR_Y1 - 12, HD - 35, null, cam, 20);

    // door: tinted glass between the pillars, hinged on the left (wiki: hinges left), black pill handle on the right
    const dw = W - 2 * PIL, dh = DOOR_Y1 - DOOR_Y0 - 2;
    this._door = new T3.Group();
    this._door.position.set(-dw / 2, 0, HD - 2);
    this._scene.add(this._door);
    this._m(slabXY(dw, dh, 3, 3), M.tint, dw / 2, DOOR_Y0 + 1 + dh / 2, 0, this._door);
    for (const y of [DOOR_Y1 - 30, DOOR_Y0 + 30]) this._box(10, 24, 5, M.steel, 5, y, 0, this._door);   // hinge tabs
    const grip = this._m(slabXY(14, 62, 7, 6), M.black, dw - 14, 290, 3.5, this._door, ent("door:front"));
    this._box(4, 40, 1, M.steel, -2, 0, 3.4, grip);
    this._doors = { front: { g: this._door, open: -1.75 } };
  },

  // rear panel (wiki rear photo, measured +/- 10 mm, converted to front coordinates): exhaust louvres right of the
  // middle, mesh grilles, purge chute at x -84 with its opening, power inlet, spool holder bases at the left edge
  _h2dRear() {
    const T3 = this.T, M = this.M, slabXY = this._slabXY.bind(this), RZ = -HD;
    const perf = (w, h, x, y) => {                                         // UVs in 8 mm tiles: holes at a 4 mm pitch
      const g = new T3.PlaneGeometry(w, h).rotateY(Math.PI), uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 8, uv.getY(i) * h / 8);
      return this._m(g, this._perfMat(), x, y, RZ - 0.4);
    };
    const louvre = perf(138, 130, 122, 347);                                                  // active exhaust grille
    louvre.userData.entity = this._compEntity("fan:exhaust"); this._clickable.push(louvre);
    perf(130, 64, 122, 238); perf(130, 64, -114, 238); perf(130, 40, 122, 150);               // mesh grilles
    this._m(slabXY(CHUTE[2] + 8, CHUTE[3] + 8, 10, 2, [CHUTE[2], CHUTE[3], 8]), M.bodyDark, CHUTE[0], CHUTE[1], RZ - 1);
    {   // purge chute: a slim shaft between the bed carrier's back edge and the inner lining, open at the top just under
        // the nozzle, with a ramp that drops the purged filament out through the opening
      const mat = this._chuteMat ||= new T3.MeshStandardMaterial({ color: 0x141416, roughness: 0.8, side: T3.DoubleSide });
      const [cx, , cw] = CHUTE, zb = -HD + T + 2, zf = -204, top = TIP - 18, low = CHUTE[1] - CHUTE[3] / 2;
      const rampY = low + (zf - zb), ramp = Math.hypot(zf - zb, rampY - low);
      this._box(cw + 4, top - rampY, 2, mat, cx, (top + rampY) / 2, zf);
      for (const s of [-1, 1]) this._box(2, top - low, zf - zb, mat, cx + s * (cw / 2 + 1), (top + low) / 2, (zf + zb) / 2);
      this._m(new T3.BoxGeometry(cw, 2, ramp).rotateX(-Math.atan2(rampY - low, zf - zb)), mat, cx, (rampY + low) / 2, (zf + zb) / 2);
      this._m(new T3.BoxGeometry(cw + 4, 2, 14).rotateX(-Math.PI / 4), mat, cx, top + 5, zf + 5);
    }
    this._box(30, 40, 4, M.black, 179, 56, RZ - 2);                                            // power inlet and switch
    this._box(14, 9, 2, M.screenBezel, 179, 66, RZ - 4.5);
    for (const x of [-173, -160]) this._cyl(2.5, 24, "y", M.orange, x, H + 10, RZ + 20, null, null, 8);   // Wi-Fi antennas (orange, top)
    // filament buffer (rear photo: inlets near the top, x ~ +50): a box behind the panel at the top with the two lanes'
    // sliders in windows on its back, lower lane = left nozzle, upper = right nozzle
    const [bx, by, bz] = BUF;
    this._buffer = this._m(slabXY(150, 120, 8, 34), M.bodyDark, bx, by - 60, bz, null, this._spec().core?.nozzle_select);
    for (const dy of [18, -18]) {
      this._box(60, 13, 1, M.black, bx + 10, by - 60 + 5 + dy, bz - 17.4);
      this._box(40, 9, 2, M.orange, bx + 8, by - 60 + 5 + dy, bz - 17.6);
    }
  },

  // chamber: both LED strips on the top crossbeams (one entity, one shared material), aux fan on the left wall, heater
  // plate + circulation fan + exhaust fan on the right wall
  _h2dChamber() {
    const T3 = this.T, M = this.M, ent = (r) => this._compEntity(r);
    this._ledBar = this._box(8, 4, 340, M.led, -HW + 41, H - 36, 5);
    this._box(8, 4, 340, this._ledBar.material, HW - 41, H - 36, 5);                      // follows the first strip's colour
    const lamp = new T3.PointLight(0xfff1dc, 0, 1100, 1.6);
    lamp.position.set(0, H - 60, 0);
    this._scene.add(lamp);
    this._lights = { chamber: { lamp, bar: this._ledBar, power: 1.4 } };
    // left wall: the auxiliary part fan blowing into the chamber (behind the side panel, upper half; H2D intro)
    this._fans = { aux: this._fan(36, "x+", -HW + T + 8, 330, -40, ent("fan:aux")) };
    // right wall: PTC heater plate (finned) over the circulation fan, exhaust fan at the rear (wiki lining guides)
    const ptc = new T3.MeshStandardMaterial({ color: 0x3a3a3c, metalness: 0.6, roughness: 0.45, emissive: 0x000000 });
    const hx = HW - T - 5, hent = ent("heater:chamber");
    this._box(6, 100, 150, ptc, hx, 410, 30, null, hent);
    for (let k = 0; k < 9; k++) this._box(3, 2.4, 142, M.alu, hx - 3, 366 + k * 11, 30, null, hent);
    this._heat = { chamber: { mat: ptc, lo: 25, hi: 65 } };
    this._fans.ventilation = this._fan(38, "x-", HW - T - 8, 300, 30, ent("fan:ventilation"));
    this._fans.exhaust = this._fan(30, "x-", HW - T - 8, 330, -165, ent("fan:exhaust"));
    this._chamberAnchor = new T3.Object3D();
    this._chamberAnchor.position.set(HW - 12, 410, 30);
    this._scene.add(this._chamberAnchor);
  },
});
