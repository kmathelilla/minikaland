import assert from 'node:assert/strict';
import test from 'node:test';

import { assertSuccessfulResponse } from '../src/lib/apiErrors.js';

test('uses a safe detail returned by the backend', async () => {
  const response = new Response(
    JSON.stringify({ detail: 'A tevékenység generálása nem sikerült.' }),
    { status: 502 },
  );

  await assert.rejects(
    assertSuccessfulResponse(response, 'Nem sikerült a kérés.'),
    { message: 'A tevékenység generálása nem sikerült.' },
  );
});

test('uses a status fallback when the error body is invalid or has no detail', async () => {
  const invalidJson = {
    ok: false,
    status: 502,
    json: async () => {
      throw new SyntaxError('invalid JSON');
    },
  };
  const missingDetail = new Response(JSON.stringify({}), { status: 503 });

  await assert.rejects(
    assertSuccessfulResponse(invalidJson, 'Nem sikerült a kérés.'),
    { message: 'Nem sikerült a kérés. HTTP 502' },
  );
  await assert.rejects(
    assertSuccessfulResponse(missingDetail, 'Nem sikerült a kérés.'),
    { message: 'Nem sikerült a kérés. HTTP 503' },
  );
});
