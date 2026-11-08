// HMS messages, each with the answers the printer offers for it now (bambuddy.answer_hms). Inline handlers
// reach hass through <home-assistant>; stopping / aborting asks first. fabHmsOpen() drops what is settled:
// the printer keeps a notice in its list for the rest of the job even after it was answered at the screen,
// so a notice without answers counts only while the job is paused or failed. fabHmsAlarm() (the alarm under the
// header) keeps only what needs someone now: answers offered, a paused / failed job, or a serious / fatal message;
// an error without answers while the printer carries on (an AMS slot whose tag can't be read) stays in the HMS
// panel only. $DEV = the printer's device id.
const fabHmsOpen = () => {
  const ps = states['sensor.$P_print_status']?.state, errs = states['sensor.$P_hms_errors']?.attributes.errors || [];
  return errs.filter((x) => (x.actions || []).length || !['notice', 'info', ''].includes(x.severity || '') || ['paused', 'failed'].includes(ps));
};
const fabHmsAlarm = () => {
  const ps = states['sensor.$P_print_status']?.state;
  return fabHmsOpen().filter((x) => (x.actions || []).length || ['paused', 'failed'].includes(ps) || ['serious', 'fatal'].includes(x.severity));
};
const fabHms = (errs) => {
  const col = (s) => ({error: 'var(--fab-r)', serious: 'var(--fab-r)', fatal: 'var(--fab-r)', warning: 'var(--fab-o)'})[s] || 'var(--fab-y)';
  const names = {RESUME_PRINTING: 'Resume', RESUME_PRINTING_DEFECTS: 'Resume anyway', RESUME_PRINTING_PROBELM_SOLVED: 'Solved · resume',
    PROBLEM_SOLVED_RESUME: 'Solved · resume', IGNORE_RESUME: 'Ignore · resume', STOP_PRINTING: 'Stop print', ABORT: 'Abort',
    IGNORE_NO_REMINDER_NEXT_TIME: 'Ignore · no reminder', DONT_REMIND_NEXT_TIME: 'No reminder', NO_REMINDER_NEXT_TIME: 'No reminder',
    OK_BUTTON: 'OK', DBL_CHECK_OK: 'OK'};
  const btn = (x, a) => {
    const stop = ['STOP_PRINTING', 'ABORT'].includes(a);
    const call = `event.stopPropagation();${stop ? "if(!confirm('Stop the print?'))return;" : ''}`
      + `document.querySelector('home-assistant').hass.callService('bambuddy','answer_hms',{device_id:'$DEV',code:'${x.code}',action:'${a}'})`;
    return `<button onclick="${call}" onpointerdown="event.stopPropagation()" style="font:13px var(--fab-font);letter-spacing:2px;text-transform:uppercase;cursor:pointer;
      padding:4px 12px;border:1px solid ${stop ? 'var(--fab-r)' : 'var(--fab-y)'};background:${stop ? 'rgba(255,46,46,.12)' : 'rgba(255,180,0,.12)'};color:${stop ? 'var(--fab-r)' : 'var(--fab-y)'}">
      ${names[a] || a.replace(/_/g, ' ').toLowerCase()}</button>`;
  };
  return errs.map(x => `<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:6px 0;border-bottom:1px solid rgba(255,180,0,.12);text-align:left">
    <span style="background:${col(x.severity)};color:#0b0b0b;font-size:11px;font-weight:700;letter-spacing:2px;padding:2px 8px">${(x.severity || '').toUpperCase()}</span>
    <span style="font-family:var(--fab-mono);font-size:12px;color:var(--fab-y)">${x.code}</span>
    <span style="font-family:var(--fab-mono);font-size:12px;flex:1 1 280px;min-width:0;white-space:normal">${x.description || ''}</span>
    ${(x.actions || []).length ? `<span style="display:flex;gap:6px;flex-wrap:wrap">${x.actions.map(a => btn(x, a)).join('')}</span>` : ''}</div>`).join('');
};
