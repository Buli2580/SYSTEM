const test=require('node:test');
const assert=require('node:assert/strict');
const {check}=require('../verify-build-source.cjs');
const sha='a'.repeat(40);
function git(head=sha,dirty='',branch='integration/system-evening-build'){return args=>args[0]==='rev-parse'?head:args[0]==='status'?dirty:branch;}
test('accepts exact clean checkout',()=>assert.equal(check(sha,'integration/system-evening-build',git()).sha,sha));
test('rejects wrong commit',()=>assert.throws(()=>check(sha,null,git('b'.repeat(40))),/Wrong checkout/));
test('rejects dirty checkout',()=>assert.throws(()=>check(sha,null,git(sha,' M app.json')),/Dirty checkout/));
test('rejects wrong branch',()=>assert.throws(()=>check(sha,'integration/system-evening-build',git(sha,'','agent/old')),/Wrong branch/));
test('requires explicit SHA',()=>assert.throws(()=>check('HEAD',null,git()),/40-character/));
