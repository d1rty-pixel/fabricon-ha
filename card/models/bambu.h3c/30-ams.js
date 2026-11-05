// The AMS 3H built into the top, and the rear spool holder.
Object.assign(MODEL, {
  // AMS 3H (overview photo): a smoked translucent rounded cover over nine spools standing side by side (axis along x,
  // 52 mm apart), under it an open band where the nine PTFE tubes leave from a bracket. 480 x 562 x 460, 31 mm into the
  // printer's top. Part of the printer: the spec's other AMS units stand beside it (amsTop: null).
  _h3cAms() {
    const T3 = this.T, M = this.M, zc = -4, y0 = AMS3_Y, ydome = y0 + AMS3_BAY, hd = AMS3_H - AMS3_BAY;
    const dome = this._amsDome = new T3.MeshPhysicalMaterial({ color: 0x23272d, metalness: 0.1, roughness: 0.12, transparent: true, opacity: 0.5, side: T3.DoubleSide, depthWrite: false });
    this._m(this._slabXY(AMS3_W, hd, 110, AMS3_D - 8), dome, 0, ydome + hd / 2, zc);
    this._box(AMS3_W - 4, 10, AMS3_D - 8, this._silver, 0, ydome + 5, zc);                     // deck under the cover
    for (const s of [-1, 1]) this._box(20, AMS3_BAY, AMS3_D - 8, this._silver, s * (AMS3_W / 2 - 10), y0 + AMS3_BAY / 2, zc);   // side posts of the tube bay
    this._box(AMS3_W - 40, AMS3_BAY, 10, M.bodyDark, 0, y0 + AMS3_BAY / 2, -AMS3_D / 2 + 5 + zc);   // rear wall of the bay
    this._box(340, 10, 14, M.black, 0, BRACKET_Y, BRACKET_Z, null);                            // PTFE tube bracket
    const lbl = this._text("AMS 3H", 60, 12, { color: "#c9ccd1", weight: 700, align: "left", px: 256, fit: true });
    lbl.position.set(-150, ydome + 24, AMS3_D / 2 + zc + 0.8);
    this._scene.add(lbl);
    this._amsSpools = SPOOLS.map((c, i) => {                                                    // slots 1..9, colours as a stand-in
      const x = (i - 4) * 52, g = new T3.Group(), col = new T3.MeshStandardMaterial({ color: c, roughness: 0.5 });
      g.position.set(x, ydome + 110, zc);
      this._scene.add(g);
      this._cyl(88, 30, "x", col, 0, 0, 0, g, null, 40);
      this._cyl(88, 3, "x", M.black, -16, 0, 0, g, null, 40);
      this._cyl(88, 3, "x", M.black, 16, 0, 0, g, null, 40);
      this._cyl(24, 34, "x", M.bodyDark, 0, 0, 0, g, null, 20);
      this._box(30, 40, 30, M.bodyDark, 0, -110, 70, g);                                         // feeder module under the spool
      return g;
    });
  },

  // spool holder(s) on the rear panel (two bracket positions at the left edge), as on the H2: the arm runs to the left
  // past the side wall; the spool hangs beside the back corner
  _h3cHolders() {
    const ids = (this._spec().filament?.external || []).map((x) => x.id), list = (ids.length ? ids : ["main"]).slice(0, 2);
    this._holders = {};
    list.forEach((id, i) => { this._holders[id] = this._spoolHolder(-195, i ? 170 : 372, id); });
    this._tubes = [];
    this._tubeMat = this.M.ptfe;
    for (const y of [372, 170]) {
      this._m(this._slabXY(44, 60, 6, 4), this.M.bodyDark, -195, y, -HD - 2);
      for (const dy of [13, -13]) this._box(15, 15, 1, this.M.black, -195, y + dy, -HD - 4.1);
    }
  },

  _spoolHolder(x, y, id) {
    const T3 = this.T, M = this.M, grp = new T3.Group(), RZ = -HD, s = -1;
    const mat = this._holderMat ||= new T3.MeshStandardMaterial({ color: 0x3a3c40, metalness: 0.25, roughness: 0.6 });
    grp.position.set(x, y, RZ);
    this._scene.add(grp);
    const ent = this._compEntity(`external:${id}`), L = 150, ay = -8, az = -30, wall = HW + x;
    this._box(34, 50, 8, mat, 0, 0, -8, grp, ent);
    this._box(26, 28, 30, mat, 0, ay, -18, grp, ent);
    this._cyl(15, L, "x", mat, s * L / 2, ay, az, grp, ent, 32);
    this._cyl(18, 8, "x", mat, s * (L + 4), ay, az, grp, ent, 32);
    const spool = this._spool(grp, ent);
    spool.g.position.set(s * (-wall + 66), ay + 13, az);
    return { grp, spool, ent, id };
  },
});
