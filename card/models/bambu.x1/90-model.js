// What the core asks of the X1 / P1S model besides _build (see card/models/README.md).
Object.assign(MODEL, {
  _geometry() {
    return { w: W, d: D, h: H, tip: TIP, idle: 60, bed: [256, 256], kinematics: "corexy_bed_z", focus: 300,
             amsTop: { y: AMS_Y, z: AMS_Z }, amsGap: [40, 40] };
  },

  // x-ray: the door and every glass part (lid, door, chute) go away; the core already made the shell see-through
  _xray(on) {
    const clear = new Set([this.M.glass, this.M.smoke, this.M.tint, this._chuteMat]);
    this._door.visible = !on;
    this._scene.traverse((o) => { if (o.isMesh && clear.has(o.material)) o.visible = !on; });
  },
});
