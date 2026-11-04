"""Fabricon: a Home Assistant dashboard for BamBuddy printers with a live 3D model of the printer.

The integration provides everything: the card (panel.py), the generated dashboard /fabricon-dashboard (panel.py +
dashboard/) and the print proxy that lets the card reach BamBuddy's file / queue API (proxy.py). Options: AMS,
External Exhaust Fan kit, demo printers. Service fabricon.rebuild regenerates the dashboard (and reloads the
generator's code, for development).
"""
import logging

from homeassistant.core import CoreState, callback
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.event import async_call_later
from homeassistant.helpers.start import async_at_started

from . import panel
from .const import DOMAIN
from .proxy import PrintView

_LOG = logging.getLogger(__name__)


async def async_setup_entry(hass, entry):
    data = hass.data.setdefault(DOMAIN, {"ids": {}})
    if not data.get("view"):
        hass.http.register_view(PrintView())   # an HTTP view can't be removed again; it stays for the run
        data["view"] = True
    await panel.async_setup_card(hass)
    if await panel.async_register_dashboard(hass):
        await panel.async_build(hass, entry)

    async def rebuild(call=None):
        await panel.async_setup_card(hass)
        await panel.async_build(hass, entry, reload=call is not None)

    hass.services.async_register(DOMAIN, "rebuild", rebuild)

    # BamBuddy's devices may appear after this entry is set up, and a printer can be added later
    pending = {}

    @callback
    def check(_now=None):
        pending.pop("timer", None)
        if panel.printer_ids(hass) != data.get("printers"):
            hass.async_create_task(panel.async_build(hass, entry))

    @callback
    def registry_changed(_event):
        if "timer" not in pending:
            pending["timer"] = async_call_later(hass, 10, check)

    entry.async_on_unload(hass.bus.async_listen(dr.EVENT_DEVICE_REGISTRY_UPDATED, registry_changed))
    async def started(_hass):
        await rebuild()

    if hass.state is not CoreState.running:   # once more when everything is loaded
        entry.async_on_unload(async_at_started(hass, started))
    entry.async_on_unload(entry.add_update_listener(_options_changed))
    entry.async_on_unload(lambda: pending.get("timer") and pending["timer"]())
    return True


async def _options_changed(hass, entry):
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass, entry):
    hass.services.async_remove(DOMAIN, "rebuild")
    panel.async_remove_dashboard(hass)
    panel.async_remove_card(hass)
    return True
