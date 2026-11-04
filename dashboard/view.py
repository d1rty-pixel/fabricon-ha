"""The dashboard's view: a fab_page grid with the header, the status bar and the live 3D model (card/), whose
fly-out sidebar holds the panels (panels.py) and whose control strip holds the footer keys."""
from . import panels
from .controls import header, press, speed_bars, status_bar
from .lib import SHARED_CSS, bc, css, e
from .settings import EXHAUST_BOX, HAS_AMS, P, P_SERIAL, STL


def footer():
    """Control strip: the card's own START key (fab_start: file, slots and options come from the print dock), then
    pause, resume, the stop button and the speed bars. The chamber light is a key in the model's view tools."""
    return [{"fab_start": True},
            press(e("button", "pause"), "Pause", "mdi:pause", "var(--fab-o)", enabled="return ['printing','preparing'].includes(s);"),
            press(e("button", "resume"), "Resume", "mdi:play", "var(--fab-y)", enabled="return s === 'paused';"),
            bc("fab_estop"), speed_bars()]


def model(stl_version):
    return {"type": "custom:fabricon-card", "printer": P, "ams": HAS_AMS, "exhaust_box": EXHAUST_BOX,
            "stl": f"/local/{STL}?v={stl_version}",
            "height": "fill", "serial": P_SERIAL, "camera": e("camera", "camera"),
            "panels": [{**p(), "gap": p()["key"] in panels.GROUP_STARTS} for p in panels.PANELS], "footer": footer(), "footer_columns": "2.6fr 1fr 1fr 2.1fr 3.2fr",
            # phones: Start, Stop / Pause, Resume, Speed (2 + 2 / 1 + 1 + 2 of 4 columns)
            "footer_narrow": {"columns": "repeat(4, minmax(0, 1fr))", "span": {0: 2, 3: 2, 4: 2}, "order": [0, 3, 1, 2, 4]}}


def view(stl_version):
    """Rows of the page grid, each full width: 12 columns between two gutters on desktop, 2 under 900 px; the
    header runs edge to edge."""
    rows = ["head", "nav", "model"]

    def areas(cols):
        return " ".join('"' + " ".join([n] * (cols + 2) if n == "head" else ["."] + [n] * cols + ["."]) + '"' for n in rows)

    fields = {"model": {"card": model(stl_version)}, "head": {"card": header()}, "nav": {"card": status_bar()}}
    mobile_css = (f'@media (max-width: 900px) {{ #container {{ grid-template-columns: 2px repeat(2, minmax(0,1fr)) 2px !important;'
                  f' grid-template-areas: {areas(2)} !important; column-gap: 10px !important; row-gap: 10px !important; }} }}')
    card = bc("fab_page", custom_fields=fields, styles={
        "grid": css({"grid-template-columns": "4px repeat(12, minmax(0,1fr)) 4px", "grid-template-areas": areas(12)}),
        "custom_fields": {k: css({"min-width": "0"}) for k in fields},
    }, extra_styles=SHARED_CSS + "#container > div > * { height: 100%; }\n" + mobile_css)
    return {"type": "panel", "cards": [card]}
