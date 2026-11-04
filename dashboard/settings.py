"""Where things live and what the printer has. Everything else is generated from these.

These are defaults; put your own values into dashboard/settings_local.py (not in git), it is imported at the end
and overrides anything defined here. See README.md.
"""

HA_URL = "http://homeassistant.local:8123"
HA_TOKEN = "~/.config/homeassistant/token"      # file with a long-lived access token
# Optional ssh to the HA host, e.g. ["ssh", "-o", "BatchMode=yes", "hassio@homeassistant.local"]: files go into
# /config/www and /config/custom_components that way and deploy.py installs the integration itself. None: files go
# through the Fabricon integration's admin-only upload endpoint (the integration comes from HACS).
SSH = None
SSH_SUDO = True                                  # prefix the ssh commands with sudo (False when logged in as root)
BAMBUDDY_URL = "http://homeassistant.local:8000"   # link on the Maintenance panel

URL_PATH = "fabricon-dashboard"   # HA needs a hyphen in dashboard paths
TITLE = "Fabricon"
ICON = "mdi:hammer-wrench"

# Template printer: the generated config is written for its entity prefix and device id; build() swaps in each
# printer's own (found in the device registry). Set them to your main printer: its view comes first and the demo
# printers copy its states. The placeholders work too (no demos then).
P = "x2d_template"
DEV = "__P_DEV__"
# AMS cards are a template the twin card repeats for each connected unit (up to 4, found at runtime): these tokens
# become the unit's entity prefix, device id and letter (A-D)
A = "__AMS__"
DEV_AMS = "__AMS_DEV__"
# per-printer identity in the generated config, filled in for each printer's view (the name is read live)
P_MODEL, P_SERIAL, P_SLUG, P_LIST = "__P_MODEL__", "__P_SERIAL__", "__P_SLUG__", "__P_LIST__"

# Optional hardware: without them the model, its labels and their panels / controls leave them out. HA can't
# tell whether the External Exhaust Fan kit is fitted (the integration creates the exhaust fan on every X2D).
HAS_AMS = True                                   # AMS support; the units themselves are detected
EXHAUST_BOX = True

# Files on the HA host, served under /local/
CARD = "fabricon-card.js"                          # built from card/*.js
STL = "prints/current.stl"                       # the current job's model, shown on the bed

# Test printers in fixed states (offline, printing, paused, finished, failed, no data), see demo.py: views after the
# real printers, their entities only in HA's state machine (set by the fabricon integration). False + deploy = gone.
DEMO_PRINTERS = False

try:
    from .settings_local import *  # noqa: E402,F401,F403
except ImportError:
    pass
