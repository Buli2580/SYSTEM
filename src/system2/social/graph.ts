export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';
export interface Friendship { id: string; userId: string; peerUserId: string; status: FriendshipStatus; createdAt: string; updatedAt: string; }
export interface ActivityItem { id: string; userId: string; kind: 'quest_completed'|'level_up'|'achievement_unlocked'|'streak_milestone'; occurredAt: string; visibility: 'public'|'followers'|'private'; title: string; metadata?: Record<string,string|number|boolean>; }
export function canShowActivity(item: ActivityItem, viewerId: string, followsAuthor: boolean): boolean {
 if (item.userId===viewerId) return true;
 if (item.visibility==='public') return true;
 return item.visibility==='followers' && followsAuthor;
}
export function sortActivityFeed(items: ActivityItem[]): ActivityItem[] { return [...items].sort((a,b)=>b.occurredAt.localeCompare(a.occurredAt)); }
