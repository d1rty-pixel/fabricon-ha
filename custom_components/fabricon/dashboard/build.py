"""The whole Lovelace config: one view per printer BamBuddy knows, each a copy of the template printer's view and
button-card templates with that printer's prefix, device id and identity swapped in.

Pure Python without Home Assistant imports: the fabricon integration calls build() with lists from its registries,
deploy.py --dump with the same lists from the websocket API."""
import json
import re

from .demo import demo_printers
from . import settings
from .settings import DEV, P, P_LIST, P_MODEL, P_SERIAL, P_SLUG, TITLE
from .templates import T
from .view import view
from .lib import e


def no_parent_eval(node):
    """button-card evaluates [[[ ]]] inside a custom_fields card in the *parent's* context unless do_not_eval is set."""
    if isinstance(node, dict):
        for v in node.get("custom_fields", {}).values():
            if isinstance(v, dict) and "card" in v:
                v["do_not_eval"] = True
        for v in node.values():
            no_parent_eval(v)
    elif isinstance(node, list):
        for v in node:
            no_parent_eval(v)
    return node


def add_triggers(node):
    """Keys without an entity of their own re-render only for what triggers_update names."""
    if isinstance(node, dict):
        v = node.get("variables")
        if node.get("type") == "custom:button-card" and isinstance(v, dict) and "triggers_update" not in node:
            watched = [v[k] for k in ("target", "fan", "select") if isinstance(v.get(k), str)]
            if v.get("lockable"):
                watched.append(e("sensor", "print_status"))
            if watched:
                node["triggers_update"] = watched
        for x in node.values():
            add_triggers(x)
    elif isinstance(node, list):
        for x in node:
            add_triggers(x)
    return node


# Every [[[ ]]] template starts with this: an entity HA doesn't have at all (a printer or AMS that was never set up,
# an entity the integration dropped) reads as "unavailable" instead of crashing the card, so it shows "—" by the
# same rule as an offline one. Entities that exist are untouched.
MISSING_SAFE = ("if (!entity && this._config?.entity) entity = {entity_id: this._config.entity, state: 'unavailable', attributes: {}};"
                "states = new Proxy(states, {get: (t, k) => t[k] ?? (typeof k === 'string' && k.includes('.')"
                " ? {entity_id: k, state: 'unavailable', attributes: {}} : undefined)});")


def missing_safe(node):
    if isinstance(node, dict):
        return {k: missing_safe(v) for k, v in node.items()}
    if isinstance(node, list):
        return [missing_safe(v) for v in node]
    if isinstance(node, str) and node.lstrip().startswith("[[["):
        return node.replace("[[[", "[[[" + MISSING_SAFE, 1)
    return node


def printers(devs, ents):
    """BamBuddy's printers from HA's device registry: devices under the BamBuddy hub with a print status sensor.
    devs: [{id, identifiers, via_device_id, model, name, name_by_user}], ents: [{entity_id, device_id}]."""
    hubs = {d["id"] for d in devs if any(i[0] == "bambuddy" and "_printer_" not in i[1] for i in d["identifiers"])}
    out = []
    for d in devs:
        if d.get("via_device_id") not in hubs:
            continue
        status = [x["entity_id"] for x in ents if x["device_id"] == d["id"] and re.fullmatch(r"sensor\..+_print_status", x["entity_id"])]
        if not status:
            continue
        serial = next(i[1].split("_printer_")[-1] for i in d["identifiers"] if i[0] == "bambuddy")
        out.append({"P": status[0][len("sensor."):-len("_print_status")], "DEV": d["id"], "serial": serial, "slug": serial.lower(),
                    "model": (d.get("model") or "Printer").upper(),
                    "name": d.get("name_by_user") or d["name"]})                # order + fallback; the header reads it live
    return sorted(out, key=lambda p: p["name"].lower())


def build(ps, options, stl_version=""):
    """One view per printer (printers() + demo printers): the template printer's view and templates with each
    printer's identity swapped in. Copies for further printers get their own template names."""
    settings.OPTIONS.update(options)
    ps = list(ps) or [{"P": P, "DEV": DEV, "serial": "", "slug": "printer", "model": "X2D", "name": ""}]
    if settings.OPTIONS["demo"]:   # demo.py: test printers in fixed states
        ps += demo_printers()
    listing = json.dumps(json.dumps([{"slug": p["slug"], "model": p["model"], "dev": p["DEV"], "name": p["name"]} for p in ps]))[1:-1]   # as JSON string content
    base_view = json.dumps(missing_safe(add_triggers(no_parent_eval(view(stl_version)))))   # before the swap: they add template-printer ids
    base_t = json.dumps(missing_safe(add_triggers(no_parent_eval(T))))
    views, templates = [], {}
    for i, p in enumerate(ps):
        def swap(text):
            text = text.replace(P, p["P"]).replace(DEV, p["DEV"]).replace(P_LIST, listing)
            for token, v in ((P_MODEL, p["model"]), (P_SERIAL, p["serial"]), (P_SLUG, p["slug"])):
                text = text.replace(token, json.dumps(v)[1:-1])
            if i:
                text = re.sub(r'"template": "(fab_[a-z_]+)"', rf'"template": "\1__{p["slug"]}"', text)
            return text
        v = json.loads(swap(base_view))
        v.update({"path": p["slug"], "title": f'{p["model"]} {p["serial"]}'.strip()})      # fixed: the live name is in the header
        views.append(v)
        templates.update({k + (f'__{p["slug"]}' if i else ""): t for k, t in json.loads(swap(base_t)).items()})
    return {
        "title": TITLE,
        "kiosk_mode": {"hide_header": True, "hide_sidebar": True},
        "button_card_templates": templates,
        "views": views,
    }
