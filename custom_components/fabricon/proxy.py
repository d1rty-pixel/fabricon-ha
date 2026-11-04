"""Print proxy for the Fabricon card: Bambuddy's printer file API behind Home Assistant's login.

The browser can't call Bambuddy itself (no CORS, and the API key must not reach it); this view forwards a few
calls with the key of the bambuddy integration's config entry. Printers are addressed by serial number.

GET  /api/fabricon/<serial>/files?path=/          directory listing on the printer (the USB stick)
GET  /api/fabricon/<serial>/plates?path=          plates of a sliced file: time, grams, filaments, thumbnail
GET  /api/fabricon/<serial>/thumb?path=&plate=N   plate thumbnail (png)
GET  /api/fabricon/<serial>/file?path=            the file itself (for the 3D view)
GET  /api/fabricon/<serial>/trays                 loaded filaments: global tray id, extruder, type, colour
GET  /api/fabricon/<serial>/queue?id=N            state of a queue item started here
POST /api/fabricon/<serial>/print                 {path, plate_id, ams_mapping, bed_levelling, flow_cali, timelapse}

Demo printers (serial DEMO-*, see dashboard/demo.py): the view answers them with an empty USB stick.

Bambuddy can't print a file that is already on the printer: /print copies it into Bambuddy's library and queues
it from there (the library copy is removed after dispatch). Bambuddy's scheduler sends it once the plate is cleared.
"""
import json
import logging
import re

import aiohttp
from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import DOMAIN

try:
    from homeassistant.components.http import KEY_HASS
except ImportError:  # older cores
    KEY_HASS = "hass"

_LOG = logging.getLogger(__name__)
TIMEOUT = aiohttp.ClientTimeout(total=180)
READY = {"IDLE", "FINISH", "FAILED"}
SLICED = re.compile(r"\.(gcode\.3mf|gcode)$", re.I)


class Upstream(Exception):
    def __init__(self, status, text):
        super().__init__(text)
        self.status, self.text = status, text


def _fail(status, text):
    return web.json_response({"error": text}, status=status)


def _path(value):
    if not isinstance(value, str) or not value.startswith("/") or ".." in value or "\0" in value:
        raise Upstream(400, "bad path")
    return value


class Bambuddy:
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


class PrintView(HomeAssistantView):
    url = "/api/fabricon/{serial}/{action}"
    name = "api:fabricon"
    requires_auth = True

    async def get(self, request, serial, action):
        return await self._run(request, serial, action, None)

    async def post(self, request, serial, action):
        try:
            body = await request.json()
        except ValueError:
            return _fail(400, "JSON body expected")
        return await self._run(request, serial, action, body)

    async def _run(self, request, serial, action, body):
        if serial.upper().startswith("DEMO-"):
            return self._demo(action)
        try:
            bb = Bambuddy(request.app[KEY_HASS])
            pid = await bb.printer_id(serial)
            q = request.query
            if body is None and action == "files":
                return web.json_response(await bb.call("GET", f"/printers/{pid}/files", params={"path": _path(q.get("path", "/"))}))
            if body is None and action == "plates":
                return web.json_response(await bb.call("GET", f"/printers/{pid}/files/plates", params={"path": _path(q.get("path"))}))
            if body is None and action in ("thumb", "file"):
                sub = f"files/plate-thumbnail/{int(q.get('plate', 1))}" if action == "thumb" else "files/download"
                data, ctype = await bb.call("GET", f"/printers/{pid}/{sub}", raw=True, params={"path": _path(q.get("path"))})
                return web.Response(body=data, content_type=ctype.split(";")[0],
                                    headers={"Cache-Control": "private, max-age=120"})
            if body is None and action == "trays":
                return web.json_response(_trays(await bb.call("GET", f"/printers/{pid}/status")))
            if body is None and action == "queue":
                return web.json_response(await bb.call("GET", f"/queue/{int(q.get('id'))}"))
            if body is not None and action == "print":
                return web.json_response(await self._print(bb, pid, body))
            return _fail(404, f"unknown action {action}")
        except Upstream as err:
            return _fail(err.status, err.text)
        except (TypeError, ValueError) as err:
            return _fail(400, str(err))

    @staticmethod
    def _demo(action):
        """A demo printer: an empty stick, no slots; it can't print."""
        if action == "files":
            return web.json_response({"path": "/", "files": [], "warnings": []})
        if action == "trays":
            return web.json_response([])
        return _fail(409 if action == "print" else 404, "demo printer")

    async def _print(self, bb, pid, body):
        path = _path(body.get("path"))
        if not SLICED.search(path):
            raise Upstream(400, "only sliced files (.gcode.3mf, .gcode) can be printed")
        mapping = body.get("ams_mapping")
        if mapping is not None and (not isinstance(mapping, list) or not all(isinstance(x, int) for x in mapping)):
            raise Upstream(400, "ams_mapping must be a list of tray ids")
        choice = lambda k: body.get(k) if body.get(k) in ("off", "on", "auto") else "auto"  # noqa: E731
        st = await bb.call("GET", f"/printers/{pid}/status")
        if not st.get("connected") or str(st.get("state")).upper() not in READY:
            raise Upstream(409, f"printer is not ready ({st.get('state')})")
        if st.get("awaiting_plate_clear"):
            raise Upstream(409, "the plate has not been cleared")
        data, _ = await bb.call("GET", f"/printers/{pid}/files/download", raw=True, params={"path": path})
        form = aiohttp.FormData()
        form.add_field("file", data, filename=path.rsplit("/", 1)[-1], content_type="application/octet-stream")
        up = await bb.call("POST", "/library/files", data=form)
        item = await bb.call("POST", "/queue/", json={
            "printer_id": pid, "library_file_id": up["id"], "plate_id": int(body.get("plate_id") or 1),
            "ams_mapping": mapping, "bed_levelling": choice("bed_levelling"), "flow_cali": choice("flow_cali"),
            "timelapse": bool(body.get("timelapse")), "insert_at_top": True,
            # a file that was already in the library (duplicate) stays there
            "cleanup_library_after_dispatch": up.get("duplicate_of") is None,
        })
        _LOG.info("queued %s on printer %s as queue item %s", path, pid, item.get("id"))
        return item
