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
- One view per printer, found automatically and updated when you add one. Works on wall panels, desktops, tablets
  and phones.

Fabricon is a single Home Assistant integration. You install it and add it, and the dashboard **Fabricon** appears in
the sidebar. There is nothing to run on your computer and no YAML to write.

[![Open your Home Assistant instance and open the Fabricon repository in the Marketplace.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=d1rty-pixel&repository=fabricon-ha&category=integration)
[![Open your Home Assistant instance and start setting up Fabricon.](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=fabricon)

The first button installs Fabricon through the Marketplace (HACS before Home Assistant 2026.11), the second adds
it after the restart (details in [Installation](#installation)).

### Supported printers

Every printer BamBuddy manages gets a view. What a printer has (nozzles, fans, lights, door, chamber heater,
filament units) comes from a model profile, so the panels show only what that printer offers.

| Printer | Profile | 3D model |
|---|---|---|
| X2D | yes | detailed (AMS 2 Pro / HT, External Exhaust Fan kit) |
| X1 Carbon, X1E | yes | X1 family |
| P1S, P1P | yes | X1 family (P1S variant) |
| P2S | yes | P2S (exhaust kit and second aux fan as options) |
| H2D, H2D Pro, H2C, H2S | yes | H2 family: H2C with the Vortek hotend rack, H2S with one nozzle; laser module and Laser Edition as options |
| H3C | yes (binds what HA has: BamBuddy doesn't know the model yet) | H3C with the tool rack and the AMS 3H |
| A1, A1 mini, A2L | yes | A1 family, with the AMS Lite; A2L cutting module as an option |
| any other | detected from its entities | generic |

BamBuddy reports no laser or cutting module, so they are set per printer in the options. A laser job is recognised
by the printer's air duct mode `laser`; the model then shows the beam.

The models are built from published dimensions and Bambu wiki photos (sources per value in `docs/printers/`). Some details are estimated, and corrections
are welcome.

## Contents

- [Requirements](#requirements) · [BamBuddy API key](#bambuddy-api-key)
- [Installation](#installation): [Marketplace](#method-1-marketplace-recommended) ·
  [manual from a release](#method-2-manual-install-from-a-release) · [from source](#method-3-from-source) ·
  [add the integration](#add-the-integration)
- [Options](#options) · [Updating](#updating) · [Uninstalling](#uninstalling)
- [Using the dashboard](#using-the-dashboard)
- [Troubleshooting](#troubleshooting) · [Known issues](#known-issues) · [Development](#development) ·
  [License](#license)

## Requirements

| What | Needed for | Notes |
|---|---|---|
| Home Assistant | everything | tested with 2026.11; use a current release |
| [BamBuddy](https://github.com/maziggy/bambuddy) | printer data, files, print queue | running, with your printer(s) added |
| [BamBuddy integration](https://github.com/Spegeli/hacs_bambuddy) | the printer's entities in HA | set up **before** Fabricon, with an API key that has the permissions [below](#bambuddy-api-key) |
| [button-card](https://github.com/custom-cards/button-card) 7.x | the panels and keys | *Settings → Marketplace* (HACS before HA 2026.11), or by hand (see below) |
| [kiosk-mode](https://github.com/NemesisRE/kiosk-mode) | optional | hides HA's header and sidebar on the Fabricon dashboard |
| A browser with internet access | the 3D model | three.js is loaded from jsDelivr |

Methods 1 and 2 need no Python, no ssh and no terminal. Everything is done in Home Assistant's web interface plus a
way to copy files for method 2.

### BamBuddy API key

Fabricon has **no API key of its own**. It uses the URL and API key you entered in the BamBuddy integration, and
you don't type them in again. To list the USB stick and start prints, Fabricon needs **two more permissions on that
key than the BamBuddy integration itself asks for**:

| Permission in BamBuddy | Needed by | For |
|---|---|---|
| **Read Status** | BamBuddy integration + Fabricon | everything shown; the loaded filaments for the mapping |
| **Control Printer** | BamBuddy integration + Fabricon | the controls; listing and reading the files on the printer's USB stick; clearing the plate |
| **Manage Maintenance** | BamBuddy integration | marking maintenance done |
| **Manage Queue** | Fabricon | START: queueing the job |
| **Manage Library** | Fabricon | START: BamBuddy can only queue files from its library, so the file is copied there first (removed again after it was sent) |
| *Manage Inventory* (optional) | BamBuddy integration | assigning inventory spools to AMS slots; Fabricon doesn't use it |

**Setting up a new key with all five permissions:**

1. In BamBuddy, open **Settings → API Keys → Create Key**.
2. Name it, e.g. `Home Assistant`, and tick **Read Status, Control Printer, Manage Queue, Manage Library and
   Manage Maintenance**. Tick **Manage Inventory** too if you assign spools from BamBuddy's inventory in HA.
3. Copy the key. BamBuddy shows it only once.
4. In Home Assistant: *Settings → Devices & services → BamBuddy → ⋮ → **Reconfigure***, and enter the new key. If
   you're setting up the BamBuddy integration for the first time, enter it there instead.

**Already have a key?** BamBuddy can't add permissions to an existing key. If yours was made for the BamBuddy
integration with only its three permissions, create a new one as above and enter it in the integration.
Everything shows anyway, but START and the USB list report *"the API key lacks the '…' permission"*.

Also good to know (from BamBuddy):

- With **authentication** on in BamBuddy (*Settings → Authentication*), a key can do at most what its owner may do.
  Create it as a user who is allowed to control printers, use the queue and the library.
- A key limited to certain printers only reaches those: Fabricon can't list files on the others or start
  prints there.
- With authentication off, BamBuddy ignores permissions entirely. That works, but anyone on your network can then
  control your printers.
- The printer must be in **LAN mode with developer mode** on. Otherwise the printer ignores the commands BamBuddy
  passes on (see the BamBuddy integration's troubleshooting).

### button-card without the Marketplace

1. Download `button-card.js` from the [button-card releases](https://github.com/custom-cards/button-card/releases).
2. Copy it to `/config/www/button-card.js` on your HA host. If the `www` folder doesn't exist yet, create it and
   restart Home Assistant once.
3. Enable *Advanced mode* in your user profile. Then go to *Settings → Dashboards → ⋮ (top right) → Resources →
   Add resource*, enter the URL `/local/button-card.js` and choose the type *JavaScript module*.

## Installation

Pick **one** of the three methods. Then [add the integration](#add-the-integration).

### Method 1: Marketplace (recommended)

Since Home Assistant 2026.11, HACS is built in as the **Marketplace** (*Settings → Marketplace*). It also handles
updates for you. Fabricon isn't in the community catalog, so you add it from its GitHub link. That needs a GitHub
connection once: the Marketplace asks you to **Connect GitHub** when you add it.

The first time you open the Marketplace, it shows a warning about community items. Tick **I understand the risks
and agree** and click **Continue**. Until then, nothing can be installed or updated.

**Quick way:** click this button. It opens Fabricon in the Marketplace on your own Home Assistant (the first time,
it asks for your Home Assistant's address and remembers it):

[![Open your Home Assistant instance and open the Fabricon repository in the Marketplace.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=d1rty-pixel&repository=fabricon-ha&category=integration)

Confirm **Add custom repository**, then **Install**, then restart Home Assistant (the Marketplace offers
**Restart Home Assistant**, or *Settings → System → ⋮ (top right) → Restart Home Assistant*).

**By hand**, if the button doesn't work:

1. Open *Settings → **Marketplace***.
2. Open the tab **Add from link**.
3. Enter `https://github.com/d1rty-pixel/fabricon-ha` as the **GitHub link**, choose the type **Integration** and
   click **Add**.
4. Open **Fabricon** and click **Install**. Choose the latest version.
5. **Restart Home Assistant**.

If the Marketplace shows an error at step 3 or 4, use method 2.

**Home Assistant 2026.10 or older:** use HACS instead. *HACS → ⋮ (top right) → Custom repositories*, add the link
above as an **Integration**, then search HACS for **Fabricon**, **Download** it and restart Home Assistant. When you
update Home Assistant to 2026.11, the Marketplace takes Fabricon over from HACS.

### Method 2: Manual install from a release

For when the Marketplace isn't available or doesn't work. You need a way to put files into Home Assistant's `/config`
folder. Any of these works:

- the **File editor** add-on, or **Studio Code Server** (*Settings → Add-ons → Add-on store*). Both can upload files.
- the **Samba share** add-on: open `\\homeassistant\config` (Windows) or `smb://homeassistant.local/config`
  (macOS / Linux).
- `scp` or the **SSH** add-on, if you're used to it
- on Home Assistant Container / Core: the configuration folder on the machine itself

Steps:

1. Open the [latest release](https://github.com/d1rty-pixel/fabricon-ha/releases/latest) and download
   **`fabricon.zip`**. Don't use "Source code": it doesn't contain the built card.
2. In `/config`, create the folder `custom_components` if it doesn't exist, and inside it the folder `fabricon`.
3. Unzip `fabricon.zip` **into** `/config/custom_components/fabricon/`. The result must look like this:

   ```
   /config/custom_components/fabricon/
   ├── __init__.py
   ├── manifest.json
   ├── dashboard/
   ├── frontend/fabricon-card.js
   └── …
   ```

   Make sure there is no extra `fabricon` folder in between (`…/fabricon/fabricon/manifest.json` is wrong).
4. **Restart Home Assistant**.

With the File editor, upload the zip to `/config/custom_components/fabricon/`. The File editor can't unzip, so
use Studio Code Server or Samba for this method if you can.

### Method 3: From source

For the latest unreleased code, or if you want to change something. You need **git** (or the ZIP of the
repository) and **Python 3.9+** to build the card. Optional: **Node.js**, which checks the card's syntax.

Installing the tools:

- **Windows**: install Python from [python.org](https://www.python.org/downloads/) (tick "Add python.exe to
  PATH") or from the Microsoft Store, and [Git for Windows](https://git-scm.com/download/win). In the commands
  below, use `py` instead of `python3`.
- **macOS**: run `xcode-select --install` (this includes git and python3), or `brew install python git`.
- **Debian / Ubuntu**: `sudo apt install python3 git`.

Build the integration:

```sh
git clone https://github.com/d1rty-pixel/fabricon-ha.git
cd fabricon-ha
python3 deploy.py --bundle
```

This writes the card to `custom_components/fabricon/frontend/fabricon-card.js`. Copy the whole folder
`custom_components/fabricon` to `/config/custom_components/fabricon` on your HA host, the same way as in method 2.
Then **restart Home Assistant**.

### Add the integration

[![Open your Home Assistant instance and start setting up Fabricon.](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=fabricon)

1. Click the button above, or open *Settings → Devices & services → **Add integration*** and search for **Fabricon**. If it isn't listed,
   reload the page (Ctrl+F5) and check that Home Assistant was restarted after the install.
2. Tick what applies (you can change it later, see [Options](#options)):
   - **AMS support**: leave it on if you have an AMS. Units are detected automatically.
   - **External Exhaust Fan kit**: if it is fitted on the back. HA can't detect it.
   - **Demo printers**: extra views with made-up printers in fixed states, to try the dashboard.
3. Click **Submit**. **Fabricon** appears in the sidebar, with one tab per printer.

If you get *"Set up the BamBuddy integration first"*, set up the BamBuddy integration and try again. Fabricon asks
for no URL or key: it uses the BamBuddy integration's. Check that key's permissions
([BamBuddy API key](#bambuddy-api-key)).

## Options

*Settings → Devices & services → Fabricon → **Configure***: the defaults (AMS support, demo printers) or one printer.
A printer has its own AMS setting and the accessories of its model that HA can't detect (e.g. the X2D's External
Exhaust Fan kit). The dashboard is rebuilt when you save.

The dashboard rebuilds itself at every start and when BamBuddy adds a printer. To rebuild it by hand, use
*Developer tools → Actions → **Fabricon: Rebuild dashboard***.

The dashboard is generated, so it can't be edited in HA's dashboard editor. Your changes would be lost at the next
rebuild anyway. To change it, change the code (see [Development](#development)).

## Updating

- **Marketplace**: when an update for Fabricon shows up (*Settings → Marketplace → Updates*, or under *Settings →
  Updates*), install it and restart Home Assistant.
- **Manual / from source**: replace the contents of `/config/custom_components/fabricon/` with the new release or
  build. Delete the old files first, then restart Home Assistant.

Then reload the dashboard in your browsers. On wall panels, clear the browser cache if the old version keeps
showing.

## Uninstalling

1. *Settings → Devices & services → Fabricon → ⋮ → **Delete***. The dashboard disappears right away.
2. Remove the files: Home Assistant asks right after step 1 whether to also uninstall Fabricon from the Marketplace
   (**Uninstall**). Installed by hand: delete `/config/custom_components/fabricon/`.
3. Restart Home Assistant.

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

**Kiosk mode**: if kiosk-mode is installed, HA's header and sidebar are hidden on this dashboard. Add `?disable_km`
to the URL to see them.

## Troubleshooting

| Problem | Fix |
|---|---|
| Fabricon isn't listed under *Add integration* | Check that Home Assistant was restarted after the install. Check that `/config/custom_components/fabricon/manifest.json` exists (not one folder deeper). Reload the page with Ctrl+F5. |
| *"Set up the BamBuddy integration first"* | Fabricon reads BamBuddy's URL and API key from the BamBuddy integration. Set that up first. |
| The sidebar has no **Fabricon** entry | Check the log (*Settings → System → Logs*, search "fabricon"). *"a dashboard at /fabricon-dashboard already exists"*: delete that dashboard under *Settings → Dashboards*, then reload Fabricon (*Devices & services → Fabricon → ⋮ → Reload*). |
| *"Custom element doesn't exist: fabricon-card"* | Reload the page with the cache cleared. *"…fabricon-card.js is missing"* in the log means the files came from "Source code" instead of `fabricon.zip`. Install again with method 2 or 3. |
| *"Custom element doesn't exist: button-card"* | button-card isn't installed or its resource is missing (see [Requirements](#requirements)). |
| The model stays on "Loading model" | The browser can't reach `cdn.jsdelivr.net` (offline network, content blocker). |
| A printer has no view | Check that it shows up in BamBuddy and in the BamBuddy integration. Fabricon picks it up within a few seconds. Otherwise run *Fabricon: Rebuild dashboard*. |
| *"the API key lacks the '…' permission"* | The BamBuddy key is missing a permission. Create a new key with all five permissions and enter it in the BamBuddy integration (see [BamBuddy API key](#bambuddy-api-key)). |
| *"the API key was refused"* | The key was deleted or mistyped in BamBuddy. Create a new one and enter it in the BamBuddy integration (*Reconfigure*). |
| The USB stick list stays empty | Check that the stick is inserted. Check that BamBuddy can list the printer's files (BamBuddy → printer → Files). Check that the key has **Control Printer**. |
| START does nothing or the job stays in BamBuddy's queue | BamBuddy only sends a queued job once the plate is marked as cleared and the printer is idle. Check BamBuddy's queue page for the reason it shows. |

## Known issues

- BamBuddy can't print a file directly from the printer's USB stick. Fabricon therefore copies the file into
  BamBuddy's library, queues it there and removes the library copy after the file has been sent to the printer.
- After a job, the exhaust box fan can keep running for several minutes while BamBuddy reports 0 %.
- HA reports no toolhead position. While printing, the head follows the G-code path of the current layer, not a
  live readout.
- Home Assistant has no official way for an integration to add a dashboard. Fabricon uses the dashboard
  internals of HA's Lovelace component, so a future HA release may need a Fabricon update.

## Development

| What | Where |
|---|---|
| the 3D card, concatenated in name order into `custom_components/fabricon/frontend/` | `card/NN-topic.js` |
| the dashboard generator (pure Python, runs inside HA) | `custom_components/fabricon/dashboard/` |
| printers as data: model profiles, providers (entity bindings), the spec | `dashboard/profiles/`, `dashboard/providers/`, `dashboard/spec.py` |
| 3D models of the printers (one bundle each, loaded on demand; contract in its README) | `card/models/<key>/` |
| integration: setup, options, dashboard + card registration, print proxy and its backends | `custom_components/fabricon/*.py`, `backends/` |
| golden test of the generator, card test page without HA | `tests/golden.py`, `tests/harness/serve.py` |
| developer deploy over ssh | `deploy.py`, settings in `deploy_local.py` (not in git) |

`deploy.py` copies your working copy to a test instance. It needs Python 3.9+, ssh with write access to `/config`
and a long-lived access token in `~/.config/homeassistant/token`. Optional: Node.js and PyYAML (`--dump`).

```python
# deploy_local.py
HA_URL = "http://192.168.1.10:8123"
SSH = ["ssh", "-o", "BatchMode=yes", "root@192.168.1.10"]
SSH_SUDO = False
```

```
python3 deploy.py              bundle the card, copy changed files, rebuild the dashboard
python3 deploy.py --restart    same, and restart HA when the integration's own code changed
python3 deploy.py --stl FILE   also upload FILE as the job model shown on the bed
python3 deploy.py --dump       print the generated dashboard as YAML
python3 deploy.py --bundle     only bundle the card and the models
python3 tests/golden.py        generated dashboards vs the stored references (--update after a wanted change)
python3 tests/harness/serve.py the card without HA: http://localhost:8765/?fixture=x2d&state=printing
```

A new Bambu model is mostly data: a profile in `dashboard/profiles/` (and optionally a 3D model in `card/models/`).
A new printer system needs a provider module (`dashboard/providers/`) and, for the print dock, a backend.

Releases: push a tag like `v0.2.0`. The release workflow bundles the card, sets the version and publishes
`fabricon.zip`, which the Marketplace (and HACS) installs. See [CLAUDE.md](CLAUDE.md) for the code conventions.

## License

[MIT](LICENSE)
