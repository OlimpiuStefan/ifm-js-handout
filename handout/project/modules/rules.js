// Alarm rules. The dashboard and equipment.js use them.

export const STATE = Object.freeze({ OK: 'OK', WARNING: 'WARNING', CRITICAL: 'CRITICAL' });

export const SEVERITY = Object.freeze({ OK: 0, WARNING: 1, CRITICAL: 2 });

const DEFAULT_THRESHOLD = { warn: 50, crit: 95 };

// `value` travels as a string (see the contract). Convert on purpose, here.
export function classify(reading, threshold = DEFAULT_THRESHOLD) {
  const n = Number(reading.value);
  if (n > threshold.crit) return STATE.CRITICAL;
  if (n > threshold.warn) return STATE.WARNING;
  return STATE.OK;
}

// Readings in, active alarms out, worst first. Four steps, one line each.
// toSorted returns a new array: the caller's list is never reordered.
export function activeAlarms(readings, thresholds = {}) {
  return readings
    .filter((r) => r.value != null)
    .map((r) => ({ ...r, state: classify(r, thresholds[r.deviceId]) }))
    .filter((r) => r.state !== STATE.OK)
    .toSorted((a, b) => SEVERITY[b.state] - SEVERITY[a.state]);
}
