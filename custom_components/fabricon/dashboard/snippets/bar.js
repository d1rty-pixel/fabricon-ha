// Segmented LED bar; mark = position of a target tick in %
const bar = (p, col, mark, h) => {
  p = Math.max(0, Math.min(100, p || 0)); h = h || 12;
  return `<div style="position:relative;height:${h}px;background:#070707;box-shadow:inset 0 0 0 1px rgba(255,180,0,.16)">
    <div style="position:absolute;left:2px;top:2px;bottom:2px;width:max(0px,calc(${p}% - 4px));background:${col};box-shadow:0 0 10px ${col}"></div>
    <div style="position:absolute;inset:0;background:repeating-linear-gradient(90deg,transparent 0 8px,#070707 8px 10px)"></div>
    ${mark != null ? `<div style="position:absolute;top:-4px;bottom:-4px;left:calc(${Math.max(0, Math.min(100, mark))}% - 1px);width:2px;background:var(--fab-txt);box-shadow:0 0 6px var(--fab-txt)"></div>` : ''}
  </div>`;
};
