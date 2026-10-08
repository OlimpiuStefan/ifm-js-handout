// Equipment rows: the view model for one reading, and the list on the page.

import { classify, STATE, SEVERITY } from './rules.js';

// View model for one row. The device id stands in when there is no name,
// the state defaults to OK, and a unit in `meta` wins over the reading's own.
export function toView(reading) {
  if (reading.value == null) return null; // no value, no row. 0 is a value.
  const { deviceId, name, value, unit, state } = reading;
  return {
    id: deviceId,
    label: name || deviceId,
    unit: reading.meta?.unit ?? unit,
    value,
    state: state || STATE.OK,
  };
}

// Draws one row per reading into the panel: built off-screen in a fragment,
// inserted once, text as text (never innerHTML with data we did not write).
export function renderList(panel, readings, selectedId = null) {
  const rows = document.createDocumentFragment();
  for (const r of readings) {
    const view = toView(r);
    if (!view) continue;

    const row = document.createElement('div');
    row.className = 'row';
    row.dataset.deviceId = view.id;
    row.classList.toggle('selected', view.id === selectedId);

    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = view.label;

    const value = document.createElement('span');
    value.className = 'value';
    value.textContent = `${view.value} ${view.unit}`;

    row.append(label, value);
    rows.append(row);
  }
  panel.replaceChildren(rows);
}

// Worst state first, for the alarm summary. Sorts a COPY: the caller keeps
// the order it had (this was the bug found in the debugger).
export function worstFirst(readings) {
  return readings.toSorted((a, b) => SEVERITY[classify(b)] - SEVERITY[classify(a)]);
}
