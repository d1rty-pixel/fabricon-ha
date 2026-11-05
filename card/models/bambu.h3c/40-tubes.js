// PTFE tubes: AMS 3H bracket -> the nine tools. Eight end at their dock on the rack, the one of the tool on the head
// follows it (rebuilt every frame). Tube length in reality 415 mm; min bend radius 100 where the geometry allows it.
Object.assign(MODEL, {
  _tubesUpdate() {
    const T3 = this.T, hx = this._hx || 0, hz = this._hz || 0, act = this._h3cActive();
    const n = (p, d, h) => { const l = Math.hypot(...d); return { p, d: d.map((v) => v / l), h }; };
    const fixed = !this._tubesBuilt;
    this._tubesBuilt = true;
    for (let i = 0; i < N_TOOLS; i++) {
      const dyn = i === act, bx = (i - 4) * 30, tx = (i - 4) * PITCH;
      if (!dyn && !fixed) continue;
      const end = dyn ? n([hx, HEAD_TOP + 14, hz], [0, -1, 0]) : n([tx, RACK_TIP + TOOL_H + 12, RACK_Z], [0, -1, 0]);
      const path = this._tubePath([n([bx, BRACKET_Y, BRACKET_Z], [0, 0, 1]), end], 1.3);
      (this._tubeMinR ||= [])[i] = path.minR;
      const geo = new T3.TubeGeometry(path, 120, 2.2, 8, false);
      if (!this._tubes[i]) { this._tubes[i] = new T3.Mesh(geo, this._tubeMat); this._scene.add(this._tubes[i]); }
      else { this._tubes[i].geometry.dispose(); this._tubes[i].geometry = geo; }
    }
  },
});
