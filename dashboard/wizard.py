"""`deploy.py setup`: asks for the few things Fabricon needs, checks them against Home Assistant and writes
dashboard/settings_local.py (and the token file). Standard library only."""
import getpass
import os
import subprocess
import sys
import urllib.parse

from . import settings
from .build import printers
from .ha import Client, HAError

HERE = os.path.dirname(os.path.abspath(__file__))
LOCAL = os.path.join(HERE, "settings_local.py")


def ask(question, default=""):
    try:
        v = input(f"{question}" + (f" [{default}]" if default else "") + ": ").strip()
    except EOFError:
        sys.exit("\naborted")
    return v or default


def yes(question, default=True):
    v = ask(question + (" [Y/n]" if default else " [y/N]")).lower()
    return default if not v else v.startswith("y")


def ok(text):
    print(f"  ✓ {text}")


def warn(text):
    print(f"  ! {text}")


def ha_url(raw):
    raw = raw.strip().rstrip("/")
    if "://" not in raw:
        raw = "http://" + raw
    u = urllib.parse.urlparse(raw)
    return raw if u.port else f"{u.scheme}://{u.hostname}:{8123 if u.scheme == 'http' else 443}{u.path}"


def token_file():
    path = os.path.expanduser(settings.HA_TOKEN)
    if os.path.isfile(path) and open(path).read().strip():
        ok(f"access token from {settings.HA_TOKEN}")
        return path
    print("\nHome Assistant needs a long-lived access token: in HA open your profile (bottom left) -> Security ->\n"
          "Long-lived access tokens -> Create token, and paste it here (input is hidden).")
    tok = getpass.getpass("Token: ").strip()
    if not tok:
        sys.exit("no token, aborted")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), "w") as f:
        f.write(tok + "\n")
    ok(f"token saved to {settings.HA_TOKEN}")
    return path


def connect():
    default = settings.HA_URL
    while True:
        url = ha_url(ask("Home Assistant URL", default))
        path = token_file()
        try:
            ha = Client(url, open(path).read().strip())
            ok(f"connected to Home Assistant {ha.version} at {url}")
            return url, ha
        except HAError as err:
            warn(str(err))
            if "token" in str(err) and yes("Enter a new token?"):
                os.remove(path)
            default = url


def prerequisites(ha):
    """What has to be in HA already; returns False if something essential is missing."""
    good = True
    if ha.result({"type": "config_entries/get", "domain": "bambuddy"}):
        ok("BamBuddy integration")
    else:
        warn("the BamBuddy integration is not set up (HACS: Spegeli/hacs_bambuddy) - set it up first")
        good = False
    res = [r["url"] for r in ha.result({"type": "lovelace/resources"})]
    for name, repo in (("button-card", "custom-cards/button-card"), ("kiosk-mode", "NemesisRE/kiosk-mode")):
        if any(name in u for u in res):
            ok(name)
        else:
            warn(f"{name} is not installed (HACS: {repo})" + (" - the dashboard needs it" if name == "button-card" else
                                                             " - optional, it hides HA's header and sidebar"))
            good = good and name != "button-card"
    return good


def pick_printer(ha):
    ps = printers(ha)
    if not ps:
        warn("BamBuddy has no printers in Home Assistant yet; views appear once you add one and run deploy.py config")
        return None
    for i, p in enumerate(ps, 1):
        print(f"  {i}. {p['name']} ({p['model']}, {p['serial']})")
    if len(ps) == 1:
        ok(f"printer: {ps[0]['name']}")
        return ps[0]
    n = ask("Main printer (its view comes first)", "1")
    return ps[int(n) - 1] if n.isdigit() and 0 < int(n) <= len(ps) else ps[0]


def has_ams(ha, printer):
    if not printer:
        return True
    devs = ha.result({"type": "config/device_registry/list"})
    n = sum(1 for d in devs if d.get("via_device_id") == printer["DEV"] and "ams" in (d.get("name") or "").lower())
    ok(f"{n} AMS unit(s)" if n else "no AMS")
    return bool(n)


def ssh_login(host):
    """Optional ssh: (command, sudo) or (None, True). Without it files go through the integration's upload endpoint
    and the integration itself comes from HACS."""
    print("\nssh to the Home Assistant host is optional. Without it, the Fabricon integration is installed through HACS\n"
          "and deploy.py uploads through Home Assistant's API.")
    if not yes("Use ssh (key login, write access to /config)?", False):
        return None, True
    default = f"root@{host}"
    while True:
        target = ask("ssh login (user@host)", default)
        cmd = ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=10", target]
        r = subprocess.run(cmd + ["test -w /config && echo direct || (sudo -n test -d /config && echo sudo)"],
                           capture_output=True, text=True)
        how = r.stdout.strip().splitlines()[-1] if r.stdout.strip() else ""
        if how in ("direct", "sudo"):
            ok(f"ssh {target}: /config writable" + (" with sudo" if how == "sudo" else ""))
            return cmd, how == "sudo"
        warn((r.stderr.strip() or "no write access to /config").splitlines()[-1])
        warn("needs: key login without a password prompt, and /config writable (directly or with sudo without password)")
        if not yes("Try again?"):
            print("  continuing without ssh")
            return None, True
        default = target


def main():
    print("Fabricon setup\n")
    if os.path.exists(LOCAL) and not yes(f"{os.path.relpath(LOCAL)} exists. Overwrite it?", False):
        sys.exit("kept the existing settings")
    url, ha = connect()
    host = urllib.parse.urlparse(url).hostname
    print()
    if not prerequisites(ha):
        sys.exit("\ninstall what is missing and run `python3 deploy.py setup` again")
    print()
    printer = pick_printer(ha)
    ams = has_ams(ha, printer)
    exhaust = yes("Is the External Exhaust Fan kit fitted on the back?", False)
    demos = bool(printer) and yes("Add demo printer views (fixed states, to try the dashboard)?", False)
    bambuddy = ask("BamBuddy URL (for the link on the Maintenance panel)", f"http://{host}:8000")
    ssh, sudo = ssh_login(host)

    lines = ['"""Local settings, written by `deploy.py setup` (not in git): override anything from settings.py."""', "",
             f"HA_URL = {url!r}", f"SSH = {ssh!r}", f"SSH_SUDO = {sudo}", f"BAMBUDDY_URL = {bambuddy!r}", ""]
    if printer:
        lines += [f"P = {printer['P']!r}            # {printer['name']}", f"DEV = {printer['DEV']!r}", ""]
    lines += [f"HAS_AMS = {ams}", f"EXHAUST_BOX = {exhaust}", f"DEMO_PRINTERS = {demos}", ""]
    with open(LOCAL, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"\nwrote {os.path.relpath(LOCAL)}")
    ha.close()
    return yes("Install Fabricon into Home Assistant now?")


if __name__ == "__main__":
    main()
