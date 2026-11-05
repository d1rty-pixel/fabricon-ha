// H3C: enclosure, front, rear panel, chamber. The rest is in the other files.
const WINDOW = { z: 10, y: 440, w: 300, h: 130 };          // right side window (overview photo: only the right side has one)
Object.assign(MODEL, {
  _build() {
    this._h3cShell();
    this._h3cFront();
    this._h3cRear();
    this._h3cChamber();
    this._h3cGantry();
    this._h3cRack();
    this._h3cHead();
    this._h3cBed();
    this._h3cHolders();
    this._h3cAms();
    const door = this._door.children[this._door.children.length - 1], ext = Object.values(this._holders);
    this._labelSpec = [
      { anchor: this._head, off: [0, HEAD_TOP + 4, 0], title: "TOOLHEAD", rows: ["heater:nozzle", "fan:part", "fan:hotend"] },
      { anchor: this._chamberAnchor, off: [0, 60, 0], title: "CHAMBER", rows: ["heater:chamber", "light:chamber", "fan:aux", "fan:chamber", "fan:exhaust", "fan:ventilation"] },
      { anchor: this._bedPlate, off: [130, 4, 130], rows: ["heater:bed"] },
      { anchor: door, off: [0, 20, 0], rows: ["door:front"] },
      ...ext.map((h) => ({ anchor: h.spool.g, off: [0, 100, 0], rows: [`external:${h.id}`] })),
    ];
  },

  // the tool on the head: PrintTool 1 until BamBuddy reports the tool changer (then return the index from its entity)
  _h3cActive() { return ACTIVE_TOOL; },

  // frame: black base ring, light-grey front pillars, side panels (right one with a window), black top frame with the
  // silver front cover band, dark rear panel with the purge chute's opening. No lid: the AMS 3H sits on the frame.
  _h3cShell() {
    const T3 = this.T, M = this.M, slabXY = this._slabXY.bind(this);
    const silver = this._silver = new T3.MeshStandardMaterial({ color: 0x9c9fa4, metalness: 0.45, roughness: 0.42 });
    this._shell.push(silver);
    this._box(W, 32, D, M.black, 0, 24, 0);                                              // base (silver skirt in the photo, black foot)
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) this._cyl(12, 8, "y", M.black, x * 217, 4, z * 227);
    const panel = (w, h, y0, d, mat, x, hole) => {                                       // side panel, w along z, optional rounded window
      const sh = new T3.Shape();
      sh.moveTo(-w / 2, -h / 2); sh.lineTo(w / 2, -h / 2); sh.lineTo(w / 2, h / 2); sh.lineTo(-w / 2, h / 2); sh.lineTo(-w / 2, -h / 2);
      if (hole) {
        const p = new T3.Path(), cx = -hole.z, cy = hole.y - y0 - h / 2, a = hole.w / 2, b = hole.h / 2, q = 14;
        p.moveTo(cx - a + q, cy - b); p.lineTo(cx + a - q, cy - b); p.quadraticCurveTo(cx + a, cy - b, cx + a, cy - b + q);
        p.lineTo(cx + a, cy + b - q); p.quadraticCurveTo(cx + a, cy + b, cx + a - q, cy + b); p.lineTo(cx - a + q, cy + b);
        p.quadraticCurveTo(cx - a, cy + b, cx - a, cy + b - q); p.lineTo(cx - a, cy - b + q); p.quadraticCurveTo(cx - a, cy - b, cx - a + q, cy - b);
        sh.holes.push(p);
      }
      const g = new T3.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false, curveSegments: 6 }).translate(0, 0, -d / 2).rotateY(Math.PI / 2);
      return this._m(g, mat, x, y0 + h / 2, 0);
    };
    for (const s of [-1, 1]) {
      const win = s > 0 ? WINDOW : null;
      panel(D, 516, 40, T, silver, s * (HW - T / 2), win);
      panel(D - 2 * T, 502, FLOOR, 2, M.inner, s * (HW - T - 1), win);
      if (win) {
        (this._winRims ||= []).push(this._m(slabXY(win.w + 12, win.h + 12, 18, 1.4, [win.w, win.h, 14]).rotateY(Math.PI / 2), M.black, s * (HW + 0.2), win.y, win.z));
        this._m(slabXY(win.w, win.h, 14, 1).rotateY(Math.PI / 2), M.tint, s * (HW + 1.2), win.y, win.z);
      }
    }
    const back = (w, h, y0, d, mat, z) => {                                              // rear panel with the chute's opening
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
    // top frame: front header = the silver cover band, rear band, side crossbeams (LED strips under them), top plate
    this._box(W, HDR, 34, silver, 0, DOOR_Y1 + HDR / 2, HD - 17);
    this._box(W, 34, 34, M.bodyDark, 0, H - 17, -HD + 17);
    for (const s of [-1, 1]) this._box(34, 34, D - 68, M.bodyDark, s * (HW - 17), H - 17, 0);
    this._box(W - 68, 4, D - 68, M.inner, 0, H - 3, 0);
    for (const s of [-1, 1]) this._box(PIL, DOOR_Y1 - 40, 30, silver, s * (HW - PIL / 2), (40 + DOOR_Y1) / 2, HD - 15);   // rounded silver pillars
    this._box(W - 2 * PIL, DOOR_Y0 - 36, T, silver, 0, (36 + DOOR_Y0) / 2, HD - T / 2);
  },

  // front: cover band with the 5" screen (top left, tilted back), USB-A, "Bambu Lab H3C" right; live camera inside under
  // the band at the left; tinted glass door hinged on the left (front-cover guide photos)
  _h3cFront() {
    const T3 = this.T, M = this.M, slabXY = this._slabXY.bind(this), ent = (r) => this._compEntity(r);
    const hy = DOOR_Y1 + HDR / 2;
    const logo = this._text("H3C", 40, 11, { color: "#5a5d62", weight: 700, stretch: 1.2, align: "left", px: 256, fit: true });
    logo.position.set(160, hy + 2, HD + 0.6);
    const brand = this._text("Bambu Lab", 56, 9, { color: "#6e7176", weight: 600, align: "left", px: 256, fit: true });
    brand.position.set(100, hy + 2, HD + 0.6);
    this._scene.add(logo, brand);
    const scr = new T3.Group();                                                          // screen: sits on the band, left (overview photo)
    scr.position.set(-165, H - 14, HD + 10);
    scr.rotation.x = -0.28;
    this._scene.add(scr);
    this._box(122, 70, 10, M.screenBezel, 0, 0, 0, scr, this._spec().core?.status);
    this._box(40, 30, 24, M.bodyDark, 0, 0, -14, scr);
    this._screenCanvas = document.createElement("canvas");
    this._screenCanvas.width = 512; this._screenCanvas.height = 300;
    this._screenTex = new T3.CanvasTexture(this._screenCanvas);
    this._screenTex.colorSpace = T3.SRGBColorSpace;
    const sm = new T3.Mesh(new T3.PlaneGeometry(112, 63), new T3.MeshBasicMaterial({ map: this._screenTex, toneMapped: false }));
    sm.position.z = 5.2;
    scr.add(sm);
    const ux = -100, uy = hy - 8, usbEnt = this._spec().core?.usb;                       // USB-A cut-out in the band (x -145..-105 per photo)
    this._box(20, 9, 2, M.black, ux, uy, HD + 1, null, usbEnt);
    this._cyl(3, 2, "z", M.black, -76, uy, HD + 1, null, null, 16);                      // small round hole (mic / button)
    this._usb = new T3.Group();
    this._usb.position.set(ux, uy, HD + 2);
    this._scene.add(this._usb);
    const fit = new T3.MeshStandardMaterial({ color: 0x141416, metalness: 0.15, roughness: 0.42 });
    this._box(14.3, 5, 16, fit, 0, 0, 8, this._usb, usbEnt);
    this._box(5, 5.2, 3, M.black, 0, 0, 13, this._usb);
    this._usb.visible = false;
    const cam = ent("camera:chamber");                                                   // live view camera + privacy cover
    this._box(36, 20, 16, M.black, -140, DOOR_Y1 - 12, HD - 44, null, cam);
    this._cyl(5, 4, "z", new T3.MeshPhysicalMaterial({ color: 0x0a1018, metalness: 0.4, roughness: 0.05 }), -140, DOOR_Y1 - 12, HD - 35, null, cam, 20);
    const dw = W - 2 * PIL, dh = DOOR_Y1 - DOOR_Y0 - 2;                                 // door
    this._door = new T3.Group();
    this._door.position.set(-dw / 2, 0, HD - 2);
    this._scene.add(this._door);
    this._m(slabXY(dw, dh, 3, 3), M.tint, dw / 2, DOOR_Y0 + 1 + dh / 2, 0, this._door);
    for (const y of [DOOR_Y1 - 30, DOOR_Y0 + 30]) this._box(10, 24, 5, M.steel, 5, y, 0, this._door);
    const grip = this._m(slabXY(12, 56, 6, 6), M.black, dw - 14, 280, 3.5, this._door, ent("door:front"));
    this._box(3, 36, 1, M.steel, -2, 0, 3.4, grip);
    if (this._comp("door:front")) this._doors = { front: { g: this._door, open: -1.75 } };
  },

  // rear panel (wiki rear photo, front coordinates, +/- 10): purge chute x +87, rear airflow window x -87, mesh grille
  // x +112, louvre x -98, power inlet x +160, lugs for the spool-holder brackets at the edges
  _h3cRear() {
    const T3 = this.T, M = this.M, slabXY = this._slabXY.bind(this), RZ = -HD;
    const perf = (w, h, x, y) => {
      const g = new T3.PlaneGeometry(w, h).rotateY(Math.PI), uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 8, uv.getY(i) * h / 8);
      return this._m(g, this._perfMat(), x, y, RZ - 0.4);
    };
    perf(108, 65, 112, 168); perf(100, 30, -98, 175);                                    // power-supply grille, louvre
    this._m(slabXY(CHUTE[2] + 8, CHUTE[3] + 8, 10, 2, [CHUTE[2], CHUTE[3], 8]), M.bodyDark, CHUTE[0], CHUTE[1], RZ - 1);
    this._box(70, 105, 2, M.black, -87, 340, RZ - 1);                                    // rear adaptive airflow unit window
    for (const dy of [-18, 18]) this._cyl(3, 1, "z", M.steel, -87, 340 + dy, RZ - 2.4, null, null, 12);
    this._box(66, 100, 1, this._perfMat(), -87, 340, RZ - 2.2, null, this._compEntity("fan:exhaust"));   // grille over the exhaust fan
    if (this._comp("fan:exhaust")) this._fans.exhaust = this._fan(30, "z-", -87, 340, RZ + T + 14, this._compEntity("fan:exhaust"));
    {   // purge chute: shaft behind the bed with a ramp out through the opening (as on the H2)
      const mat = this._chuteMat ||= new T3.MeshStandardMaterial({ color: 0x141416, roughness: 0.8, side: T3.DoubleSide });
      const [cx, , cw] = CHUTE, zb = -HD + T + 2, zf = -204, top = TIP - 18, low = CHUTE[1] - CHUTE[3] / 2;
      const rampY = low + (zf - zb), ramp = Math.hypot(zf - zb, rampY - low);
      this._box(cw + 4, top - rampY, 2, mat, cx, (top + rampY) / 2, zf);
      for (const s of [-1, 1]) this._box(2, top - low, zf - zb, mat, cx + s * (cw / 2 + 1), (top + low) / 2, (zf + zb) / 2);
      this._m(new T3.BoxGeometry(cw, 2, ramp).rotateX(-Math.atan2(rampY - low, zf - zb)), mat, cx, (rampY + low) / 2, (zf + zb) / 2);
      this._m(new T3.BoxGeometry(cw + 4, 2, 14).rotateX(-Math.PI / 4), mat, cx, top + 5, zf + 5);
    }
    this._box(50, 80, 4, M.black, 160, 67, RZ - 2);                                      // power inlet + rocker switch
    this._box(14, 9, 2, M.screenBezel, 160, 90, RZ - 4.5);
    this._box(30, 22, 8, M.bodyDark, 160, 50, RZ - 6);
    for (const s of [-1, 1]) this._box(16, 12, 6, M.bodyDark, s * 210, 410, RZ - 3);     // lugs for the spool-holder brackets
    for (const x of [-95, 95]) this._box(26, 4, 3, M.black, x, 560, RZ - 1.5);           // buffer / 6-pin board slots
  },

  // chamber: LED strips on the gantry beams (left and right), aux fan on the left wall, right adaptive airflow unit
  // (heater + fan), filter at the right rear
  _h3cChamber() {
    const T3 = this.T, M = this.M, ent = (r) => this._compEntity(r);
    if (this._comp("light:chamber")) {
      const bar = this._box(8, 4, 340, M.led, -HW + 41, H - 36, 5);
      this._box(8, 4, 340, bar.material, HW - 41, H - 36, 5);
      const lamp = new T3.PointLight(0xfff1dc, 0, 1100, 1.6);
      lamp.position.set(0, H - 60, 0);
      this._scene.add(lamp);
      this._lights = { chamber: { lamp, bar, power: 1.4 } };
    }
    const fan = (id, r, face, x, y, z) => { if (this._comp(`fan:${id}`)) this._fans[id] = this._fan(r, face, x, y, z, ent(`fan:${id}`)); };
    this._box(8, 90, 120, M.bodyDark, -HW + T + 4, 360, 30);                             // left aux duct
    fan("aux", 34, "x+", -HW + T + 9, 360, 30);
    const ptc = new T3.MeshStandardMaterial({ color: 0x3a3a3c, metalness: 0.6, roughness: 0.45, emissive: 0x000000 });
    const hx = HW - T - 5, hent = ent("heater:chamber");
    this._box(6, 110, 150, ptc, hx, 400, -40, null, hent);                               // right airflow unit: finned heater plate over the fan
    for (let k = 0; k < 9; k++) this._box(3, 2.4, 142, M.alu, hx - 3, 352 + k * 11, -40, null, hent);
    if (this._comp("heater:chamber")) this._heat.chamber = { mat: ptc, lo: 25, hi: 65 };
    fan("chamber", 34, "x-", HW - T - 8, 300, -40);
    // activated-carbon filter: right rear of the chamber (wiki H3C overview photo, callout 7), behind the airflow unit
    this._box(36, 200, 150, M.black, HW - T - 20, 230, -190);
    fan("ventilation", 30, "x-", HW - T - 40, 300, -190);
    this._chamberAnchor = new T3.Object3D();
    this._chamberAnchor.position.set(HW - 12, 400, -40);
    this._scene.add(this._chamberAnchor);
  },
});
