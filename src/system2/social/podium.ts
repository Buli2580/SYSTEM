export type PodiumEntry={rank_position:number;user_id:string;real_total_xp:number};
export function podium<T extends PodiumEntry>(rows:readonly T[]){return rows.filter(x=>x.rank_position>=1&&x.rank_position<=3).slice().sort((a,b)=>a.rank_position-b.rank_position);}
export function isPersonalBest(previous:number|null,next:number){return previous!==null&&next>0&&next<previous;}
