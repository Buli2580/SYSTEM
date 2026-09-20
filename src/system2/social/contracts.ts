export interface PublicProfile {
  userId: string;
  displayName: string;
  level: number;
  title?: string;
  avatarUrl?: string;
}

export interface Guild {
  id: string;
  name: string;
  ownerId: string;
  memberCount: number;
  level: number;
}

export interface LeaderboardEntry {
  rank: number;
  user: PublicProfile;
  score: number;
}

export interface Raid {
  id: string;
  guildId?: string;
  title: string;
  bossHp: number;
  remainingHp: number;
  startsAt: string;
  endsAt: string;
}
