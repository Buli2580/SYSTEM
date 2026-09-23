// Pure MOVE time verification: no React Native runtime required.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=process.env.SYSTEM_PROJECT_ROOT??path.resolve(__dirname,'../../..');
const ts=require(require.resolve('typescript',{paths:[root,process.cwd()]}));
const file=path.join(root,'src/system2/move/sessionClock.ts');
const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText;
const m={exports:{}};
vm.runInNewContext(js,{module:m,exports:m.exports,Error,Number,Math});
const {createMoveSessionClock,moveElapsedMs,moveWallEndMs}=m.exports;

test('MOVE elapsed duration uses monotonic clock rather than current calendar time',()=>{
 const session=createMoveSessionClock(1_700_000_000_000,100_000);
 assert.equal(moveElapsedMs(session,101_850),1850);
 assert.equal(moveWallEndMs(session,101_850),1_700_000_001_850);
 // A manually changed Date.now() is never consulted by either helper.
 const movedCalendarTime=1_700_003_600_000;
 assert.notEqual(moveWallEndMs(session,101_850),movedCalendarTime);
});

test('MOVE does not count time before its start',()=>{
 const session=createMoveSessionClock(1_700_000_000_000,55_000);
 assert.equal(moveElapsedMs(session,55_000),0);
 assert.throws(()=>moveElapsedMs(session,54_999),/MOVE_MONOTONIC_CLOCK_RESET/);
});

test('MOVE refuses invalid session clocks',()=>{
 assert.throws(()=>createMoveSessionClock(NaN,10),/MOVE_INVALID_START_CLOCK/);
 assert.throws(()=>createMoveSessionClock(100,-1),/MOVE_INVALID_START_CLOCK/);
 assert.throws(()=>moveElapsedMs(createMoveSessionClock(100,10),Infinity),/MOVE_MONOTONIC_CLOCK_RESET/);
});
