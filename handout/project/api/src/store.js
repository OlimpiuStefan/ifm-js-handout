// In-memory store. Deliberately not a database: this course is about
// JavaScript, not SQL. Deterministic seed, so everybody sees the same numbers.

let seed = 42;
const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;

// Twelve devices on the line, in the order the panel shows them.
export const DEVICES = [
  { deviceId: 'VS-0071', name: 'Conveyor bearing', unit: 'mm/s', base: 11 },
  { deviceId: 'PT-1042', name: 'Press line 1 · inlet', unit: 'C', base: 92 },
  // Hydraulic main is offline: the line is depressurised, and the sensor
  // keeps reporting what it measures. 0 bar is a reading.
  { deviceId: 'PS-0310', name: 'Hydraulic main', unit: 'bar', base: 0, offline: true },
  { deviceId: 'MM-0002', name: 'Cabinet voltage', unit: 'V', base: 23 },
  { deviceId: 'LS-0120', name: 'Coolant tank level', unit: '%', base: 64 },
  { deviceId: 'SM-0415', name: 'Cooling water flow', unit: 'l/min', base: 38 },
  { deviceId: 'TA-0233', name: 'Oven zone 2', unit: 'C', base: 41 },
  { deviceId: 'PN-0877', name: 'Compressed air', unit: 'bar', base: 6 },
  { deviceId: 'VS-0072', name: 'Spindle motor', unit: 'mm/s', base: 47 },
  { deviceId: 'PT-1043', name: 'Press line 2 · inlet', unit: 'C', base: 88 },
  // This sensor has stopped answering: it sends no frames, and its own
  // endpoint answers 503.
  { deviceId: 'FL-0909', name: 'Flow meter line 3', unit: 'l/min', base: 30, dead: true },
  { deviceId: 'TA-0234', name: 'Hardening bath', unit: 'C', base: 18 },
];

const readings = [];

// A raw frame carries a NUMBER. normalize() turns it into the transport shape.
const frame = (d, now) => ({
  deviceId: d.deviceId,
  name: d.name,
  value: d.offline ? 0 : Number((d.base + rand() * 8).toFixed(4)),
  unit: d.unit,
  at: new Date(now).toISOString(),
});

// One frame per live device, every second. A throw here is a bug, so there
// is no catch: the process must not keep serving frozen data.
export function tick(now = Date.now()) {
  for (const d of DEVICES) {
    if (!d.dead) readings.push(frame(d, now));
  }
  if (readings.length > 5000) readings.splice(0, readings.length - 5000);
  return readings.length;
}

export const since = (iso) =>
  iso ? readings.filter((r) => r.at >= iso) : readings.slice(-50);

export const latestFor = (deviceId) =>
  readings.findLast((r) => r.deviceId === deviceId);
