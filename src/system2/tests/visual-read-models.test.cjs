const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const load=require('./gm-test-support.cjs').loader();
const read=()=>load('presentation/visualReadModels');
function fixture(){return {player:load('core/progression').createNewPlayer(),ready:true,error:null,activeQuestId:null,
completedQuestIds:[],failedQuestIds:[],inventory:[],domain:null,daily:null,story:null,progression:null,titles:['UNAWAKENED'],
awakeningCompleted:false,worldUnlocked:false,aiGameMaster:null,aiLoading:false,aiError:null,recentAttempts:[],
recentActivity:[],goals:[],journeys:[],socialSessions:{},gameLoop:{state:load('gameLoop/stateMachine').INITIAL_GAME_LOOP_STATE}};}
test('every file route keeps its baseline target and five tabs resolve',()=>{
 const {EXISTING_ROUTES,MAIN_TAB_ROUTES}=load('presentation/routes'),root=path.resolve(__dirname,'../../..');
 const names=fs.readdirSync(path.join(root,'src/app')).filter(x=>x.endsWith('.tsx')&&x!=='_layout.tsx');
 assert.deepEqual(Object.keys(EXISTING_ROUTES).sort(),names.map(x=>x==='index.tsx'?'/':'/'+x.slice(0,-4)).sort());
 for(const [route,target] of Object.entries(EXISTING_ROUTES)){
 const source=fs.readFileSync(path.join(root,'src/app',route==='/'?'index.tsx':route.slice(1)+'.tsx'),'utf8');
 if(target==='REDIRECT_HOME'){assert.ok(source.includes('<Redirect href="/"'));continue;}
 assert.ok(source.includes('../system2/screens/'+target),route);
 assert.ok(fs.existsSync(path.join(root,'src/system2/screens',target+'.tsx')),target);
 }
 const nav=fs.readFileSync(path.join(root,'src/system2/components/BottomNavigation.tsx'),'utf8');
 for(const route of Object.values(MAIN_TAB_ROUTES))assert.ok(nav.includes("'"+route+"'"));
});
test('HOME and CHARACTER preserve profile XP energy inventory rank evolution without writes',()=>{
 const s=fixture();Object.assign(s.player,{totalRealXp:1234,realXp:19,gameEnergy:37,streak:9,avatarEvolution:3});
 const before=JSON.stringify(s),r=read(),home=r.selectHomeReadModel(s),character=r.selectCharacterReadModel(s);
 assert.equal(home.totalXp,1234);assert.equal(home.xp,19);assert.equal(home.energy,37);assert.equal(home.streak,9);
 assert.equal(character.profile,s.player);assert.equal(character.inventory,s.inventory);
 assert.equal(character.rank,s.player.rank);assert.equal(character.evolution,3);assert.equal(JSON.stringify(s),before);
});
test('loading and failure remain visible instead of presenting an initialized player',()=>{
 const s=fixture();s.ready=false;s.error='SQLite unavailable';const r=read();
 for(const select of [r.selectHomeReadModel,r.selectQuestReadModel,r.selectCharacterReadModel,r.selectWorldReadModel,r.selectSocialReadModel]){
 const result=select(s);assert.equal(result.ready,false);assert.equal(result.error,s.error);}
});
test('QUEST reuses canonical availability verification and reward definitions',()=>{
 const s=fixture(),catalog=load('quests/catalog'),availability=load('quests/availability').questAvailability;
 const before=JSON.stringify(s),q=read().selectQuestReadModel(s);assert.ok(q.missions.length);
 for(const item of q.missions){
 assert.equal(JSON.stringify(item.access),JSON.stringify(availability(item.quest.id,{completedQuestIds:[],activeQuestId:null,daily:null,bossAccessible:false})));
 assert.equal(JSON.stringify(item.rewards),JSON.stringify(catalog.getQuest(item.quest.id).rewards));
 assert.equal(item.conditions,item.quest.verification);}
 assert.equal(JSON.stringify(s),before);
});
test('active quest agrees with Game Loop and unknown IDs do not invent missions',()=>{
 const s=fixture();s.activeQuestId='awakening_observe_v1';
 s.gameLoop.state={phase:'ACTIVE',questId:s.activeQuestId,rewardId:null,recoverable:false};
 const r=read();assert.equal(r.selectHomeReadModel(s).activeMission.id,s.activeQuestId);
 assert.equal(r.selectQuestReadModel(s).activeMission.access.status,'ACTIVE');
 assert.equal(r.selectHomeReadModel(s).loop.phase,'ACTIVE');
 s.activeQuestId='missing';assert.equal(r.selectHomeReadModel(s).activeMission,null);assert.equal(r.selectQuestReadModel(s).activeMission,null);
});
test('Daily clock anomaly keeps locks; Weekly remains a bonus and unknown assignments disappear',()=>{
 const s=fixture(),catalog=load('quests/catalog');s.completedQuestIds=catalog.AWAKENING_QUESTS.map(q=>q.id);s.awakeningCompleted=true;
 s.daily={questIds:['daily:2026-10-04:walk_protocol_1','missing'],clockAnomaly:true,weeklyCompleted:2,weeklyTarget:5};
 const result=read().selectQuestReadModel(s);assert.equal(result.weekly,s.daily);
 assert.ok(result.missions.every(x=>x.quest.id!=='missing'));
 assert.ok(result.availableMissions.every(x=>x.quest.category!=='WEEKLY'));
 const dailyRows=result.missions.filter(x=>x.quest.category==='DAILY');assert.equal(dailyRows.length,1);
 for(const item of dailyRows)assert.equal(item.access.code,'DAILY_UNAVAILABLE');
});
test('WORLD preserves unlock and tracking facts without GPS start or invented online status',()=>{
 const s=fixture(),r=read();s.player.discoveredSectors=7;s.player.totalDistanceMeters=1200;
 const view=r.selectWorldReadModel(s);assert.equal(view.unlocked,false);assert.equal(view.discoveredSectors,7);
 assert.equal(view.tracking,null);assert.equal(view.totalDistanceMeters,1200);assert.ok(!('online' in view));
 const tracking={status:'DENIED',fix:null,error:'permission',sectorIds:['real-sector'],signal:null};
 assert.equal(r.selectWorldReadModel(s,tracking).tracking,tracking);
});
test('SOCIAL read does not create sessions members rewards or fake online availability',()=>{
 const s=fixture(),r=read(),before=JSON.stringify(s),result=r.selectSocialReadModel(s);
 assert.equal(Object.keys(result.localSessions).length,0);assert.equal(result.cloud.status,'UNKNOWN');
 assert.equal(result.cloud.userId,null);assert.equal(result.cloudFeatures.GUILD,'UNCONFIRMED');
 assert.equal(result.localMatchmakingAvailable,false);assert.equal(JSON.stringify(s),before);
});
test('SOCIAL uses auth observation without exposing tokens or promising backend availability',()=>{
 const s=fixture(),r=read(),session={user:{id:'real-user'},accessToken:'never-expose',refreshToken:'never-expose',expiresAt:Date.now()+10000};
 const result=r.selectSocialReadModel(s,{loaded:true,session,error:null});
 assert.equal(result.cloud.status,'AUTHENTICATED');assert.equal(result.cloud.userId,'real-user');
 assert.equal(result.cloudFeatures.PVP,'REQUIRES_API_CHECK');assert.ok(!JSON.stringify(result).includes('never-expose'));
 assert.equal(r.selectSocialReadModel(s,{loaded:true,session:null,error:null}).cloud.status,'SIGNED_OUT');
 assert.equal(r.selectSocialReadModel(s,{loaded:true,session:null,error:'network'}).cloud.status,'ERROR');
});

test('QUEST projects real checkpoint progress and never attributes it to another mission',()=>{
 const s=fixture();s.activeQuestId='awakening_observe_v1';
 const checkpoint={questId:s.activeQuestId,durationSeconds:120,distanceMeters:0,verificationScore:100,extendedGoal:false,updatedAt:'2026-10-04T12:00:00Z'};
 const result=read().selectQuestReadModel(s,{checkpoint});
 assert.equal(result.activeMission.progress,120);assert.equal(result.activeMission.progressTarget,300);
 assert.equal(result.activeMission.progressSource,'CHECKPOINT');assert.equal(result.activeMission.checkpoint,checkpoint);
 assert.ok(result.missions.filter(x=>x.quest.id!==checkpoint.questId).every(x=>x.checkpoint===null&&x.progressSource==='DEFINITION'));
});
