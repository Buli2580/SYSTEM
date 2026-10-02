const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, 'official-apk.cjs'),
  'utf8'
);

const line = source.split(/\r?\n/).find(x =>
  x.includes('const actual=signature.match')
);

test('official launcher contains certificate parser', () => {
  assert.ok(line, 'Missing certificate parser');
});

const pattern =
  /(?:Signer #1|V[234](?:\.1)? Signer):? certificate SHA-256 digest:\s*([a-fA-F0-9]{64})/i;

const expected =
  '2a5545bce5d1beb24c7d162457b3024608d3ed322e3be76ce99a04a126f4f1b3';

test('official launcher uses the tested parser', () => {
  assert.ok(line.includes(pattern.toString()));
});

for (const prefix of ['Signer #1', 'V2 Signer', 'V3 Signer']) {
  test('recognizes ' + prefix, () => {
    const output =
      prefix + ': certificate SHA-256 digest: ' + expected;

    assert.equal(
      output.match(pattern)?.[1]?.toLowerCase(),
      expected
    );
  });
}

test('rejects incomplete fingerprint', () => {
  assert.equal(
    'V2 Signer: certificate SHA-256 digest: 1234'.match(pattern),
    null
  );
});