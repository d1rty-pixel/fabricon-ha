function parseStl(buf) {
  const dv = new DataView(buf);
  const n = buf.byteLength >= 84 ? dv.getUint32(80, true) : 0;
  if (buf.byteLength === 84 + n * 50) {
    const pos = new Float32Array(n * 9);
    for (let i = 0; i < n; i++) for (let j = 0; j < 9; j++) pos[i * 9 + j] = dv.getFloat32(84 + i * 50 + 12 + j * 4, true);
    return pos;
  }
  const out = [], re = /vertex\s+(\S+)\s+(\S+)\s+(\S+)/g, txt = new TextDecoder().decode(buf);
  let m;
  while ((m = re.exec(txt))) out.push(+m[1], +m[2], +m[3]);
  return new Float32Array(out);
}

// the text of every zip entry whose name matches re (3MF is a zip)
async function zipTexts(buf, re) {
  const dv = new DataView(buf), u8 = new Uint8Array(buf), out = [];
  let eocd = -1;
  for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error("not a zip / 3MF file");
  let p = dv.getUint32(eocd + 16, true);
  const count = dv.getUint16(eocd + 10, true);
  for (let k = 0; k < count; k++) {
    const method = dv.getUint16(p + 10, true), size = dv.getUint32(p + 20, true);
    const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nl));
    p += 46 + nl + xl + cl;
    if (!re.test(name)) continue;
    const start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true);
    const data = u8.subarray(start, start + size);
    out.push(method === 0 ? new TextDecoder().decode(data)
      : await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text());
  }
  return out;
}

// triangles of every mesh in a 3MF project (Bambu Studio keeps each object in 3D/Objects/*.model);
// placement transforms are not applied, so a multi-object project shows its parts on top of each other
function mesh3mf(models) {
  const out = [];
  for (const xml of models) {
    for (const m of xml.matchAll(/<mesh>([\s\S]*?)<\/mesh>/g)) {
      const v = [];
      for (const a of m[1].matchAll(/<vertex\s+x="([^"]+)"\s+y="([^"]+)"\s+z="([^"]+)"/g)) v.push(+a[1], +a[2], +a[3]);
      for (const t of m[1].matchAll(/<triangle\s+v1="(\d+)"\s+v2="(\d+)"\s+v3="(\d+)"/g))
        for (const q of [t[1], t[2], t[3]]) out.push(v[q * 3], v[q * 3 + 1], v[q * 3 + 2]);
    }
  }
  return new Float32Array(out);
}

// G-code -> move list (end points, feed in mm/min, extruding flag, tool), layer and progress marks
function parseGcode(text) {
  let cap = 1 << 16, n = 0;
  let X = new Float32Array(cap), Y = new Float32Array(cap), Z = new Float32Array(cap), F = new Float32Array(cap);
  let E = new Uint8Array(cap), TL = new Uint8Array(cap);
  const grow = () => {
    cap *= 2;
    const g = (a, C) => { const b = new C(cap); b.set(a); return b; };
    X = g(X, Float32Array); Y = g(Y, Float32Array); Z = g(Z, Float32Array); F = g(F, Float32Array); E = g(E, Uint8Array); TL = g(TL, Uint8Array);
  };
  const push = (x, y, z, f, e, t) => { if (n === cap) grow(); X[n] = x; Y[n] = y; Z[n] = z; F[n] = f; E[n] = e; TL[n] = t; n++; };
  let x = 0, y = 0, z = 0, e = 0, f = 3000, absPos = true, absE = false, tool = 0, colours = [];
  const layers = [], changes = [], prog = new Int32Array(101).fill(-1);
  for (let i = 0, L = text.length; i < L;) {
    let j = text.indexOf("\n", i);
    if (j < 0) j = L;
    let line = text.slice(i, j);
    i = j + 1;
    if (line.charCodeAt(0) === 59) {
      if (line.startsWith("; CHANGE_LAYER")) changes.push(n);
      else if (!colours.length && line.startsWith("; filament_colour =")) colours = line.split("=")[1].trim().split(";").map((c) => c.trim());
      continue;
    }
    const sc = line.indexOf(";");
    if (sc >= 0) line = line.slice(0, sc);
    line = line.trim();
    if (!line) continue;
    const parts = line.split(/\s+/), cmd = parts[0].toUpperCase();
    const val = (k) => { for (let q = 1; q < parts.length; q++) if (parts[q][0].toUpperCase() === k) return parseFloat(parts[q].slice(1)); return undefined; };
    if (cmd === "G0" || cmd === "G1" || cmd === "G2" || cmd === "G3") {
      const nx = val("X"), ny = val("Y"), nz = val("Z"), ne = val("E"), nf = val("F");
      if (nf !== undefined) f = nf;
      const tx = nx === undefined ? x : absPos ? nx : x + nx, ty = ny === undefined ? y : absPos ? ny : y + ny, tz = nz === undefined ? z : absPos ? nz : z + nz;
      let de = 0;
      if (ne !== undefined) { de = absE ? ne - e : ne; e = absE ? ne : e + ne; }
      const ext = de > 0 && (tx !== x || ty !== y) ? 1 : 0;
      if (cmd !== "G0" && cmd !== "G1") {
        const I = val("I") || 0, J = val("J") || 0, cx = x + I, cy = y + J, r = Math.hypot(I, J);
        const a0 = Math.atan2(y - cy, x - cx);
        let a1 = Math.atan2(ty - cy, tx - cx);
        if (cmd === "G2" && a1 >= a0) a1 -= 2 * Math.PI;
        if (cmd === "G3" && a1 <= a0) a1 += 2 * Math.PI;
        const segs = Math.max(2, Math.ceil(Math.abs(a1 - a0) * r / 1.5));
        for (let k = 1; k <= segs; k++) {
          const a = a0 + (a1 - a0) * k / segs, last = k === segs;
          push(last ? tx : cx + r * Math.cos(a), last ? ty : cy + r * Math.sin(a), z + (tz - z) * k / segs, f, ext, tool);
        }
      } else if (tx !== x || ty !== y || tz !== z) push(tx, ty, tz, f, ext, tool);
      x = tx; y = ty; z = tz;
    } else if (cmd === "G90") absPos = true;
    else if (cmd === "G91") absPos = false;
    else if (cmd === "M82") absE = true;
    else if (cmd === "M83") absE = false;
    else if (cmd === "G92") { const ne = val("E"); if (ne !== undefined) e = ne; }
    else if (cmd === "M73") {
      const l = val("L"), p = val("P");
      if (l !== undefined && layers[l] === undefined) layers[l] = n;
      if (p !== undefined && p >= 0 && p <= 100 && prog[p | 0] < 0) prog[p | 0] = n;
    } else if (cmd[0] === "T") { const t = parseInt(cmd.slice(1), 10); if (t >= 0 && t < 64) tool = t; }
  }
  // layer starts: M73 L marks (Bambu Studio), else "; CHANGE_LAYER" comments, numbered from 1
  let starts = [];
  if (layers.length) { for (let l = 1; l < layers.length; l++) if (layers[l] !== undefined) starts[l] = layers[l]; }
  else changes.forEach((m, k) => { starts[k + 1] = m; });
  return { n, X, Y, Z, F, E, T: TL, starts, layerCount: starts.length - 1, prog, colours };
}

// browser-local storage for the uploaded job file
// IndexedDB "fabricon" (store "files"): the picked job file per printer.
function idbOpen(name) {
  return new Promise((resolve, reject) => {
    const o = indexedDB.open(name, 1);
    o.onupgradeneeded = () => o.result.createObjectStore("files");
    o.onerror = () => reject(o.error);
    o.onsuccess = () => resolve(o.result);
  });
}

async function idb(mode, fn) {
  const db = await idbOpen("fabricon");
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", mode), req = fn(tx.objectStore("files"));
    tx.oncomplete = () => { db.close(); resolve(req?.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
