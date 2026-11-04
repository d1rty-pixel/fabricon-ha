// Print status of the printer: ps (entity), s (state), active (a job is running), scol (its colour).
const ps = states['sensor.$P_print_status'];
const s = ps ? ps.state : 'unknown';
const active = ['printing', 'paused', 'preparing'].includes(s);
const scol = {printing: 'var(--fab-y)', finished: 'var(--fab-y)', preparing: 'var(--fab-o)', slicing: 'var(--fab-o)',
              paused: 'var(--fab-o)', failed: 'var(--fab-r)', offline: 'var(--fab-r)'}[s] || 'var(--fab-dim)';
