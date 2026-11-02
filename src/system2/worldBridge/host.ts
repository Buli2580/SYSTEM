import {commandFingerprint,decodeWorldMessage,WORLD_PROTOCOL,type WorldCommand,type WorldEnvelope,type WorldIdentity,type WorldRejectCode} from './protocol';

export type JournalRecord={fingerprint:string;state:'PENDING'|'APPLIED'};
/** Implement claim atomically and durably BEFORE resolving. Pending records must not be evicted/retried automatically. */
export interface WorldCommandJournal {
  claim(key:string,fingerprint:string):Promise<{claimed:boolean;record:JournalRecord}>;
  complete(key:string,fingerprint:string):Promise<void>;
}
export type WorldHostOptions=WorldIdentity & {stateRevision:number;now?:()=>number;timeoutMs?:number;
  journal:WorldCommandJournal;
  /** Resolves only after the allowed host action commits. Check isCurrent before any delayed effect. No reward operations. */
  execute:(command:WorldCommand,isCurrent:()=>boolean)=>Promise<'APPLIED'|'CANCELLED'>};
type Reply=WorldEnvelope<'WORLD_COMMAND_ACK'>|WorldEnvelope<'WORLD_COMMAND_REJECT'>;

/** Not mounted in SystemProvider: integration must explicitly supply host actions and a durable atomic journal. */
export function createWorldHost(options:WorldHostOptions) {
  const identity={playerId:options.playerId,profileGeneration:options.profileGeneration,sessionId:options.sessionId};
  const now=options.now??Date.now, timeoutMs=options.timeoutMs??10_000;
  if(!Number.isInteger(options.stateRevision)||options.stateRevision<0||options.stateRevision>2_147_483_647||!Number.isFinite(timeoutMs)||timeoutMs<1)throw new Error('HOST_CONFIG');
  let disposed=false,paused=false,revision=options.stateRevision,sequence=0,generation=0;
  function reply(commandId:string,code?:WorldRejectCode):Reply {
    const common={protocolVersion:WORLD_PROTOCOL,...identity,messageId:`host:${++sequence}`,timestamp:new Date(now()).toISOString(),stateRevision:revision};
    return code?{...common,type:'WORLD_COMMAND_REJECT',payload:{commandId,code}}:{...common,type:'WORLD_COMMAND_ACK',payload:{commandId,result:'APPLIED'}};
  }
  return {
    pause(){paused=true;generation++;},resume(){if(!disposed)paused=false;},dispose(){disposed=true;generation++;},
    updateRevision(value:number){if(!Number.isInteger(value)||value<revision||value>2_147_483_647)throw new Error('REVISION');revision=value;},
    async receive(raw:string):Promise<Reply>{
      let message:WorldEnvelope<'WORLD_COMMAND'>;
      try {const decoded=decodeWorldMessage(raw,'UNITY_TO_HOST');if(decoded.type!=='WORLD_COMMAND')throw new Error('DIRECTION');message=decoded;}
      catch{return reply('invalid','INVALID_MESSAGE');}
      const c=message.payload;
      if(disposed)return reply(c.commandId,'DISPOSED');if(paused)return reply(c.commandId,'PAUSED');
      if(message.playerId!==identity.playerId||message.profileGeneration!==identity.profileGeneration||message.sessionId!==identity.sessionId)return reply(c.commandId,'STALE_SESSION');
      if(Math.abs(now()-Date.parse(message.timestamp))>300_000)return reply(c.commandId,'INVALID_MESSAGE');
      if(message.stateRevision!==revision||c.expectedRevision!==revision)return reply(c.commandId,'STALE_REVISION');
      const startedGeneration=generation,admittedRevision=revision;
      const key=JSON.stringify([identity.playerId,identity.profileGeneration,identity.sessionId,c.commandId]);
      const fingerprint=commandFingerprint(c);
      let timer:ReturnType<typeof setTimeout>|undefined;
      let timedOut=false;
      const current=()=>!disposed&&!paused&&!timedOut&&generation===startedGeneration&&revision===admittedRevision;
      const stale=():WorldRejectCode=>disposed?'DISPOSED':paused?'PAUSED':revision!==admittedRevision?'STALE_REVISION':'STALE_SESSION';
      const work=async():Promise<Reply>=>{
        const claim=await options.journal.claim(key,fingerprint);
        if(!current())return reply(c.commandId,timedOut?'TIMEOUT':stale());
        if(claim.record.fingerprint!==fingerprint)return reply(c.commandId,'REPLAY_CONFLICT');
        if(!claim.claimed)return claim.record.state==='APPLIED'?reply(c.commandId):reply(c.commandId,'IN_DOUBT');
        if(message.stateRevision!==revision||c.expectedRevision!==revision)return reply(c.commandId,'STALE_REVISION');
        const result=await options.execute(c,current);
        if(result!=='APPLIED')return reply(c.commandId,!current()?(timedOut?'TIMEOUT':stale()):'HOST_ERROR');
        // Persist completed effects even if caller disappeared; never deliver a stale ACK.
        await options.journal.complete(key,fingerprint);
        if(!current())return reply(c.commandId,timedOut?'TIMEOUT':stale());
        return reply(c.commandId);
      };
      try{return await Promise.race([work(),new Promise<Reply>(resolve=>{timer=setTimeout(()=>{timedOut=true;resolve(reply(c.commandId,'TIMEOUT'));},timeoutMs);})]);}
      catch{return reply(c.commandId,'HOST_ERROR');}
      finally{if(timer!==undefined)clearTimeout(timer);}
    },
  };
}
