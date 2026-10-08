// The alarm list as a module. The page hands it an element; the module
// never looks in the document itself.
//
//   init(el)                  one delegated click listener on the panel
//   update(el, { readings, selectedId })   redraw from the state
//
// The module reports a selection with a custom event. The app decides
// what "selected" means.
import { renderList } from './equipment.js';

export function init(el) {
  el.addEventListener('click', (event) => {
    const row = event.target.closest('[data-device-id]');
    if (!row) return;
    el.dispatchEvent(
      new CustomEvent('alarm:selected', {
        detail: { deviceId: row.dataset.deviceId },
      }),
    );
  });
}

export function update(el, { readings, selectedId }) {
  renderList(el, readings, selectedId);
}
