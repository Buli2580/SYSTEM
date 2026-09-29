// Refuse to build a stale or dirty checkout. Run before official-apk.cjs.
// Usage: node scripts/verify-build-source.cjs <40-character-expected-sha> [expected-branch]
const cp=require('node:child_process');
function check(expectedSha, expectedBranch, run=(args)=>cp.execFileSync('git',args,{encoding:'utf8'}).trim()){
  if(!/^[0-9a-f]{40}$/i.test(expectedSha||''))throw new Error('Explicit 40-character source SHA required');
  const actual=run(['rev-parse','HEAD']);
  if(actual.toLowerCase()!==expectedSha.toLowerCase())throw new Error('Wrong checkout: HEAD '+actual+' differs from requested '+expectedSha);
  const dirty=run(['status','--porcelain','--untracked-files=all']);
  if(dirty)throw new Error('Dirty checkout; commit or isolate changes before building');
  const branch=run(['symbolic-ref','--quiet','--short','HEAD']);
  if(expectedBranch && branch!==expectedBranch)throw new Error('Wrong branch: '+branch+'; expected '+expectedBranch);
  return {sha:actual,branch};
}
if(require.main===module){
  try{const identity=check(process.argv[2],process.argv[3]);console.log('BUILD SOURCE VERIFIED: '+JSON.stringify(identity));}
  catch(error){console.error('BUILD BLOCKED: '+error.message);process.exitCode=1;}
}
module.exports={check};
