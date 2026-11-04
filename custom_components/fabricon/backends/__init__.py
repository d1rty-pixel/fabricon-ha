"""Print backends: the file / queue API of a printer system, behind the print proxy (proxy.py).

A backend (one per provider, dashboard/providers/<name>.py) is a class with the provider's NAME, built with hass:
  files(ref, path) -> {path, files: [...]}         directory listing of the printer's storage
  plates(ref, path) -> {plates: [...]}              plates of a sliced file
  thumb(ref, path, plate) / file(ref, path) -> (bytes, content type)
  trays(ref) -> [{tray, ams, slot, extruder, type, color, name, idx, remain}]
  queue(ref, item_id) -> {status, ...}             a print started here
  print(ref, body) -> {id, ...}                     body: {path, plate_id, ams_mapping, bed_levelling, flow_cali, timelapse}
ref is how the provider addresses the printer (BamBuddy: the serial number). Errors: raise Upstream(status, text).
"""
from .base import Upstream, check_path
from .bambuddy import Bambuddy

BACKENDS = {Bambuddy.NAME: Bambuddy}

__all__ = ["BACKENDS", "Upstream", "check_path"]
