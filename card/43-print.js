// Print dock (the dashboard's main job, beside the model on wide screens, under it on narrow ones): the printer's USB
// stick through the fabricon proxy (Bambuddy behind Home Assistant's login, see custom_components/fabricon). Picking a file loads it
// into the 3D view and shows its plate, the filament -> slot mapping and print options. The START key sits in the
// control strip; it asks whether the plate is empty, marks it cleared in Bambuddy and queues the file there, which
// sends it to the printer (Bambuddy can't start a file from the stick itself: it goes through its library).
const SLICED_RE = /\.gcode\.3mf$/i;
const READY_STATES = ["idle", "finished", "failed"];
const escHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const durText = (s) => (!s ? "—" : s >= 3600 ? `${Math.floor(s / 3600)} H ${Math.round((s % 3600) / 60)} MIN` : `${Math.max(1, Math.round(s / 60))} MIN`);
const colDist = (a, b) => {
  const rgb = (c) => { const m = /^#?([0-9a-f]{6})/i.exec(c || ""); return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : null; };
  const x = rgb(a), y = rgb(b);
  return x && y ? Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) : 999;
};
const sameType = (a, b) => String(a || "").trim().toUpperCase() === String(b || "").trim().toUpperCase();

// plate, time, weight, objects and filaments of a sliced .gcode.3mf. A filament's extruder: the slicer's logical
// extruder (filament_maps, 1-based) through physical_extruder_map -> the printer's id (X2D: 0 = right, 1 = left)
async function sliceInfo(buf) {
  const [si] = await zipTexts(buf, /^Metadata\/slice_info\.config$/), [ps] = await zipTexts(buf, /^Metadata\/project_settings\.config$/);
  if (!si) throw new Error("no slice info in this file: not a sliced .gcode.3mf");
  const plate = new DOMParser().parseFromString(si, "text/xml").querySelector("plate");
  const meta = (k) => plate?.querySelector(`metadata[key="${k}"]`)?.getAttribute("value");
  let phys = null;
  try { phys = JSON.parse(ps || "{}").physical_extruder_map; } catch (_) { /* single nozzle */ }
  const maps = (meta("filament_maps") || "").split(/\s+/).filter(Boolean).map(Number);
  const filaments = [...(plate?.querySelectorAll("filament") || [])].map((f) => {
    const id = +f.getAttribute("id"), lg = maps[id - 1];
    return { id, type: f.getAttribute("type"), color: f.getAttribute("color"), idx: f.getAttribute("tray_info_idx"),
      grams: +f.getAttribute("used_g") || 0, ext: !lg ? null : phys?.[lg - 1] != null ? +phys[lg - 1] : lg === 1 ? 1 : 0 };
  });
  return { plate: +(meta("index") || 1), time: +meta("prediction") || null, grams: +meta("weight") || null, filaments,
    objects: [...(plate?.querySelectorAll("object") || [])].map((o) => o.getAttribute("name")) };
}

Object.assign(FabriconCard.prototype, {
  async _api(action, params, body) {
    const q = new URLSearchParams(params || {}).toString();
    const r = await this._hass.fetchWithAuth(`/api/fabricon/${encodeURIComponent(this._cfg.serial)}/${action}${q ? "?" + q : ""}`,
      body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
    if (!r.ok) {
      let msg = `HTTP ${r.status}`;
      try { msg = (await r.json()).error || msg; } catch (_) { /* not JSON */ }
      throw new Error(msg);
    }
    return r;
  },

  _printSection(dock) {
    dock.innerHTML = `<div class="dock-in"><div class="side-head dhead" title="Show / hide the print list"><span>Print // F-00</span>
      <button class="dtoggle"><ha-icon icon="mdi:chevron-left"></ha-icon></button></div><div class="files">
      <div class="phead"><span class="pwhere"></span><button class="act prefresh" title="Read the stick again">↻</button></div>
      <div class="plist"></div><div class="pjob"></div></div></div>`;
    const P = this._pl = { path: "/", meta: {}, thumbs: {}, opts: { bed_levelling: "auto", flow_cali: "auto", timelapse: false } };
    P.list = dock.querySelector(".plist");
    P.job = dock.querySelector(".pjob");
    P.where = dock.querySelector(".pwhere");
    dock.querySelector(".prefresh").addEventListener("click", () => this._printList());
    // collapsible (remembered per browser): a narrow strip beside the model, only its head under it
    const shut = (on) => {
      this._card.classList.toggle("dockshut", on);
      try { on ? localStorage.setItem("fabricon-dock", "shut") : localStorage.removeItem("fabricon-dock"); } catch (_) { /* fine */ }
    };
    dock.querySelector(".dhead").addEventListener("click", () => shut(!this._card.classList.contains("dockshut")));
    try { if (localStorage.getItem("fabricon-dock") === "shut") this._card.classList.add("dockshut"); } catch (_) { /* open */ }
    P.list.addEventListener("click", (ev) => {
      const b = ev.target.closest(".pf");
      if (!b) return;
      if (b.dataset.dir != null) { P.path = b.dataset.dir; this._printList(); return; }
      const f = P.files[+b.dataset.i];
      if (f && f !== P.sel) this._printPick(f);
    });
    P.job.addEventListener("click", (ev) => {                 // option keys cycle auto -> on -> off
      const b = ev.target.closest("[data-o]"), o = b?.dataset.o;
      if (!o) return;
      P.opts[o] = o === "timelapse" ? !P.opts[o] : { auto: "on", on: "off", off: "auto" }[P.opts[o]];
      b.textContent = this._optText(o);
    });
    P.job.addEventListener("change", (ev) => {
      const s = ev.target.closest("select[data-f]");
      if (!s) return;
      P.map[+s.dataset.f] = +s.value;
      this._printJob();
    });
    this._printList();
  },

  // ------------------------------------------------------------------ the file list

  async _printList() {
    const P = this._pl;
    P.usb = this._st(this._spec().core?.usb)?.state;
    P.where.textContent = `PRINTER · ${this._storage()}${P.path !== "/" ? " · " + P.path : ""}`;
    const st = this._st(this._spec().core?.status)?.state;
    P.online = !!st && !["offline", "unknown", "unavailable"].includes(st);
    if (!P.online) { P.files = []; P.list.innerHTML = `<div class="pnote">PRINTER OFFLINE</div>`; return; }
    if (P.usb === "off") { P.files = []; P.list.innerHTML = `<div class="pnote">NO ${this._storage()} IN THE PRINTER</div>`; return; }
    P.list.innerHTML = `<div class="pnote">READING THE ${this._storage()} …</div>`;
    let d;
    try { d = await (await this._api("files", { path: P.path })).json(); }
    catch (err) { P.files = []; P.list.innerHTML = `<div class="pnote warn">${escHtml(err.message)}</div>`; return; }
    if (d.warnings?.includes("printer_unavailable")) { P.files = []; P.list.innerHTML = `<div class="pnote warn">PRINTER NOT REACHABLE</div>`; return; }
    const all = d.files || [], dirs = all.filter((f) => f.is_directory), files = all.filter((f) => !f.is_directory && SLICED_RE.test(f.name));
    files.sort((a, b) => a.name.localeCompare(b.name));
    P.files = files;
    const up = P.path === "/" ? null : P.path.replace(/\/[^/]+\/?$/, "") || "/";
    const other = all.length - dirs.length - files.length;
    P.list.innerHTML = [
      up != null ? `<button class="pf dir" data-dir="${escHtml(up)}"><span class="th"><ha-icon icon="mdi:arrow-up"></ha-icon></span><span class="pt"><b>..</b></span></button>` : "",
      ...dirs.map((f) => `<button class="pf dir" data-dir="${escHtml(f.path)}"><span class="th"><ha-icon icon="mdi:folder-outline"></ha-icon></span><span class="pt"><b>${escHtml(f.name)}</b></span></button>`),
      ...files.map((f, i) => `<button class="pf" data-i="${i}"><span class="th"><ha-icon icon="mdi:cube-outline"></ha-icon></span><span class="pt"><b>${escHtml(f.name)}</b><small>…</small></span></button>`),
      !files.length ? `<div class="pnote">NO SLICED FILES (.GCODE.3MF) HERE</div>` : "",
      other ? `<div class="pnote">${other} OTHER FILE${other > 1 ? "S" : ""} NOT SHOWN</div>` : "",
    ].join("");
    this._printRows();
    // the file in the 3D view came from this stick: select it again (from the stored copy, no download)
    if (!P.sel) {
      let job = null;
      try { job = await idb("readonly", (st) => st.get(this._jobKey())); } catch (_) { /* no storage */ }
      const f = job?.usb && files.find((x) => x.path === job.usb && x.size === job.size);
      if (f) this._printPick(f, job.data);
    }
    // details and thumbnails one after the other (Bambuddy fetches each file from the printer for them)
    for (const [i, f] of files.entries()) {
      if (P.files !== files) return;
      const key = `${f.path}|${f.size}|${f.mtime}`;
      if (!P.meta[key]) {
        try { P.meta[key] = (await (await this._api("plates", { path: f.path })).json()).plates?.[0] || {}; } catch (_) { P.meta[key] = {}; }
      }
      const m = P.meta[key], row = P.list.querySelector(`.pf[data-i="${i}"]`);
      if (!row) continue;
      const fil = (m.filaments || []).map((x) => `<i class="fdot" style="--c:${escHtml(x.color)}"></i>${escHtml(x.type)}`).join(" ");
      row.querySelector("small").innerHTML = m.print_time_seconds ? `${durText(m.print_time_seconds)} · ${m.filament_used_grams ?? "—"} G · ${fil}` : "—";
      if (m.has_thumbnail) {
        const url = await this._printThumb(f, key);
        if (url && P.list.contains(row)) row.querySelector(".th").innerHTML = `<img src="${url}" alt="">`;
        const jt = P.sel === f && P.job.querySelector(".pcard .th");
        if (url && jt) jt.innerHTML = `<img src="${url}" alt="">`;
      }
    }
  },

  _printThumb(f, key) {
    const P = this._pl;
    return (P.thumbs[key] ||= this._api("thumb", { path: f.path, plate: 1 }).then((r) => r.blob()).then((b) => URL.createObjectURL(b)).catch(() => null));
  },

  _printRows() {
    const P = this._pl;
    P.list.querySelectorAll(".pf[data-i]").forEach((b) => b.classList.toggle("on", P.files[+b.dataset.i] === P.sel));
  },

  // ------------------------------------------------------------------ one file: details, mapping, start

  // buf given: the stored copy, already in the 3D view
  async _printPick(f, buf) {
    const P = this._pl;
    Object.assign(P, { sel: f, info: null, map: null, queue: null });
    this._printRows();
    this._printState();
    P.job.innerHTML = `<div class="pnote">LOADING ${escHtml(f.name)} …</div>`;
    if (!buf) this._busy(true, f.name);                     // the download, before the parse takes over
    try {
      const own = !buf;
      const [data, trays] = await Promise.all([buf || this._api("file", { path: f.path }).then((r) => r.arrayBuffer()), this._api("trays").then((r) => r.json())]);
      if (P.sel !== f) return;
      P.trays = trays;
      P.info = await sliceInfo(data);
      P.map = this._autoMap(P.info.filaments, trays);
      if (own) {
        try { await idb("readwrite", (st) => st.put({ name: f.name, data, at: Date.now(), usb: f.path, size: f.size }, this._jobKey())); } catch (_) { /* view only */ }
        await this._useFile(f.name, data);
      }
      P.viewErr = this._source?.kind === "error" ? this._source.err : null;
    } catch (err) {
      if (P.sel === f) P.job.innerHTML = `<div class="pnote warn">${escHtml(f.name)}<br>${escHtml(err.message)}</div>`;
      return;
    } finally { if (!buf) this._busy(false); }
    this._printJob(!buf);
  },

  // each filament to a loaded slot on its nozzle: same preset and colour, else same type and colour, else the
  // same type in the nearest colour; a slot is used once
  _autoMap(fils, trays) {
    const used = new Set(), map = {};
    for (const f of fils) {
      const ok = trays.filter((t) => !used.has(t.tray) && sameType(t.type, f.type) && (f.ext == null || t.extruder == null || t.extruder === f.ext));
      const near = (t) => colDist(t.color, f.color) < 40;
      const t = ok.find((x) => x.idx === f.idx && near(x)) || ok.find(near) || ok.sort((a, b) => colDist(a.color, f.color) - colDist(b.color, f.color))[0];
      map[f.id] = t ? t.tray : -1;
      if (t) used.add(t.tray);
    }
    return map;
  },

  // the printer's storage: a USB stick or (older models) a microSD card
  _storage() { return (this._spec().core?.usb || "").endsWith("_sd_card") ? "SD CARD" : "USB STICK"; },

  _trayName(t) {
    const ext = this._spec().filament?.external || [];
    return t.ams >= 254 ? (ext.length < 2 ? "EXT" : t.tray === 255 ? "EXT R" : "EXT L") : t.ams >= 128 ? `HT ${t.ams - 127}` : `${"ABCDEFGH"[t.ams] || "?"}${t.slot + 1}`;
  },

  // reveal: scroll the stacked dock to it (a pick by hand, not the restore after a reload)
  _printJob(reveal) {
    const P = this._pl, f = P.sel, i = P.info;
    if (!f || !i) return;
    const key = Object.keys(P.meta).find((k) => k.startsWith(f.path + "|"));
    const nozzle = (x) => (x == null ? "" : x === 1 ? " · LEFT NOZZLE" : " · RIGHT NOZZLE");
    const rows = i.filaments.map((x) => {
      const opts = P.trays.filter((t) => x.ext == null || t.extruder == null || t.extruder === x.ext);
      const t = P.trays.find((q) => q.tray === P.map[x.id]);
      const tag = !t ? `<em class="warn">NOT MAPPED · LOAD ${escHtml(x.type)} ON THE ${x.ext === 1 ? "LEFT" : x.ext === 0 ? "RIGHT" : ""} NOZZLE</em>`
        : !sameType(t.type, x.type) ? `<em class="warn">WRONG MATERIAL · ${escHtml(t.type)} INSTEAD OF ${escHtml(x.type)}</em>`
        : colDist(t.color, x.color) >= 40 ? `<em>OTHER COLOUR · <i class="fdot" style="--c:${escHtml(t.color)}"></i>${escHtml(t.color)}</em>` : `<em class="ok">MATCH</em>`;
      return `<div class="pmap"><span><i class="fdot" style="--c:${escHtml(x.color)}"></i>${x.id} · ${escHtml(x.type)} · ${x.grams} G${nozzle(x.ext)}</span>
        <label class="fab-key fab-sel"><select data-fab-select data-f="${x.id}"><option value="-1">— NONE</option>${opts.map((t) => `<option value="${t.tray}" ${t.tray === P.map[x.id] ? "selected" : ""}>${this._trayName(t)} · ${escHtml(t.type)} ${escHtml(t.name)} ${escHtml(t.color || "")}</option>`).join("")}</select></label>${tag}</div>`;
    }).join("");
    P.job.innerHTML = `<div class="phead"><span>JOB</span></div>
      <div class="pcard"><span class="th"><ha-icon icon="mdi:cube-outline"></ha-icon></span><div><b>${escHtml(f.name)}</b>
        <small>PLATE ${i.plate} · ${durText(i.time)} · ${i.grams ?? "—"} G</small><small>${escHtml(i.objects.join(", "))}</small>
        ${P.viewErr ? `<small class="warn">3D VIEW: ${escHtml(P.viewErr)}</small>` : ""}</div></div>
      <div class="phead"><span>FILAMENT → SLOT</span></div>${rows || `<div class="pnote">NO FILAMENT INFO</div>`}
      <div class="phead"><span>OPTIONS</span></div>
      <div class="popts">${["bed_levelling", "flow_cali", "timelapse"].map((o) => `<button data-o="${o}">${this._optText(o)}</button>`).join("")}</div>
      <div class="pstat"></div>`;
    if (key && P.meta[key]?.has_thumbnail) this._printThumb(f, key).then((u) => { const th = P.job.querySelector(".pcard .th"); if (u && th && P.sel === f) th.innerHTML = `<img src="${u}" alt="">`; });
    P.stateKey = null;
    this._printState();
    if (reveal) this._printReveal(P.job);
  },

  // on stacked layouts the dock scrolls by itself: bring a part of it into view
  _printReveal(el) {
    const box = this._dock?.querySelector(".dock-in");
    if (!box || !el || !this._card.classList.contains("stack")) return;
    const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top;
    if (top < 0 || top > box.clientHeight - 60) box.scrollBy({ top: top - 8, behavior: "smooth" });
  },

  _optText(o) {
    const v = this._pl.opts[o];
    return `${{ bed_levelling: "BED LEVELLING", flow_cali: "FLOW CALIBRATION", timelapse: "TIMELAPSE" }[o]} · ${v === true ? "ON" : v === false ? "OFF" : v.toUpperCase()}`;
  },

  // the START key in the control strip: what it would start, or why it can't; the queue state under the options
  _startKey() {
    const b = this._startEl = document.createElement("button");
    b.className = "startkey";
    b.innerHTML = `<ha-icon icon="mdi:play"></ha-icon><span><b>START PRINT</b><small></small></span>`;
    b.addEventListener("click", () => { if (!b.disabled) this._printConfirm(true); });
    return b;
  },

  // from _apply on every state change and after each step here; redrawn only when something changed
  _printState() {
    const P = this._pl, b = this._startEl;
    if (!P || !b) return;
    const core = this._spec().core || {}, s = this._st(core.status)?.state, usb = this._st(core.usb)?.state;
    const online = !!s && !["offline", "unknown", "unavailable"].includes(s);
    if ((P.usb !== undefined && usb !== P.usb) || (P.online !== undefined && online !== P.online)) this._printList();
    const i = P.info, q = P.queue, unmapped = i?.filaments.some((x) => !(P.map[x.id] >= 0));
    const why = !s || ["offline", "unknown", "unavailable"].includes(s) ? "PRINTER OFFLINE"
      : q && ["sending", "pending"].includes(q.status) ? "QUEUED"
      : !READY_STATES.includes(s) ? `PRINTER IS ${s.replace(/_/g, " ").toUpperCase()}`
      : usb === "off" ? `NO ${this._storage()}` : !P.sel ? "PICK A FILE IN THE PRINT LIST" : !i ? "READING THE FILE …"
      : unmapped ? "MAP EVERY FILAMENT TO A SLOT" : null;
    const key = [why, P.sel?.path, q?.status, q?.text].join("|");
    if (key === P.stateKey) return;
    P.stateKey = key;
    b.disabled = !!why;
    b.querySelector("small").textContent = why || `${P.sel.name.replace(SLICED_RE, "")} · ${durText(i.time)}`;
    const stat = P.job.querySelector(".pstat");
    if (!stat) return;
    stat.className = `pstat ${q?.status === "failed" ? "warn" : ""}`;
    stat.textContent = !q ? "" : q.status === "sending" ? "COPYING THE FILE TO BAMBUDDY …"
      : q.status === "pending" ? `QUEUED IN BAMBUDDY${q.text ? " · " + q.text : " · SENDING TO THE PRINTER"}`
      : q.status === "printing" ? "SENT · THE PRINTER STARTS" : q.status === "failed" ? `FAILED · ${q.text}` : `${String(q.status).toUpperCase()}${q.text ? " · " + q.text : ""}`;
  },

  // START asks first: the job, its slots, and whether the build plate is empty
  _printConfirm(open) {
    let m = this.shadowRoot.querySelector(".modal");
    if (!open) { m?.remove(); return; }
    const P = this._pl, f = P.sel, i = P.info;
    const slots = i.filaments.map((x) => {
      const t = P.trays.find((q) => q.tray === P.map[x.id]);
      return `<i class="fdot" style="--c:${escHtml(x.color)}"></i>${escHtml(x.type)} → ${t ? this._trayName(t) : "—"}`;
    }).join(" · ");
    m = document.createElement("div");
    m.className = "modal";
    m.innerHTML = `<div class="mbox"><div class="side-head"><span>Start print // confirm</span></div>
      <div class="pcard"><span class="th"><ha-icon icon="mdi:cube-outline"></ha-icon></span><div><b>${escHtml(f.name)}</b>
        <small>PLATE ${i.plate} · ${durText(i.time)} · ${i.grams ?? "—"} G</small><small>${slots}</small></div></div>
      <div class="mq">IS THE BUILD PLATE EMPTY?</div>
      <div class="mnote">The printer starts right away. Take the last print off the plate first.</div>
      <div class="mbtns"><button class="act mno">Cancel</button><button class="act myes">Plate is empty · start</button></div></div>`;
    const key = Object.keys(P.meta).find((k) => k.startsWith(f.path + "|"));
    if (key && P.meta[key]?.has_thumbnail) this._printThumb(f, key).then((u) => { const th = m.querySelector(".th"); if (u && th) th.innerHTML = `<img src="${u}" alt="">`; });
    m.addEventListener("click", (ev) => {
      if (ev.target === m || ev.target.closest(".mno")) this._printConfirm(false);
      else if (ev.target.closest(".myes")) { this._printConfirm(false); this._printStart(); }
    });
    this._card.appendChild(m);
  },

  async _printStart() {
    const P = this._pl, f = P.sel, i = P.info;
    const mapping = Array(Math.max(0, ...i.filaments.map((x) => x.id))).fill(-1);
    for (const x of i.filaments) mapping[x.id - 1] = P.map[x.id];
    P.queue = { status: "sending", text: "" };
    this._printState();
    try {
      await this._plateCleared();
      const item = await (await this._api("print", null, { path: f.path, plate_id: i.plate, ams_mapping: mapping, ...P.opts })).json();
      P.queue = { id: item.id, status: item.status, text: item.waiting_reason || "" };
      this._printPoll();
    } catch (err) { P.queue = { status: "failed", text: err.message }; }
    this._printState();
  },

  async _printPoll() {
    const P = this._pl, q = P.queue;
    clearTimeout(P.pollT);
    if (!q?.id || q.status !== "pending") return;
    try {
      const it = await (await this._api("queue", { id: q.id })).json();
      Object.assign(q, { status: it.status, text: it.error_message || it.waiting_reason || "" });
    } catch (err) { q.text = err.message; }
    this._printState();
    if (q.status === "pending" && P.queue === q) P.pollT = setTimeout(() => this._printPoll(), 3000);
  },

  // the user said the plate is empty: tell Bambuddy (its queue waits for that after every finished / failed job)
  // and wait until it reports the plate clear
  async _plateCleared() {
    const need = this._spec().core?.plate_needed, btn = this._spec().core?.plate_cleared;
    if (this._st(need)?.state !== "on" || !this._st(btn)) return;
    await this._hass.callService("button", "press", { entity_id: btn });
    for (let k = 0; k < 20 && this._st(need)?.state === "on"; k++) await new Promise((r) => setTimeout(r, 500));
    if (this._st(need)?.state === "on") throw new Error("Bambuddy still reports the plate as not cleared");
  },
});
