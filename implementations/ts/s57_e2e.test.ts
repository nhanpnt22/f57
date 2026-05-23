import test from 'node:test';
import assert from 'node:assert/strict';

import { H57Length } from './h57.js';
import { ID57Length } from './id57.js';
import { S57 } from './s57.js';

const enc = new TextEncoder();
const dec = new TextDecoder();

test('S57 e2e secure composition flow', () => {
  const s57 = new S57({
    server_secret_key: enc.encode('S57_SERVER_SECRET_KEY_MUST_BE_LONG_1234567890'),
    environment_salt: enc.encode('staging-v1'),
    key_id: 12
  });

  const payload = enc.encode('e2e-s57-payload');

  const id = s57.id(payload, ID57Length.DEFAULT);
  const hash = s57.hash(payload, H57Length.LEN_256);
  const random = s57.random();

  assert.equal(id.length, 22);
  assert.equal(hash.length, 44);
  assert.equal(random.length, 22);

  const aad = enc.encode('s57-e2e');
  const sealed = s57.encrypt(payload, aad);
  const opened = s57.decrypt(sealed, aad);

  assert.equal(dec.decode(opened), 'e2e-s57-payload');
});
