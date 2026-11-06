/**
 * Proposed rewards aligned with authoritative QE — NOT a second economy.
 * Level-up to 2 requires 147 REAL XP total (xpNeededForRealLevel(1)).
 * first_movement_v1 currently grants 100 → L2 needs additional QE XP (quest 2 or chapter).
 */
export const SLICE_REWARD_PROPOSAL = {
  protocol: 'SLICE_V1_REWARD_PROPOSAL',
  authority: 'QUEST_ENGINE_ONLY',
  firstOrder: {
    /** Prefer wiring to existing first_movement_v1 reward unless Codex revises catalog */
    questIdPreferred: 'first_movement_v1',
    realXp: 100,
    skillXp: { VIT: 80 } as const,
    gameEnergy: 10,
    developmentPoint: 1,
    itemId: 'relic-znacznik-przebudzonego',
    itemName: 'Znacznik Przebudzonego',
    unlocksBase: true,
    levelUpTo2: false,
    levelUpNote:
      'L1→L2 needs 147 REAL XP. 100 XP from Pierwszy Ruch is honest; L2 after Focus (80) or chapter award — do not fake L2 here.',
  },
  chapterCompletionBonus: {
    questId: 'awakening_chapter_1',
    realXp: 300,
    note: 'Existing AWAKENING_REWARD_XP via awardAwakeningIfEligible',
  },
  inventoryAlignment: {
    existingRelic: 'relic-origin-shard',
    sliceRelic: 'relic-znacznik-przebudzonego',
    note: 'Codex may map Znacznik → origin-shard or add catalog entry; Slice must not write inventory outside QE/item unlock path.',
  },
} as const;

export type SliceRewardProposal = typeof SLICE_REWARD_PROPOSAL;
