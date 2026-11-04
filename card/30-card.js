// The card element: config, DOM shell, hass updates, lifecycle, three.js setup (_init), Lovelace cards in the
// sidebar / footer (_makeCard), the rail and tool buttons (_chrome). Other methods live in the later files.
class FabriconCard extends HTMLElement {
  setConfig(config) {
    if (!config.printer) throw new Error("fabricon-card: 'printer' (the printer's entity prefix) is required");
    this._cfg = { ams: true, ...config };
    const sub = this.shadowRoot?.querySelector(".ld-sub");
    if (sub && !sub.textContent) sub.textContent = config.printer_spec?.model || "";
    this._units = [];
    if (!this.shadowRoot) {
      this._buildDom();
    }
    if (config.height && config.height !== "fill") this._card.style.height = config.height;
  }

  _buildDom() {
    {
      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = `<style>${CSS}</style><div class="card"><div class="main"><div class="dock"></div>
        <div class="wrap busy"><div class="ld"><div class="ld-scan"></div><div class="ld-box"><b>Loading model</b><small class="ld-sub"></small><i class="ld-bar"></i></div></div><div class="labels"></div>
        <div class="offline"><div class="off-frame"></div><div class="off-msg">Printer offline</div></div>
        <div class="tools"><button class="fab-key on" title="Labels" data-k="labels"><ha-icon icon="mdi:label-outline"></ha-icon>Labels</button>
        <button class="fab-key" title="X-ray" data-k="xray"><ha-icon icon="mdi:eye-outline"></ha-icon>X-ray</button>
        <button class="fab-key" title="Rotate" data-k="spin"><ha-icon icon="mdi:rotate-3d-variant"></ha-icon>Rotate</button>
        <label class="fab-key" title="AMS position"><ha-icon icon="mdi:tray-full"></ha-icon><select class="amssel" data-fab-select><option value="top">AMS on top</option>
        <option value="left">AMS left</option><option value="right">AMS right</option></select></label>
        <button class="fab-key" title="Reset view" data-k="reset"><ha-icon icon="mdi:camera-flip-outline"></ha-icon>Reset view</button>
        <button class="fab-key" title="Chamber light" data-k="light"><ha-icon icon="mdi:lightbulb-outline"></ha-icon>Light</button>
        <button class="fab-key" title="Camera" data-k="camera"><ha-icon icon="mdi:cctv"></ha-icon>Camera</button></div>
        <div class="rail"></div><div class="hud"></div>
        <div class="cam"><div class="cam-head"><span><b>Camera // C-01</b></span>
          <label class="fab-key" title="Camera"><ha-icon icon="mdi:cctv"></ha-icon><select class="campick" data-fab-select></select></label>
          <button class="fab-key" title="Fullscreen" data-c="full"><ha-icon icon="mdi:fullscreen"></ha-icon>Fullscreen</button>
          <button class="fab-key" title="Snapshot" data-c="snap"><ha-icon icon="mdi:camera-outline"></ha-icon>Snapshot</button>
          <button class="fab-key" title="Close" data-c="close"><ha-icon icon="mdi:close"></ha-icon>Close</button></div>
          <div class="cam-body"><div class="cam-frame"></div></div></div></div>
        <div class="side"><div class="side-in"><div class="side-head"><span></span><button title="Close">✕</button></div><div class="side-body"></div></div></div>
        </div><div class="foot"></div></div>`;
      this._card = root.querySelector(".card");
      root.querySelector(".ld-sub").textContent = this._cfg.printer_spec?.model || "";
      this._wrap = root.querySelector(".wrap");
      this._side = root.querySelector(".side");
      this._sideBody = root.querySelector(".side-body");
      this._rail = root.querySelector(".rail");
      this._foot = root.querySelector(".foot");
      this._dock = root.querySelector(".dock");
      this._kids = [];
      this._camEl = root.querySelector(".cam");
      this._camEl.querySelectorAll("button[data-c]").forEach((b) => b.addEventListener("click", (ev) => { ev.stopPropagation(); this._camAction(b.dataset.c); }));
      ["pointerdown", "pointerup", "click", "wheel"].forEach((ev) => this._camEl.addEventListener(ev, (e) => e.stopPropagation()));
      new ResizeObserver(() => this._camFit()).observe(root.querySelector(".cam-body"));
      window.addEventListener("fabricon-camera", (ev) => this._camera(true, ev.detail?.camera));
      window.addEventListener("keydown", (ev) => { if (ev.key === "Escape" && this._camOpen && !document.fullscreenElement) this._camera(false); });
      root.querySelector(".amssel").parentNode.style.display = "none";          // shown for exactly one AMS
      root.querySelector(".amssel").addEventListener("change", (ev) => {
        try { localStorage.setItem("fabricon-ams", ev.target.value); } catch (_) { /* per-viewer convenience only */ }
        this._placeAms(ev.target.value);
      });
      root.querySelector(".side .side-head button").addEventListener("click", () => this._openPanel(null));
      this._labelsEl = root.querySelector(".labels");
      this._hud = root.querySelector(".hud");
      this._opts = { labels: true, xray: false, spin: false };
      this._lightKey = root.querySelector('.tools [data-k="light"]');
      root.querySelectorAll(".tools button[data-k]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); this._tool(b); }));
      ["pointerdown", "pointerup", "click", "touchstart", "touchend"].forEach((ev) =>
        this._wrap.addEventListener(ev, (e) => e.stopPropagation()));
    }
  }

  set hass(hass) {
    this._hass = hass;
    for (const k of this._kids) k.hass = hass;
    if (this._ready) this._apply();
  }

  getCardSize() { return 10; }

  connectedCallback() {
    if (!this._started) { this._started = true; this._init(); }
    else if (this._ready && !this._raf) this._loop();
  }

  disconnectedCallback() {
    cancelAnimationFrame(this._raf);
    this._raf = null;
  }

  // ------------------------------------------------------------------ setup

  async _init() {
    const [T3, { OrbitControls }, { RoomEnvironment }] = await Promise.all([
      import(`${CDN}/+esm`),
      import(`${CDN}/examples/jsm/controls/OrbitControls.js/+esm`),
      import(`${CDN}/examples/jsm/environments/RoomEnvironment.js/+esm`),
    ]);
    this.T = T3;
    await this._loadModel();
    this._geo = this._geometry();
    const r = (this._renderer = new T3.WebGLRenderer({ antialias: true, alpha: true }));
    r.setPixelRatio(Math.min(devicePixelRatio, 2));
    r.useLegacyLights = true;
    r.toneMapping = T3.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.localClippingEnabled = true;
    this._wrap.prepend(r.domElement);

    const scene = (this._scene = new T3.Scene());
    const pm = new T3.PMREMGenerator(r);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.add(new T3.HemisphereLight(0xfff4e0, 0x1a1408, 0.55));
    const key = new T3.DirectionalLight(0xffffff, 0.9);
    key.position.set(600, 1100, 900);
    scene.add(key);
    const rim = new T3.DirectionalLight(0xffb400, 0.35);
    rim.position.set(-900, 400, -600);
    scene.add(rim);

    this._cam = new T3.PerspectiveCamera(32, 1, 10, 10000);
    this._ctl = new OrbitControls(this._cam, r.domElement);
    this._ctl.enableDamping = true;
    this._ctl.minDistance = 450;
    this._ctl.maxDistance = 2600;
    this._ctl.maxPolarAngle = Math.PI * 0.53;
    this._ctl.addEventListener("start", () => { this._userView = true; });
    // wheel zoom of our own: OrbitControls r160 divides the wheel delta by (devicePixelRatio | 0), which is 0 below
    // a ratio of 1 (browser zoom < 100 %, fractional desktop scaling) -> every notch jumps to min / max distance.
    // Captured on the wrapper, so it runs before the controls' own listener on the canvas.
    this._wrap.addEventListener("wheel", (ev) => {
      if (ev.target !== r.domElement || !this._ctl.enabled) return;
      ev.preventDefault();
      ev.stopPropagation();
      const px = ev.deltaY * (ev.deltaMode === 1 ? 16 : ev.deltaMode === 2 ? 400 : 1);
      const k = Math.pow(0.95, Math.max(-6, Math.min(6, px / 50)));   // one notch (~100 px) = 10 %
      const c = this._ctl, off = this._cam.position.clone().sub(c.target);
      const d = Math.max(c.minDistance, Math.min(c.maxDistance, off.length() / k));
      this._cam.position.copy(c.target).add(off.setLength(d));
      this._userView = true;
    }, { capture: true, passive: false });
    this._resetView();

    this._mats();
    this._parts();
    this._build();
    this._mkLabels();
    this._floor();

    this._ray = new T3.Raycaster();
    let down = null;
    r.domElement.addEventListener("pointerdown", (e) => { down = [e.clientX, e.clientY]; });
    r.domElement.addEventListener("pointerup", (e) => {
      if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 5) this._pick(e);
      down = null;
    });

    new ResizeObserver(() => this._fit()).observe(this._wrap);
    window.addEventListener("resize", () => this._fill());
    this._fill();
    this._fit();
    this._ready = true;
    if (this._hass) this._apply();
    this._chrome();
    this._busyN = 1;                                     // the overlay is on from the start (DOM), until the job is on the bed
    this._loadJob().finally(() => this._busy(false));
    this._t0 = performance.now();
    this._loop();
  }

  // ------------------------------------------------------------------ sidebar, control strip, files

  async _makeCard(config) {
    this._helpers = this._helpers || (await window.loadCardHelpers());
    const el = this._helpers.createCardElement(config);
    if (this._hass) el.hass = this._hass;
    this._kids.push(el);
    return el;
  }

  async _chrome() {
    const panels = this._cfg.panels || [];
    for (const p of panels) {
      const b = document.createElement("button");
      b.className = p.gap ? "fab-key gap" : "fab-key";
      b.dataset.k = p.key;
      b.title = p.name || p.label;
      b.innerHTML = `<ha-icon icon="${p.icon}"></ha-icon>${p.label || p.key}`;
      b.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this._openPanel(this._panel === p.key ? null : p.key);
      });
      this._rail.appendChild(b);
    }
    this._railAms();
    if (!panels.length) this._rail.style.display = "none";
    // view tools only for what the printer has
    if (!this._primaryLight()) this._lightKey.remove();
    if (!this._cams().length) this.shadowRoot.querySelector('.tools [data-k="camera"]').remove();
    if (this._cfg.serial) this._printSection(this._dock);
    else this._dock.remove();
    const foot = this._cfg.footer || [];
    this._foot.style.gridTemplateColumns = this._cfg.footer_columns || `repeat(${foot.length}, minmax(0, 1fr))`;
    for (const c of foot) this._foot.appendChild(c.fab_start ? this._startKey() : await this._makeCard(c));
    this._printState?.();
    this._footNarrow = null;
    this._layout();
    let open = null;
    try { open = localStorage.getItem("fabricon-panel"); } catch (_) { /* closed by default */ }
    if (this._card.classList.contains("tiny")) open = null;
    if (open && panels.some((p) => p.key === open)) this._openPanel(open);
  }

  _e(domain, key) { return `${domain}.${this._cfg.printer}_${key}`; }

  // ------------------------------------------------------------------ live state

  _st(id) { return this._hass?.states[id]; }

  _num(id) { const v = parseFloat(this._st(id)?.state); return isNaN(v) ? null : v; }

  _more(entityId) {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
  }
}
