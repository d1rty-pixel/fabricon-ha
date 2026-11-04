"""Made-up printers for testing the dashboard in every state (the integration's "demo printers" option).

Each demo is a printer view of its own (build.py) whose entities exist only in Home Assistant's state machine: no
device, no registry entry, nothing in BamBuddy. Their states are a copy of a real printer's (so attributes, units
and options are realistic) with the profile's values on top. The fabricon integration sets them (from a snapshot
taken while that printer was online, kept in .storage). Services called on them do nothing, the print proxy answers
an empty USB stick.
"""
import datetime


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
