const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=process.env.SYSTEM_PROJECT_ROOT||path.resolve(__dirname,'../../..');
exports.loader=function(mocks={}) {
 const cache=new Map();
 function load(relative){
  const base=path.resolve(root,'src/system2',relative);
  const file=[base,base+'.ts',path.join(base,'index.ts')].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
  if(!file)throw Error('Missing '+relative);
  if(cache.has(file))return cache.get(file);
  const exports={};cache.set(file,exports);
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:false,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require:name=>name in mocks?mocks[name]:name.startsWith('.')?load(path.resolve(path.dirname(file),name)):require(name),Date,console,Set,Map,Math,JSON});return exports;
 }
 return load;
};
