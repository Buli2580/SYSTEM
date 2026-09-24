export type PvpMetric='QUESTS'|'REAL_XP';
export type PvpChallenge={
 id:string;creatorId:string;opponentId?:string;metric:PvpMetric;target:number;
 startsAt:string;endsAt:string;status:'OPEN'|'ACTIVE'|'COMPLETE'|'EXPIRED';
 creatorScore:number;opponentScore:number;
};
export function pvpProgress(c:PvpChallenge){
 const creator=Math.min(100,Math.round(c.creatorScore/Math.max(1,c.target)*100));
 const opponent=Math.min(100,Math.round(c.opponentScore/Math.max(1,c.target)*100));
 return{creator,opponent,complete:c.creatorScore>=c.target||c.opponentScore>=c.target};
}
export function safePvpTarget(metric:PvpMetric,target:number){
 const cap=metric==='QUESTS'?100:100000;
 return Math.max(1,Math.min(cap,Math.floor(target)));
}
