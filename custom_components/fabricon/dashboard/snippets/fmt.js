// English state text (hass.formatEntityState follows the HA user language). One rule everywhere: a value nobody
// knows (entity missing, unavailable, unknown -- e.g. the printer is off) reads "—", whatever its type; OFF / 0 /
// CLOSED only when the device reports it.
const fmt = (x) => {
  if (!x || ['unavailable', 'unknown', ''].includes(x.state)) return '—';
  const st = x.state, at = x.attributes;
  if (x.entity_id.startsWith('binary_sensor.')) {
    const m = {connectivity: ['ONLINE', 'OFFLINE'], door: ['OPEN', 'CLOSED'], plug: ['PLUGGED IN', 'NONE'],
               problem: ['PROBLEM', 'OK'], running: ['RUNNING', 'IDLE']}[at.device_class] || ['ON', 'OFF'];
    return st === 'on' ? m[0] : m[1];
  }
  if (x.entity_id.startsWith('update.')) return at.installed_version || st;
  const n = Number(st);
  if (!isNaN(n)) return n.toLocaleString('en-US', {maximumFractionDigits: 1}) + (at.unit_of_measurement ? ' ' + at.unit_of_measurement : '');
  return st.replace(/_/g, ' ').toUpperCase();
};
