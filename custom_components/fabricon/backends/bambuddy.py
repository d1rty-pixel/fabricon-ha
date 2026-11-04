"""BamBuddy's REST API (/api/v1) with the key of the bambuddy integration's config entry. Printers are addressed by
serial number. BamBuddy can't print a file that is already on the printer: print() copies it into BamBuddy's library
and queues it from there (the library copy is removed after dispatch); BamBuddy's scheduler sends it once the plate
is cleared."""
import json
import logging
import re

import aiohttp
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from ..const import DOMAIN
from .base import Upstream, check_path

_LOG = logging.getLogger(__name__)
TIMEOUT = aiohttp.ClientTimeout(total=180)
READY = {"IDLE", "FINISH", "FAILED"}
SLICED = re.compile(r"\.(gcode\.3mf|gcode)$", re.I)


def _denied(method, path, status):
    """Which permission of the BamBuddy API key (BamBuddy -> Settings -> API Keys) a refused call needs."""
    if status == 401:
        return "the API key was refused; enter a valid key in the BamBuddy integration"
    if method == "POST" and path.startswith("/library"):
        need = "Manage Library"
    elif method == "POST" and path.startswith("/queue"):
        need = "Manage Queue"
    elif "/files" in path:
        need = "Control Printer"
    else:
        need = "Read Status"
    return (f"the API key lacks the '{need}' permission (or its owner may not do this). Create a key with Read Status, "
            "Control Printer, Manage Queue, Manage Library and Manage Maintenance and enter it in the BamBuddy integration")


class Bambuddy:
    NAME = "bambuddy"

    def __init__(self, hass):
        entries = hass.config_entries.async_entries("bambuddy")
        if not entries:
            raise Upstream(503, "the bambuddy integration is not set up")
        d = entries[0].data
        self.hass = hass
        self.base = d["url"].rstrip("/") + "/api/v1"
        self.head = {"X-API-Key": d["api_key"]}
        self.http = async_get_clientsession(hass, verify_ssl=d.get("verify_ssl", True))

    async def call(self, method, path, *, raw=False, **kw):
        try:
            async with self.http.request(method, self.base + path, headers=self.head, timeout=TIMEOUT, **kw) as r:
                body = await r.read()
                if r.status >= 400:
                    text = body[:400].decode(errors="replace")
                    try:
                        text = json.loads(body).get("detail", text)
                    except (ValueError, AttributeError):
                        pass
                    if r.status in (401, 403):
                        text = _denied(method, path, r.status)
                    raise Upstream(r.status if r.status < 500 else 502, f"Bambuddy: {text}")
                if raw:
                    return body, r.headers.get("Content-Type", "application/octet-stream")
                return json.loads(body) if body else None
        except (aiohttp.ClientError, TimeoutError) as err:
            raise Upstream(502, f"Bambuddy not reachable: {err}") from err

    async def printer_id(self, serial):
        ids = self.hass.data[DOMAIN]["ids"]
        key = serial.upper()
        if key not in ids:
            for p in await self.call("GET", "/printers/"):
                ids[str(p.get("serial_number", "")).upper()] = p["id"]
        if key not in ids:
            raise Upstream(404, f"no Bambuddy printer with serial {serial}")
        return ids[key]

    async def files(self, ref, path):
        return await self.call("GET", f"/printers/{await self.printer_id(ref)}/files", params={"path": check_path(path)})

    async def plates(self, ref, path):
        return await self.call("GET", f"/printers/{await self.printer_id(ref)}/files/plates", params={"path": check_path(path)})

    async def thumb(self, ref, path, plate):
        return await self.call("GET", f"/printers/{await self.printer_id(ref)}/files/plate-thumbnail/{int(plate)}", raw=True,
                               params={"path": check_path(path)})

    async def file(self, ref, path):
        return await self.call("GET", f"/printers/{await self.printer_id(ref)}/files/download", raw=True, params={"path": check_path(path)})

    async def trays(self, ref):
        return _trays(await self.call("GET", f"/printers/{await self.printer_id(ref)}/status"))

    async def queue(self, ref, item_id):
        return await self.call("GET", f"/queue/{int(item_id)}")

    async def print(self, ref, body):
        pid = await self.printer_id(ref)
        path = check_path(body.get("path"))
        if not SLICED.search(path):
            raise Upstream(400, "only sliced files (.gcode.3mf, .gcode) can be printed")
        mapping = body.get("ams_mapping")
        if mapping is not None and (not isinstance(mapping, list) or not all(isinstance(x, int) for x in mapping)):
            raise Upstream(400, "ams_mapping must be a list of tray ids")
        choice = lambda k: body.get(k) if body.get(k) in ("off", "on", "auto") else "auto"  # noqa: E731
        st = await self.call("GET", f"/printers/{pid}/status")
        if not st.get("connected") or str(st.get("state")).upper() not in READY:
            raise Upstream(409, f"printer is not ready ({st.get('state')})")
        if st.get("awaiting_plate_clear"):
            raise Upstream(409, "the plate has not been cleared")
        data, _ = await self.call("GET", f"/printers/{pid}/files/download", raw=True, params={"path": path})
        form = aiohttp.FormData()
        form.add_field("file", data, filename=path.rsplit("/", 1)[-1], content_type="application/octet-stream")
        up = await self.call("POST", "/library/files", data=form)
        item = await self.call("POST", "/queue/", json={
            "printer_id": pid, "library_file_id": up["id"], "plate_id": int(body.get("plate_id") or 1),
            "ams_mapping": mapping, "bed_levelling": choice("bed_levelling"), "flow_cali": choice("flow_cali"),
            "timelapse": bool(body.get("timelapse")), "insert_at_top": True,
            # a file that was already in the library (duplicate) stays there
            "cleanup_library_after_dispatch": up.get("duplicate_of") is None,
        })
        _LOG.info("queued %s on printer %s as queue item %s", path, pid, item.get("id"))
        return item


def _trays(st):
    """Loaded filaments with Bambuddy's global tray ids (AMS: id * 4 + slot, AMS HT: its id, external: 254 / 255)
    and the extruder each one feeds (0 = right, 1 = left on the dual-nozzle machines)."""
    amap, out = st.get("ams_extruder_map") or {}, []
    for u in st.get("ams") or []:
        aid = int(u.get("id", 0))
        for i, t in enumerate(u.get("tray") or []):
            if not t.get("tray_type"):
                continue
            out.append({"tray": aid if aid >= 128 else aid * 4 + i, "ams": aid, "slot": i,
                        "extruder": int(amap[str(aid)]) if str(aid) in amap else None, **_fil(t)})
    slots = st.get("extruder_slots") or {}
    for t in st.get("vt_tray") or []:
        if not t.get("tray_type"):
            continue
        tid = int(t["id"])
        ext = next((int(k) for k, v in slots.items() if v and v.get("ams_id") == tid), None)
        out.append({"tray": tid, "ams": tid, "slot": 0, "extruder": ext, **_fil(t)})
    return out


def _fil(t):
    c = (t.get("tray_color") or "")[:6]
    return {"type": t.get("tray_type"), "color": f"#{c}" if c else None, "name": t.get("tray_sub_brands") or "",
            "idx": t.get("tray_info_idx") or "", "remain": t.get("remain")}
