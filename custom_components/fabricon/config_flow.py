"""One entry without options: the proxy reads Bambuddy's URL and API key from the bambuddy integration."""
from homeassistant import config_entries

from . import DOMAIN


class FabriconFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()
        if not self.hass.config_entries.async_entries("bambuddy"):
            return self.async_abort(reason="no_bambuddy")
        return self.async_create_entry(title="Fabricon", data={})
