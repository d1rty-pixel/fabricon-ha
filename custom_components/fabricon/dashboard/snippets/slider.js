// Range slider that calls a service on release (needs locked.js). The knob shows what was asked for: a value just
// sent is held until the entity reports it (or 60 s pass), and while a finger is on the knob the card keeps its HTML
// so a state update cannot snap it back. o.actual draws the measured value as a dim second bar under the set bar.
// Inline handlers run outside button-card, so they reach hass through <home-assistant>; stopPropagation keeps
// drags from firing the card's tap / hold actions.
const slider = (o) => {
  const reg = window.__fabSl = window.__fabSl || {}, mem = reg[o.id] = reg[o.id] || {};
  if (mem.drag && Date.now() - mem.drag < 20000 && mem.html) return mem.html;
  mem.drag = 0;
  if (mem.set != null && (Math.abs(o.value - mem.set) < (o.step || 1) / 2 || Date.now() - mem.at > 60000)) mem.set = null;
  const v = mem.set != null ? mem.set : o.value;
  const off = o.disabled || (o.lock !== false && fabLocked());
  const span = (o.max - o.min) || 1, pc = (x) => Math.max(0, Math.min(100, (x - o.min) / span * 100));
  const act = o.actual != null && !isNaN(o.actual) ? `--a:${pc(o.actual)}%;` : '';
  const txt = (x) => o.na ? '—' : Number(x) === 0 && o.off ? o.off : x + o.unit;
  const m = `window.__fabSl['${o.id}']`;
  const show = `const r=this.parentNode;r.style.setProperty('--p',(this.value-${o.min})/${span}*100+'%');`
             + `r.querySelector('.fab-sv').textContent=Number(this.value)===0&&'${o.off || ''}'?'${o.off || ''}':this.value+'${o.unit}'`;
  const down = `event.stopPropagation();${m}.drag=Date.now()`;
  const up = `event.stopPropagation();const s=${m};setTimeout(()=>{s.drag=0},400)`;
  const send = `const s=${m};s.set=Number(this.value);s.at=Date.now();s.drag=0;`
             + `document.querySelector('home-assistant').hass.callService('${o.domain}','${o.service}',{entity_id:'${o.id}',${o.key}:Number(this.value)})`;
  const ticks = (o.ticks || [0, .25, .5, .75, 1].map(f => span >= 50 ? Math.round((o.min + f * span) / 5) * 5 : Math.round(o.min + f * span))).map(t => `<span>${t}</span>`).join('');
  return mem.html = `<div class="fab-sl${off ? ' off' : ''}" style="--p:${pc(v)}%;${act}">
    <div class="fab-sh"><span>${o.label}${o.actualText ? ` <span class="fab-sa">· ${o.actualText}</span>` : ''}</span><span class="fab-sv">${txt(v)}</span></div>
    <input type="range" min="${o.min}" max="${o.max}" step="${o.step}" value="${v}" ${off ? 'disabled' : ''}
      oninput="${show}" onchange="${send}" onpointerdown="${down}" onpointerup="${up}" onpointercancel="${up}" onmousedown="${down}" onmouseup="${up}"
      ontouchstart="${down}" ontouchend="${up}" onclick="event.stopPropagation()">
    <div class="fab-st">${ticks}</div></div>`;
};
