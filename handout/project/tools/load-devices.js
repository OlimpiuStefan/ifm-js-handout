// Against the running service:
//   npm run dev:api        (in one terminal)
//   node tools/load-devices.js
import { loadAll, httpReading } from '../modules/devices.js';

const BASE = 'http://localhost:3000';

const res = await fetch(`${BASE}/api/equipment`);
if (!res.ok) throw new Error(`${res.status} on /api/equipment`);
const ids = (await res.json()).map((d) => d.deviceId);

console.log(`loading ${ids.length} devices...`);
console.table(await loadAll(ids, httpReading(BASE)));
