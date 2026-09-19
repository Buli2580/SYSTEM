import type {LeaderboardEntry,Page,PublicPlayerProfile,RankingCategory,RankingPeriod,RankingScope,SocialActivityEvent} from './types';
export interface SocialRepository{
getPublicProfile(playerId:string):Promise<PublicPlayerProfile|null>;
searchPlayers(query:string,cursor?:string):Promise<Page<PublicPlayerProfile>>;
follow(playerId:string):Promise<void>;unfollow(playerId:string):Promise<void>;block(playerId:string):Promise<void>;unblock(playerId:string):Promise<void>;
getLeaderboard(scope:RankingScope,category:RankingCategory,period:RankingPeriod,cursor?:string):Promise<Page<LeaderboardEntry>>;
getActivityFeed(cursor?:string):Promise<Page<SocialActivityEvent>>;
}
