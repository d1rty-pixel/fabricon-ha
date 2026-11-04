# Fabricon

A Home Assistant dashboard for Bambu Lab printers managed by [BamBuddy](https://github.com/maziggy/bambuddy).

- **Live 3D model** of the printer (three.js): heat glow on nozzles, bed and chamber, fans spinning at their
  reported speed, door, chamber light, the active nozzle, AMS spool colours and fill level, drying, and the toolhead
  and bed moving while a job runs. The sliced job is drawn on the bed and grows with the print progress.
- **Print dock**: lists the files on the printer's USB stick, shows a picked file in the 3D view with plate details,
  maps its filaments to the loaded AMS / external slots, and starts it through BamBuddy.
- **Fly-out panels**: Filament (AMS), Temperatures, Fans, Extruder, Motion, HMS, AI monitoring, Telemetry,
  Maintenance.
- **Control strip**: start, pause, resume, stop, speed.
- One view per printer, found automatically in Home Assistant. Works on wall panels, desktops, tablets and phones.

> **Note:** the 3D model is a Bambu Lab **X2D** (with optional AMS 2 Pro units and the External Exhaust Fan kit).
> Other BamBuddy printers get a view as well, but the model still shows an X2D.

## How it fits together

| Part | Where it runs | What it does |
|---|---|---|
| `custom_components/fabricon/` | Home Assistant (integration, via HACS) | lets the dashboard reach BamBuddy's file / print queue API through HA's login (the BamBuddy API key never reaches the browser), and receives the card from `deploy.py` |
| `card/` → `fabricon-card.js` | browser (Lovelace resource) | the 3D model, print dock, sidebar and control strip |
| `dashboard/` | your computer | generates the dashboard (button-card templates, one view per printer) |
| `deploy.py` | your computer | builds the card and the dashboard and installs both in Home Assistant through its API |

The dashboard is generated from Python, so you run `deploy.py` once from any computer that can reach Home Assistant
(Linux, macOS, Windows). It then lives in HA like any other dashboard. You don't need ssh or shell access to the HA
host.

## Requirements

In **Home Assistant**:

- [HACS](https://hacs.xyz)
- [BamBuddy](https://github.com/maziggy/bambuddy) running with your printer(s) added, and the
  [BamBuddy integration](https://github.com/Spegeli/hacs_bambuddy) set up (HACS)
- [button-card](https://github.com/custom-cards/button-card) 7.x (HACS)
- optional: [kiosk-mode](https://github.com/NemesisRE/kiosk-mode) (HACS), which hides HA's header and sidebar on
  this dashboard
- an **administrator** account. Its token is used to create the dashboard and upload the card.

On **your computer**:

- Python 3.9 or newer, nothing else. Optional: Node.js, which `deploy.py` uses to syntax-check the card.

The **browser** loads three.js from jsDelivr, so the dashboard needs internet access.

## Installation

### 1. Install the integration (HACS)

1. In HACS, open the menu (⋮, top right) → *Custom repositories*. Add `https://github.com/d1rty-pixel/fabricon-ha`
   with type **Integration**.
2. Search for **Fabricon** in HACS and download it.
3. Restart Home Assistant. Step 2 can do this for you.

### 2. Run the setup

```sh
git clone https://github.com/d1rty-pixel/fabricon-ha.git
cd fabricon-ha
python3 deploy.py setup
```

On Windows, use `py deploy.py setup`. You can also download the repository as a ZIP from GitHub instead of cloning it.

The setup:

1. asks for your Home Assistant URL (e.g. `http://192.168.1.10:8123`)
2. asks for a **long-lived access token**: in HA click your profile (bottom left) → *Security* → *Long-lived access
   tokens* → *Create token*. The token is stored in `~/.config/homeassistant/token` and only readable by you.
3. checks that BamBuddy, button-card and kiosk-mode are there
4. finds your printers in BamBuddy and detects your AMS
5. asks about the External Exhaust Fan kit, the demo printers and BamBuddy's URL
6. writes everything to `dashboard/settings_local.py`
7. then installs: it sets up the Fabricon integration (restarting HA if needed), uploads the card and creates the
   dashboard **Fabricon** at `/fabricon-dashboard`.

Open `http://<your-ha>:8123/fabricon-dashboard/` and pick a file on the printer's USB stick.

## Updating

```sh
git pull
python3 deploy.py install
```

Update the integration through HACS when it offers an update, then run `python3 deploy.py install`.

After you add a printer to BamBuddy, run `python3 deploy.py config`. Views are created at build time.

## Using the dashboard

**Header**: the printer's name, read live from HA. With more than one printer, it is also a dropdown that switches
views. The Home Assistant logo on the left goes back to HA.

**3D model**: drag to orbit, scroll or pinch to zoom, click a part to open its entity. The view tools contain Labels,
X-ray (hides the door and glass), Rotate, the AMS position (top / left / right with one unit), Reset view, the
chamber Light and the Camera overlay (live picture, fullscreen, snapshot).

**Print dock** (left of the model, below it on narrow screens, collapsible):

1. Pick a file from the printer's USB stick (`.gcode.3mf` / `.gcode`). It loads into the 3D view with its plates,
   print time and filament use.
2. Check the filament mapping. Each filament in the file is mapped to a loaded slot automatically, and you can
   change the mapping with the dropdowns.
3. Set the options (bed levelling, flow calibration, timelapse).
4. Press **START** in the control strip and confirm that the build plate is empty. Fabricon marks the plate as
   cleared in BamBuddy and queues the file. BamBuddy then sends it to the printer.

**Sidebar** (the rail on the right):

| Panel | Contents |
|---|---|
| Filament | AMS units (one at a time; with several, switch them with a dropdown), slots, humidity, drying, external spools |
| Temperatures | nozzle, bed and chamber heaters with sliders |
| Fans | part cooling, exhaust, aux L / R, ventilation, hotend fan (printer-controlled, shown locked), air duct mode |
| Extruder | both nozzles, active nozzle switch, extrude / retract |
| Motion | jog the axes, home |
| HMS | active HMS messages with the answers the printer offers |
| AI monitoring | the printer's spaghetti / build plate / clumping / pile-up detection, filament backup |
| Telemetry | serial number, connection, WiFi, IP, firmware, USB, nozzle types |
| Maintenance | BamBuddy's maintenance schedule (tap a task to mark it done), print statistics, a link to BamBuddy |

**Locks**: while the printer is printing, paused, preparing or offline, all machine controls (heaters, fans, motion,
nozzle switch) are locked but stay visible. Unknown values show as "—".

**Screen sizes**: below 1500 px the panels slide over the model. Below 1100 px the dock moves under the model. On
phones (< 600 px) the model has a fixed view and swipes scroll the page.

**Editing the dashboard in HA**: kiosk-mode hides HA's own header. Open the dashboard with `?disable_km` to get it
back. Don't edit the config in HA's UI, though: the next `deploy.py` overwrites it. Change the Python in
`dashboard/` instead.

## Configuration reference

`python3 deploy.py setup` writes `dashboard/settings_local.py`. You can also edit it by hand: any value from
`dashboard/settings.py` can be overridden there. The file is not in git.

| Setting | Default | Meaning |
|---|---|---|
| `HA_URL` | `http://homeassistant.local:8123` | Home Assistant |
| `HA_TOKEN` | `~/.config/homeassistant/token` | file with a long-lived access token of an admin user |
| `BAMBUDDY_URL` | `http://homeassistant.local:8000` | link on the Maintenance panel |
| `P` / `DEV` | placeholders | main printer's entity prefix and HA device id: its view comes first, and the demo printers copy it |
| `HAS_AMS` | `True` | AMS support. The units themselves (up to 4) are detected at runtime |
| `EXHAUST_BOX` | `True` | External Exhaust Fan kit on the back (HA can't detect it) |
| `DEMO_PRINTERS` | `False` | add demo printer views |
| `URL_PATH` / `TITLE` / `ICON` | `fabricon-dashboard` / `Fabricon` / `mdi:hammer-wrench` | the dashboard (the path needs a hyphen) |
| `SSH` / `SSH_SUDO` | `None` / `True` | optional, see below |

### Optional: ssh instead of HACS

If you have ssh access to the HA host with write access to `/config` (directly or through passwordless `sudo`),
`deploy.py` can copy the integration itself and write the card over ssh. You then don't need HACS for Fabricon:

```python
SSH = ["ssh", "-o", "BatchMode=yes", "root@192.168.1.10"]
SSH_SUDO = False          # True if the user needs sudo to write /config
```

The setup asks about this as well. With ssh, `python3 deploy.py install` also updates the integration and restarts
HA when it changed.

### `deploy.py`

```
python3 deploy.py setup        first time: ask for the settings, then install
python3 deploy.py install      integration entry (+ files and restart with ssh), card, dashboard, demo states
python3 deploy.py              card + dashboard (the usual update after changing the code)
python3 deploy.py card         only the card
python3 deploy.py config       only the dashboard config
python3 deploy.py proxy        with ssh: copy the integration (restart HA when it reports changes)
python3 deploy.py demo         set the demo printers' states (needs DEMO_PRINTERS and P)
python3 deploy.py --stl FILE   upload FILE as the model shown on the bed (/config/www/prints/current.stl)
python3 deploy.py --dump       print the generated config as YAML, deploy nothing (needs PyYAML)
python3 deploy.py --bundle     only build dist/fabricon-card.js and syntax-check it
```

### Demo printers

With `DEMO_PRINTERS = True` and `P` set to a real printer, six extra views show made-up printers in fixed states:
offline, printing, paused, finished, failed and no data. They are useful for checking the layout without
waiting for a real print. Their entities exist only in HA's state machine. They are copies of your printer's
states with the demo profile on top. The fabricon integration sets them at every HA start. To create or refresh
them, run:

```sh
python3 deploy.py demo
python3 deploy.py config
```

## Known issues

- BamBuddy can't print a file directly from the printer's USB stick. The proxy therefore copies the file into
  BamBuddy's library, queues it there and removes the library copy after the file has been sent to the printer.
- After a job, the exhaust box fan can keep running for several minutes while BamBuddy reports 0 %.
- HA reports no toolhead position. While printing, the head follows the G-code path of the current layer, not a
  live readout.

## Troubleshooting

- **"Home Assistant has no Fabricon upload endpoint"**: the Fabricon integration is not set up. Download it in
  HACS, restart HA and run `python3 deploy.py install`.
- **"the access token was refused"**: create a new token and delete `~/.config/homeassistant/token`. The setup
  then asks for it again.
- **"set up the BamBuddy integration first"**: Fabricon reads BamBuddy's URL and API key from that integration.
- **The dashboard shows "Custom element doesn't exist: fabricon-card"**: reload the page with the cache cleared. If
  that doesn't help, restart HA once: HA only serves `/local/` when the `www` folder existed at startup.
- **A printer has no view**: run `python3 deploy.py config` after adding it to BamBuddy.

## Development

See [CLAUDE.md](CLAUDE.md) for the code layout and the conventions. In short: `card/NN-topic.js` files are
concatenated in name order into `dist/`, and the dashboard is generated from `dashboard/*.py`. Never edit `dist/`.

## License

[MIT](LICENSE)
