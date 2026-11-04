// The X2D's PTFE tubes: AMS / spool holder -> buffer -> toolhead.
Object.assign(MODEL, {
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
      [false, [n(this._holders.right.fit.toArray(), [0.2, -1, 0]), n([86, 285, RZ - 12], [-1, 0, 0])], 2],    // upper spool holder
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
