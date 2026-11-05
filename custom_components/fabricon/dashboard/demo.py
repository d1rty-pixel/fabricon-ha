"""Made-up printers for testing the dashboard in every state and with every printer model (the integration's
"demo printers" option).

Each demo is a printer view of its own (build.py) whose entities exist only in Home Assistant's state machine: no
device, no registry entry, nothing in BamBuddy. Their states are a copy of a real printer's (so attributes, units
and options are realistic) with the profile's values on top. The fabricon integration sets them (from a snapshot
taken while that printer was online, kept in .storage). Services called on them do nothing, the print proxy answers
an empty USB stick.
"""
import datetime

from . import spec as spec_
from .providers import PROVIDERS


# key, name, profile: {entity suffix: state or (state, {attribute overrides})}; "*" = every other entity
_PRINTING = {
    "sensor.print_status": "printing", "sensor.print_stage": "printing", "binary_sensor.online": "on",
    "sensor.progress": "42.0", "sensor.current_layer": "57", "sensor.total_layers": "141", "sensor.remaining_time": "95",
    "sensor.current_print": "Demo benchy", "sensor.left_nozzle_temperature": "219.6", "number.left_nozzle_target_temperature": "220.0",
    "sensor.bed_temperature": "64.8", "number.bed_target_temperature": "65.0", "sensor.chamber_temperature": "38.0",
    "fan.part_cooling_fan": ("on", {"percentage": 80}), "sensor.hotend_fan": "100", "binary_sensor.plate_clear_needed": "off",
    "sensor.active_filament": "PLA", "select.active_nozzle": "left",
}
DEMOS = [
    ("offline", "Demo · Offline", {"*": "unavailable", "sensor.print_status": "offline", "binary_sensor.online": "off"}),
    ("printing", "Demo · Printing", _PRINTING),
    ("paused", "Demo · Paused", {**_PRINTING, "sensor.print_status": "paused", "sensor.print_stage": "paused_user",
                                 "sensor.progress": "63.0", "sensor.current_layer": "89", "sensor.remaining_time": "52",
                                 "fan.part_cooling_fan": ("off", {"percentage": 0})}),
    ("finished", "Demo · Finished", {"sensor.print_status": "finished", "sensor.progress": "100.0", "sensor.current_layer": "141",
                                     "sensor.total_layers": "141", "sensor.remaining_time": "0", "sensor.current_print": "Demo benchy",
                                     "binary_sensor.plate_clear_needed": "on", "sensor.bed_temperature": "41.0"}),
    ("failed", "Demo · Failed", {"sensor.print_status": "failed", "sensor.progress": "37.0", "sensor.current_layer": "52",
                                 "sensor.total_layers": "141", "sensor.current_print": "Demo benchy",
                                 "binary_sensor.plate_clear_needed": "on"}),
    ("nodata", "Demo · No data", None),          # no entities at all: a printer HA knows nothing about
]
SKIP = ("camera.", "image.", "update.")
SKIP_KEYS = ("_ip_address",)                    # nothing that identifies the real printer's network


def demo_printers(model="X2D"):
    """The demo printers as build() takes them (after the real ones)."""
    return [{"P": f"x2d_demo_{k}", "DEV": f"demo_device_{k}", "serial": f"DEMO-{k.upper()}", "slug": f"demo-{k}",
             "model": model, "name": name} for k, name, _ in DEMOS]


def demo_states(states, P):
    """{entity_id: {state, attributes}} for every demo with a profile, from the states of the real printer with entity
    prefix P (HA's state list: [{entity_id, state, attributes}])."""
    real = {s["entity_id"]: s for s in states if s["entity_id"].split(".", 1)[1].startswith(P + "_") and not s["entity_id"].startswith(SKIP)
            and not s["entity_id"].endswith(SKIP_KEYS)}
    end = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=95)).isoformat(timespec="seconds")
    out = {}
    for k, name, prof in DEMOS:
        if prof is None:
            continue
        for eid, s in real.items():
            dom, rest = eid.split(".", 1)
            key = f"{dom}.{rest[len(P) + 1:]}"
            v = prof.get(key, prof.get("*", s["state"]))
            if key == "sensor.end_time" and k in ("printing", "paused"):
                v = end
            state, attrs = v if isinstance(v, tuple) else (v, {})
            out[f"{dom}.x2d_demo_{k}_{rest[len(P) + 1:]}"] = {
                "state": str(state), "attributes": {**s["attributes"], **attrs, "friendly_name": f"{name} {key.split('.', 1)[1].replace('_', ' ')}"}}
    return out


# One demo per printer model with a profile of its own (besides the X2D, whose state demos above copy the real
# printer): a printer HA doesn't have, its states made up from the profile's components, printing. No AMS (units are
# found through the device registry, which a demo isn't in).
MODEL_DEMOS = [("x1c", "X1C", "Demo · X1 Carbon"), ("p1s", "P1S", "Demo · P1S"), ("p2s", "P2S", "Demo · P2S"),
               ("h2d", "H2D", "Demo · H2D"), ("h2c", "H2C", "Demo · H2C"), ("h2s", "H2S", "Demo · H2S"),
               ("a1", "A1", "Demo · A1"), ("a1mini", "A1 MINI", "Demo · A1 mini"), ("a2l", "A2L", "Demo · A2L")]
MODEL_TAG = "fab_demo_"                         # entity prefix of the model demos


def model_printers():
    """The model demos as build() takes them, each with its spec (all of its profile's components)."""
    prov = PROVIDERS["bambuddy"]
    out = []
    for k, model, name in MODEL_DEMOS:
        p = {"P": f"{MODEL_TAG}{k}", "DEV": f"demo_device_{k}", "serial": f"DEMO-{k.upper()}", "slug": f"demo-{k}",
             "model": model, "name": name, "provider": prov.NAME}
        p["spec"] = spec_.bind(p, spec_.match(prov.NAME, model), prov.TABLE, None)
        p["spec"]["id"] = f'demo:{p["slug"]}'
        out.append(p)
    return out


def model_states():
    """{entity_id: {state, attributes}} for the model demos: printing at 42 %, everything on."""
    end = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=95)).isoformat(timespec="seconds")
    out = {}

    def put(eid, state, **attrs):
        if eid:
            out[eid] = {"state": str(state), "attributes": attrs}

    for p in model_printers():
        sp, c, name = p["spec"], p["spec"]["core"], p["name"]
        fn = lambda what: f"{name} {what}"  # noqa: E731
        for k, v in {"status": "printing", "stage": "printing", "online": "on", "progress": "42.0", "layer": "57", "layers": "141",
                     "remaining": "95", "end_time": end, "job": "Demo benchy", "usb": "on", "plate_needed": "off", "speed": "standard",
                     "wifi": "-52", "firmware": "off", "hms": "0", "print_hours": "312", "nozzle_select": "left",
                     "airduct": "cooling", "developer_mode": "off", "ams_status": "idle"}.items():
            put(c.get(k), v, friendly_name=fn(k.replace("_", " ")))
        if c.get("speed"):
            out[c["speed"]]["attributes"]["options"] = ["silent", "standard", "sport", "ludicrous"]
        if c.get("hms"):
            out[c["hms"]]["attributes"]["errors"] = []
        if c.get("firmware"):
            out[c["firmware"]]["attributes"].update(installed_version="01.00.00.00", latest_version="01.00.00.00")
        if c.get("maintenance"):
            put(c["maintenance"], "0", tasks=[], friendly_name=fn("maintenance"))
        for h in sp["heaters"]:
            t = {"nozzle": 220, "bed": 65, "chamber": 40}[h["kind"]]
            put(h["temp"], f"{t - 0.4:.1f}", unit_of_measurement="°C", friendly_name=fn(h["label"]))
            put(h.get("target"), f"{t:.1f}", min=0, max=350 if h["kind"] == "nozzle" else 120, step=1, friendly_name=fn(h["label"] + " target"))
        for f in sp["fans"]:
            if f.get("auto"):
                put(f["entity"], "100", unit_of_measurement="%", friendly_name=fn(f["label"]))
            else:
                put(f["entity"], "on", percentage=70, percentage_step=10, friendly_name=fn(f["label"]))
        for x in sp["lights"]:
            put(x["entity"], "on", friendly_name=fn(x["label"]))
        for x in sp["doors"]:
            put(x["entity"], "off", device_class="door", friendly_name=fn(x["label"]))
        for x in sp["extruders"]:
            put(x["type"], "hardened_steel", friendly_name=fn("nozzle type"))
            put(x["diameter"], "0.4", unit_of_measurement="mm", friendly_name=fn("nozzle diameter"))
        for i, x in enumerate(sp["filament"]["external"]):
            put(x["entity"], "loaded", type="PETG", color=["#2b6cff", "#e03a3a"][i % 2], remaining=60, active=i == 0, empty=False,
                name="Demo PETG", friendly_name=fn(x["tag"]))
        for x in sp["ai"]:
            put(x["entity"], "on", friendly_name=fn(x["label"]))
    return out

