// The dashboard. The page loads it directly; `npm run build` bundles it.
//
//   event  ──►  store.set(new state)  ──►  'change'  ──►  render(state)
//
// The store holds the state of the page. render() is the only function that
// writes to the DOM, and it draws everything from the state: the list, the
// status line, and the gauge for the selected device.
import { READINGS_URL } from './config.js';
import { Store } from './store.js';
import { activeAlarms } from '../modules/rules.js';
import { worstFirst } from '../modules/equipment.js';
import { Gauge } from '../modules/gauge.js';
import * as alarmList from '../modules/alarm-list.js';

const REFRESH_MS = 5000;

async function getReadings(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} on ${url}`);
  return res.json();
}

// Latest reading per device, in the order the devices first appear.
const latestPerDevice = (readings) => [...new Map(readings.map((r) => [r.deviceId, r])).values()];

function render({ panel, status, gauge, selected }, { readings, selectedId }) {
  if (readings.length === 0) return;
  const latest = latestPerDevice(readings);

  // Readings arrive oldest first; `at` is ISO 8601, so HH:MM:SS is a slice.
  const lastUpdate = readings.at(-1).at.slice(11, 19);

  // Average for the press line 1 inlet. `value` travels as a string: convert on purpose.
  const history = readings.filter((r) => r.deviceId === 'PT-1042');
  const average = history.reduce((sum, r) => sum + Number(r.value), 0) / history.length;

  const worst = worstFirst(latest)[0];

  status.textContent =
    `${activeAlarms(latest).length} active alarms, worst ${worst.deviceId}, ` +
    `PT-1042 average ${average.toFixed(2)}, last update ${lastUpdate}`;

  // No catch here: if drawing fails, the operator must see it, not a stale screen.
  alarmList.update(panel, { readings: latest, selectedId });

  // The gauge follows the selection, and the selection lives in the store,
  // so a refresh redraws the same device with its newest value.
  const reading = latest.find((r) => r.deviceId === selectedId);
  if (reading) {
    gauge.setValue(Number(reading.value), reading.unit);
    selected.textContent = `${reading.name}: ${reading.value} ${reading.unit}`;
  }
}

// `elements`: the page hands over panel, status, gauge and selected. The app
// never looks in the document itself.
export async function start(elements) {
  const store = new Store({ readings: [], selectedId: null });
  const ui = { ...elements, gauge: new Gauge(elements.gauge, { min: 0, max: 100 }) };

  store.addEventListener('change', (event) => render(ui, event.detail));

  ui.gauge.mount();
  alarmList.init(ui.panel);
  ui.panel.addEventListener('alarm:selected', (event) => store.set({ selectedId: event.detail.deviceId }));

  try {
    store.set({ readings: await getReadings(READINGS_URL) });
  } catch (err) {
    ui.status.textContent = `Service unreachable: ${err.message}`; // say why, then let the console have the rest
    throw err;
  }

  // Refresh for as long as the page is open.
  setInterval(async () => {
    try {
      store.set({ readings: await getReadings(READINGS_URL) });
    } catch (err) {
      // A slow refresh is expected on a busy line: skip it, try next tick.
      if (err.name === 'TimeoutError' || err.name === 'AbortError') return;
      throw err;
    }
  }, REFRESH_MS);
}
