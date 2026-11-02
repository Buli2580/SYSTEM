/** SYSTEM_WORLD_BRIDGE_V1: isolated transport contract, never a reward API. */
export const WORLD_PROTOCOL = 'SYSTEM_WORLD_BRIDGE_V1' as const;
export const MAX_WORLD_MESSAGE_BYTES = 16_384;
export type WorldQuality = 'LOW' | 'MEDIUM' | 'HIGH';
export type WorldIdentity = {playerId: string; profileGeneration: number; sessionId: string};
export type WorldCommand = {commandId: string; expectedRevision: number; activeSessionId: string} & (
  {action: 'REQUEST_SNAPSHOT'} | {action: 'OPEN_PANEL'; panel: 'QUESTS'|'CHARACTER'|'INVENTORY'} |
  {action: 'SET_QUALITY'; quality: WorldQuality});
export type WorldSnapshot = {displayName:string; realLevel:number; realXp:number;
  skills:Record<'STR'|'VIT'|'INT'|'WIL'|'CHA'|'CRE'|'RES',number>; equippedItemIds:string[];
  domainLevel:number; activeQuestId:string|null};
export type WorldRejectCode = 'INVALID_MESSAGE'|'STALE_SESSION'|'STALE_REVISION'|'REPLAY_CONFLICT'|
  'IN_DOUBT'|'TIMEOUT'|'HOST_ERROR'|'DISPOSED'|'PAUSED';
type Lifecycle = {reason:'USER'|'BACKGROUND'|'ACCOUNT_CHANGE'|'TIMEOUT'};
export type WorldPayloads = {
  WORLD_INIT:{hostBuildSha:string;quality:WorldQuality}; WORLD_SNAPSHOT:WorldSnapshot;
  WORLD_DIRECTIVE:{mode:'NORMAL'|'RECOVERY'|'VICTORY'|'THREAT';message:string};
  WORLD_COMMAND:WorldCommand; WORLD_COMMAND_ACK:{commandId:string;result:'APPLIED'};
  WORLD_COMMAND_REJECT:{commandId:string;code:WorldRejectCode};
  WORLD_PAUSE:Lifecycle; WORLD_RESUME:Lifecycle; WORLD_DISPOSE:Lifecycle;
};
export type WorldMessageType = keyof WorldPayloads;
export type WorldEnvelope<K extends WorldMessageType> = WorldIdentity & {
  protocolVersion:typeof WORLD_PROTOCOL; type:K; messageId:string; timestamp:string;
  stateRevision:number; payload:WorldPayloads[K];
};
export type WorldMessage = {[K in WorldMessageType]:WorldEnvelope<K>}[WorldMessageType];
export type WorldDirection = 'HOST_TO_UNITY'|'UNITY_TO_HOST';
const quality = ['LOW','MEDIUM','HIGH'];
const rejects = ['INVALID_MESSAGE','STALE_SESSION','STALE_REVISION','REPLAY_CONFLICT','IN_DOUBT','TIMEOUT','HOST_ERROR','DISPOSED','PAUSED'];
function requireValue(condition:unknown, code='SCHEMA'):asserts condition {if(!condition)throw new Error(code);}
function object(value:unknown):Record<string,unknown> {requireValue(value!==null&&typeof value==='object'&&!Array.isArray(value));return value as Record<string,unknown>;}
function keys(value:Record<string,unknown>, expected:string[]) {const actual=Object.keys(value);requireValue(actual.length===expected.length&&actual.every(k=>expected.includes(k)));}
function integer(value:unknown, min=0) {requireValue(typeof value==='number'&&Number.isInteger(value)&&value>=min&&value<=2_147_483_647);}
function id(value:unknown) {requireValue(typeof value==='string'&&/^[A-Za-z0-9_.:-]{1,96}$/.test(value));}
function oneOf(value:unknown, options:string[]) {requireValue(typeof value==='string'&&options.includes(value));}
/** Counts Unicode scalar UTF8 bytes without requiring a Node/DOM encoder in RN. */
export function worldUtf8Bytes(value:string):number {
  let bytes=0;
  for(let i=0;i<value.length;i++) {const c=value.charCodeAt(i);
    if(c>=0xD800&&c<=0xDBFF){const next=value.charCodeAt(++i);requireValue(next>=0xDC00&&next<=0xDFFF,'UNICODE');bytes+=4;}
    else {requireValue(c<0xDC00||c>0xDFFF,'UNICODE');bytes+=c<128?1:c<2048?2:3;}
  }return bytes;
}
function text(value:unknown,max:number) {requireValue(typeof value==='string'&&value.length<=max);worldUtf8Bytes(value);requireValue(!/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value));}
function validate(value:unknown,direction?:WorldDirection):WorldMessage {
  const e=object(value);keys(e,['protocolVersion','type','messageId','timestamp','playerId','profileGeneration','sessionId','stateRevision','payload']);
  requireValue(e.protocolVersion===WORLD_PROTOCOL,'VERSION');
  id(e.messageId);id(e.playerId);id(e.sessionId);integer(e.profileGeneration);integer(e.stateRevision);
  requireValue(typeof e.timestamp==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(e.timestamp));
  const parsed=Date.parse(e.timestamp as string);requireValue(Number.isFinite(parsed)&&new Date(parsed).toISOString()===e.timestamp);
  const p=object(e.payload);
  switch(e.type){
    case 'WORLD_INIT':keys(p,['hostBuildSha','quality']);requireValue(typeof p.hostBuildSha==='string'&&/^[a-f0-9]{40}$/.test(p.hostBuildSha));oneOf(p.quality,quality);break;
    case 'WORLD_SNAPSHOT': {
      keys(p,['displayName','realLevel','realXp','skills','equippedItemIds','domainLevel','activeQuestId']);text(p.displayName,80);integer(p.realLevel,1);integer(p.realXp);integer(p.domainLevel,1);
      const skills=object(p.skills);keys(skills,['STR','VIT','INT','WIL','CHA','CRE','RES']);Object.values(skills).forEach(v=>integer(v,1));
      requireValue(Array.isArray(p.equippedItemIds)&&p.equippedItemIds.length<=12);p.equippedItemIds.forEach(id);requireValue(new Set(p.equippedItemIds).size===p.equippedItemIds.length);
      if(p.activeQuestId!==null)id(p.activeQuestId);break;
    }
    case 'WORLD_DIRECTIVE':keys(p,['mode','message']);oneOf(p.mode,['NORMAL','RECOVERY','VICTORY','THREAT']);text(p.message,240);break;
    case 'WORLD_COMMAND': {
      oneOf(p.action,['REQUEST_SNAPSHOT','OPEN_PANEL','SET_QUALITY']);
      keys(p,['commandId','expectedRevision','activeSessionId','action',...(p.action==='OPEN_PANEL'?['panel']:p.action==='SET_QUALITY'?['quality']:[])]);
      id(p.commandId);integer(p.expectedRevision);id(p.activeSessionId);requireValue(p.activeSessionId===e.sessionId);
      if(p.action==='OPEN_PANEL')oneOf(p.panel,['QUESTS','CHARACTER','INVENTORY']);
      if(p.action==='SET_QUALITY')oneOf(p.quality,quality);break;
    }
    case 'WORLD_COMMAND_ACK':keys(p,['commandId','result']);id(p.commandId);requireValue(p.result==='APPLIED');break;
    case 'WORLD_COMMAND_REJECT':keys(p,['commandId','code']);id(p.commandId);oneOf(p.code,rejects);break;
    case 'WORLD_PAUSE':case 'WORLD_RESUME':case 'WORLD_DISPOSE':keys(p,['reason']);oneOf(p.reason,['USER','BACKGROUND','ACCOUNT_CHANGE','TIMEOUT']);break;
    default:throw new Error('TYPE');
  }
  if(direction)requireValue((direction==='UNITY_TO_HOST')===(e.type==='WORLD_COMMAND'),'DIRECTION');
  return value as WorldMessage;
}
export function decodeWorldMessage(raw:string,direction?:WorldDirection):WorldMessage {
  requireValue(typeof raw==='string');requireValue(worldUtf8Bytes(raw)<=MAX_WORLD_MESSAGE_BYTES,'SIZE');
  let parsed:unknown;try{parsed=JSON.parse(raw);}catch{throw new Error('JSON');}
  rejectAmbiguousJson(raw);
  return validate(parsed,direction);
}
/** Built-in parser checked syntax already; inspect member tokens before their duplicate values can be hidden. */
function rejectAmbiguousJson(raw:string) {
  let i=0;
  const ws=()=>{while(/\s/.test(raw[i]??'')&&i<raw.length)i++;};
  const string=()=>{const start=i++;while(i<raw.length){if(raw[i]==='\\'){i+=2;continue;}if(raw[i++]==='"')break;}return JSON.parse(raw.slice(start,i)) as string;};
  const visit=(depth:number)=>{
    requireValue(depth<=32,'DEPTH');ws();
    if(raw[i]==='{') {i++;ws();const seen=new Set<string>();if(raw[i]==='}'){i++;return;}
      while(i<raw.length){ws();const key=string();requireValue(!seen.has(key),'DUPLICATE');seen.add(key);ws();i++;visit(depth+1);ws();if(raw[i++]==='}')return;}
    } else if(raw[i]==='['){i++;ws();if(raw[i]===']'){i++;return;}while(i<raw.length){visit(depth+1);ws();if(raw[i++]===']')return;}}
    else if(raw[i]==='"')string();else while(i<raw.length&&!/[\s,}\]]/.test(raw[i]))i++;
  };
  visit(1);
}
export function encodeWorldMessage(message:WorldMessage):string {
  validate(message);const raw=JSON.stringify(message);requireValue(worldUtf8Bytes(raw)<=MAX_WORLD_MESSAGE_BYTES,'SIZE');return raw;
}
/** Semantic fingerprint, deliberately independent of incoming JSON key order. */
export function commandFingerprint(command:WorldCommand):string {
  return JSON.stringify([command.commandId,command.expectedRevision,command.activeSessionId,command.action,
    command.action==='OPEN_PANEL'?command.panel:command.action==='SET_QUALITY'?command.quality:null]);
}
