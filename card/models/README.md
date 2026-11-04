# Printer models

A model package draws one printer (or a family) for the 3D card. It lives in `card/models/<key>/`, its files are
concatenated in name order into `custom_components/fabricon/frontend/models/<key>.js` (`deploy.py --bundle`) and the
card imports it only when a printer's spec names it (`mesh` in the profile, `dashboard/profiles/*.json`). A spec whose
mesh has no package gets `generic`.

```
card/models/<key>/00-constants.js   sizes (mm), private to the package
card/models/<key>/10-*.js           Object.assign(MODEL, { _build() { ... }, ... })
card/models/<key>/90-model.js       _geometry() and the optional hooks
```

The bundler wraps the files: `const MODEL = {};` before, `window.FabriconCard.registerModel(key, MODEL)` after. The
methods are mixed into the card instance, so `this` is the card: use its helpers (`card/60-parts.js`: `_box`, `_cyl`,
`_m`, `_slabXY`, `_text`, `_fan`, `_perfMat`; `card/62-ams.js`: `_spool`; `card/63-tubes.js`: `_tubePath`),
materials `this.M`, three.js as `this.T`, the scene `this._scene`, the spec `this._spec()`, components
`this._comp("fan:part")` (undefined if the printer doesn't have it) and their entity `this._compEntity(ref)` (for
clickable meshes: the last argument of `_box` / `_cyl` / `_m`). Core constants (`AMS_W` ...) are not visible in a
package; `FabriconCard.AMS` has the AMS unit's size.

Units are millimetres. X = width (+x right seen from the front), Y = up, Z = towards the front; origin = the centre
of the footprint on the floor.

## What `_build()` provides

Everything is optional except head and bed. The core resets these before `_build` (`_parts()` in `61-model.js`).

| Part | Form | Driven by |
|---|---|---|
| `this._head` | Group; the nozzle tip at local y = `tip` when the group is at y 0 | `_moveHead`: x / z (corexy), x (bedslinger) |
| `this._bed` | Group; plate top at local y 0 | `_lift`: y = tip − height (corexy); `_moveHead`: z (bedslinger) |
| `this._carriage` | Group (corexy, optional): moves in z with the head | `_moveHead` |
| `this._gantry` | Group (bedslinger): the beam carrying the head, lifted by the printed height | `_lift` |
| `this._fans[id]` | `this._fan(...)` result, id = spec fan id (`part`, `aux`, `aux_l`, `aux_r`, `chamber`, `exhaust`, `ventilation`, `hotend`) | rotor speed |
| `this._heat[id]` | `{mat, lo, hi}`, id = spec heater id (`nozzle`, `nozzle_l`, `nozzle_r`, `bed`, `chamber`): emissive glow from lo to hi °C | temperature |
| `this._lights[id]` | `{lamp: PointLight, bar: mesh, power}`, id = spec light id (`chamber`, `main`) | light on / off |
| `this._doors[id]` | `{g: Group, open: angle, axis?: "y"}`, id = `front` | door sensor |
| `this._nozzles[id]` | `{g: Group, tip: mesh}`, id = spec extruder id (`main`, `left`, `right`) | lifted 6 mm when not active (dual) |
| `this._holders[id]` | `{grp, spool: this._spool(...)}`, id = spec external spool id (`main`, `left`, `right`) | spool colour / fill / spin |
| `this._usb` | Object3D shown while the storage sensor is on | `core.usb` |
| `this._screenCanvas`, `this._screenTex` | 512 × 300 canvas on the printer's screen | status, progress, temperatures |
| `this._labelSpec` | `[{anchor, off: [x, y, z], title?, rows: ["heater:bed", "fan:part", ...]}]` | rows the printer lacks are dropped |
| `this._shell` | materials made see-through in x-ray (`this.M.body`, `bodyDark`, `inner` are already in) | |

## Methods

- `_geometry()` (required): `{w, d, h, tip, idle, bed: [x, y], kinematics: "corexy_bed_z" | "bedslinger", focus, amsTop: {y, z} | null, amsGap: [left, right]}`.
  `tip` = nozzle height over the floor at layer 0 (corexy) / bed top (bedslinger); `idle` = nozzle height over the bed when idle;
  `focus` = height the view looks at; `amsTop` = where a single AMS stands on the printer (null: not possible, e.g. open frames).
- `_xray(on)`: hide doors, glass and covers.
- `_amsChanged(units)`: the connected AMS units changed (e.g. a spool holder only without AMS).
- `_tubesUpdate()`: called every frame; PTFE tubes (`this._tubePath(nodes)` + `TubeGeometry`).

Look at `bambu.x2d` (detailed) and `generic` (parametric, every part by rule).
