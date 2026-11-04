"""Components used in more than one place: header, status bar, keys, fan / heater rows, speed bars."""
from .lib import (CHAMFER, HAZARD, JS_HMS, JS_LOCKED, JS_SLIDER, JS_STATUS, JS_TONE, NO_ACTION, NO_CHAMFER, SHARED_CSS, UNKNOWN,
                  bc, call, css, e, grid, js)


def header():
    """Page header; the HA logo on the left leads back to Home Assistant (the sidebar is hidden by kiosk-mode)."""
    home = bc("fab_base", icon="mdi:home-assistant", show_name=False, show_state=False,
              tap_action={"action": "navigate", "navigation_path": "/"},
              styles={"card": css({"width": "40px", "height": "40px", "padding": "0", "cursor": "pointer",
                                   "background": "none", "box-shadow": "none"}),
                      "icon": css({"width": "34px", "color": "var(--fab-y)", "filter": "drop-shadow(0 0 6px rgba(255,180,0,.45))"})},
              extra_styles=NO_CHAMFER + " ha-card:hover #icon { filter: drop-shadow(0 0 10px rgba(255,180,0,.8)) !important; }")
    return bc("fab_header", custom_fields={"home": {"card": home}})


def status_bar():
    """Under the header: the HMS alarm while it applies. (Locked controls show only on the controls themselves; an
    offline printer is shown on the model.)"""
    hms = js(JS_HMS + f"""
const errs = fabHmsOpen();
if (!errs.length) return '';
const ps = states['sensor.$P_print_status']?.state;
const key = (txt, js) => `<button onclick="event.stopPropagation();${{js}}" onpointerdown="event.stopPropagation()" style="font:13px var(--fab-font);letter-spacing:2px;
  text-transform:uppercase;cursor:pointer;padding:4px 12px;border:1px solid rgba(255,180,0,.45);background:#0b0b0b;color:var(--fab-txt)">${{txt}}</button>`;
const cam = "window.dispatchEvent(new CustomEvent('fabricon-camera'))";
return `<div style="margin-bottom:8px;padding:4px 14px 6px;background:linear-gradient(rgba(14,8,6,.92),rgba(14,8,6,.92)),{HAZARD};background-size:100% 100%,24px 24px;
  box-shadow:inset 0 0 0 1px var(--fab-o),0 0 18px rgba(255,106,0,.25);text-align:left">
  <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding-top:2px">
    <span style="font-size:17px;letter-spacing:3px;color:var(--fab-o);animation:fab-blink 1.4s infinite">⚠ HMS · ${{errs.length}} MESSAGE${{errs.length > 1 ? 'S' : ''}}</span>
    <span style="font-family:var(--fab-mono);font-size:10.5px;letter-spacing:1.5px;color:var(--fab-txt);flex:1;min-width:200px;white-space:normal">${{ps === 'paused' ? 'PRINT PAUSED BY THE PRINTER — CHECK THE CAMERA, THEN ANSWER' : 'PRINT ' + (ps || '').toUpperCase()}}</span>
    ${{key('Camera', cam)}}${{key('Clear', "document.querySelector('home-assistant').hass.callService('button','press',{{entity_id:'{e('button', 'clear_hms_errors')}'}})")}}</div>
  ${{fabHms(errs)}}</div>`;
""")
    return bc("fab_base", show_icon=False, show_name=False, show_state=False, triggers_update=[e("sensor", "print_status"), e("sensor", "hms_errors")],
              styles={"card": css({"background": "none", "box-shadow": "none", "padding": "0", "height": "auto", "overflow": "visible"}),
                      "grid": css({"grid-template-areas": '"hms"', "grid-template-columns": "minmax(0,1fr)", "row-gap": "0"}),
                      "custom_fields": {"hms": css({"min-width": "0", "justify-self": "stretch", "width": "100%"})}},
              extra_styles=NO_CHAMFER,
              custom_fields={"hms": hms})


def press(entity, name, icon, color="var(--fab-y)", enabled=None):
    """A key for a button.* entity; enabled: JS after JS_STATUS returning whether it can be pressed."""
    card = bc("fab_btn", name=name, icon=icon, entity=entity, variables={"color": color},
              tap_action=call("button", "press", target=entity))
    if enabled:
        card["variables"]["enabled"] = js(JS_STATUS + enabled)
        card["triggers_update"] = [e("sensor", "print_status")]
    return card


def key(name, icon, label, tap_action, color=None):
    """Compact fab_key with a status line."""
    card = bc("fab_key", name=name, icon=icon, label=label, tap_action=tap_action)
    if color:
        card["variables"] = {"color": color}
    return card


def read(entity, name, icon, **kw):
    """Readout row: name + formatted value."""
    return bc("fab_read", entity=entity, name=name, icon=icon, **kw)


def firmware_read():
    return read(e("update", "firmware"), "Firmware", "mdi:chip",
                label="[[[ return (entity.attributes.installed_version || '—') + (entity.state === 'on' ? ' → ' + entity.attributes.latest_version : '') ]]]")


def fan_card(key, name, icon="mdi:fan", auto=False):
    """A fan with its speed slider. auto: a fan the printer runs by itself (the hotend fan, a sensor in %):
    same card, the slider always locked."""
    pct = ("const p = ['unavailable', 'unknown'].includes(entity.state) ? 0 : Math.round(parseFloat(entity.state) || 0);" if auto
           else "const p = entity.state === 'on' ? (entity.attributes.percentage || 0) : 0;")
    return bc("fab_ctl", entity=e("sensor" if auto else "fan", key), name=name, icon=icon, triggers_update=[e("sensor", "print_status")],
              tap_action=NO_ACTION if auto else {"action": "toggle"},
              label=js(pct + f"return {UNKNOWN} ? '—' : p ? p + ' %' : 'OFF';"),
              variables={"tone": js(pct + "return p ? 'on' : 'off';"), "anim": js(pct + """
return p ? `fab-spin ${(2.4 - p / 50).toFixed(2)}s linear infinite` : 'none';
""")},
              custom_fields={"ctl": js(JS_SLIDER + pct + f"""
return slider({{id: entity.entity_id, domain: 'fan', service: 'set_percentage', key: 'percentage', value: p, min: 0, max: 100,
               step: entity.attributes.percentage_step || 10, unit: ' %', off: 'OFF', label: '{"SPEED · SET BY PRINTER" if auto else "SPEED"}',
               actual: p, disabled: {"true" if auto else UNKNOWN}, na: {UNKNOWN}}});
""")})


def heat_card(name, sensor_key, target_key, icon):
    """A heater: measured temperature, target slider."""
    target = e("number", target_key)
    heat = JS_TONE + "const heat = fabTone.heat(entity, states[variables.target]);"
    return bc("fab_ctl", entity=e("sensor", sensor_key), name=name, icon=icon,
              triggers_update=[e("sensor", sensor_key), target, e("sensor", "print_status")],
              tap_action={"action": "more-info", "entity": target},
              label="[[[ const c = parseFloat(entity.state); return isNaN(c) ? '—' : Math.round(c) + '<span style=\"font-size:15px;color:var(--fab-dim)\"> °C</span>' ]]]",
              variables={"target": target,
                         "tone": js(heat + "return heat;"),
                         "anim": js(heat + "return heat === 'warn' ? 'fab-blink 1.2s infinite' : 'none';")},
              custom_fields={"ctl": js(JS_SLIDER + """
const n = states[variables.target], a = n?.attributes || {};
return slider({id: variables.target, domain: 'number', service: 'set_value', key: 'value', value: Math.round(parseFloat(n?.state) || 0),
               min: a.min ?? 0, max: a.max ?? 300, step: a.step >= 5 ? a.step : 5, unit: '°', off: 'OFF', label: 'TARGET',
               actual: parseFloat(entity.state), disabled: !n || ['unavailable', 'unknown'].includes(n.state),
               na: !n || ['unavailable', 'unknown'].includes(n.state)});
""")})


def mode_keys(select, keys):
    """select.select_option keys, two per row; keys: (option, name, icon, label, color or None). Locked while a job runs."""
    return grid(2, [bc("fab_mode", name=name, icon=icon, label=label,
                       variables={"select": select, "option": opt, **({"color": col} if col else {}), "lockable": True})
                    for opt, name, icon, label, col in keys])


def load_btn(sensor, name="Load"):
    """bambuddy.load_filament: idle or paused only (a paused print = colour change by hand), not the slot already in use."""
    return bc("fab_key", entity=sensor, name=name, icon="mdi:tray-arrow-down",
              triggers_update=[sensor, e("sensor", "print_status")],
              label=js(JS_STATUS + """
if (entity.attributes.empty) return 'EMPTY';
if (entity.attributes.active) return 'IN USE';
if (['printing', 'preparing'].includes(s)) return 'PRINTING';
return s === 'paused' ? 'COLOR CHANGE' : 'TO NOZZLE';
"""),
              variables={"enabled": js(JS_STATUS + "return !entity.attributes.empty && !entity.attributes.active && !['printing', 'preparing', 'offline'].includes(s);")},
              tap_action=call("bambuddy", "load_filament", entity_id=sensor,
                              confirm=js("return `Load ${entity.attributes.type || 'filament'}${entity.attributes.name ? ' (' + entity.attributes.name + ')' : ''}?`")))


def speed_bars():
    """Print speed as four slanted bars rising left to right, filled up to the chosen mode; each bar selects its mode."""
    sel = e("select", "print_speed")
    return bc("fab_base", entity=sel, show_icon=False, show_name=False, show_state=False,
              # narrow (phones, tablets in portrait): the bar names go, the mode stays readable on the left
              extra_styles=CHAMFER + SHARED_CSS + """
ha-card { container-type: inline-size; }
@container (max-width: 380px) { .sbl { display: none; } .sb { gap: 7px !important; padding: 0 4px !important; } }
@container (max-width: 260px) { #container { column-gap: 8px !important; } }
""",
              styles={"card": css({"padding": "8px 14px", "height": "76px"}),
                      "grid": css({"grid-template-areas": '"t bars"', "grid-template-columns": "auto 1fr", "column-gap": "16px", "height": "100%"}),
                      "custom_fields": {"t": css({"align-self": "center", "text-align": "left"}),
                                        "bars": css({"align-self": "stretch", "min-width": "0"})}},
              custom_fields={
                  "t": js("""
const m = {silent: ['SILENT', '50 %'], standard: ['STANDARD', '100 %'], sport: ['SPORT', '124 %'], ludicrous: ['LUDICROUS', '166 %']}[entity?.state] || ['—', ''];
return `<div style="font-family:var(--fab-mono);font-size:10px;letter-spacing:2px;color:var(--fab-dim)">SPEED</div>
  <div style="font-size:24px;letter-spacing:3px;line-height:1;color:var(--fab-y)">${m[0]}</div>
  <div style="font-family:var(--fab-mono);font-size:10px;color:var(--fab-txt);opacity:.7">${m[1]}</div>`;
"""),
                  "bars": js("""
const modes = [['silent', 'SILENT', 'var(--fab-y)'], ['standard', 'STANDARD', 'var(--fab-y)'], ['sport', 'SPORT', 'var(--fab-o)'], ['ludicrous', 'LUDICROUS', 'var(--fab-r)']];
const cur = modes.findIndex(x => x[0] === entity?.state), off = !entity || ['unavailable', 'unknown'].includes(entity.state);
return `<div class="sb" style="display:flex;align-items:flex-end;gap:10px;height:58px;padding:0 8px;opacity:${off ? .35 : 1}">${modes.map(([opt, lbl, col], i) => {
  const on = i <= cur, here = i === cur;
  const call = `event.stopPropagation();document.querySelector('home-assistant').hass.callService('select','select_option',{entity_id:'${entity?.entity_id}',option:'${opt}'})`;
  return `<div onclick="${off ? '' : call}" onpointerdown="event.stopPropagation()" title="${opt}"
    style="flex:1;height:${20 + i * 12.5}px;cursor:${off ? 'default' : 'pointer'};position:relative;transform:skewX(-22deg);
    background:${on ? col : '#1d1d1c'};box-shadow:${here ? `0 0 16px ${col}, inset 0 0 0 2px #0b0b0b` : on ? `0 0 8px ${col}` : 'inset 0 0 0 1px rgba(255,180,0,.22)'}">
    <span class="sbl" style="position:absolute;left:0;right:0;bottom:3px;transform:skewX(22deg);text-align:center;font-family:var(--fab-mono);font-size:9.5px;
      letter-spacing:1.5px;color:${on ? '#0b0b0b' : 'var(--fab-dim)'};font-weight:${here ? 700 : 400}">${lbl}</span></div>`;
}).join('')}</div>`;
""")})
