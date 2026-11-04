const CSS = `
:host { display: block; height: 100%; }
.card { display: flex; flex-direction: column; gap: 8px; height: 100%; min-height: 520px;
  --railw: 168px; --sidew: clamp(330px, 36vw, 440px); --dockw: clamp(320px, 25vw, 400px); }
.card.compact { --railw: 36px; }
.main { flex: 1; display: flex; min-height: 0; box-shadow: inset 0 0 0 1px rgba(255,180,0,.14); }
/* print dock: left of the model on wide cards, under it when stacked; collapses with the same easing as the sidebar
   (width beside the model, height under it); its content keeps its width and fades, so nothing reflows on the way */
.dock { order: 0; flex: none; width: var(--dockw); min-height: 0; overflow: hidden; background: #0e0e0f; box-shadow: inset -1px 0 0 rgba(255,180,0,.3);
  transition: width .28s ease, flex-grow .28s ease, flex-basis .28s ease; }
.dock-in { width: var(--dockw); height: 100%; overflow-y: auto; box-sizing: border-box; padding: 0 10px 12px; }
.dock .files { transition: opacity .2s ease .1s; }
.wrap { order: 1; }
.side { order: 2; }
.dhead { cursor: pointer; }
.dtoggle { display: flex; align-items: center; padding: 1px 4px !important; }
.dtoggle ha-icon { --mdc-icon-size: 18px; transition: transform .28s ease; }
.dockshut .dock { width: 40px; }
.dockshut .dock .files { opacity: 0; visibility: hidden; transition: opacity .12s ease, visibility 0s .28s; }
.dockshut .dock-in { overflow: hidden; padding: 0 4px; }
.dockshut .dhead { width: 32px; flex-direction: column-reverse; justify-content: flex-end; gap: 10px; height: 100%; box-sizing: border-box; }
.dockshut .dhead span { writing-mode: vertical-rl; transform: rotate(180deg); clip-path: none; padding: 12px 4px; }
.dockshut .dtoggle ha-icon { transform: rotate(180deg); }
.stack .main { flex-direction: column; }
.stack .side { position: absolute; right: 0; top: 0; bottom: 0; z-index: 5; }
/* stacked: the dock has a height (animated), the model takes the rest */
.stack .wrap { flex: 1 1 0; height: auto; min-height: 0; }
.stack .dock { order: 2; flex: none; width: auto; height: 52%; transition: height .28s ease; box-shadow: inset 0 1px 0 rgba(255,180,0,.3); }
.tiny .dock { height: calc(100% - clamp(200px, 30vh, 280px)); }
.stack .dock-in { width: auto; }
.stack .dtoggle ha-icon { transform: rotate(-90deg); }
.stack.dockshut .dock { height: 46px; }
.stack.dockshut .dock-in { padding: 0 10px; }
.stack.dockshut .dhead { width: auto; flex-direction: row; justify-content: space-between; height: auto; }
.stack.dockshut .dhead span { writing-mode: horizontal-tb; transform: none; padding: 3px 16px 3px 10px;
  clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%); }
.stack.dockshut .dtoggle ha-icon { transform: rotate(90deg); }
/* phones: a small model in a fixed view (no orbit, swipes scroll), only camera / x-ray / light, module keys in a row */
.tiny .wrap { touch-action: pan-y; }
.tiny .tools { right: 8px; top: 8px; left: 8px; }
.tiny .tools > :not([data-k="camera"]):not([data-k="xray"]):not([data-k="light"]) { display: none; }
.tiny .hud { display: block; top: 46px; bottom: auto; left: 10px; right: 10px; font-size: 9px; letter-spacing: 1px; }
.tiny .rail { top: auto; bottom: 8px; left: 8px; right: 8px; flex-direction: row; max-height: none; overflow-x: auto; }
.side { width: 0; overflow: hidden; transition: width .28s ease; background: #0e0e0f; box-shadow: inset 1px 0 0 rgba(255,180,0,.3); }
.side.open { width: var(--sidew); }
.side-in { width: var(--sidew); height: 100%; overflow-y: auto; box-sizing: border-box; padding: 0 10px 12px; }
.side-head { position: sticky; top: 0; z-index: 2; display: flex; justify-content: space-between; align-items: center; padding: 8px 0;
  background: #0e0e0f; }
.side-head span { background: var(--fab-y, #FFB400); color: #0b0b0b; font: 700 12px var(--fab-font, sans-serif); letter-spacing: 2.5px;
  text-transform: uppercase; padding: 3px 16px 3px 10px; clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%); }
.side-head button { background: none; border: 1px solid rgba(255,180,0,.4); color: var(--fab-y, #FFB400); font: 12px var(--fab-mono, monospace);
  padding: 2px 8px; cursor: pointer; }
.side-sec { display: flex; flex-direction: column; gap: 8px; }
.amspick { align-self: flex-start; }
/* small key: the big keys' look (dark gradient, yellow top line, chamfered corner with a yellow tip) at toolbar size */
.fab-key { position: relative; display: inline-flex; align-items: center; gap: 8px; box-sizing: border-box; height: 28px; padding: 3px 14px 1px 11px;
  border: none; cursor: pointer; font: 11.5px var(--fab-font, sans-serif); letter-spacing: 2.5px; text-transform: uppercase; white-space: nowrap;
  color: var(--fab-txt, #ede6d6); background: linear-gradient(180deg, #232325, #121213);
  box-shadow: inset 0 0 0 1px rgba(255,180,0,.16), 0 4px 12px rgba(0,0,0,.5);
  clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 6px 100%, 0 calc(100% - 6px)); }
.fab-key::before { content: ''; position: absolute; left: 0; top: 0; right: 8px; height: 2px; background: var(--fab-y, #FFB400); box-shadow: 0 0 6px var(--fab-y, #FFB400); }
.fab-key::after { content: ''; position: absolute; top: 0; right: 0; width: 10px; height: 10px; background: var(--fab-y, #FFB400); clip-path: polygon(0 0, 3px 0, 100% 7px, 100% 100%); }
.fab-key:hover { box-shadow: inset 0 0 0 1px var(--fab-y, #FFB400), 0 4px 12px rgba(0,0,0,.5); }
.fab-key.on { background: var(--fab-y, #FFB400); color: #0b0b0b; }
.fab-key.on::before { background: #0b0b0b; box-shadow: none; }
.fab-key ha-icon { --mdc-icon-size: 15px; color: var(--fab-y, #FFB400); }
.fab-key.on ha-icon { color: #0b0b0b; }
.fab-key select { all: unset; cursor: pointer; font: inherit; letter-spacing: inherit; text-transform: uppercase; color: inherit; padding-right: 2px; }
.fab-key select option { background: #121213; color: var(--fab-txt, #ede6d6); }
/* camera overlay over the model */
.cam { position: absolute; top: 52px; left: 12px; right: calc(var(--railw) + 28px); bottom: 44px; z-index: 4; display: none; flex-direction: column;
  background: #060606; box-shadow: inset 0 0 0 1px rgba(255,180,0,.45), 0 12px 40px rgba(0,0,0,.7); }
.cam.open { display: flex; }
.cam:fullscreen { top: 0; left: 0; right: 0; bottom: 0; }
.cam-head { display: flex; align-items: center; gap: 6px; padding: 8px 10px; }
.cam-head span { flex: 1; }
.cam-head span b { background: var(--fab-y, #FFB400); color: #0b0b0b; font: 700 12px var(--fab-font, sans-serif); letter-spacing: 2.5px;
  text-transform: uppercase; padding: 3px 16px 3px 10px; clip-path: polygon(0 0, 100% 0, calc(100% - 8px) 100%, 0 100%); }
.cam-body { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; padding: 0 10px 10px; }
.cam-frame { width: 100%; }
/* view tools across the top left, module keys down the right edge */
.tools { position: absolute; top: 12px; left: 12px; right: calc(var(--railw) + 24px); z-index: 3; display: flex; gap: 6px; flex-wrap: wrap; }
.rail { position: absolute; top: 12px; right: 12px; z-index: 3; display: flex; flex-direction: column; gap: 6px; max-height: calc(100% - 24px);
  overflow-y: auto; scrollbar-width: none; }
.rail .fab-key { width: var(--railw); flex: none; }
.rail .fab-key.gap { margin-top: 10px; }
.tiny .rail .fab-key.gap { margin: 0 0 0 10px; }
/* compact: icon keys (the name stays as the tooltip) */
.compact .rail .fab-key, .compact .tools button.fab-key { width: 36px; height: 32px; padding: 2px 0 0; justify-content: center; gap: 0; font-size: 0; letter-spacing: 0; }
.compact .rail .fab-key ha-icon, .compact .tools .fab-key ha-icon { --mdc-icon-size: 17px; }
.compact .tools label.fab-key { height: 32px; padding: 3px 12px 1px 9px; }
.tiny .cam { top: 8px; left: 8px; right: 8px; bottom: 8px; }
.tiny .cam-head .fab-key { width: 36px; height: 32px; padding: 2px 0 0; justify-content: center; gap: 0; font-size: 0; letter-spacing: 0; }
.tiny .cam-head .fab-key ha-icon { --mdc-icon-size: 17px; }
.tiny .lab { font-size: 9.5px; }
.foot { display: grid; gap: 8px; }
.foot > * { min-width: 0; }
.files { display: flex; flex-direction: column; gap: 10px; font: 11px/1.5 var(--fab-mono, monospace); color: var(--fab-dim, #7d776b); letter-spacing: 1px; }
.files .act { font: 13px var(--fab-font, sans-serif); letter-spacing: 2.5px; text-transform: uppercase; color: var(--fab-y, #FFB400); background: #0b0b0b;
  border: 1px solid rgba(255,180,0,.45); padding: 8px; cursor: pointer; text-align: center; text-decoration: none; }
.warn { color: var(--fab-o, #FF6A00) !important; }
/* print dock: USB stick list, job, mapping, options; START key in the control strip, its confirm dialog */
.phead { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px; padding-bottom: 3px;
  border-bottom: 1px solid rgba(255,180,0,.25); font: 11px var(--fab-font, sans-serif); letter-spacing: 2.5px; color: var(--fab-y, #FFB400); }
.files .phead .act { padding: 1px 9px; font-size: 13px; letter-spacing: 0; }
.plist { display: flex; flex-direction: column; gap: 6px; }
.pf { all: unset; box-sizing: border-box; display: flex; text-align: left; gap: 10px; align-items: center; padding: 6px; cursor: pointer;
  background: rgba(0,0,0,.45); box-shadow: inset 3px 0 0 rgba(255,180,0,.15); color: var(--fab-txt, #ede6d6); }
.pf:hover { box-shadow: inset 3px 0 0 rgba(255,180,0,.6); }
.pf.on { box-shadow: inset 3px 0 0 var(--fab-y, #FFB400), inset 0 0 0 1px rgba(255,180,0,.4); }
.pf.dir .th { height: 28px; }
.th { width: 56px; height: 56px; flex: none; display: flex; align-items: center; justify-content: center; background: #0b0b0b; color: var(--fab-dim, #7d776b); }
.th img { max-width: 100%; max-height: 100%; }
.pcard .th { width: 92px; height: 92px; }
.pf b, .pcard b { display: block; font-weight: 400; color: var(--fab-txt, #ede6d6); word-break: break-word; }
.pf small, .pcard small { display: block; color: var(--fab-dim, #7d776b); font-size: 10px; }
.fdot { display: inline-block; width: 9px; height: 9px; margin: 0 4px 0 0; border-radius: 50%; vertical-align: -1px; background: var(--c); box-shadow: 0 0 0 1px rgba(255,255,255,.3); }
.pjob { display: flex; flex-direction: column; gap: 8px; }
.pjob:empty { display: none; }
.pcard { display: flex; gap: 10px; text-align: left; padding: 8px; background: rgba(0,0,0,.45); box-shadow: inset 3px 0 0 var(--fab-y, #FFB400); }
.pmap { text-align: left; display: grid; grid-template-columns: 1fr auto; gap: 4px 8px; align-items: center; padding: 6px 8px; background: rgba(0,0,0,.35); color: var(--fab-txt, #ede6d6); }
/* a select in a key (.fab-key label): the key's look, a chevron after the value; the open list is 05-select's menu */
.fab-key select { padding-right: 18px; text-overflow: ellipsis; overflow: hidden; max-width: 100%;
  background: no-repeat right center / 12px url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23FFB400' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E"); }
.fab-sel { max-width: 190px; letter-spacing: 1.5px; padding-right: 12px; }
.pmap em { grid-column: 1 / -1; font-style: normal; font-size: 10px; color: var(--fab-dim, #7d776b); }
.pmap em.ok { color: #5fd17a; }
.popts { display: flex; flex-wrap: wrap; gap: 6px; }
.popts button { all: unset; cursor: pointer; padding: 5px 8px; font: 10.5px var(--fab-mono, monospace); letter-spacing: 1px; color: var(--fab-txt, #ede6d6);
  background: #0b0b0b; border: 1px solid rgba(255,180,0,.35); }
.files .act:disabled { opacity: .45; cursor: not-allowed; }
.pstat:empty { display: none; }
.pstat { color: var(--fab-txt, #ede6d6); }
.startkey { all: unset; box-sizing: border-box; position: relative; height: 76px; min-width: 0; display: flex; align-items: center; justify-content: center;
  gap: 14px; padding: 0 16px; cursor: pointer; color: #0b0b0b; background: linear-gradient(180deg, #ffc53a, #e09a00);
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.4), 0 6px 18px rgba(255,180,0,.25);
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 10px 100%, 0 calc(100% - 10px)); }
.startkey ha-icon { --mdc-icon-size: 34px; flex: none; }
.startkey span { min-width: 0; text-align: left; }
.startkey b { display: block; font: 22px var(--fab-font, sans-serif); letter-spacing: 4px; line-height: 1.05; white-space: nowrap; }
.stack .startkey { gap: 10px; padding: 0 10px; }
.stack .startkey b { font-size: 18px; letter-spacing: 2.5px; }
.stack .startkey ha-icon { --mdc-icon-size: 26px; }
.startkey small { display: block; font: 10px var(--fab-mono, monospace); letter-spacing: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.startkey:hover:not(:disabled) { filter: brightness(1.08); }
.startkey:disabled { cursor: default; color: var(--fab-dim, #7d776b); background: linear-gradient(180deg, #1d1d1f, #111112);
  box-shadow: inset 0 0 0 1px rgba(255,180,0,.16); }
.startkey:disabled ha-icon { color: #3a3a3a; }
.modal { position: absolute; inset: 0; z-index: 20; display: flex; align-items: center; justify-content: center; padding: 16px;
  background: rgba(0,0,0,.72); }
.mbox { width: min(460px, 100%); max-height: 100%; overflow-y: auto; box-sizing: border-box; padding: 0 14px 14px; background: #0e0e0f;
  box-shadow: inset 0 0 0 1px rgba(255,180,0,.45), 0 16px 50px rgba(0,0,0,.8);
  display: flex; flex-direction: column; gap: 10px; font: 11px/1.5 var(--fab-mono, monospace); letter-spacing: 1px; color: var(--fab-dim, #7d776b); }
.mq { font: 20px var(--fab-font, sans-serif); letter-spacing: 3px; color: var(--fab-txt, #ede6d6); margin-top: 4px; }
.mbtns { display: grid; grid-template-columns: 1fr 1.6fr; gap: 8px; }
.mbtns .act { font: 13px var(--fab-font, sans-serif); letter-spacing: 2.5px; text-transform: uppercase; color: var(--fab-y, #FFB400); background: #0b0b0b;
  border: 1px solid rgba(255,180,0,.45); padding: 12px 8px; cursor: pointer; }
.mbtns .myes { background: var(--fab-y, #FFB400); color: #0b0b0b; }
.main { position: relative; }
/* small screens: the panel slides over the model instead of beside it */
.tiny .side.open, .narrow .side.open { position: absolute; right: 0; top: 0; bottom: 0; z-index: 5; width: min(100%, 440px);
  box-shadow: inset 1px 0 0 rgba(255,180,0,.3), -12px 0 30px rgba(0,0,0,.6); }
.tiny .side-in, .narrow .side-in { width: min(100%, 440px); }
.tiny .side.open, .tiny .side-in { width: 100%; }
.wrap { position: relative; flex: 1; min-width: 0; height: 100%; min-height: 420px; overflow: hidden; touch-action: none;
  background: radial-gradient(ellipse at 50% 35%, #232017 0%, #0d0d0d 62%, #080808 100%); }
canvas { display: block; width: 100% !important; height: 100% !important; outline: none; }
.labels { position: absolute; inset: 0; pointer-events: none; }
.lab { position: absolute; left: 0; top: 0; transform-origin: 0 0; white-space: nowrap; pointer-events: auto; cursor: pointer;
  font: 10.5px/1.25 var(--fab-mono, monospace); letter-spacing: 1px; color: var(--fab-txt, #ede6d6); }
.lab .box { position: absolute; left: -1px; bottom: calc(12px + var(--dy, 0px)); background: rgba(8,8,8,.82); padding: 3px 7px 3px 6px;
  border-left: 3px solid var(--c, #FFB400); box-shadow: 0 0 0 1px rgba(255,180,0,.14); }
.lab .box b { display: block; font-weight: 400; color: var(--fab-dim, #7d776b); font-size: 9px; letter-spacing: 1.5px; }
.lab .dot { position: absolute; left: -4px; top: -4px; width: 8px; height: 8px; border-radius: 50%; background: var(--c, #FFB400);
  box-shadow: 0 0 8px var(--c, #FFB400); }
.lab .stem { position: absolute; left: 0; bottom: 0; width: 0; height: calc(12px + var(--dy, 0px)); border-left: 1px solid var(--c, #FFB400); opacity: .7; }
.lab.hot .dot { animation: blink 1.2s infinite; }
.lab .box > i { display: block; text-align: left; font-style: normal; color: var(--fab-y, #FFB400); font-size: 9px; letter-spacing: 2px; margin-bottom: 2px; }
.lab .row { display: grid; grid-template-columns: 6px auto 1fr; column-gap: 6px; align-items: center; }
.lab .row b { display: inline; font-size: 9px; }
.lab .row span { text-align: right; padding-left: 8px; }
.lab .row::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: var(--rc, #7d776b); }
.lab .row.hot::before { animation: blink 1.2s infinite; }
.lab .row:hover b { color: var(--fab-txt, #ede6d6); }
@keyframes blink { 50% { opacity: .25; } }
.hud { position: absolute; left: 12px; bottom: 10px; text-align: left; font: 10.5px/1.5 var(--fab-mono, monospace); letter-spacing: 1.5px;
  color: var(--fab-dim, #7d776b); pointer-events: none; text-transform: uppercase; }
.hud span { color: var(--fab-txt, #ede6d6); }
/* printer offline: a hazard-striped frame runs round the model, the notice blinks in the middle */
.offline { position: absolute; inset: 0; z-index: 2; display: none; pointer-events: none; }
.wrap.isoff .offline { display: block; }
.off-frame { position: absolute; inset: 0; padding: 10px; box-sizing: border-box;
  background: repeating-linear-gradient(-45deg, #FFB400 0 14px, #0b0b0b 14px 28px) 0 0 / 39.598px 39.598px;
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); animation: hazard 1.4s linear infinite; }
@keyframes hazard { to { background-position: 39.598px 0; } }
.off-msg { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); padding: 6px 22px 4px; white-space: nowrap;
  font: clamp(30px, 5.5vw, 76px) var(--fab-font, sans-serif); letter-spacing: .14em; text-transform: uppercase; color: #FF2E2E;
  background: rgba(8,8,8,.6); text-shadow: 0 0 22px rgba(255,46,46,.75); animation: blink 1.1s steps(1) infinite; }
/* loading: the model area dims, a scan line sweeps down, LOADING MODEL with what is loading and a running bar.
   Only transform / opacity animate, so it keeps moving while a big G-code is parsed */
.ld { position: absolute; inset: 0; z-index: 4; display: flex; align-items: center; justify-content: center; overflow: hidden; pointer-events: none;
  background: rgba(8,8,8,.62); opacity: 0; visibility: hidden; transition: opacity .25s ease, visibility 0s .25s; }
.wrap.busy .ld { opacity: 1; visibility: visible; transition: opacity .2s ease; }
.ld-scan { position: absolute; left: 0; right: 0; top: 0; height: 34%; transform: translateY(-100%); will-change: transform;
  background: linear-gradient(rgba(255,180,0,0), rgba(255,180,0,.08) 70%, rgba(255,180,0,.45)); box-shadow: 0 1px 0 #FFB400, 0 0 18px rgba(255,180,0,.6);
  animation: ld-scan 1.8s cubic-bezier(.45,0,.55,1) infinite; }
@keyframes ld-scan { to { transform: translateY(300%); } }
.ld-box { position: relative; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 26px 16px; background: rgba(8,8,8,.75);
  box-shadow: inset 0 0 0 1px rgba(255,180,0,.4); }
.ld-box b { font: 22px var(--fab-font, sans-serif); letter-spacing: 6px; text-transform: uppercase; color: var(--fab-y, #FFB400); font-weight: 400; }
.ld-box small { max-width: 60vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 10px var(--fab-mono, monospace); letter-spacing: 1.5px;
  text-transform: uppercase; color: var(--fab-dim, #7d776b); }
.ld-bar { position: relative; display: block; width: 200px; height: 3px; overflow: hidden; background: #1d1d1e; }
.ld-bar::after { content: ""; position: absolute; inset: 0; width: 35%; background: var(--fab-y, #FFB400); box-shadow: 0 0 8px #FFB400;
  transform: translateX(-100%); animation: ld-bar 1.1s ease-in-out infinite; }
@keyframes ld-bar { to { transform: translateX(290%); } }
`;
