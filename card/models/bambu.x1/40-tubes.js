// PTFE tubes: AMS and external spool -> filament slot in the back panel -> toolhead coupling.
Object.assign(MODEL, {
  // Both sources enter the slot at the top of the back panel (x 62); from there one tube runs inside to the coupling on
  // the head and is rebuilt as the head moves. The PTFE is stiff (minimum radius 100): the outside tubes loop behind the
  // printer (waypoints found by a numeric search so that every bend stays >= 100 mm, see this._tubeMinR); the inside tube
  // meets the limit only while the head is not close to the rear panel (the slot is just 13 mm under the lid, so a head
  // parked directly in front of it cannot be reached without a tighter bend).
  _tubesUpdate() {
    const T3 = this.T, hx = this._hx || 0, hz = this._hz || 0, RZ = -D / 2;
    const ex = this._units[0]?.grp.localToWorld(new T3.Vector3(0, 40, -AMS_D / 2 - 4));
    const key = ex ? `${ex.x},${ex.y},${ex.z}` : "-";
    const fixed = this._tubeKey !== key;
    this._tubeKey = key;
    const n = (p, d, h) => { const l = Math.hypot(...d); return { p, d: d.map((v) => v / l), h }; };
    const sx = SLOT[0], sy = SLOT[1], inn = [sx, sy - 4, RZ + 6];
    // [follows the head, nodes, longest handle (fraction of the chord)]
    const paths = [
      [false, ex && [n([ex.x, ex.y, ex.z], [0, 0.2, -1]), n([sx - 10, 478, -388], [0, -0.197, -0.98]), n([sx - 10, 470, -321], [0, -0.013, 1]), n([sx - 10, sy, RZ - 8], [0, -0.458, 0.889])], 3],   // AMS
      [false, [n(this._holders.main.fit.toArray(), [0, 1, -0.3]), n([sx + 10, 514, -388], [0, 0.309, -0.951]), n([sx + 10, 477, -301], [0, -0.376, 0.927]), n([sx + 10, sy, RZ - 8], [0, -0.105, 0.994])], 3],   // external spool
      [true, [n(inn, [0, 0, 1]), n([hx, HEAD_TOP + 12, hz - 12], [0, -0.5, 0.85])], 3],
    ];
    paths.forEach(([dyn, p, fMax], i) => {
      if (!p) { if (this._tubes[i]) this._tubes[i].visible = false; return; }
      if (!dyn && !fixed && this._tubes[i]) return;
      const path = this._tubePath(p, fMax);
      (this._tubeMinR ||= [])[i] = path.minR;
      const geo = new T3.TubeGeometry(path, 120, 2.2, 8, false);
      if (!this._tubes[i]) { this._tubes[i] = new T3.Mesh(geo, this._tubeMat); this._scene.add(this._tubes[i]); }
      else { this._tubes[i].geometry.dispose(); this._tubes[i].geometry = geo; this._tubes[i].visible = true; }
    });
  },
});
