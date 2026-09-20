import type {
  AIGameMasterResponse,
  AIQuestCategory,
  AIQuestDifficulty,
  AIQuestVerification,
} from './types';
import { isTooSimilar } from './repetition';

const CATEGORIES = new Set<AIQuestCategory>([
  'fitness','health','productivity','learning','exploration','social','recovery'
]);
const DIFFICULTIES = new Set<AIQuestDifficulty>(['easy','medium','hard']);
const VERIFICATION = new Set<AIQuestVerification>(['manual','timer','gps']);

const BLOCKED = [
  /self[-\s]?harm/i,
  /samobój/i,
  /głodów/i,
  /nie jedz/i,
  /lek(ów|i)? bez/i,
  /hazard/i,
  /pożycz/i,
  /mandat/i,
  /ukrad/i,
  /włam/i,
];

export function validateAIGameMasterResponse(
  value: unknown,
  recentTitles: string[]
): AIGameMasterResponse | null {
  if (!value || typeof value !== 'object') return null;
  const r = value as AIGameMasterResponse;
  if (!Array.isArray(r.quests) || !r.quests.length || r.quests.length > 8) return null;
  if (!r.director || typeof r.briefing !== 'string') return null;
  if (!['normal','recovery','challenge'].includes(r.director.mode)) return null;
  if (![-1,0,1].includes(r.director.difficultyBias)) return null;
  if (typeof r.director.headline !== 'string' || typeof r.director.message !== 'string') return null;

  const seen: string[] = [];
  for (const q of r.quests) {
    if (!q || typeof q !== 'object') return null;
    if (typeof q.key !== 'string' || q.key.length < 3) return null;
    if (typeof q.title !== 'string' || q.title.length < 3 || q.title.length > 80) return null;
    if (typeof q.description !== 'string' || q.description.length < 5 || q.description.length > 280) return null;
    if (!CATEGORIES.has(q.category)) return null;
    if (!DIFFICULTIES.has(q.difficulty)) return null;
    if (!VERIFICATION.has(q.verification)) return null;
    if (!Number.isFinite(q.estimatedMinutes) || q.estimatedMinutes < 1 || q.estimatedMinutes > 180) return null;
    if (!Number.isFinite(q.expiresInHours) || q.expiresInHours < 1 || q.expiresInHours > 72) return null;
    if (!Array.isArray(q.tags) || q.tags.length > 8) return null;
    if (q.templateHint !== undefined &&
        (typeof q.templateHint !== 'string' || !/^[a-z0-9_]{3,60}$/.test(q.templateHint))) return null;

    const full = `${q.title} ${q.description}`;
    if (BLOCKED.some(rx => rx.test(full))) return null;
    if (isTooSimilar(full, recentTitles, 0.72)) return null;
    if (isTooSimilar(full, seen, 0.72)) return null;
    seen.push(full);
  }

  return {
    ...r,
    briefing: r.briefing.slice(0, 180),
    source: r.source === 'fallback' ? 'fallback' : 'ai',
  };
}
