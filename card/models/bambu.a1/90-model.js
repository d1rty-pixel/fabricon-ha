// What the core asks of the A1 / A1 mini model besides _build (see card/models/README.md).
Object.assign(MODEL, {
  _cfg1() { return this._a1c ||= CFG[{ "bambu.a1mini": "a1mini", "bambu.a2l": "a2l" }[this._spec().profile] || "a1"]; },

  // open frame: the AMS Lite stands beside the printer (amsTop null), its gap leaves room for the spool holder arm
  _geometry() {
    const c = this._cfg1();
    return { w: c.w, d: c.d, h: c.h, tip: c.tip, idle: c.idle, bed: [c.bed, c.bedZ || c.bed], kinematics: "bedslinger", focus: c.h * 0.55,
             park: [c.beam[0] + 10, 0], wipe: [c.beam[0], 0],
             amsTop: null, amsGap: c.amsGap };
  },

  // x-ray: the camera's diffuser and the toolhead cover go away
  _xray(on) {
    for (const o of this._clear) o.visible = !on;
  },
});
