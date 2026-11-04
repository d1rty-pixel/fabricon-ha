// Dropdowns, one code path for the whole dashboard: every <select data-fab-select> (in this card or in a button-card,
// any shadow root). The closed select is styled where it sits; opening it:
//   touch devices (coarse pointer: phones, tablets, iOS / Android) keep the system picker,
//   with a mouse (fine pointer) a menu in the dashboard's look opens instead: one element in document.body, under
//   the select (above when there is no room), arrow keys / Enter / Escape, closed by a click outside, scroll or resize.
// The pick sets select.value and fires "change" like a native one, so the select's own handlers do the rest.
(function fabSelectInstall() {
  if (window.__fabSelect) return;
  window.__fabSelect = true;
  const fine = () => matchMedia("(pointer: fine)").matches;
  const style = document.createElement("style");
  style.textContent = `
.fab-menu { position: fixed; z-index: 10000; display: flex; flex-direction: column; min-width: 160px; max-height: min(360px, 60vh); overflow-y: auto;
  padding: 4px; box-sizing: border-box; background: #0e0e0f; box-shadow: inset 0 0 0 1px rgba(255,180,0,.55), 0 14px 40px rgba(0,0,0,.75);
  clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 8px 100%, 0 calc(100% - 8px)); }
.fab-menu::before { content: ""; position: sticky; top: -4px; display: block; height: 2px; margin: -4px -4px 4px; background: #FFB400; box-shadow: 0 0 6px #FFB400; }
.fab-menu button { all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 10px; padding: 8px 12px 7px; cursor: pointer;
  font: 13px Antonio, 'Bebas Neue', Oswald, 'Arial Narrow', sans-serif; letter-spacing: 2.5px; text-transform: uppercase; white-space: nowrap;
  color: #EDE6D6; }
.fab-menu button::before { content: ""; width: 6px; height: 6px; flex: none; background: transparent; box-shadow: inset 0 0 0 1px rgba(255,180,0,.35); }
.fab-menu button:hover, .fab-menu button:focus-visible { background: rgba(255,180,0,.12); outline: none; }
.fab-menu button.on { color: #FFB400; }
.fab-menu button.on::before { background: #FFB400; box-shadow: 0 0 6px #FFB400; }
.fab-menu button:disabled { color: #7d776b; cursor: default; }`;
  document.head.appendChild(style);

  let menu = null, sel = null;
  const close = () => { menu?.remove(); menu = sel = null; };
  const open = (s) => {
    close();
    sel = s;
    menu = document.createElement("div");
    menu.className = "fab-menu";
    for (const o of s.options) {
      const b = document.createElement("button");
      b.textContent = o.text;
      b.className = o.value === s.value ? "on" : "";
      b.disabled = o.disabled;
      b.addEventListener("click", () => {
        if (s.value !== o.value) { s.value = o.value; s.dispatchEvent(new Event("change", { bubbles: true, composed: true })); }
        close();
      });
      menu.appendChild(b);
    }
    document.body.appendChild(menu);
    // under the visible control: a select inside a label key (or laid invisibly over a block) uses that box
    const r = (s.closest("label") || s).getBoundingClientRect(), h = menu.offsetHeight;
    menu.style.minWidth = `${Math.max(160, r.width)}px`;
    menu.style.left = `${Math.max(8, Math.min(r.left, innerWidth - menu.offsetWidth - 8))}px`;
    menu.style.top = `${r.bottom + 4 + h > innerHeight - 8 && r.top - 4 - h > 8 ? r.top - 4 - h : r.bottom + 4}px`;
    (menu.querySelector("button.on") || menu.querySelector("button"))?.focus({ preventScroll: true });
  };
  const target = (ev) => {
    const t = ev.composedPath()[0];
    return t instanceof HTMLSelectElement && t.hasAttribute("data-fab-select") ? t : null;
  };
  window.addEventListener("mousedown", (ev) => {
    if (menu && ev.composedPath().includes(menu)) return;
    const s = target(ev);
    if (s && fine() && !s.disabled) {
      ev.preventDefault();
      ev.stopPropagation();
      if (sel === s) close(); else open(s);
      return;
    }
    close();
  }, true);
  window.addEventListener("keydown", (ev) => {
    if (menu) {
      const bs = [...menu.querySelectorAll("button:not(:disabled)")], i = bs.indexOf(menu.querySelector("button:focus"));
      if (ev.key === "Escape") { close(); ev.preventDefault(); }
      else if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        bs[(i + (ev.key === "ArrowDown" ? 1 : -1) + bs.length) % bs.length]?.focus();
        ev.preventDefault();
      }
      return;
    }
    const s = target(ev);
    if (s && fine() && [" ", "Enter", "ArrowDown"].includes(ev.key)) { ev.preventDefault(); open(s); }
  }, true);
  for (const ev of ["resize", "blur"]) window.addEventListener(ev, close);
  window.addEventListener("scroll", (ev) => { if (menu && !ev.composedPath().includes(menu)) close(); }, true);
})();
