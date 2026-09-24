const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=process.env.SYSTEM_PROJECT_ROOT??path.resolve(__dirname,'../../..');
const ts=require(require.resolve('typescript',{paths:[root,process.cwd()]}));

function load(relative){
 const file=path.join(root,'src/system2',relative+'.ts');
 const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
 }).outputText;
 const module={exports:{}};
 vm.runInNewContext(source,{module,exports:module.exports,require:()=>{throw new Error('unexpected dependency')},Math,Number},{filename:file});
 return module.exports;
}

test('Animation Engine 4.0 reduced motion disables duration and stagger',()=>{
 const {motionDuration,motionStagger,motionProfile}=load('presentation/animationEngine4');
 assert.equal(motionDuration('hero',true),0);
 assert.equal(motionStagger(3,'hero',true),0);
 assert.equal(motionProfile('hero',true).scanOpacity,0);
 assert.equal(motionProfile('world',true).revealY,0);
});

test('Animation Engine 4.0 profiles scale intensity deterministically',()=>{
 const {motionDuration,motionStagger,motionProfile}=load('presentation/animationEngine4');
 assert.equal(motionDuration('normal',false),320);
 assert.ok(motionProfile('hero').scanOpacity>motionProfile('quiet').scanOpacity);
 assert.ok(motionStagger(2,'hero')>motionStagger(2,'quiet'));
 assert.ok(motionProfile('hero').scanDuration<motionProfile('quiet').scanDuration);
});

test('Animation Engine 4.0 is mounted globally and SystemPage owns screen motion',()=>{
 const layout=fs.readFileSync(path.join(root,'src/app/_layout.tsx'),'utf8');
 const page=fs.readFileSync(path.join(root,'src/system2/components/SystemPage.tsx'),'utf8');
 assert.match(layout,/AnimationEngine4Provider/);
 assert.match(page,/SystemMotionLayer/);
 assert.match(page,/useAnimationEngine4/);
 assert.match(page,/FadeInDown/);
 assert.match(page,/FadeInUp/);
});

test('Boot, event, combat and milestone overlays consume Animation Engine 4.0',()=>{
 const files=[
  'src/system2/components/SystemBootSequence.tsx',
  'src/system2/components/SystemEventOverlay.tsx',
  'src/system2/components/CombatImpactOverlay.tsx',
  'src/system2/cards/MilestoneCardOverlay.tsx',
 ];
 for(const relative of files){
  const source=fs.readFileSync(path.join(root,relative),'utf8');
  assert.match(source,/useAnimationEngine4/);
 }
});
