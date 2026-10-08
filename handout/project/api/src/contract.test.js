// The contract, checked on every test run.
//
// contract/reading.schema.json is the written agreement on what one reading
// looks like. The service's output AND the fixture must both match it.
// Rename a field on either side and this fails, naming the field, before
// anything reaches a screen. Ajv is the JSON Schema validator; the schema
// is plain JSON Schema, so a .NET side can check against the same file.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { tick, since } from './store.js';
import { normalizeAll } from './normalize.js';

const load = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

const ajv = new Ajv2020({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(load('../../contract/reading.schema.json'));

function assertContract(items, source) {
  assert.ok(items.length > 0, `${source}: nothing to check`);
  for (const item of items) {
    if (!validate(item)) {
      assert.fail(`${source} broke the contract at ${item.deviceId}: ${ajv.errorsText(validate.errors)}`);
    }
  }
}

test('the service output matches the contract', () => {
  tick(Date.parse('2026-10-05T09:00:00Z'));
  assertContract(normalizeAll(since(null)), 'service');
});

test('the dashboard fixture matches the contract', () => {
  assertContract(load('../../fixtures/readings.json'), 'fixture');
});
