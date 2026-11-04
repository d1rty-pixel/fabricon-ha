// PTFE tubes: smooth Bezier paths between fittings with a minimum bend radius.
Object.assign(FabriconCard.prototype, {
  // a stiff tube between fittings: nodes {p, d, h} (position, unit direction of travel, optional cap on the handle
  // length there), one cubic Bezier per pair. Each segment takes the handle length (30-80 % of its chord, within
  // the caps) that makes its tightest bend the widest -- roughly how a springy PTFE tube settles without being
  // pushed into big loops. path.minR reports the tightest bend radius.
  _tubePath(nodes, fMax = 0.8) {
    const T3 = this.T, path = new T3.CurvePath();
    path.minR = Infinity;
    const V = (a) => new T3.Vector3(...a);
    const minR = (P0, P1, P2, P3) => {
      let m = Infinity;
      for (let k = 0; k <= 24; k++) {
        const t = k / 24, u = 1 - t, d1 = [], d2 = [];
        for (let j = 0; j < 3; j++) {
          d1[j] = 3 * (u * u * (P1[j] - P0[j]) + 2 * u * t * (P2[j] - P1[j]) + t * t * (P3[j] - P2[j]));
          d2[j] = 6 * (u * (P2[j] - 2 * P1[j] + P0[j]) + t * (P3[j] - 2 * P2[j] + P1[j]));
        }
        const cx = d1[1] * d2[2] - d1[2] * d2[1], cy = d1[2] * d2[0] - d1[0] * d2[2], cz = d1[0] * d2[1] - d1[1] * d2[0];
        const c = Math.hypot(cx, cy, cz), v = Math.hypot(...d1);
        if (c > 1e-9) m = Math.min(m, v * v * v / c);
      }
      return m;
    };
    for (let i = 0; i < nodes.length - 1; i++) {
      const a = nodes[i], b = nodes[i + 1], chord = Math.hypot(b.p[0] - a.p[0], b.p[1] - a.p[1], b.p[2] - a.p[2]);
      let best = null;
      for (let f = 0.3; f <= fMax + 0.01; f += 0.05) {
        const La = Math.min(f * chord, a.h ?? Infinity), Lb = Math.min(f * chord, b.h ?? Infinity);
        const P1 = a.p.map((v, j) => v + a.d[j] * La), P2 = b.p.map((v, j) => v - b.d[j] * Lb);
        const r = minR(a.p, P1, P2, b.p);
        if (!best || r > best.r + 0.5) best = { r, P1, P2 };
      }
      path.add(new T3.CubicBezierCurve3(V(a.p), V(best.P1), V(best.P2), V(b.p)));
      path.minR = Math.min(path.minR, best.r);
    }
    return path;
  },

  // PTFE tubes (wiki, X2D filament buffer / rear panel / auxiliary extruder / combo unboxing guides): into the
  // buffer's inlets on its +x side, one lane per nozzle -- the AMS into the left-nozzle lane, the upper spool holder
  // into the right-nozzle lane. Out of its -x side: the left-nozzle lane up into the orange tube
  // bracket in the corner and on into the chamber, the right-nozzle lane up into the auxiliary extruder's inlet on
  // its outer side; from the extruder's lock nut a short straight tube into the inlet slot. Both tubes leave the
  // toolhead to the right and curve back to the rear. The ones to the head are rebuilt as it moves.
  _tubesUpdate() {
    const T3 = this.T, hx = this._hx || 0, hz = this._hz || 0, hy = HEAD_TOP + 10;   // top of the PTFE couplings
    const RZ = -D / 2, ty = 462;
    const ex = this._units[0]?.grp.localToWorld(new T3.Vector3(0, 40, -AMS_D / 2 - 4));   // the first unit feeds the buffer
    const key = ex ? `${ex.x},${ex.y},${ex.z}` : "-";
    const fixed = this._tubeKey !== key;
    this._tubeKey = key;
    const n = (p, d, h) => { const l = Math.hypot(...d); return { p, d: d.map((v) => v / l), h }; };
    const room = (x) => Math.max(40, (W / 2 - T - 12 - x) * 1.25);   // the bow out to the right stays in the chamber
    const slot = [-14, 459, RZ - 2], nut = [-107, 446, RZ - 30];
    // [follows the head, nodes, longest handle (fraction of the chord): outside the printer there is room to bow]
    const paths = [
      [false, ex && [n([ex.x, ex.y, ex.z], [0, 0, -1]), n([86, 309, RZ - 12], [-1, 0, 0])], 1.3],          // AMS
      [false, [n(this._holders[0].fit.toArray(), [0.2, -1, 0]), n([86, 285, RZ - 12], [-1, 0, 0])], 2],    // upper spool holder
      [false, [n([-10, 285, RZ - 12], [-1, 0, 0]), n([-166, 444, RZ - 30], [1, 0, 0])], 1.3],
      [true, [n([-10, 309, RZ - 12], [-1, 0, 0]), n([-176, 463, RZ - 9], [1, 0, 0]), n([hx - 10, ty, hz - 8], [-1, 0, 0], room(hx - 10))]],
      [true, [n(nut, [1, 0, 0]), n(slot, slot.map((v, j) => v - nut[j])), n([hx + 14, ty - 6, hz - 14], [-1, 0, 0], room(hx + 14))]],
    ];
    paths.forEach(([dyn, p, fMax], i) => {
      if (!p) { if (this._tubes[i]) this._tubes[i].visible = false; return; }
      if (!dyn && !fixed && this._tubes[i]) return;
      const path = this._tubePath(p, fMax);
      (this._tubeMinR ||= [])[i] = path.minR;
      const geo = new T3.TubeGeometry(path, 160, 2.2, 8, false);
      if (!this._tubes[i]) { this._tubes[i] = new T3.Mesh(geo, this._tubeMat); this._scene.add(this._tubes[i]); }
      else { this._tubes[i].geometry.dispose(); this._tubes[i].geometry = geo; this._tubes[i].visible = true; }
    });
  },
});
