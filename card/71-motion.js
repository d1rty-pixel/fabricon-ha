// Toolhead / bed motion while printing: G-code replay or a simulated pattern.
Object.assign(FabriconCard.prototype, {
  // the nozzle over bed point (tx, tz) (bed coordinates: x right, z towards the front). corexy_bed_z: the head
  // runs in x / z (the carriage with it in z); bedslinger: the head runs in x, the bed moves under it in z
  _moveHead(tx, tz, rate, dt) {
    this._hx = (this._hx ?? tx) + (tx - (this._hx ?? tx)) * Math.min(1, dt * rate);
    this._hz = (this._hz ?? tz) + (tz - (this._hz ?? tz)) * Math.min(1, dt * rate);
    if (this._geo.kinematics === "bedslinger") {
      this._head.position.x = this._hx;
      this._bed.position.z = -this._hz;
    } else {
      this._head.position.set(this._hx, 0, this._hz);
      if (this._carriage) this._carriage.position.z = this._hz;
    }
  },

  // the nozzle h mm over the bed: corexy_bed_z lowers the bed, bedslinger lifts the gantry (with the head on it)
  _lift(h, rate, dt) {
    const k = Math.min(1, dt * rate), tip = this._geo.tip;
    if (this._geo.kinematics === "bedslinger") (this._gantry || this._head).position.y += (h - (this._gantry || this._head).position.y) * k;
    else this._bed.position.y += (tip - h - this._bed.position.y) * k;
  },

  // the bed's top surface height now (the printed model is clipped against it)
  _bedTop() { return this._geo.kinematics === "bedslinger" ? this._geo.tip : this._bed.position.y; },

  // G-code: idle = whole job as a preview; printing = this layer's moves from the progress mark on, at feed rate
  _replay(dt, job) {
    const g = this._gc, lerp = (a, b, u) => a + (b - a) * u;
    if (!job.active && job.s !== "finished") {
      this._paths.geometry.setDrawRange(0, g.ext[g.n] * 2);
      this._paths.material.opacity = 0.35;
      this._lift(this._geo.idle ?? 60, 3, dt);
      this._moveHead(this._geo.bed[0] * 0.43, -this._geo.bed[1] * 0.43, 3, dt);
      return;
    }
    this._paths.material.opacity = 1;
    if (job.s === "finished") { this._gcK = g.n - 1; this._gcU = 1; }
    else {
      const [a, b] = this._layerRange(Math.max(1, job.layer));
      const mark = g.prog[Math.round(job.prog * 100)];
      if (job.layer !== this._gcLayer) {
        this._gcLayer = job.layer;
        this._gcK = mark >= a && mark < b ? mark : a;
        this._gcU = 0;
      } else if (mark > this._gcK && mark < b) { this._gcK = mark; this._gcU = 0; }
      // walk along the moves at their feed rate; hold at the end of the layer until the printer reports the next
      let budget = job.printing ? dt : 0;
      while (budget > 0 && this._gcK < b) {
        const k = this._gcK, len = Math.hypot(g.X[k] - g.X[k - 1], g.Y[k] - g.Y[k - 1], g.Z[k] - g.Z[k - 1]);
        const dur = len / Math.max(1, g.F[k] / 60);
        const left = (1 - this._gcU) * dur;
        if (budget >= left) { budget -= left; this._gcK++; this._gcU = 0; }
        else { this._gcU += budget / Math.max(1e-6, dur); budget = 0; }
      }
      if (this._gcK >= b) { this._gcK = b - 1; this._gcU = 1; }
    }
    const k = Math.max(1, this._gcK), u = this._gcU;
    if (job.s !== "finished") this._tintTool(g.T[k], this._feedColour);
    const x = lerp(g.X[k - 1], g.X[k], u), y = lerp(g.Y[k - 1], g.Y[k], u), z = lerp(g.Z[k - 1], g.Z[k], u);
    this._paths.geometry.setDrawRange(0, (g.ext[k] + (g.E[k] && u > 0 ? 1 : 0)) * 2);
    this._lift(z, 10, dt);
    this._moveHead(x - this._geo.bed[0] / 2, this._geo.bed[1] / 2 - y, 30, dt);
  },

  // STL / nothing: the bed follows the printed height, the head wanders over the footprint (no real path)
  _simulate(dt, t, job) {
    const mh = this._modelH || 40, printedH = job.active || job.s === "finished" ? job.prog * mh : 0;
    this._lift(job.active || job.s === "finished" ? printedH : this._geo.idle ?? 60, 3, dt);
    if (this._clip) {
      this._clip.constant = this._bedTop() + 0.5 + printedH;
      this._print.visible = printedH > 0.2;
      this._ghost.visible = job.active || job.s === "finished";
    }
    let tx = this._geo.bed[0] * 0.43, tz = -this._geo.bed[1] * 0.43;
    if (job.printing) {
      const [fw, fd] = this._modelFoot || [80, 80];
      tx = Math.sin(t * 1.9) * fw / 2;
      tz = Math.sin(t * 1.33 + 1) * fd / 2;
    } else if (job.active) { tx = 0; tz = 0; }
    this._moveHead(tx, tz, job.printing ? 12 : 3, dt);
  },
});
