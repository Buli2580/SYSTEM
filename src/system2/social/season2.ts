import type {SocialSeason} from './seasons';
export function seasonProgress2(season:SocialSeason,now=Date.now()){const a=Date.parse(season.startsAt),b=Date.parse(season.endsAt);const pct=Math.max(0,Math.min(100,Math.round((now-a)/(b-a)*100)));return{percent:pct,remainingMs:Math.max(0,b-now),active:now>=a&&now<b};}
export type SeasonTrackReward={level:number;kind:'COSMETIC'|'TITLE'|'CARD_FRAME';name:string};
export const SEASON_TRACK:readonly SeasonTrackReward[]=[
 {level:5,kind:'COSMETIC',name:'SEASON SIGNAL'},
 {level:15,kind:'CARD_FRAME',name:'VANGUARD FRAME'},
 {level:30,kind:'COSMETIC',name:'SEASON VETERAN SIGIL'},
 {level:50,kind:'COSMETIC',name:'ASCENDED SEASON AURA'},
];