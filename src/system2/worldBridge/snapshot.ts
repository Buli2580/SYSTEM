import type {PlayerProfile} from '../core/types';
import {encodeWorldMessage,WORLD_PROTOCOL,type WorldSnapshot} from './protocol';

type SnapshotSource={
  player:Pick<PlayerProfile,'id'|'displayName'|'realLevel'|'realXp'|'stats'>;
  inventory:readonly {id:string;equipped?:boolean}[];
  domain:{playerId:string;level:number}|null;
  activeQuestId:string|null;
};

/** New read-only projection. No storage, GPS, raw avatar photo, age, tokens or history cross the boundary. */
export function selectWorldSnapshot(source:SnapshotSource):WorldSnapshot {
  if(!source.domain)throw new Error('SNAPSHOT_DOMAIN_NOT_READY');
  if(source.domain.playerId!==source.player.id)throw new Error('SNAPSHOT_PROFILE');
  const skills={} as WorldSnapshot['skills'];
  for(const key of ['STR','VIT','INT','WIL','CHA','CRE','RES'] as const)skills[key]=source.player.stats[key].level;
  const snapshot:WorldSnapshot={displayName:source.player.displayName,realLevel:source.player.realLevel,
    realXp:source.player.realXp,skills,equippedItemIds:source.inventory.filter(item=>item.equipped===true).map(item=>item.id),
    domainLevel:source.domain.level,activeQuestId:source.activeQuestId};
  // Validate the actual payload rather than silently clamping corrupted canonical values.
  encodeWorldMessage({protocolVersion:WORLD_PROTOCOL,type:'WORLD_SNAPSHOT',messageId:'projection',timestamp:'2000-01-01T00:00:00.000Z',
    playerId:source.player.id,profileGeneration:0,sessionId:'projection',stateRevision:0,payload:snapshot});
  return snapshot;
}
