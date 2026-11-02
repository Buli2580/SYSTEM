#!/usr/bin/env node
// Codec integration check. Inputs must be real fixture/output files; never a device benchmark.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'../..');
const filename=path.join(root,'src/system2/worldBridge/protocol.ts');const box={exports:{}};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:box.exports,module:box,Date,JSON,Map,Set});
const api=box.exports;
function canonical(v){if(Array.isArray(v))return v.map(canonical);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])]));return v;}
function verify(valid,negative,csharp){assert.ok(Array.isArray(valid)&&valid.length>0);assert.ok(Array.isArray(negative)&&negative.length>0);if(csharp)assert.equal(csharp.length,valid.length);for(let i=0;i<valid.length;i++){const result=api.decodeWorldMessage(api.encodeWorldMessage(valid[i]));assert.deepEqual(canonical(result),canonical(valid[i]));if(csharp)assert.deepEqual(canonical(result),canonical(api.decodeWorldMessage(JSON.stringify(csharp[i]))));}for(const raw of negative)assert.throws(()=>api.decodeWorldMessage(raw));return {valid:valid.length,invalid:negative.length,csharpMatched:!!csharp};}
module.exports={verify};
if(require.main===module){try{const [validFile,negativeFile,csharpFile,out]=process.argv.slice(2);if(!validFile||!negativeFile)throw Error('Usage: bridge-parity.cjs valid-fixtures.json negative-fixtures.json [csharp-emitted.json] [typescript-output.json]');const valid=JSON.parse(fs.readFileSync(validFile,'utf8'));const result=verify(valid,JSON.parse(fs.readFileSync(negativeFile,'utf8')),csharpFile?JSON.parse(fs.readFileSync(csharpFile,'utf8')):undefined);if(out)fs.writeFileSync(out,JSON.stringify(valid.map(v=>api.decodeWorldMessage(api.encodeWorldMessage(v))),null,2));console.log(JSON.stringify({status:'PASS',scope:'standalone codec; not Unity or Android runtime',...result}));}catch(e){console.error(e.message);process.exitCode=1;}}
