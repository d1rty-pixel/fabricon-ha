// Camera overlay over the model: live picture, fit, fullscreen / snapshot.
Object.assign(FabriconCard.prototype, {
  // camera overlay: HA's picture-entity card (live stream) in a frame kept at 16:9 inside the overlay
  async _camera(open) {
    if (!this._cfg.camera) return;
    this._camOpen = open;
    this._camEl.classList.toggle("open", open);
    this.shadowRoot.querySelector('.tools button[data-k="camera"]').classList.toggle("on", open);
    if (open && !this._camCard) {
      this._camEntity = this._cfg.camera;
      this._camCard = await this._makeCard({ type: "picture-entity", entity: this._cfg.camera, camera_view: "live", show_name: false, show_state: false, aspect_ratio: "16:9" });
      this._camEl.querySelector(".cam-frame").appendChild(this._camCard);
    }
    if (!open && document.fullscreenElement === this._camEl) document.exitFullscreen();
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
    a.download = `x2d-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.jpg`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  },
});
