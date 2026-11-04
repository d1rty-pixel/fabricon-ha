"""Build and deploy the Fabricon dashboard (/fabricon-dashboard) to Home Assistant.

python3 deploy.py setup        first time: asks for HA / ssh / printer, writes dashboard/settings_local.py, installs
python3 deploy.py install      everything: integration (restarts HA and adds it if needed), card, config, demo states
python3 deploy.py              bundle the card, upload it if it changed, push the dashboard config
python3 deploy.py card         only the card (card/*.js -> /config/www/fabricon-card.js + lovelace resource ?v=<sha>)
python3 deploy.py config       only the dashboard config (dashboard/ -> lovelace/config/save)
python3 deploy.py demo         the demo printers' states (dashboard/demo.py): demo.json in the integration (set at
                               every HA start by the fabricon integration) + set now through the REST API
python3 deploy.py proxy        with ssh: the integration (custom_components/fabricon -> /config/custom_components);
                               Home Assistant has to be restarted when it changed (printed, not done here)
python3 deploy.py --stl FILE   also upload FILE as the job model shown on the bed (/config/www/prints/current.stl)
python3 deploy.py --dump       print the config as YAML, deploy nothing
python3 deploy.py --bundle     only write dist/fabricon-card.js and syntax-check it

The card is the files in card/ concatenated in name order (dist/fabricon-card.js); browser caches are busted by the
file's hash in the resource URL, the STL's likewise in the card config. Access: HA token in
~/.config/homeassistant/token; files reach the HA host through the fabricon integration's admin upload endpoint, or
over ssh when SSH is set (dashboard/settings.py, overridden by dashboard/settings_local.py).
"""
import argparse
import glob
import hashlib
import json
import os
import urllib.error
import urllib.parse
import urllib.request
import shutil
import subprocess
import sys
import time

from dashboard.build import build
from dashboard.demo import demo_states
from dashboard.ha import Client
from dashboard.settings import CARD, DEMO_PRINTERS, HA_TOKEN, HA_URL, ICON, SSH, SSH_SUDO, STL, URL_PATH


HERE = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(HERE, "dist", CARD)


def connect():
    return Client(HA_URL, token())


def bundle():
    """card/*.js in name order -> dist/; returns the bytes."""
    parts = sorted(glob.glob(os.path.join(HERE, "card", "*.js")))
    data = "".join(open(p, encoding="utf-8").read().rstrip() + "\n\n" for p in parts).rstrip() + "\n"
    os.makedirs(os.path.dirname(DIST), exist_ok=True)
    with open(DIST, "w", encoding="utf-8", newline="\n") as f:
        f.write(data)
    if shutil.which("node"):
        r = subprocess.run(["node", "--check", DIST], capture_output=True, text=True)
        if r.returncode:
            sys.exit(f"card does not parse:\n{r.stderr}")
    print(f"bundled {len(parts)} files -> dist/{CARD} ({len(data) // 1024} KB)")
    return data.encode()


# Files on the HA host go there over ssh when settings.SSH is set, otherwise through the fabricon integration's
# admin-only upload endpoint (HA's API with the token). Roots: "www" = /config/www, "integration" = the integration's
# own folder (over ssh: all its files; without ssh: only demo.json, HACS installs the rest).
ROOTS = {"www": "/config/www", "integration": "/config/custom_components/fabricon"}
SRC = os.path.join(HERE, "custom_components", "fabricon")
SUDO = "sudo " if SSH_SUDO else ""


def ssh(cmd, data=None):
    r = subprocess.run(SSH + [cmd], input=data, capture_output=True)
    if r.returncode:
        sys.exit(f"ssh {cmd!r} failed: {r.stderr.decode(errors='replace').strip()}")
    return r.stdout.decode()


def api_file(method, root, path, data=None):
    rel = f"www/{path}" if root == "www" else path
    req = urllib.request.Request(f"{HA_URL}/api/fabricon_admin/file?path={urllib.parse.quote(rel)}", method=method, data=data,
                                 headers={"Authorization": "Bearer " + token(), "Content-Type": "application/octet-stream"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read())["sha256"]
    except urllib.error.HTTPError as err:
        if err.code == 404:
            sys.exit("Home Assistant has no Fabricon upload endpoint: install and set up the Fabricon integration first "
                     "(README: Installation), or set SSH in dashboard/settings_local.py")
        sys.exit(f"upload endpoint: HTTP {err.code} {err.read()[:200].decode(errors='replace')}")


def remote_hash(path, root="www"):
    """sha256 of the file on the HA host, '' if it is missing."""
    if not SSH:
        return api_file("GET", root, path)
    out = ssh(f"{SUDO}sha256sum '{ROOTS[root]}/{path}' 2>/dev/null || true").split()
    return out[0] if out else ""


def upload(path, data, root="www", quiet=False):
    """Write data to <root>/<path> unless it is already there; returns its sha256 (None if unchanged and quiet)."""
    sha = hashlib.sha256(data).hexdigest()
    if remote_hash(path, root) == sha:
        if not quiet:
            print(f"{ROOTS[root]}/{path} unchanged")
        return None if quiet else sha
    if SSH:
        full = f"{ROOTS[root]}/{path}"
        ssh(f"{SUDO}mkdir -p \"$(dirname '{full}')\" && {SUDO}tee '{full}' > /dev/null", data)
    else:
        api_file("PUT", root, path, data)
    if remote_hash(path, root) != sha:
        sys.exit(f"upload of {path} did not arrive intact")
    print(f"uploaded {ROOTS[root]}/{path} ({len(data) // 1024} KB)")
    return sha


def token():
    return open(os.path.expanduser(HA_TOKEN)).read().strip()


def rest(method, path, body=None):
    """Home Assistant's REST API (the websocket client has no way to set states)."""
    req = urllib.request.Request(f"{HA_URL}/api/{path}", method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Authorization": "Bearer " + token(), "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read() or b"null")


def demo(ha):
    """Demo printer states: demo.json for fabricon (every HA start) and set now; ones no longer wanted are removed."""
    states = demo_states(ha.result({"type": "get_states"})) if DEMO_PRINTERS else {}
    data = json.dumps(states, ensure_ascii=False, indent=0, sort_keys=True).encode()
    with open(os.path.join(SRC, "demo.json"), "wb") as f:
        f.write(data)
    for eid, st in states.items():
        rest("POST", f"states/{eid}", st)
    stale = [s["entity_id"] for s in rest("GET", "states") if ".x2d_demo_" in s["entity_id"] and s["entity_id"] not in states]
    for eid in stale:
        rest("DELETE", f"states/{eid}")
    print(f"demo: {len(states)} states set, {len(stale)} removed")
    upload("demo.json", data, "integration", True)


def proxy():
    """Over ssh: custom_components/fabricon -> /config/custom_components/fabricon; True when HA needs a restart.
    Without ssh the integration comes from HACS."""
    if not SSH:
        print("fabricon integration: installed and updated through HACS (no ssh set)")
        return False
    files = sorted(os.path.relpath(p, SRC) for p in glob.glob(os.path.join(SRC, "**", "*"), recursive=True)
                   if os.path.isfile(p) and "__pycache__" not in p)
    changed = [f for f in files if upload(f, open(os.path.join(SRC, f), "rb").read(), "integration", True)]
    print("fabricon: " + (f"{len(changed)} file(s) changed -> restart Home Assistant" if changed else "unchanged"))
    return bool(changed)


def restart(ha):
    """Restart Home Assistant and wait until it answers again; returns a new connection."""
    print("restarting Home Assistant ...", flush=True)
    try:
        ha.service("homeassistant", "restart")
    except Exception:  # the connection may drop before the answer
        pass
    ha.close()
    time.sleep(15)
    for _ in range(60):
        try:
            ha = connect()
            if ha.result({"type": "get_config"}).get("state") == "RUNNING":
                print("Home Assistant is back")
                return ha
            ha.close()
        except Exception:
            pass
        time.sleep(5)
    sys.exit("Home Assistant did not come back within 5 minutes; run `python3 deploy.py install` again later")


def add_entry(ha, tries=1):
    """Set up the fabricon integration (its config flow has no questions) unless it already is. False: Home
    Assistant doesn't know the integration (not installed, or not restarted since)."""
    if ha.result({"type": "config_entries/get", "domain": "fabricon"}):
        return True
    for i in range(tries):
        try:
            r = rest("POST", "config/config_entries/flow", {"handler": "fabricon", "show_advanced_options": False})
        except urllib.error.HTTPError as err:   # 400 / 404: unknown handler
            if err.code not in (400, 404):
                raise
            if i + 1 < tries:
                time.sleep(5)
            continue
        if r.get("type") == "create_entry" or r.get("reason") == "already_configured":
            print("fabricon integration set up")
            return True
        sys.exit(f"could not set up the fabricon integration: {r.get('reason') or r}"
                 + (" (set up the BamBuddy integration first)" if r.get("reason") == "no_bambuddy" else ""))
    return False


def yes(question):
    try:
        return input(question + " [Y/n]: ").strip().lower() in ("", "y", "yes")
    except EOFError:
        return False


def install(ha):
    """Everything in order: integration (files over ssh, restart, config entry), demo states, card, dashboard."""
    if proxy():
        ha = restart(ha)
        if not add_entry(ha, 12):
            sys.exit("Home Assistant did not load the fabricon integration; check its log")
    elif not add_entry(ha):
        print("\nHome Assistant doesn't know the Fabricon integration yet. Install it through HACS: HACS -> menu (top right)\n"
              "-> Custom repositories -> https://github.com/d1rty-pixel/fabricon-ha, type Integration -> download Fabricon.")
        if not yes("Is it downloaded? Restart Home Assistant now to load it?"):
            sys.exit("run `python3 deploy.py install` again once it is downloaded and Home Assistant restarted")
        ha = restart(ha)
        if not add_entry(ha, 12):
            sys.exit("Home Assistant still doesn't know the fabricon integration: is it downloaded in HACS?")
    if DEMO_PRINTERS:
        demo(ha)
    set_resource(ha, CARD, upload(CARD, bundle()))
    if not served(CARD) and yes("Home Assistant doesn't serve /local/ yet (no www folder at its start). Restart it now?"):
        ha = restart(ha)
    push(ha, build(ha, remote_hash(STL)[:8]))
    print(f"\ndone: open {HA_URL}/{URL_PATH}/")


def served(path):
    try:
        with urllib.request.urlopen(f"{HA_URL}/local/{path}", timeout=30) as r:
            return r.status == 200
    except urllib.error.URLError:
        return False


def set_resource(ha, path, sha):
    """Point the lovelace resource for /local/<path> at this version (adds it if missing)."""
    url = f"/local/{path}?v={sha[:8]}"
    res = [r for r in ha.result({"type": "lovelace/resources"}) if r["url"].split("?")[0] == f"/local/{path}"]
    if res and res[0]["url"] == url:
        return
    if res:
        ha.result({"type": "lovelace/resources/update", "resource_id": res[0]["id"], "res_type": "module", "url": url})
    else:
        ha.result({"type": "lovelace/resources/create", "res_type": "module", "url": url})
    print("resource", url)


def push(ha, config):
    """Create the storage-mode dashboard if missing, then save its config."""
    if not any(d["url_path"] == URL_PATH for d in ha.result({"type": "lovelace/dashboards/list"})):
        ha.result({"type": "lovelace/dashboards/create", "url_path": URL_PATH, "title": config["title"],
                   "icon": ICON, "mode": "storage", "show_in_sidebar": True, "require_admin": False})
        print("created", URL_PATH)
    ha.result({"type": "lovelace/config/save", "url_path": URL_PATH, "config": config})
    print(f"saved {HA_URL}/{URL_PATH}/ ({len(config['views'])} printer view(s))")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("what", nargs="?", choices=["setup", "install", "card", "config", "proxy", "demo"],
                    help="setup / install, or deploy only this part")
    ap.add_argument("--stl", help="upload this STL as the current job model")
    ap.add_argument("--dump", action="store_true", help="print the config as YAML")
    ap.add_argument("--bundle", action="store_true", help="only bundle and check the card")
    args = ap.parse_args()

    if args.bundle:
        bundle()
        return
    if args.what == "setup":
        from dashboard import wizard
        if wizard.main():   # settings changed: a fresh process reads them
            sys.exit(subprocess.run([sys.executable, os.path.abspath(__file__), "install"]).returncode)
        print("later: python3 deploy.py install")
        return
    if args.what == "proxy":
        proxy()
        return
    ha = connect()
    if args.what == "demo":
        demo(ha)
        return
    if args.what == "install":
        install(ha)
        return
    if args.dump:
        import yaml  # only needed here
        print(yaml.safe_dump(build(ha, remote_hash(STL)[:8]), allow_unicode=True, sort_keys=False, width=200))
        return
    if args.what in (None, "card"):
        set_resource(ha, CARD, upload(CARD, bundle()))
    stl = upload(STL, open(args.stl, "rb").read()) if args.stl else remote_hash(STL)
    if args.what in (None, "config") or args.stl:
        push(ha, build(ha, stl[:8]))


if __name__ == "__main__":
    main()
