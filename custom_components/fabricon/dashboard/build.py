"""The whole Lovelace config: one view per printer BamBuddy knows, each a copy of the template printer's view and
button-card templates with that printer's prefix, device id and identity swapped in.

Pure Python without Home Assistant imports: the fabricon integration calls build() with lists from its registries,
deploy.py --dump with the same lists from the websocket API."""
import json
import re

from .demo import demo_printers, model_printers
from . import spec
from .providers import PROVIDERS
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
    """Every provider's printers from HA's device registry, each with its spec (spec.py) bound against the entities
    HA has. devs: [{id, identifiers, via_device_id, model, name, name_by_user}], ents: [{entity_id, device_id}]."""
    have = {x["entity_id"] for x in ents}
    out = []
    for prov in PROVIDERS.values():
        for p in prov.discover(devs, ents):
            p["spec"] = spec.bind(p, spec.match(prov.NAME, p["model"]), prov.TABLE, have.__contains__)
            out.append(p)
    return sorted(out, key=lambda p: p["name"].lower())


def _spec(p):
    """A printer's spec; printers given without one (tests, the template printer) get their profile's full set."""
    if "spec" not in p:
        prov = PROVIDERS[p.get("provider", "bambuddy")]
        p = {**p, "spec": spec.bind(p, spec.match(prov.NAME, p["model"]), prov.TABLE, None)}
    return p


def _template(p):
    """The printer's spec written for the template printer (P / DEV), the form the generator renders: entity ids,
    device id and identity are swapped back in per printer (swap() in build)."""
    sp = p["spec"]
    text = json.dumps(sp)
    if sp.get("prefix"):
        text = text.replace(f'.{sp["prefix"]}_', f".{P}_").replace(f'"prefix": "{sp["prefix"]}"', f'"prefix": "{P}"')
    if sp.get("device_id"):
        text = text.replace(f'"{sp["device_id"]}"', f'"{DEV}"')
    t = json.loads(text)
    t.update({"slug": P_SLUG, "serial": P_SERIAL, "model": P_MODEL, "name": ""})
    return t


def _demos(source):
    """The demo printers, each with a copy of the source printer's spec (their states are copies of its states)."""
    out = []
    for d in demo_printers(source["model"]):
        text = json.dumps(source["spec"])
        if source["spec"].get("prefix"):
            text = text.replace(f'.{source["spec"]["prefix"]}_', f'.{d["P"]}_').replace(f'"prefix": "{source["spec"]["prefix"]}"', f'"prefix": "{d["P"]}"')
        if source.get("DEV"):
            text = text.replace(f'"{source["DEV"]}"', f'"{d["DEV"]}"')
        sp = json.loads(text)
        sp.update({"slug": d["slug"], "serial": d["serial"], "name": d["name"], "id": f'demo:{d["slug"]}'})
        out.append({**d, "spec": sp})
    return out


def build(ps, options, stl_version=""):
    """One view per printer (printers() + demo printers), rendered from the printer's spec for the template printer,
    then its identity swapped in. Copies of the button-card templates for further printers get their own names."""
    settings.OPTIONS.update(options)
    ps = [_spec(p) for p in ps] or [_spec({"P": P, "DEV": DEV, "serial": "", "slug": "printer", "model": "X2D", "name": ""})]
    if settings.OPTIONS["demo"]:   # demo.py: test printers in fixed states
        ps += _demos(ps[0]) + model_printers()
    listing = json.dumps(json.dumps([{"slug": p["slug"], "model": p["model"], "dev": p["DEV"], "name": p["name"]} for p in ps]))[1:-1]   # as JSON string content
    base_t = json.dumps(missing_safe(add_triggers(no_parent_eval(T))))
    views, templates, rendered = [], {}, {}
    for i, p in enumerate(ps):
        def swap(text):
            text = text.replace(P, p["P"]).replace(DEV, p["DEV"]).replace(P_LIST, listing)
            for token, v in ((P_MODEL, p["model"]), (P_SERIAL, p["serial"]), (P_SLUG, p["slug"])):
                text = text.replace(token, json.dumps(v)[1:-1])
            if i:
                text = re.sub(r'"template": "(fab_[a-z_]+)"', rf'"template": "\1__{p["slug"]}"', text)
            return text
        t_spec = _template(p)
        key = json.dumps(t_spec, sort_keys=True)          # printers of the same model render the same view
        if key not in rendered:   # add_triggers / no_parent_eval before the swap: they add template-printer ids
            rendered[key] = json.dumps(missing_safe(add_triggers(no_parent_eval(view(t_spec, stl_version)))))
        v = json.loads(swap(rendered[key]))
        v.update({"path": p["slug"], "title": f'{p["model"]} {p["serial"]}'.strip()})      # fixed: the live name is in the header
        views.append(v)
        templates.update({k + (f'__{p["slug"]}' if i else ""): t for k, t in json.loads(swap(base_t)).items()})
    return {
        "title": TITLE,
        "kiosk_mode": {"hide_header": True, "hide_sidebar": True},
        "button_card_templates": templates,
        "views": views,
    }
