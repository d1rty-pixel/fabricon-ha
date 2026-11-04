"""Print proxy for the Fabricon card: the printer system's file / queue API behind Home Assistant's login.

The browser can't call the printer system itself (no CORS, and its API key must not reach it); this view forwards
a few calls to the printer's backend (backends/: one per provider). Printers are addressed by serial number.

GET  /api/fabricon/<serial>/files?path=/          directory listing on the printer (the USB stick)
GET  /api/fabricon/<serial>/plates?path=          plates of a sliced file: time, grams, filaments, thumbnail
GET  /api/fabricon/<serial>/thumb?path=&plate=N   plate thumbnail (png)
GET  /api/fabricon/<serial>/file?path=            the file itself (for the 3D view)
GET  /api/fabricon/<serial>/trays                 loaded filaments: global tray id, extruder, type, colour
GET  /api/fabricon/<serial>/queue?id=N            state of a queue item started here
POST /api/fabricon/<serial>/print                 {path, plate_id, ams_mapping, bed_levelling, flow_cali, timelapse}

Demo printers (serial DEMO-*, see dashboard/demo.py): the view answers them with an empty USB stick.
"""
from aiohttp import web
from homeassistant.components.http import HomeAssistantView

from .backends import BACKENDS, Upstream
from .const import DOMAIN

try:
    from homeassistant.components.http import KEY_HASS
except ImportError:  # older cores
    KEY_HASS = "hass"


def _fail(status, text):
    return web.json_response({"error": text}, status=status)


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
        hass = request.app[KEY_HASS]
        try:
            # the printer's provider, as the last dashboard build found it (panel.async_build)
            provider = hass.data[DOMAIN].get("providers", {}).get(serial.upper(), "bambuddy")
            if provider not in BACKENDS:
                raise Upstream(501, f"printing is not supported for {provider} printers")
            be, q = BACKENDS[provider](hass), request.query
            if body is None and action == "files":
                return web.json_response(await be.files(serial, q.get("path", "/")))
            if body is None and action == "plates":
                return web.json_response(await be.plates(serial, q.get("path")))
            if body is None and action in ("thumb", "file"):
                data, ctype = await (be.thumb(serial, q.get("path"), q.get("plate", 1)) if action == "thumb" else be.file(serial, q.get("path")))
                return web.Response(body=data, content_type=ctype.split(";")[0], headers={"Cache-Control": "private, max-age=120"})
            if body is None and action == "trays":
                return web.json_response(await be.trays(serial))
            if body is None and action == "queue":
                return web.json_response(await be.queue(serial, q.get("id")))
            if body is not None and action == "print":
                return web.json_response(await be.print(serial, body))
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
