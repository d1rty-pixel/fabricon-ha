"""Golden test of the generator: the dashboard built from the registry fixtures must equal the stored reference.

python3 tests/golden.py            compare (exit 1 and a short diff on a change)
python3 tests/golden.py --update   store the current output as the new reference (after a wanted change)

Fixtures are anonymised copies of real BamBuddy registries (tests/fixtures/registry_<name>.json: devices + entities).
"""
import difflib
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "custom_components", "fabricon"))

from dashboard.build import build, printers  # noqa: E402

OPTIONS = {"ams": True, "exhaust_box": True, "demo": False, "bambuddy_url": "http://bambuddy.local:8000"}


def generate(name):
    reg = json.load(open(os.path.join(HERE, "fixtures", f"registry_{name}.json")))
    return json.dumps(build(printers(reg["devs"], reg["ents"]), OPTIONS), indent=1, sort_keys=True, ensure_ascii=False) + "\n"


def main():
    update = "--update" in sys.argv
    names = sorted(f[len("registry_"):-len(".json")] for f in os.listdir(os.path.join(HERE, "fixtures")) if f.startswith("registry_"))
    failed = False
    for name in names:
        ref = os.path.join(HERE, "golden", f"{name}.json")
        out = generate(name)
        if update:
            os.makedirs(os.path.dirname(ref), exist_ok=True)
            open(ref, "w", encoding="utf-8", newline="\n").write(out)
            print(f"{name}: reference updated")
            continue
        old = open(ref, encoding="utf-8").read() if os.path.exists(ref) else ""
        if old == out:
            print(f"{name}: ok")
            continue
        failed = True
        diff = list(difflib.unified_diff(old.splitlines(), out.splitlines(), "reference", "now", n=1, lineterm=""))
        print(f"{name}: CHANGED ({len(diff)} diff lines)\n" + "\n".join(diff[:80]))
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
