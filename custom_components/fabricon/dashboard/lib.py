"""Building blocks: entity ids, button-card JS / CSS, card constructors, and the shared snippets (snippets/*)."""
import os
import re

from .settings import A, DEV, P


def e(domain, key):
    """An entity of the template printer."""
    return f"{domain}.{P}_{key}"


def a(domain, key):
    """An entity of the template AMS unit."""
    return f"{domain}.{A}_{key}"


def js(body):
    """A button-card template; $P / $A stand for the printer / AMS entity prefixes."""
    return "[[[\n" + body.replace("$P", P).replace("$A", A).strip() + "\n]]]"


def css(d):
    return [{k: v} for k, v in d.items()]


def bc(template, **kw):
    return {"type": "custom:button-card", "template": template, **kw}


def tab(name):
    return bc("fab_tab", name=name)


def grid(columns, cards):
    return {"type": "grid", "columns": columns, "square": False, "cards": cards}


def stack(*cards):
    return {"type": "vertical-stack", "cards": list(cards)}


def snippet(name):
    """snippets/<name> without its leading comment, which documents it in the file only."""
    text = open(os.path.join(os.path.dirname(__file__), "snippets", name)).read()
    text = re.sub(r"\A(//[^\n]*\n)+" if name.endswith(".js") else r"\A/\*.*?\*/\n", "", text, flags=re.S)
    return "\n" + text.replace("$DEV", DEV)


# JS snippets for [[[ ]]] templates: concatenate what a template needs in front of its own code
JS_STATUS = snippet("status.js")
JS_BAR = snippet("bar.js")
JS_FMT = snippet("fmt.js")
JS_TONE = snippet("tone.js")
JS_HMS = snippet("hms.js")
JS_LOCKED = snippet("locked.js")
JS_SLIDER = JS_LOCKED + snippet("slider.js")
JS_TIME = snippet("time.js")

CHAMFER = snippet("chamfer.css")
# Injected into every card (extra_styles replaces rather than merges, so each template names it)
SHARED_CSS = snippet("keyframes.css") + snippet("slider.css")
# drops the chamfer of fab_base for cards that are only a layout box
NO_CHAMFER = "ha-card { clip-path: none; } ha-card::before, ha-card::after { display: none; }"

HAZARD = "linear-gradient(-45deg, var(--fab-y) 25%, #0b0b0b 25%, #0b0b0b 50%, var(--fab-y) 50%, var(--fab-y) 75%, #0b0b0b 75%)"
NO_ACTION = {"action": "none"}
UNKNOWN = "['unavailable', 'unknown'].includes(entity.state)"


def call(domain, service, **data):
    """tap_action calling a service; target= / confirm= go to their own keys."""
    target, confirm = data.pop("target", None), data.pop("confirm", None)
    act = {"action": "perform-action", "perform_action": f"{domain}.{service}"}
    if target:
        act["target"] = {"entity_id": target}
    if data:
        act["data"] = data
    if confirm:
        act["confirmation"] = {"text": confirm}
    return act
