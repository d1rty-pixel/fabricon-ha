// The toolhead, hotend and nozzle.
Object.assign(MODEL, {
  // After the wiki's toolhead renders (X1 glossary "Toolhead View": both variants have a light grey / silver housing with
  // a black duct, the glossary photo of the P1 head looks the same). P1S: light-grey housings (front housing with the round part-fan intake right of
  // centre, extruder motor and cutter lever on the left, hotend fan grille on the left / rear), black duct underneath.
  // X1C: the same head in silver with the micro lidar (a dark window with a red laser line) at
  // the bottom front. 57 wide, ~100 tall incl. the duct.
  _toolhead(x1c) {
    const T3 = this.T, M = this.M, slabXY = this._slabXY.bind(this), ent = this._compEntity("heater:nozzle");
    const HW = 57, HD = 44, hb = TIP + HOT, bodyY = hb + DUCT_H + BODY_H / 2;
    const head = this._head = new T3.Group();
    this._scene.add(head);
    const grey = new T3.MeshStandardMaterial({ color: x1c ? 0xa3a6ab : 0x9a9da3, metalness: 0.25, roughness: 0.6 });
    const duct = new T3.MeshStandardMaterial({ color: 0x131416, metalness: 0.15, roughness: 0.7 });
    this._shell.push(grey, duct);
    this._m(slabXY(HW, BODY_H, 8, HD), grey, 0, bodyY, -2, head);
    this._box(HW - 4, 3, HD - 8, duct, 0, hb + DUCT_H + BODY_H + 1, -2, head);                    // top cap
    this._box(HW - 6, DUCT_H, HD - 4, duct, 0, hb + DUCT_H / 2, -2, head);                         // duct block under the housing
    this._box(30, 8, 12, duct, 0, hb + DUCT_H - 2, HD / 2 + 4, head);                              // duct nose in front
    const fz = HD / 2 - 2 + 0.2;                                                                    // front face of the housing
    this._fans.part = this._fan(13, "z+", 9, hb + DUCT_H + 30, fz, this._compEntity("fan:part"), head, "blower");
    // Bambu logo on the front
    const tl = this._text("Bambu Lab", 26, 6, { color: "#2a2b2e", weight: 700, px: 256, fit: true });
    tl.position.set(-9, hb + DUCT_H + BODY_H - 9, fz + 0.4);
    head.add(tl);
    // left side: extruder motor on top, cutter lever, hotend fan below it behind its grille
    this._box(26, 28, 28, M.black, -HW / 2 - 11, hb + DUCT_H + BODY_H - 18, -4, head);
    this._box(3, 40, 7, grey, -HW / 2 - 2, hb + DUCT_H + 24, 14, head);
    this._fans.hotend = this._fan(11, "x-", -HW / 2 - 1.5, hb + DUCT_H + 11, -2, this._compEntity("fan:hotend"), head);
    // top: PTFE coupling at the rear (the tube leaves it upwards, see _tubesUpdate)
    this._cyl(6, 8, "y", M.black, 0, HEAD_TOP + 4, -12, head);
    this._cyl(4.5, 3, "y", M.steel, 0, HEAD_TOP + 9, -12, head);
    // back: bearing block around the X rods, as wide as the pair
    this._box(44, XR_HI - XR_LO + 16, 14, duct, 0, (XR_LO + XR_HI) / 2, XR_Z, head);
    if (x1c) {
      this._box(36, 7, 20, M.screenBezel, 0, hb - 3, 6, head);                                       // micro lidar module under the duct
      this._box(24, 1.2, 1.6, new T3.MeshBasicMaterial({ color: 0xff2a1a }), 0, hb - 6.7, 16.2, head);   // laser line
    }
    // hotend: silicone sock, heater block, nozzle (narrow end down)
    const gold = new T3.MeshStandardMaterial({ color: 0xb08d57, metalness: 0.9, roughness: 0.3, emissive: 0x000000 });
    const g = new T3.Group();
    g.position.z = 4;
    head.add(g);
    this._box(15, 9, 15, new T3.MeshStandardMaterial({ color: 0x2b2b2d, roughness: 0.92 }), 0, TIP + 8, 0, g, ent);
    const tip = this._cyl(4.5, 5, "y", gold, 0, TIP + 2.5, 0, g, ent, 16, 1.1);
    this._nozzles = { main: { g, tip } };
    this._heat = { ...this._heat, nozzle: { mat: tip.material, lo: 60, hi: 300 } };
  },
});
