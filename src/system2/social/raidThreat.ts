export type RaidThreat='CRITICAL'|'HIGH'|'STABLE'|'DEFEATED';
export function raidThreat(hp:number,maxHp:number):RaidThreat{if(hp<=0)return 'DEFEATED';const ratio=hp/Math.max(1,maxHp);return ratio<=.2?'CRITICAL':ratio<=.5?'HIGH':'STABLE';}
export function raidProgress(hp:number,maxHp:number){return Math.max(0,Math.min(1,1-hp/Math.max(1,maxHp)));}
