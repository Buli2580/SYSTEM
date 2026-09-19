import type {SocialRepository} from './SocialRepository';import type {LeaderboardEntry,Page,PublicPlayerProfile,RankingCategory,RankingPeriod,RankingScope,SocialActivityEvent} from './types';import {rankPlayers} from './ranking';import {sanitizeActivityForPublic} from './activity';
export class InMemorySocialRepository implements SocialRepository{
private profiles=new Map<string,PublicPlayerProfile>();private following=new Set<string>();private blocked=new Set<string>();private events:SocialActivityEvent[]=[];
constructor(seed:PublicPlayerProfile[]=[]){for(const p of seed)this.profiles.set(p.playerId,p);}
async getPublicProfile(id:string){return this.blocked.has(id)?null:this.profiles.get(id)??null;}
async searchPlayers(q:string,cursor?:string):Promise<Page<PublicPlayerProfile>>{const x=q.trim().toLowerCase();const items=[...this.profiles.values()].filter(p=>!this.blocked.has(p.playerId)&&p.visibility==='PUBLIC'&&(p.displayName.toLowerCase().includes(x)||p.playerId.toLowerCase().includes(x)));return page(items,cursor);}
async follow(id:string){if(this.blocked.has(id))throw new Error('BLOCKED');if(!this.profiles.has(id))throw new Error('NOT_FOUND');this.following.add(id);}
async unfollow(id:string){this.following.delete(id);}async block(id:string){this.following.delete(id);this.blocked.add(id);}async unblock(id:string){this.blocked.delete(id);}
async getLeaderboard(_s:RankingScope,c:RankingCategory,_p:RankingPeriod,cursor?:string):Promise<Page<LeaderboardEntry>>{const ranked=rankPlayers([...this.profiles.values()].filter(p=>p.visibility==='PUBLIC'&&!this.blocked.has(p.playerId)).map(player=>({player,verification:'UNVERIFIED'})),c);return page(ranked,cursor);}
async getActivityFeed(cursor?:string){return page(this.events.filter(e=>e.visibility==='PUBLIC').map(sanitizeActivityForPublic),cursor);}
addActivity(e:SocialActivityEvent){this.events.unshift(e);}
}
function page<T>(all:T[],cursor?:string,size=25):Page<T>{const start=Math.max(0,Number(cursor)||0),items=all.slice(start,start+size),next=start+items.length<all.length?String(start+items.length):null;return{items,nextCursor:next};}
