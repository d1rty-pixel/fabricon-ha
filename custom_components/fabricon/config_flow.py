"""Setup asks for the defaults; the options (Configure) add per printer: AMS and the accessories its model profile
lists (e.g. an exhaust fan kit HA can't detect). Stored as options["printers"][slug] = {ams, <accessory>: bool}."""
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback

from .const import DOMAIN


def _schema(o):
    return vol.Schema({
        vol.Required("ams", default=o.get("ams", True)): bool,
        vol.Required("exhaust_box", default=o.get("exhaust_box", False)): bool,
        vol.Required("demo", default=o.get("demo", False)): bool,
    })


class FabriconFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if not self.hass.config_entries.async_entries("bambuddy"):
            return self.async_abort(reason="no_bambuddy")
        if user_input is None:
            return self.async_show_form(step_id="user", data_schema=_schema({}))
        return self.async_create_entry(title="Fabricon", data={}, options=user_input)

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        return FabriconOptions()


class FabriconOptions(config_entries.OptionsFlow):
    """First what to configure (the defaults or one printer), then its form."""

    async def async_step_init(self, user_input=None):
        from . import panel  # noqa: PLC0415 (the generator is imported lazily, off the event loop)
        self._printers = {p["slug"]: p for p in await self.hass.async_add_executor_job(panel.printer_list, self.hass)}
        if user_input is not None:
            return await (self.async_step_general() if user_input["target"] == "general" else self.async_step_printer(slug=user_input["target"]))
        if not self._printers:
            return await self.async_step_general()
        choices = {"general": "Defaults (all printers) and demo printers",
                   **{s: f'{p["model"]} · {p["name"]}' for s, p in self._printers.items()}}
        return self.async_show_form(step_id="init", data_schema=vol.Schema({vol.Required("target", default="general"): vol.In(choices)}))

    async def async_step_general(self, user_input=None):
        if user_input is not None:
            return self.async_create_entry(data={**self.config_entry.options, **user_input})
        return self.async_show_form(step_id="general", data_schema=_schema(self.config_entry.options))

    async def async_step_printer(self, user_input=None, slug=None):
        if slug:
            self._slug = slug
        p, opts = self._printers[self._slug], self.config_entry.options
        own = opts.get("printers", {}).get(self._slug, {})
        fields = {vol.Required("ams", default=own.get("ams", opts.get("ams", True))): bool}
        for acc in p["spec"].get("accessories", []):
            fields[vol.Required(acc["key"], default=own.get(acc["key"], opts.get(acc["key"], False)))] = bool
        if user_input is not None and not slug:
            return self.async_create_entry(data={**opts, "printers": {**opts.get("printers", {}), self._slug: user_input}})
        accs = ", ".join(a["label"] for a in p["spec"].get("accessories", [])) or "none for this model"
        return self.async_show_form(step_id="printer", data_schema=vol.Schema(fields),
                                    description_placeholders={"printer": f'{p["model"]} · {p["name"]}', "accessories": accs})
