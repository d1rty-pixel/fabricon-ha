// The A1 / A1 mini themselves (_build), shapes from the wiki photos (see 00-constants.js): light grey base with dark
// skirt and the screen on a small tilted stand at the front right, black textured plate on a silver carriage, A1: two
// silver uprights with dark grey caps and a top beam, mini: one column on the right with the arm cantilevered to the
// left; X beam with the dotted steel rail, motor block (camera) at the right end, purge wiper hanging at the left end;
// toolhead with the round fan face; black USB-C cable (see 30-tubes.js); white spool holder at the back.
Object.assign(MODEL, {
  _build() {
    const T3 = this.T, M = this.M, c = this._cfg1(), sp = this._spec(), comp = (ref) => this._compEntity(ref);
    const { tip: T, bed: B } = c, BZ = c.bedZ || B, bh = c.base.h, hw = c.base.hw, z0 = c.base.z0, z1 = c.base.z1, bd = z1 - z0, bz = (z0 + z1) / 2;
    const CZ = BEAM_Z - 6;                                  // column centre z
    const mini = c.cols.length === 1;
    this._clear = [];
    const S = (o) => new T3.MeshStandardMaterial(o);
    const AL = S({ color: COL_AL, metalness: 0.55, roughness: 0.42 });
    const PL = S({ color: COL_PLASTIC, metalness: 0.1, roughness: 0.55 });
    const DG = S({ color: COL_DARK, metalness: 0.2, roughness: 0.6 });
    const WHITE = S({ color: 0xeceded, metalness: 0.05, roughness: 0.5 });
    const PEI = S({ color: 0x2c2c2e, metalness: 0.4, roughness: 0.7, emissive: 0x000000 });
    this._shell.push(AL, PL, DG, WHITE);
    this._pl = PL;
    const xz = (w, d, h, r) => {                            // rounded in the top view, extruded upwards
      const sh = new T3.Shape(), x = w / 2, z = d / 2, q = Math.min(r, x, z);
      sh.moveTo(-x + q, -z); sh.lineTo(x - q, -z); sh.quadraticCurveTo(x, -z, x, -z + q); sh.lineTo(x, z - q);
      sh.quadraticCurveTo(x, z, x - q, z); sh.lineTo(-x + q, z); sh.quadraticCurveTo(-x, z, -x, z - q); sh.lineTo(-x, -z + q);
      sh.quadraticCurveTo(-x, -z, -x + q, -z);
      return new T3.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 8 }).rotateX(-Math.PI / 2);
    };

    // base: light grey plastic housing with a dark skirt; the Y rail cover runs along the top
    this._m(xz(2 * hw, bd, 8, 22), DG, 0, 0, bz);                                            // dark skirt (photo: dark lower edge)
    this._m(xz(2 * hw - 6, bd - 6, bh - 8, 22), PL, 0, 8, bz);
    for (const [x, z] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) this._cyl(10, 3, "y", M.black, x * (hw - 28), 1.5, z ? z1 - 30 : z0 + 30, null, null, 20);
    this._box(64, 6, bd - 24, PL, 0, bh + 3, bz);                                           // Y rail cover
    const logo = this._text("BAMBU LAB", 74, 8, { color: "#8d9298", weight: 700, stretch: 1.25 });
    logo.position.set(-hw + 70, bh - 14, z1 + 0.6);
    this._scene.add(logo);
    this._box(26, 3, 1, M.black, c.scr[0] - 56, bh - 14, z1 + 0.5);                         // microSD slot beside the screen
    this._box(34, 22, 3, M.black, 0, 28, z0 - 0.5);                                         // power inlet and switch at the back
    if (!mini) this._box(46, bh + 6, 36, DG, hw - 34, 0, z0 + 24);                           // cable box at the right rear (the USB-C cable ends there)
    // touchscreen on a wedge at the front edge, tilted back (3.5" 320 x 240 on the A1, 2.4" on the mini)
    {
      const wz = 40, rise = mini ? 12 : 24, hs = c.scr[1];
      const sh = new T3.Shape();                           // profile (x_s = -z): flat bottom, top rising towards the back
      sh.moveTo(-wz / 2, 0); sh.lineTo(wz / 2, 0); sh.lineTo(wz / 2, 6); sh.lineTo(-wz / 2, 6 + rise); sh.lineTo(-wz / 2, 0);
      const wg = new T3.ExtrudeGeometry(sh, { depth: 100 * hs, bevelEnabled: false }).translate(0, 0, -50 * hs).rotateY(Math.PI / 2);
      const w = this._m(wg, PL, c.scr[0], bh - 2, z1 - wz / 2 - 4);
      const al = Math.PI / 2 - Math.atan2(rise, wz), sc = new T3.Group();
      sc.position.set(0, 6 + rise / 2 + 0.5, 0);
      sc.rotation.x = -al;
      w.add(sc);
      this._box(88 * hs, 60 * hs, 3, PL, 0, 0, 0, sc, sp.core?.status);                    // light grey bezel
      this._box(82 * hs, 54 * hs, 3.4, M.screenBezel, 0, 0, 0, sc, sp.core?.status);       // black glass
      this._screenCanvas = document.createElement("canvas");
      this._screenCanvas.width = 512; this._screenCanvas.height = 300;
      this._screenTex = new T3.CanvasTexture(this._screenCanvas);
      this._screenTex.colorSpace = T3.SRGBColorSpace;
      const sm = new T3.Mesh(new T3.PlaneGeometry(76 * hs, 44.5 * hs), new T3.MeshBasicMaterial({ map: this._screenTex, toneMapped: false }));
      sm.position.z = 2;
      sc.add(sm);
    }

    // bed (A1: 256 x 256 black textured PEI plate on a silver carriage riding the Y rail); the core slides it in z.
    // Plate top is local y 0; carriage and slider fill the 16 mm down to the rail cover.
    this._bed = new T3.Group();
    this._bed.position.y = T;
    this._scene.add(this._bed);
    this._bedPlate = this._box(B + 2, 3, BZ + 2, PEI, 0, -1.5, 0, this._bed, comp("heater:bed"));
    this._heat.bed = { mat: PEI, lo: 30, hi: 120 };
    this._box(B - 4, 4, BZ - 4, M.plate, 0, -5, 0, this._bed);                                // heater
    this._m(xz(B + 14, BZ + 10, 5, 8), AL, 0, -12, 0, this._bed);                             // carriage plate
    this._box(60, 4, BZ * 0.55, DG, 0, -14, 0, this._bed);                                    // slider block on the rails
    this._box(40, 14, 3, AL, 0, -7, BZ / 2 + 8, this._bed);                                   // front lip of the carriage

    // Z uprights: silver extrusions with a dark grey foot cap and a steel lead screw beside them (A1: top beam with
    // dark grey end caps; mini: one column with a black rail strip on the front and a dark cap on top)
    const top = c.colTop, ch = top - bh, cw = c.colW, cd = c.colD;
    for (const x of c.cols) {
      this._m(xz(cw, cd, ch, mini ? 14 : 4), AL, x, bh, CZ);
      this._box(cw + 2, 26, cd + 2, DG, x, bh, CZ);                                          // foot cap
      if (mini) {
        this._box(10, ch - 30, 2, M.black, x, bh + ch / 2 + 6, CZ + cd / 2 + 0.5);          // Z rail strip on the front (photo: black with screws)
        this._m(xz(cw + 2, cd + 2, 14, 14), DG, x, top - 14, CZ);
      } else this._cyl(3, ch - 30, "y", M.steel, x + (x < 0 ? 1 : -1) * (cw / 2 + 5), bh + ch / 2, CZ + 6, null, null, 12);   // lead screw
    }
    if (c.top) {
      const tw = c.cols[1] - c.cols[0] + cw;
      this._m(xz(tw, cd, top - c.top, 4), AL, 0, c.top, CZ);
      for (const s of [-1, 1]) this._m(xz(cw + 4, cd + 2, top - c.top + 1, 4), DG, s * (c.cols[1]), c.top, CZ);   // end caps
    }

    // gantry: the X beam (silver extrusion with a row of steel balls on the front) and a carriage block on each
    // upright, lifted by _lift together with the head, camera and light
    const g = this._gantry = new T3.Group();
    this._scene.add(g);
    const [bx0, bx1] = c.beam, by = T + BEAM_Y, cx = c.cols[c.cols.length - 1];
    this._box(bx1 - bx0, 26, 22, AL, (bx0 + bx1) / 2, by, BEAM_Z, g);
    this._box(bx1 - bx0 - 14, 7, 2, M.black, (bx0 + bx1) / 2, by + 2, BEAM_Z + 11.5, g);
    const ballG = new T3.SphereGeometry(2.3, 8, 6);
    for (let x = bx0 + 16; x < bx1 - 40; x += 20) this._m(ballG, M.steel, x, by + 2, BEAM_Z + 12.5, g);
    // right end: the X motor block (white, "Bambu Lab A1") with its handle on top; mini: beside the column
    const mx = mini ? cx + 28 : cx + 24;
    this._m(this._slabXY(mini ? 42 : 52, 52, 8, 44), WHITE, mx, by, mini ? CZ + 6 : CZ, g);
    this._box(26, 8, 10, WHITE, mx, by + 30, mini ? CZ + 6 : CZ, g);                         // cutter pin handle (photo: white bar on top)
    const lt = this._text(c.label || "BAMBU LAB A1", 36, 6, { color: "#6e7278", weight: 700 });
    lt.position.set(mx, by - 6, (mini ? CZ + 6 : CZ) + 22.6);
    g.add(lt);
    if (!mini) for (const x of [c.cols[0]]) this._box(cw + 10, 46, cd + 12, PL, x, by, CZ, g);   // left carriage block
    // purge wiper on a bracket hanging from the LEFT end of the arm (wiki: slides into the slot at the X axis end)
    {
      const wx = bx0 - 14;
      this._box(10, 34, 14, DG, wx, by - 18, BEAM_Z + 4, g);                                  // vertical bracket
      this._box(36, 8, 18, M.black, wx + 14, T + 8, BEAM_Z + 14, g);                           // wiper block at nozzle height
      this._box(30, 4, 4, DG, wx + 14, T + 13, BEAM_Z + 24, g);                                // silicone lip
    }
    // live view camera: small white pill with the lens and LED on the front (A1: right motor block; mini: on the column below the arm)
    {
      const x = mini ? cx : mx, y = mini ? by - 44 : by - 22, z = (mini ? CZ + cd / 2 : CZ + 22) + 8;
      this._m(this._slabXY(30, 20, 9, 12), WHITE, x, y, z, g);
      this._cyl(5, 4, "z", new T3.MeshPhysicalMaterial({ color: 0x0a1018, metalness: 0.4, roughness: 0.05 }), x - 5, y, z + 6.5, g, null, 20);
      this._clear.push(this._box(8, 6, 1.4, M.smoke, x + 8, y, z + 6.5, g));
      const bar = this._box(8, 2.4, 2, M.led, x + 8, y - 6, z + 6, g);
      const lamp = new T3.PointLight(0xfff1dc, 0, 800, 1.6);
      lamp.position.set(x, y - 10, z + 20);
      g.add(lamp);
      this._lights.main = { lamp, bar, power: 1.1 };
      this._camAnchor = [x, y + 20, z];
    }

    // toolhead: light grey front with the round hotend fan (black, pale ring), silver filament inlet / hub base on top,
    // dark motor box at the back right, radial part fan on the left, cutter lever on the right, black hotend below
    const hd = this._head = new T3.Group();
    g.add(hd);
    this._m(this._slabXY(54, 52, 8, 46), PL, 0, T + 56, 0, hd, sp.core?.stage);
    this._box(56, 40, 30, DG, 0, by, BEAM_Z, hd);                                           // sleeve around the beam
    this._box(30, 38, 30, DG, 14, T + 62, -34, hd);                                          // extruder motor behind
    this._cyl(15, 1.5, "z", S({ color: 0xd8c76a, emissive: 0x3a3414, roughness: 0.5 }), 0, T + 60, 23.4, hd, null, 28);   // pale ring
    const tl = this._text("Bambu Lab", 36, 6, { color: "#8d9298", weight: 700 });
    tl.position.set(0, T + 38, 23.4);
    hd.add(tl);
    if (this._comp("fan:part")) {
      this._fans.part = this._fan(17, "x-", -27.6, T + 54, -2, comp("fan:part"), hd, "blower");
      this._box(18, 26, 20, DG, -18, T + 28, 8, hd, comp("fan:part"));                      // duct to the nozzle
    }
    if (this._comp("fan:hotend")) this._fans.hotend = this._fan(11, "z+", 0, T + 60, 23.8, comp("fan:hotend"), hd);
    else this._cyl(12, 1, "z", M.black, 0, T + 60, 24, hd, null, 24);
    this._cyl(2.2, 7, "x", M.steel, 29, T + 42, 10, hd, null, 12);                           // cutter lever hinge
    this._box(3, 24, 9, M.handle, 29.5, T + 30, 10, hd);                                     // cutter lever
    this._box(5, 7, 12, M.steel, 28, T + 17, 14, hd);                                        // cutter blade
    this._cyl(7, 30, "y", M.steel, -12, T + HEAD_H + 15, -10, hd, null, 20);                 // inlet / hub base (photo: silver cylinder)
    this._hub = this._cyl(9, 46, "y", WHITE, -12, T + HEAD_H + 38, -10, hd, null, 20);       // AMS Lite filament hub (wiki: on the toolhead)
    this._hub.visible = false;
    this._inlet = new T3.Object3D();
    this._inlet.position.set(-12, T + HEAD_H + 32, -10);
    hd.add(this._inlet);
    this._cableAnchor = new T3.Object3D();                                                   // where the USB-C cable leaves the head
    this._cableAnchor.position.set(18, T + HEAD_H + 8, -34);
    hd.add(this._cableAnchor);
    const nz = new T3.Group(), ent = comp("heater:nozzle");
    hd.add(nz);
    for (let f = 0; f < 4; f++) this._box(24, 1.3, 22, M.alu, 0, T + 26 + f * 3.4, -4, nz, ent);   // heatsink fins
    this._m(this._slabXY(22, 16, 4, 24), S({ color: 0x2b2b2d, roughness: 0.92 }), 0, T + 14, -2, nz, ent);   // sock
    this._cyl(7, 7, "y", M.steel, 0, T + 7.5, -2, nz, ent, 6);                               // nozzle hex body
    this._box(4, 3, 14, M.handle, 11, T + 11, 6, nz, ent);                                   // quick-swap latch
    const tipM = new T3.MeshStandardMaterial({ color: 0xb08d57, metalness: 0.9, roughness: 0.3, emissive: 0x000000 });
    const ntip = this._cyl(1.1, 5, "y", tipM, 0, T + 2.5, -2, nz, ent, 16, 4.5);
    this._nozzles.main = { g: nz, tip: ntip };
    this._heat.nozzle = { mat: tipM, lo: 60, hi: 300 };

    // A2L cutting / pen module (wiki a2l-intro photos, "Cutting Module"): charcoal box with a lever on the left that takes
    // the toolhead's place from the rail down to the blade; size estimated from the rail screw pitch. Hides the hotend.
    if (this._fitted("cutter")) {
      const CH = S({ color: 0x4a4c50, metalness: 0.15, roughness: 0.6 }), cm = this._cutter = new T3.Group();
      hd.add(cm);
      this._box(58, 100, 46, CH, 0, T + 70, 14, cm);                                         // body, covers the front of the head
      this._box(14, 34, 24, CH, 0, T + 18, 22, cm);                                          // blade holder nose
      this._cyl(2.2, 12, "y", M.steel, 0, T + 4, 22, cm, null, 10);                          // blade, tip at the nozzle line
      this._box(5, 40, 8, M.black, -33, T + 62, 24, cm);                                     // quick-release lever (left)
      const ct = this._text("Bambu Lab", 36, 6, { color: "#c9ccd0", weight: 700 });
      ct.position.set(0, T + 100, 37.4);
      cm.add(ct);
      nz.visible = false;
    }

    // external spool holder (wiki: white "F" part; the square clip with the logo hooks onto the top beam at the back,
    // the arm runs to the back, the spool shaft sticks out sideways, a PTFE connector at the end of the arm). A1:
    // middle right of the beam; mini: on the column.
    {
      const ex = (sp.filament?.external || []).find((x) => x.id === "main")?.entity;
      const grp = new T3.Group();
      let ty = top, dir = -1;
      if (c.holder === "beam") {
        // A2L: grey two-part arm clipped onto the back of the X crossbeam at the left end (spool holder replacement guide:
        // "remove the Spool Holder from the crossbeam"); post up, forearm tilted back, shaft sideways. Rides with the gantry.
        const hx = bx0 + 70, pz = BEAM_Z - 22, ph = 110, th = 0.3, L = 90;
        this._box(40, 38, 14, PL, hx, by, BEAM_Z - 17, g);                                     // clip on the beam (est. size)
        this._box(14, ph, 14, PL, hx, by + ph / 2, pz, g);                                     // post
        this._cyl(8, 16, "x", PL, hx, by + ph, pz, g, null, 16);                              // joint
        grp.position.set(hx, by + ph + L * Math.sin(th), pz - L * Math.cos(th));
        g.add(grp);
        const fa = new T3.Group();
        fa.position.set(hx - grp.position.x, -L * Math.sin(th), pz - grp.position.z);        // forearm, hinge at the post top
        fa.rotation.x = th;
        this._box(12, 12, L + 14, PL, 0, 0, -L / 2, fa);
        grp.add(fa);
        ty = by + ph;
      } else {
        const hx = mini ? cx : 115, ry = ty - 6, rz = -175;
        grp.position.set(hx, ry, rz);
        this._scene.add(grp);
        this._box(30, 32, 28, WHITE, hx, ty - 4, CZ - cd / 2 - 8);                             // clip with the logo
        this._box(16, 12, CZ - cd / 2 - 8 - rz + 55, WHITE, 0, 0, (CZ - cd / 2 - 8 - rz - 55) / 2, grp, ex);   // arm (past the shaft: the connector stub)
      }
      const stub = c.holder === "beam" ? -8 : -48;
      this._cyl(7, 78, "x", WHITE, dir * 39, 0, 0, grp, ex, 24);                             // shaft
      this._cyl(11, 4, "x", WHITE, dir * 80, 0, 0, grp, ex, 24);                             // end flange
      this._cyl(4, 12, "y", M.black, 0, 10, stub, grp, null, 14);                             // PTFE connector at the stub
      this._ptfeSrc = new T3.Object3D();
      this._ptfeSrc.position.set(0, 18, stub);
      grp.add(this._ptfeSrc);
      const spool = this._spool(grp, ex);
      spool.g.position.x = dir * 40;
      this._holders.main = { grp, spool, ent: ex };
      this._holderTop = ty;
    }

    this._tubes = [];
    this._tubeMat = M.ptfe;
    this._cableMat = S({ color: 0x0e0e10, roughness: 0.55 });
    this._shell.push(M.body);
    const nozzles = ["heater:nozzle", "fan:part", "fan:hotend"];
    this._labelSpec = [
      { anchor: this._head, off: [0, T + HEAD_H + 22, 0], title: "TOOLHEAD", rows: nozzles },
      { anchor: this._bedPlate, off: [B / 2 - 10, 4, BZ / 2 - 10], rows: ["heater:bed"] },
      { anchor: this._gantry, off: this._camAnchor, title: "CAMERA", rows: ["light:main"] },
      { anchor: this._holders.main.spool.g, off: [0, 110, 0], rows: ["external:main"] },
    ];
  },
});
