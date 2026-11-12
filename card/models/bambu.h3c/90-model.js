// What the core asks of the H3C model besides _build (see card/models/README.md).
Object.assign(MODEL, {
  // heatbed print area from the spec (330 x 320)
  _bedSize() {
    const v = this._spec().build_volume || [330, 320, 325];
    return [v[0], v[1]];
  },

  // amsTop null: the AMS 3H is drawn as part of the printer; further AMS units (up to 4, via tool 1) stand beside it
  _geometry() {
    return { w: W, d: D, h: H + 250, tip: TIP, idle: 60, bed: this._bedSize(), kinematics: "corexy_bed_z", focus: 520, park: [CHUTE[0], -240],
             amsTop: null, amsGap: [40, 40] };
  },

  // x-ray: the door, the AMS 3H cover, every glass part (side window with rim, toolhead cover) and the purge chute go away
  _xray(on) {
    const clear = new Set([this.M.glass, this.M.smoke, this.M.tint, this._headCover, this._chuteMat, this._amsDome]);
    this._door.visible = !on;
    for (const m of this._winRims) m.visible = !on;
    this._scene.traverse((o) => { if (o.isMesh && clear.has(o.material)) o.visible = !on; });
  },
});
