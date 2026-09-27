const { test } = require('node:test');
const assert = require('node:assert/strict');
const loader = require('./mobile-loader.cjs');
class CloudRequestError extends Error { constructor(code) { super(code); this.code = code; } }

function harness({ session = { user: { id: 'user-a' } }, rows = [], failure } = {}) {
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
  assert.deepEqual(h.calls,[['bind','user-a'],['backfill'],['process',50]]);
  assert.equal(result.sent,0);
});
test('uploaded events are marked sent before remote processing, never local XP writes', async () => {
  const h=harness({rows:[{event_key:'verified:test',entity_type:'VERIFIED_EVENT',payload:'{}'}]});
  const result=await h.sync.flushCloudOutbox();
  assert.equal(result.sent,1);
  assert.deepEqual(h.calls.map(c=>c[0]),['bind','backfill','submit','synced','process']);
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
