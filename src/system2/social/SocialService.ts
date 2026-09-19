import type {PlayerProfile} from '../core/types';import type {SocialRepository} from './SocialRepository';import {toPublicPlayerProfile} from './publicProfile';import type {RankingCategory,RankingPeriod,RankingScope,SocialVisibility} from './types';
export class SocialService{constructor(private repo:SocialRepository){}
publishProfile(player:PlayerProfile,achievementCount:number,visibility:SocialVisibility){return toPublicPlayerProfile(player,{achievementCount,visibility});}
profile(id:string){return this.repo.getPublicProfile(id);}search(q:string,cursor?:string){return this.repo.searchPlayers(q,cursor);}
follow(id:string){return this.repo.follow(id);}unfollow(id:string){return this.repo.unfollow(id);}block(id:string){return this.repo.block(id);}unblock(id:string){return this.repo.unblock(id);}
leaderboard(scope:RankingScope,category:RankingCategory,period:RankingPeriod,cursor?:string){return this.repo.getLeaderboard(scope,category,period,cursor);}
feed(cursor?:string){return this.repo.getActivityFeed(cursor);}}
