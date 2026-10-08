// ═══════════════════════════════════════════════════════════════════
//  Day 3 · 03 · Debugging: a bug with no error message
//  Run:    node 03-debugging.js
//  Debug:  in VS Code, Terminal › New Terminal › JavaScript Debug Terminal,
//          click the gutter next to a line to set a breakpoint, then run
//          `node 03-debugging.js` in that terminal.
//          Node code → VS Code. Browser code → Chrome DevTools (Sources tab).
//
//  What this file shows: a report that names the wrong machine, nothing
//  thrown, nothing logged. console.log shows you the wrong value; the
//  debugger shows you WHO changed it.
// ═══════════════════════════════════════════════════════════════════

// ─── 1 · the bug ──────────────────────────────────────────────────
// 200 readings, five of them alarms. The report must say which device
// raised the FIRST alarm (by arrival) and list the worst three.
function topAlarms(alarms) {
  return alarms.sort((a, b) => b.severity - a.severity).slice(0, 3);   // ⚠️ sort() reorders the array IN PLACE
}

function buildReport(readings) {
  const alarms = readings.filter((r) => r.severity > 0);  // arrival order: DEV-000 first
  const top = topAlarms(alarms);                           // this call reorders `alarms` too

  const firstAlarmDevice = alarms[0].deviceId;             // so this is no longer the first by arrival

  return { top: top.map((a) => a.deviceId), attributedTo: firstAlarmDevice };
}

const readings = Array.from({ length: 200 }, (_, i) => ({
  deviceId: `DEV-${String(i).padStart(3, '0')}`,
  severity: i === 137 ? 2 : i % 50 === 0 ? 1 : 0,
}));

const report = buildReport(readings);
console.log('first alarm by arrival should be DEV-000');
console.log('report says            :', report.attributedTo);
console.log('bug reproduced         :', report.attributedTo !== 'DEV-000');
// → report says            : DEV-137
// → bug reproduced         : true

// ─── 2 · how to find it in the debugger ───────────────────────────
// The four panels, in VS Code's Run and Debug view:
//   VARIABLES    what every variable holds right now (Local, Closure, Global)
//   WATCH        an expression you want to see on every stop, e.g. alarms[0].deviceId
//   CALL STACK   how execution got here: the function running, and who called it
//   BREAKPOINTS  where you asked it to pause
//
// Step by step:
//   1. Breakpoint on the `const top = topAlarms(alarms)` line. Run. It pauses BEFORE the line runs.
//      WATCH alarms[0].deviceId → 'DEV-000'. Correct so far.
//   2. Step Into (F11): you are inside topAlarms, on the sort line. The watch still says DEV-000.
//   3. Step Over (F10) once: sort has run. You are on the way out of topAlarms, and the watch
//      says DEV-137. There is the mutation, caught in the act. Nothing was assigned; sort wrote.
//   4. Step Out (Shift+F11): back in buildReport, `top` is right, `alarms` is reordered.
//   5. CALL STACK, read from the bottom: the file's top level → buildReport → topAlarms.
//
// A conditional breakpoint: right-click the gutter, "Add Conditional Breakpoint",
// condition  alarms[0].deviceId !== 'DEV-000'  on the firstAlarmDevice line.
// It pauses only when the report is about to be wrong, so in a loop of
// thousands it stops on the one bad pass.
//
// A logpoint: right-click the gutter, "Add Logpoint", an expression such as
// {alarms[0].deviceId}. It logs on every pass, does not pause, and does not
// touch the file. A console.log you do not have to remember to remove.
//
// The same investigation in the browser (Chrome, DevTools, Sources): click
// the line number in the gutter, same Scope / Watch / Call Stack panels,
// same Step Into / Over / Out buttons. The page refreshes on its own, so the
// pause comes by itself.

// ─── 3 · the fix ──────────────────────────────────────────────────
// toSorted() returns a sorted COPY. The caller's array stays in arrival order.
function topAlarmsFixed(alarms) {
  return alarms.toSorted((a, b) => b.severity - a.severity).slice(0, 3);
  // older code: [...alarms].sort(...) copies first, same effect
}

function buildReportFixed(readings) {
  const alarms = readings.filter((r) => r.severity > 0);
  const top = topAlarmsFixed(alarms);                      // sorts a new array
  return { top: top.map((a) => a.deviceId), attributedTo: alarms[0].deviceId };
}

const fixed = buildReportFixed(readings);
console.log('after the fix          :', fixed.attributedTo);
console.log('top 3 still correct    :', fixed.top.join(', '));
// → after the fix          : DEV-000
// → top 3 still correct    : DEV-137, DEV-000, DEV-050
// Day 1 again: two names for one object. `readings` inside topAlarms and
// `alarms` in buildReport are the same array, and sort() changed it in place.

// ─── 4 · console.table ────────────────────────────────────────────
console.table([
  { device: 'PT-1042', v: 97.4 },
  { device: 'VS-0071', v: 12.1 },
]);
// One row per item, columns per field, instead of one long line.
