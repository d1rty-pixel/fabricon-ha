// The spool holder on the back panel.
Object.assign(MODEL, {
  // Black holder screwed to the rear panel in the middle (the embossed bracket of the rear panel photo, x 3, y 287): a base plate and a
  // rod pointing backwards; the spool turns about z on it. Returns the holder like the core expects, plus the point
  // where a PTFE tube leaves it (`fit`, a guide on a short arm above the spool's rear flange).
  _spoolHolder() {
    const T3 = this.T, M = this.M, RZ = -D / 2, x = BRACKET[0], y = BRACKET[1], ent = this._compEntity("external:main");
    const mat = this._holderMat ||= new T3.MeshStandardMaterial({ color: 0x1f2023, metalness: 0.2, roughness: 0.6 });
    const grp = new T3.Group();
    grp.position.set(x, y, RZ);
    this._scene.add(grp);
    this._box(60, 50, 6, mat, 0, 0, -3, grp, ent);                                    // plate on the panel
    this._cyl(8, 92, "z", mat, 0, 0, -46, grp, ent, 20);                              // rod
    this._cyl(12, 8, "z", mat, 0, 0, -94, grp, ent, 24);                              // end cap
    this._box(14, 60, 10, mat, 0, 40, -12, grp, ent);                                 // arm up to the tube guide
    this._cyl(5, 14, "y", M.black, 0, 74, -12, grp, null, 16);
    const pivot = new T3.Group();                                                     // _spool turns about x; the rod runs along z
    pivot.position.set(0, 0, -52);
    pivot.rotation.y = Math.PI / 2;
    grp.add(pivot);
    const spool = this._spool(pivot, ent);
    return { grp, spool, ent, fit: new T3.Vector3(x, y + 82, RZ - 12) };
  },
});
