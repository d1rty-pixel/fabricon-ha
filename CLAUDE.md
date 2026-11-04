# Fabricon (repository `fabricon-ha`)

Home Assistant dashboard `/fabricon-dashboard`: one view per BamBuddy printer with a live three.js model of the X2D,
the print dock (left of the model, under it on narrow screens), a fly-out sidebar of button-card panels and a
control strip. Generated from Python, deployed by `deploy.py`.

```
python3 deploy.py              bundle card, upload if changed, push config   (normal workflow)
python3 deploy.py card|config  one part only
python3 deploy.py setup        first-time wizard (dashboard/wizard.py) -> settings_local.py, then install
python3 deploy.py install      integration entry (+ files / restart with ssh), demo, card, config
python3 deploy.py demo         demo printers' states (dashboard/demo.py) -> HA now + the integration's demo.json (every start)
python3 deploy.py proxy        with ssh: custom_components/fabricon -> /config/custom_components (restart HA when it changed)
python3 deploy.py --stl FILE   new job model on the bed
python3 deploy.py --dump       config as YAML, nothing deployed
python3 deploy.py --bundle     only build + node --check dist/fabricon-card.js
```

## Where things live

| What | File |
|---|---|
| HA URL, ssh, template printer ids, hardware flags (AMS, exhaust box) | `dashboard/settings.py` (defaults), `dashboard/settings_local.py` (real values, not in git) |
| HA websocket client used by deploy.py; setup wizard | `dashboard/ha.py`, `dashboard/wizard.py` |
| `e()` / `a()` entity ids, `js()`, `css()`, `bc()`, `call()`, shared snippets | `dashboard/lib.py` |
| JS / CSS pasted into `[[[ ]]]` templates (fmt, slider, HMS, lock …) | `dashboard/snippets/*` (leading comment is stripped) |
| button-card templates (look of keys, panels, rows) | `dashboard/templates.py` |
| shared components: header, status bar, fan / heater rows, speed bars | `dashboard/controls.py` |
| sidebar panels, one function each, `PANELS` = rail order | `dashboard/panels.py` |
| page grid, model card config, footer keys | `dashboard/view.py` |
| printers from the device registry, per-printer copies | `dashboard/build.py` |
| demo printers in fixed states (offline, printing, paused, finished, failed, no data) | `dashboard/demo.py` |
| 3D card, concatenated in name order into `dist/` | `card/NN-topic.js` |
| integration (HACS): Bambuddy file / queue proxy behind HA login (`/api/fabricon/<serial>/...`), admin upload endpoint for deploy.py without ssh (`/api/fabricon_admin/file`) | `custom_components/fabricon/` |

Card files: `00` constants (sizes, height budget), `05` dropdowns (shared, see below), `10` STL / 3MF / G-code parsers, `20` CSS, `30` the class
(lifecycle, `_init`, `_chrome`), then methods added with `Object.assign(FabriconCard.prototype, {...})`: `40` sidebar,
`41` camera, `42` job on the bed (loader, G-code / mesh), `43` print dock (USB stick, mapping, options) + START key / confirm dialog, `50` view + loop, `60` mesh helpers, `61` printer model, `62` AMS, `63` tubes,
`70` live state, `71` motion. A new method goes into the topic file (object-literal syntax, comma after it); a new
file only needs a number between its neighbours. Getters / setters must stay in the class (`30`).

Names: product Fabricon, repository `fabricon-ha`, technical prefix `fab` (custom element / file `fabricon-card`,
templates `fab_*`, CSS `--fab-*`, JS helpers `fab*`, classes `fab-*`), integration domain `fabricon`
(`/api/fabricon/...`), browser storage `fabricon-*` / IndexedDB `fabricon`.

## Rules that are easy to break

- Everything is written for the template printer `P` / `DEV`; `build()` swaps ids per printer. Entity ids built in
  JS from variables aren't tracked by button-card: add them to `triggers_update`.
- Nested cards in `custom_fields` get `do_not_eval` automatically (`no_parent_eval`); every `[[[ ]]]` template gets
  `MISSING_SAFE` (build.py): an entity HA doesn't have reads as "unavailable" instead of crashing the card.
- `DEMO_PRINTERS` in settings.py adds the demo printer views; their entities exist only in HA's state machine (set by
  the fabricon integration at start). After changing demo.py: `deploy.py demo` (+ restart HA if the integration changed).
- Every dropdown is a `<select data-fab-select>`: touch devices get the system picker, mouse devices the shared menu
  from `card/05-select.js` (works across shadow roots, also in button-cards). No other dropdown code.
- Layout classes come from the card's width (`_layout`): narrow < 1500 (panels overlay), stack < 1100 (dock under
  the model), compact (icon keys), tiny < 600 (phones: fixed view, orbit off, swipes scroll).
- Unknown values show "—"; controls lock while printing (`locked.js`); one component = one code path.
- `dist/` is build output — edit `card/`.
- The repository is public: nothing about a particular HA instance (URLs, IPs, serials, device ids, keys) goes into
  tracked files; real values belong in `dashboard/settings_local.py` (gitignored). Files reach HA over ssh only when
  `SSH` is set, otherwise through the integration's upload endpoint — keep both paths working.
