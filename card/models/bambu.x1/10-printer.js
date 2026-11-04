// The enclosure: shell, front (door, screen / console, logos), rear panel, chamber fixtures.
Object.assign(MODEL, {
  _build() {
    const T3 = this.T, M = this.M, e = this._e.bind(this), slabXY = this._slabXY.bind(this);
    const hw = W / 2, hd = D / 2, RZ = -hd, x1c = this._spec().profile === "bambu.x1c";
    // body colour per variant: X1C silver-grey (wiki: "silver-gray" front cover; glossary photo: light grey side panel),
    // P1S graphite-black plastic (P1 glossary photo). The rear metal panel of the X1C is darkened so the chamber's back
    // wall still reads as an interior from the front.
    const blk = this._blk = new T3.MeshStandardMaterial(x1c ? { color: 0xb9bcc1, metalness: 0.55, roughness: 0.42 } : { color: 0x1c1d20, metalness: 0.45, roughness: 0.5 });
    const rear = x1c ? new T3.MeshStandardMaterial({ color: 0x4d5055, metalness: 0.5, roughness: 0.5 }) : blk;
    this._shell.push(blk, rear);

    // shell: corner posts, windowless side panels (outer plate + inner lining), plinth bands, top frame
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) this._cyl(R, H - 8, "y", blk, x * (hw - R), 8 + (H - 8) / 2, z * (hd - R), null, null, 24);
    for (const s of [-1, 1]) {
      this._box(T, H - 8, D - 2 * R, blk, s * (hw - T / 2), 8 + (H - 8) / 2, 0);
      this._box(2, H - 8 - FLOOR, D - 2 * T, M.inner, s * (hw - T - 1), FLOOR + (H - 8 - FLOOR) / 2, 0);
    }
    // back wall with the purge chute and the chamber fan opening cut out
    {
      const sh = new T3.Shape(), w = W - 2 * R, h = H - 8;
      sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h); sh.lineTo(-w / 2, h); sh.lineTo(-w / 2, 0);
      for (const [cx, cy, cw, ch] of [CHUTE, FANWIN]) {
        const hole = new T3.Path(), x0 = cx - cw / 2, x1 = cx + cw / 2, ya = cy - ch / 2 - 8, yb = cy + ch / 2 - 8, q = 8;
        hole.moveTo(x0 + q, ya); hole.lineTo(x1 - q, ya); hole.quadraticCurveTo(x1, ya, x1, ya + q); hole.lineTo(x1, yb - q);
        hole.quadraticCurveTo(x1, yb, x1 - q, yb); hole.lineTo(x0 + q, yb); hole.quadraticCurveTo(x0, yb, x0, yb - q); hole.lineTo(x0, ya + q);
        hole.quadraticCurveTo(x0, ya, x0 + q, ya);
        sh.holes.push(hole);
      }
      this._m(new T3.ExtrudeGeometry(sh, { depth: T, bevelEnabled: false, curveSegments: 6 }).translate(0, 0, -T / 2), rear, 0, 8, RZ + T / 2);
    }
    this._box(W - 2 * R, DOOR_Y0 - 8, T, blk, 0, 8 + (DOOR_Y0 - 8) / 2, hd - T / 2);       // sill under the door
    this._box(W - 2 * R, H - DOOR_Y1, T, blk, 0, (H + DOOR_Y1) / 2, hd - T / 2);            // front band (console, logo)
    this._box(W - 2 * R, T, 34, blk, 0, H - T / 2, hd - 17);
    this._box(W - 2 * R, T, 34, blk, 0, H - T / 2, -hd + 17);
    for (const s of [-1, 1]) this._box(34, T, D - 2 * R, blk, s * (hw - 17), H - T / 2, 0);
    this._box(W - 68, 4, D - 68, M.glass, 0, H - 4, 0);                                      // glass lid (~340 x 340)
    this._box(W - 2 * T, 6, D - 2 * T, M.inner, 0, FLOOR - 3, 0);                            // chamber floor
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) this._cyl(9, 6, "y", M.black, x * (hw - 30), 3, z * (hd - 30));   // feet

    // fans on the walls: the aux blower on the left wall (rear half), the chamber fan behind the big rear opening
    this._fans = {
      aux: this._fan(32, "x+", -hw + T + 8, 185, -55, this._compEntity("fan:aux")),
      chamber: this._fan(44, "z-", FANWIN[0], FANWIN[1], RZ + 4.5, this._compEntity("fan:chamber")),
    };
    this._fanHub = new T3.Object3D();                       // label anchor of the chamber group
    this._fanHub.position.set(-hw + 12, 215, -55);
    this._scene.add(this._fanHub);
    if (x1c) this._m(slabXY(FANWIN[2] + 24, FANWIN[3] + 24, 14, 6, [FANWIN[2] + 2, FANWIN[3] + 2, 8]), M.bodyDark, FANWIN[0], FANWIN[1], RZ - 3);   // carbon filter cover frame

    // rear panel (wiki "Replace the Rear Metal Panel", X1 and P1 photos are the same layout): narrow grille, chute,
    // filament slot at the top, the two belt-tensioner windows, power inlet cut-out, an embossed spool-holder bracket
    const perf = (w, h, x, y) => {
      const g = new T3.PlaneGeometry(w, h).rotateY(Math.PI), uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / 8, uv.getY(i) * h / 8);
      return this._m(g, this._perfMat(), x, y, RZ - 0.4);
    };
    perf(GRILLE2[2], GRILLE2[3], GRILLE2[0], GRILLE2[1]);
    this._m(slabXY(BRACKET[2], BRACKET[3], 8, 1), M.bodyDark, BRACKET[0], BRACKET[1], RZ - 2);       // bracket plate for the spool holder
    this._m(slabXY(CHUTE[2] + 8, CHUTE[3] + 8, 10, 2, [CHUTE[2], CHUTE[3], 8]), M.bodyDark, CHUTE[0], CHUTE[1], RZ - 1);
    this._m(slabXY(51, 11, 4, 2), M.black, SLOT[0], SLOT[1], RZ - 1);
    for (const [x, y] of [[-132, 392], [132, 363]]) this._box(34, 34, 1, M.black, x, y, RZ - 0.5);   // belt tensioner windows (34 x 34)
    this._box(31, 51, 6, M.black, -127, 54, RZ - 3);                                                 // power inlet cut-out (31 x 51)
    this._box(14, 10, 3, new T3.MeshStandardMaterial({ color: 0xa01010, roughness: 0.5 }), -127, 62, RZ - 7);   // red rocker switch (estimate)
    // purge chute inside: a slim shaft between the bed carrier's back edge and the back wall, open at the top under
    // the nozzle, a ramp at the bottom out through the opening (as on the X2D)
    {
      const mat = this._chuteMat ||= new T3.MeshStandardMaterial({ color: 0x2a2b2e, roughness: 0.6, transparent: true, opacity: 0.7, side: T3.DoubleSide });
      const [cx, , cw] = CHUTE, zb = RZ + T + 1, zf = -152, top = TIP - 18, low = CHUTE[1] - CHUTE[3] / 2;
      const rampY = low + (zf - zb), ramp = Math.hypot(zf - zb, rampY - low);
      this._box(cw + 4, top - rampY, 2, mat, cx, (top + rampY) / 2, zf);
      for (const s of [-1, 1]) this._box(2, top - low, zf - zb, mat, cx + s * (cw / 2 + 1), (top + low) / 2, (zf + zb) / 2);
      this._m(new T3.BoxGeometry(cw, 2, ramp).rotateX(-Math.atan2(rampY - low, zf - zb)), mat, cx, (rampY + low) / 2, (zf + zb) / 2);
    }

    // nozzle wiper on the chute's front edge (wiki "Replacing the Nozzle Wiper": black S bracket with a blue silicone roller)
    // and the small "Bambu Lab" badge under it (front photos: a white pill on the chute's front wall, y ~ 215)
    {
      const wm = new T3.MeshStandardMaterial({ color: 0x151618, roughness: 0.6 }), blue = new T3.MeshStandardMaterial({ color: 0x9fc2ee, roughness: 0.4, transparent: true, opacity: 0.85 });
      this._box(22, 30, 6, wm, CHUTE[0], TIP - 36, -148);
      this._cyl(4, 20, "x", blue, CHUTE[0], TIP - 48, -146, null, null, 14);
      this._box(30, 9, 1.5, new T3.MeshStandardMaterial({ color: 0xe8e9ea, roughness: 0.4 }), CHUTE[0], 215, -150.5);
      const badge = this._text("Bambu Lab", 26, 6, { color: "#55585d", weight: 700, px: 256, fit: true });
      badge.position.set(CHUTE[0], 215, -149.6);
      this._scene.add(badge);
    }

    // front: lettering on the band. X1C: small "Bambu Lab" + "X1-Carbon" right of centre (glossary photo, x ~ +116);
    // P1S: "Bambu Lab P1S" two lines at x ~ +98 (P1 glossary photo)
    const dim = x1c ? "#4a4d52" : "#9a9da3";
    const logo = this._text(x1c ? "Bambu Lab  X1-Carbon" : "Bambu Lab P1S", x1c ? 78 : 56, 10, { color: dim, weight: 700, px: 256, fit: true });
    logo.position.set(x1c ? 116 : 98, H - 22, hd + 0.6);
    this._scene.add(logo);
    // right side panel: the Bambu mark (a tall glyph, ~50 x 70 mm, centre y ~ 250) with "Bambu Lab" under it (y ~ 200),
    // z ~ -20 (X1C glossary photo; P1S the same, dark on black)
    {
      const gm = new T3.MeshBasicMaterial({ color: x1c ? 0x1a1b1e : 0x5a5d62, side: T3.DoubleSide });
      const sh = new T3.Shape();       // two vertical bars joined by a chevron
      sh.moveTo(-22, -34); sh.lineTo(-8, -34); sh.lineTo(-8, 34); sh.lineTo(-22, 34); sh.lineTo(-22, -34);
      const sh2 = new T3.Shape();
      sh2.moveTo(8, -34); sh2.lineTo(22, -34); sh2.lineTo(22, 34); sh2.lineTo(8, 34); sh2.lineTo(8, -34);
      const sh3 = new T3.Shape();
      sh3.moveTo(-8, 4); sh3.lineTo(8, -12); sh3.lineTo(8, 4); sh3.lineTo(-8, 20); sh3.lineTo(-8, 4);
      const g = new T3.Group();
      for (const q of [sh, sh2, sh3]) g.add(new T3.Mesh(new T3.ShapeGeometry(q), gm));
      g.rotation.y = Math.PI / 2;      // face +x, glyph y up
      g.position.set(hw + 0.6, 250, -20);
      this._scene.add(g);
      const side = this._text("Bambu Lab", 62, 12, { color: x1c ? "#1a1b1e" : "#5a5d62", weight: 700, px: 256, fit: true });
      side.rotation.set(0, Math.PI / 2, 0);
      side.position.set(hw + 0.6, 198, -20);
      this._scene.add(side);
    }
    // screen module standing on the top front edge at the LEFT, tilted back, its top above the lid. X1C: 5" touchscreen,
    // silver housing with the hinge knob (screen replacement photo), ~140 x 80 mm, x -188 .. -48 (glossary photo).
    // P1S: 2.7" LCD + D-pad + two buttons, ~147 x 40 mm, x -194 .. -47, rising ~12 mm over the lid (P1 glossary photo).
    const scr = new T3.Group();
    this._scene.add(scr);
    if (x1c) {
      scr.position.set(-118, 438, hd + 4);
      scr.rotation.x = -0.3;
      this._box(140, 80, 10, M.screenBezel, 0, 0, 0, scr, e("sensor", "print_status"));
      this._box(120, 66, 22, blk, 0, -2, -14, scr);                                                  // silver rear housing
      this._cyl(9, 16, "x", blk, 70 + 8, -24, -14, scr, null, 20);                                    // hinge knob on the right
      this._screenCanvas = document.createElement("canvas");
      this._screenCanvas.width = 512; this._screenCanvas.height = 300;
      this._screenTex = new T3.CanvasTexture(this._screenCanvas);
      this._screenTex.colorSpace = T3.SRGBColorSpace;
      const sm = new T3.Mesh(new T3.PlaneGeometry(122, 71.5), new T3.MeshBasicMaterial({ map: this._screenTex, toneMapped: false }));
      sm.position.z = 5.2;
      scr.add(sm);
    } else {
      scr.position.set(-120, 450, hd - 6);
      scr.rotation.x = -0.45;
      this._box(147, 40, 14, M.screenBezel, 0, 0, 0, scr, e("sensor", "print_status"));
      this._box(62, 22, 1, new T3.MeshStandardMaterial({ color: 0x25302a, roughness: 0.3 }), -32, 0, 7.3, scr);
      this._cyl(17, 3, "z", M.bodyDark, 30, 0, 7.5, scr, null, 32);
      this._cyl(7, 3.4, "z", M.black, 30, 0, 8, scr, null, 24);
      for (const dy of [8, -8]) this._cyl(4.5, 3, "z", M.bodyDark, 58, dy, 7.5, scr, null, 20);
    }
    // microSD: X1C on the screen module's lower right edge (glossary marker), P1S on the module's top left edge; the card
    // sticks out while the storage sensor reports it
    const ux = x1c ? -62 : -145, uy = x1c ? 402 : 468, uz = x1c ? hd + 12 : hd - 10, usbEnt = e("binary_sensor", "usb_drive");
    this._box(14, 3, 1, M.black, ux, uy, uz + 0.3, null, usbEnt);
    this._usb = new T3.Group();
    this._usb.position.set(ux, uy, uz);
    this._scene.add(this._usb);
    this._box(11, 1, 8, new T3.MeshStandardMaterial({ color: 0x14161a, metalness: 0.2, roughness: 0.5 }), 0, 0, 4, this._usb, usbEnt);
    this._usb.visible = false;
    // chamber camera (wiki camera guides: a black wedge with the lens, on the left front of the top beam)
    this._box(40, 14, 16, M.screenBezel, -hw + R + 22, x1c ? 314 : 306, hd - R - 14);
    this._cyl(5, 3, "z", M.black, -hw + R + 30, x1c ? 314 : 306, hd - R - 5.5, null, null, 16);
    // top: the round cap on the lid at the back (visible in both front photos, near the centre; purpose not documented)
    this._cyl(8, 6, "y", blk, 0, H + 3, -110, null, null, 20);

    // door: tinted glass from the sill to the front band, hinged on the left (handle at the right edge, glossary: x +176,
    // y 227), dark print around the inside edge, upper / lower hinge pads
    this._door = new T3.Group();
    this._door.position.set(-176, 0, hd + 3);
    this._scene.add(this._door);
    const dw = 352, dh = DOOR_Y1 - DOOR_Y0 - 2, dy = DOOR_Y0 + 1 + dh / 2;
    this._m(slabXY(dw, dh, 3, 4), M.tint, dw / 2, dy, 0, this._door);
    const frit = this._fritMat ||= new T3.MeshPhysicalMaterial({ color: 0x030304, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 });
    if (!x1c) this._m(slabXY(dw, dh, 3, 0.4, [dw - 20, dh - 20, 2]), frit, dw / 2, dy, 2.2, this._door);   // P1S: black print around the glass; X1C: bare tinted glass (photo)
    for (const y of [DOOR_Y1 - 22, DOOR_Y0 + 22]) this._box(10, 14, 6, M.steel, 4, y, -4, this._door);
    {
      const hl = 40, hh = 10, sh = new T3.Shape();   // the photos show no handle: a low pull strip, also the click target
      sh.absarc(hl / 2 - hh / 2, 0, hh / 2, -Math.PI / 2, Math.PI / 2, false);
      sh.absarc(-hl / 2 + hh / 2, 0, hh / 2, Math.PI / 2, Math.PI * 1.5, false);
      const g = new T3.ExtrudeGeometry(sh, { depth: 4, bevelEnabled: true, bevelThickness: 1.5, bevelSize: 1.5, bevelSegments: 4, curveSegments: 16 });
      this._doorHandle = this._m(g, M.handle, dw - hl / 2 - 4, 200, 2, this._door, this._compEntity("door:front"));
    }
    this._doors = this._comp("door:front") ? { front: { g: this._door, open: -1.75 } } : {};

    // chamber light: a white bar next to the camera on the left front beam. X1C: ~108 mm long from x -148 (glossary photo,
    // black housing, light face); P1S: a short PCB strip with a diffuser, ~43 mm at x -130 (P1 glossary + camera guide).
    // The height (~ 64 mm under the door top) is read from the front photos and is the least certain value.
    const lx = x1c ? -94 : -130, ll = x1c ? 108 : 43, ly = x1c ? 326 : 330;
    this._box(ll, 8, 9, M.black, lx, ly + 1, hd - 32);
    this._ledBar = this._box(ll - 2, 3, 7, M.led, lx, ly - 3.5, hd - 32);
    const lamp = new T3.PointLight(0xfff1dc, 0, 900, 1.6);
    lamp.position.set(lx, ly - 20, hd - 80);
    this._scene.add(lamp);
    this._lights = { chamber: { lamp, bar: this._ledBar, power: 1.4 } };

    // CoreXY gantry: 8 mm steel Y rod per side, a slider on each holding the two carbon X rods; the XY motors sit in the
    // rear corners (rear photo: Motor A / B). Belts are left out.
    const ylen = D - 2 * T - 24;
    for (const s of [-1, 1]) {
      this._cyl(4, ylen, "z", M.steel, s * YR_X, YR_Y, 0, null, null, 20);
      for (const z of [-1, 1]) this._box(14, 24, 12, M.bodyDark, s * (YR_X + 2), YR_Y, z * (ylen / 2 - 2));
      this._box(42, 40, 42, M.black, s * 150, 382, RZ + T + 23);                            // NEMA 17
      this._cyl(6, 16, "y", M.alu, s * 150, 410, RZ + T + 23, null, null, 20);
    }
    this._carriage = new T3.Group();
    this._scene.add(this._carriage);
    const carbon = this._carbon ||= new T3.MeshStandardMaterial({ color: 0x15161a, metalness: 0.3, roughness: 0.42 });
    for (const y of [XR_LO, XR_HI]) this._cyl(5, 2 * (YR_X + 4), "x", carbon, 0, y, XR_Z, this._carriage, null, 20);
    for (const s of [-1, 1]) {
      this._box(20, 50, 28, M.black, s * (YR_X - 3), (XR_LO + XR_HI) / 2, XR_Z, this._carriage);        // end block with the pulleys
      for (const dz of [-16, 16]) this._cyl(8, 6, "z", M.black, s * YR_X, YR_Y, XR_Z + dz, this._carriage, null, 20);
    }

    this._toolhead(x1c);

    // Z: three lead screws turned together by one belt under the floor, three smooth guide rods, flange bearings on the
    // floor, top brackets
    const screw = this._screwMat ||= new T3.MeshStandardMaterial({ color: 0x9a9da3, metalness: 0.9, roughness: 0.45 });
    const brassNut = this._nutMat ||= new T3.MeshStandardMaterial({ color: 0xb8893a, metalness: 0.9, roughness: 0.3 });
    const zlen = Z_TOP - FLOOR;
    for (const [x, z] of ZS) {
      this._cyl(4, zlen, "y", screw, x, FLOOR + zlen / 2, z, null, null, 16);
      this._cyl(11, 4, "y", M.black, x, FLOOR + 2, z, null, null, 24);
    }
    for (const [x, z] of ZR) {
      this._cyl(4, zlen, "y", M.steel, x, FLOOR + zlen / 2, z, null, null, 20);
      this._cyl(8, 6, "y", M.black, x, FLOOR + 3, z, null, null, 20);
    }
    for (const s of [-1, 1]) this._box(34, 8, 40, M.bodyDark, s * 169, Z_TOP + 4, 160);
    this._box(80, 8, 20, M.bodyDark, 18, Z_TOP + 4, -170);

    // bed: textured plate on the heatbed, three sliders (a block on screw + rod each) joined to the bed by arms
    this._bed = new T3.Group();
    this._scene.add(this._bed);
    this._box(268, 10, 268, M.bodyDark, 0, -11, 0, this._bed);
    this._bedPlate = this._box(257, 6, 257, M.plateTex, 0, -3, 0, this._bed, this._compEntity("heater:bed"));
    this._heat.bed = { mat: this._bedPlate.material, lo: 30, hi: 120 };
    this._box(257, 1, 257, M.plate, 0, -6.5, 0, this._bed);
    for (const s of [-1, 1]) {
      this._box(40, 10, 44, M.bodyDark, s * 150, -11, 152, this._bed);
      this._box(36, 26, 40, M.bodyDark, s * 168, -3, 160, this._bed);
    }
    this._box(40, 10, 40, M.bodyDark, 0, -11, -154, this._bed);
    this._box(76, 26, 22, M.bodyDark, 18, -3, -170, this._bed);
    for (const [x, z] of ZS) this._cyl(10, 6, "y", brassNut, x, 13, z, this._bed, null, 6);
    for (const [x, z] of ZR) this._cyl(9, 6, "y", M.black, x, 13, z, this._bed, null, 20);

    // rear spool holder, PTFE tubes (_tubesUpdate), labels
    this._holders = { main: this._spoolHolder() };
    this._tubes = [];
    this._tubeMat = M.ptfe;
    this._labelSpec = [
      { anchor: this._head, off: [0, HEAD_TOP + 4, 0], title: "TOOLHEAD", rows: ["heater:nozzle", "fan:part", "fan:hotend"] },
      { anchor: this._fanHub, off: [0, 60, 0], title: "CHAMBER", rows: ["heater:chamber", "light:chamber", "fan:aux", "fan:chamber"] },
      { anchor: this._bedPlate, off: [120, 4, 120], rows: ["heater:bed"] },
      { anchor: this._doorHandle, off: [0, 30, 0], rows: ["door:front"] },
      { anchor: this._holders.main.spool.g, off: [0, 100, 0], rows: ["external:main"] },
    ];
  },
});
