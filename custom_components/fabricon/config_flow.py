"""Setup asks for the optional hardware; the same questions are the integration's options (Configure)."""
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
    async def async_step_init(self, user_input=None):
        if user_input is not None:
            return self.async_create_entry(data=user_input)
        return self.async_show_form(step_id="init", data_schema=_schema(self.config_entry.options))
