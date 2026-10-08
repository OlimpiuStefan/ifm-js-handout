// ═══════════════════════════════════════════════════════════════════
//  Day 3 · Events: bubbling, target, delegation, stopPropagation,
//  preventDefault, custom events
//  Runs in the browser, from events/index.html.
//
//  Three nesting levels: panel › row › (span.name | button.ack | a.details).
//  Every listener below is on the PANEL, except the one on the first
//  acknowledge button, which is there to show what stopPropagation does.
// ═══════════════════════════════════════════════════════════════════

const log = (...text) => {
  document.querySelector('#log').textContent += text.join(' ') + '\n';
};
document.querySelector('#clear').onclick = () => {
  document.querySelector('#log').textContent = '';
};

const panel = document.querySelector('#panel');
const button = panel.querySelector('.ack');               // the acknowledge button of the first row only
const where = (el) => el.tagName.toLowerCase() + (el.className ? '.' + el.className : '') + (el.id ? '#' + el.id : '');

// "add a row": a row that did not exist when the listeners were registered.
document.querySelector('#add').onclick = () => {
  const n = panel.querySelectorAll('.row').length;
  const added = document.createElement('div');
  added.className = 'row';
  added.dataset.deviceId = `DEV-${String(n).padStart(3, '0')}`;
  added.textContent = `Added later, ${added.dataset.deviceId}`;
  panel.append(added);
};

// ─── 1 · bubbling: the event does not belong to the element you clicked
// Click the NAME of a row. The listener is on the panel, and it hears it,
// because after the target, the event travels UP through every ancestor.
//
//   span.name  ← clicked (the target)
//     ↑
//   div.row
//     ↑
//   div#panel  ← this listener runs
//     ↑
//   body, html, document
panel.addEventListener('click', () => {
  log('panel heard the click');
});

// ─── 2 · target and currentTarget ─────────────────────────────────
//   target         where the event started: what was actually clicked
//   currentTarget  whose listener is running right now
panel.addEventListener('click', (event) => {
  log(`target: ${where(event.target)} · currentTarget: ${where(event.currentTarget)}`);
});

// ─── 3 · closest(), and delegation ────────────────────────────────
// I clicked the span; the data I need (data-device-id) is on the row.
// closest() walks up from the target to the first ancestor that matches.
//
// Delegation: ONE listener on the stable parent, instead of one per row.
// Rows added later are covered too: press "add a row", click the new row.
function select(deviceId) {
  const selected = panel.querySelector(`[data-device-id="${deviceId}"]`);
  for (const r of panel.querySelectorAll('.row')) {
    r.classList.toggle('selected', r === selected);        // one row selected, every other one cleared
  }
  log('select', deviceId);
}

panel.addEventListener('click', (event) => {
  if (event.target.closest('.ack')) return;                // rule: acknowledge must NOT select (see section 4)
  const row = event.target.closest('.row');
  if (!row) return;                                        // a click on the panel's padding: no row
  select(row.dataset.deviceId);
  announce(panel, row.dataset.deviceId);                   // section 6
});

// ─── 4 · acknowledge must not select: stopPropagation against return
button.addEventListener('click', () => {
  log('button ack clicked');
  // event.stopPropagation();                              // the wrong fix: try it, read the log, put it back
});

// Somebody else listens on the panel too, and must keep hearing every click.
panel.addEventListener('click', () => {
  log('panel interaction');                                // think: analytics
});
//   event.stopPropagation()   stops the EVENT: nothing above hears it, analytics included
//   return from the handler   stops THIS BEHAVIOUR only: the .ack line in section 3
// The requirement was never "nobody above may hear this click". It was
// "row selection should ignore acknowledge clicks". So: return.

// ─── 5 · preventDefault: the details link ─────────────────────────
// A link has a default action: follow the href. We want the row selected
// (section 3 still runs) and no navigation.
panel.addEventListener('click', (event) => {
  const link = event.target.closest('.details');
  if (!link) return;
  event.preventDefault();                                  // cancel the browser's built-in action; the event still bubbles
  log('details clicked', link.closest('.row').dataset.deviceId);
});
//   preventDefault()   cancels the default action, the event still travels
//   stopPropagation()  stops the travel, the browser STILL navigates

// ─── 6 · custom events: the module reports, the host decides ──────
// The module does not know what "selected" should do in this application.
// It dispatches an event with the data in `detail`; whoever hosts the
// panel listens and decides.
function announce(el, deviceId) {
  el.dispatchEvent(new CustomEvent('alarm:selected', { detail: { deviceId } }));
}

// The host:
panel.addEventListener('alarm:selected', (event) => {
  log('panel heard alarm:selected', event.detail.deviceId);
});
// Dispatched on the panel and heard on the panel: the element the host handed
// over is the meeting point. With `bubbles: true` it would also travel up to
// body and document, so listeners further out could hear it.
