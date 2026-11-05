// Live state from HA onto the model: heat glow, fans, light, door, nozzles, AMS, screen, labels.
Object.assign(FabriconCard.prototype, {
  _primaryLight() { const ls = this._spec().lights || []; return ls.find((l) => l.primary) || ls[0]; },

  // everything the printer's spec lists, onto the model's parts and labels (a part the model doesn't have, or a
  // component without a part, is simply skipped)
  _apply() {
    const sp = this._spec(), core = sp.core || {};
    const s = this._st(core.status)?.state || "unknown";
    const active = ["printing", "paused", "preparing"].includes(s);
    // offline (or no status at all): hazard frame running round the model, PRINTER OFFLINE over it
    this._wrap.classList.toggle("isoff", ["offline", "unknown", "unavailable"].includes(s));
    const temp = (h) => ({ c: this._num(h.temp), t: (h.target && this._num(h.target)) || 0 });
    const tone = ({ c, t }) => t > 0 && Math.abs((c ?? 0) - t) > 3 ? "#FF6A00" : t > 0 ? "#FFB400" : "#7d776b";
    const glow = (mat, c, lo, hi) => {
      const f = Math.max(0, Math.min(1, ((c ?? 25) - lo) / (hi - lo)));
      mat.emissive.setRGB(1.0 * f, 0.28 * f, 0.02 * f);
      mat.emissiveIntensity = 1.6 * f;
    };
    const L = (k, title, val, col, hot) => {
      const r = this._lab[k];
      if (!r) return;
      const lab = r.lab;
      r.title.textContent = title;
      r.val.textContent = val;
      r.col = col; r.hot = !!hot;
      r.el.style.setProperty("--rc", col);
      r.el.classList.toggle("hot", r.hot);
      // the box takes its most urgent row's colour: heating / hot > on > the rest
      const rank = (c) => (c === "#FF6A00" ? 2 : c === "#FFB400" ? 1 : 0);
      const top = lab.rows.reduce((a, b) => (rank(b.col) > rank(a.col) ? b : a));
      lab.el.style.setProperty("--c", lab.rows.length > 1 ? (rank(top.col) ? top.col : "#7d776b") : col);
      lab.el.classList.toggle("hot", lab.rows.some((x) => x.hot));
      lab.size = null;
    };
    // a value nobody knows (entity missing / unavailable / unknown, e.g. the printer is off) reads "—" in the dim
    // colour, whatever its type; OFF / 0 / CLOSED only when the device reports it (same rule as the sidebar)
    const NA = "—", DIM = "#7d776b";
    const known = (id) => { const st = id && this._st(id)?.state; return st != null && !["unavailable", "unknown", ""].includes(st); };
    const deg = (x) => (x == null ? NA : Math.round(x) + "°");

    // heaters: glow on the model's part, measured / target on the label
    for (const h of sp.heaters || []) {
      const v = temp(h), g = this._heat[h.id];
      if (g) glow(g.mat, v.c, g.lo, g.hi);
      const title = h.kind === "bed" ? "HEATBED" : h.kind === "chamber" ? (h.target ? "HEATER" : "CHAMBER") : h.label.toUpperCase();
      const val = v.c == null ? NA : h.target ? `${deg(v.c)} / ${!known(h.target) ? NA : v.t ? deg(v.t) : "OFF"}` : deg(v.c);
      L(`heater:${h.id}`, title, val, v.c == null ? DIM : tone(v), tone(v) === "#FF6A00");
    }

    // fans: rotors at their speed; the ones the printer runs by itself are sensors in %
    const FAN = { part: "PART FAN", aux: "AUX FAN", aux_l: "AUX FAN L", aux_r: "AUX FAN R", exhaust: "EXHAUST", chamber: "CHAMBER FAN",
      hotend: "HOTEND FAN", ventilation: "FILTER FAN" };
    for (const f of sp.fans || []) {
      const st = this._st(f.entity);
      const p = f.auto ? Math.round(this._num(f.entity) || 0) : st?.state === "on" ? (st.attributes.percentage ?? 100) : 0;
      if (this._fans[f.id]) this._fans[f.id].speed = p;
      L(`fan:${f.id}`, FAN[f.id] || `${f.label.toUpperCase()} FAN`, !known(f.entity) ? NA : p ? `${p} %` : "OFF", p ? "#FFB400" : DIM);
    }

    // lights, doors, storage, nozzle selection
    for (const l of sp.lights || []) {
      const lit = this._st(l.entity)?.state === "on", part = this._lights[l.id];
      if (part) {
        if (part.lamp) part.lamp.intensity = lit ? part.power ?? 1.4 : 0;
        part.bar?.material.color.set(lit ? 0xfff6e8 : 0x2a2a2a);
      }
      L(`light:${l.id}`, (sp.lights.length > 1 ? `${l.label} light` : "LIGHT").toUpperCase(), !known(l.entity) ? NA : lit ? "ON" : "OFF", lit ? "#FFB400" : DIM);
    }
    for (const d of sp.doors || []) {
      const door = this._st(d.entity)?.state, part = this._doors[d.id];
      if (part) part.target = door === "on" ? part.open : 0;
      L(`door:${d.id}`, (sp.doors.length > 1 ? `${d.label}` : "DOOR").toUpperCase(), door === "on" ? "OPEN" : door === "off" ? "CLOSED" : NA, door === "on" ? "#FF6A00" : DIM);
    }
    if (this._usb) this._usb.visible = this._st(core.usb)?.state === "on";   // stick / card only when reported
    this._printState?.();
    const xs = sp.extruders || [];
    if (core.nozzle_select && xs.length > 1) {
      const nz = this._st(core.nozzle_select)?.state, cur = xs.some((x) => x.id === nz) ? nz : xs[0].id;
      this._nozzleLift = Object.fromEntries(xs.map((x) => [x.id, x.id === cur ? 0 : 6]));
    } else this._nozzleLift = null;

    // AMS units: slots, dryer
    this._setAms(this._findAms());
    let activeColor = null;
    this._units.forEach((u, k) => {
      const a = (domain, key) => `${domain}.${u.prefix}_${key}`;
      u.spools.forEach((spl, i) => {
        const sid = a("sensor", `slot_${i + 1}`), at = this._st(sid)?.attributes || {}, na = !known(sid);
        const empty = this._spoolState(spl, at, s);
        if (at.active && !empty) activeColor = at.color;
        spl.lamp.material.color.set(at.active ? 0xffb400 : empty ? 0x222222 : 0x3a7a3a);
        L(`slot${k}_${i}`, na ? `${u.id}${i + 1}` : `${u.id}${i + 1} · ${at.active ? "ACTIVE" : empty ? "EMPTY" : "LOADED"}`,
          na || empty ? NA : `${at.type || NA} ${at.remaining != null ? at.remaining + " %" : ""}`.trim(), at.active ? "#FFB400" : na || empty ? DIM : (at.color || "#FFB400"));
      });
      const drying = this._st(a("binary_sensor", "drying"))?.state === "on";
      if (u.dome.emissive) u.dome.emissive.setRGB(drying ? 0.5 : 0, drying ? 0.2 : 0, 0);
      u.dome.opacity = drying ? 0.22 : 0.1;
      const hid = a("sensor", "humidity"), tid = a("sensor", "temperature");
      const rh = known(hid) ? `RH ${this._st(hid).state} %` : null, at = known(tid) ? `${this._st(tid).state} °C` : null;
      L("ams" + k, `AMS ${u.id} · ${u.model}`, [rh, at].some((x) => x) ? `${rh || "RH " + NA} · ${at || NA}${drying ? " · DRYING" : ""}` : NA,
        drying ? "#FF6A00" : rh || at ? "#FFB400" : DIM, drying);
    });

    // external spools (on the model's holders, where it has them)
    for (const x of sp.filament?.external || []) {
      const at = this._st(x.entity)?.attributes || {}, na = !known(x.entity), h = this._holders[x.id];
      const empty = h ? this._spoolState(h.spool, at, s) : at.empty !== false && !at.type;
      if (at.active && !empty) activeColor = at.color;
      L(`external:${x.id}`, na ? x.tag : `${x.tag} · ${at.active ? "ACTIVE" : empty ? "EMPTY" : "LOADED"}`,
        na || empty ? NA : `${at.type || NA} ${at.remaining != null ? at.remaining + " %" : ""}`.trim(), at.active ? "#FFB400" : na || empty ? DIM : (at.color || "#FFB400"));
    }

    // laser / cutting job: the printer switches its air duct to "laser" (BamBuddy has no module entities)
    const laser = this._st(core.airduct)?.state === "laser";
    if (laser !== this._laserOn) { this._laserOn = laser; this._laser(laser); }

    // job: printed model colour, progress, HUD, screen
    const fil = this._st(core.active_filament);
    this._feedColour = fil?.attributes?.color || activeColor;
    if (this._printMat) this._printMat.color.set(this._feedColour || "#FFB400");
    const prog = (this._num(core.progress) || 0) / 100;
    this._job = { s, active, printing: s === "printing", prog: s === "finished" ? 1 : prog,
      layer: this._num(core.layer) || 0, layers: this._num(core.layers) || 0 };
    const name = this._st(core.job)?.state;
    this._hud.innerHTML = `STATUS <span>${s.replace(/_/g, " ")}</span> · PROGRESS <span>${known(core.progress) ? Math.round(prog * 100) + " %" : NA}</span>`
      + (laser ? ` · MODE <span>LASER</span>` : active ? ` · LAYER <span>${this._job.layer}/${this._job.layers}</span>` : "")
      + (name && !["unknown", "unavailable"].includes(name) ? `<br>JOB <span>${name}</span>` : "")
      + (this._gc ? `<br>MOTION <span>G-CODE REPLAY</span>${active && this._job.layers && this._gc.layerCount !== this._job.layers
          ? ` · <span class="warn">FILE HAS ${this._gc.layerCount} LAYERS, JOB ${this._job.layers}</span>` : ""}`
        : active ? "<br>MOTION <span>SIMULATED — PICK THE JOB'S FILE FOR REAL PATHS</span>" : "");
    // light key in the view tools
    const pl = this._primaryLight();
    this._lightKey?.classList.toggle("on", !!pl && this._st(pl.entity)?.state === "on");
    const heaters = sp.heaters || [], noz = heaters.find((h) => h.kind === "nozzle"), bedH = heaters.find((h) => h.kind === "bed");
    if (this._screenCanvas) this._drawScreen(s, prog, noz ? temp(noz) : { c: null }, bedH ? temp(bedH) : { c: null });
  },

  _drawScreen(s, prog, noz, bed) {
    const key = `${s}|${Math.round(prog * 100)}|${Math.round(noz.c ?? 0)}|${Math.round(bed.c ?? 0)}`;
    if (key === this._screenKey) return;
    this._screenKey = key;
    const g = this._screenCanvas.getContext("2d"), w = 512, h = 300;
    if (s === "offline" || s === "unknown") {                         // printer off: a dark panel, only a faint sheen
      const sheen = g.createLinearGradient(0, 0, w, h);
      sheen.addColorStop(0, "#0b0c0e"); sheen.addColorStop(0.45, "#151719"); sheen.addColorStop(1, "#060607");
      g.fillStyle = sheen; g.fillRect(0, 0, w, h);
      this._screenTex.needsUpdate = true;
      return;
    }
    g.fillStyle = "#101214"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#1c1f23"; g.fillRect(0, 0, w, 46);
    g.fillStyle = "#e8e8e8"; g.font = "600 24px Arial"; g.textAlign = "left"; g.fillText(this._spec().model || "", 18, 31);
    g.fillStyle = s === "printing" ? "#00ae42" : s === "failed" ? "#e53935" : "#9aa0a6";
    g.textAlign = "right"; g.fillText(s.toUpperCase(), w - 18, 31);
    g.textAlign = "left"; g.fillStyle = "#ffffff"; g.font = "700 92px Arial"; g.fillText(`${Math.round(prog * 100)}%`, 18, 150);
    g.fillStyle = "#2a2e33"; g.fillRect(18, 178, w - 36, 16);
    g.fillStyle = "#00ae42"; g.fillRect(18, 178, (w - 36) * prog, 16);
    g.fillStyle = "#c9ccd1"; g.font = "500 26px Arial";
    g.fillText(`Nozzle ${Math.round(noz.c ?? 0)}°`, 18, 250);
    g.fillText(`Bed ${Math.round(bed.c ?? 0)}°`, 270, 250);
    this._screenTex.needsUpdate = true;
  },

  // A spool from its sensor's attributes: winding in the filament colour, sized by what is left (3/4 when unknown),
  // glowing while it feeds, turning while it prints. Returns whether it is empty.
  _spoolState(sp, at, status) {
    const empty = at.empty !== false && !at.type;
    sp.fil.visible = !empty;
    if (!empty) {
      const col = new this.T.Color(at.color || "#888888");
      sp.fil.material.color.copy(col);
      const rem = at.remaining != null ? at.remaining / 100 : 0.75;
      const rad = 30 + 64 * Math.max(0.04, rem);
      sp.fil.scale.set(1, rad, rad);   // unit-radius cylinder along X: scale its round axes
      sp.fil.material.emissive.copy(col).multiplyScalar(at.active ? 0.25 : 0);
    }
    sp.spin = !empty && at.active && status === "printing";
    return empty;
  },

  _placeLabels() {
    const T3 = this.T, v = new T3.Vector3(), w = this._wrap.clientWidth, h = this._wrap.clientHeight, shown = [];
    const seen = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
    for (const l of this._labels) {
      if (!seen(l.anchor)) { l.el.style.display = "none"; continue; }
      l.anchor.getWorldPosition(v);
      v.x += l.off[0]; v.y += l.off[1]; v.z += l.off[2];
      v.project(this._cam);
      if (v.z > 1) { l.el.style.display = "none"; continue; }
      l.el.style.display = "";
      if (!l.size) { const b = l.el.querySelector(".box"); l.size = [b.offsetWidth, b.offsetHeight]; }
      l.sx = (v.x + 1) / 2 * w; l.sy = (1 - v.y) / 2 * h;
      shown.push(l);
    }
    shown.sort((p, q) => q.sy - p.sy);
    const placed = [];
    for (const l of shown) {
      const [bw, bh] = l.size;
      let dy = 0, r;
      for (; dy < 260; dy += 4) {
        r = [l.sx - 1, l.sy - 12 - dy - bh, l.sx - 1 + bw, l.sy - 12 - dy];
        if (!placed.some((o) => r[0] < o[2] + 3 && r[2] + 3 > o[0] && r[1] < o[3] + 2 && r[3] + 2 > o[1])) break;
      }
      placed.push(r);
      l.el.style.setProperty("--dy", dy + "px");
      l.el.style.transform = `translate(${l.sx.toFixed(1)}px, ${l.sy.toFixed(1)}px)`;
    }
  },
});
