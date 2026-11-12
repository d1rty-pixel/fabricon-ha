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
  _replay(dt, job, t) {
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
      // walk along the moves at their feed rate; hold at the end of the layer until the printer reports the next.
      // Before the first layer (heating, levelling, calibration) the head waits at the layer's first move.
      if (!job.extruding && job.layer < 1) { this._gcK = a; this._gcU = 0; }
      let budget = job.extruding ? dt : 0;
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
    if (this._stageMotion(dt, t, job, job.layer < 1 ? 0 : z)) return;
    this._lift(z, 10, dt);
    this._moveHead(x - this._geo.bed[0] / 2, this._geo.bed[1] / 2 - y, 30, dt);
  },

  // STL / nothing: the bed follows the printed height, the head wanders over the footprint (no real path)
  _simulate(dt, t, job) {
    const mh = this._modelH || 40, printedH = job.active || job.s === "finished" ? job.prog * mh : 0;
    if (!this._stageKind(job)) this._lift(job.active || job.s === "finished" ? printedH : this._geo.idle ?? 60, 3, dt);
    if (this._clip) {
      this._clip.constant = this._bedTop() + 0.5 + printedH;
      this._print.visible = printedH > 0.2;
      this._ghost.visible = job.active || job.s === "finished";
    }
    if (this._stageMotion(dt, t, job, printedH)) return;
    let tx = this._geo.bed[0] * 0.43, tz = -this._geo.bed[1] * 0.43;
    if (job.extruding) {
      const [fw, fd] = this._modelFoot || [80, 80];
      tx = Math.sin(t * 1.9) * fw / 2;
      tz = Math.sin(t * 1.33 + 1) * fd / 2;
    } else if (job.active) { tx = 0; tz = 0; }
    this._moveHead(tx, tz, job.extruding ? 12 : 3, dt);
  },

  // the choreography for the job's stage while nothing is extruded (FAB_STAGE_MOTION), or null
  _stageKind(job) {
    return job.active && job.s !== "paused" && !job.extruding && job.stage ? FAB_STAGE_KIND[job.stage] || null : null;
  },

  // where the head purges / waits (bed coordinates: the model's purge chute or wiper, else behind the bed's rear-left
  // part) and where it wipes the nozzle (the model's wiper, else beside the park point)
  _parkAt() { const g = this._geo; return g.park || [-g.bed[0] * 0.3, -g.bed[1] / 2 - 12]; },
  _wipeAt() { const g = this._geo, p = this._parkAt(); return g.wipe || [p[0] + 34, p[1]]; },

  // Head and bed for a stage without extrusion (heating, levelling, calibrations, filament change). HA reports the
  // stage, not the position: each kind is a fixed pattern on the stage's own clock. base = the printed height (the
  // nozzle never goes below it). Returns false when the stage has no motion of its own.
  _stageMotion(dt, t, job, base) {
    const kind = this._stageKind(job);
    if (!kind) { this._stg = null; return false; }
    if (this._stg !== job.stage) { this._stg = job.stage; this._stgT0 = t; }
    const lt = t - this._stgT0, [bw, bd] = this._geo.bed, [px, pz] = this._parkAt(), [wx, wz] = this._wipeAt();
    const ping = (u) => 1 - Math.abs(((u % 2) + 2) % 2 - 1);             // 0 -> 1 -> 0 triangle, period 2
    let x = 0, z = 0, h = base + 2, rate = 6;
    if (kind === "park") { x = px; z = pz; h = base + 2; rate = 3; }
    else if (kind === "purge") {                                       // at the chute; every few seconds a wipe
      const c = lt % 9;
      if (c < 6) { x = px; z = pz; rate = 4; }
      else { x = wx + Math.sin((c - 6) * Math.PI * 4) * 12; z = wz; rate = 14; }
    } else if (kind === "wipe") { x = wx + Math.sin(lt * Math.PI * 3) * 15; z = wz; h = base; rate = 14; }
    else if (kind === "home") {                                        // to the corner, back to the middle, touch the plate
      const c = lt % 6;
      if (c < 1.8) { x = bw / 2 - 6; z = -bd / 2 + 6; h = base + 8; }
      else { h = c > 3.6 && c < 4.6 ? base : base + 6; }
      rate = 5;
    } else if (kind === "probe") {                                     // a 5 x 5 grid, row by row: travel, tap, lift
      const n = 5, step = 1.1, i = Math.floor(lt / step) % (n * n), c = (lt % step) / step, r = Math.floor(i / n);
      const col = r % 2 ? n - 1 - (i % n) : i % n;
      x = (col / (n - 1) - 0.5) * bw * 0.8; z = (r / (n - 1) - 0.5) * bd * 0.8;
      h = base + (c < 0.45 ? 3 : c < 0.75 ? 0 : 3); rate = c < 0.45 ? 9 : 16;
    } else if (kind === "shake") {                                     // resonance sweep in x, then in y, rising pitch
      const c = lt % 5, tau = c % 2.5, a = Math.sin(2 * Math.PI * (5 * tau + 2.4 * tau * tau)) * 5;
      if (c < 2.5) x = a; else z = a;
      h = base + 10; rate = 90;
    } else if (kind === "lines") {                                     // short test lines along the plate's front edge
      const row = Math.floor(lt / 3) % 6, u = (lt % 3) / 3;
      x = (row % 2 ? 1 - u : u) * bw * 0.6 - bw * 0.3; z = bd / 2 - 14 - row * 5;
      h = base + 0.2; rate = 10;
    } else if (kind === "scan") {                                      // slow passes over the part (or the plate's middle)
      const [fw, fd] = this._modelFoot || [bw * 0.5, bd * 0.5], rows = 4, row = Math.floor(lt / 2.5) % rows;
      x = (ping(lt / 2.5) - 0.5) * fw; z = (row / (rows - 1) - 0.5) * fd;
      h = base + 6; rate = 5;
    }
    this._lift(h, Math.min(rate, 20), dt);
    this._moveHead(x, z, rate, dt);
    return true;
  },
});
