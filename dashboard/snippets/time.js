// Minutes as h:mm
const hm = (m) => { m = Math.max(0, parseInt(m) || 0); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };
