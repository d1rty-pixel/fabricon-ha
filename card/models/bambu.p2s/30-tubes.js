// The P2S's PTFE tubes: AMS / spool holder -> buffer -> slot at the top of the rear panel -> toolhead.
Object.assign(MODEL, {
  // Wiki p2s-faq: AMS -> buffer 600 mm, upper external spool -> buffer 350 mm. Both enter the buffer's +x side (the two
  // lanes of its Y channel), one tube leaves its -x side, climbs the panel to the slot near the top and runs inside to
  // the coupling on the head (rebuilt as the head moves). The PTFE is stiff: every bend stays >= TUBE_R where possible
  // (this._tubeMinR).
  _tubesUpdate() {
    const T3 = this.T, hx = this._hx || 0, hz = this._hz || 0, RZ = -D / 2;
    const ex = this._units[0]?.grp.localToWorld(new T3.Vector3(0, 40, -AMS_D / 2 - 4));
    const key = ex ? `${ex.x},${ex.y},${ex.z}` : "-";
    const fixed = this._tubeKey !== key;
    this._tubeKey = key;
    const n = (p, d, h) => { const l = Math.hypot(...d); return { p, d: d.map((v) => v / l), h }; };
    const [cx, cy] = BUFFER, top = cy + BUFFER[3] / 2 + 4, bz = RZ - 16;
    const pA = [cx - 18, top, bz], pS = [cx + 18, top, bz];          // the buffer's two ports on top: AMS / external spool
    const slot = [SLOT[0], SLOT[1], RZ - 6], out = [cx - BUFFER[2] / 2 - 3, cy - 16, bz];
    // above a port the tube arrives from the side its source is on (a quarter circle of TUBE_R down into the port)
    const above = (p, side) => n([p[0] + side * TUBE_R, p[1] + TUBE_R, bz], [-side, 0, 0]);
    // [follows the head, nodes, longest handle (fraction of the chord)]
    const paths = [
      [false, ex && [n([ex.x, ex.y, ex.z], [0, 0, -1]), above(pA, ex.x < pA[0] ? -1 : 1), n(pA, [0, -1, 0])], 3],   // AMS -> port
      [false, [n(this._holders.main.fit.toArray(), [-1, 0, 0]), n(pS, [0, -1, 0])], 1.5],             // spool -> port
      [false, [n(out, [-1, 0, -0.3]), n([-90, 370, RZ - 100], [0, 1, 0]), n(slot, [0, 0.1, 1])], 1],              // buffer -> slot
      [true, [n([SLOT[0], SLOT[1] - 4, RZ + 6], [0, 0, 1]), n([hx, HEAD_TOP + 12, hz - 12], [0, -0.5, 0.85])], 3],  // slot -> head
    ];
    paths.forEach(([dyn, p, fMax], i) => {
      if (!p) { if (this._tubes[i]) this._tubes[i].visible = false; return; }
      if (!dyn && !fixed && this._tubes[i]) return;
      const path = this._tubePath(p, fMax);
      (this._tubeMinR ||= [])[i] = path.minR;
      const geo = new T3.TubeGeometry(path, 140, 2.2, 8, false);
      if (!this._tubes[i]) { this._tubes[i] = new T3.Mesh(geo, this._tubeMat); this._scene.add(this._tubes[i]); }
      else { this._tubes[i].geometry.dispose(); this._tubes[i].geometry = geo; this._tubes[i].visible = true; }
    });
  },
});
