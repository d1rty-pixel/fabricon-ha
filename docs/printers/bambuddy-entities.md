# BamBuddy entities per printer model

Which Home Assistant entities the BamBuddy HACS integration creates for each Bambu Lab model, so Fabricon can bind
entities to printer components per model.

Sources (read in full, pinned):

- Integration: [Spegeli/hacs_bambuddy `v2.0.0_redesign`](https://github.com/Spegeli/hacs_bambuddy/tree/v2.0.0_redesign),
  domain `bambuddy`, requires BamBuddy >= 1.2.5.7 (`const.py` L49). Links below: `H:file#Lnn`.
- BamBuddy: [maziggy/bambuddy `v1.2.5.7`](https://github.com/maziggy/bambuddy/tree/v1.2.5.7) (latest stable; 1.3.1b1 daily exists). Links: `B:file#Lnn`.

All entity facts come from the integration source; nothing was observed on a live instance except what
Fabricon already uses. "Reported" below means "BamBuddy status field is not null at setup".

## 1. How entity ids are built

- Printer entity: `<platform>.<slug(display_model)>_<slug(serial)>_<translation_key>`
  ([H:entity.py#L98-L111](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/entity.py#L98-L111)).
  The suffix is the entity's `translation_key` (English key), not its display name; a printer without a model gets the prefix `printer`.
  Home Assistant keeps an id once registered, so a user-renamed id or a `_2` suffix is possible.
- The prefix is the model name from `display_model()`: `X1C`, `P1S`, `P2S`, `A1`, `A1 Mini` (slug `a1_mini`), `H2D`, `H2D Pro` (`h2d_pro`), `X2D`
  ([H:models.py#L352-L355](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/models.py#L352-L355)).
- AMS entity: `<platform>.<slug(AMS model)>_<slug(AMS serial)>_<key>`, e.g. `sensor.ams_2_pro_<serial>_slot_1` - it carries the AMS
  model and AMS serial, NOT the printer prefix. Without an AMS serial (AMS Lite) it is `<ams model>_<printer serial>_<letter>_<key>`
  ([H:models.py#L646-L654](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/models.py#L646-L654),
  [H:entity.py#L237-L248](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/entity.py#L237-L248)).
  AMS keys: `slot_1`..`slot_4` (AMS / AMS 2 Pro / AMS Lite) or `slot_1` (AMS HT), `humidity`, `temperature`, `drying_remaining_time`, `drying` (binary_sensor).
- X2D fans were renamed in 2.0.0 ([H:fan_ids.py#L26](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/fan_ids.py#L26)):
  an upgrade from 2.0.0-beta.2 migrates `auxiliary_fan`/`left_auxiliary_fan` to `left_auxiliary_fan`/`right_auxiliary_fan` (user-chosen ids stay).
- Printer entities are unavailable while the printer is offline, except `print_status`, `online`, `plate_clear_needed`, `maintenance`, `print_hours` (`available_when_offline`).

## 2. How the model and the capabilities are known

- BamBuddy `GET /printers/` returns per printer `model` (free text or code, `PrinterBase.model`
  [B:schemas/printer.py#L34](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/schemas/printer.py#L34)), `serial_number`, `nozzle_count` (1 or 2, auto-detected from MQTT,
  [L85](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/schemas/printer.py#L85)) and `supports_nozzle_flow_type`.
- Model codes the integration maps to a name (`_MODEL_NAMES`,
  [H:models.py#L134-L138](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/models.py#L134-L138); BamBuddy's own table
  [B:utils/printer_models.py#L34-L64](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/utils/printer_models.py#L34-L64)):

  | Model | Codes |
  |---|---|
  | X1C | `BL-P001` |
  | X1 / X1E | `BL-P002` / `C13` (also `BL-P003` in the integration) |
  | P1P / P1S | `C11` / `C12` |
  | P2S | `N7` |
  | X2D | `N6` |
  | A1 | `A11`, `N2S` |
  | A1 Mini | `A12`, `N1`, `A04` |
  | A2L | `N9` |
  | H2D / H2D Pro / H2C / H2S | `O1D` / `O1E`, `O2D` / `O1C`, `O1C2` / `O1S` |

- There is NO per-feature capability flag for door, airduct, light, fans or USB. The integration decides purely from a hard-coded
  model table (frozensets in
  [H:models.py#L141-L186](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/models.py#L141-L186)).
  An unknown or empty model gets only what every printer has (`has_aux_fans` false, `enclosed` true, no door, no airduct).
- Dual nozzle is dynamic, not model based: `"nozzle_2" in status.temperatures or info.nozzle_count == 2`
  ([H:models.py#L427-L431](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/models.py#L427-L431)). BamBuddy's own model list for two
  nozzles is H2D, H2D Pro, H2C, X2D ([B:printer_models.py#L231-L246](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/utils/printer_models.py#L231-L246)); H2S is single nozzle.
- The only capability flags in `GET /printers/{id}/status`
  ([B:schemas/printer.py#L347-L470](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/schemas/printer.py#L347-L470)): `supports_chamber_heater` (H2C/H2D/H2D Pro/H2S/X2D only,
  [B:services/printer_manager.py#L96-L130](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/services/printer_manager.py#L96-L130)), `supports_drying`, `supports_drying_while_printing`, `drying_screen_only`,
  `exhaust_fan_present`, `left_aux_fan_speed` (null = absent), `door_open`, `nozzles[]`, `extruder_slots`, `ams_extruder_map`, `vt_tray[]`. `temperatures.chamber*` is removed for models
  without a real sensor (P1P, P1S, A1, A1 mini; allowed: X1/X1C/X1E, X2D, P2S, H2*,
  [B:printer_manager.py#L27-L93](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/services/printer_manager.py#L27-L93), [printers.py#L722-L730](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/api/routes/printers.py#L722-L730)).

## 3. Device registry structure

| Device | identifiers | manufacturer / model | via_device | Source |
|---|---|---|---|---|
| Hub (BamBuddy instance) | `("bambuddy", <entry_id>)` | "BamBuddy" / "BamBuddy", `entry_type=service` | none | [entity.py#L47-L56](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/entity.py#L47-L56) |
| Printer | `("bambuddy", "<entry_id>_printer_<serial>")` | "Bambu Lab" / `display_model(model)` (`X1C`, `P1S`, `A1 Mini`, `H2D Pro` ...; None if BamBuddy has no model), `serial_number`, `sw_version`=firmware | hub | [entity.py#L59-L71](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/entity.py#L59-L71), [coordinator.py#L208-L210](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/coordinator.py#L208-L210) |
| AMS unit | `("bambuddy", "<entry_id>_printer_<serial>_ams_<ams serial or id>")` | "Bambu Lab" / `AMS`, `AMS 2 Pro`, `AMS HT`, `AMS Lite`; serial, sw_ver | the printer | [entity.py#L266-L286](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/entity.py#L266-L286) |
| Smart plug | plug identity | - / plug type | the printer it powers | [entity.py#L145-L150](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/entity.py#L145-L150) |

- Printer device name: `<BamBuddy name> (<model> / <serial>)`. AMS device name: `<printer name> AMS A (<model> / <serial>)` (letters A-D, `AMS HT A`-`H`, `AMS Lite` for the A2L)
  ([H:models.py#L626-L665](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/models.py#L626-L665)).
- Fabricon: the printer is the device with a `bambuddy` identifier containing `_printer_` whose `via_device_id` is the hub
  (`dashboard/build.py` L69-L80), the serial is the text after `_printer_`, and the model is the device `model` upper-cased
  (`A1 MINI`, `H2D PRO`; lacking model -> `PRINTER`). AMS devices also contain `_printer_` but their `via_device_id` is the printer, so they are skipped there.
  Model detection from the registry is therefore: `device.model` (reliable once BamBuddy knows the model); fallback: the entity-id prefix.
- Model-independent capability probes that work through the registry/entities alone: `nozzle_count` = presence of `sensor.*_left_nozzle_temperature`; chamber heater = presence of
  `number.*_chamber_target_temperature`; door = `binary_sensor.*_door`; airduct = `select.*_airduct_mode`; AMS kind = AMS device `model`.

## 4. Entity list per printer (all models)

Platform / key (= suffix) / unit / attributes. "Cond." = what decides existence.

### 4.1 Sensors ([H:sensor.py#L316-L369](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/sensor.py#L316-L369))

| Suffix | Unit / values | Cond. | Attributes |
|---|---|---|---|
| `print_status` | enum, see 6 | always | `bambuddy_name` |
| `print_hours` | h | always | |
| `maintenance` | enum `ok`/`due_soon`/`overdue` | always (unavailable until tasks read) | tasks |
| `print_stage` | enum, see 6 | always | |
| `progress` | % | always | |
| `remaining_time` | min | always | |
| `end_time` | timestamp | always | |
| `ams_status` | enum `idle`,`heating`,`feeding`,`retracting`,`verifying`,`purging`,`changing_filament`,`reading_rfid`,`assist`,`calibrating` | always | |
| `current_layer`, `total_layers` | int | always | |
| `current_print` | text | always | |
| `nozzle_temperature` | degC | single nozzle | |
| `left_nozzle_temperature`, `right_nozzle_temperature` | degC | dual nozzle (BamBuddy `nozzle` = left, `nozzle_2` = right) | |
| `bed_temperature` | degC | always | |
| `chamber_temperature` | degC | chamber temp reported at setup (model has a sensor, see section 2) | |
| `hotend_fan` | % (diagnostic) | always (null if not reported) | |
| `hms_errors` | count | always | `errors[]` {code, severity, description, actions} |
| `active_filament` | text | always | slot attrs |
| `external_spool` | text | single nozzle | `slot,color,type,name,remaining,active,empty,tray_id,nozzle_temp_min/max,drying_*,rfid,present` |
| `left_external_spool`, `right_external_spool` | text | dual nozzle (BamBuddy ids 254 / 255) | same |
| `nozzle_type`, `nozzle_diameter` (mm) | text / float, diagnostic | single nozzle | |
| `left_nozzle_type`, `left_nozzle_diameter`, `right_nozzle_type`, `right_nozzle_diameter` | same | dual nozzle (`nozzles[1]` = left, `nozzles[0]` = right per integration, [sensor.py#L402-L407](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/sensor.py#L402-L407); BamBuddy's schema comment says 0 = left, trust the integration) | |
| `wifi_signal` | dBm | not wired | |
| `ip_address` | text | always | |
| `printable_objects` | int | always, disabled by default | |

H2 nozzle types arrive as codes and are decoded (`stainless_steel`, `hardened_steel`, `tungsten_carbide`, `*_high_flow`, `tpu_high_flow`,
[H:models.py#L746-L761](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/models.py#L746-L761)).

AMS sensors ([H:sensor.py#L429-L467](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/sensor.py#L429-L467), slots L503):

| Suffix | Unit | Cond. |
|---|---|---|
| `slot_N` | text (filament name or `empty`), attrs as external spool | every tray of the unit |
| `humidity` | % | all AMS kinds except AMS Lite |
| `temperature` | degC | all AMS kinds except AMS Lite |
| `drying_remaining_time` | min | AMS 2 Pro and AMS HT only (`has_heater`) |

### 4.2 Binary sensors ([H:binary_sensor.py#L58-L112](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/binary_sensor.py#L58-L112))

| Suffix | Cond. |
|---|---|
| `online` | always (connectivity) |
| `door` | model in X1/X1C/X1E/X2D/P2S/H2D/H2D Pro/H2C/H2S (NOT P1S, P1P, A1, A1 mini) |
| `plate_clear_needed` | always (problem; BamBuddy queue gate `awaiting_plate_clear`) |
| `sd_card` | every model with a known model, except those with USB |
| `usb_drive` | replaces `sd_card` for P2S, X2D, H2C, H2D, H2D Pro, H2S (same BamBuddy `sdcard` flag) |
| `developer_mode` | always |
| `wired_network` | X1E and H2D Pro only |
| `timelapse` | always, disabled by default |
| `drying` (AMS entity) | AMS 2 Pro / AMS HT; attrs `remote_start`, `target_temperature` |

### 4.3 Numbers, selects, buttons, switches, others

| Platform / suffix | Cond. | Source |
|---|---|---|
| `number.nozzle_target_temperature` | single nozzle | [number.py#L67-L92](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/number.py#L67-L92) |
| `number.left_nozzle_target_temperature`, `right_nozzle_target_temperature` | dual nozzle | same |
| `number.bed_target_temperature` | always | L94 |
| `number.chamber_target_temperature` | status `supports_chamber_heater` (H2C/H2D/H2D Pro/H2S/X2D); 0-65 degC | L101 |
| `number.camera_frame_rate` | camera streams more than 5 fps (RTSP models) | [number.py#L126-L130](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/number.py#L126-L130) |
| `select.print_speed` | always (`silent`,`standard`,`sport`,`ludicrous`) | [select.py#L54](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/select.py#L54) |
| `select.airduct_mode` | airduct models (P2S, X2D, H2D, H2D Pro, H2C, H2S); options `cooling`,`heating` (state can also be `laser`) | L64 |
| `select.active_nozzle` | dual nozzle; `left`,`right` | L77 |
| `button.pause`, `resume`, `stop`, `plate_cleared`, `clear_hms_errors`, `refresh_status` | always | [button.py#L43-L91](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/button.py#L43-L91) |
| `camera.camera` | always, ONE per printer | [camera.py#L123](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/camera.py#L123) |
| `image.cover` | always, available while a job exists | [image.py#L31](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/image.py#L31) |
| `light.chamber_light` / `light.light` | one entity; `chamber_light` for enclosed printers, `light` for open frames (A1, A1 mini, A2L, P1P) | [light.py#L26-L45](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/light.py#L26-L45) |
| `update.firmware`, `update.update` (hub) | always | update.py L83 |
| `switch.ams_filament_backup` | once the printer reports an AMS unit | [switch.py#L51-L66](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/switch.py#L51-L66) |
| `switch.ai_monitoring`, `first_layer_inspection`, `build_plate_detection` / `build_plate_position_detection`, `spaghetti_detection`, `pileup_detection`, `clumping_detection`, `air_printing_detection` | per model `detectors()` (X1: monitoring, first layer, plate; A1: plate position; P2S/X2D/H2*: spaghetti, pile-up, clumping, plate, H2D/H2D Pro/H2C also air printing) | [models.py#L668-L686](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/models.py#L668-L686) |

### 4.4 Fans ([H:fan.py#L47-L116](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/fan.py#L47-L116))

All are `fan` entities, percent in tens (speed_count 10).

| Suffix | BamBuddy field | Exists when |
|---|---|---|
| `part_cooling_fan` | `cooling_fan_speed` (fan "part") | always |
| `auxiliary_fan` | `big_fan1_speed` | model not A1 family and not X2D (disabled by default on X1 / P1P) |
| `left_auxiliary_fan` | `big_fan1_speed` (fan 2) | X2D only (replaces `auxiliary_fan`) |
| `chamber_fan` | `big_fan2_speed` | model not A1 family and not in the exhaust set (so X1C, P1S, X1E; not P2S/X2D/H2*) |
| `exhaust_fan` | `big_fan2_speed` | X2D, H2D, H2D Pro, H2C, H2S always; P2S only with the exhaust kit (`exhaust_fan_present`) |
| `right_auxiliary_fan` | `left_aux_fan_speed` (fan 10) | X2D, when the field is reported (not null) |
| `left_auxiliary_fan` (second use) | `left_aux_fan_speed` (fan 10) | non-X2D when reported, in practice P2S with the accessory |
| `ventilation` | airduct cooling + vent fans | airduct models (P2S: aux fan, plus exhaust with kit; X2D: right aux if reported + exhaust; H2*: exhaust); attr `fans` |

On the P2S, `auxiliary_fan` and (kit) `left_auxiliary_fan` can both exist; on the X2D the two are `left_auxiliary_fan` (fan 2) and `right_auxiliary_fan` (fan 10).

## 5. Logical component -> suffix per model

Legend: platform is the HA domain in the first column. `-` = does not exist. `(c)` = conditional, see note. Dual/single nozzle is derived from the
printer, so a model listed as single can turn dual only if BamBuddy reports `nozzle_2` / `nozzle_count` 2.

| Component | X2D | H2D | X1C | P1S | P2S | A1 | A1 mini |
|---|---|---|---|---|---|---|---|
| Nozzle temp (sensor) | `left_nozzle_temperature` + `right_nozzle_temperature` | same as X2D | `nozzle_temperature` | `nozzle_temperature` | `nozzle_temperature` | `nozzle_temperature` | `nozzle_temperature` |
| Nozzle target (number) | `left_nozzle_target_temperature` + `right_nozzle_target_temperature` | same | `nozzle_target_temperature` | same | same | same | same |
| Nozzle type (sensor) | `left_nozzle_type`, `right_nozzle_type` | same | `nozzle_type` | same | same | same | same |
| Nozzle diameter (sensor) | `left_nozzle_diameter`, `right_nozzle_diameter` | same | `nozzle_diameter` | same | same | same | same |
| Active nozzle (select) | `active_nozzle` | `active_nozzle` | - | - | - | - | - |
| Bed temp / target | `bed_temperature` / `bed_target_temperature` (number) | same | same | same | same | same | same |
| Chamber temp (sensor) | `chamber_temperature` | `chamber_temperature` | `chamber_temperature` | - (filtered by BamBuddy) | `chamber_temperature` | - | - |
| Chamber target (number) | `chamber_target_temperature` | `chamber_target_temperature` | - (sensor only) | - | - (sensor only) | - | - |
| Part cooling fan | `part_cooling_fan` | `part_cooling_fan` | `part_cooling_fan` | `part_cooling_fan` | `part_cooling_fan` | `part_cooling_fan` | `part_cooling_fan` |
| Auxiliary fan | `left_auxiliary_fan` + `right_auxiliary_fan` (c: right once reported) | `auxiliary_fan` | `auxiliary_fan` | `auxiliary_fan` | `auxiliary_fan` (+ `left_auxiliary_fan` (c) accessory) | - | - |
| Chamber fan | - | - | `chamber_fan` | `chamber_fan` | - | - | - |
| Exhaust fan | `exhaust_fan` | `exhaust_fan` | - | - | `exhaust_fan` (c: kit) | - | - |
| Ventilation (fan) | `ventilation` | `ventilation` | - | - | `ventilation` | - | - |
| Airduct mode (select) | `airduct_mode` | `airduct_mode` | - | - | `airduct_mode` | - | - |
| Hotend fan (sensor) | `hotend_fan` | `hotend_fan` | `hotend_fan` | `hotend_fan` | `hotend_fan` | `hotend_fan` | `hotend_fan` |
| Light (light) | `chamber_light` | `chamber_light` (one entity, switches both lights) | `chamber_light` | `chamber_light` | `chamber_light` | `light` | `light` |
| Door (binary_sensor) | `door` | `door` | `door` | - | `door` | - | - |
| Storage (binary_sensor) | `usb_drive` | `usb_drive` | `sd_card` | `sd_card` | `usb_drive` | `sd_card` | `sd_card` |
| External spool (sensor) | `left_external_spool`, `right_external_spool` | same | `external_spool` | `external_spool` | `external_spool` | `external_spool` | `external_spool` |
| Camera | `camera` | `camera` | `camera` | `camera` | `camera` | `camera` | `camera` |
| Job cover (image) | `cover` | `cover` | `cover` | `cover` | `cover` | `cover` | `cover` |
| Print status / stage | `print_status`, `print_stage` | same | same | same | same | same | same |
| Plate clear needed | `plate_clear_needed` | same | same | same | same | same | same |
| Speed (select) | `print_speed` | same | same | same | same | same | same |
| HMS | `hms_errors`, button `clear_hms_errors` | same | same | same | same | same | same |
| Maintenance | `maintenance` | same | same | same | same | same | same |
| Wired network | - | - (H2D Pro only) | - | - | - | - | - |
| Firmware (update) | `update.<prefix>_firmware` | same | same | same | same | same | same |
| AMS kinds typically paired | AMS 2 Pro, AMS HT, AMS | same | AMS | AMS | AMS | AMS Lite (id 0; no humidity / temp / drying) | AMS Lite |

Notes
- (c) Conditions: `chamber_temperature` also needs BamBuddy to have sent a chamber temperature when the integration set up (an entity missing at start does not
  appear later without a reload). `right_auxiliary_fan` appears once `left_aux_fan_speed` is non-null. P2S `exhaust_fan` / second aux fan appear with the accessories.
- X1E / X1 / P1P / A2L / H2C / H2S / H2D Pro behave like their family (X1E: chamber heater not in BamBuddy's list, wired network yes; H2S single nozzle with heater and airduct; H2C dual
  nozzle with heater and airduct; P1P: open frame, no chamber fan or aux fan stock, entities disabled by default; A2L: A1 family plus AMS Lite at place 6).
- H2D light: BamBuddy models ONE `chamber_light` boolean; the integration switches "both chamber lights of printers that have two"
  ([light.py#L27-L28](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/light.py#L27-L28)). There is no second light entity (no work light, no logo light).
- One camera entity per printer. An external camera replaces the stream; fps cap is 30 for X1/X2/H2/P2 model families and 5 for A1/P1 (`camera_max_fps`,
  [models.py#L368-L380](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/models.py#L368-L380)).
- X2D right/left naming: fan 2 is the LEFT auxiliary fan, fan 10 the RIGHT (the X2D is the one model where BamBuddy's field `left_aux_fan_speed` is the right fan).

## 6. print_status and print_stage

`print_status` options ([H:models.py#L19-L41](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/models.py#L19-L41)):
`idle`, `preparing`, `slicing`, `printing`, `paused`, `finished`, `failed`, `offline`, `unknown`. Mapping from the firmware `gcode_state`:
`IDLE`/`INIT` -> idle, `PREPARE` -> preparing, `SLICING` -> slicing, `RUNNING` -> printing, `PAUSE` -> paused, `FINISH` -> finished, `FAILED` -> failed;
not connected -> `offline`; anything else -> `unknown`/no state ([L696-L701](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/models.py#L696-L701)).

`print_stage` options (`STAGE_OPTIONS`, [L53-L130](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/models.py#L53-L130), logic L704-L718):
`idle` (no stage while not in a job), `printing`, `auto_bed_leveling`, `heatbed_preheating`, `vibration_compensation`, `changing_filament`, `m400_pause`,
`paused_filament_runout`, `heating_nozzle`, `calibrating_dynamic_flow`, `scanning_bed_surface`, `inspecting_first_layer`, `identifying_build_plate`,
`calibrating_micro_lidar`, `homing_toolhead`, `cleaning_nozzle_tip`, `checking_extruder_temperature`, `paused_by_user`, `paused_front_cover`, `calibrating_lidar`,
`calibrating_flow_ratio`, `paused_nozzle_temperature`, `paused_bed_temperature`, `unloading_filament`, `paused_step_loss`, `loading_filament`, `motor_noise_cancellation`,
`paused_ams_offline`, `paused_hotend_fan`, `paused_chamber_temperature`, `cooling_chamber`, `paused_by_gcode`, `motor_noise_showoff`, `paused_nozzle_clumping`,
`paused_cutter`, `paused_first_layer`, `paused_nozzle_clog`, `measuring_motion_precision`, `enhancing_motion_precision`, `measuring_motion_accuracy`,
`calibrating_nozzle_offset`, `high_temperature_bed_leveling`, `checking_quick_release_lever`, `checking_door_and_cover`, `calibrating_laser`, `checking_platform`,
`confirming_birdseye_camera`, `calibrating_birdseye_camera`, `bed_leveling_phase_1`, `bed_leveling_phase_2`, `heating_chamber`, `cooling_heatbed`,
`printing_calibration_lines`, `checking_material`, `calibrating_live_view_camera`, `waiting_for_heatbed`, `checking_material_position`, `calibrating_cutting_module`,
`measuring_surface`, `thermal_preconditioning`, `homing_blade_holder`, `calibrating_camera_offset`, `calibrating_blade_holder`, `testing_hotend_change`,
`waiting_for_chamber`, `preparing_hotend`, `calibrating_clumping_detection`, `purifying_chamber_air`, `preparing`, `preparing_ams`, plus derived `heating_heatbed`.
During a job with no stage the sensor state is unknown (None); a stage number outside the table is also unknown.
Stage 0 ("printing") is ignored unless the job is running/paused (A1, P1 report it while idle).

## 7. BamBuddy REST API Fabricon uses (`/api/v1`)

Endpoints ([B:routes/printers.py](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/api/routes/printers.py),
[library.py](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/api/routes/library.py),
[print_queue.py](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/api/routes/print_queue.py)):

| Endpoint | Line | Model dependence |
|---|---|---|
| `GET /printers/` | [L139](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/api/routes/printers.py#L139) | returns `model`, `nozzle_count`, `serial_number`, `supports_nozzle_flow_type` |
| `GET /printers/{id}/status` | [L480](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/api/routes/printers.py#L480) | same schema for all; chamber temps removed on models without a sensor; model flags listed in section 2 |
| `GET /printers/{id}/files?path=` | [L1604](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/api/routes/printers.py#L1604) | same route; `printer_model` only tunes the FTP client (A1 / A1 Mini get FTP workarounds, `BambuFTPClient.A1_MODELS`, [ftp.py#L507](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/services/bambu_ftp.py#L507)). Storage root (USB vs SD) is a printer matter, not a route difference |
| `GET /printers/{id}/files/download?path=` | [L1632](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/api/routes/printers.py#L1632) | model independent (same FTP note) |
| `GET /printers/{id}/files/plates?path=` | [L1718](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/api/routes/printers.py#L1718) | model independent (3MF only) |
| `GET /printers/{id}/files/plate-thumbnail/{n}?path=` | [L1957](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/api/routes/printers.py#L1957) | model independent; needs media token |
| `POST /library/files` (upload), `GET /library/files/{id}/plates`, `.../plate-thumbnail/{n}`, `.../download` | [L2303](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/api/routes/library.py#L2303), [L3225](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/api/routes/library.py#L3225), [L3515](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/api/routes/library.py#L3515), [L5390](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/api/routes/library.py#L5390) | model independent |
| `POST /queue/`, `GET /queue/{id}`, `POST /queue/{id}/start`, `/cancel`, `/stop` | [L808](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/api/routes/print_queue.py#L808), [L1854](https://github.com/maziggy/bambuddy/blob/v1.2.5.7/backend/app/api/routes/print_queue.py#L1854) | model independent per route; a queue item is bound to a printer id or a model name; the printer rejects a 3MF sliced for another model (`printer_model` in 3MF) |

Fabricon's proxy uses exactly these (`custom_components/fabricon/proxy.py` L164-L210; `_trays()` reads `vt_tray`, `ams[].tray`, `ams_extruder_map`, `extruder_slots`, which
are the dual-nozzle aware fields; on single-nozzle printers `ams_extruder_map` is empty so `extruder` becomes None and the external spool is tray 254 with `id` from `vt_tray`).

Per-model capability data in the API: `nozzle_count` (`/printers/`), `supports_nozzle_flow_type` (`/printers/`), and in `/status`: `supports_chamber_heater`, `supports_drying`,
`drying_screen_only` (P1 series), `exhaust_fan_present`, `left_aux_fan_speed`, `door_open` (always present, false when no door), `nozzles[]`, `active_extruder`. There is NO `has_chamber_heater`,
`has_door`, `has_airduct` or `light_count` flag; the model string is the only discriminator, and it is free text in `/printers` (code or name, see section 2).

## 8. Open points and risks for Fabricon

- `door`, `airduct_mode` select, `ventilation`, `exhaust_fan` etc. do not exist for other models. Bind by "entity exists", falling back to a model table, because entities are created
  at integration start from what the printer reported then.
- `chamber_temperature` may be missing for a printer that was offline when the BamBuddy integration loaded.
- Model prefix in entity ids can change if the user corrects the model in BamBuddy (`model_changed`, [coordinator.py#L575-L585](https://github.com/Spegeli/hacs_bambuddy/blob/v2.0.0_redesign/custom_components/bambuddy/coordinator.py#L575-L585)); entity ids stay (HA keeps them), so resolve entities by device (device_id -> entities, translation key via the
  unique id `<entry>_<serial>_<key>`), not by the id prefix, when possible. Unique id keys (`left_aux_fan`, `aux_fan`, `chamber_fan`, `nozzle_target`, `nozzle_2_target`, `external_spool_2`, `sdcard`...) differ from the suffixes above.
- AMS Lite (A1, A1 mini, A2L) has no humidity / temperature / drying, and possibly no serial (entity id built from printer serial and place letter).
- Not verified on live hardware: P2S accessory behaviour, H2D `left_aux_fan_speed`, `left_`/`right_` mapping of `nozzles[]` on the X2D versus H2D.

## 9. Newer models and modules

Research of 2026-11-05. Sources, read as source code (not observed on hardware):

- Integration [Spegeli/hacs_bambuddy `v2.1.0-beta.2`](https://github.com/Spegeli/hacs_bambuddy/tree/v2.1.0-beta.2) (pre-release of 2026-11-02; releases: 2.0.0_redesign 2026-10-29, 2.1.0-beta.1 2026-11-01). Links `H2:file`.
- BamBuddy [maziggy/bambuddy `v1.3.1b1-daily.20261105`](https://github.com/maziggy/bambuddy/tree/v1.3.1b1-daily.20261105) (daily of 2026-11-05; latest stable is still v1.2.5.7, 2026-10-02; the `main` branch is stale, 2026-10-22). Links `B2:file`.
- Bambu Lab H3C coverage: [Tom's Hardware](https://www.tomshardware.com/3d-printing/bambu-lab-teases-its-mysterious-h3c-tool-changer-3d-printer-features-nine-tools-and-a-drop-down-rack-slated-for-november-3-launch) (tool changer, nine tools, announced for 2026-11-03).

### 9.1 Model codes (complete, both projects agree)

BamBuddy's tables: [`utils/printer_models.py`](https://github.com/maziggy/bambuddy/blob/v1.3.1b1-daily.20261105/backend/app/utils/printer_models.py) (`PRINTER_MODEL_ID_MAP`, 3MF names in `PRINTER_MODEL_MAP`),
[`virtual_printer/manager.py`](https://github.com/maziggy/bambuddy/blob/v1.3.1b1-daily.20261105/backend/app/services/virtual_printer/manager.py) (SSDP codes),
[`frontend/src/utils/printerModel.ts`](https://github.com/maziggy/bambuddy/blob/v1.3.1b1-daily.20261105/frontend/src/utils/printerModel.ts). Integration:
[H2:models.py `_MODEL_NAMES`](https://github.com/Spegeli/hacs_bambuddy/blob/v2.1.0-beta.2/custom_components/bambuddy/models.py#L134-L138) (identical to 2.0.0 apart from `BL-P003` -> X1E, which only the integration and the frontend know).

| Code | Model | | Code | Model |
|---|---|---|---|---|
| `BL-P001` | X1C | | `N7` | P2S |
| `BL-P002` | X1 | | `N6` | X2D |
| `BL-P003` (integration/frontend only) / `C13` | X1E | | `N9` | A2L |
| `C11` / `C12` | P1P / P1S | | `A11`, `N2S` | A1 |
| `O1D` | H2D | | `A12`, `N1`, `A04` | A1 Mini |
| `O1E`, `O2D` | H2D Pro | | `O1C`, `O1C2` | H2C |
| `O1S` | H2S | | | |

Also accepted by BamBuddy as plain names: `P1P`, `P1S`, `P2S` (3MF/IDs), `Bambu Lab A1M` (terse cloud rename, = A1 Mini).
- **H3C: unknown to both projects.** No code, no name, no entry anywhere in either repository (grep of the whole BamBuddy tree and the integration). An H3C would arrive as an unmapped model string: the integration's `display_model()` returns the stored text as is, so the device `model` and the entity-id prefix are whatever BamBuddy stored (free text or the SSDP code); `model_key()` matches no table, so the printer gets only the "unknown model" feature set from section 2 (no door, no airduct, no USB, no exhaust fan, no AI detectors, camera capped at 5 fps, light = `chamber_light`). Dual-nozzle detection is dynamic (`nozzle_2` in temperatures or `nozzle_count` 2) and BamBuddy's `DUAL_NOZZLE_MODELS` does not contain it, so a nine-tool changer would show at most the two nozzles BamBuddy parses. Expect a BamBuddy/integration update (as happened for X2D #988 and A2L #1684) before it works properly.
- **No newer model than the above exists in either project** (no "H2D Pro 2", no A2 variant other than A2L, no laser variant code). Note the laser combos (H2D/H2C with laser module) use the H2D/H2C codes; nothing in BamBuddy distinguishes them.

### 9.2 Component -> entity suffix for the models missing from section 5

All derived from the same model sets as sections 4/5 ([H2:models.py#L142-L167](https://github.com/Spegeli/hacs_bambuddy/blob/v2.1.0-beta.2/custom_components/bambuddy/models.py#L142-L167), [L257-L260](https://github.com/Spegeli/hacs_bambuddy/blob/v2.1.0-beta.2/custom_components/bambuddy/models.py#L257-L260)); prefix = display name slug (`h2c`, `h2s`, `h2d_pro`, `a2l`).

| Component | H2C | H2S | H2D Pro | A2L |
|---|---|---|---|---|
| Nozzles | dual: `left_nozzle_temperature` + `right_nozzle_temperature`, `left_/right_nozzle_target_temperature`, `left_/right_nozzle_type`, `*_diameter`, `active_nozzle` (select) | single: `nozzle_temperature`, `nozzle_target_temperature`, `nozzle_type`, `nozzle_diameter` | as H2C (dual) | single (as A1): `nozzle_temperature` etc.; the cutter/plotter head is NOT a nozzle (no entities) |
| Nozzle rack (6 hotends, "Vortek") | none: BamBuddy parses `nozzle_rack[]` (ids 16-21, [B2:schemas/printer.py#L258-L271](https://github.com/maziggy/bambuddy/blob/v1.3.1b1-daily.20261105/backend/app/schemas/printer.py#L258-L271), `NOZZLE_RACK_MODELS` = H2C only) in `/status`, the integration has no rack entity or attribute | - | - | - |
| Bed | `bed_temperature`, `bed_target_temperature` (max 120) | same | same | same (max 80, nozzle max 300) |
| Chamber | `chamber_temperature` + `chamber_target_temperature` (heater) | same | same | - (open frame; BamBuddy filters chamber temps for A2L, not on its sensor allow-list) |
| Fans | `part_cooling_fan`, `auxiliary_fan`, `exhaust_fan`, `ventilation`, sensor `hotend_fan` | same | same | `part_cooling_fan`, `hotend_fan` only (A1 family: no aux, chamber or exhaust fan) |
| Airduct select | `airduct_mode` | `airduct_mode` | `airduct_mode` | - |
| Light | `light.chamber_light` | same | same | `light.light` (open frame) |
| Door | `door` | `door` | `door` | - |
| Storage | `usb_drive` | `usb_drive` | `usb_drive` | `sd_card` (not in `_USB_DRIVE`) |
| Wired network | - | - | `wired_network` | - |
| External spool | `left_external_spool` + `right_external_spool` | `external_spool` | `left_/right_external_spool` | `external_spool` |
| AMS | AMS 2 Pro / AMS HT / AMS | same | same | AMS Lite at place 6 (entity id from AMS model + printer serial, no place letter, when BamBuddy has no AMS serial; humidity, temperature and drying absent; the Lite sends a fixed 0) |
| Camera | `camera` (RTSP, 30 fps) | same | same | `camera` (chamber-image protocol, port 6000, 5 fps) |
| AI switches | `spaghetti_detection`, `pileup_detection`, `clumping_detection`, `build_plate_detection`, `air_printing_detection` | same without `air_printing_detection` | same as H2C | `build_plate_position_detection` only |
| Other | `print_speed`, buttons, `cover`, `plate_clear_needed`, `hms_errors`, `maintenance`, `update.firmware` | same | same | same |

Sources: `_DOOR/_AIRDUCT/_USB_DRIVE/_EXHAUST_FAN` L143-L154, `_SINGLE_DETECTORS/_AIR_PRINTING` L259-L260, `_ETHERNET` L147, `_OPEN_FRAME` L164, AMS Lite handling `ams_type_by_place` L620 / `ams_label` L626.
Nothing about "multiple hotends" beyond left/right exists: the integration has no tool-changer, nozzle-rack or hotend-change entity (stages `testing_hotend_change`, `preparing_hotend`, `homing_blade_holder`, `calibrating_blade_holder` exist as `print_stage` values only).

### 9.3 Laser / cutting module

Plainly: **neither BamBuddy nor the integration models a laser or cutting module.** There are no entities for module type, laser power, laser state, air assist, safety key, enclosure/lid interlock for it, or cutting blade/mat; no MQTT field of that kind is parsed (grep for laser, cutter, cutting, plotter, hw_switch in backend and integration finds only the items below). The Bambu H2D/H2C laser combos and the A2L cutter/plotter are therefore just an H2D/H2C/A2L to them.

What does exist (all read passively):

| Item | Where | Effect |
|---|---|---|
| `select.<p>_airduct_mode` state `laser` | BamBuddy keeps `airduct_mode` int from MQTT `device.airduct.modeCur` ([B2:bambu_mqtt.py#L5081-L5089](https://github.com/maziggy/bambuddy/blob/v1.3.1b1-daily.20261105/backend/app/services/bambu_mqtt.py#L5081-L5089), comment only says 0 cooling, 1 heating). The integration maps `{0: cooling, 1: heating, 2: laser}` ([H2:select.py#L23-L24](https://github.com/Spegeli/hacs_bambuddy/blob/v2.1.0-beta.2/custom_components/bambuddy/select.py#L23-L24)) | The only laser signal. While the printer is in mode 2 the select's `options` list is `cooling, heating, laser` (the current state is appended, [L110-L115](https://github.com/Spegeli/hacs_bambuddy/blob/v2.1.0-beta.2/custom_components/bambuddy/select.py#L110-L115)); selecting `laser` is ignored, only cooling/heating can be set. Any other mode number gives state `unknown`. Exists only on airduct models (P2S, X2D, H2D, H2D Pro, H2C, H2S), never on the A2L. Icon `mdi:laser-pointer`, translation "Laser mode". |
| `print_stage` `calibrating_laser` (stage 43), `paused_cutter` (33), `calibrating_cutting_module` (56) | [H2:models.py#L87,L97,L110](https://github.com/Spegeli/hacs_bambuddy/blob/v2.1.0-beta.2/custom_components/bambuddy/models.py#L87); BamBuddy [bambu_mqtt.py#L1237-L1247](https://github.com/maziggy/bambuddy/blob/v1.3.1b1-daily.20261105/backend/app/services/bambu_mqtt.py#L1237) | Stage names only; they come from the shared stage table. |
| `ventilation` fan | [H2:fan.py#L224-L229](https://github.com/Spegeli/hacs_bambuddy/blob/v2.1.0-beta.2/custom_components/bambuddy/fan.py#L224-L229) | `turn_off` is a no-op outside cooling mode, because "the H2's exhaust fan draws off the laser's fumes". |
| A2L | BamBuddy treats it as single-FDM plus a cutter/plotter head; the changelog (v0.2.4.7, #1684) says: "The cutter/plotter capability surfaces in MQTT push fields Bambuddy doesn't yet model; ignored for v1" ([CHANGELOG.md](https://github.com/maziggy/bambuddy/blob/v1.3.1b1-daily.20261105/CHANGELOG.md), grep "Bambu Lab A2L support"). | no cutter entities |

How a laser / cutting job looks in HA: not known from source (no capture of such a job exists in either repository, and the 3MF/job would not be a normal gcode print). What the code would do with the standard MQTT: `print_status` follows `gcode_state` (`printing` while `RUNNING`, so a laser job shows as `printing` if the printer reports RUNNING), `print_stage` is the stage number if it is in the table else `unknown` (None), `progress`, `remaining_time`, layer counts as reported, temperatures normal, `airduct_mode` = `laser` when the printer sets modeCur 2. BamBuddy has no notion of a non-3D job type: it would archive/queue it like a print. **Fabricon should treat `airduct_mode == laser` as the only module signal, and the fixed names `calibrating_laser` / `calibrating_cutting_module` / `paused_cutter` as the only stage signals.** Anything else needs a live capture (BamBuddy's debug log or support bundle of a laser-equipped H2D/H2C/A2L).

### 9.4 Changes in the integration since v2.0.0_redesign (to v2.1.0-beta.2)

Diff `v2.0.0_redesign..v2.1.0-beta.2` ([compare](https://github.com/Spegeli/hacs_bambuddy/compare/v2.0.0_redesign...v2.1.0-beta.2)): `models.py`, `fan.py`, `select.py`, `binary_sensor.py`, `light.py`, `switch.py`, `number.py`, `button.py`, `camera.py`, `entity.py` are **unchanged**. The release notes say "no entity ID changes".
- No renamed or removed entities; no new platform; device structure unchanged (hub -> printer -> AMS units).
- `sensor.py` only: the slot sensors (`slot_N` of every AMS unit, and `external_spool`, `external_spool_2` / `left_`/`right_external_spool`) gain attributes `inventory_spool` and `inventory_assignable` (BamBuddy's spool inventory, [H2:sensor.py#L528-L587](https://github.com/Spegeli/hacs_bambuddy/blob/v2.1.0-beta.2/custom_components/bambuddy/sensor.py#L528-L587)). They are excluded from the recorder and the sensors write state when the inventory changes (inventory polled every 60 s plus on websocket push).
- New actions `bambuddy.assign_spool`, `bambuddy.unassign_spool`, `bambuddy.get_spools` (services.py). Key permissions: optional `inventory:read`, `inventory:view_assignments`, `filaments:read`, `inventory:update` (**Manage Inventory**, [const.py](https://github.com/Spegeli/hacs_bambuddy/blob/v2.1.0-beta.2/custom_components/bambuddy/const.py)); a key without them still works.
- Card/frontend: new bambuddy-card spool dialog, label QR scan (option `assign_scanned_spool`); `filament_types.py`, `inventory.py` added. Irrelevant for the binding.
- BamBuddy side since 1.2.5.7 (the integration's minimum stays 1.2.5.7): daily 1.3.1b1 adds spool-label sheets, OctoEverywhere, Polish, archive redesign; model code tables identical to 1.2.5.7; A2L AMS Lite usage fixes; H2C stage 72/74 names fall back to `preparing`. Nothing changes the status schema that the binding uses, `/status` still carries `nozzle_rack[]` (H2C), `airduct_mode`, `supports_chamber_heater`, `left_aux_fan_speed`, `door_open`.
- Binding consequences: (1) keep binding by "entity exists" (section 8); (2) add H2C/H2S/H2D Pro/A2L to the model fallback table as in 9.2; (3) show a laser state from `select.*_airduct_mode == laser` and the three stage names; (4) the rack and the H3C cannot be bound to entities today, they would need new BamBuddy `/status` data read by the Fabricon proxy (`nozzle_rack[]` is already in the API for H2C).
