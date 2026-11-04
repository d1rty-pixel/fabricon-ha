// Printer models. The machine itself comes from a model package (card/models/<key>/, bundled into
// frontend/models/<key>.js, see card/models/README.md), loaded when a card needs it and mixed into the card
// instance. The printer's spec (config printer_spec, from the integration) says which components it has; the
// model names the parts that show them (_fans, _heat, _lights, _doors, _nozzles, _holders, _labelSpec ...).
const FAB_MODEL_BASE = "/fabricon_static/models/";
// spec list per component kind of a label row reference "kind:id"
const FAB_KINDS = { heater: (s) => s.heaters, fan: (s) => s.fans, light: (s) => s.lights, door: (s) => s.doors,
  camera: (s) => s.cameras, external: (s) => s.filament?.external };

Object.assign(FabriconCard.prototype, {
  _spec() { return this._cfg.printer_spec || {}; },

  // a component of the spec by reference ("fan:part"), or undefined when the printer doesn't have it
  _comp(ref) {
    const [kind, id] = ref.split(":");
    return (FAB_KINDS[kind]?.(this._spec()) || []).find((c) => c.id === id);
  },

  // the entity a click on a component opens: a heater's target (its slider), else its entity
  _compEntity(ref, c = this._comp(ref)) { return c && (c.target || c.temp || c.entity); },

  // the spec's model package, or the generic one when there is none for it
  async _loadModel() {
    const want = this._spec().mesh || "generic", key = FAB_MODELS[want] ? want : "generic";
    if (!FabriconCard.models[key]) await import(FAB_MODEL_BASE + FAB_MODELS[key]);
    Object.assign(this, FabriconCard.models[key]);
    this._modelKey = key;
  },

  // what every model starts from; _build fills in the parts it has
  _parts() {
    Object.assign(this, { _clickable: [], _labels: [], _lab: {}, _labelSpec: [], _fans: {}, _heat: {}, _lights: {}, _doors: {},
      _nozzles: {}, _holders: {}, _tubes: [], _winRims: [] });
  },

  // labels from the model's anchors, one row per component the printer has (a group keeps its title)
  _mkLabels() {
    for (const l of this._labelSpec) {
      const rows = l.rows.filter((ref) => this._comp(ref)).map((ref) =>
        [ref, this._compEntity(ref), ref.startsWith("external:") ? () => this._openAms() : null]);
      if (rows.length) Object.assign(this._lab, this._label(l.anchor, l.off, rows, l.title));
    }
  },

  _floor() {
    const T3 = this.T;
    const grid = new T3.GridHelper(1600, 32, 0xffb400, 0x3a3018);
    grid.material.transparent = true;
    grid.material.opacity = 0.22;
    this._scene.add(grid);
    const disc = new T3.Mesh(new T3.CircleGeometry(520, 64).rotateX(-Math.PI / 2),
      new T3.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }));
    disc.position.y = 0.5;
    this._scene.add(disc);
  },

  // hooks a model may override
  _xray(_on) {},
  _amsChanged(_units) {},
  _tubesUpdate() {},
});
