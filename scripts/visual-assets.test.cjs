const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
function registry(){
 const filename=path.join(root,'src/system2/visual/assets.ts');
 assert.ok(fs.existsSync(filename),'central visual registry must exist');
 const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module,exports:module.exports,require(p){const resolved=path.resolve(path.dirname(filename),p);assert.ok(fs.existsSync(resolved),p);return resolved;}});
 return module.exports;
}
test('quest art follows activity and skill, including adaptive IDs, without changing quests',()=>{
 const r=registry();
 const q={id:'daily:2026:a1:forged-or-real',category:'DAILY',primarySkill:'INT',activityType:'RUN'};
 const snapshot=JSON.stringify(q);
 assert.equal(r.questArt(q),r.ART.run);
 assert.equal(r.questArt({...q,activityType:'BIKE'}),r.ART.cycle);
 assert.equal(r.questArt({...q,activityType:undefined}),r.ART.study);
 assert.equal(r.questArt({...q,category:'BOSS'}),r.ART.boss);
 assert.equal(r.questArt({...q,category:'MAIN',arc:'AWAKENING'}),r.ART.firstAwakening);
 assert.equal(JSON.stringify(q),snapshot);
});
test('character art uses existing style and bounded evolution; unknown data has a fallback',()=>{
 const r=registry();
 assert.equal(r.characterArt('CYBER',0),r.ART.avatarNeutral,'RC3 has a neutral portrait, not fabricated evolution artwork');
 assert.equal(r.characterArt('CYBER',999),r.characterArt('CYBER',4));
 assert.ok(r.characterArt('unknown',NaN));
 assert.equal(r.itemArt({slot:'RING'}),undefined,'removed item art must use the native fallback');
 assert.equal(r.itemArt({id:'unmapped'}),undefined);
 assert.equal(r.achievementArt('EXPLORATION'),undefined);
});
test('marketplace has nine neutral categories and no fabricated offers',()=>{
 const r=registry();
 assert.equal(r.MARKET_CATEGORIES.length,9);
 assert.equal(new Set(r.MARKET_CATEGORIES.map(c=>c.id)).size,9);
 for(const c of r.MARKET_CATEGORIES){assert.equal(c.art,undefined);assert.ok(c.label);assert.equal(c.offer,undefined);assert.equal(c.partner,undefined);}
});
test('bundled images are unique, local, budgeted and have quality metadata',()=>{
 registry();
 const folder=path.join(root,'assets/visual/rc3/SYSTEM_RC3_ASSETS_20');
 const manifest=JSON.parse(fs.readFileSync(path.join(folder,'manifest.json')));
 assert.equal(manifest.length,20);
 assert.equal(new Set(manifest.map(a=>a.sha256)).size,20);
 let total=0;
 for(const a of manifest){
  const bytes=fs.readFileSync(path.join(folder,a.file));total+=bytes.length;
  assert.equal(require('node:crypto').createHash('sha256').update(bytes).digest('hex'),a.sha256);
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.deepEqual(a.export_resolution,[1080,1920]);assert.ok(a.source);
 }
 assert.ok(total<14*1024*1024);
});

test('RC3 boot phases select local scenes and leave unfinished Boss/Guild art unregistered',()=>{
 const r=registry();
 assert.equal(r.bootArt('ONLINE'),r.ART.bootVoid);
 assert.equal(r.bootArt('DETECTED'),r.ART.systemEmblem);
 assert.equal(r.bootArt('AWAKENING'),r.ART.bootPortal);
 assert.equal(r.bootArt('WORLD'),r.ART.worldReveal);
 assert.equal(r.bootArt(undefined),r.ART.bootVoid);
 assert.equal(r.ART.boss,undefined);
 const source=fs.readFileSync(path.join(root,'src/system2/visual/assets.ts'),'utf8');
 assert.doesNotMatch(source,/require\([^\n]*(?:12_world_boss|15_combat_scene|18_guild_vista)/);
 for(const name of ['firstAwakening','characterSelection','privateDomain','avatarNeutral'])assert.ok(r.ART[name]);
});

test('Marketplace renders nine categories offline with no purchase controls',()=>{
 const r=registry(),module={exports:{}};
 const screen=fs.readFileSync(path.join(root,'src/system2/screens/PartnerMarketplaceScreen.tsx'),'utf8');
 vm.runInNewContext(ts.transpileModule(screen,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
  module,exports:module.exports,require(name){
   if(name==='react/jsx-runtime')return require(name);
   if(name==='react-native')return {Text:'Text',View:'View'};
   if(name.endsWith('/SystemPage'))return {default:'SystemPage',pageStyles:{}};
   if(name.endsWith('/VisualArt'))return {ArtThumbnail:'ArtThumbnail'};
   if(name.endsWith('/assets'))return r;
   throw Error('Unexpected dependency (Marketplace must work offline): '+name);
  }
 });
 const elements=[],texts=[];
 function walk(node){if(Array.isArray(node))return node.forEach(walk);if(typeof node==='string')texts.push(node);else if(node?.props){elements.push(node);walk(node.props.children);}}
 walk(module.exports.default());
 assert.equal(elements.filter(e=>e.type==='ArtThumbnail').length,9);
 for(const category of r.MARKET_CATEGORIES)assert.ok(texts.includes(category.label));
 assert.ok(texts.includes('Oferty w przygotowaniu'));
 assert.ok(elements.every(e=>!e.props.onPress&&!e.props.disabled));
});

test('Marketplace route resolves and is reachable from existing navigation',()=>{
 const route=fs.readFileSync(path.join(root,'src/app/partner-marketplace.tsx'),'utf8');
 const target=route.match(/from '([^']+)'/)[1];
 assert.ok(fs.existsSync(path.resolve(root,'src/app',target+'.tsx')));
 for(const [routeFile,screen] of [['expansion','ExpansionHubScreen'],['premium-hub','PremiumHubScreen']]){
  assert.ok(fs.existsSync(path.join(root,'src/app',routeFile+'.tsx')));
  assert.match(fs.readFileSync(path.join(root,'src/system2/screens',screen+'.tsx'),'utf8'),/\/partner-marketplace/);
 }
});

test('thumbnails do not capture touches and recover from a failed image when source changes',()=>{
 const module={exports:{}};let failed;
 const source=fs.readFileSync(path.join(root,'src/system2/components/VisualArt.tsx'),'utf8');
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{
  module,exports:module.exports,require(name){
   if(name==='react/jsx-runtime')return require(name);
   if(name==='react')return {memo:f=>f,useState:()=>[failed,value=>{failed=value;}]};
   if(name==='expo-image')return {Image:'Image'};
   if(name==='react-native')return {View:'View',Text:'Text',StyleSheet:{absoluteFill:{}}};
   throw Error(name);
  }
 });
 const render=source=>module.exports.ArtThumbnail({source});
 const first=render(1);assert.equal(first.props.pointerEvents,'none');assert.equal(first.props.children.type,'Image');
 first.props.children.props.onError();
 assert.equal(render(1).props.children.type,'Text');
 assert.equal(render(2).props.children.type,'Image');
 assert.equal(render(undefined).props.children.type,'Text');
 assert.equal(module.exports.ArtBackdrop({source:1}).props.pointerEvents,'none');
 failed=undefined;
 const scene=module.exports.ArtImage({source:3});
 assert.equal(scene.props.pointerEvents,'none');
 assert.equal(scene.props.children.props.contentFit,'contain');
 scene.props.children.props.onError();
 assert.equal(module.exports.ArtImage({source:3}).props.children,false,'failed image has a solid native fallback');
 assert.equal(module.exports.ArtImage({source:4,fit:'cover'}).props.children.props.source,4);
 assert.equal(module.exports.ArtImage({}).props.children,false);
});
