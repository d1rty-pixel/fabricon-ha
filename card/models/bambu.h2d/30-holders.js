// The rear spool holders (two mounts at the left edge of the rear panel) with the two external spools.
Object.assign(MODEL, {
  // upper mount = right nozzle's lane, lower mount = left nozzle's (wiki unboxing: "slide down onto the upper and lower
  // mounts at the back"); only one mount for an H2S. The lower one is only shown without an AMS (_amsChanged).
  _h2dHolders() {
    const ids = (this._spec().filament?.external || []).map((x) => x.id), list = ids.length ? ids : ["left", "right"];
    const upper = list.includes("right") ? "right" : list[0], lower = list.find((id) => id !== upper);
    this._holders = {};
    this._h2dUpper = this._holders[upper] = this._spoolHolder(-195, 372, upper, true);
    if (lower) this._h2dLower = this._holders[lower] = this._spoolHolder(-195, 170, lower, false);
    this._tubes = [];
    this._tubeMat = this.M.ptfe;
    for (const y of [372, 170]) {                                                   // bases on the rear panel, two slots each
      this._m(this._slabXY(44, 60, 6, 4), this.M.bodyDark, -195, y, -HD - 2);
      for (const dy of [13, -13]) this._box(15, 15, 1, this.M.black, -195, y + dy, -HD - 4.1);
    }
  },

  // Holder on its base: the bracket slides into the base, a round arm with an end cap runs along the panel to the LEFT
  // (-x), 30 mm off it, past the printer's side wall, so the spool hangs beside the back corner. `tube`: the L-shaped
  // PTFE tube holder stands in the arm's slot at the wall, its fitting points to the printer's middle (the tube goes
  // on to the buffer). Returns the group, the spool, its entity, the fitting.
  _spoolHolder(x, y, id, tube) {
    const T3 = this.T, M = this.M, grp = new T3.Group(), RZ = -HD, s = -1;
    const mat = this._holderMat ||= new T3.MeshStandardMaterial({ color: 0x3a3c40, metalness: 0.25, roughness: 0.6 });
    grp.position.set(x, y, RZ);
    this._scene.add(grp);
    const ent = this._compEntity(`external:${id}`), L = 150, ay = -8, az = -30, wall = HW + x;     // wall: distance to the side wall
    this._box(34, 50, 8, mat, 0, 0, -8, grp, ent);                                          // bracket in the base
    this._box(26, 28, 30, mat, 0, ay, -18, grp, ent);                                       // standoff to the arm
    this._cyl(15, L, "x", mat, s * L / 2, ay, az, grp, ent, 32);                            // arm
    this._cyl(18, 8, "x", mat, s * (L + 4), ay, az, grp, ent, 32);                          // end cap
    const spool = this._spool(grp, ent);
    spool.g.position.set(s * (-wall + 66), ay + 13, az);                                     // outside the wall, the hub rests on the arm
    let fit = null;
    if (tube) {
      const sx = -wall + 4, top = ay + 125;
      this._cyl(5, top - ay, "y", mat, s * sx, (ay + top) / 2, az, grp, ent, 16);          // stem
      this._cyl(5, 26, "x", mat, s * (sx - 13), top, az, grp, ent, 16);                      // arm to the fitting
      this._cyl(6.5, 16, "y", M.black, s * (sx - 26), top - 4, az, grp, null, 16);
      fit = new T3.Vector3(x + s * (sx - 26), y + top - 12, RZ + az);
    }
    return { grp, spool, ent, fit, id };
  },
});
