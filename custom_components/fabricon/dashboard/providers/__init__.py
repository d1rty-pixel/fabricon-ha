"""Printer systems Fabricon reads. Each provider module has:

  NAME                         its key (spec["provider"])
  discover(devs, ents)         its printers from HA's device / entity registry:
                               [{P (entity prefix or None), DEV, serial, slug, model, name, provider}]
  TABLE                        how profile components map to its entities (see spec.bind)

The runtime side (file / queue API behind the print dock) is the integration's backends/<name>.py.
Add a provider: a module here, its name in PROVIDERS, a backend if it can print files, profiles naming it.
"""
from . import bambuddy

PROVIDERS = {bambuddy.NAME: bambuddy}
