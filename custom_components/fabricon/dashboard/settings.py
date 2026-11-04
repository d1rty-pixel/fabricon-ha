"""Fixed names and placeholders of the generated dashboard, and the options it is built with.

The generator runs inside Home Assistant (the fabricon integration, ../dashboard_panel.py) and in deploy.py --dump.
OPTIONS are set by build() from the integration's options before anything is generated; read them at call time
(settings.OPTIONS[...]), never import them by value.
"""

URL_PATH = "fabricon-dashboard"   # HA needs a hyphen in dashboard paths
TITLE = "Fabricon"
ICON = "mdi:hammer-wrench"

# Template printer: the generated config is written for these placeholders; build() swaps in each printer's entity
# prefix and device id (found in the device registry).
P = "x2d_template"
DEV = "__P_DEV__"
# AMS cards are a template the twin card repeats for each connected unit (up to 4, found at runtime): these tokens
# become the unit's entity prefix, device id and letter (A-D)
A = "__AMS__"
DEV_AMS = "__AMS_DEV__"
# per-printer identity in the generated config, filled in for each printer's view (the name is read live)
P_MODEL, P_SERIAL, P_SLUG, P_LIST = "__P_MODEL__", "__P_SERIAL__", "__P_SLUG__", "__P_LIST__"

# The job model shown on the bed (optional, a developer feature: deploy.py --stl), served under /local/
STL = "prints/current.stl"

OPTIONS = {
    "ams": True,            # AMS support; the units themselves are detected by the card
    "exhaust_box": False,   # the External Exhaust Fan kit on the back (HA can't tell it is fitted)
    "demo": False,          # demo printer views in fixed states (demo.py)
    "bambuddy_url": "",     # link on the Maintenance panel (from the bambuddy integration)
}
