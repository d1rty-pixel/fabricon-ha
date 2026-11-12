// What the core asks of the X2D model besides _build (see card/models/README.md).
Object.assign(MODEL, {
  // the machine's outline and the numbers the view, the motion and the AMS placement work with
  _geometry() {
    return { w: W, d: D, h: H, tip: TIP, idle: 60, bed: [256, 256], kinematics: "corexy_bed_z", focus: 375, park: [CHUTE[0], -172],
             amsTop: { y: AMS_Y, z: AMS_Z }, amsGap: [40, 140] };
  },

  // x-ray: the door, every glass / acrylic part (lid, side windows with their rims, toolhead cover) and the purge
  // chute go away (the core already made the shell see-through)
  _xray(on) {
    const clear = new Set([this.M.glass, this.M.smoke, this.M.tint, this._headCover, this._chuteMat]);
    this._door.visible = !on;
    for (const m of this._winRims) m.visible = !on;
    this._scene.traverse((o) => { if (o.isMesh && clear.has(o.material)) o.visible = !on; });
  },

  // the lower spool holder is only there without an AMS
  _amsChanged(units) { this._holders.left.grp.visible = !units.length; },
});
