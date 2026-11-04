// The spool holders on the X2D's back panel.
Object.assign(MODEL, {
  // Spool holder on its base (wiki photos): the bracket slides into the base, a round arm with an end cap runs along
  // the back panel to the right (+x), 30 mm off it, and reaches past the side wall, so a spool on it hangs beside the
  // printer's back corner. With `tube` the L-shaped PTFE tube holder stands in the arm's slot where the housing
  // ends, the spool outside it towards the end cap; its fitting on top points towards the printer's middle,
  // the tube leaves it downwards to the buffer. `side` is the external spool (left / right) it carries. Returns the
  // group, the spool on the arm, its entity, the fitting.
  _spoolHolder(x, y, side, tube) {
    const T3 = this.T, M = this.M, grp = new T3.Group(), RZ = -D / 2;
    const mat = this._holderMat ||= new T3.MeshStandardMaterial({ color: 0x3a3c40, metalness: 0.25, roughness: 0.6 });
    grp.position.set(x, y, RZ);
    this._scene.add(grp);
    const ent = this._e("sensor", `${side}_external_spool`), L = 160, ay = -8, az = -30;
    this._box(34, 50, 8, mat, 0, 0, -8, grp, ent);                                          // bracket in the base
    this._box(26, 28, az + 12, mat, 0, ay, (az - 12) / 2 - 6, grp, ent);                     // standoff to the arm
    this._cyl(15, L, "x", mat, L / 2, ay, az, grp, ent, 32);                                // arm
    this._cyl(18, 8, "x", mat, L + 4, ay, az, grp, ent, 32);                                // end cap
    const spool = this._spool(grp, ent);
    spool.g.position.set(W / 2 - x + 66, ay + 13, az);                                      // between stem and end cap; the hub rests on the arm
    let fit = null;
    if (tube) {
      const sx = W / 2 - x + 4, top = ay + 125;
      this._cyl(5, top - ay, "y", mat, sx, (ay + top) / 2, az, grp, ent, 16);              // stem in the arm's slot
      this._cyl(5, 26, "x", mat, sx - 13, top, az, grp, ent, 16);                           // arm
      this._cyl(6.5, 16, "y", M.black, sx - 26, top - 4, az, grp, null, 16);                // tube fitting
      fit = new T3.Vector3(x + sx - 26, y + top - 12, RZ + az);
    }
    return { grp, spool, ent, fit };
  },
});
