const {test}=require('node:test'),assert=require('node:assert/strict');
const {loader}=require('./gm-test-support.cjs');
function harness(phase,{canEquip=true,advanceResult=true,runEffects=false,foreground=true,reduced=true}={}){
 let equips=0,advances=0,navigations=0,sounds=0,haptics=0,cancelled=0;const cleanups=[];
 const receipt={id:'quest_q',realXp:50,energy:5,distanceMeters:0,skillXp:{WIL:40},skillLevels:[],newTitles:[],beforeLevel:1,afterLevel:2,beforeRank:'E',afterRank:'E',worldUnlocked:false};
 const loot={id:'loot:q',rewardKey:'quest:q',name:'Actual item',rarity:'RARE',slot:'RELIC',stats:{INT:3},requiredLevel:canEquip?1:20};
 const loop={view:{receipt,loot,rewardId:receipt.id,current:0,steps:[{phase,key:phase}]},busy:false,error:null,advance:async()=>{advances++;return advanceResult;},refresh:async()=>{}};
 const system={ready:true,celebration:receipt,player:{realLevel:2,displayName:'Player',avatarEvolution:0},settings:{},inventory:[loot],equipItem:async id=>{assert.equal(id,loot.id);equips++;}};
 const jsx=(type,props)=>({type,props:props??{}});
 const mocks={
  react:{useEffect:f=>{if(runEffects){const cleanup=f();if(cleanup)cleanups.push(cleanup);}},useState:value=>[value,()=>{}],useRef:value=>({current:value})},
  'react/jsx-runtime':{jsx,jsxs:jsx},
  'react-native':{Modal:'Modal',Pressable:'Pressable',ScrollView:'ScrollView',Text:'Text',View:'View',StyleSheet:{create:x=>x}},
  'react-native-reanimated':{default:{View:'Animated'},useSharedValue:value=>({value}),useAnimatedStyle:f=>f(),withTiming:x=>x,cancelAnimation:()=>cancelled++},
  'expo-router':{useRouter:()=>({replace:()=>navigations++})},
  '../state/SystemProvider':{useSystem:()=>system},'../gameLoop/useRewardLoop':{useRewardLoop:()=>loop},
  '../home4/useWorldEnvironment':{useWorldEnvironment:()=>({reduced,foreground})},
  '../visual/assets':{ART:{xp:1,levelUp:2},itemArt:()=>3},'./VisualArt':{ArtThumbnail:'Art'},
  './RewardSummary':{default:'RewardSummary'},'../identity/audio':{playFeedback:()=>sounds++,playSceneMusic:()=>sounds++},'../identity/feedback':{impactAsync:async()=>haptics++,notificationAsync:async()=>haptics++,ImpactFeedbackStyle:{Light:'light',Medium:'medium',Heavy:'heavy'},NotificationFeedbackType:{Success:'success'}},
  '../cards/MilestoneCardOverlay':{default:'Card'},'./CombatImpactOverlay':{default:'Combat'},'../home4/CharacterStage':{default:'Character'},
 };
 const tree=loader(mocks)('components/RewardEventSequence').default();
 function nodes(x){return Array.isArray(x)?x.flatMap(nodes):x&&typeof x==='object'?[x,...nodes(x.props?.children)]:[];}
 function text(x){return Array.isArray(x)?x.map(text).join(''):x&&typeof x==='object'?text(x.props?.children):typeof x==='string'?x:'';}
 const button=label=>nodes(tree).find(n=>n.type==='Pressable'&&text(n)===label);
 return {tree,button,text:text(tree),nodes:nodes(tree),counts:()=>({equips,advances,navigations}),feedback:()=>({sounds,haptics,cancelled}),cleanup:()=>cleanups.forEach(f=>f())};
}
test('real reward UI compares gameplay loot and double equip invokes the existing API once',async()=>{
 const h=harness('EQUIP');assert.match(h.text,/Actual item/);assert.match(h.text,/POWER Δ/);
 const button=h.button('WYPOSAŻ');button.props.onPress();button.props.onPress();await new Promise(setImmediate);
 assert.deepEqual(h.counts(),{equips:1,advances:1,navigations:0});
});
test('unmet item level keeps loot without offering a dead equip button',()=>{
 const h=harness('EQUIP',{canEquip:false});assert.equal(h.button('WYPOSAŻ'),undefined);assert.ok(h.button('ZACHOWAJ'));
});
test('rarity reveal uses the actual saved item',()=>{const h=harness('LOOT_REWARD');assert.match(h.text,/RARE/);assert.match(h.text,/Actual item/);});
test('next mission navigation waits for durable acknowledgement',async()=>{
 for(const advanceResult of [false,true]){const h=harness('NEXT_QUEST',{advanceResult});h.button('WRÓĆ DO ŚWIATA').props.onPress();await new Promise(setImmediate);assert.equal(h.counts().navigations,advanceResult?1:0);}
});
test('world reward preserves character and milestone presentation',()=>{
 const h=harness('WORLD_REACTION');assert.ok(h.nodes.some(n=>n.type==='Character'));assert.ok(h.button('KARTA OSIĄGNIĘCIA'));
});

test('reward feedback respects background and reduce motion and cleans up animation',()=>{
 const background=harness('XP_REWARD',{runEffects:true,foreground:false,reduced:false});
 assert.deepEqual(background.feedback(),{sounds:0,haptics:0,cancelled:0});
 const reduced=harness('LOOT_REWARD',{runEffects:true});assert.equal(reduced.feedback().haptics,0);
 const foreground=harness('LEVEL_UP',{runEffects:true,reduced:false});assert.equal(foreground.feedback().haptics,1);
 foreground.cleanup();assert.equal(foreground.feedback().cancelled,1);
});
