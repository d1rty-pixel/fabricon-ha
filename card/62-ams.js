// AMS units and spool holders: build, place (top / left / right / on the table).
Object.assign(FabriconCard.prototype, {
  // A 1 kg spool turning about x: flanges with hub hole and six cut-outs, hub, filament winding with rounded edges
  // (unit radius, scaled by the fill in _spoolState). Returns the group and the winding.
  _spool(parent, ent) {
    const T3 = this.T, g = new T3.Group();
    parent.add(g);
    const flangeShape = new T3.Shape();
    flangeShape.absarc(0, 0, 98, 0, Math.PI * 2, false);
    const hubHole = new T3.Path(); hubHole.absarc(0, 0, 27, 0, Math.PI * 2, true); flangeShape.holes.push(hubHole);
    for (let k = 0; k < 6; k++) {
      const h = new T3.Path(), a0 = k / 6 * Math.PI * 2;
      h.absarc(Math.cos(a0) * 60, Math.sin(a0) * 60, 15, 0, Math.PI * 2, true);
      flangeShape.holes.push(h);
    }
    const flangeG = new T3.ExtrudeGeometry(flangeShape, { depth: 2.4, bevelEnabled: false, curveSegments: 40 }).translate(0, 0, -1.2).rotateY(Math.PI / 2);
    const winding = new T3.LatheGeometry([[0.3, -29], [0.97, -29], [1, -27.5], [1, 27.5], [0.97, 29], [0.3, 29]].map(([r, y]) => new T3.Vector2(r, y)), 64)
      .rotateZ(Math.PI / 2);
    const flange = new T3.MeshPhysicalMaterial({ color: 0x1e2024, roughness: 0.35, transparent: true, opacity: 0.85 });
    for (const sx of [-1, 1]) this._m(flangeG, flange, sx * 31, 0, 0, g, ent);
    this._cyl(27, 60, "x", this.M.black, 0, 0, 0, g, ent, 32);
    const fil = this._m(winding, new T3.MeshStandardMaterial({ color: 0x888888, roughness: 0.5, metalness: 0.05, emissive: 0x000000 }), 0, 0, 0, g, ent);
    return { g, fil };
  },

  // (Re)build the AMS units when the connected set changes: model, labels, placement, the AMS panel
  _setAms(units) {
    const key = units.map((u) => `${u.prefix}:${u.slots}`).join(",");
    if (key === this._amsKey) return;
    this._amsKey = key;
    for (const u of this._units) {
      this._scene.remove(u.grp);
      u.grp.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
      this._clickable = this._clickable.filter((m) => !u.meshes.has(m));
      this._shell = this._shell.filter((m) => m !== u.body);
      for (const l of u.labs) l.el.remove();
      this._labels = this._labels.filter((l) => !u.labs.has(l));
      for (const k of Object.keys(this._lab)) if (u.labs.has(this._lab[k].lab)) delete this._lab[k];
    }
    this._units = units;
    units.forEach((u, k) => {
      this._buildAms(u);
      u.meshes = new Set();
      u.grp.traverse((o) => u.meshes.add(o));
      const open = () => this._openAms(u.id);
      const rows = { ...this._label(u.grp, [-40, 30, AMS_D / 2 + 2], [["ams" + k, `sensor.${u.prefix}_humidity`, open]]) };
      u.spools.forEach((sp, i) => Object.assign(rows, this._label(sp.g, [0, 100, 0], [[`slot${k}_${i}`, `sensor.${u.prefix}_slot_${i + 1}`, open]])));
      Object.assign(this._lab, rows);
      u.labs = new Set(Object.values(rows).map((r) => r.lab));
    });
    this.shadowRoot.querySelector(".amssel").parentNode.style.display = units.length === 1 ? "" : "none";
    this._amsChanged(units);
    this._railAms();
    let saved = null;
    try { saved = localStorage.getItem("fabricon-ams"); } catch (_) { /* no storage: use the config */ }
    this._placeAms(saved || this._cfg.ams_position);
    this._tubeKey = null;
    // the AMS panel lists the units: rebuild it, reopen it if it is showing
    for (const p of (this._cfg.panels || []).filter((q) => q.per_ams && this._secs?.[q.key])) {
      this._secs[p.key].remove();
      delete this._secs[p.key];
      this._kids = this._kids.filter((k) => k.isConnected);
      if (this._panel === p.key) this._openPanel(p.key);
    }
  },

  // a panel made only of per-AMS cards has nothing to show without a unit
  _railAms() {
    for (const p of this._cfg.panels || []) {
      if (p.per_ams && !p.cards?.length) this._rail.querySelector(`button[data-k="${p.key}"]`)?.style.setProperty("display", this._units.length ? "" : "none");
    }
  },

  // u.w: the unit's width (placement, framing)
  _buildAms(u) {
    if (u.model.includes("LITE")) { u.w = 397; return this._buildAmsLite(u); }
    u.w = AMS_W;
    const T3 = this.T, M = this.M;
      // AMS 2 Pro (372 x 280 x 226): a rounded dark tray (floor, front and back walls) that the spools sit in on
      // steel rollers, a smoked half-round lid, a solid D-shaped right cheek, and behind a smoked front window
      // the four feeder modules with brass drive rollers and a status LED each
      const grp = u.grp = new T3.Group(), spools = u.spools = [];
      this._scene.add(grp);
      const amsBody = u.body = new T3.MeshStandardMaterial({ color: 0x27282b, metalness: 0.3, roughness: 0.55 });
      this._shell.push(amsBody);
      if (this._opts.xray) { amsBody.transparent = true; amsBody.opacity = 0.18; amsBody.depthWrite = false; }
      const a = (domain, key) => `${domain}.${u.prefix}_${key}`, dome = u.dome = M.dome.clone();      // own lid: drying glows per unit
      const hum = a("sensor", "humidity"), aw = AMS_W, ad = AMS_D, ab = AMS_BASE, wall = 8, fd = 70;
      const xzBox = (w, h, d, r) => {                                     // rounded in the top view, extruded upwards
        const sh = new T3.Shape(), x = w / 2, z = d / 2, q = Math.min(r, x, z);
        sh.moveTo(-x + q, -z); sh.lineTo(x - q, -z); sh.quadraticCurveTo(x, -z, x, -z + q); sh.lineTo(x, z - q);
        sh.quadraticCurveTo(x, z, x - q, z); sh.lineTo(-x + q, z); sh.quadraticCurveTo(-x, z, -x, z - q); sh.lineTo(-x, -z + q);
        sh.quadraticCurveTo(-x, -z, -x + q, -z);
        return new T3.ExtrudeGeometry(sh, { depth: h, bevelEnabled: true, bevelThickness: 1.5, bevelSize: 1.5, bevelSegments: 2, curveSegments: 10 })
          .rotateX(-Math.PI / 2);
      };
      this._m(xzBox(aw, 22, ad, 18), amsBody, 0, 0, 0, grp, hum);                                   // floor
      // front: lower and upper rail with the feeder bay between them, closed at the back and on the left
      this._m(xzBox(aw, 20, fd, 14), amsBody, 0, 22, ad / 2 - fd / 2, grp, hum);
      this._m(xzBox(aw, 18, fd, 14), amsBody, 0, 102, ad / 2 - fd / 2, grp, hum);
      this._box(aw - 20, 60, 4, M.inner, 0, 72, ad / 2 - fd + 2, grp);
      this._box(16, 60, fd - 4, amsBody, -aw / 2 + 8, 72, ad / 2 - fd / 2, grp, hum);
      this._m(xzBox(aw, ab - 22, 26, 12), amsBody, 0, 22, -ad / 2 + 13, grp, hum);                   // back wall
      this._box(wall, ab - 22, ad - fd - 26, amsBody, -aw / 2 + wall / 2, 22 + (ab - 22) / 2, (26 - fd) / 2, grp, hum);
      // right cheek: base height plus the lid's half circle, solid
      const cheek = new T3.Shape();
      cheek.moveTo(-ad / 2 + 14, 0); cheek.lineTo(ad / 2 - 14, 0); cheek.lineTo(ad / 2 - 14, ab);
      cheek.absarc(0, ab, ad / 2 - 14, 0, Math.PI, false); cheek.lineTo(-ad / 2 + 14, 0);
      const cheekG = new T3.ExtrudeGeometry(cheek, { depth: 14, bevelEnabled: true, bevelThickness: 2, bevelSize: 2, bevelSegments: 3, curveSegments: 40 })
        .translate(0, 0, -7).rotateY(Math.PI / 2);
      this._m(cheekG, amsBody, aw / 2 - 7, 0, 0, grp, hum);
      // lid: smoked half cylinder from the left edge to the cheek, a thin dark seam along its front and back
      const lidR = ad / 2 - 14, lidL = aw - 16;
      const domeG = new T3.CylinderGeometry(lidR, lidR, lidL, 64, 1, true, 0, Math.PI).rotateZ(Math.PI / 2);
      this._m(domeG, dome, -8, ab, 0, grp, a("binary_sensor", "drying"));
      this._m(new T3.CylinderGeometry(lidR, lidR, 3, 64, 1, false, 0, Math.PI).rotateZ(Math.PI / 2), dome, -aw / 2 + 2, ab, 0, grp);
      for (const sz of [-1, 1]) this._box(lidL, 4, 5, M.black, -8, ab + 1, sz * (lidR - 1), grp);
      // front: smoked window over the feeders, label, status LEDs
      this._box(aw - 30, 58, 2, M.smoke, -2, 71, ad / 2 - 1, grp);
      const amsLogo = this._text(u.model, 74, 11, { color: "#c9ccd1", weight: 700 });
      amsLogo.position.set(aw / 2 - 62, ab - 8, ad / 2 + 1.6);
      grp.add(amsLogo);
      const brass = new T3.MeshStandardMaterial({ color: 0xb8893a, metalness: 0.9, roughness: 0.3 });
      for (let i = 0; i < Math.min(4, u.slots); i++) {
        const x = -133 + i * 84, ent = a("sensor", `slot_${i + 1}`), { g, fil } = this._spool(grp, ent);
        g.position.set(x, ab - 4, -8);
        // two support rollers under the spool, in the tray
        for (const sz of [-1, 1]) this._cyl(5, 66, "x", M.steel, x, ab - 4 - 80, -8 + sz * 56, grp);
        // feeder module behind the window: block, brass drive roller, PTFE outlet; LED under the window
        const fm = this._box(56, 48, 30, M.bodyDark, x, 70, ad / 2 - 28, grp, ent);
        const gear = this._cyl(9, 30, "x", brass, x, 82, ad / 2 - 11, grp, ent, 24);
        this._cyl(3.5, 10, "y", M.ptfe, x + 18, 96, ad / 2 - 20, grp);
        const lamp = this._box(20, 3, 2, new T3.MeshBasicMaterial({ color: 0x333333 }), x, 32, ad / 2 + 1.5, grp);
        spools.push({ g, fil, fm, gear, lamp });
      }

  },

  // AMS Lite (397 x 208 x 342, store spec). Shapes from the wiki unboxing guide (step 16, https://wiki.bambulab.com/en/a1/manual/unboxing-a1-combo):
  // a flat light grey peanut-shaped body tilted ~19 degrees (left end low) on a dark grey stand, one shaft through each
  // lobe with a rotary spool holder on each side (four spools, orange / green shaft ends), two smoked feeder modules with
  // orange knobs on the upper left edge, four PTFE tubes (u.feeds) from them to the hub on the toolhead. The front is
  // the unit's front (z + AMS_D / 2), like the AMS 2 Pro. Sizes of single parts are estimates from the photos.
  _buildAmsLite(u) {
    const T3 = this.T, M = this.M, grp = u.grp = new T3.Group(), spools = u.spools = [];
    this._scene.add(grp);
    const body = u.body = new T3.MeshStandardMaterial({ color: 0xe3e5e7, metalness: 0.05, roughness: 0.5 });
    const dark = new T3.MeshStandardMaterial({ color: 0x4d5054, metalness: 0.2, roughness: 0.6 });
    const smoke = new T3.MeshPhysicalMaterial({ color: 0x2a2d30, roughness: 0.25, transparent: true, opacity: 0.88 });
    const orange = new T3.MeshStandardMaterial({ color: 0xe8912d, roughness: 0.4 });
    this._shell.push(body, dark);
    if (this._opts.xray) { body.transparent = true; body.opacity = 0.18; body.depthWrite = false; }
    u.dome = new T3.MeshBasicMaterial({ transparent: true, opacity: 0 });                       // no lid: the drying glow has nothing to show on
    const D = 208, zo = (AMS_D - D) / 2, hum = `sensor.${u.prefix}_humidity`;
    const yc = 188, tilt = 0.33, R = 108, cc = 100;                                              // body centre height, tilt, lobe radius / half spacing
    // stand: foot along z on the floor, post, cradle under the body (photo: dark grey boomerang with a cut-out plate)
    this._box(34, 14, 196, dark, 12, 7, zo, grp);
    this._box(28, 104, 26, dark, 20, 66, zo, grp);
    const tg = new T3.Group();                                                                   // everything on the tilted body
    tg.position.set(0, yc, zo);
    tg.rotation.z = tilt;
    grp.add(tg);
    this._box(120, 16, 62, dark, 0, -R + 28, 0, tg);
    // body: two lobes joined by a waist, 36 mm thick
    const sh = new T3.Shape();
    sh.moveTo(-cc, R); sh.quadraticCurveTo(0, 16, cc, R);
    sh.absarc(cc, 0, R, Math.PI / 2, -Math.PI / 2, true);
    sh.quadraticCurveTo(0, -16, -cc, -R);
    sh.absarc(-cc, 0, R, -Math.PI / 2, Math.PI / 2, true);
    const bg = new T3.ExtrudeGeometry(sh, { depth: 30, bevelEnabled: true, bevelThickness: 3, bevelSize: 3, bevelSegments: 2, curveSegments: 40 }).translate(0, 0, -15);
    this._m(bg, body, 0, 0, 0, tg, hum);
    const name = this._text(u.model, 70, 10, { color: "#8d9298", weight: 700 });
    name.position.set(0, -R + 40, 19);
    tg.add(name);
    // shafts through the lobes, rotary holders (spools) at both faces
    const sz = 53;
    for (const sx of [-1, 1]) {
      this._cyl(12, 2 * (sz + 40), "z", new T3.MeshStandardMaterial({ color: 0xcfd1d4, roughness: 0.5 }), sx * cc, 0, 0, tg, null, 20);
      for (const s of [-1, 1]) this._cyl(8, 3, "z", sx < 0 ? orange : new T3.MeshStandardMaterial({ color: 0x3fbf5a, roughness: 0.4 }), sx * cc, 0, s * (sz + 40), tg, null, 16);
    }
    // two feeder modules (smoked housing, orange knobs) on the upper left edge, two outlets each
    u.feeds = [];
    const brass = new T3.MeshStandardMaterial({ color: 0xb8893a, metalness: 0.9, roughness: 0.3 });
    const n = Math.min(4, u.slots);
    for (let i = 0; i < n; i++) {
      const lobe = i < 2 ? -1 : 1, face = i % 2 ? -1 : 1, ent = `sensor.${u.prefix}_slot_${i + 1}`;
      const pv = new T3.Group();                                                                 // the spool's x axis lies along z here
      pv.rotation.y = Math.PI / 2;
      pv.position.set(lobe * cc, 0, face * sz);
      tg.add(pv);
      const { g, fil } = this._spool(pv, ent);
      const fx = -52 + (i < 2 ? 0 : 38), fz = face * 22;
      const fm = this._box(34, 50, 34, smoke, fx, R - 8 + 14, fz, tg, ent);
      const gear = this._cyl(7, 6, "x", orange, fx - 20, R - 8 + 14, fz, tg, ent, 18);
      const lamp = this._box(14, 3, 2, new T3.MeshBasicMaterial({ color: 0x333333 }), fx, R - 8 + 4, fz + 17.5, tg);
      this._cyl(5, 8, "y", brass, fx, R - 8 + 42, fz, tg, null, 14);
      const o = new T3.Object3D();
      o.position.set(fx, R - 8 + 46, fz);
      tg.add(o);
      u.feeds.push(o);
      spools.push({ g, fil, fm, gear, lamp });
    }
  },

  // One AMS: on the lid or on the table beside the printer (the dropdown). More: all on the table, A B ... from
  // left to right, the first half left of the printer, the rest right, fronts in line with the printer's front.
  _placeAms(pos) {
    const g = this._geo, top = g.amsTop;
    this._amsPos = ["top", "left", "right"].includes(pos) && (pos !== "top" || top) ? pos : top ? "top" : "right";
    this.shadowRoot.querySelector(".amssel").value = this._amsPos;
    this.shadowRoot.querySelector('.amssel option[value="top"]').disabled = !top;
    const n = this._units.length, nl = n > 1 ? Math.ceil(n / 2) : this._amsPos === "left" ? 1 : 0;
    // gaps to the printer per side (the X2D keeps more room on the right: a spool holder hangs there)
    const [gl, gr] = g.amsGap || [40, 40];
    // units side by side, 30 apart, each by its own width; the left ones outwards from the printer
    const z = g.d / 2 - AMS_D / 2;
    let xl = -g.w / 2 - gl, xr = g.w / 2 + gr;
    for (let i = nl - 1; i >= 0; i--) { const u = this._units[i]; u.grp.position.set(xl - u.w / 2, 4, z); xl -= u.w + 30; }
    this._units.forEach((u, i) => {
      if (n === 1 && this._amsPos === "top") u.grp.position.set(0, top.y, top.z);
      else if (i >= nl) { u.grp.position.set(xr + u.w / 2, 4, z); xr += u.w + 30; }
    });
    if (this._framed) this._resetView();
  },
});
