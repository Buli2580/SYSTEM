#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const scenarios={idle5min:300,tps10min:600,enterexit10:0,continuous15min:900,restart:0};
function fail(message){throw new Error(message);}
function time(v){if(typeof v!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(Date.parse(v)).toISOString()!==v)fail('Invalid canonical UTC timestamp');return Date.parse(v);}
function stats(v){if(!v.length)return null;const s=[...v].sort((a,b)=>a-b);return {count:v.length,mean:v.reduce((a,b)=>a+b,0)/v.length,p50:s[Math.ceil(s.length*.5)-1],p95:s[Math.ceil(s.length*.95)-1],p99:s[Math.ceil(s.length*.99)-1],max:s.at(-1)};}
function analyze(rows){
 if(!Array.isArray(rows)||rows.length<3)fail('Metadata, frames and end required');const m=rows[0],end=rows.at(-1);
 if(m.type!=='metadata'||m.schemaVersion!==1||!Object.hasOwn(scenarios,m.scenario)||!['desktop','android-emulator','android-physical'].includes(m.platform)||!['LOW','MEDIUM','HIGH'].includes(m.preset)||!/^([a-f0-9]{40})$/.test(m.buildSha))fail('Invalid metadata');
 for(const key of ['device','os','conditions'])if(typeof m[key]!=='string'||!m[key].trim())fail('Missing '+key);
 if(end.type!=='end')fail('Missing end');const start=time(m.startedAt),stop=time(end.endedAt);if(stop<start)fail('Inverted bounds');let prior=start;const frames=[],events=[];
 for(const r of rows.slice(1,-1)){const t=time(r.timestamp);if(t<prior||t>stop)fail('Sample outside ordered timestamp bounds');prior=t;if(r.type==='event'){if(!['world-enter','world-exit','restart-restored','crash','anr'].includes(r.name))fail('Invalid event');if(r.durationMs!=null&&(!Number.isFinite(r.durationMs)||r.durationMs<0))fail('Invalid duration');events.push(r);continue;}if(r.type!=='frame'||!Number.isFinite(r.frameMs)||r.frameMs<=0)fail('Invalid frame');for(const key of ['cpuMainMs','cpuRenderMs','gpuMs','pssMb','temperatureC','batteryPercent'])if(r[key]!=null&&(!Number.isFinite(r[key])||r[key]<0))fail('Invalid '+key);if(r.batteryPercent>100)fail('Invalid battery');frames.push(r);}
 if(!frames.length)fail('No frames');const result={schemaVersion:1,metadata:m,endedAt:end.endedAt,durationSeconds:(stop-start)/1000,frameCount:frames.length,fps:1000/(frames.reduce((s,f)=>s+f.frameMs,0)/frames.length),frameMs:stats(frames.map(f=>f.frameMs)),events:{}};
 for(const key of ['cpuMainMs','cpuRenderMs','gpuMs','pssMb','temperatureC','batteryPercent'])result[key]=stats(frames.filter(f=>f[key]!=null).map(f=>f[key]));
 for(const name of ['world-enter','world-exit','restart-restored','crash','anr']){const e=events.filter(e=>e.name===name);result.events[name]={count:e.length,durationMs:stats(e.filter(e=>e.durationMs!=null).map(e=>e.durationMs))};}
 const wallMs=stop-start,recordedMs=frames.reduce((s,f)=>s+f.frameMs,0);
 result.frameCoverageRatio=wallMs>0?recordedMs/wallMs:null;
 const coverageOK=result.frameCoverageRatio!==null&&result.frameCoverageRatio>=0.95&&result.frameCoverageRatio<=1.05;
 let pending=false,pairs=0,paired=true;
 for(const e of events.filter(e=>e.name==='world-enter'||e.name==='world-exit')){if(e.durationMs==null){paired=false;break;}if(e.name==='world-enter'){if(pending){paired=false;break;}pending=true;}else{if(!pending){paired=false;break;}pending=false;pairs++;}}
 const durationOK=result.durationSeconds>=scenarios[m.scenario];
 const actionRecordsOK=m.scenario==='enterexit10'?paired&&!pending&&pairs>=10:m.scenario==='restart'?events.some(e=>e.name==='restart-restored'&&e.durationMs!=null):true;
 result.structuralCriteriaMet=durationOK&&coverageOK&&actionRecordsOK;
 result.scenarioVerified=false;
 result.verificationNote='Manual/runtime proof of actions and state restoration is required; structural coverage does not verify a scenario.';
 result.measurementStatus='RECORDED_DATA_ONLY';return result;
}
function compare(a,b){for(const k of ['platform','device','os','preset','scenario','conditions'])if(a.metadata[k]!==b.metadata[k])fail('Incomparable '+k);return {baselineSha:a.metadata.buildSha,candidateSha:b.metadata.buildSha,fpsDelta:b.fps-a.fps,p95MsDelta:b.frameMs.p95-a.frameMs.p95};}
module.exports={analyze,compare};
if(require.main===module){try{const [input,output]=process.argv.slice(2);if(!input||!output)fail('Usage: node benchmark.cjs recorded.jsonl summary.json');const rows=fs.readFileSync(input,'utf8').split(/\r?\n/).filter(s=>s.trim()).map(JSON.parse);fs.writeFileSync(output,JSON.stringify(analyze(rows),null,2)+'\n');}catch(e){console.error(e.message);process.exitCode=1;}}
