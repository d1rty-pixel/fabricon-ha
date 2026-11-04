// Camera overlay over the model: live picture, fit, fullscreen / snapshot.
Object.assign(FabriconCard.prototype, {
  // the printer's cameras (spec), or the single one of an older config
  _cams() {
    const cs = (this._spec().cameras || []).filter((c) => c.entity);
    return cs.length ? cs : this._cfg.camera ? [{ id: "main", label: "Camera", entity: this._cfg.camera }] : [];
  },

  // camera overlay: HA's picture-entity card (live stream) in a frame kept at 16:9 inside the overlay; with several
  // cameras a dropdown in its head switches between them (id: open that one, e.g. from a click on the model)
  async _camera(open, id) {
    const cams = this._cams();
    if (!cams.length) return;
    this._camOpen = open;
    this._camEl.classList.toggle("open", open);
    this.shadowRoot.querySelector('.tools button[data-k="camera"]').classList.toggle("on", open);
    const pick = this._camEl.querySelector(".campick");
    if (!pick.options.length) {
      pick.innerHTML = cams.map((c) => `<option value="${c.entity}">${c.label}</option>`).join("");
      pick.parentNode.style.display = cams.length > 1 ? "" : "none";
      pick.addEventListener("change", () => this._camShow(pick.value));
    }
    const want = cams.find((c) => c.id === id)?.entity;
    if (open && (want || !this._camCard)) await this._camShow(want || this._camEntity || cams[0].entity);
    if (!open && document.fullscreenElement === this._camEl) document.exitFullscreen();
    this._camFit();
  },

  async _camShow(entity) {
    if (this._camCard && this._camEntity === entity) return;
    this._camEntity = entity;
    this._camEl.querySelector(".campick").value = entity;
    this._camCard?.remove();
    this._kids = this._kids.filter((k) => k !== this._camCard);
    this._camCard = await this._makeCard({ type: "picture-entity", entity, camera_view: "live", show_name: false, show_state: false, aspect_ratio: "16:9" });
    this._camEl.querySelector(".cam-frame").appendChild(this._camCard);
    this._camFit();
  },

  _camFit() {
    const body = this.shadowRoot?.querySelector(".cam-body"), frame = this.shadowRoot?.querySelector(".cam-frame");
    if (!body || !frame) return;
    const w = body.clientWidth - 20, h = body.clientHeight - 10;
    frame.style.width = Math.max(0, Math.min(w, h * 16 / 9)) + "px";
  },

  async _camAction(what) {
    if (what === "close") return this._camera(false);
    if (what === "full") {
      if (document.fullscreenElement) document.exitFullscreen();
      else this._camEl.requestFullscreen?.();
      return;
    }
    // snapshot: the camera proxy URL HA hands out (it carries the access token), saved as a JPG
    const st = this._hass?.states[this._camEntity];
    if (!st?.attributes?.entity_picture) return;
    const blob = await (await fetch(st.attributes.entity_picture, { cache: "no-store" })).blob();
    const d = new Date(), pad = (n) => String(n).padStart(2, "0");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(this._spec().model || "printer").toLowerCase().replace(/\W+/g, "-")}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.jpg`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  },
});
