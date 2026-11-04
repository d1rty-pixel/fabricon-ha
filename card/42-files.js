// The job on the bed: the file picked in the Print dock (kept in IndexedDB, see 43-print), else the configured STL;
// its G-code paths or its model on the bed.
Object.assign(FabriconCard.prototype, {
  async _loadJob() {
    let job = null;
    try { job = await idb("readonly", (st) => st.get(this._jobKey())); } catch (_) { /* no storage */ }
    if (job) return this._useFile(job.name, job.data);
    this._clearJob();
    this._source = { kind: "default" };
    if (this._cfg.stl) {
      try {
        const r = await fetch(this._cfg.stl, { cache: "no-cache" });
        if (r.ok) { this._useStl(await r.arrayBuffer()); this._source = { kind: "stl", name: "default model (" + this._cfg.stl.split("?")[0] + ")" }; }
      } catch (_) { /* bed stays empty */ }
    }
  },

  // the stored file is per printer (each view has its own job)
  _jobKey() { return `job:${this._cfg.serial || this._cfg.printer}`; },

  async _useFile(name, buf) {
    this._busy(true, name);
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 40)));   // let the overlay paint before parsing
    try { await this._readFile(name, buf); } finally { this._busy(false); }
  },

  async _readFile(name, buf) {
    this._clearJob();
    this._source = { kind: "busy", name };
    try {
      if (/\.stl$/i.test(name)) { this._useStl(buf); this._source = { kind: "stl", name }; }
      else if (/\.3mf$/i.test(name)) {
        // sliced (.gcode.3mf): the plate's G-code; a project: its meshes, like an STL
        const gcode = await zipTexts(buf, /^Metadata\/plate_\d+\.gcode$/);
        if (gcode.length) { this._useGcode(parseGcode(gcode[0])); this._source = { kind: "gcode", name }; }
        else {
          const tris = mesh3mf(await zipTexts(buf, /\.model$/i));
          if (!tris.length) throw new Error("no G-code and no model in this 3MF");
          this._useMesh(tris);
          this._source = { kind: "mesh", name };
        }
      } else {
        await new Promise((r) => setTimeout(r, 30));
        this._useGcode(parseGcode(new TextDecoder().decode(buf)));
        this._source = { kind: "gcode", name };
      }
    } catch (err) { this._source = { kind: "error", name, err: String(err.message || err) }; }
  },

  _clearJob() {
    for (const o of [this._print, this._ghost, this._paths]) if (o) { o.parent?.remove(o); o.geometry?.dispose(); }
    this._print = this._ghost = this._paths = this._clip = this._gc = null;
    this._clickable = this._clickable.filter((m) => m.parent);
    this._gcLayer = null;
  },

  // extruded moves as line segments in bed coordinates (bed centre = 128/128, Y towards the back)
  _useGcode(g) {
    const T3 = this.T;
    let cnt = 0;
    const ext = new Uint32Array(g.n + 1);
    for (let i = 0; i < g.n; i++) { ext[i] = cnt; if (g.E[i] && i > 0) cnt++; }
    ext[g.n] = cnt;
    const pos = new Float32Array(cnt * 6), col = new Float32Array(cnt * 6);
    const pal = (g.colours.length ? g.colours : ["#FFB400"]).map((c) => this._pathColour(c));
    const segT = new Uint8Array(cnt);
    let k = 0;
    for (let i = 1; i < g.n; i++) {
      if (!g.E[i]) continue;
      const c = pal[g.T[i] % pal.length], o = k * 6;
      segT[k] = g.T[i];
      pos[o] = g.X[i - 1] - 128; pos[o + 1] = g.Z[i - 1]; pos[o + 2] = 128 - g.Y[i - 1];
      pos[o + 3] = g.X[i] - 128; pos[o + 4] = g.Z[i]; pos[o + 5] = 128 - g.Y[i];
      for (const q of [0, 3]) { col[o + q] = c.r; col[o + q + 1] = c.g; col[o + q + 2] = c.b; }
      k++;
    }
    const geo = new T3.BufferGeometry();
    geo.setAttribute("position", new T3.BufferAttribute(pos, 3));
    geo.setAttribute("color", new T3.BufferAttribute(col, 3));
    this._paths = new T3.LineSegments(geo, new T3.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 1 }));
    this._paths.position.y = 0.2;
    this._paths.frustumCulled = false;
    this._bed.add(this._paths);
    g.ext = ext;
    g.segT = segT;
    g.tint = {};
    this._gc = g;
    this._gcK = 1;
    this._gcU = 0;
  },

  _pathColour(c) { return new this.T.Color(c || "#FFB400").lerp(new this.T.Color(0x8a8a8a), 0.18); },

  // the slicer's filament colours are only the project's; while printing, the tool in use takes the colour
  // of the filament the AMS actually feeds
  _tintTool(t, colour) {
    const g = this._gc;
    if (!colour || g.tint[t] === colour) return;
    g.tint[t] = colour;
    const c = this._pathColour(colour), attr = this._paths.geometry.getAttribute("color"), col = attr.array;
    for (let k = 0; k < g.segT.length; k++) {
      if (g.segT[k] !== t) continue;
      for (let q = k * 6; q < k * 6 + 6; q += 3) { col[q] = c.r; col[q + 1] = c.g; col[q + 2] = c.b; }
    }
    attr.needsUpdate = true;
  },

  // the move range of a layer (1-based), and where the M73 progress mark falls in it
  _layerRange(l) {
    const st = this._gc.starts;
    const a = st[l] ?? 0;
    let b = this._gc.n;
    for (let m = l + 1; m < st.length; m++) if (st[m] !== undefined) { b = st[m]; break; }
    return [Math.max(1, a), Math.max(1, b)];
  },

  _useStl(buf) { this._useMesh(parseStl(buf)); },

  // a model (Z-up triangles) on the bed, grown with the progress by a clipping plane
  _useMesh(positions) {
    {
      const T3 = this.T, geo = new T3.BufferGeometry();
      geo.setAttribute("position", new T3.BufferAttribute(positions, 3));
      geo.rotateX(-Math.PI / 2);
      geo.computeVertexNormals();
      geo.computeBoundingBox();
      const bb = geo.boundingBox, c = new T3.Vector3();
      bb.getCenter(c);
      geo.translate(-c.x, -bb.min.y, -c.z);
      this._modelH = bb.max.y - bb.min.y;
      this._modelFoot = [bb.max.x - bb.min.x, bb.max.z - bb.min.z];
      this._clip = new T3.Plane(new T3.Vector3(0, -1, 0), 0);
      this._printMat = new T3.MeshStandardMaterial({ color: 0xffb400, roughness: 0.6, metalness: 0.05, clippingPlanes: [this._clip], side: T3.DoubleSide });
      this._print = new T3.Mesh(geo, this._printMat);
      this._ghost = new T3.LineSegments(new T3.EdgesGeometry(geo, 25), new T3.LineBasicMaterial({ color: 0xffb400, transparent: true, opacity: 0.25 }));
      this._print.position.y = 0.5;
      this._ghost.position.y = 0.5;
      this._bed.add(this._print, this._ghost);
      this._print.userData.entity = this._e("sensor", "current_print");
      this._clickable.push(this._print);
    }
  },
});
