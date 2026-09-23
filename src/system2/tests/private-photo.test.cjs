const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require(require.resolve('typescript',{paths:[process.env.SYSTEM_PROJECT_ROOT??path.resolve(__dirname,'../../..'),process.cwd()]}));
const root=process.env.SYSTEM_PROJECT_ROOT??path.resolve(__dirname,'../../..');

function cameraHarness({granted=true,cancelled=false}={}){
 const saved=new Set();
 let permissionCount=0;
 const cache={uri:'file:///app/cache'};
 class Directory {
   constructor(parent,name){this.uri=parent.uri+'/'+name;this.exists=true;}
   create(){}
 }
 class File {
   constructor(base,name){this.uri=name===undefined?base:base.uri+'/'+name;}
   get exists(){return saved.has(this.uri);}
   async copy(destination){saved.add(destination.uri);}
   delete(){saved.delete(this.uri);}
 }
 const mocks={
  'expo-file-system':{Directory,File,Paths:{cache}},
  'expo-image-picker':{
    requestCameraPermissionsAsync:async()=>{permissionCount++;return{granted};},
    launchCameraAsync:async()=>cancelled?{canceled:true}:{canceled:false,assets:[{uri:'file:///original/photo.jpg'}]},
  },
 };
 const module={exports:{}};
 const source=fs.readFileSync(path.join(root,'src/system2/quests/privatePhoto.ts'),'utf8');
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(js,{
  module,exports:module.exports,Date,Math,Error,
  require:key=>{
   if(Object.hasOwn(mocks,key))return mocks[key];
   throw new Error('Unexpected import '+key);
  },
 });
 return{api:module.exports,saved,permissionCount:()=>permissionCount};
}

test('private camera refuses to create photo without foreground permission',async()=>{
 const x=cameraHarness({granted:false});
 await assert.rejects(x.api.capturePrivateQuestPhoto(),/wymaga zgody/);
 assert.equal(x.saved.size,0);
});

test('camera cancellation does not create a local file',async()=>{
 const x=cameraHarness({cancelled:true});
 assert.equal(await x.api.capturePrivateQuestPhoto(),null);
 assert.equal(x.saved.size,0);
});

test('camera preview stays under app cache and only own copies can be deleted',async()=>{
 const x=cameraHarness();
 const uri=await x.api.capturePrivateQuestPhoto();
 assert.equal(uri.startsWith('file:///app/cache/system2-private-quest-photos/preview-'),true);
 assert.equal(x.saved.size,1);
 assert.equal(x.api.isPrivateQuestPhoto(uri,'file:///app/cache/system2-private-quest-photos'),true);
 assert.equal(x.api.isPrivateQuestPhoto('file:///app/cache/system2-private-quest-photos/../secrets.jpg','file:///app/cache/system2-private-quest-photos'),false);
 x.api.removePrivateQuestPhoto('file:///original/photo.jpg');
 assert.equal(x.saved.size,1);
 x.api.removePrivateQuestPhoto(uri);
 assert.equal(x.saved.size,0);
});
