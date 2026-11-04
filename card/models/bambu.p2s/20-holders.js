// The external spool holder on the P2S's rear panel.
Object.assign(MODEL, {
  // Holder on the upper bracket plate (rear photo, +137 / 400): like the X2D's, a bracket in the plate, a round arm
  // along the back panel to +x past the side wall (the spool hangs beside the corner) and the L-shaped tube holder
  // standing in the arm's slot; its fitting points towards the printer's middle, the tube leaves it downwards to the
  // buffer. Returns the group, the spool, its entity, the fitting.
  _spoolHolder() {
    const T3 = this.T, M = this.M, RZ = -D / 2, x = BRACKET[0], y = BRACKET[1], grp = new T3.Group();
    const mat = this._holderMat ||= new T3.MeshStandardMaterial({ color: 0x3a3c40, metalness: 0.25, roughness: 0.6 });
    grp.position.set(x, y, RZ);
    this._scene.add(grp);
    const ent = this._compEntity("external:main"), L = 160, ay = -8, az = -30;
    this._box(34, 50, 8, mat, 0, 0, -8, grp, ent);                                          // bracket in the plate
    this._box(26, 28, az + 12, mat, 0, ay, (az - 12) / 2 - 6, grp, ent);                     // standoff to the arm
    this._cyl(15, L, "x", mat, L / 2, ay, az, grp, ent, 32);                                // arm
    this._cyl(18, 8, "x", mat, L + 4, ay, az, grp, ent, 32);                                // end cap
    const spool = this._spool(grp, ent);
    spool.g.position.set(W / 2 - x + 66, ay + 13, az);                                      // the hub rests on the arm
    const sx = W / 2 - x + 4, top = ay + 100;
    this._cyl(5, top - ay, "y", mat, sx, (ay + top) / 2, az, grp, ent, 16);                  // stem in the arm's slot
    this._cyl(5, 26, "x", mat, sx - 13, top, az, grp, ent, 16);
    this._cyl(6.5, 16, "y", M.black, sx - 26, top - 4, az, grp, null, 16);                   // tube fitting
    return { grp, spool, ent, fit: new T3.Vector3(x + sx - 26, y + top - 12, RZ + az) };
  },
});
