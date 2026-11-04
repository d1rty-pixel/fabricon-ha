// Toolhead / bed motion while printing: G-code replay or a simulated pattern.
Object.assign(FabriconCard.prototype, {
  _moveHead(tx, tz, rate, dt) {
    this._hx = (this._hx ?? tx) + (tx - (this._hx ?? tx)) * Math.min(1, dt * rate);
    this._hz = (this._hz ?? tz) + (tz - (this._hz ?? tz)) * Math.min(1, dt * rate);
    this._head.position.set(this._hx, 0, this._hz);
    this._carriage.position.z = this._hz;
  },

  // G-code: idle = whole job as a preview; printing = this layer's moves from the progress mark on, at feed rate
  _replay(dt, job) {
    const g = this._gc, lerp = (a, b, u) => a + (b - a) * u;
    if (!job.active && job.s !== "finished") {
      this._paths.geometry.setDrawRange(0, g.ext[g.n] * 2);
      this._paths.material.opacity = 0.35;
      this._bed.position.y += (TIP - 60 - this._bed.position.y) * Math.min(1, dt * 3);
      this._moveHead(110, -110, 3, dt);
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
    this._bed.position.y += (TIP - z - this._bed.position.y) * Math.min(1, dt * 10);
    this._moveHead(x - 128, 128 - y, 30, dt);
  },

  // STL / nothing: the bed follows the printed height, the head wanders over the footprint (no real path)
  _simulate(dt, t, job) {
    const mh = this._modelH || 40, printedH = job.active || job.s === "finished" ? job.prog * mh : 0;
    const bedTop = job.active || job.s === "finished" ? TIP - printedH : TIP - 60;
    this._bed.position.y += (bedTop - this._bed.position.y) * Math.min(1, dt * 3);
    if (this._clip) {
      this._clip.constant = this._bed.position.y + 0.5 + printedH;
      this._print.visible = printedH > 0.2;
      this._ghost.visible = job.active || job.s === "finished";
    }
    let tx = 110, tz = -110;
    if (job.printing) {
      const [fw, fd] = this._modelFoot || [80, 80];
      tx = Math.sin(t * 1.9) * fw / 2;
      tz = Math.sin(t * 1.33 + 1) * fd / 2;
    } else if (job.active) { tx = 0; tz = 0; }
    this._moveHead(tx, tz, job.printing ? 12 : 3, dt);
  },
});
