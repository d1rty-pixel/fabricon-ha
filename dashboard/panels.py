"""The twin card's fly-out sidebar: one function per panel, PANELS lists them in rail order.

A panel is {key, label, name, icon, cards}; `per_ams: [cards]` is repeated by the card for each AMS unit (tokens
__AMS__ / __AMS_ID__ / __AMS_DEV__), the Print dock is the card's own (serial in the card config).
"""
from .controls import firmware_read, fan_card, heat_card, key, load_btn, mode_keys, read
from .lib import (CHAMFER, JS_BAR, JS_FMT, JS_HMS, JS_STATUS, JS_TIME, NO_ACTION, NO_CHAMFER, SHARED_CSS, a, bc, call, css,
                  e, grid, js, stack, tab)
from .settings import BAMBUDDY_URL, DEV, DEV_AMS, EXHAUST_BOX, HAS_AMS, P_SERIAL

HEATERS = [
    ("Nozzle L", "left_nozzle_temperature", "left_nozzle_target_temperature", "mdi:printer-3d-nozzle-heat"),
    ("Nozzle R", "right_nozzle_temperature", "right_nozzle_target_temperature", "mdi:printer-3d-nozzle-heat"),
    ("Bed", "bed_temperature", "bed_target_temperature", "mdi:heating-coil"),
    ("Chamber", "chamber_temperature", "chamber_target_temperature", "mdi:thermometer-lines"),
]


def panel(label, key_, name, icon, *cards):
    return {"key": key_, "label": label, "name": name, "icon": icon, "cards": list(cards)}


def temps():
    return panel("Temperatures", "temps", "Temperatures // T-01", "mdi:thermometer", stack(*[heat_card(*h) for h in HEATERS]))


def fans():
    fs = [("part_cooling_fan", "Part"), *[("exhaust_fan", "Exhaust")][:EXHAUST_BOX], ("left_auxiliary_fan", "Aux L"),
          ("right_auxiliary_fan", "Aux R"), ("ventilation", "Ventilation", "mdi:air-filter")]
    duct = mode_keys(e("select", "airduct_mode"), [("cooling", "Cooling", "mdi:snowflake", "AIR DUCT", None),
                                                   ("heating", "Heating", "mdi:fire", "AIR DUCT", "var(--fab-o)")])
    return panel("Fans", "fans", "Airflow // F-01", "mdi:fan",
                 stack(*[fan_card(*f) for f in fs], fan_card("hotend_fan", "Hotend", "mdi:fan-auto", auto=True)),
                 tab("Air duct // F-02"), duct)


def motion():
    def jog(axis, dist, icon):
        sign = "+" if dist > 0 else "−"
        return bc("fab_jog", name=f"{axis.upper()}{sign}{abs(dist):g}", icon=icon,
                  tap_action=call("bambuddy", "move_axis", device_id=DEV, axis=axis, distance=dist))

    blank = bc("fab_blank")
    home = bc("fab_jog", name="Home", icon="mdi:home-import-outline", variables={"color": "var(--fab-o)"},
              tap_action=call("bambuddy", "home_axes", device_id=DEV, confirm="Home all axes?"))
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


def extrude():
    """E+10 / E−10 on the active nozzle."""
    # extrude needs the active nozzle at 170 °C or more (BamBuddy refuses below); the temperature itself lives
    # in the Temperatures section, here only whether extruding is possible
    hot = "const nz = states['select.$P_active_nozzle']?.state === 'right' ? 'right' : 'left';" \
          "const hot = (parseFloat(states['sensor.$P_' + nz + '_nozzle_temperature']?.state) || 0) >= 170;"
    watch = [e("sensor", "print_status"), e("select", "active_nozzle"), e("sensor", "left_nozzle_temperature"), e("sensor", "right_nozzle_temperature")]
    ext_btns = [
        bc("fab_jog", name=name, icon=icon, triggers_update=watch, variables={"color": col, "enabled": js(hot + "return hot;")},
           tap_action=call("bambuddy", "extrude", device_id=DEV, distance=dist))
        for name, icon, col, dist in [("E+10", "mdi:arrow-down-bold-box-outline", "var(--fab-y)", 10),
                                      ("E−10", "mdi:arrow-up-bold-box-outline", "var(--fab-o)", -10)]]
    hint = bc("fab_base", show_icon=False, show_name=False, show_state=False, triggers_update=watch,
              styles={"card": css({"height": "auto", "padding": "6px 4px 0", "background": "none", "box-shadow": "none"}),
                      "custom_fields": {"t": css({"white-space": "normal", "justify-self": "stretch", "min-width": "0"})}},
              extra_styles=NO_CHAMFER,
              custom_fields={"t": js(hot + """
return `<div style="text-align:left;white-space:normal;font-family:var(--fab-mono);font-size:10.5px;letter-spacing:1.5px;line-height:1.4;color:${hot ? 'var(--fab-y)' : 'var(--fab-o)'}">
  ${hot ? '▸ READY TO EXTRUDE · ' + (nz === 'right' ? 'RIGHT' : 'LEFT') + ' NOZZLE' : '▸ EXTRUDING NEEDS THE ACTIVE NOZZLE AT 170 °C'}</div>`;
""")})
    return bc("fab_panel", name="Extrude // E-03", custom_fields={"body": {"card": stack(grid(2, ext_btns), hint)}})


def nozzle_card(side):
    """One nozzle, read-only: temperature / target, type and diameter; framed and marked ACTIVE when it is the one in
    use. A tap opens the temperature (switching is the explicit switch below, not this card)."""
    t, tgt, sel = e("sensor", f"{side}_nozzle_temperature"), e("number", f"{side}_nozzle_target_temperature"), e("select", "active_nozzle")
    typ, dia = e("sensor", f"{side}_nozzle_type"), e("sensor", f"{side}_nozzle_diameter")
    on = f"states['{sel}']?.state === '{side}'"
    return bc("fab_base", entity=t, show_icon=False, show_name=False, show_state=False, triggers_update=[t, tgt, sel, typ, dia],
              tap_action={"action": "more-info"},
              styles={"card": css({"height": "auto", "padding": "10px 12px", "cursor": "pointer",
                                   "box-shadow": f"[[[ return {on} ? 'inset 0 0 0 2px var(--fab-y), 0 0 18px rgba(255,180,0,.2)' : 'inset 0 0 0 1px rgba(255,180,0,.16), 0 8px 22px rgba(0,0,0,.45)' ]]]"}),
                      "grid": css({"grid-template-areas": '"b"', "grid-template-columns": "minmax(0,1fr)"}),
                      "custom_fields": {"b": css({"text-align": "left", "min-width": "0", "justify-self": "stretch"})}},
              custom_fields={"b": js(f"""
const on = {on}, na = (x) => !x || ['unavailable', 'unknown'].includes(x.state);
const c = parseFloat(entity.state), n = states['{tgt}'], tg = parseFloat(n?.state), ty = states['{typ}'], d = states['{dia}'];
return `<div style="display:flex;justify-content:space-between;align-items:center;gap:6px">
  <span style="font-size:19px;letter-spacing:3px;line-height:1;color:${{on ? 'var(--fab-y)' : 'var(--fab-txt)'}}">{side.upper()}</span>
  ${{on ? '<span style="font-family:var(--fab-mono);font-size:9.5px;letter-spacing:1.5px;padding:1px 6px;background:var(--fab-y);color:#0b0b0b">ACTIVE</span>' : ''}}</div>
  <div style="font-size:30px;line-height:1.1;margin-top:6px;color:var(--fab-txt)">${{isNaN(c) ? '—' : Math.round(c) + '°'}}<span style="font-size:14px;color:var(--fab-dim)"> / ${{na(n) ? '—' : tg ? Math.round(tg) + '°' : 'OFF'}}</span></div>
  <div style="font-family:var(--fab-mono);font-size:10px;letter-spacing:.5px;color:var(--fab-dim);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
    ${{na(ty) ? '—' : ty.state.replace(/_/g, ' ').toUpperCase()}} · Ø ${{na(d) ? '—' : d.state + ' MM'}}</div>`;
""")})


def nozzle_switch():
    """The explicit switch for the active nozzle: a rocker LEFT / RIGHT; a tap asks first, then switches to the other
    nozzle. Locked while a job runs or the printer is offline (fab_btn lockable)."""
    sel = e("select", "active_nozzle")
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


def nozzles():
    """Extruder: both nozzles side by side, the switch for the active one, extruding."""
    return panel("Extruder", "nozzles", "Extruder // E-01", "mdi:printer-3d-nozzle", tab("Nozzles // E-02"),
                 grid(2, [nozzle_card("left"), nozzle_card("right")]), nozzle_switch(), extrude())


# ------------------------------------------------------------------ AMS

def spool(slot, tag):
    """One spool (AMS slot or external) as a compact row: colour ring with the fill level, material and details, load key."""
    return bc("fab_base", entity=slot, show_icon=False, show_name=False, show_state=False, tap_action={"action": "more-info"},
              styles={"card": css({"height": "auto", "padding": "6px 8px 6px 10px", "cursor": "pointer",
                                   "box-shadow": "[[[ return entity.attributes.active ? 'inset 0 0 0 2px var(--fab-y), 0 0 18px rgba(255,180,0,.2)' : 'inset 0 0 0 1px rgba(255,180,0,.16), 0 8px 22px rgba(0,0,0,.45)' ]]]"}),
                      "grid": css({"grid-template-areas": '"ring info ctl"', "grid-template-columns": "46px minmax(0,1fr) 122px",
                                   "column-gap": "10px", "align-items": "center"}),
                      "custom_fields": {"ring": css({"align-self": "center"}), "info": css({"text-align": "left", "min-width": "0"}),
                                        "ctl": css({"min-width": "0"})}},
              custom_fields={"ctl": {"card": load_btn(slot)}, "ring": js("""
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


def dry_btn(name, label, temp_js, dur_js, enabled_js, color="var(--fab-y)"):
    return bc("fab_key", name=name, icon="mdi:heat-wave", label=label,
              triggers_update=[a("binary_sensor", "drying")] + [a("sensor", f"slot_{i}") for i in range(1, 5)],
              variables={"color": color, "enabled": js(enabled_js)},
              tap_action=call("bambuddy", "start_drying", device_id=DEV_AMS, temperature=js(temp_js), duration=js(dur_js),
                              confirm=js(f"return `Dry AMS: ${{(() => {{ {temp_js} }})()}} °C for ${{(() => {{ {dur_js} }})()}} h?`")))


def ams_climate():
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
"""), "ctl": {"card": grid(2, [
                  dry_btn("Auto", "BY SPOOL", f"const l = {loaded}; return Math.min(...l.map(x => x.drying_temp));",
                          f"const l = {loaded}; return Math.max(...l.map(x => x.drying_time));",
                          f"return {idle_dry} && ({loaded}).length > 0;"),
                  dry_btn("PLA", "55 °C · 8 H", "return 55", "return 8", f"return {idle_dry};"),
                  dry_btn("PETG", "65 °C · 8 H", "return 65", "return 8", f"return {idle_dry};", "var(--fab-o)"),
                  bc("fab_key", name="Stop", icon="mdi:stop-circle-outline", label="END DRYING", triggers_update=[a("binary_sensor", "drying")],
                     variables={"color": "var(--fab-r)", "enabled": js("return states['binary_sensor.$A_drying']?.state === 'on';")},
                     tap_action=call("bambuddy", "stop_drying", device_id=DEV_AMS)),
              ])}})


def ams():
    """Per AMS unit its slots and climate / dryer; the external spools once, as the same rows (unload carries the
    AMS state)."""
    ext = stack(tab("External spools // E-01"),
        spool(e("sensor", "left_external_spool"), "EXT L"),
        spool(e("sensor", "right_external_spool"), "EXT R"),
        bc("fab_key", name="Unload", icon="mdi:tray-arrow-up", triggers_update=[e("sensor", "print_status"), e("sensor", "ams_status")],
           label=js(JS_FMT + "return 'AMS ' + fmt(states['sensor.$P_ams_status']);"),
           variables={"color": "var(--fab-o)", "enabled": js(JS_STATUS + "return !active && s !== 'offline';")},
           tap_action=call("bambuddy", "unload_filament", device_id=DEV, confirm="Unload the filament now?")))
    slots = stack(tab("AMS __AMS_ID__ // Slots"), *[spool(a("sensor", f"slot_{i}"), f"__AMS_ID__{i}") for i in range(1, 5)])
    return {**panel("Filament", "ams", "Filament // A-00", "mdi:tray-full", ext), "per_ams": [slots, ams_climate()] if HAS_AMS else []}


# ------------------------------------------------------------------ system

def ai():
    return panel("AI monitoring", "ai", "AI monitoring // S-03", "mdi:robot-outline", stack(*[
        bc("fab_toggle", entity=e("switch", k), name=n, icon=i) for k, n, i in [
            ("spaghetti_detection", "Spaghetti", "mdi:noodles"),
            ("build_plate_detection", "Build plate", "mdi:checkerboard"),
            ("clumping_detection", "Clumping", "mdi:printer-3d-nozzle-alert-outline"),
            ("pileup_detection", "Pile-up", "mdi:delete-variant"),
            ("ams_filament_backup", "Filament backup", "mdi:backup-restore")]]))


def hms():
    card = bc("fab_panel", entity=e("sensor", "hms_errors"), name="HMS // S-05", tap_action={"action": "more-info"},
              triggers_update=[e("sensor", "hms_errors"), e("sensor", "print_status")],
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
                  key("Clear", "mdi:broom", "HMS ERRORS", call("button", "press", target=e("button", "clear_hms_errors")), "var(--fab-o)"),
                  key("Refresh", "mdi:refresh", "STATUS", call("button", "press", target=e("button", "refresh_status"))),
              ])}})
    return panel("HMS", "hms", "HMS // S-05", "mdi:alert-circle-outline", card)


def telemetry():
    rows = [read(e("sensor", "print_status"), "Serial", "mdi:barcode", label=P_SERIAL, tap_action=NO_ACTION),
            *[read(ent, n, i) for ent, n, i in [
                (e("binary_sensor", "online"), "Connection", "mdi:lan-connect"),
                (e("sensor", "wifi_signal"), "WiFi", "mdi:wifi"),
                (e("sensor", "ip_address"), "IP", "mdi:ip-network-outline")]],
            firmware_read(),
            *[read(ent, n, i) for ent, n, i in [
                (e("binary_sensor", "developer_mode"), "Dev mode", "mdi:code-braces"),
                (e("binary_sensor", "usb_drive"), "USB", "mdi:usb-flash-drive-outline"),
                ("sensor.bambuddy_disk_usage", "BamBuddy Disk", "mdi:harddisk"),
                (e("sensor", "left_nozzle_type"), "Nozzle L", "mdi:printer-3d-nozzle"),
                (e("sensor", "left_nozzle_diameter"), "Ø L", "mdi:diameter-outline"),
                (e("sensor", "right_nozzle_type"), "Nozzle R", "mdi:printer-3d-nozzle"),
                (e("sensor", "right_nozzle_diameter"), "Ø R", "mdi:diameter-outline")]]]
    return panel("Telemetry", "telemetry", "Telemetry // S-04", "mdi:chart-line", stack(tab("Telemetry // S-04"), *rows))


def maintenance():
    tasks = stack(tab("Schedule // W-00"), *[bc("fab_task", variables={"idx": i}) for i in range(8)])
    stats = stack(tab("Statistics // W-10"), *[read(ent, n, i) for ent, n, i in [
        (e("sensor", "print_hours"), "Print hours", "mdi:clock-outline"),
        ("sensor.bambuddy_total_prints", "Prints", "mdi:counter"),
        ("sensor.bambuddy_successful_prints", "Successful", "mdi:check-bold"),
        ("sensor.bambuddy_failed_prints", "Failed", "mdi:close-thick"),
        ("sensor.bambuddy_cancelled_prints", "Cancelled", "mdi:cancel"),
        ("sensor.bambuddy_total_filament_used", "Filament", "mdi:weight-gram"),
        ("sensor.bambuddy_total_print_time", "Print time", "mdi:timer-outline")]], firmware_read())
    note = bc("fab_base", show_icon=False, show_name=False, show_state=False, styles={"card": css({"height": "auto", "padding": "12px 14px"})},
              custom_fields={"n": '<div style="font-family:var(--fab-mono);font-size:11px;line-height:1.6;color:var(--fab-dim);text-align:left">'
                                  '▸ TAP A TASK = MARK AS DONE<br>▸ INTERVALS ARE MANAGED BY BAMBUDDY<br>▸ REFRESHED EVERY 10 MIN + AFTER EACH PRINT</div>'})
    link = bc("fab_key", name="Open Bambuddy", icon="mdi:open-in-new", tap_action={"action": "url", "url_path": BAMBUDDY_URL})
    return panel("Maintenance", "maintenance", "Maintenance // W-00", "mdi:wrench-cog-outline", tasks, stack(stats, note, link))


# Rail order follows the work at the printer, in groups (a gap before each group's first panel):
#   material for the next job · the running process (heat, air) · moving the machine by hand (nozzles, axes) ·
#   watching (printer messages, AI) · reference (numbers, care), maintenance last
PANELS = [ams, temps, fans, nozzles, motion, hms, ai, telemetry, maintenance]
GROUP_STARTS = {"temps", "nozzles", "hms", "telemetry"}
