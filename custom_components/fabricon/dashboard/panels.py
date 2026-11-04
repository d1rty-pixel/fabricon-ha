"""The twin card's fly-out sidebar: one function per panel, PANELS lists them in rail order.

Every panel renders the printer's spec (spec.py) and nothing else: panel(spec) -> {key, label, name, icon, cards},
or None when the printer has nothing for it (the panel is left out of the rail). `per_ams: [cards]` is repeated by
the card for each AMS unit (tokens __AMS__ / __AMS_ID__ / __AMS_DEV__); the Print dock is the card's own.
"""
import json

from .controls import firmware_read, fan_card, heat_card, key, load_btn, mode_keys, read
from .lib import (CHAMFER, JS_BAR, JS_FMT, JS_HMS, JS_STATUS, JS_TIME, NO_ACTION, NO_CHAMFER, SHARED_CSS, a, bc, call, css,
                  e, grid, js, stack, svc, tab)
from . import settings
from .settings import DEV_AMS, P_SERIAL
from .spec import option

HEAT_ICONS = {"nozzle": "mdi:printer-3d-nozzle-heat", "bed": "mdi:heating-coil", "chamber": "mdi:thermometer-lines"}


def panel(label, key_, name, icon, *cards):
    return {"key": key_, "label": label, "name": name, "icon": icon, "cards": list(cards)}


def temps(spec):
    if not spec["heaters"]:
        return None
    return panel("Temperatures", "temps", "Temperatures // T-01", "mdi:thermometer",
                 stack(*[heat_card(h["label"], h["temp"], h["target"], h.get("icon") or HEAT_ICONS[h["kind"]]) if h.get("target")
                         else read(h["temp"], h["label"], h.get("icon") or HEAT_ICONS[h["kind"]]) for h in spec["heaters"]]))


def fan_list(spec):
    """The printer's fans, accessories only when fitted (option), the ones the printer runs by itself last."""
    fs = [f for f in spec["fans"] if not f.get("accessory") or option(spec, f["accessory"], settings.OPTIONS)]
    return [f for f in fs if not f.get("auto")] + [f for f in fs if f.get("auto")]


def fans(spec):
    fs = fan_list(spec)
    duct = spec["core"]["airduct"] and [tab("Air duct // F-02"), mode_keys(spec["core"]["airduct"], [
        ("cooling", "Cooling", "mdi:snowflake", "AIR DUCT", None), ("heating", "Heating", "mdi:fire", "AIR DUCT", "var(--fab-o)")])]
    if not fs and not duct:
        return None
    return panel("Fans", "fans", "Airflow // F-01", "mdi:fan",
                 *([stack(*[fan_card(f["entity"], f["label"], f.get("icon", "mdi:fan"), auto=f.get("auto", False)) for f in fs])] if fs else []),
                 *(duct or []))


def motion(spec):
    move, home_ = spec["services"].get("move"), spec["services"].get("home")
    if not move:
        return None

    def jog(axis, dist, icon):
        sign = "+" if dist > 0 else "−"
        return bc("fab_jog", name=f"{axis.upper()}{sign}{abs(dist):g}", icon=icon, tap_action=svc(move, axis=axis, distance=dist))

    blank = bc("fab_blank")
    home = bc("fab_jog", name="Home", icon="mdi:home-import-outline", variables={"color": "var(--fab-o)"},
              tap_action=svc(home_, confirm="Home all axes?")) if home_ else blank
    up2, up1, dn1, dn2 = "mdi:chevron-double-up", "mdi:chevron-up", "mdi:chevron-down", "mdi:chevron-double-down"
    xy_cells = [
        blank, blank, jog("y", 10, up2), blank, blank,
        blank, blank, jog("y", 1, up1), blank, blank,
        jog("x", -10, "mdi:chevron-double-left"), jog("x", -1, "mdi:chevron-left"), home, jog("x", 1, "mdi:chevron-right"), jog("x", 10, "mdi:chevron-double-right"),
        blank, blank, jog("y", -1, dn1), blank, blank,
        blank, blank, jog("y", -10, dn2), blank, blank,
    ]
    xy = bc("fab_panel", name="Axes X / Y // M-01", custom_fields={"body": {"card": grid(5, xy_cells)}})
    z = bc("fab_panel", name="Z // M-02", custom_fields={"body": {"card": grid(1, [
        jog("z", 10, up2), jog("z", 1, up1), jog("z", -1, dn1), jog("z", -10, dn2)])}})
    return panel("Motion", "motion", "Motion // M-00", "mdi:axis-arrow", xy, z)


def extrude(spec):
    """E+10 / E−10 on the active nozzle (the only one, or the one the nozzle select names)."""
    # extrude needs the active nozzle at 170 °C or more (BamBuddy refuses below); the temperature itself lives
    # in the Temperatures section, here only whether extruding is possible
    heat = {h["id"]: h["temp"] for h in spec["heaters"]}
    temps_ = {x["id"]: heat[x["heater"]] for x in spec["extruders"]}
    sel, first = spec["core"]["nozzle_select"], spec["extruders"][0]["id"]
    pick = f"states['{sel}']?.state in ex ? states['{sel}'].state : '{first}'" if sel else f"'{first}'"
    hot = f"const ex = {json.dumps(temps_)}, nz = {pick};" \
          "const hot = (parseFloat(states[ex[nz]]?.state) || 0) >= 170;"
    watch = [e("sensor", "print_status"), *([sel] if sel else []), *temps_.values()]
    ext_btns = [
        bc("fab_jog", name=name, icon=icon, triggers_update=watch, variables={"color": col, "enabled": js(hot + "return hot;")},
           tap_action=svc(spec["services"]["extrude"], distance=dist))
        for name, icon, col, dist in [("E+10", "mdi:arrow-down-bold-box-outline", "var(--fab-y)", 10),
                                      ("E−10", "mdi:arrow-up-bold-box-outline", "var(--fab-o)", -10)]]
    hint = bc("fab_base", show_icon=False, show_name=False, show_state=False, triggers_update=watch,
              styles={"card": css({"height": "auto", "padding": "6px 4px 0", "background": "none", "box-shadow": "none"}),
                      "custom_fields": {"t": css({"white-space": "normal", "justify-self": "stretch", "min-width": "0"})}},
              extra_styles=NO_CHAMFER,
              custom_fields={"t": js(hot + """
return `<div style="text-align:left;white-space:normal;font-family:var(--fab-mono);font-size:10.5px;letter-spacing:1.5px;line-height:1.4;color:${hot ? 'var(--fab-y)' : 'var(--fab-o)'}">
  ${hot ? '▸ READY TO EXTRUDE' + (Object.keys(ex).length > 1 ? ' · ' + nz.toUpperCase() + ' NOZZLE' : '') : '▸ EXTRUDING NEEDS THE ACTIVE NOZZLE AT 170 °C'}</div>`;
""")})
    return bc("fab_panel", name="Extrude // E-03", custom_fields={"body": {"card": stack(grid(2, ext_btns), hint)}})


def nozzle_card(spec, x):
    """One nozzle (extruder x of the spec), read-only: temperature / target, type and diameter; framed and marked
    ACTIVE when it is the one in use (with a nozzle select). A tap opens the temperature (switching is the explicit
    switch below, not this card)."""
    h = next(h for h in spec["heaters"] if h["id"] == x["heater"])
    t, tgt, sel, typ, dia, side = h["temp"], h["target"], spec["core"]["nozzle_select"], x["type"], x["diameter"], x["id"]
    on = f"states['{sel}']?.state === '{side}'" if sel else "false"
    return bc("fab_base", entity=t, show_icon=False, show_name=False, show_state=False, triggers_update=[t, tgt, *([sel] if sel else []), typ, dia],
              tap_action={"action": "more-info"},
              styles={"card": css({"height": "auto", "padding": "10px 12px", "cursor": "pointer",
                                   "box-shadow": f"[[[ return {on} ? 'inset 0 0 0 2px var(--fab-y), 0 0 18px rgba(255,180,0,.2)' : 'inset 0 0 0 1px rgba(255,180,0,.16), 0 8px 22px rgba(0,0,0,.45)' ]]]"}),
                      "grid": css({"grid-template-areas": '"b"', "grid-template-columns": "minmax(0,1fr)"}),
                      "custom_fields": {"b": css({"text-align": "left", "min-width": "0", "justify-self": "stretch"})}},
              custom_fields={"b": js(f"""
const on = {on}, na = (x) => !x || ['unavailable', 'unknown'].includes(x.state);
const c = parseFloat(entity.state), n = states['{tgt}'], tg = parseFloat(n?.state), ty = states['{typ}'], d = states['{dia}'];
return `<div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
  <span style="font-size:19px;letter-spacing:3px;line-height:1;color:${{on ? 'var(--fab-y)' : 'var(--fab-txt)'}}">{x["label"].upper()}</span>
  ${{on ? '<span style="font-family:var(--fab-mono);font-size:9.5px;letter-spacing:1.5px;padding:1px 6px;background:var(--fab-y);color:#0b0b0b">ACTIVE</span>' : ''}}</div>
  <div style="font-size:30px;line-height:1.1;margin-top:6px;color:var(--fab-txt)">${{isNaN(c) ? '—' : Math.round(c) + '°'}}<span style="font-size:14px;color:var(--fab-dim)"> / ${{na(n) ? '—' : tg ? Math.round(tg) + '°' : 'OFF'}}</span></div>
  <div style="font-family:var(--fab-mono);font-size:10px;letter-spacing:.5px;color:var(--fab-dim);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
    ${{na(ty) ? '—' : ty.state.replace(/_/g, ' ').toUpperCase()}} · Ø ${{na(d) ? '—' : d.state + ' MM'}}</div>`;
""")})


def nozzle_switch(sel):
    """The explicit switch for the active nozzle (a select left / right): a rocker LEFT / RIGHT; a tap asks first, then
    switches to the other nozzle. Locked while a job runs or the printer is offline (fab_btn lockable)."""
    other = "(entity.state === 'right' ? 'left' : 'right')"
    return bc("fab_btn", entity=sel, name="Active nozzle", show_icon=False, show_label=True, variables={"lockable": True},
              label="[[[ return ['unavailable', 'unknown'].includes(entity.state) ? '—' : 'TAP TO SWITCH TO ' + " + other + ".toUpperCase() ]]]",
              tap_action={"action": "perform-action", "perform_action": "select.select_option", "target": {"entity_id": sel},
                          "data": {"option": f"[[[ return {other} ]]]"},
                          "confirmation": {"text": f"[[[ return 'Switch to the ' + {other} + ' nozzle now?' ]]]"}},
              styles={"card": css({"height": "64px", "padding": "8px 14px"}),
                      "grid": css({"grid-template-areas": '"n rock" "l rock"', "grid-template-columns": "1fr auto", "grid-template-rows": "1fr 1fr",
                                   "column-gap": "12px"}),
                      "name": css({"justify-self": "start", "align-self": "end", "padding-top": "0"}),
                      "label": css({"justify-self": "start", "align-self": "start", "font-family": "var(--fab-mono)", "font-size": "10px",
                                    "letter-spacing": "1px", "color": "var(--fab-dim)"}),
                      "custom_fields": {"rock": css({"align-self": "center"})}},
              custom_fields={"rock": js("""
const r = entity.state === 'right', na = ['unavailable', 'unknown'].includes(entity.state);
const side = (t, on) => `<span style="font-size:15px;letter-spacing:2px;color:${on ? 'var(--fab-y)' : 'var(--fab-dim)'}">${t}</span>`;
return `<div style="display:flex;align-items:center;gap:10px">${side('LEFT', !na && !r)}
  <div style="width:66px;height:28px;background:#070707;box-shadow:inset 0 0 0 1px rgba(255,180,0,.35);position:relative">
    <div style="position:absolute;top:3px;bottom:3px;width:30px;left:${r ? 33 : 3}px;background:${na ? '#333' : 'var(--fab-y)'};
      box-shadow:${na ? 'none' : '0 0 10px rgba(255,180,0,.5)'};transition:left .2s"></div></div>${side('RIGHT', !na && r)}</div>`;
""")})


def nozzles(spec):
    """Extruder: the nozzles side by side, the switch for the active one (two nozzles), extruding."""
    xs = spec["extruders"]
    if not xs:
        return None
    sel = spec["core"]["nozzle_select"]
    return panel("Extruder", "nozzles", "Extruder // E-01", "mdi:printer-3d-nozzle", tab("Nozzles // E-02"),
                 grid(len(xs), [nozzle_card(spec, x) for x in xs]), *([nozzle_switch(sel)] if sel else []),
                 *([extrude(spec)] if "extrude" in spec["services"] else []))


# ------------------------------------------------------------------ AMS

def spool(slot, tag, load):
    """One spool (AMS slot or external) as a compact row: colour ring with the fill level, material and details, load key."""
    return bc("fab_base", entity=slot, show_icon=False, show_name=False, show_state=False, tap_action={"action": "more-info"},
              styles={"card": css({"height": "auto", "padding": "6px 8px 6px 10px", "cursor": "pointer",
                                   "box-shadow": "[[[ return entity.attributes.active ? 'inset 0 0 0 2px var(--fab-y), 0 0 18px rgba(255,180,0,.2)' : 'inset 0 0 0 1px rgba(255,180,0,.16), 0 8px 22px rgba(0,0,0,.45)' ]]]"}),
                      "grid": css({"grid-template-areas": '"ring info ctl"', "grid-template-columns": "46px minmax(0,1fr) 122px",
                                   "column-gap": "10px", "align-items": "center"}),
                      "custom_fields": {"ring": css({"align-self": "center"}), "info": css({"text-align": "left", "min-width": "0"}),
                                        "ctl": css({"min-width": "0"})}},
              custom_fields={"ctl": {"card": load_btn(slot, load)}, "ring": js("""
const at = entity.attributes, c = at.color || '#888', r = at.remaining;
if (at.empty || ['unavailable', 'unknown'].includes(entity.state)) return `<div style="width:44px;height:44px;border-radius:50%;border:2px dashed rgba(255,180,0,.3);box-sizing:border-box"></div>`;
const ring = r != null ? `conic-gradient(var(--fab-y) 0 ${r}%, #262624 ${r}% 100%)` : 'repeating-conic-gradient(#3a3934 0 8deg, #1a1a19 8deg 16deg)';
return `<div style="position:relative;width:44px;height:44px;border-radius:50%;background:${ring}">
  <div style="position:absolute;inset:4px;border-radius:50%;background:radial-gradient(circle,#0c0c0c 0 20%,#2b2b2b 21% 27%,${c} 28% 100%)"></div></div>`;
"""), "info": js(f"""
const at = entity.attributes, r = at.remaining, na = ['unavailable', 'unknown'].includes(entity.state);
const tag = (t, bg, fg) => `<span style="font-family:var(--fab-mono);font-size:9.5px;letter-spacing:1.5px;padding:1px 6px;background:${{bg}};color:${{fg}}">${{t}}</span>`;
const head = `<div style="display:flex;align-items:center;gap:8px;white-space:nowrap">
  ${{tag('{tag}', 'rgba(255,180,0,.14)', 'var(--fab-y)')}}
  <span style="font-size:20px;letter-spacing:2px;line-height:1;color:${{at.empty || na ? 'var(--fab-dim)' : 'var(--fab-txt)'}}">${{na ? '—' : at.empty ? 'EMPTY' : (at.type || '—')}}</span>
  ${{at.active ? tag('ACTIVE', 'var(--fab-y)', '#0b0b0b') : ''}}</div>`;
if (at.empty || na) return head;
return head + `<div style="font-family:var(--fab-mono);font-size:10px;letter-spacing:.5px;color:var(--fab-dim);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
  ${{at.name || ''}} · <span style="color:var(--fab-txt)">${{r != null ? r + ' %' : '—'}}</span> · ${{at.nozzle_temp_min != null ? at.nozzle_temp_min + '–' + at.nozzle_temp_max + '°' : '—'}}</div>`;
""")})


def dry_btn(dry, name, label, temp_js, dur_js, enabled_js, color="var(--fab-y)"):
    return bc("fab_key", name=name, icon="mdi:heat-wave", label=label,
              triggers_update=[a("binary_sensor", "drying")] + [a("sensor", f"slot_{i}") for i in range(1, 5)],
              variables={"color": color, "enabled": js(enabled_js)},
              tap_action=svc(dry, device_id=DEV_AMS, temperature=js(temp_js), duration=js(dur_js),
                              confirm=js(f"return `Dry AMS: ${{(() => {{ {temp_js} }})()}} °C for ${{(() => {{ {dur_js} }})()}} h?`")))


def ams_climate(spec):
    dry, stop = spec["services"].get("dry"), spec["services"].get("dry_stop")
    loaded = "[1,2,3,4].map(i => states['sensor.$A_slot_' + i]?.attributes).filter(x => x && !x.empty && x.drying_temp)"
    # the AMS reports its dryer idle (unknown while it is off: no drying keys then)
    idle_dry = "states['binary_sensor.$A_drying']?.state === 'off' && states['binary_sensor.$A_drying']?.attributes.remote_start !== false"
    return bc("fab_panel_ctl", entity=a("sensor", "humidity"), name="AMS __AMS_ID__ // Climate & dryer",
              triggers_update=[a("sensor", "humidity"), a("sensor", "temperature"), a("binary_sensor", "drying"), a("sensor", "drying_remaining_time")],
              tap_action={"action": "more-info"},
              custom_fields={"body": js(JS_BAR + JS_TIME + """
const hv = parseFloat(entity.state), tv = parseFloat(states['sensor.$A_temperature']?.state);
const h = isNaN(hv) ? 0 : hv, hs = isNaN(hv) ? '—' : Math.round(hv), t = isNaN(tv) ? '—' : tv;
const col = isNaN(hv) ? 'var(--fab-dim)' : h > 60 ? 'var(--fab-r)' : h > 40 ? 'var(--fab-o)' : 'var(--fab-y)';
const dry = states['binary_sensor.$A_drying'], on = dry?.state === 'on';
const lab = (k) => `<div style="font-family:var(--fab-mono);font-size:9.5px;letter-spacing:2px;color:var(--fab-dim)">${k}</div>`;
return `<div style="display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:end">
  <div>${lab('HUMIDITY')}<div style="font-size:34px;line-height:.95;color:${col}">${hs}${isNaN(hv) ? '' : '<span style="font-size:16px">%</span>'}</div></div>
  <div style="padding-bottom:6px">${bar(h, col, 40, 9)}</div>
  <div style="text-align:right">${lab('TEMPERATURE')}<div style="font-size:24px;line-height:1">${t}${isNaN(tv) ? '' : '<span style="font-size:13px;color:var(--fab-dim)">°C</span>'}</div></div></div>
  <div style="margin-top:8px;font-family:var(--fab-mono);font-size:10.5px;letter-spacing:1px;color:${on ? 'var(--fab-o)' : 'var(--fab-dim)'}">
  ${!dry || ['unavailable', 'unknown'].includes(dry.state) ? '▸ DRYER —' : on ? '▸ DRYING · ' + (dry.attributes.target_temperature ?? '—') + ' °C · ' + hm(states['sensor.$A_drying_remaining_time'].state) + ' H LEFT' : '▸ DRYER READY · LIMIT 40 % HUMIDITY'}</div>`;
"""), "ctl": {"card": grid(2, [] if not dry else [
                  dry_btn(dry, "Auto", "BY SPOOL", f"const l = {loaded}; return Math.min(...l.map(x => x.drying_temp));",
                          f"const l = {loaded}; return Math.max(...l.map(x => x.drying_time));",
                          f"return {idle_dry} && ({loaded}).length > 0;"),
                  dry_btn(dry, "PLA", "55 °C · 8 H", "return 55", "return 8", f"return {idle_dry};"),
                  dry_btn(dry, "PETG", "65 °C · 8 H", "return 65", "return 8", f"return {idle_dry};", "var(--fab-o)"),
                  bc("fab_key", name="Stop", icon="mdi:stop-circle-outline", label="END DRYING", triggers_update=[a("binary_sensor", "drying")],
                     variables={"color": "var(--fab-r)", "enabled": js("return states['binary_sensor.$A_drying']?.state === 'on';")},
                     tap_action=svc(stop, device_id=DEV_AMS)),
              ])}})


def ams(spec):
    """Per AMS unit its slots and climate / dryer; the external spools once, as the same rows (unload carries the
    AMS state)."""
    load, unload, units = spec["services"].get("load"), spec["services"].get("unload"), option(spec, "ams", settings.OPTIONS)
    if not spec["filament"]["external"] and not units:
        return None
    ext = stack(tab("External spools // E-01"),
        *[spool(x["entity"], x["tag"], load) for x in spec["filament"]["external"]],
        *[bc("fab_key", name="Unload", icon="mdi:tray-arrow-up", triggers_update=[e("sensor", "print_status"), e("sensor", "ams_status")],
           label=js(JS_FMT + "return 'AMS ' + fmt(states['sensor.$P_ams_status']);"),
           variables={"color": "var(--fab-o)", "enabled": js(JS_STATUS + "return !active && s !== 'offline';")},
           tap_action=svc(unload, confirm="Unload the filament now?")) for _ in [unload] if unload])
    slots = stack(tab("AMS __AMS_ID__ // Slots"), *[spool(a("sensor", f"slot_{i}"), f"__AMS_ID__{i}", load) for i in range(1, 5)])
    return {**panel("Filament", "ams", "Filament // A-00", "mdi:tray-full", ext), "per_ams": [slots, ams_climate(spec)] if units else []}


# ------------------------------------------------------------------ system

def ai(spec):
    if not spec["ai"]:
        return None
    return panel("AI monitoring", "ai", "AI monitoring // S-03", "mdi:robot-outline", stack(*[
        bc("fab_toggle", entity=x["entity"], name=x["label"], icon=x["icon"]) for x in spec["ai"]]))


def hms(spec):
    c = spec["core"]
    if not c["hms"]:
        return None
    card = bc("fab_panel", entity=c["hms"], name="HMS // S-05", tap_action={"action": "more-info"},
              triggers_update=[c["hms"], e("sensor", "print_status")],
              extra_styles=CHAMFER + SHARED_CSS + "ha-card { container-type: inline-size; }\n"
                           "@container (max-width: 640px) { #container { grid-template-areas: \"n\" \"body\" \"ctl\" !important;"
                           " grid-template-columns: 1fr !important; } #ctl { padding: 0 14px 14px !important; } }",
              styles={"grid": css({"grid-template-areas": '"n n" "body ctl"', "grid-template-columns": "1fr 380px",
                                   "grid-template-rows": "auto 1fr"}),
                      "custom_fields": {"ctl": css({"padding": "12px 14px 14px 0"})}},
              custom_fields={"body": js(JS_HMS + """
const errs = fabHmsOpen();
if (!errs.length) return `<div style="display:flex;align-items:center;gap:14px"><span style="width:14px;height:14px;border-radius:50%;background:var(--fab-y);box-shadow:0 0 12px var(--fab-y)"></span>
  <span style="font-size:26px;letter-spacing:4px">NO ERRORS</span><span style="font-family:var(--fab-mono);font-size:11px;color:var(--fab-dim)">HEALTH MANAGEMENT SYSTEM · ALL SYSTEMS NOMINAL</span></div>`;
return fabHms(errs);
"""), "ctl": {"card": grid(2, [
                  *([key("Clear", "mdi:broom", "HMS ERRORS", call("button", "press", target=c["hms_clear"]), "var(--fab-o)")] if c["hms_clear"] else []),
                  *([key("Refresh", "mdi:refresh", "STATUS", call("button", "press", target=c["refresh"]))] if c["refresh"] else []),
              ])}})
    return panel("HMS", "hms", "HMS // S-05", "mdi:alert-circle-outline", card)


def telemetry(spec):
    rows = [read(spec["core"]["status"], "Serial", "mdi:barcode", label=P_SERIAL, tap_action=NO_ACTION)]
    for t in spec["telemetry"]:
        if t.get("kind") == "firmware":
            rows += [firmware_read(spec["core"]["firmware"])] if spec["core"]["firmware"] else []
        elif t.get("kind") == "storage":
            u = spec["core"]["usb"]
            rows += [read(u, "SD card" if u.endswith("_sd_card") else "USB", t["icon"])] if u else []
        elif t.get("kind") == "extruders":
            for x in spec["extruders"]:
                tail = f' {x["short"]}' if x.get("short") else ""
                rows += [read(x["type"], "Nozzle" + tail, "mdi:printer-3d-nozzle"), read(x["diameter"], "Ø" + (tail or " "), "mdi:diameter-outline")]
        elif t.get("entity"):
            rows.append(read(t["entity"], t["label"], t["icon"]))
    return panel("Telemetry", "telemetry", "Telemetry // S-04", "mdi:chart-line", stack(tab("Telemetry // S-04"), *rows))


def maintenance(spec):
    if not spec["core"]["maintenance"]:
        return None
    tasks = stack(tab("Schedule // W-00"), *[bc("fab_task", variables={"idx": i}) for i in range(8)])
    stats = stack(tab("Statistics // W-10"), *[read(x["entity"], x["label"], x["icon"]) for x in spec["stats"] if x["entity"]],
                  *([firmware_read(spec["core"]["firmware"])] if spec["core"]["firmware"] else []))
    note = bc("fab_base", show_icon=False, show_name=False, show_state=False, styles={"card": css({"height": "auto", "padding": "12px 14px"})},
              custom_fields={"n": '<div style="font-family:var(--fab-mono);font-size:11px;line-height:1.6;color:var(--fab-dim);text-align:left">'
                                  '▸ TAP A TASK = MARK AS DONE<br>▸ INTERVALS ARE MANAGED BY BAMBUDDY<br>▸ REFRESHED EVERY 10 MIN + AFTER EACH PRINT</div>'})
    url = settings.OPTIONS["bambuddy_url"]
    link = [bc("fab_key", name="Open Bambuddy", icon="mdi:open-in-new", tap_action={"action": "url", "url_path": url})] if url else []
    return panel("Maintenance", "maintenance", "Maintenance // W-00", "mdi:wrench-cog-outline", tasks, stack(stats, note, *link))


# Rail order follows the work at the printer, in groups (a gap before each group's first panel):
#   material for the next job · the running process (heat, air) · moving the machine by hand (nozzles, axes) ·
#   watching (printer messages, AI) · reference (numbers, care), maintenance last
GROUPS = [[ams], [temps, fans], [nozzles, motion], [hms, ai], [telemetry, maintenance]]


def panels(spec):
    """The rail for this printer: every panel it has content for, in order; `gap` before each group's first one."""
    out = []
    for g, group in enumerate(GROUPS):
        shown = [p for p in (f(spec) for f in group) if p]
        out += [{**p, "gap": bool(g) and not i} for i, p in enumerate(shown)]
    return out
