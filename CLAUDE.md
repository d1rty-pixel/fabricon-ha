# Fabricon (repository `fabricon-ha`)

Home Assistant dashboard `/fabricon-dashboard`: one view per printer (BamBuddy for now; any Bambu model) with a live three.js model,
the print dock (left of the model, under it on narrow screens), a fly-out sidebar of button-card panels and a
control strip. Everything ships as ONE integration (`custom_components/fabricon`, HACS / release zip): it serves the
card, generates the dashboard in HA from the device registry (in memory, read-only, rebuilt at start / new printer /
options / `fabricon.rebuild`) and proxies BamBuddy's file / queue API. `deploy.py` is only the developer tool.

```
python3 deploy.py              bundle card, copy changed integration files over ssh, call fabricon.rebuild
python3 deploy.py --restart    same; restarts HA when integration code (not dashboard/ or frontend/) changed
python3 deploy.py --stl FILE   new job model on the bed
python3 deploy.py --dump       generated dashboard as YAML (options from deploy_local.OPTIONS), nothing deployed
python3 deploy.py --bundle     only card/ -> custom_components/fabricon/frontend/ (card + models/<key>.js) + node --check
python3 tests/golden.py        generator output vs tests/golden/<fixture>.json (--update after a wanted change)
python3 tests/harness/serve.py the card without HA: http://localhost:8765/?fixture=x2d&state=printing (bundle first)
```

## Printers as data

A printer is a **spec** (`dashboard/spec.py`): the model **profile** (`dashboard/profiles/*.json`: what the printer
has — heaters, fans, lights, cameras, doors, extruders, filament, AI switches, accessories, 3D `mesh`, build volume,
kinematics) bound by its **provider** (`dashboard/providers/<name>.py`: discovery from the registry + a table
component -> entity). The profile decides what exists (missing entity = "—"); only the `generic` profile
(`detect`) keeps just what it finds. Panels, view and card render the spec and nothing else; a panel without
content is left out of the rail. The card draws `spec.mesh` from `card/models/<key>/` (contract:
`card/models/README.md`), `generic` when there is no package. New Bambu model = a profile (+ optionally a model
package); new printer system = a provider module + `backends/<name>.py` for the print dock.

`fabricon.rebuild` reloads the generator modules (panel.MODULES, in dependency order) — a new module in dashboard/
must be added there. Releases: tag `vX.Y.Z` -> .github/workflows/release.yml builds fabricon.zip (HACS zip_release).

## Where things live

| What | File |
|---|---|
| fixed names, placeholders (template printer `P` / `DEV`), `OPTIONS` (read at call time: `settings.OPTIONS[...]`) | `custom_components/fabricon/dashboard/settings.py` |
| the spec: profile matching, binding, per-printer options (`option()`), the card's part (`card_spec`) | `dashboard/spec.py` |
| model profiles (one JSON per model family) | `dashboard/profiles/*.json` |
| providers: discovery + entity table + services (`PROVIDERS`) | `dashboard/providers/*.py` |
| `e()` / `a()` entity ids, `js()`, `css()`, `bc()`, `call()`, shared snippets | `dashboard/lib.py` |
| JS / CSS pasted into `[[[ ]]]` templates (fmt, slider, HMS, lock …) | `dashboard/snippets/*` (leading comment is stripped) |
| button-card templates (look of keys, panels, rows) | `dashboard/templates.py` |
| shared components: header, status bar, fan / heater rows, speed bars | `dashboard/controls.py` |
| sidebar panels, one function each taking the spec (None = hidden), `GROUPS` = rail order | `dashboard/panels.py` |
| page grid, model card config, footer keys | `dashboard/view.py` |
| printers from the registry lists (providers), a view rendered per spec, per-printer template copies | `dashboard/build.py` |
| demo printers in fixed states (offline, printing, paused, finished, failed, no data) | `dashboard/demo.py` |
| integration setup, registry listener, rebuild service | `custom_components/fabricon/__init__.py` |
| card serving (extra_js_url), dashboard registration (Lovelace internals), build + demo states | `custom_components/fabricon/panel.py` |
| print proxy behind HA login (`/api/fabricon/<serial>/...`), dispatches to the printer's backend | `custom_components/fabricon/proxy.py` |
| backends: a provider's file / queue API (BamBuddy) | `custom_components/fabricon/backends/*.py` |
| setup + options flow (defaults, per printer: AMS + the profile's accessories, demo) | `custom_components/fabricon/config_flow.py` |
| 3D card, concatenated in name order into `custom_components/fabricon/frontend/` (gitignored) | `card/NN-topic.js` |
| printer model packages (one bundle each, loaded on demand) | `card/models/<key>/` |
| tests: golden generator output, registry fixtures, card harness | `tests/` |
| research per printer model (sizes with sources), BamBuddy entities per model | `docs/printers/` |
| developer deploy; its HA websocket client; local settings (gitignored) | `deploy.py`, `ha_client.py`, `deploy_local.py` |

`dashboard/` paths above are under `custom_components/fabricon/`. The generator must stay free of Home Assistant
imports (deploy.py --dump and the Check workflow run it standalone).

Card files: `00` constants (sizes, height budget), `05` dropdowns (shared, see below), `10` STL / 3MF / G-code parsers, `20` CSS, `30` the class
(lifecycle, `_init`, `_chrome`), then methods added with `Object.assign(FabriconCard.prototype, {...})`: `40` sidebar,
`41` camera(s), `42` job on the bed (loader, G-code / mesh), `43` print dock (USB stick / SD card, mapping, options) + START key / confirm dialog, `50` view + loop, `60` mesh helpers, `61` model loader + labels from the spec, `62` AMS, `63` tube paths,
`70` live state (iterates the spec), `71` motion (by kinematics). The machine itself is a model package
(`card/models/<key>/`, methods mixed into the card instance; core constants aren't visible there). A new method goes into the topic file (object-literal syntax, comma after it); a new
file only needs a number between its neighbours. Getters / setters must stay in the class (`30`).

Names: product Fabricon, repository `fabricon-ha`, technical prefix `fab` (custom element / file `fabricon-card`,
templates `fab_*`, CSS `--fab-*`, JS helpers `fab*`, classes `fab-*`), integration domain `fabricon`
(`/api/fabricon/...`), browser storage `fabricon-*` / IndexedDB `fabricon`.

## Rules that are easy to break

- Panels / view take the printer's spec and nothing else (no hard-coded entity suffixes outside providers/ and the
  shared templates). The view is rendered for the template printer `P` / `DEV` (`build._template`); `build()` swaps ids per printer. Entity ids built in
  JS from variables aren't tracked by button-card: add them to `triggers_update`.
- Nested cards in `custom_fields` get `do_not_eval` automatically (`no_parent_eval`); every `[[[ ]]]` template gets
  `MISSING_SAFE` (build.py): an entity HA doesn't have reads as "unavailable" instead of crashing the card.
- The "demo" option adds the demo printer views; their entities exist only in HA's state machine, set by panel.py
  from a snapshot of the first printer (taken while it is online, kept in .storage/fabricon.demo).
- Every dropdown is a `<select data-fab-select>`: touch devices get the system picker, mouse devices the shared menu
  from `card/05-select.js` (works across shadow roots, also in button-cards). No other dropdown code.
- Layout classes come from the card's width (`_layout`): narrow < 1500 (panels overlay), stack < 1100 (dock under
  the model), compact (icon keys), tiny < 600 (phones: fixed view, orbit off, swipes scroll).
- Unknown values show "—"; controls lock while printing (`locked.js`); one component = one code path.
- `custom_components/fabricon/frontend/` is build output — edit `card/`.
- The repository is public: nothing about a particular HA instance (URLs, IPs, serials, device ids, keys) goes into
  tracked files; developer values belong in `deploy_local.py` (gitignored).
