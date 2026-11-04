"""BamBuddy (Bambu Lab printers through the BamBuddy HACS integration).

Entities are sensor.<prefix>_<suffix>, the prefix being BamBuddy's printer slug (model + serial). TABLE names, per
component of a profile, the (domain, suffix) carrying it; a list = alternatives, the first one HA has wins
(dual-nozzle printers say left_/right_, single-nozzle ones don't). A plain string is a complete entity id (the
BamBuddy hub's own sensors).
"""
import re

NAME = "bambuddy"


def discover(devs, ents):
    """Devices under the BamBuddy hub with a print status sensor.
    devs: [{id, identifiers, via_device_id, model, name, name_by_user}], ents: [{entity_id, device_id}]."""
    hubs = {d["id"] for d in devs if any(i[0] == "bambuddy" and "_printer_" not in i[1] for i in d["identifiers"])}
    out = []
    for d in devs:
        if d.get("via_device_id") not in hubs:
            continue
        status = [x["entity_id"] for x in ents if x["device_id"] == d["id"] and re.fullmatch(r"sensor\..+_print_status", x["entity_id"])]
        if not status:
            continue
        serial = next(i[1].split("_printer_")[-1] for i in d["identifiers"] if i[0] == "bambuddy")
        out.append({"P": status[0][len("sensor."):-len("_print_status")], "DEV": d["id"], "serial": serial, "slug": serial.lower(),
                    "model": (d.get("model") or "Printer").upper(), "provider": NAME,
                    "name": d.get("name_by_user") or d["name"]})                # order + fallback; the header reads it live
    return out


def services(printer):
    """BamBuddy's own services; data merged into the call (device_id = the printer's device)."""
    dev = {"device_id": printer.get("DEV")}
    return {
        "home": {"service": "bambuddy.home_axes", "data": dev},
        "move": {"service": "bambuddy.move_axis", "data": dev},           # + axis, distance
        "extrude": {"service": "bambuddy.extrude", "data": dev},          # + distance
        "load": {"service": "bambuddy.load_filament", "data": {}},        # + entity_id (the slot sensor)
        "unload": {"service": "bambuddy.unload_filament", "data": dev},
        "dry": {"service": "bambuddy.start_drying", "data": {}},          # + device_id (the AMS), temperature, duration
        "dry_stop": {"service": "bambuddy.stop_drying", "data": {}},      # + device_id (the AMS)
        "hms_answer": {"service": "bambuddy.answer_hms", "data": dev},    # + code, action
        "maintenance_done": {"service": "bambuddy.mark_maintenance_done", "data": dev},   # + task_id
    }


TABLE = {
    "core": {
        "status": ("sensor", "print_status"), "stage": ("sensor", "print_stage"), "online": ("binary_sensor", "online"),
        "progress": ("sensor", "progress"), "layer": ("sensor", "current_layer"), "layers": ("sensor", "total_layers"),
        "remaining": ("sensor", "remaining_time"), "end_time": ("sensor", "end_time"), "job": ("sensor", "current_print"),
        "active_filament": ("sensor", "active_filament"), "cover": ("image", "cover"),
        "pause": ("button", "pause"), "resume": ("button", "resume"), "stop": ("button", "stop"),
        "speed": ("select", "print_speed"), "hms": ("sensor", "hms_errors"), "hms_clear": ("button", "clear_hms_errors"),
        "refresh": ("button", "refresh_status"), "firmware": ("update", "firmware"), "maintenance": ("sensor", "maintenance"),
        "print_hours": ("sensor", "print_hours"), "usb": [("binary_sensor", "usb_drive"), ("binary_sensor", "sd_card")],
        "plate_needed": ("binary_sensor", "plate_clear_needed"), "plate_cleared": ("button", "plate_cleared"),
        "ams_status": ("sensor", "ams_status"), "airduct": ("select", "airduct_mode"), "nozzle_select": ("select", "active_nozzle"),
        "wifi": ("sensor", "wifi_signal"), "ip": ("sensor", "ip_address"), "developer_mode": ("binary_sensor", "developer_mode"),
    },
    "heaters": {
        "nozzle_l": {"temp": ("sensor", "left_nozzle_temperature"), "target": ("number", "left_nozzle_target_temperature")},
        "nozzle_r": {"temp": ("sensor", "right_nozzle_temperature"), "target": ("number", "right_nozzle_target_temperature")},
        "nozzle": {"temp": ("sensor", "nozzle_temperature"), "target": ("number", "nozzle_target_temperature")},
        "bed": {"temp": ("sensor", "bed_temperature"), "target": ("number", "bed_target_temperature")},
        "chamber": {"temp": ("sensor", "chamber_temperature"), "target": ("number", "chamber_target_temperature")},
    },
    "extruders": {
        "left": {"type": ("sensor", "left_nozzle_type"), "diameter": ("sensor", "left_nozzle_diameter")},
        "right": {"type": ("sensor", "right_nozzle_type"), "diameter": ("sensor", "right_nozzle_diameter")},
        "main": {"type": ("sensor", "nozzle_type"), "diameter": ("sensor", "nozzle_diameter")},
    },
    "fans": {
        "part": ("fan", "part_cooling_fan"), "exhaust": ("fan", "exhaust_fan"), "chamber": ("fan", "chamber_fan"),
        "aux_l": ("fan", "left_auxiliary_fan"), "aux_r": ("fan", "right_auxiliary_fan"), "aux": ("fan", "auxiliary_fan"),
        "ventilation": ("fan", "ventilation"), "hotend": ("sensor", "hotend_fan"),
    },
    "lights": {"chamber": ("light", "chamber_light"), "main": ("light", "light")},
    "cameras": {"chamber": ("camera", "camera")},
    "doors": {"front": ("binary_sensor", "door")},
    "external": {"left": ("sensor", "left_external_spool"), "right": ("sensor", "right_external_spool"),
                 "main": ("sensor", "external_spool")},
    "ai": {
        "spaghetti": {"ref": ("switch", "spaghetti_detection"), "label": "Spaghetti", "icon": "mdi:noodles"},
        "build_plate": {"ref": ("switch", "build_plate_detection"), "label": "Build plate", "icon": "mdi:checkerboard"},
        "clumping": {"ref": ("switch", "clumping_detection"), "label": "Clumping", "icon": "mdi:printer-3d-nozzle-alert-outline"},
        "pileup": {"ref": ("switch", "pileup_detection"), "label": "Pile-up", "icon": "mdi:delete-variant"},
        "filament_backup": {"ref": ("switch", "ams_filament_backup"), "label": "Filament backup", "icon": "mdi:backup-restore"},
        "monitoring": {"ref": ("switch", "ai_monitoring"), "label": "AI monitoring", "icon": "mdi:eye-check-outline"},
        "first_layer": {"ref": ("switch", "first_layer_inspection"), "label": "First layer", "icon": "mdi:layers-search-outline"},
        "plate_position": {"ref": ("switch", "build_plate_position_detection"), "label": "Plate position", "icon": "mdi:checkerboard"},
        "air_printing": {"ref": ("switch", "air_printing_detection"), "label": "Air printing", "icon": "mdi:weather-windy"},
    },
    "telemetry": [
        {"label": "Connection", "icon": "mdi:lan-connect", "ref": ("binary_sensor", "online")},
        {"label": "WiFi", "icon": "mdi:wifi", "ref": ("sensor", "wifi_signal")},
        {"label": "IP", "icon": "mdi:ip-network-outline", "ref": ("sensor", "ip_address")},
        {"kind": "firmware"},
        {"label": "Dev mode", "icon": "mdi:code-braces", "ref": ("binary_sensor", "developer_mode")},
        {"kind": "storage", "icon": "mdi:usb-flash-drive-outline"},
        {"label": "BamBuddy Disk", "icon": "mdi:harddisk", "ref": "sensor.bambuddy_disk_usage"},
        {"kind": "extruders"},
    ],
    "stats": [
        {"label": "Print hours", "icon": "mdi:clock-outline", "ref": ("sensor", "print_hours")},
        {"label": "Prints", "icon": "mdi:counter", "ref": "sensor.bambuddy_total_prints"},
        {"label": "Successful", "icon": "mdi:check-bold", "ref": "sensor.bambuddy_successful_prints"},
        {"label": "Failed", "icon": "mdi:close-thick", "ref": "sensor.bambuddy_failed_prints"},
        {"label": "Cancelled", "icon": "mdi:cancel", "ref": "sensor.bambuddy_cancelled_prints"},
        {"label": "Filament", "icon": "mdi:weight-gram", "ref": "sensor.bambuddy_total_filament_used"},
        {"label": "Print time", "icon": "mdi:timer-outline", "ref": "sensor.bambuddy_total_print_time"},
    ],
    "services": services,
}
