const { test } = require('node:test');
const assert = require('node:assert/strict');
const loader = require('./mobile-loader.cjs');
class CloudRequestError extends Error { constructor(code) { super(code); this.code = code; } }

function harness({ session = { user: { id: 'user-a' } }, rows = [], failure, moveFailure } = {}) {
  const calls = [];
  const load = loader({
    '@react-native-async-storage/async-storage': { getItem: async () => 'install-test' },
    '../storage/database': {
      ensureCloudUserBinding: async id => calls.push(['bind',id]),
      backfillCloudOutbox: async () => calls.push(['backfill']),
      cloudOutboxStats: async () => ({ pending: 0, failed: 0 }),
      listPendingCloudOutbox: async () => rows,
      markCloudOutboxSynced: async key => calls.push(['synced', key]),
      markCloudOutboxAttempt: async key => calls.push(['failed', key]),
    },
    './auth': { getValidSession: async () => session },
    './move': { reconcileRecentMoveContributions: async () => { calls.push(['reconcile']); if(moveFailure) throw moveFailure; } },
    './http': { CloudRequestError },
    './state': {
      submitSyncEvent: async input => calls.push(['submit',input.eventKey]),
      processPendingSyncEvents: async limit => { calls.push(['process',limit]); if(failure) throw failure; },
    },
  });
  return { sync: load('cloud/sync'), calls };
}
test('empty local outbox still retries remote RECEIVED events after account binding', async () => {
  const h=harness();const result=await h.sync.flushCloudOutbox(50);
  assert.deepEqual(h.calls,[['bind','user-a'],['backfill'],['process',50],['reconcile']]);
  assert.equal(result.sent,0);
});
test('uploaded events are marked sent before remote processing, never local XP writes', async () => {
  const h=harness({rows:[{event_key:'verified:test',entity_type:'VERIFIED_EVENT',payload:'{}'}]});
  const result=await h.sync.flushCloudOutbox();
  assert.equal(result.sent,1);
  assert.deepEqual(h.calls.map(c=>c[0]),['bind','backfill','submit','synced','process','reconcile']);
});
test('offline session never invokes cloud processing', async () => {
  const h=harness({session:null});const result=await h.sync.flushCloudOutbox();
  assert.equal(result.authenticated,false);assert.deepEqual(h.calls,[]);
});
test('Online 0.3 missing RPC is tolerated, other processor failures remain visible', async () => {
  await harness({failure:new CloudRequestError('PGRST202')}).sync.flushCloudOutbox();
  await assert.rejects(harness({failure:new Error('offline')}).sync.flushCloudOutbox(),/offline/);
});
test('status and retry RPCs use signed-in token and cannot select another owner', async () => {
  const calls=[];
  const load=loader({ './auth':{getValidSession:async()=>({accessToken:'test-token'})},
    './http':{cloudRequest:async(...args)=>{calls.push(args);return args[0].endsWith('get_sync_status')?[{processed:1}]:1;}} });
  const api=load('cloud/state');assert.equal(await api.processPendingSyncEvents(10),1);
  assert.equal((await api.getRemoteSyncStatus()).processed,1);
  assert.equal(calls[0][2],'test-token');assert.deepEqual(JSON.parse(calls[0][1].body),{p_limit:10});
});


test('MOVE cloud scores remain pending without accepted server proof',async()=>{
 const calls=[];
 const load=loader({
   './auth':{getValidSession:async()=>({accessToken:'auth-token'})},
   './http':{cloudRequest:async(endpoint,opts)=>{
     calls.push(endpoint);
     if(endpoint.endsWith('/get_my_move_groups'))return [{
       id:'family-group',kind:'FAMILY',name:'Family',role:'PARENT',
       member_count:2,total_minutes:0,active_days:0,
     }];
     if(endpoint.endsWith('/get_my_move_verified_source'))return [];
     throw new Error('Untrusted MOVE cloud scoring requested: '+endpoint);
   }},
 });
 const outcome=await load('cloud/move').publishVerifiedMoveToGroups({
   kinds:['FAMILY'],questId:'move_walk_10',dayKey:'2026-09-23',
 });
 assert.equal(outcome.pending,1);
 assert.equal(outcome.submitted,0);
 assert.equal(calls.some(c=>c.includes('submit_')),false);
});

test('MOVE cloud scoring only sends the accepted server evidence identifier',async()=>{
 const calls=[];
 const load=loader({
   './auth':{getValidSession:async()=>({accessToken:'auth-token'})},
   './http':{cloudRequest:async(endpoint,opts)=>{
     const body=JSON.parse(opts.body);
     calls.push([endpoint,body]);
     if(endpoint.endsWith('/get_my_move_groups'))return [{
       id:'family-group',kind:'FAMILY',name:'Family',role:'PARENT',
       member_count:2,total_minutes:0,active_days:0,
     }];
     if(endpoint.endsWith('/get_my_move_verified_source'))
       return[{event_key:'verified:server-approved-event'}];
     if(endpoint.endsWith('/submit_verified_move_contribution'))return 10;
     throw new Error('Wrong scoring endpoint: '+endpoint);
   }},
 });
 const outcome=await load('cloud/move').publishVerifiedMoveToGroups({
   kinds:['FAMILY'],questId:'move_walk_10',dayKey:'2026-09-23',
 });
 assert.equal(outcome.submitted,1);
 const claim=calls.find(([route])=>route.endsWith('/submit_verified_move_contribution'));
 assert.deepEqual(claim[1],{
   p_group:'family-group',p_evidence_event_key:'verified:server-approved-event',
   p_move_quest_id:'move_walk_10',p_day_key:'2026-09-23',
 });
 assert.equal(calls.some(([route])=>route.endsWith('/submit_move_contribution')),false);
});

test('optional MOVE group recovery failures never erase successful core sync',async()=>{
 const h=harness({moveFailure:new Error('MOVE server temporarily unavailable')});
 const result=await h.sync.flushCloudOutbox();
 assert.equal(result.authenticated,true);
 assert.deepEqual(h.calls.map(c=>c[0]),['bind','backfill','process','reconcile']);
});
