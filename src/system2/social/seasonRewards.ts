export type SeasonRewardTier={
 minPoints:number;
 name:string;
 kind:'COSMETIC'|'TITLE'|'CARD_FRAME';
};
export function seasonReward(points:number,tiers:SeasonRewardTier[]){
 return [...tiers].sort((a,b)=>b.minPoints-a.minPoints).find(t=>points>=t.minPoints)??null;
}
