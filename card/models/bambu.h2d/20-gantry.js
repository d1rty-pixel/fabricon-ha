// CoreXY gantry, toolhead with the two hotends, heatbed with the Z lead screws.
Object.assign(MODEL, {
  // gantry (no belts): an 8 mm Y rod along each side wall, the carriage = a slider on each rod holding the X linear rail
  // (wiki hotend photo: a silver rail with screws behind the head); the XY motors sit in the rear corners
  _h2dGantry() {
    const T3 = this.T, M = this.M, ylen = D - 2 * T - 24;
    for (const s of [-1, 1]) {
      this._cyl(4, ylen, "z", M.steel, s * YR_X, XR_Y, 0, null, null, 20);
      for (const z of [-1, 1]) this._box(16, 26, 12, M.bodyDark, s * (YR_X + 2), XR_Y, z * (ylen / 2 - 2));
      this._box(42, 40, 42, M.black, s * 190, XR_Y + 20, -HD + T + 23);                          // NEMA 17
      this._cyl(6, 16, "y", M.alu, s * 190, XR_Y + 48, -HD + T + 23, null, null, 20);
    }
    this._carriage = new T3.Group();
    this._scene.add(this._carriage);
    const xlen = 2 * (YR_X + 4);
    this._box(xlen, 16, 10, M.steel, 0, XR_Y, XR_Z, this._carriage);                         // rail
    this._box(xlen, 38, 6, M.bodyDark, 0, XR_Y, XR_Z - 8, this._carriage);                    // belt bay behind it
    for (let x = -YR_X + 20; x < YR_X; x += 28) this._cyl(2.4, 1, "z", M.black, x, XR_Y, XR_Z + 5.4, this._carriage, null, 10);   // rail screws
    for (const s of [-1, 1]) this._box(24, 44, 30, M.bodyDark, s * (YR_X - 3), XR_Y, XR_Z, this._carriage);
  },

  // toolhead (wiki hotend photo): a translucent dark-grey cover with "Bambu Lab" low on its front, silver cutter levers
  // on both sides, the two hotends side by side under it (black, 0.4 label, orange hot icon, heatsink fins on top).
  // Left hotend = `left` extruder, it lifts (core: _nozzleLift). One extruder (H2S) = one hotend in the middle.
  _h2dHead(dual) {
    const T3 = this.T, M = this.M, sp = this._spec(), ent = (r) => this._compEntity(r), hb = TIP + HOT, FZ = HEAD_D / 2 - 6;
    this._head = new T3.Group();
    this._scene.add(this._head);
    const cover = this._headCover = new T3.MeshPhysicalMaterial({ color: 0x2b2d31, metalness: 0.1, roughness: 0.18, transparent: true, opacity: 0.9 });
    const base = new T3.MeshStandardMaterial({ color: 0x17181a, metalness: 0.15, roughness: 0.7 });
    this._shell.push(base);
    const cg = this._slabXY(HEAD_W - 2, BODY, 10, HEAD_D - 6);
    this._m(cg, cover, 0, hb + BODY / 2, -3, this._head, ent("fan:part"));
    this._box(50, 56, 34, M.bodyDark, 0, hb + 52, -8, this._head);                            // extruder inside the cover
    this._box(HEAD_W - 12, 8, HEAD_D - 14, base, 0, hb + 4, -3, this._head);                  // black base
    this._box(70, 4, 6, base, 0, hb + 2, FZ + 4, this._head);
    const tl = this._text("Bambu Lab", 50, 8, { color: "#e4e5e7", weight: 700 });
    tl.position.set(0, hb + 20, FZ + 0.4);
    this._head.add(tl);
    this._fans.part = this._fan(14, "z+", 0, hb + 66, FZ + 0.4, ent("fan:part"), this._head, "blower");
    this._cyl(3.4, 2, "z", new T3.MeshPhysicalMaterial({ color: 0x0a1018, metalness: 0.4, roughness: 0.05 }), 0, hb + 40, FZ + 1, this._head, null, 20);   // toolhead camera
    for (const s of [-1, 1]) this._box(5, 54, 40, M.handle, s * (HEAD_W / 2 + 2), hb + 50, 6, this._head).rotation.z = s * 0.08;   // cutter levers
    this._fans.hotend = this._fan(11, "x+", HEAD_W / 2 + 5, hb + 30, -24, ent("fan:hotend"), this._head);
    for (const [dx, dz] of [[-10, -8], [14, -14]]) {                                          // PTFE couplings
      this._cyl(6, 8, "y", M.black, dx, HEAD_TOP + 4, dz, this._head);
      this._cyl(4.5, 3, "y", M.steel, dx, HEAD_TOP + 9, dz, this._head);
    }
    this._box(58, 40, 12, base, 0, XR_Y, XR_Z, this._head);                                     // bearing block on the rail

    // hotends
    const gold = new T3.MeshStandardMaterial({ color: 0xb08d57, metalness: 0.9, roughness: 0.3, emissive: 0x000000 });
    const sock = new T3.MeshStandardMaterial({ color: 0x2b2b2d, metalness: 0, roughness: 0.92 });
    const label = new T3.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.6 });
    const xs = (sp.extruders || []).length ? sp.extruders : [{ id: "left", heater: "nozzle_l" }, { id: "right", heater: "nozzle_r" }];
    xs.forEach((x, i) => {
      const g = new T3.Group(), hent = ent(`heater:${x.heater}`);
      g.position.x = xs.length > 1 ? (i ? NOZ_DX : -NOZ_DX) : 0;
      this._head.add(g);
      this._m(this._slabXY(18, 10, 3, 18), sock, 0, TIP + 9, 0, g, hent);                    // silicone sock
      this._box(24, 22, 24, M.black, 0, TIP + 25, 0, g, hent);                                // hotend body
      this._box(10, 7, 0.6, M.orange, 0, TIP + 22, 12.2, g, hent);                            // "caution hot" icon
      this._box(10, 4, 0.6, label, 0, TIP + 31, 12.2, g, hent);                               // 0.4 label
      for (let f = 0; f < 5; f++) this._box(22, 1.6, 22, M.alu, 0, TIP + 38.5 + f * 2.4, 0, g, hent);   // heatsink
      const tip = this._cyl(1.1, 5, "y", gold, 0, TIP + 2.5, 0, g, hent, 16, 4.5);
      this._nozzles[x.id] = { g, tip };
      this._heat[x.heater] = { mat: tip.material, lo: 60, hi: 300 };
    });
  },

  // heatbed: textured plate on the heater, carrier arms to the three Z sliders (screws front left / right and rear
  // centre, one belt-driven motor), the status light bar under the front edge. The plate follows the build area.
  _h2dBed() {
    const T3 = this.T, M = this.M, ent = (r) => this._compEntity(r), [bx, by] = this._bedSize();
    const screw = this._screwMat ||= new T3.MeshStandardMaterial({ color: 0x9a9da3, metalness: 0.9, roughness: 0.45 });
    const brass = this._nutMat ||= new T3.MeshStandardMaterial({ color: 0xb8893a, metalness: 0.9, roughness: 0.3 });
    const zlen = Z_TOP - FLOOR;
    for (const [x, z] of ZS) { this._cyl(4, zlen, "y", screw, x, FLOOR + zlen / 2, z, null, null, 16); this._cyl(11, 4, "y", M.black, x, FLOOR + 2, z, null, null, 24); }
    for (const [x, z] of ZR) { this._cyl(5, zlen, "y", M.steel, x, FLOOR + zlen / 2, z, null, null, 20); this._cyl(9, 6, "y", M.black, x, FLOOR + 3, z, null, null, 20); }
    for (const s of [-1, 1]) this._box(26, 10, 54, M.bodyDark, s * 214, Z_TOP + 5, 200);       // top brackets
    this._box(76, 10, 20, M.bodyDark, 22, Z_TOP + 5, -225);

    this._bed = new T3.Group();
    this._scene.add(this._bed);
    this._box(bx + 30, 10, by + 34, M.bodyDark, 0, -11, 0, this._bed);
    this._bedPlate = this._box(bx + 10, 6, by + 10, M.plateTex, 0, -3, 0, this._bed, ent("heater:bed"));
    this._heat.bed = { mat: this._bedPlate.material, lo: 30, hi: 120 };
    this._box(bx + 10, 1, by + 10, M.plate, 0, -6.5, 0, this._bed);
    this._box(bx * 0.8, 5, 6, M.steel, 0, -14, by / 2 + 20, this._bed);                         // status light bar under the front edge
    this._box(bx * 0.78, 1.6, 1.6, new T3.MeshBasicMaterial({ color: 0xcfd6e0 }), 0, -14, by / 2 + 23.4, this._bed);
    for (const s of [-1, 1]) {
      this._box(36, 10, 40, M.bodyDark, s * 200, -11, 185, this._bed);                          // arm to the front sliders
      this._box(26, 26, 60, M.bodyDark, s * 214, -3, 200, this._bed);
    }
    this._box(40, 10, 50, M.bodyDark, 0, -11, -200, this._bed);
    this._box(80, 26, 22, M.bodyDark, 22, -3, -225, this._bed);
    for (const [x, z] of ZS) this._cyl(10, 6, "y", brass, x, 13, z, this._bed, null, 6);
    for (const [x, z] of ZR) this._cyl(11, 6, "y", M.black, x, 13, z, this._bed, null, 24);
  },
});
