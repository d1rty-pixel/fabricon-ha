// Machine controls (heaters, fans, air duct, nozzle, motion) are read-only while a job runs or the printer is offline
// or not known at all (no status from HA).
const fabLocked = () => ['printing', 'paused', 'preparing', 'offline', 'unknown', 'unavailable'].includes(states['sensor.$P_print_status']?.state ?? 'unknown');
