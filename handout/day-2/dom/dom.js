// ═══════════════════════════════════════════════════════════════════
//  Day 2 · The DOM: select, create, fill, and replace
//  Runs in the browser, from dom/index.html (see the comment in there).
//
//  What this file shows: querySelector, createElement, className, dataset,
//  textContent against innerHTML (and why the first is the safe one),
//  append, a document fragment for many rows, and replaceChildren.
// ═══════════════════════════════════════════════════════════════════

const readings = [
  { deviceId: 'PT-1042', name: 'Press line 1 · inlet', value: '97.4', unit: 'C' },
  { deviceId: 'VS-0071', name: 'Conveyor bearing', value: '12.1', unit: 'mm/s' },
  { deviceId: 'PS-0310', name: 'Hydraulic main', value: '0', unit: 'bar' },
  // ⚠️ this name came from another system. Nobody sanitised it.
  { deviceId: 'MM-0002', name: '<img src=x onerror="alert(\'the name ran as code\')">', value: '23.9', unit: 'V' },
];

// ─── 1 · select ───────────────────────────────────────────────────
const panel = document.querySelector('#panel');          // the first match of a CSS selector, or null
const rows = document.querySelectorAll('.row');          // every match, as a static NodeList
console.log(panel, rows.length);                         // → <div id="panel">… 1

// ─── 2 · build one row from data ──────────────────────────────────
function renderRow(r) {
  const row = document.createElement('div');
  row.className = 'row';
  row.dataset.deviceId = r.deviceId;                     // becomes the attribute data-device-id="PT-1042"

  const label = document.createElement('span');
  label.className = 'label';
  label.textContent = r.name;                            // ✅ textContent: the value is shown as text, whatever it contains

  const value = document.createElement('span');
  value.className = 'value';
  value.textContent = `${r.value} ${r.unit}`;

  row.append(label, value);                              // append takes several children at once
  return row;
}

panel.append(renderRow(readings[0]));

// ─── 3 · textContent against innerHTML ────────────────────────────
// The fourth name came from outside. With textContent it is drawn as the
// characters it is made of. With innerHTML the browser PARSES it as HTML,
// and the <img onerror> runs. That is cross-site scripting (XSS), and the
// fix is the mechanism, not a filter: build DOM from data with textContent.
const fromApi = readings[3].name;

const asText = document.createElement('p');
asText.textContent = fromApi;                            // ✅ the value is treated as text

const asHtml = document.createElement('p');
// asHtml.innerHTML = fromApi;                           // ⚠️ the value is parsed as HTML. Uncomment once, see the alert, put it back.
asHtml.textContent = '(innerHTML line is commented out in dom.js)';

panel.after(asText, asHtml);

// ─── 4 · many rows: build off-screen, insert once ─────────────────
// Every append into the live page is a layout the browser may have to do.
// A DocumentFragment is a container that is not in the page: fill it, then
// insert it once. replaceChildren empties the panel and puts the new rows in.
function renderList(list) {
  const frag = document.createDocumentFragment();
  for (const r of list) frag.append(renderRow(r));
  panel.replaceChildren(frag);
}

renderList(readings);
// Elements panel: four .row elements, each with data-device-id, and the
// fourth name shown as text, angle brackets and all.
