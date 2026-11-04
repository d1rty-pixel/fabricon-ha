// Fly-out sidebar: open a panel, the AMS panel's per-unit cards, finding the connected AMS units.
Object.assign(FabriconCard.prototype, {
  // one section at a time; its cards are created on first open and kept. A panel with per-AMS cards shows one unit
  // at a time (amsId, else the last chosen), picked in a dropdown when there is more than one
  async _openPanel(key, amsId) {
    this._panel = key;
    try { key ? localStorage.setItem("fabricon-panel", key) : localStorage.removeItem("fabricon-panel"); } catch (_) { /* fine */ }
    this._rail.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.k === key));
    this._side.classList.toggle("open", !!key);
    if (!key) return;
    const p = this._cfg.panels.find((q) => q.key === key);
    this.shadowRoot.querySelector(".side .side-head span").textContent = p.name;
    this._secs = this._secs || {};
    for (const el of Object.values(this._secs)) el.style.display = "none";
    if (!this._secs[key]) {
      const sec = document.createElement("div");
      sec.className = "side-sec";
      this._secs[key] = sec;
      this._sideBody.appendChild(sec);
      {
        if (p.per_ams) {
          const pick = document.createElement("label");
          pick.className = "fab-key amspick";
          pick.innerHTML = `<ha-icon icon="mdi:tray-full"></ha-icon><select data-fab-select>${this._units.map((u) => `<option value="${u.id}">AMS ${u.id} · ${u.model}</option>`).join("")}</select>`;
          pick.style.display = this._units.length > 1 ? "" : "none";
          pick.querySelector("select").addEventListener("change", (ev) => this._showAms(key, ev.target.value));
          sec._units = document.createElement("div");
          sec._units.className = "side-sec";
          sec._per = {};
          sec.append(pick, sec._units);
        }
        for (const c of p.cards || []) sec.appendChild(await this._makeCard(c));
      }
    }
    this._secs[key].style.display = "";
    if (p.per_ams) await this._showAms(key, amsId);
  },

  // the AMS panel on one unit: its cards are made on first view and kept
  async _showAms(key, id) {
    const sec = this._secs?.[key], p = this._cfg.panels.find((q) => q.key === key);
    if (!sec?._units) return;
    if (!id) try { id = this._amsSel || localStorage.getItem("fabricon-ams-unit"); } catch (_) { /* first unit */ }
    const u = this._units.find((x) => x.id === id) || this._units[0];
    if (!u) return;
    this._amsSel = u.id;
    try { localStorage.setItem("fabricon-ams-unit", u.id); } catch (_) { /* per-viewer convenience only */ }
    sec.querySelector(".amspick select").value = u.id;
    for (const el of Object.values(sec._per)) el.style.display = "none";
    if (!sec._per[u.id]) {
      const box = sec._per[u.id] = document.createElement("div");
      box.className = "side-sec";
      sec._units.appendChild(box);
      for (const c of this._perAms(p, u)) box.appendChild(await this._makeCard(c));
    }
    sec._per[u.id].style.display = "";
  },

  // clicking an AMS (model or label) opens the AMS panel on that unit
  _openAms(id) {
    const p = (this._cfg.panels || []).find((q) => q.per_ams);
    if (p) this._openPanel(p.key, id);
  },

  // a panel's per-AMS cards for one unit, its prefix, letter and device id filled in
  _perAms(p, u) {
    const src = JSON.stringify(p.per_ams);
    return JSON.parse(src.replaceAll("__AMS_DEV__", u.dev).replaceAll("__AMS_ID__", u.id).replaceAll("__AMS__", u.prefix));
  },

  // AMS units: the devices the integration hangs under the printer, with a humidity sensor. One the printer, while
  // online, gets nothing from is not connected and left out; with the printer off every registered unit is shown.
  // The registry scan runs only when HA hands out new registries.
  _findAms() {
    const h = this._hass;
    if (this._cfg.ams === false || !h?.entities || !h?.devices) return [];
    if (this._amsReg?.[0] !== h.entities || this._amsReg?.[1] !== h.devices) {
      const pdev = h.entities[`sensor.${this._cfg.printer}_print_status`]?.device_id, found = [];
      for (const d of Object.values(h.devices)) {
        if (!pdev || d.via_device_id !== pdev) continue;
        const ids = Object.values(h.entities).filter((x) => x.device_id === d.id).map((x) => x.entity_id);
        const hum = ids.find((x) => /^sensor\..+_humidity$/.test(x));
        if (!hum) continue;
        const prefix = hum.slice(7, -"_humidity".length);
        found.push({ prefix, dev: d.id, id: (d.name_by_user || d.name || "").match(/\bAMS ([A-H])\b/)?.[1],
          model: (d.model || "AMS").toUpperCase(), slots: ids.filter((x) => x.startsWith(`sensor.${prefix}_slot_`)).length || 4 });
      }
      found.sort((x, y) => (x.id || "Z").localeCompare(y.id || "Z"));
      found.forEach((u, i) => { u.id ||= "ABCDEFGH"[i]; });
      this._amsReg = [h.entities, h.devices, found];
    }
    const online = this._st(`binary_sensor.${this._cfg.printer}_online`)?.state === "on";
    return this._amsReg[2].filter((u) => !online || !["unavailable", "unknown"].includes(this._st(`sensor.${u.prefix}_humidity`)?.state ?? "unavailable"));
  },
});
