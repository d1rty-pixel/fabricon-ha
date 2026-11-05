// PTFE tubes: AMS / spool holders -> buffer -> the two couplings on the extruder.
Object.assign(MODEL, {
  // The AMS leaves the printer's back over the lid and drops into the top of the buffer; the holders' tubes rise to
  // the buffer's left side (the upper holder into the right nozzle's lane, the lower into the left one's). The lanes
  // come through the rear panel at the buffer (right corner), run on inside and reach the head's couplings from its right (like the
  // X2D); the ones to the head are rebuilt as it moves.
  _tubesUpdate() {
    this._laserFx();
    const T3 = this.T, hx = this._hx || 0, hz = this._hz || 0, ty = HEAD_TOP + 14, bz = BUF[2], iz = -HD + T + 3;
    const dual = (this._spec().extruders || []).length !== 1;
    const ex = this._units[0]?.grp.localToWorld(new T3.Vector3(0, 40, -AMS_D / 2 - 4));
    const key = `${ex ? `${ex.x},${ex.y},${ex.z}` : "-"}|${this._h2dLower?.grp.visible}`;
    const fixed = this._tubeKey !== key;
    this._tubeKey = key;
    const n = (p, d, h) => { const l = Math.hypot(...d); return { p, d: d.map((v) => v / l), h }; };
    const room = (x) => Math.max(40, (HW - T - 12 - x) * 1.25);          // the bow out to the right stays in the chamber
    const lo = this._h2dLower, up = this._h2dUpper;
    const paths = [
      [false, ex && [n([ex.x, ex.y, ex.z], [0, 0, -1]), n([BUF[0] - 30, BUF[1], bz], [0, -1, 0])], 1.3],        // AMS
      [false, up && [n(up.fit.toArray(), [0.5, 1, 0]), n([BUF[0] - 75, BUF[1] - 37, bz], [1, 0, 0])], 2],         // upper holder
      [false, lo?.grp.visible && lo.fit && [n(lo.fit.toArray(), [0.5, 1, 0]), n([BUF[0] - 75, BUF[1] - 73, bz], [1, 0, 0])], 2],
      [true, [n([BUF[0] + 35, 575, iz], [0, 0, 1], 30), n([hx + (dual ? 14 : -10), ty, hz - (dual ? 14 : 8)], [-1, 0, 0], room(hx + 14))]],   // right lane
      [true, dual && [n([BUF[0] + 35, 545, iz], [0, 0, 1], 30), n([hx - 10, ty, hz - 8], [-1, 0, 0], room(hx - 10))]],                      // left lane
    ];
    // laser module: the black air-assist tube from the module's top coupler to the coupler on the buffer (wiki laser-setup)
    paths.push([true, this._v.laser && [n([BUF[0], 560, iz], [0, 0, 1], 30), n([hx, TIP + 108, hz - 14], [0, -1, 0], 40)], 0.8, 3]);
    paths.forEach(([dyn, p, fMax, rad], i) => {
      if (!p) { if (this._tubes[i]) this._tubes[i].visible = false; return; }
      if (!dyn && !fixed && this._tubes[i]) return;
      const path = this._tubePath(p, fMax);
      (this._tubeMinR ||= [])[i] = path.minR;
      const geo = new T3.TubeGeometry(path, 160, rad || 2.2, 8, false);
      if (!this._tubes[i]) { this._tubes[i] = new T3.Mesh(geo, rad ? (this._airMat ||= new T3.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.5 })) : this._tubeMat); this._scene.add(this._tubes[i]); }
      else { this._tubes[i].geometry.dispose(); this._tubes[i].geometry = geo; this._tubes[i].visible = true; }
    });
  },
});
