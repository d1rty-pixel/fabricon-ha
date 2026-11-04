// View: framing, view tools (labels, x-ray, spin, camera), responsive layout, the render loop, picking.
Object.assign(FabriconCard.prototype, {
  // frame printer + AMS for the current aspect ratio: AMS on top = tall (about 640 x 720 mm seen from the
  // front-right), beside = wide (about 1000 x 480 mm, seen more from the front), centred between the two
  _resetView() {
    const c = this._cam, half = Math.tan(c.fov * Math.PI / 360), table = this._units.filter((u) => u.grp && u.grp.position.y < AMS_Y);
    const side = table.length > 0, xs = [-W / 2, W / 2, ...table.flatMap((u) => [u.grp.position.x - AMS_W / 2, u.grp.position.x + AMS_W / 2])];
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const dist = side ? Math.max(460 / half, (x1 - x0) * 1.045 / (half * c.aspect)) : Math.max(500 / half, 430 / (half * c.aspect));
    const dir = side ? new this.T.Vector3(0.3, 0.32, 0.9).normalize() : new this.T.Vector3(0.52, 0.3, 0.8).normalize();
    this._ctl.target.set(side ? (x0 + x1) / 2 : 0, side ? 250 : 375, 0);
    this._ctl.maxDistance = Math.max(2600, dist * 1.3);   // portrait screens need the camera further out
    c.position.copy(dir.multiplyScalar(dist)).add(this._ctl.target);
    this._ctl.update();
  },

  // the loading overlay over the model: counted, so nested loads (a file inside the start-up) keep it until the last
  // one ends; sub = what is loading
  _busy(on, sub) {
    this._busyN = Math.max(0, (this._busyN || 0) + (on ? 1 : -1));
    if (on && sub != null) this._wrap.querySelector(".ld-sub").textContent = sub;
    this._wrap.classList.toggle("busy", this._busyN > 0);
  },

  _tool(b) {
    const k = b.dataset.k;
    if (k === "reset") { this._userView = false; this._resetView(); return; }
    if (k === "camera") { this._camera(!this._camOpen); return; }
    if (k === "light") { this._hass?.callService("light", "toggle", { entity_id: this._e("light", "chamber_light") }); return; }
    this._opts[k] = !this._opts[k];
    if (k === "labels") this._labelsSet = true;
    b.classList.toggle("on", this._opts[k]);
    if (k === "labels") this._labelsEl.style.display = this._opts.labels ? "" : "none";
    if (k === "xray") for (const m of this._shell) { m.transparent = this._opts.xray; m.opacity = this._opts.xray ? 0.18 : 1; m.depthWrite = !this._opts.xray; m.needsUpdate = true; }
    if (k === "xray") {
      // the door, every glass / acrylic part (lid, side windows with their rims, AMS dome, toolhead cover) and the
      // purge chute go away
      const clear = new Set([this.M.glass, this.M.smoke, this.M.tint, this.M.dome, this._headCover, this._chuteMat, ...this._units.map((u) => u.dome)]);
      this._door.visible = !this._opts.xray;
      for (const m of this._winRims) m.visible = !this._opts.xray;
      this._scene.traverse((o) => { if (o.isMesh && clear.has(o.material)) o.visible = !this._opts.xray; });
    }
    if (k === "spin") this._ctl.autoRotate = this._opts.spin;
  },

  // ------------------------------------------------------------------ frame loop

  _fit() {
    if (!this._renderer) return;
    const w = this._wrap.clientWidth, h = this._wrap.clientHeight;
    if (!w || !h) return;
    this._renderer.setSize(w, h, false);
    this._cam.aspect = w / h;
    this._cam.updateProjectionMatrix();
    this._layout();
    // keep the machine framed while the area changes (rotation, panel opened), unless the user moved the view
    if (!this._framed || !this._userView) { this._framed = true; this._resetView(); }
  },

  // width classes on the card; the footer's narrow layout
  _layout() {
    const cw = this._card.clientWidth, ww = this._wrap.clientWidth;
    if (!cw) return;
    // stack: the print dock goes under the model; narrow: sidebar panels slide over instead of beside;
    // tiny (phones): fixed view, the controls are off so a swipe over the model scrolls the dock
    const tiny = cw < 600;
    this._card.classList.toggle("tiny", tiny);
    this._card.classList.toggle("stack", cw < 1100);
    this._card.classList.toggle("narrow", cw < 1500);
    this._card.classList.toggle("compact", tiny || ww < 900);
    if (this._ctl && this._ctl.enabled === tiny) {
      this._ctl.enabled = !tiny;
      this._renderer.domElement.style.touchAction = tiny ? "pan-y" : "none";
      if (tiny) { this._userView = false; this._ctl.autoRotate = this._opts.spin = false; this._resetView(); }
    }
    if (tiny && !this._labelsSet && this._opts.labels) {
      this._opts.labels = false;
      this._labelsEl.style.display = "none";
      this.shadowRoot.querySelector('.tools [data-k="labels"]').classList.remove("on");
    }
    const nar = this._cfg.footer_narrow, kids = [...this._foot.children];
    if (!nar || !kids.length) return;
    const on = cw < 640;
    if (on === this._footNarrow) return;
    this._footNarrow = on;
    this._foot.style.gridTemplateColumns = on ? nar.columns : (this._cfg.footer_columns || `repeat(${kids.length}, minmax(0, 1fr))`);
    kids.forEach((el, i) => {
      el.style.gridColumn = on && nar.span?.[i] ? `span ${nar.span[i]}` : "";
      el.style.order = on && nar.order ? String(nar.order.indexOf(i)) : "";
    });
  },

  // height "fill": the window's height below the card's top edge (that edge moves when the notices above appear)
  _fill() {
    if (this._cfg.height !== "fill") return;
    const h = Math.max(420, Math.floor(window.innerHeight - this._card.getBoundingClientRect().top - (this._cfg.fill_margin ?? 10)));
    if (h !== this._fillH) { this._fillH = h; this._card.style.height = h + "px"; }
  },

  _loop() {
    this._raf = requestAnimationFrame(() => this._loop());
    this._frame = (this._frame || 0) + 1;
    if (this._frame % 15 === 1) this._fill();
    const now = performance.now(), dt = Math.min(0.05, (now - (this._last || now)) / 1000), t = (now - this._t0) / 1000;
    this._last = now;
    const job = this._job || { prog: 0, printing: false, active: false };

    // fans
    for (const f of Object.values(this._fans)) f.rotor.rotation.z += dt * f.speed * 0.32;

    // door, nozzle lift
    if (this._doorTarget != null) this._door.rotation.y += (this._doorTarget - this._door.rotation.y) * Math.min(1, dt * 4);
    if (this._nozzleLift) for (const k of ["left", "right"]) {
      const n = this._nozzles[k].g;
      n.position.y += (this._nozzleLift[k] - n.position.y) * Math.min(1, dt * 5);
    }

    if (this._gc) this._replay(dt, job);
    else this._simulate(dt, t, job);

    // spools turn while feeding: on the AMS the front of the spool runs down into the feeders
    for (const sp of [...this._units.flatMap((u) => u.spools), ...this._holders.map((h) => h.spool)]) if (sp.spin) sp.g.rotation.x += dt * 0.6;

    this._tubesUpdate();
    this._ctl.update();
    this._renderer.render(this._scene, this._cam);
    if (this._opts.labels) this._placeLabels();
  },

  _pick(ev) {
    const rect = this._renderer.domElement.getBoundingClientRect();
    const p = new this.T.Vector2(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    this._ray.setFromCamera(p, this._cam);
    // the raycaster also hits hidden meshes (door in x-ray, plate glow off): only what is shown counts
    const shown = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
    const hit = this._ray.intersectObjects(this._clickable, false).find((h) => shown(h.object));
    if (!hit) return;
    if (hit.object.userData.act) { hit.object.userData.act(); return; }
    const u = this._units.find((x) => x.meshes?.has(hit.object));   // any part of an AMS: its panel
    if (u) this._openAms(u.id);
    else this._more(hit.object.userData.entity);
  },
});
