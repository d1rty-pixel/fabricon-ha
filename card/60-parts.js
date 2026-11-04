// Materials and mesh helpers the model is built from (boxes, cylinders, text, labels, fans).
Object.assign(FabriconCard.prototype, {
  _mats() {
    const T3 = this.T, S = (o) => new T3.MeshStandardMaterial(o);
    this.M = {
      body: S({ color: 0x2e3034, metalness: 0.55, roughness: 0.42 }),
      bodyDark: S({ color: 0x1b1c1e, metalness: 0.4, roughness: 0.55 }),
      inner: S({ color: 0x121214, metalness: 0.2, roughness: 0.8 }),
      black: S({ color: 0x0c0c0d, metalness: 0.3, roughness: 0.6 }),
      steel: S({ color: 0xc9ccd1, metalness: 0.95, roughness: 0.22 }),
      alu: S({ color: 0x8d9096, metalness: 0.85, roughness: 0.35 }),
      handle: S({ color: 0xdedfe2, metalness: 0.6, roughness: 0.3 }),
      plate: S({ color: 0x2a2620, metalness: 0.5, roughness: 0.65, emissive: 0x000000 }),
      plateTex: S({ color: 0x9a8656, metalness: 0.7, roughness: 0.55, emissive: 0x000000 }),
      orange: S({ color: 0xff8a1a, metalness: 0.2, roughness: 0.4, emissive: 0x401800 }),
      ptfe: new T3.MeshPhysicalMaterial({ color: 0xf4f4f4, roughness: 0.35, transmission: 0.3, transparent: true, opacity: 0.85 }),
      glass: new T3.MeshPhysicalMaterial({ color: 0x9fb4c8, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.16,
        side: T3.DoubleSide, depthWrite: false }),
      smoke: new T3.MeshPhysicalMaterial({ color: 0x050607, metalness: 0.2, roughness: 0.08, transparent: true, opacity: 0.82 }),
      // door and side windows: grey-tinted glass you can see into
      tint: new T3.MeshPhysicalMaterial({ color: 0x121418, metalness: 0.1, roughness: 0.05, transparent: true, opacity: 0.72,
        side: T3.DoubleSide, depthWrite: false }),
      dome: new T3.MeshPhysicalMaterial({ color: 0xd8e4f0, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.1,
        side: T3.DoubleSide, depthWrite: false, emissive: 0x000000 }),
      led: new T3.MeshBasicMaterial({ color: 0xfff6e8 }),
      screenBezel: S({ color: 0x0a0a0b, metalness: 0.4, roughness: 0.3 }),
    };
    this._shell = [this.M.body, this.M.bodyDark, this.M.inner];
  },

  // a mesh, optionally clickable for an entity
  // a rounded rectangle in the XY plane, d deep along Z, centred; hole: [w, h, r] cuts a centred opening (a rim)
  _slabXY(w, h, r, d, hole) {
    const T3 = this.T, rr = (sh, w, h, r) => {
      const x = w / 2, y = h / 2, q = Math.min(r, x, y);
      sh.moveTo(-x + q, -y); sh.lineTo(x - q, -y); sh.quadraticCurveTo(x, -y, x, -y + q); sh.lineTo(x, y - q);
      sh.quadraticCurveTo(x, y, x - q, y); sh.lineTo(-x + q, y); sh.quadraticCurveTo(-x, y, -x, y - q); sh.lineTo(-x, -y + q);
      sh.quadraticCurveTo(-x, -y, -x + q, -y);
      return sh;
    };
    const sh = rr(new T3.Shape(), w, h, r);
    if (hole) sh.holes.push(rr(new T3.Path(), ...hole));
    return new T3.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false, curveSegments: 8 }).translate(0, 0, -d / 2);
  },

  // perforated sheet: dark holes on the panel colour, a 4 mm hex pitch
  _perfMat() {
    if (this._perf) return this._perf;
    const T3 = this.T, c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    g.fillStyle = "#2e3034"; g.fillRect(0, 0, 64, 64);
    g.fillStyle = "#050506";
    for (const [x, y] of [[16, 16], [48, 16], [0, 48], [32, 48], [64, 48]]) { g.beginPath(); g.arc(x, y, 10, 0, Math.PI * 2); g.fill(); }
    const tex = new T3.CanvasTexture(c);
    tex.wrapS = tex.wrapT = T3.RepeatWrapping;
    tex.colorSpace = T3.SRGBColorSpace;
    return this._perf = new T3.MeshStandardMaterial({ map: tex, metalness: 0.5, roughness: 0.5 });
  },

  _m(geo, mat, x, y, z, parent, entity) {
    const m = new this.T.Mesh(geo, mat);
    m.position.set(x, y, z);
    (parent || this._scene).add(m);
    if (entity) { m.userData.entity = entity; this._clickable.push(m); }
    return m;
  },

  _box(w, h, d, mat, x, y, z, parent, entity) {
    return this._m(new this.T.BoxGeometry(w, h, d), mat, x, y, z, parent, entity);
  },

  _cyl(r, len, axis, mat, x, y, z, parent, entity, seg = 32, r2) {
    const g = new this.T.CylinderGeometry(r, r2 ?? r, len, seg);
    if (axis === "x") g.rotateZ(Math.PI / 2);
    if (axis === "z") g.rotateX(Math.PI / 2);
    return this._m(g, mat, x, y, z, parent, entity);
  },

  _text(txt, w, h, opts = {}) {
    const T3 = this.T, c = document.createElement("canvas");
    c.width = opts.px || 512; c.height = Math.round(c.width * h / w);
    const g = c.getContext("2d");
    const lines = txt.split("\n"), lh = c.height / lines.length, sx = opts.stretch || 1;
    g.fillStyle = opts.color || "#c9ccd1";
    const font = (px) => `${opts.weight || 600} ${px}px ${opts.font || "Arial, sans-serif"}`;
    let px = Math.round(lh * 0.62);
    if (opts.fit) {                                                   // the widest line spans the plate
      g.font = font(100);
      px = Math.min(Math.round(lh * 0.95), Math.floor(100 * (c.width - 8) / sx / Math.max(...lines.map((l) => g.measureText(l).width))));
    }
    g.font = font(px);
    g.textAlign = opts.align || "center"; g.textBaseline = "middle";
    g.scale(sx, 1);                                                   // sx > 1: extended lettering
    lines.forEach((l, i) => g.fillText(l, (opts.align === "left" ? 4 : c.width / 2) / sx, lh * (i + 0.5)));
    const tex = new T3.CanvasTexture(c);
    tex.colorSpace = T3.SRGBColorSpace;
    return new T3.Mesh(new T3.PlaneGeometry(w, h), new T3.MeshBasicMaterial({ map: tex, transparent: true }));
  },

  // A label at one anchor. Alone it is a title over a value; given a group title it lists rows (one per part, each
  // with its own colour dot and entity) so parts sitting close together share one box instead of crowding.
  // rows: [key, entity, optional click action instead of the entity's more-info]. Returns {key: row}; a row is
  // filled in _apply (title, val, colour, hot).
  _label(anchor, off, rows, group) {
    const el = document.createElement("div");
    el.className = "lab";
    el.innerHTML = `<div class="stem"></div><div class="dot"></div><div class="box">${group ? `<i>${group}</i>` : ""}</div>`;
    const box = el.querySelector(".box"), out = {}, l = { anchor, off, el, rows: [] };
    for (const [key, entity, act] of rows) {
      const r = group ? document.createElement("div") : box;
      if (group) { r.className = "row"; box.append(r); r.addEventListener("click", (e) => { e.stopPropagation(); act ? act() : this._more(entity); }); }
      r.insertAdjacentHTML("beforeend", "<b></b><span></span>");
      const row = { key, entity, el: group ? r : el, title: r.querySelector("b"), val: r.querySelector("span"), lab: l };
      l.rows.push(row);
      out[key] = row;
    }
    if (!group) el.addEventListener("click", (e) => { e.stopPropagation(); rows[0][2] ? rows[0][2]() : this._more(rows[0][1]); });
    this._labelsEl.appendChild(el);
    this._labels.push(l);
    return out;
  },

  // Fans, built facing +Z and turned to `face` (x+ / x- / z+ / z-), so the guard is on the outside.
  //   axial: square frame with rounded corners and screw holes, struts to the motor, hub with label,
  //          seven swept and pitched blades, finger guard
  //   blower: radial fan (part cooling): scroll housing with intake ring and an outlet pointing down,
  //          impeller with many short blades seen through the intake
  _fan(r, face, x, y, z, entity, parent, kind = "axial") {
    const T3 = this.T, grp = new T3.Group(), rotor = new T3.Group(), hit = [];
    grp.position.set(x, y, z);
    grp.rotation.y = { "z+": 0, "z-": Math.PI, "x+": Math.PI / 2, "x-": -Math.PI / 2 }[face] ?? 0;
    (parent || this._scene).add(grp);
    grp.add(rotor);
    const plastic = this._fanFrame ||= new T3.MeshStandardMaterial({ color: 0x1d1e20, metalness: 0.1, roughness: 0.62 });
    const bladeMat = this._fanBlade ||= new T3.MeshStandardMaterial({ color: 0x2c2d31, metalness: 0.05, roughness: 0.42, side: T3.DoubleSide });
    const label = this._fanLabel ||= new T3.MeshStandardMaterial({ color: 0x6d7076, metalness: 0.6, roughness: 0.35 });
    const guard = this._fanGuard ||= new T3.MeshStandardMaterial({ color: 0x141516, metalness: 0.7, roughness: 0.4 });
    const mesh = (g, m, parentObj = grp) => { const o = new T3.Mesh(g, m); parentObj.add(o); return o; };

    if (kind === "blower") {
      const d = r * 0.18;
      hit.push(mesh(new T3.CylinderGeometry(r, r, 0.8, 64).rotateX(Math.PI / 2).translate(0, 0, -d), this.M.black));   // recess floor
      hit.push(mesh(new T3.TorusGeometry(r, r * 0.035, 8, 72), plastic));                                                // rim
      for (let k = 0; k < 64; k++) {
        const a = k / 64 * Math.PI * 2;
        const b = mesh(new T3.BoxGeometry(r * 0.3, 0.55, d * 1.6), this.M.black, rotor);
        b.position.set(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82, -d * 0.2);
        b.rotation.z = a + 0.25;
      }
      const capMat = this._fanCap ||= new T3.MeshStandardMaterial({ color: 0x141416, metalness: 0.05, roughness: 0.85 });
      hit.push(mesh(new T3.CylinderGeometry(r * 0.66, r * 0.68, d * 1.4, 64).rotateX(Math.PI / 2).translate(0, 0, d * 0.1), capMat));
      mesh(new T3.TorusGeometry(r * 0.62, r * 0.012 + 0.2, 6, 64).translate(0, 0, d * 0.82), this.M.black);
      for (const [dx, dy] of [[-0.28, 0.3], [0.02, -0.05]]) mesh(new T3.CylinderGeometry(r * 0.025, r * 0.025, 0.4, 10).rotateX(Math.PI / 2).translate(r * dx, r * dy, d * 0.82), this.M.black);
    } else {
      const s = r * 1.08, c = r * 0.2, d = r * 0.3;
      const frame = new T3.Shape();
      frame.moveTo(-s + c, -s);
      frame.lineTo(s - c, -s); frame.quadraticCurveTo(s, -s, s, -s + c);
      frame.lineTo(s, s - c); frame.quadraticCurveTo(s, s, s - c, s);
      frame.lineTo(-s + c, s); frame.quadraticCurveTo(-s, s, -s, s - c);
      frame.lineTo(-s, -s + c); frame.quadraticCurveTo(-s, -s, -s + c, -s);
      const hole = new T3.Path();
      hole.absarc(0, 0, r * 0.97, 0, Math.PI * 2, true);
      frame.holes.push(hole);
      for (const [hx, hy] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
        const sh = new T3.Path();
        sh.absarc(hx * s * 0.84, hy * s * 0.84, r * 0.055, 0, Math.PI * 2, true);
        frame.holes.push(sh);
      }
      const fg = new T3.ExtrudeGeometry(frame, { depth: d, bevelEnabled: true, bevelThickness: 0.8, bevelSize: 0.8, bevelSegments: 2, curveSegments: 48 });
      fg.translate(0, 0, -d / 2);
      hit.push(mesh(fg, plastic));
      // motor housing and its struts on the inner side
      hit.push(mesh(new T3.CylinderGeometry(r * 0.3, r * 0.3, d * 0.5, 32).rotateX(Math.PI / 2).translate(0, 0, -d * 0.25), plastic));
      for (let k = 0; k < 4; k++) {
        const st = mesh(new T3.BoxGeometry(r * 0.72, r * 0.06, d * 0.22), plastic);
        const a = Math.PI / 4 + k * Math.PI / 2;
        st.position.set(Math.cos(a) * r * 0.64, Math.sin(a) * r * 0.64, -d * 0.4);
        st.rotation.z = a;
      }
      // rotor: hub with a label disc, seven blades
      const hubR = r * 0.3;
      hit.push(mesh(new T3.CylinderGeometry(hubR, hubR * 1.02, d * 0.55, 36).rotateX(Math.PI / 2).translate(0, 0, d * 0.05), bladeMat, rotor));
      mesh(new T3.CylinderGeometry(hubR * 0.72, hubR * 0.72, 0.6, 36).rotateX(Math.PI / 2).translate(0, 0, d * 0.33), label, rotor);
      // blade: a thin cambered surface, swept forward like a scimitar, twisted from steep at the hub to flat at
      // the tip, the chord widening outwards and rounded off at the tip
      const rt = r * 0.94, NU = 14, NV = 9, pos = [], idx = [];
      for (let i = 0; i <= NU; i++) {
        const u = i / NU, rho = hubR * 0.95 + (rt - hubR * 0.95) * u;
        const tipCut = u > 0.8 ? Math.sqrt(Math.max(0.04, 1 - ((u - 0.8) / 0.2) ** 2)) : 1;
        const chord = r * (0.42 + 0.34 * u) * tipCut, pitch = 0.85 - 0.45 * u;
        const span = chord * Math.cos(pitch) / rho, centre = 0.55 * u * u;
        for (let j = 0; j <= NV; j++) {
          const v = j / NV - 0.5, th = centre + v * span;
          pos.push(rho * Math.cos(th), rho * Math.sin(th), -v * chord * Math.sin(pitch) + (0.25 - v * v) * chord * 0.12);
        }
      }
      for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
        const q = i * (NV + 1) + j;
        idx.push(q, q + NV + 1, q + 1, q + 1, q + NV + 1, q + NV + 2);
      }
      const bg = new T3.BufferGeometry();
      bg.setAttribute("position", new T3.Float32BufferAttribute(pos, 3));
      bg.setIndex(idx);
      bg.computeVertexNormals();
      for (let k = 0; k < 7; k++) mesh(bg, bladeMat, rotor).rotation.z = k / 7 * Math.PI * 2;
      // finger guard on the outer side: rings and spokes
      for (const f of [0.32, 0.55, 0.78, 0.98]) mesh(new T3.TorusGeometry(r * f, r * 0.018 + 0.35, 6, 56).translate(0, 0, d / 2 + 1.2), guard);
      for (let k = 0; k < 4; k++) {
        const sp = mesh(new T3.BoxGeometry(r * 1.96, r * 0.035 + 0.6, r * 0.035 + 0.6), guard);
        sp.position.z = d / 2 + 1.2;
        sp.rotation.z = k * Math.PI / 4;
      }
    }
    for (const o of hit) { o.userData.entity = entity; this._clickable.push(o); }
    return { grp, rotor, speed: 0 };
  },
});
