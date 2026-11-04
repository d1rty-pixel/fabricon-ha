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
});
