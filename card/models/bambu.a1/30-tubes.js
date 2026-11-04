// Tubes and cables: the black USB-C cable arcing from the toolhead over the frame to the base (wiki labels it
// "Bambu USB-C Cable"), the external spool's PTFE tube to the head's inlet, and with an AMS Lite the four PTFE tubes
// from its feeders to the hub on the toolhead (wiki: unboxing guide step 16).
Object.assign(MODEL, {
  // the hub on the head only exists with an AMS Lite
  _amsChanged(units) {
    const lite = units.some((u) => u.model.includes("LITE"));
    if (this._hub) this._hub.visible = lite;
    if (this._inlet) this._inlet.position.y = this._cfg1().tip + HEAD_H + (lite ? 62 : 32);
    this._tubeKey = null;
  },

  _tubesUpdate() {
    const T3 = this.T, c = this._cfg1(), u = this._units[0], feeds = u?.feeds;
    const W = (o, v = new T3.Vector3()) => o.getWorldPosition(v);
    const n = (p, dir, h) => ({ p, d: dir, h });
    const v3 = (v) => [v.x, v.y, v.z];
    const key = [this._inlet, this._cableAnchor, ...(feeds || [this._ptfeSrc])].map((o) => { const v = W(o); return `${v.x | 0},${v.y | 0},${v.z | 0}`; }).join("|");
    if (key === this._tubeKey) return;
    this._tubeKey = key;
    const put = (i, geo, mat) => {
      if (!this._tubes[i]) { this._tubes[i] = new T3.Mesh(geo, mat); this._scene.add(this._tubes[i]); }
      else { this._tubes[i].geometry.dispose(); this._tubes[i].geometry = geo; this._tubes[i].visible = true; }
    };
    // cable (index 4): head -> arch over the frame -> down the outside of the right column -> rear right of the base
    {
      const a = W(this._cableAnchor), cx = c.cols[c.cols.length - 1] + (c.cols.length === 1 ? 50 : 36), CZ = BEAM_Z - 6;
      const apexY = c.colTop + 100, mid = [(a.x + cx) / 2, apexY, CZ];
      const path = this._tubePath([n(v3(a), [0, 1, 0], 40), n(mid, [1, 0, 0]), n([cx, c.colTop - 60, CZ - 10], [0, -1, 0]),
        n([cx - 6, 60, c.base.z0 + 30], [0, -1, 0], 60)]);
      put(4, new T3.TubeGeometry(path, 160, 2.6, 8, false), this._cableMat);
    }
    const lite = feeds && feeds.length;
    for (let i = 0; i < 4; i++) if (this._tubes[i] && (!lite || i >= feeds.length) && !(i === 0 && !lite)) this._tubes[i].visible = false;
    const b = W(this._inlet);
    if (lite) {
      feeds.forEach((f, i) => {
        const a = W(f), bb = [b.x + (i - 1.5) * 3, b.y, b.z + (i % 2 ? 2 : -2)];
        const m = [(a.x + bb[0]) / 2, Math.max(a.y, bb[1]) + 50 + i * 8, (a.z + bb[2]) / 2], d = [bb[0] - a.x, 0, bb[2] - a.z], l = Math.hypot(...d) || 1;
        put(i, new T3.TubeGeometry(this._tubePath([n(v3(a), [0, 1, 0], 60), n(m, d.map((x) => x / l)), n(bb, [0, -1, 0], 40)]), 100, 2.1, 8, false), this._tubeMat);
      });
    } else if (this._ptfeSrc) {
      const a = W(this._ptfeSrc);
      const m = [(a.x + b.x) / 2, Math.max(a.y, b.y) + 40, (a.z + b.z) / 2], d = [b.x - a.x, 0, b.z - a.z], l = Math.hypot(...d) || 1;
      put(0, new T3.TubeGeometry(this._tubePath([n(v3(a), [0, 1, 0], 40), n(m, d.map((x) => x / l)), n(v3(b), [0, -1, 0], 30)]), 100, 2.1, 8, false), this._tubeMat);
    }
  },
});
