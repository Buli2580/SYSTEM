export const AnalyticsEvents = {
  onboardingCompleted: 'onboarding_completed',
  questStarted: 'quest_started',
  questCompleted: 'quest_completed',
  streakExtended: 'streak_extended',
  achievementUnlocked: 'achievement_unlocked',
  campaignCreated: 'campaign_created',
  guildJoined: 'guild_joined',
  raidJoined: 'raid_joined',
  premiumStarted: 'premium_started',
  sponsoredChallengeStarted: 'sponsored_challenge_started',
  sponsoredChallengeCompleted: 'sponsored_challenge_completed',
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];
