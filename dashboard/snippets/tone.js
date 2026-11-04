// State of a fan / heater as a tone ('on', 'warn' = heating or cooling down, 'off') and its colour.
const fabTone = {
  fan: (f) => f?.state === 'on' ? 'on' : 'off',
  heat: (sensor, target) => {
    const c = parseFloat(sensor?.state), t = parseFloat(target?.state) || 0;
    return t > 0 && Math.abs(c - t) > 3 ? 'warn' : t > 0 ? 'on' : 'off';
  },
  color: (k) => ({on: 'var(--fab-y)', warn: 'var(--fab-o)'})[k] || 'var(--fab-dim)',
};
