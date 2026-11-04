"""Developer tool: bundle the card and copy the integration to a Home Assistant host over ssh.

Users install the integration (HACS or by hand, see README.md); this is for working on the code.

python3 deploy.py              bundle the card, copy changed integration files, rebuild the dashboard
python3 deploy.py --restart    same, and restart Home Assistant if the integration's own code changed
python3 deploy.py --stl FILE   also upload FILE as the job model shown on the bed (/config/www/prints/current.stl)
python3 deploy.py --dump       print the generated dashboard as YAML (needs PyYAML), deploy nothing
python3 deploy.py --bundle     only bundle card/*.js -> custom_components/fabricon/frontend/fabricon-card.js

Settings below, overridden by deploy_local.py (not in git). Needs a long-lived access token (HA_TOKEN) and ssh to the
HA host with write access to /config (SSH, SSH_SUDO).
"""
import argparse
import glob
import hashlib
import os
import shutil
import subprocess
import sys

from ha_client import Client

HA_URL = "http://homeassistant.local:8123"
HA_TOKEN = "~/.config/homeassistant/token"
SSH = ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=10", "root@homeassistant.local"]
SSH_SUDO = False                    # prefix remote commands with sudo
OPTIONS = {"ams": True, "exhaust_box": False, "demo": False, "bambuddy_url": ""}   # only for --dump
try:
    from deploy_local import *  # noqa: F401,F403
except ImportError:
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "custom_components", "fabricon")
CARD = os.path.join(SRC, "frontend", "fabricon-card.js")
REMOTE = "/config/custom_components/fabricon"
STL = "/config/www/prints/current.stl"
SUDO = "sudo " if SSH_SUDO else ""
sys.path.insert(0, SRC)             # the generator as a plain package (without the integration's HA imports)


def connect():
    return Client(HA_URL, open(os.path.expanduser(HA_TOKEN)).read().strip())


def bundle():
    """card/*.js in name order -> the integration's frontend folder."""
    parts = sorted(glob.glob(os.path.join(HERE, "card", "*.js")))
    data = "".join(open(p, encoding="utf-8").read().rstrip() + "\n\n" for p in parts).rstrip() + "\n"
    os.makedirs(os.path.dirname(CARD), exist_ok=True)
    with open(CARD, "w", encoding="utf-8", newline="\n") as f:
        f.write(data)
    if shutil.which("node"):
        r = subprocess.run(["node", "--check", CARD], capture_output=True, text=True)
        if r.returncode:
            sys.exit(f"card does not parse:\n{r.stderr}")
    print(f"bundled {len(parts)} files -> {os.path.relpath(CARD, HERE)} ({len(data) // 1024} KB)")


def ssh(cmd, data=None):
    r = subprocess.run(SSH + [cmd], input=data, capture_output=True)
    if r.returncode:
        sys.exit(f"ssh {cmd!r} failed: {r.stderr.decode(errors='replace').strip()}")
    return r.stdout.decode()


def remote_hashes(root):
    """{relative path: sha256} of every file under root on the HA host."""
    out = ssh(f"cd '{root}' 2>/dev/null && {SUDO}find . -type f -not -path '*/__pycache__/*' -exec sha256sum {{}} + || true")
    return {line.split(None, 1)[1].strip()[2:]: line.split()[0] for line in out.splitlines() if line.strip()}


def put(path, data):
    ssh(f"{SUDO}mkdir -p \"$(dirname '{path}')\" && {SUDO}tee '{path}' > /dev/null", data)


def sync():
    """Copy the integration's changed files, remove ones that are gone; returns the changed paths."""
    local = {os.path.relpath(p, SRC).replace(os.sep, "/"): p for p in glob.glob(os.path.join(SRC, "**", "*"), recursive=True)
             if os.path.isfile(p) and "__pycache__" not in p}
    remote = remote_hashes(REMOTE)
    changed = []
    for rel, p in sorted(local.items()):
        data = open(p, "rb").read()
        if remote.get(rel) != hashlib.sha256(data).hexdigest():
            put(f"{REMOTE}/{rel}", data)
            changed.append(rel)
    gone = sorted(set(remote) - set(local))
    for rel in gone:
        ssh(f"{SUDO}rm -f '{REMOTE}/{rel}'")
    print(f"integration: {len(changed)} file(s) copied, {len(gone)} removed" + "".join(f"\n  {c}" for c in changed + gone))
    return changed + gone


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--restart", action="store_true", help="restart Home Assistant when the integration's code changed")
    ap.add_argument("--stl", help="upload this STL as the current job model")
    ap.add_argument("--dump", action="store_true", help="print the generated dashboard as YAML")
    ap.add_argument("--bundle", action="store_true", help="only bundle the card")
    args = ap.parse_args()

    if args.bundle:
        bundle()
        return
    if args.dump:
        import yaml  # only needed here
        from dashboard.build import build, printers
        ha = connect()
        ps = printers(ha.result({"type": "config/device_registry/list"}), ha.result({"type": "config/entity_registry/list"}))
        print(yaml.safe_dump(build(ps, OPTIONS), allow_unicode=True, sort_keys=False, width=200))
        return
    bundle()
    changed = sync()
    if args.stl:
        put(STL, open(args.stl, "rb").read())
        print("uploaded", STL)
    code = [c for c in changed if not c.startswith(("dashboard/", "frontend/"))]
    ha = connect()
    if code:
        if args.restart:
            print("integration code changed: restarting Home Assistant")
            try:
                ha.service("homeassistant", "restart")
            except Exception:  # the connection may drop before the answer
                pass
        else:
            print("integration code changed: restart Home Assistant (or run with --restart)")
        return
    if changed or args.stl:
        ha.service("fabricon", "rebuild")
        print("dashboard rebuilt; reload the page")
    else:
        print("nothing changed")


if __name__ == "__main__":
    main()
