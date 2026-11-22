import assert from 'node:assert/strict';
import test from 'node:test';

import { createRequestSequence } from '../src/lib/requestSequence.js';

test('a late response is stale once a newer request has started', () => {
  const requests = createRequestSequence();
  const olderRequest = requests.begin();
  const newerRequest = requests.begin();

  assert.equal(requests.isLatest(olderRequest), false);
  assert.equal(requests.isLatest(newerRequest), true);
});

test('closing or replacing results can invalidate an in-flight request', () => {
  const requests = createRequestSequence();
  const pendingRequest = requests.begin();

  requests.begin();

  assert.equal(requests.isLatest(pendingRequest), false);
});
