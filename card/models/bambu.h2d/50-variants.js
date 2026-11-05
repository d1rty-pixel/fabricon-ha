// Variants and accessories: H2C hotend rack (profile bambu.h2c), laser module + beam, Laser Edition parts.
// Sources: docs/printers/bambu-h2d.md sections 10 / 12, docs/printers/bambu-laser.md section 2. No close-up photos were read:
// every position below is an estimate (see the docs).
const LZ = 6;                                   // laser lens, z in the head group (module centre; the cover's front edge is at +32)
const L_BOT = TIP + 14, L_TOP = TIP + 96;       // module: air nozzle tip near the bed (probe + concentrator), top of the fan cover
Object.assign(MODEL, {
  // laser-safe PC: green, see-through like the tinted glass
  _greenGlass() {
    return this._greenMat ||= new this.T.MeshPhysicalMaterial({ color: 0x1f8a3a, metalness: 0.05, roughness: 0.08, transparent: true, opacity: 0.5, side: this.T.DoubleSide });
  },

  _h2dVariant() {
    if (this._v.h2c) this._h2cRack();
    if (this._v.ed) this._h2dEdition();
    if (this._v.laser) this._h2dLaserBed();
  },

  // H2C: the rack of induction hotends on the right wall (wiki h2c-intro / induction-hotend-rack-workflow: two vertical
  // rows of docks, 6 docks, 5 spare hotends, servo + belt lift, motor with cable chains at the bottom, an LED per dock).
  // Placement x 196..234, z 0..120, y 290..470 is an estimate (top kept under the Y rod at y 500).
  _h2cRack() {
    const T3 = this.T, M = this.M, X0 = HW - T - 2, RX = X0 - 19;                    // frame between the lining and x 196
    const frame = this._rackMat ||= new T3.MeshStandardMaterial({ color: 0x1b1c1f, metalness: 0.3, roughness: 0.6 });
    const cu = this._copper ||= new T3.MeshStandardMaterial({ color: 0xb8662e, metalness: 0.85, roughness: 0.35 });
    const gold = new T3.MeshStandardMaterial({ color: 0xb08d57, metalness: 0.9, roughness: 0.3 });
    const led = new T3.MeshBasicMaterial({ color: 0x35d06b });
    this._shell.push(frame);
    this._box(38, 190, 124, frame, RX, 385, 60);                                      // back plate / frame
    for (const z of [0, 120]) this._cyl(3, 180, "y", M.steel, RX - 17, 385, z + 0, null, null, 12);   // guide rods
    this._box(34, 24, 124, M.bodyDark, RX, 281, 60);                                  // motor box with the cable chains
    this._box(10, 18, 100, M.black, RX - 18, 281, 60);
    this._cyl(10, 26, "z", M.alu, RX, 281, 60, null, null, 16);                       // servo / belt motor
    let n = 0;
    for (const z of [30, 90]) for (const y of [330, 385, 440]) {                       // docks 1-6 (odd / even rows)
      this._box(30, 3, 40, M.bodyDark, RX - 4, y - 25, z);                            // dock shelf
      this._box(3, 4, 4, led, RX - 19.5, y - 22, z + 17);                              // status LED
      if (n++ === 0) continue;                                                        // the 6th hotend sits in the toolhead
      this._box(16, 24, 16, M.black, RX - 4, y - 10, z);                              // spare Vortek hotend
      for (let k = 0; k < 3; k++) this._cyl(9.5, 2.4, "y", cu, RX - 4, y - 14 + k * 4, z, null, null, 16);
      this._box(14, 5, 14, M.alu, RX - 4, y + 4, z);
      this._cyl(1.1, 5, "y", gold, RX - 4, y - 25 + 4, z, null, null, 12);
    }
  },

  // Laser Edition (bambu-laser.md section 2 / 8): E-stop on the right side, safety key and smoke-pipe adapter at the
  // rear, BirdsEye camera in the top frame next to the right LED. Green glass and the black plate are in _h2dShell.
  _h2dEdition() {
    const T3 = this.T, M = this.M, RZ = -HD;
    const red = this._redMat ||= new T3.MeshStandardMaterial({ color: 0xd01818, roughness: 0.35 });
    const yel = this._yelMat ||= new T3.MeshStandardMaterial({ color: 0xf2c200, roughness: 0.5 });
    // emergency stop: mushroom button on a yellow plate, right side below the window (h2s-faq: "mounted on the right side")
    this._box(5, 54, 54, yel, HW + 2.5, 200, 140);
    this._cyl(20, 16, "x", red, HW + 13, 200, 140, null, null, 28);
    this._cyl(14, 6, "x", red, HW + 8, 200, 140, null, null, 20);
    // warning label beside the door handle
    this._box(14, 14, 0.6, yel, W / 2 - PIL - 36, 215, HD + 0.6);
    // safety key (USB-like) in its rear socket
    this._box(24, 14, 2, M.black, 20, 110, RZ - 1);
    this._box(12, 6, 24, yel, 20, 110, RZ - 13);
    // smoke-pipe adapter: 100 mm port with a stub of the pipe (outer diameter 100, wiki; place unverified)
    const pipe = this._pipeMat ||= new T3.MeshStandardMaterial({ color: 0x2a2b2e, roughness: 0.7 });
    this._cyl(56, 8, "z", M.black, -25, 470, RZ - 4, null, null, 36);
    this._cyl(50, 90, "z", pipe, -25, 470, RZ - 50, null, null, 36);
    for (let k = 0; k < 5; k++) this._cyl(52, 3, "z", M.black, -25, 470, RZ - 20 - k * 16, null, null, 36);
    // BirdsEye camera under a cover in the top frame, beside the right LED strip
    this._box(34, 12, 34, M.black, HW - 62, H - 40, 60);
    this._cyl(6, 3, "y", new T3.MeshPhysicalMaterial({ color: 0x0a1018, metalness: 0.4, roughness: 0.05 }), HW - 62, H - 47, 60, null, null, 20);
  },

  // the laser module (wiki laser-setup / maintenance): boxy black housing hung on the toolhead in place of the front
  // cover, heat sink + fan on top, air-assist coupler top rear, quick-release lever on the side, LED, flame sensor,
  // air nozzle with the height probe at the bottom. Size ~ 50 x 82 x 50 (estimate, no photo).
  _h2dLaserModule() {
    const T3 = this.T, M = this.M, h = this._head;
    this._laserMod = new T3.Group();
    this._laserMod.position.set(0, 0, LZ);
    h.add(this._laserMod);
    const g = this._laserMod, mat = this._modMat ||= new T3.MeshStandardMaterial({ color: 0x232427, metalness: 0.35, roughness: 0.45 });
    this._shell.push(mat);
    this._box(50, 44, 50, mat, 0, L_BOT + 28, 0, g);                                    // housing
    this._box(46, 30, 1.2, M.alu, 0, L_BOT + 26, 25.2, g);                              // front plate
    this._box(10, 2.4, 0.8, new T3.MeshBasicMaterial({ color: 0x35d06b }), -12, L_BOT + 36, 25.8, g);   // LED indicator
    this._box(5, 5, 1.2, new T3.MeshBasicMaterial({ color: 0xff4a2a }), 12, L_BOT + 14, 25.8, g);   // flame / temperature sensor
    for (let k = 0; k < 7; k++) this._box(48, 1.8, 44, M.alu, 0, L_BOT + 54 + k * 3.6, -1, g);        // heat sink fins
    this._box(50, 6, 50, mat, 0, L_TOP - 3, 0, g);                                      // screwed top cover
    this._cyl(15, 2, "y", M.black, 0, L_TOP + 0.5, 3, g, null, 24);                     // fan grille
    this._cyl(4.5, 8, "y", M.steel, 0, L_TOP + 4, -14, g, null, 16);                     // air-assist coupler
    this._cyl(5.5, 3, "y", M.black, 0, L_TOP + 8, -14, g, null, 16);
    this._cyl(9, 8, "y", M.steel, 0, L_BOT + 4, 0, g, null, 6);                          // hex nozzle / air concentrator (10 W)
    this._cyl(2.2, 5, "y", M.black, -16, L_BOT + 1, 14, g, null, 10);                    // height probe
    // quick-release lever on the right side, hinged at the top
    const lever = this._box(3, 30, 12, M.handle, 26.5, L_BOT + 28, 4, g);
    lever.rotation.z = -0.1;
    this._box(4, 6, 16, M.steel, 26, L_BOT + 44, 4, g);
    // the beam (thin 455 nm blue) and the spot on the bed, shown by _laser(); both ride on the head
    const beam = this._beamMat ||= new T3.MeshBasicMaterial({ color: 0x4f7bff, transparent: true, opacity: 0.85, blending: T3.AdditiveBlending, depthWrite: false });
    this._beam = new T3.Mesh(new T3.CylinderGeometry(0.7, 0.35, 1, 8), beam);
    this._beam.visible = false;
    h.add(this._beam);
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const x2 = c.getContext("2d"), gr = x2.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, "rgba(220,235,255,1)"); gr.addColorStop(0.25, "rgba(90,130,255,0.85)"); gr.addColorStop(1, "rgba(60,100,255,0)");
    x2.fillStyle = gr; x2.fillRect(0, 0, 64, 64);
    this._spot = new T3.Mesh(new T3.PlaneGeometry(26, 26).rotateX(-Math.PI / 2),
      new T3.MeshBasicMaterial({ map: new T3.CanvasTexture(c), transparent: true, blending: T3.AdditiveBlending, depthWrite: false }));
    this._spot.position.z = LZ;
    this._spot.visible = false;
    h.add(this._spot);
  },

  // laser platform on the bed (slats + base; shown only while a laser job runs, then the plate is covered)
  _h2dLaserBed() {
    const T3 = this.T, [bx, by] = this._bedSize(), pw = Math.min(310, bx - 20), pd = Math.min(270, by - 20);
    const base = this._lbMat ||= new T3.MeshStandardMaterial({ color: 0x3a3c40, metalness: 0.4, roughness: 0.6 });
    const slat = this._slatMat ||= new T3.MeshStandardMaterial({ color: 0xb9bcc2, metalness: 0.6, roughness: 0.4 });
    this._laserBase = new T3.Group();
    this._laserBase.visible = false;
    this._bed.add(this._laserBase);
    this._box(pw + 12, 3, pd + 12, base, 0, 1.5, 0, this._laserBase);
    for (let x = -pw / 2; x <= pw / 2 + 0.1; x += 14) this._box(1.6, 5, pd, slat, x, 5.5, 0, this._laserBase);   // support slats
  },

  // a laser / cutting job: show the beam from the module's air nozzle to the platform and the glow spot under the head
  _laser(on) {
    this._laserJob = !!on;
    if (this._laserBase) this._laserBase.visible = !!on;
    if (this._beam) { this._beam.visible = !!on; this._spot.visible = !!on; this._laserFx(); }
  },

  // per frame (from _tubesUpdate): beam length follows the bed's height, the spot flickers a little
  _laserFx() {
    if (!this._beam || !this._laserJob) return;
    const top = this._bed.position.y + (this._laserBase ? 6.5 : 0), len = Math.max(1, L_BOT - top), k = 0.9 + 0.1 * Math.sin(performance.now() / 45);
    this._beam.scale.set(1, len, 1);
    this._beam.position.set(0, top + len / 2, LZ);
    this._spot.position.y = top + 0.4;
    this._spot.scale.set(k, 1, k);
  },
});
