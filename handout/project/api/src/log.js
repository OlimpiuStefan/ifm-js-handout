// One JSON object per line: fields you can filter on, not a sentence.
//   log({ correlationId, method: 'GET', path: '/api/readings' }, 'request received')
//   {"at":"2026-10-07T09:00:00.000Z","correlationId":"...","method":"GET","path":"/api/readings","msg":"request received"}
export const log = (fields, msg) =>
  console.log(JSON.stringify({ at: new Date().toISOString(), ...fields, msg }));
