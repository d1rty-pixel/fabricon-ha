// CoreXY gantry (no belts), the Swaptek rack with its nine tools, the toolhead with the tool on it, the heatbed.
Object.assign(MODEL, {
  // Y rod along each side wall, the carriage = sliders on the rods holding the X rail; XY motors in the rear corners
  _h3cGantry() {
    const T3 = this.T, M = this.M, ylen = D - 2 * T - 24;
    for (const s of [-1, 1]) {
      this._cyl(4, ylen, "z", M.steel, s * YR_X, XR_Y, 0, null, null, 20);
      for (const z of [-1, 1]) this._box(16, 26, 12, M.bodyDark, s * (YR_X + 2), XR_Y, z * (ylen / 2 - 2));
      this._box(42, 40, 42, M.black, s * 190, XR_Y + 20, -HD + T + 23);
      this._cyl(6, 16, "y", M.alu, s * 190, XR_Y + 48, -HD + T + 23, null, null, 20);
    }
    this._carriage = new T3.Group();
    this._scene.add(this._carriage);
    const xlen = 2 * (YR_X + 4);
    this._box(xlen, 16, 10, M.steel, 0, XR_Y, XR_Z, this._carriage);
    this._box(xlen, 36, 6, M.bodyDark, 0, XR_Y, XR_Z - 8, this._carriage);
    for (const s of [-1, 1]) this._box(24, 44, 30, M.bodyDark, s * (YR_X - 3), XR_Y, XR_Z, this._carriage);
  },

  // One tool, nozzle tip at local y 0 (rack photo: grey base, orange tab on top, black sock at the bottom).
  // kind "print" = PrintTool (hotend with heat sink), "cut" = CutTool (blade), "draw" = DrawTool (pen).
  // Returns {g, tip}; `hent` makes the hotend clickable.
  _h3cTool(parent, kind, hent) {
    const T3 = this.T, M = this.M, g = new T3.Group();
    parent.add(g);
    const mats = this._toolMats ||= {
      gold: new T3.MeshStandardMaterial({ color: 0xb08d57, metalness: 0.9, roughness: 0.3, emissive: 0x000000 }),
      sock: new T3.MeshStandardMaterial({ color: 0x2b2b2d, metalness: 0, roughness: 0.92 }),
      base: new T3.MeshStandardMaterial({ color: 0x55585d, metalness: 0.3, roughness: 0.55 }),
      plate: new T3.MeshStandardMaterial({ color: 0xb4b7bc, metalness: 0.6, roughness: 0.4 }),
      cut: new T3.MeshStandardMaterial({ color: 0x3b82c4, metalness: 0.2, roughness: 0.5 }),
      draw: new T3.MeshStandardMaterial({ color: 0x3aa57a, metalness: 0.2, roughness: 0.5 }),
    };
    const bx = (w, h, d, m, x, y, z, e) => this._box(w, h, d, m, x, y, z, g, e);
    let tip;
    if (kind === "print") {
      this._m(this._slabXY(18, 10, 3, 18), mats.sock, 0, 9, 0, g, hent);
      tip = this._cyl(4.5, 5, "y", mats.gold.clone(), 0, 2.5, 0, g, hent, 16, 1.1);
      for (let f = 0; f < 5; f++) bx(22, 1.6, 22, M.alu, 0, 62 + f * 3, 0, hent);           // heat sink under the cap
    } else {
      tip = new T3.Object3D(); g.add(tip);
      if (kind === "cut") { bx(1.2, 16, 10, M.steel, 0, 8, 6); bx(18, 8, 18, mats.sock, 0, 14, 0); }
      else { this._cyl(3.4, 30, "y", M.black, 0, 15, 4, g, null, 14); this._cyl(1, 6, "y", M.steel, 0, 3, 4, g, null, 8); }
    }
    bx(TOOL_W, 44, TOOL_D, mats.base, 0, 38, 0, hent);                                      // base (cutter actuator, magnet, pins)
    bx(22, 28, 1, mats.plate, 0, 38, TOOL_D / 2 + 0.3);                                     // front plate with the FeedView window
    bx(10, 12, 1.2, M.black, 0, 40, TOOL_D / 2 + 0.9);
    bx(6, 30, 12, M.handle, TOOL_W / 2 + 2, 34, 6);                                         // cutter handle on the right
    bx(TOOL_W, 6, TOOL_D, M.black, 0, 83, 0);                                               // top cap
    bx(12, 7, 14, kind === "cut" ? mats.cut : kind === "draw" ? mats.draw : M.orange, 0, 88, 0);   // tab / light
    return { g, tip };
  },

  // the rack (photo, AMS removed): black uprights at both ends with a rod across the top, a dark back plate with the
  // dock cut-outs, nine tools hanging in a row at 36 mm; the dock of the tool on the head is empty. CutTool / DrawTool, when
  // fitted, hang in the last two docks (wiki: slots 1 and 9 recommended; slot 1 is the head's tool here). The rack
  // drops by RACK_DROP on a tool change: this._rackDown 0..1.
  _h3cRack() {
    const T3 = this.T, M = this.M, act = this._h3cActive(), half = (N_TOOLS - 1) / 2 * PITCH + 26;
    const g = this._rack = new T3.Group();
    g.position.set(0, 0, RACK_Z);
    this._scene.add(g);
    const yc = RACK_TIP + TOOL_H / 2 + 6;
    for (const s of [-1, 1]) this._box(26, TOOL_H + 70, 56, M.bodyDark, s * (half + 12), yc + 10, -6, g);
    this._cyl(4, 2 * half + 24, "x", M.steel, 0, RACK_TIP + TOOL_H + 12, -16, g, null, 16);
    this._box(2 * half, TOOL_H + 24, 5, M.black, 0, yc + 4, -24, g);
    this._box(2 * half, 6, 18, M.alu, 0, RACK_TIP - 16, 6, g);                              // foot rail
    for (let i = 0; i < N_TOOLS; i++) {
      const x = (i - (N_TOOLS - 1) / 2) * PITCH;
      this._box(PITCH - 6, 5, 22, M.bodyDark, x, RACK_TIP + TOOL_H + 5, -8, g);            // dock
      if (i === act) continue;
      const kind = i === N_TOOLS - 1 && this._fitted("cut_tool") ? "cut" : i === N_TOOLS - 2 && this._fitted("draw_tool") ? "draw" : "print";
      const t = this._h3cTool(g, kind, null);
      t.g.position.set(x, RACK_TIP, 0);
    }
  },

  // toolhead (wiki toolhead guides): a carriage on the X rail with the extruder, ToolLock, camera, part fan on its front
  // and the hotend fan on its right; it carries NO hotend of its own: the tool plugs into its bottom (_h3cTool)
  _h3cHead() {
    const T3 = this.T, M = this.M, ent = (r) => this._compEntity(r), FZ = HEAD_D / 2 - 6;
    this._head = new T3.Group();
    this._scene.add(this._head);
    const cover = this._headCover = new T3.MeshPhysicalMaterial({ color: 0x2b2d31, metalness: 0.1, roughness: 0.18, transparent: true, opacity: 0.9 });
    this._m(this._slabXY(HEAD_W - 2, HEAD_H, 8, HEAD_D - 6), cover, 0, HEAD_BOT + HEAD_H / 2, -3, this._head, ent("fan:part"));
    this._box(50, 44, 34, M.bodyDark, 0, HEAD_BOT + 30, -10, this._head);                   // FlexFeed extruder inside the cover
    this._box(HEAD_W - 12, 8, HEAD_D - 14, M.black, 0, HEAD_BOT + 4, -3, this._head);        // base with the ToolLock / tool holder
    this._box(HEAD_W - 20, 12, 4, M.bodyDark, 0, HEAD_TOP + 6, -8, this._head);
    if (this._comp("fan:part")) this._fans.part = this._fan(13, "z+", 0, HEAD_BOT + 40, FZ + 0.4, ent("fan:part"), this._head, "blower");
    if (this._comp("fan:hotend")) this._fans.hotend = this._fan(11, "x+", HEAD_W / 2 + 5, HEAD_BOT + 24, -10, ent("fan:hotend"), this._head);
    this._cyl(3.4, 2, "z", new T3.MeshPhysicalMaterial({ color: 0x0a1018, metalness: 0.4, roughness: 0.05 }), 0, HEAD_BOT + 14, FZ + 1, this._head, null, 20);   // toolhead camera
    this._box(58, 40, 12, M.black, 0, XR_Y, XR_Z, this._head);                              // bearing block on the rail
    this._box(10, 30, 30, M.bodyDark, -HEAD_W / 2 - 3, HEAD_BOT + 24, -3, this._head);
    // the tool on the head
    const t = this._h3cTool(this._head, "print", ent("heater:nozzle"));
    t.g.position.set(0, TIP, 0);
    this._nozzles.main = t;
    if (this._comp("heater:nozzle")) this._heat.nozzle = { mat: t.tip.material, lo: 60, hi: 300 };
  },

  // heatbed: plate on the heater, arms to the three Z sliders (screws front left / right, rear centre), status bar under
  // the front edge. The plate follows the build area (spec).
  _h3cBed() {
    const T3 = this.T, M = this.M, ent = (r) => this._compEntity(r), [bx, by] = this._bedSize();
    const screw = this._screwMat ||= new T3.MeshStandardMaterial({ color: 0x9a9da3, metalness: 0.9, roughness: 0.45 });
    const brass = this._nutMat ||= new T3.MeshStandardMaterial({ color: 0xb8893a, metalness: 0.9, roughness: 0.3 });
    const zlen = Z_TOP - FLOOR;
    for (const [x, z] of ZS) { this._cyl(4, zlen, "y", screw, x, FLOOR + zlen / 2, z, null, null, 16); this._cyl(11, 4, "y", M.black, x, FLOOR + 2, z, null, null, 24); }
    for (const [x, z] of ZR) { this._cyl(5, zlen, "y", M.steel, x, FLOOR + zlen / 2, z, null, null, 20); this._cyl(9, 6, "y", M.black, x, FLOOR + 3, z, null, null, 20); }
    for (const s of [-1, 1]) this._box(26, 10, 54, M.bodyDark, s * 214, Z_TOP + 5, 200);
    this._box(76, 10, 20, M.bodyDark, 22, Z_TOP + 5, -225);
    this._bed = new T3.Group();
    this._scene.add(this._bed);
    this._box(bx + 30, 10, by + 34, M.bodyDark, 0, -11, 0, this._bed);
    this._bedPlate = this._box(bx + 10, 6, by + 10, M.plateTex, 0, -3, 0, this._bed, ent("heater:bed"));
    if (this._comp("heater:bed")) this._heat.bed = { mat: this._bedPlate.material, lo: 30, hi: 120 };
    this._box(bx + 10, 1, by + 10, M.plate, 0, -6.5, 0, this._bed);
    this._box(bx * 0.8, 5, 6, M.steel, 0, -14, by / 2 + 20, this._bed);
    this._box(bx * 0.78, 1.6, 1.6, new T3.MeshBasicMaterial({ color: 0xcfd6e0 }), 0, -14, by / 2 + 23.4, this._bed);
    for (const s of [-1, 1]) {
      this._box(36, 10, 40, M.bodyDark, s * 200, -11, 185, this._bed);
      this._box(26, 26, 60, M.bodyDark, s * 214, -3, 200, this._bed);
    }
    this._box(40, 10, 50, M.bodyDark, 0, -11, -200, this._bed);
    this._box(80, 26, 22, M.bodyDark, 22, -3, -225, this._bed);
    for (const [x, z] of ZS) this._cyl(10, 6, "y", brass, x, 13, z, this._bed, null, 6);
    for (const [x, z] of ZR) this._cyl(11, 6, "y", M.black, x, 13, z, this._bed, null, 24);
  },
});
