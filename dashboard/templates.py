"""The button-card templates (T): the look of every panel, key, slider row and readout."""
from .lib import CHAMFER, HAZARD, JS_BAR, JS_FMT, JS_LOCKED, JS_STATUS, JS_TONE, NO_ACTION, SHARED_CSS, css, e, js
from .settings import DEV, P_LIST, P_MODEL, P_SLUG, URL_PATH

DESIGN_VARS = {
    "--fab-y": "#FFB400",
    "--fab-o": "#FF6A00",
    "--fab-r": "#FF2E2E",
    "--fab-txt": "#EDE6D6",
    "--fab-dim": "#7d776b",
    "--fab-font": "Antonio, 'Bebas Neue', Oswald, 'Arial Narrow', sans-serif",
    "--fab-mono": "'JetBrains Mono', 'Cascadia Mono', 'Roboto Mono', Consolas, monospace",
    # make the stock cards (picture-entity, apexcharts) blend in
    "--ha-card-border-radius": "0",
    "--ha-card-background": "#121213",
    "--card-background-color": "#121213",
    "--primary-text-color": "#EDE6D6",
    "--secondary-text-color": "#7d776b",
    "--primary-color": "#FFB400",
    "--divider-color": "rgba(255,180,0,.18)",
    "--grid-card-gap": "8px",
    "--vertical-stack-card-gap": "8px",
}

NO_ACTION = {"action": "none"}


T = {}

T["fab_base"] = {
    "variables": {"accent": "var(--fab-y)"},
    "tap_action": NO_ACTION,
    "hold_action": NO_ACTION,
    "double_tap_action": NO_ACTION,
    "styles": {
        "card": css({
            "border-radius": "0", "border": "none", "padding": "12px", "height": "100%", "box-sizing": "border-box",
            "color": "var(--fab-txt)", "font-family": "var(--fab-font)",
            "background": "linear-gradient(180deg,#1c1c1e 0%,#111112 100%)",
            "box-shadow": "inset 0 0 0 1px rgba(255,180,0,.16), 0 8px 22px rgba(0,0,0,.45)",
            "--mdc-ripple-color": "#FFB400",
        }),
        "name": css({"font-family": "var(--fab-font)"}),
        "label": css({"font-family": "var(--fab-font)"}),
    },
    "extra_styles": CHAMFER + SHARED_CSS,
}

# Panel with a yellow tab as its name
T["fab_panel"] = {
    "template": "fab_base",
    "show_icon": False,
    "show_state": False,
    "variables": {"lit": False},
    "styles": {
        "card": css({"padding": "0", "box-shadow": "[[[ return variables.lit ? 'inset 0 0 0 2px var(--fab-y), 0 0 28px rgba(255,180,0,.25)' : 'inset 0 0 0 1px rgba(255,180,0,.16), 0 8px 22px rgba(0,0,0,.45)' ]]]"}),
        "grid": css({"grid-template-areas": '"n" "body"', "grid-template-rows": "auto 1fr", "height": "100%"}),
        "name": css({
            "justify-self": "start", "background": "var(--fab-y)", "color": "#0b0b0b", "font-size": "12px",
            "font-weight": "700", "letter-spacing": "2.5px", "text-transform": "uppercase", "padding": "3px 16px 3px 10px",
            "clip-path": "polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
        }),
        "custom_fields": {
            "body": css({"padding": "12px 14px 14px", "align-self": "stretch", "text-align": "left",
                         "white-space": "normal", "overflow": "visible"}),
        },
    },
}

T["fab_panel_ctl"] = {
    "template": "fab_panel",
    "styles": {
        "grid": css({"grid-template-areas": '"n" "body" "ctl"', "grid-template-rows": "auto 1fr auto"}),
        "custom_fields": {"ctl": css({"padding": "0 14px 14px"})},
    },
}

# Section rule: tab + ruler line
T["fab_tab"] = {
    "template": "fab_base",
    "show_icon": False,
    "show_state": False,
    "styles": {
        "card": css({"background": "none", "box-shadow": "none", "padding": "2px 0", "height": "auto"}),
        "grid": css({"grid-template-areas": '"n line"', "grid-template-columns": "auto 1fr", "column-gap": "10px"}),
        "name": T["fab_panel"]["styles"]["name"],
        "custom_fields": {"line": css({"align-self": "center"})},
    },
    "custom_fields": {
        "line": '<div style="height:7px;background:linear-gradient(90deg,rgba(255,180,0,.55) 0 1px,transparent 1px) 0 0/10px 7px,'
                'linear-gradient(rgba(255,180,0,.3),rgba(255,180,0,.3)) 0 100%/100% 1px no-repeat"></div>',
    },
    "extra_styles": SHARED_CSS,
}

T["fab_page"] = {
    "show_name": False,
    "show_icon": False,
    "show_state": False,
    "tap_action": NO_ACTION,
    "hold_action": NO_ACTION,
    "double_tap_action": NO_ACTION,
    "styles": {
        "card": css({
            **DESIGN_VARS,
            "min-height": "100vh", "border-radius": "0", "border": "none", "box-shadow": "none",
            "padding": "0 0 10px 0", "overflow": "visible", "cursor": "default",
            "align-items": "flex-start",  # ha-card is a centring flexbox in button-card
            "color": "var(--fab-txt)", "font-family": "var(--fab-font)",
            "background-color": "#151517",
            # pegboard: holes every 28px, faint blueprint grid every 140px, vignette
            "background-image": "radial-gradient(circle at 14px 14px, #040404 0 3.2px, rgba(255,255,255,.05) 3.7px 4.6px, transparent 5px),"
                                "linear-gradient(rgba(255,180,0,.035) 1px, transparent 1px),"
                                "linear-gradient(90deg, rgba(255,180,0,.035) 1px, transparent 1px),"
                                "radial-gradient(ellipse at 50% 0%, rgba(255,180,0,.06), transparent 60%),"
                                "linear-gradient(180deg, transparent 40%, rgba(0,0,0,.55))",
            "background-size": "28px 28px, 140px 140px, 140px 140px, 100% 100%, 100% 100%",
            "background-attachment": "fixed",
        }),
        "grid": css({"column-gap": "10px", "row-gap": "10px", "align-items": "stretch", "align-content": "start",
                     "grid-auto-rows": "auto"}),
    },
}

# Page header: HA logo (custom field home), app / printer name with the printer dropdown, status lamp, clock, ruler
T["fab_header"] = {
    "template": "fab_base",
    "entity": e("sensor", "print_status"),
    "show_icon": False,
    "show_name": False,
    "show_state": False,
    "triggers_update": [e("sensor", "print_status"), e("sensor", "print_stage"), e("sensor", "progress"), "sensor.time"],
    "styles": {
        "card": css({"padding": "0", "height": "auto", "background": "linear-gradient(180deg,#09090a,#131315)",
                     "box-shadow": "0 6px 24px rgba(0,0,0,.6)"}),
        "grid": css({"grid-template-areas": '"home title status clock" "ruler ruler ruler ruler"',
                     "grid-template-columns": "auto 1fr auto auto", "column-gap": "22px", "align-items": "center"}),
        "custom_fields": {
            "home": css({"padding": "0 18px 0 16px", "align-self": "stretch", "display": "flex", "align-items": "center",
                         "border-right": "1px solid rgba(255,180,0,.22)"}),
            "title": css({"justify-self": "start", "text-align": "left", "overflow": "hidden", "padding": "8px 0 7px 0"}),
            "status": css({"justify-self": "end"}),
            "clock": css({"padding-right": "20px"}),
            "ruler": css({"align-self": "stretch"}),
        },
    },
    "custom_fields": {
        # app name and model small over the printer's name (large); with several printers the block is a
        # dropdown (an invisible select laid over it) that switches to that printer's view. Names come live from
        # HA's device registry (BamBuddy renames show up without a redeploy), without its "(model / serial)" suffix
        "title": js(f"""
const list = {P_LIST}, many = list.length > 1;
const pname = (dev, alt) => {{ const d = hass.devices?.[dev]; return d ? d.name_by_user || (d.name || '').replace(/\\s*\\([^()]*\\)$/, '') : alt || '—'; }};
const go = `history.pushState(null, '', '/{URL_PATH}/' + this.value); window.dispatchEvent(new CustomEvent('location-changed'))`;
return `<div style="font-family:var(--fab-mono);font-size:10.5px;letter-spacing:4px;color:var(--fab-dim);line-height:1;margin-bottom:5px">FABRICON · <span class="model">{P_MODEL}</span></div>
  <div class="who" style="position:relative;display:inline-flex;align-items:baseline;gap:12px;white-space:nowrap;max-width:100%">
  <span class="name" style="font-size:30px;font-weight:700;letter-spacing:3px;color:var(--fab-y);line-height:1;text-shadow:0 0 18px rgba(255,180,0,.35);text-transform:uppercase;overflow:hidden;text-overflow:ellipsis">${{pname('{DEV}', list.find((p) => p.slug === '{P_SLUG}')?.name)}}</span>
  ${{many ? `<ha-icon icon="mdi:chevron-down" style="--mdc-icon-size:22px;color:var(--fab-y);align-self:center"></ha-icon>
    <select data-fab-select onchange="${{go}}" onclick="event.stopPropagation()" title="Switch printer"
      style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%">${{list.map((p) =>
      `<option value="${{p.slug}}" ${{p.slug === '{P_SLUG}' ? 'selected' : ''}}>${{p.model}} · ${{pname(p.dev, p.name)}}</option>`).join('')}}</select>` : ''}}</div>`;
"""),
        "status": js(JS_STATUS + JS_FMT + """
const stg = states['sensor.$P_print_stage'];
const sub = active ? `${fmt(stg)} · ${Math.round(parseFloat(states['sensor.$P_progress'].state) || 0)} %`
                   : ['offline', 'unknown', 'unavailable'].includes(s) ? 'NO CONNECTION' : 'SYSTEM READY';
return `<div style="display:flex;align-items:center;gap:12px">
  <span style="width:13px;height:13px;border-radius:50%;background:${scol};box-shadow:0 0 14px ${scol};${s === 'printing' ? 'animation:fab-blink 1.6s infinite' : ''}"></span>
  <div style="text-align:left"><div style="font-size:21px;letter-spacing:3px;text-transform:uppercase;line-height:1.05;color:${scol}">${fmt(ps)}</div>
  <div style="font-family:var(--fab-mono);font-size:10.5px;letter-spacing:1px;color:var(--fab-dim);text-transform:uppercase">${sub}</div></div></div>`;
"""),
        "clock": js("""
const t = states['sensor.time'] ? states['sensor.time'].state : '';
const d = new Date().toLocaleDateString('en-GB', {weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'});
return `<div style="text-align:right"><div style="font-size:28px;letter-spacing:3px;line-height:1">${t}</div>
  <div style="font-family:var(--fab-mono);font-size:10.5px;letter-spacing:2px;color:var(--fab-dim);text-transform:uppercase">${d}</div></div>`;
"""),
        "ruler": '<div style="height:9px;border-top:1px solid rgba(255,180,0,.45);'
                 'background:linear-gradient(90deg,rgba(255,180,0,.7) 0 1px,transparent 1px) 0 0/100px 9px,'
                 'linear-gradient(90deg,rgba(255,180,0,.35) 0 1px,transparent 1px) 0 0/10px 5px repeat-x"></div>',
    },
    "extra_styles": SHARED_CSS + """
@media (max-width: 760px) {
  #container { grid-template-areas: "home title clock" "ruler ruler ruler" !important;
               grid-template-columns: auto 1fr auto !important; column-gap: 12px !important; }
  #home { padding: 0 10px !important; }
  #status { display: none; }
  #clock { justify-self: end; }
  #title { padding: 10px 0 !important; }
  #title .name { font-size: 24px !important; letter-spacing: 2px !important; }
  #title { min-width: 0; justify-self: stretch !important; }
  #title > div { overflow: hidden; }
  #clock > div > div:first-child { font-size: 22px !important; }
}
@media (max-width: 420px) {
  #clock { display: none; }
  #container { grid-template-areas: "home title" "ruler ruler" !important; grid-template-columns: auto 1fr !important; }
}
""",
}

# Industrial key; variables: color, enabled, on
T["fab_btn"] = {
    "template": "fab_base",
    "show_state": False,
    "variables": {"color": "var(--fab-y)", "enabled": True, "on": False, "lockable": False},
    "styles": {
        "card": css({
            "height": "76px", "padding": "8px 6px", "cursor": "pointer",
            "--btn-c": "[[[ return variables.color ]]]",
            "opacity": js(JS_LOCKED + "return variables.enabled && !(variables.lockable && fabLocked()) ? 1 : .28;"),
            "pointer-events": js(JS_LOCKED + "return variables.enabled && !(variables.lockable && fabLocked()) ? 'auto' : 'none';"),
            "background": "[[[ return variables.on ? variables.color : 'linear-gradient(180deg,#202022,#111112)' ]]]",
        }),
        "grid": css({"grid-template-areas": '"i" "n"', "grid-template-rows": "1fr auto"}),
        "icon": css({"width": "30px", "color": "[[[ return variables.on ? '#0b0b0b' : variables.color ]]]"}),
        "name": css({"font-size": "15px", "letter-spacing": "3px", "text-transform": "uppercase", "justify-self": "center",
                     "padding-top": "4px", "color": "[[[ return variables.on ? '#0b0b0b' : 'var(--fab-txt)' ]]]"}),
    },
    "extra_styles": CHAMFER + SHARED_CSS + """
#container::before { content: ''; position: absolute; left: 0; top: 0; right: 14px; height: 3px; background: var(--btn-c); box-shadow: 0 0 10px var(--btn-c); }
ha-card:hover { box-shadow: inset 0 0 0 1px var(--btn-c), 0 0 18px rgba(0,0,0,.4) !important; }
""",
}

# Compact key with a status line (load / unload, dryer, HMS)
T["fab_key"] = {
    "template": "fab_btn",
    "show_label": True,
    "styles": {
        "card": css({"height": "56px", "padding": "6px"}),
        "grid": css({"grid-template-areas": '"i n" "i l"', "grid-template-columns": "40px auto", "grid-template-rows": "1fr 1fr",
                     "justify-content": "center", "column-gap": "8px"}),
        "icon": css({"width": "24px"}),
        "name": css({"justify-self": "start", "align-self": "end", "padding-top": "0"}),
        "label": css({"justify-self": "start", "align-self": "start", "font-family": "var(--fab-mono)", "font-size": "10px",
                      "letter-spacing": "1px", "color": "var(--fab-dim)"}),
    },
}

# Emergency stop
T["fab_estop"] = {
    "template": "fab_base",
    "show_icon": False,
    "show_name": False,
    "show_state": False,
    "entity": e("button", "stop"),
    # armed whenever the printer is online: homing, jogging or extruding outside a job leave the status at
    # idle / finished (BamBuddy reports no motion), so "a job is running" cannot be the condition
    "variables": {"enabled": js(JS_STATUS + "return s !== 'offline' && s !== 'unknown' && states['binary_sensor.$P_online']?.state === 'on';")},
    "triggers_update": [e("sensor", "print_status"), e("binary_sensor", "online")],
    "tap_action": {
        "action": "perform-action",
        "perform_action": "button.press",
        "target": {"entity_id": e("button", "stop")},
        "confirmation": {"text": "Stop the printer now?"},
    },
    "styles": {
        "card": css({
            "height": "76px", "padding": "0", "cursor": "pointer",
            "background": f"linear-gradient(rgba(10,10,10,.55),rgba(10,10,10,.55)), {HAZARD}",
            "background-size": "100% 100%, 34px 34px",
            "filter": "[[[ return variables.enabled ? 'none' : 'grayscale(1) brightness(.55)' ]]]",
            "pointer-events": "[[[ return variables.enabled ? 'auto' : 'none' ]]]",
        }),
        "grid": css({"grid-template-areas": '"knob txt"', "grid-template-columns": "auto auto", "justify-content": "center",
                     "column-gap": "16px", "height": "100%"}),
        "custom_fields": {"knob": css({"align-self": "center"}), "txt": css({"align-self": "center", "text-align": "left"})},
    },
    "custom_fields": {
        # mushroom head on a yellow collar: the head's side wall is a stacked shadow, pressing sinks it
        "knob": js("""
return `<div class="stop-collar"><div class="stop-head${variables.enabled ? ' armed' : ''}">
  <ha-icon icon="mdi:stop" style="--mdc-icon-size:28px"></ha-icon></div></div>`;
"""),
        "txt": '<div style="background:#0b0b0b;padding:4px 10px;font-size:22px;letter-spacing:4px;color:var(--fab-r);line-height:1">STOP</div>',
    },
    "extra_styles": CHAMFER + SHARED_CSS + """
.stop-collar { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle at 40% 30%, #ffe27a, #e0a000 60%, #8a5c00);
  box-shadow: 0 0 0 3px #0b0b0b, 0 6px 12px rgba(0,0,0,.75), inset 0 -3px 5px rgba(0,0,0,.4), inset 0 2px 2px rgba(255,255,255,.4); }
.stop-head { position: relative; width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  color: #fff; filter: drop-shadow(0 -1px 0 rgba(0,0,0,.35));
  background: radial-gradient(circle at 38% 28%, #ff8a7a, #e01010 50%, #8a0000);
  --stop-wall: 0 1px 0 #8a0000, 0 2px 0 #7a0000, 0 3px 0 #6a0000, 0 4px 0 #5a0000, 0 5px 0 #4a0000, 0 8px 8px rgba(0,0,0,.6);
  box-shadow: var(--stop-wall), inset 0 -4px 6px rgba(0,0,0,.35);
  transform: translateY(-4px); transition: transform 80ms, box-shadow 80ms; }
.stop-head::before { content: ""; position: absolute; left: 22%; width: 40%; top: 4px; height: 13px; border-radius: 50%;
  background: linear-gradient(rgba(255,255,255,.6), rgba(255,255,255,0)); }
.stop-head.armed { box-shadow: var(--stop-wall), inset 0 -4px 6px rgba(0,0,0,.35), 0 0 28px rgba(255,40,40,.6); }
ha-card:active .stop-head { transform: translateY(0);
  box-shadow: 0 1px 0 #6a0000, 0 2px 3px rgba(0,0,0,.6), inset 0 -2px 4px rgba(0,0,0,.4), inset 0 3px 8px rgba(0,0,0,.35); }
""",
}

# select.select_option key (variables: select, option)
T["fab_mode"] = {
    "template": "fab_btn",
    "variables": {"on": "[[[ return states[variables.select]?.state === variables.option ]]]"},
    "tap_action": {
        "action": "perform-action",
        "perform_action": "select.select_option",
        "target": {"entity_id": "[[[ return variables.select ]]]"},
        "data": {"option": "[[[ return variables.option ]]]"},
    },
    "show_label": True,
    "styles": {
        "card": css({"height": "70px"}),
        "grid": css({"grid-template-areas": '"i" "n" "l"', "grid-template-rows": "1fr auto auto"}),
        "icon": css({"width": "26px"}),
        "label": css({"font-family": "var(--fab-mono)", "font-size": "10px", "justify-self": "center",
                      "color": "[[[ return variables.on ? '#0b0b0b' : 'var(--fab-dim)' ]]]"}),
    },
}

# Rocker switch for switch.* entities
T["fab_toggle"] = {
    "template": "fab_base",
    "show_state": False,
    "show_label": True,
    "tap_action": {"action": "toggle"},
    "hold_action": {"action": "more-info"},
    "label": "[[[ return entity.state === 'on' ? 'ACTIVE' : 'OFF' ]]]",
    "styles": {
        "card": css({"height": "62px", "padding": "8px 14px", "cursor": "pointer"}),
        "grid": css({"grid-template-areas": '"i n rock" "i l rock"', "grid-template-columns": "34px 1fr auto",
                     "column-gap": "10px"}),
        "icon": css({"width": "24px", "color": "[[[ return entity.state === 'on' ? 'var(--fab-y)' : 'var(--fab-dim)' ]]]"}),
        "name": css({"justify-self": "start", "font-size": "17px", "letter-spacing": "2px", "text-transform": "uppercase"}),
        "label": css({"justify-self": "start", "font-family": "var(--fab-mono)", "font-size": "10.5px", "letter-spacing": "1.5px",
                      "color": "[[[ return entity.state === 'on' ? 'var(--fab-y)' : 'var(--fab-dim)' ]]]"}),
        "custom_fields": {"rock": css({"align-self": "center"})},
    },
    "custom_fields": {
        "rock": js("""
const on = entity.state === 'on';
return `<div style="width:54px;height:28px;background:#070707;box-shadow:inset 0 0 0 1px rgba(255,180,0,.3);position:relative">
  <div style="position:absolute;top:3px;bottom:3px;width:22px;${on ? 'right:3px;background:var(--fab-y);box-shadow:0 0 12px var(--fab-y)' : 'left:3px;background:#3a3934'};transition:all .2s"></div>
  <div style="position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 3px,rgba(0,0,0,.35) 3px 4px)"></div></div>`;
"""),
    },
}

# Control row for fans and heaters: icon, name, measured value (label), slider in the ctl field.
# variables.tone: 'on' | 'warn' (heating) | 'off'; variables.anim: CSS animation for the icon.
T["fab_ctl"] = {
    "template": "fab_base",
    "show_state": False,
    "show_label": True,
    "hold_action": {"action": "more-info"},
    "variables": {"tone": "off", "anim": "none"},
    "styles": {
        "card": css({"height": "auto", "padding": "6px 14px", "cursor": "pointer"}),
        "grid": css({"grid-template-areas": '"i n ctl" "i l ctl"', "grid-template-columns": "40px 110px 1fr", "column-gap": "12px"}),
        "icon": css({"width": "30px", "color": js(JS_TONE + "return fabTone.color(variables.tone);"), "animation": "[[[ return variables.anim ]]]"}),
        "name": css({"justify-self": "start", "font-size": "15px", "letter-spacing": "2px", "text-transform": "uppercase", "color": "var(--fab-dim)"}),
        "label": css({"justify-self": "start", "font-size": "24px", "letter-spacing": "1px",
                      "color": "[[[ return variables.tone === 'off' ? 'var(--fab-dim)' : 'var(--fab-txt)' ]]]"}),
        "custom_fields": {"ctl": css({"align-self": "center", "min-width": "0"})},
    },
    "extra_styles": CHAMFER + SHARED_CSS + """
@media (max-width: 600px) { #container { grid-template-areas: "i n" "i l" "ctl ctl" !important; grid-template-columns: 40px 1fr !important; row-gap: 8px; } }
""",
}

# Readout row: label + formatted value
T["fab_read"] = {
    "template": "fab_base",
    "show_state": False,
    "show_label": True,
    "tap_action": {"action": "more-info"},
    "label": js(JS_FMT + "return fmt(entity);"),
    "styles": {
        "card": css({"height": "auto", "padding": "9px 14px", "background": "rgba(10,10,10,.6)", "box-shadow": "inset 0 0 0 1px rgba(255,180,0,.1)"}),
        "grid": css({"grid-template-areas": '"i n l"', "grid-template-columns": "26px 1fr auto", "column-gap": "10px"}),
        "icon": css({"width": "18px", "color": "var(--fab-dim)"}),
        "name": css({"justify-self": "start", "font-size": "14px", "letter-spacing": "2px", "text-transform": "uppercase", "color": "var(--fab-dim)"}),
        "label": css({"justify-self": "end", "font-family": "var(--fab-mono)", "font-size": "13px", "color": "var(--fab-txt)"}),
    },
    "extra_styles": SHARED_CSS,
}

# Small machine key (jog, home, extrude). No tap_action here: button-card merges a card's action data into the
# template's, so a template action would leak its fields (axis, distance) into home_axes / extrude.
T["fab_jog"] = {
    "template": "fab_btn",
    "triggers_update": [e("sensor", "print_status")],
    "variables": {"lockable": True},
    "styles": {
        "card": css({"height": "52px", "padding": "4px"}),
        "icon": css({"width": "22px"}),
        "name": css({"font-size": "13px", "letter-spacing": "1.5px", "padding-top": "0"}),
    },
}

T["fab_blank"] = {
    "show_name": False, "show_icon": False, "show_state": False,
    "tap_action": NO_ACTION, "hold_action": NO_ACTION,
    "styles": {"card": css({"background": "none", "box-shadow": "none", "border": "none", "height": "52px"})},
}

# Maintenance task row (variables: idx)
T["fab_task"] = {
    "template": "fab_base",
    "entity": e("sensor", "maintenance"),
    "show_icon": False,
    "show_name": False,
    "show_state": False,
    "variables": {"idx": 0, "task": "[[[ return (entity.attributes.tasks || [])[variables.idx] || null ]]]"},
    "tap_action": {
        "action": "perform-action",
        "perform_action": "bambuddy.mark_maintenance_done",
        "data": {"device_id": DEV, "task_id": "[[[ return variables.task ? variables.task.id : 0 ]]]"},
        "confirmation": {"text": "[[[ return 'Mark maintenance task as done: ' + (variables.task ? variables.task.name : '') + '?' ]]]"},
    },
    "styles": {
        "card": css({"height": "auto", "padding": "12px 16px", "cursor": "pointer",
                     "display": "[[[ return variables.task ? 'block' : 'none' ]]]"}),
        "grid": css({"grid-template-areas": '"info"'}),
        "custom_fields": {"info": css({"text-align": "left", "white-space": "normal"})},
    },
    "custom_fields": {
        "info": js(JS_BAR + """
const t = variables.task; if (!t) return '';
const left = Math.max(0, t.left), p = t.interval ? left / t.interval * 100 : 0;
const col = t.due ? 'var(--fab-r)' : t.due_soon ? 'var(--fab-o)' : 'var(--fab-y)';
const tag = t.due ? 'DUE' : t.due_soon ? 'SOON' : 'OK';
const unit = t.unit === 'hours' ? 'h' : t.unit;
return `<div style="display:flex;align-items:center;gap:14px;margin-bottom:8px">
  <span style="font-family:var(--fab-mono);font-size:11px;color:var(--fab-dim)">W-${String(t.id).padStart(2, '0')}</span>
  <span style="font-size:19px;letter-spacing:1.5px;flex:1;text-transform:uppercase">${t.name}</span>
  <span style="background:${col};color:#0b0b0b;font-size:11px;font-weight:700;letter-spacing:2px;padding:2px 8px">${tag}</span></div>
  ${bar(p, col, null, 10)}
  <div style="display:flex;justify-content:space-between;font-family:var(--fab-mono);font-size:11px;color:var(--fab-dim);margin-top:6px">
  <span>${left.toFixed(1)} ${unit} LEFT OF ${t.interval} ${unit}</span>
  <span>${t.last_done ? 'LAST ' + new Date(t.last_done).toLocaleDateString('en-GB') : 'NEVER DONE'} · TAP = DONE</span></div>`;
"""),
    },
}
