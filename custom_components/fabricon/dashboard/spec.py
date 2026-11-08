"""The printer description ("spec"): everything the renderers (sidebar panels, view, the 3D card) know about one
printer, as plain data. Built from a model profile (profiles/*.json: what the printer HAS) and a provider (providers/:
WHERE the values come from, i.e. which entity carries which component).

Rule: the profile decides what exists, the provider only binds it. A component of the profile whose entity Home
Assistant doesn't have is kept and reads "—" (same rule as an offline printer). Only a profile with "detect": true
(the generic fallback for printers without a profile of their own) keeps just the components it finds entities for.

A spec (all entity ids are complete ids, None where the provider has nothing):
  id, slug, serial, name, model (display name, upper case), device_id, prefix (the provider's entity prefix, or None)
  provider: "bambuddy"          profile: "bambu.x2d"          mesh: 3D model key of the card ("generic" = parametric)
  build_volume: [x, y, z]       kinematics: "corexy_bed_z" | "bedslinger"
  core: {status, stage, online, progress, layer, layers, remaining, end_time, job, active_filament, pause, resume,
         stop, speed, hms, hms_clear, refresh, firmware, maintenance, print_hours, usb, plate_needed, plate_cleared,
         ams_status, airduct, nozzle_select, wifi, ip, developer_mode}
  heaters:   [{id, kind (nozzle|bed|chamber), label, icon?, anchor, temp, target}]   profile "target": false = measured only
  fans:      [{id, label, icon?, anchor, entity, auto (read-only, run by the printer), accessory?}]
  lights:    [{id, label, anchor, entity, primary}]
  cameras:   [{id, label, entity}]
  doors:     [{id, label, anchor, entity}]
  extruders: [{id, label, heater, type, diameter}]
  filament:  {units: [AMS models the printer takes] (found at runtime), max_units, external: [{id, tag, entity}],
             fixed?: [{probe (slot 1 sensor), dev, id, model, slots}] units given here instead (demo printers)}
  ai:        [{id, label, icon, entity}]
  telemetry: [{label, icon, entity, kind?}]   readouts (kind "firmware": the firmware row; "extruders": the nozzle rows)
  stats:     [{label, icon, entity}]          maintenance statistics
  services:  {action: {service, data}}     provider services (home, move, extrude, load, unload, dry, dry_stop,
                                           hms_answer, maintenance_done); missing = the action isn't offered
  accessories: [{key, label}]
"""
import json
import os

PROFILES = os.path.join(os.path.dirname(__file__), "profiles")


def _load():
    out = {}
    for f in sorted(os.listdir(PROFILES)):
        if f.endswith(".json"):
            with open(os.path.join(PROFILES, f), encoding="utf-8") as fh:
                p = json.load(fh)
            out[p["key"]] = p
    return out


# read once at import (HA imports the generator in an executor; spec is used in the event loop afterwards, where
# file access blocks); fabricon.rebuild reloads this module and so picks up edited profiles
_PROFILES = _load()


def profiles():
    """Every model profile, by key."""
    return _PROFILES


def match(provider, model):
    """The profile for a provider's model name (case-insensitive), or the generic one."""
    all_ = profiles()
    m = (model or "").strip().upper()
    for p in all_.values():
        if p["provider"] in (provider, "*") and m in [x.upper() for x in p.get("match", [])]:
            return p
    return all_["generic"]


def bind(printer, profile, table, have):
    """A spec from a printer ({P, DEV, serial, slug, model, name}), its profile and the provider's binding table
    (providers/<name>.py: TABLE, CORE, services()). have(entity_id) -> whether HA has it (None: assume yes)."""
    prefix = printer.get("P")
    exists = have or (lambda _eid: True)
    detect = profile.get("detect", False)

    def eid(ref):
        """(domain, suffix) or a list of them -> the first one HA has, else the first (shows "—")."""
        if ref is None:
            return None
        if isinstance(ref, str):                  # a complete id (an entity of the provider's hub, not the printer)
            return ref
        cands = [f"{d}.{prefix}_{s}" for d, s in (ref if isinstance(ref, list) else [ref])]
        return next((c for c in cands if exists(c)), None if detect else cands[0])

    def comps(kind, fields):
        out = []
        for item in profile.get(kind, []):
            ref = table.get(kind, {}).get(item["id"])
            if ref is None:
                continue
            bound = {f: eid(r) if item.get(f, True) is not False else None      # "target": false = only measured
                     for f, r in (ref.items() if isinstance(ref, dict) else [(fields, ref)])}
            if detect and bound[next(iter(bound))] is None:   # the primary field decides
                continue
            out.append({**item, **bound})
        return out

    heaters = comps("heaters", None)
    ext_ref = table.get("extruders", {})
    extruders = []
    for x in profile.get("extruders", []):
        if x["heater"] not in {h["id"] for h in heaters} or x["id"] not in ext_ref:
            continue
        extruders.append({**x, **{f: eid(r) for f, r in ext_ref[x["id"]].items()}})
    lights = comps("lights", "entity")
    for i, light in enumerate(lights):
        light.setdefault("primary", i == 0)
    fil = profile.get("filament", {})
    external = []
    for x in fil.get("external", []):
        e = eid(table.get("external", {}).get(x["id"]))
        if e or not detect:
            external.append({**x, "entity": e})
    ai_ref = table.get("ai", {})
    ai = [{"id": k, **ai_ref[k], "entity": eid(ai_ref[k]["ref"])} for k in profile.get("ai", []) if k in ai_ref]
    ai = [{k: v for k, v in a.items() if k != "ref"} for a in ai if a["entity"]]
    core = {k: eid(r) for k, r in table.get("core", {}).items()}
    if not profile.get("airduct"):
        core["airduct"] = None
    if len(extruders) < 2:
        core["nozzle_select"] = None
    return {
        "id": f'{profile["provider"] if profile["provider"] != "*" else printer.get("provider", "")}:{printer.get("serial", "")}',
        "slug": printer["slug"], "serial": printer.get("serial", ""), "name": printer.get("name", ""),
        "model": printer.get("model") or profile["name"].upper(), "device_id": printer.get("DEV"), "prefix": prefix,
        "provider": printer.get("provider", "bambuddy"), "profile": profile["key"], "mesh": profile.get("mesh", "generic"),
        "build_volume": profile.get("build_volume"), "kinematics": profile.get("kinematics", "corexy_bed_z"),
        "core": core, "heaters": heaters, "fans": comps("fans", "entity"), "lights": lights,
        "cameras": comps("cameras", "entity"), "doors": comps("doors", "entity"), "extruders": extruders,
        "filament": {"units": fil.get("units", []), "max_units": fil.get("max_units", 0), "external": external},
        "ai": ai,
        "telemetry": [{**{k: v for k, v in t.items() if k != "ref"}, "entity": eid(t.get("ref"))} for t in table.get("telemetry", [])],
        "stats": [{**{k: v for k, v in t.items() if k != "ref"}, "entity": eid(t.get("ref"))} for t in table.get("stats", [])],
        "services": table.get("services", lambda p: {})(printer),
        "accessories": profile.get("accessories", []),
    }


def option(spec, key, options):
    """An option for this printer: its own setting (options["printers"][slug]) or the global one."""
    return options.get("printers", {}).get(spec["slug"], {}).get(key, options.get(key))


def card_spec(spec):
    """The part of the spec the 3D card needs (its config key `printer_spec`)."""
    keep = ("id", "slug", "serial", "model", "mesh", "profile", "provider", "build_volume", "kinematics", "core", "heaters",
            "fans", "lights", "cameras", "doors", "extruders", "filament")
    return {k: spec[k] for k in keep}
