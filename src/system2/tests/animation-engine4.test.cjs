const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=process.env.SYSTEM_PROJECT_ROOT??path.resolve(__dirname,'../../..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('Animation Engine 4.0 is mounted once at app root',()=>{
 const layout=read('src/app/_layout.tsx');
 assert.match(layout,/AnimationEngine4Provider/);
 assert.match(layout,/SystemRouteMotion/);
 assert.match(layout,/animation:\s*['"]none['"]/);
});

test('first onboarding always runs FIRST_AWAKENING boot',()=>{
 const onboarding=read('src/system2/screens/OnboardingScreen.tsx');
 assert.match(onboarding,/SystemBootSequence[^>]*firstRun/);
});

test('boot sequence owns awakening audio and cinematic beats',()=>{
 const boot=read('src/system2/components/SystemBootSequence.tsx');
 assert.match(boot,/launchBeats/);
 assert.match(boot,/FIRST_AWAKENING/);
 assert.match(boot,/playAudioTheme\(resolved===['"]FIRST_AWAKENING['"]\?['"]AWAKENING['"]:['"]HOME['"]\)/);
 assert.match(boot,/POMIŃ INTRO/);
});

test('LaunchGate remains mounted for returning sessions',()=>{
 const layout=read('src/app/_layout.tsx');
 const gate=read('src/system2/components/LaunchGate.tsx');
 assert.match(layout,/<LaunchGate\s*\/>/);
 assert.match(gate,/SystemBootSequence/);
});

test('Engine 4.0 respects reduced-motion without removing content instantly',()=>{
 const engine=read('src/system2/presentation/animationEngine4.ts');
 const boot=read('src/system2/components/SystemBootSequence.tsx');
 assert.match(engine,/reduced\?Math\.max\(1500/);
 assert.match(boot,/reducedMotion\?1800/);
});

test('global surfaces are wired to Engine 4.0',()=>{
 for(const rel of [
  'src/system2/components/SystemPage.tsx',
  'src/system2/components/Action.tsx',
  'src/system2/components/BottomNavigation.tsx',
  'src/system2/components/SystemAmbientBackground.tsx',
  'src/system2/components/SystemEventOverlay.tsx',
  'src/system2/components/CombatImpactOverlay.tsx',
  'src/system2/cards/MilestoneCardOverlay.tsx',
 ]){
  const source=read(rel);
  assert.match(source,/Animation4|AnimationEngine4/,'missing Engine 4.0 in '+rel);
 }
});

test('legacy motion adapter has no second timing table',()=>{
 const legacy=read('src/system2/presentation/motion.ts');
 assert.doesNotMatch(legacy,/ANIMATION4\.durations/);
 assert.match(legacy,/MOTION_4/);
});
