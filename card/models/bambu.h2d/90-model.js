// What the core asks of the H2D model besides _build (see card/models/README.md).
Object.assign(MODEL, {
  // heatbed print area: 350 x 320 with two nozzles, the H2S's own volume (340 x 320) with one
  _bedSize() {
    const sp = this._spec(), v = sp.build_volume || [325, 320, 325];
    return [(sp.extruders || []).length === 1 || sp.profile === "bambu.h2c" ? v[0] : 350, v[1]];      // H2D 350, H2S 340, H2C 330
  },

  _geometry() {
    return { w: W, d: D, h: H, tip: TIP, idle: 60, bed: this._bedSize(), kinematics: "corexy_bed_z", focus: 340, park: [CHUTE[0], -225],
             amsTop: { y: AMS_Y, z: AMS_Z }, amsGap: [60, 40] };
  },

  // x-ray: the door, every glass part (lid, side windows with rims, toolhead cover) and the purge chute go away
  _xray(on) {
    const clear = new Set([this.M.glass, this.M.smoke, this.M.tint, this._headCover, this._chuteMat, this._greenMat]);
    this._door.visible = !on;
    for (const m of this._winRims || []) m.visible = !on;
    if (this._lid) this._lid.visible = !on;                                                   // Laser Edition: black top plate
    this._scene.traverse((o) => { if (o.isMesh && clear.has(o.material)) o.visible = !on; });
  },

  // the lower spool holder is only there without an AMS
  _amsChanged(units) { if (this._h2dLower) this._h2dLower.grp.visible = !units.length; },
});
