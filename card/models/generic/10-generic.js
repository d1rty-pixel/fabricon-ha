// Generic printer: a parametric machine from the spec's build volume and kinematics, for every printer without a
// model of its own. corexy_bed_z: an enclosure with a glass door, the head on an XY gantry, the bed going down;
// bedslinger: an open frame, the bed sliding front / back on the base, the head on a gantry going up.
// It provides every part the core knows (see card/models/README.md), placed by rule, not after a real machine.
Object.assign(MODEL, {
  _gv() {
    if (this._gvc) return this._gvc;
    const sp = this._spec(), [bx, by, bz] = sp.build_volume || [256, 256, 256], sling = sp.kinematics === "bedslinger";
    const floor = sling ? 0 : 50, tip = sling ? 92 : floor + 18 + bz;
    const w = sling ? bx + 130 : bx + 136, d = sling ? by * 2 + 40 : by + 150, h = sling ? tip + bz + 110 : tip + 130;
    return (this._gvc = { bx, by, bz, sling, floor, tip, w, d, h });
  },

  _geometry() {
    const g = this._gv();
    return { w: g.w, d: g.d, h: g.h, tip: g.tip, idle: g.sling ? 40 : 60, bed: [g.bx, g.by], kinematics: g.sling ? "bedslinger" : "corexy_bed_z",
             focus: g.h * 0.62, amsTop: g.sling ? null : { y: g.h + 4, z: g.d / 2 - 26 - FabriconCard.AMS.D / 2 }, amsGap: [40, 60] };
  },

  _build() {
    const g = this._gv(), T3 = this.T, M = this.M, sp = this._spec(), hw = g.w / 2, hd = g.d / 2;
    const comp = (ref) => this._compEntity(ref);
    if (g.sling) {
      // base with the screen at the front right, two uprights joined by the top beam, the Y rail under the bed
      this._box(g.w - 40, 60, g.d * 0.55, M.body, 0, 30, 0);
      for (const s of [-1, 1]) this._box(30, 12, g.d * 0.55, M.black, s * (g.w / 2 - 50), 6, 0);
      const scr = this._box(70, 46, 8, M.screenBezel, hw - 60, 52, g.d * 0.275 + 6, null, sp.core?.status);
      scr.rotation.x = -0.6;
      for (const s of [-1, 1]) this._box(34, g.h - 60, 40, M.bodyDark, s * (hw - 17), 60 + (g.h - 60) / 2, -20);
      this._box(g.w, 30, 40, M.bodyDark, 0, g.h - 15, -20);
      this._bed = new T3.Group();
      this._bed.position.y = g.tip;
      this._scene.add(this._bed);
      this._box(g.bx + 20, 14, g.by + 20, M.bodyDark, 0, -17, 0, this._bed);
      this._bedPlate = this._box(g.bx + 2, 6, g.by + 2, M.plateTex, 0, -3, 0, this._bed, comp("heater:bed"));
      // gantry: the X beam with the head, lifted by _lift; the head runs along it
      this._gantry = new T3.Group();
      this._scene.add(this._gantry);
      this._box(g.w - 68, 28, 30, M.alu, 0, g.tip + 70, -40, this._gantry);
      this._head = new T3.Group();
      this._gantry.add(this._head);
      this._headParts(g.tip, -6);
      this._lamp(0, g.h - 34, 0, 0.9);
    } else {
      // enclosure: shell, glass lid, door, chamber floor, Z rods, gantry and head
      this._box(g.w, g.h - 8, 10, M.body, 0, 4 + (g.h - 8) / 2, -hd + 5);
      for (const s of [-1, 1]) this._box(10, g.h - 8, g.d, M.body, s * (hw - 5), 4 + (g.h - 8) / 2, 0);
      this._box(g.w, 8, g.d, M.bodyDark, 0, 4, 0);
      this._box(g.w, 40, 10, M.body, 0, g.h - 20, hd - 5);
      this._box(g.w, g.floor - 8, 10, M.body, 0, 4 + (g.floor - 8) / 2, hd - 5);
      this._box(g.w - 40, 4, g.d - 40, M.glass, 0, g.h - 2, 0);
      this._box(g.w - 20, 6, g.d - 20, M.inner, 0, g.floor - 3, 0);
      const door = new T3.Group();
      door.position.set(-hw + 6, 0, hd + 2);
      this._scene.add(door);
      const dh = g.h - 40 - g.floor;
      this._box(g.w - 12, dh, 4, M.tint, (g.w - 12) / 2, g.floor + dh / 2, 0, door);
      this._box(10, 60, 8, M.handle, g.w - 30, g.floor + dh / 2, 6, door, comp("door:front"));
      this._door = door;
      if (this._comp("door:front")) this._doors.front = { g: door, open: -1.75 };
      const scr = this._box(90, 56, 8, M.screenBezel, -hw + 70, g.h - 20, hd + 4, null, sp.core?.status);
      scr.rotation.x = -0.3;
      for (const [x, z] of [[-1, 1], [1, 1], [0, -1]]) this._cyl(5, g.h - g.floor - 60, "y", M.steel, x * (hw - 30), g.floor + (g.h - g.floor - 60) / 2, z * (hd - 40));
      this._carriage = new T3.Group();
      this._scene.add(this._carriage);
      this._cyl(5, g.w - 30, "x", M.steel, 0, g.tip + 80, 0, this._carriage, null, 20);
      for (const s of [-1, 1]) this._cyl(4, g.d - 40, "z", M.steel, s * (hw - 22), g.tip + 80, 0, null, null, 20);
      this._head = new T3.Group();
      this._scene.add(this._head);
      this._headParts(g.tip, 0);
      this._bed = new T3.Group();
      this._bed.position.y = g.tip - 60;
      this._scene.add(this._bed);
      this._box(g.bx + 24, 10, g.by + 24, M.bodyDark, 0, -11, 0, this._bed);
      this._bedPlate = this._box(g.bx + 2, 6, g.by + 2, M.plateTex, 0, -3, 0, this._bed, comp("heater:bed"));
      this._lamp(-hw + 30, g.h - 50, 0, 1.4);
      // the printer's own fans on the walls: aux left, chamber / exhaust at the back
      const wallFan = (id, face, x, y, z) => { if (this._comp(`fan:${id}`)) this._fans[id] = this._fan(40, face, x, y, z, comp(`fan:${id}`)); };
      wallFan("aux", "x-", -hw - 2, g.h * 0.45, 40);
      wallFan("aux_l", "x-", -hw - 2, g.h * 0.45, 40);
      wallFan("aux_r", "x+", hw + 2, g.h * 0.45, 40);
      wallFan("chamber", "z-", hw - 80, g.h * 0.55, -hd - 2);
      wallFan("exhaust", "z-", hw - 80, g.h * 0.55, -hd - 2);
      this._filter = this._box(1, 1, 1, M.inner, 0, g.h * 0.55, -hd);
    }
    this._heat.bed = { mat: this._bedPlate.material, lo: 30, hi: 120 };
    // external spools: on a holder at the back (enclosed) or on the top beam (open frame)
    (sp.filament?.external || []).forEach((x, i) => {
      const grp = new T3.Group();
      grp.position.set(g.sling ? -60 + i * 130 : hw + 70, g.sling ? g.h + 100 : g.h * 0.55 - i * 220, g.sling ? -20 : -hd + 60);
      this._scene.add(grp);
      if (!g.sling) this._box(160, 20, 20, M.bodyDark, -80, -40, -50, grp);
      this._holders[x.id] = { grp, spool: this._spool(grp, x.entity), ent: x.entity };
    });
    const rows = (pre, ids) => ids.filter((r) => this._comp(r)).length ? ids : [];
    this._labelSpec = [
      { anchor: this._head, off: [0, 120, 0], title: "TOOLHEAD", rows: [...(sp.heaters || []).filter((h) => h.kind === "nozzle").map((h) => `heater:${h.id}`), "fan:part", "fan:hotend"] },
      { anchor: this._bedPlate, off: [g.bx / 2 - 10, 4, g.by / 2 - 10], rows: ["heater:bed"] },
      { anchor: this._head, off: [0, 220, 0], title: g.sling ? "PRINTER" : "CHAMBER", rows: [...rows("", ["heater:chamber"]),
        ...(sp.lights || []).map((l) => `light:${l.id}`), "fan:aux", "fan:aux_l", "fan:aux_r", "fan:chamber", "fan:exhaust", "fan:ventilation"] },
      ...(this._door && this._doors.front ? [{ anchor: this._door, off: [g.w - 30, g.h * 0.5, 0], rows: ["door:front"] }] : []),
      ...Object.entries(this._holders).map(([id, h]) => ({ anchor: h.spool.g, off: [0, 100, 0], rows: [`external:${id}`] })),
    ];
    this._labelSpec[2].anchor = this._scene;   // chamber box at a fixed spot over the machine
    this._labelSpec[2].off = [-g.w * 0.25, g.h + 40, 0];
  },

  // the toolhead: body, part fan in front, a hotend per extruder (lifted when it isn't the active one)
  _headParts(tip, z) {
    const M = this.M, sp = this._spec(), xs = sp.extruders?.length ? sp.extruders : [{ id: "main", heater: "nozzle" }];
    this._box(62, 66, 54, M.bodyDark, 0, tip + 26 + 33, z, this._head, sp.core?.stage);
    if (this._comp("fan:part")) this._fans.part = this._fan(20, "z+", 0, tip + 56, z + 28, this._compEntity("fan:part"), this._head, "blower");
    xs.forEach((x, i) => {
      const grp = new this.T.Group();
      grp.position.x = xs.length > 1 ? (i ? 16 : -16) : 0;
      this._head.add(grp);
      const ent = this._compEntity(`heater:${x.heater}`);
      this._box(20, 14, 20, M.screenBezel, 0, tip + 14, z, grp, ent);
      const tip_ = this._cyl(1.1, 6, "y", new this.T.MeshStandardMaterial({ color: 0xb08d57, metalness: 0.9, roughness: 0.3, emissive: 0x000000 }),
        0, tip + 3, z, grp, ent, 16, 4.5);
      this._nozzles[x.id] = { g: grp, tip: tip_ };
      this._heat[x.heater] = { mat: tip_.material, lo: 60, hi: 300 };
    });
  },

  // the printer's light: an LED bar and a point light (only when the spec lists one)
  _lamp(x, y, z, power) {
    const l = this._primaryLight();
    if (!l) return;
    const bar = this._box(this._gv().sling ? 120 : 10, 4, this._gv().sling ? 10 : 160, this.M.led, x, y, z);
    const lamp = new this.T.PointLight(0xfff1dc, 0, 900, 1.6);
    lamp.position.set(x, y - 20, z);
    this._scene.add(lamp);
    this._lights[l.id] = { lamp, bar, power };
  },

  _xray(on) {
    if (this._door) this._door.visible = !on;
    this._scene.traverse((o) => { if (o.isMesh && (o.material === this.M.glass || o.material === this.M.tint)) o.visible = !on; });
  },
});
