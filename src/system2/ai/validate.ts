import type {
  AIGameMasterResponse,
  AIPlayerMemory,
  AIQuestCategory,
  AIQuestDifficulty,
  AIQuestVerification,
  AIResearchSummary,
} from './types';
import { isTooSimilar } from './repetition';

const CATEGORIES = new Set<AIQuestCategory>([
  'fitness','health','productivity','learning','exploration','social','recovery'
]);
const DIFFICULTIES = new Set<AIQuestDifficulty>(['easy','medium','hard']);
const VERIFICATION = new Set<AIQuestVerification>(['manual','timer','gps']);
const TARGET_KINDS = new Set(['minutes','meters','count']);

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
  /publiczn.*upok/i,
  /bez snu|nie śpij|sleep deprivation/i,
  /odwodn|bez wody/i,
  /prowadź.*samoch|drive.*while/i,
];

function cleanStringArray(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .filter(item => typeof item === 'string')
    .map(item => item.replace(/\s+/g, ' ').trim().slice(0, maxLength))
    .filter(item => item && !seen.has(item) && !!seen.add(item))
    .slice(0, maxItems);
}

function validResearch(value: unknown): AIResearchSummary | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const row = value as Record<string, unknown>;
  const sources = Array.isArray(row.sources) ? row.sources
    .filter(item => item && typeof item === 'object')
    .map(item => item as Record<string, unknown>)
    .filter(item => typeof item.title === 'string' && typeof item.url === 'string' && /^https:\/\//i.test(item.url))
    .map(item => ({ title: String(item.title).replace(/\s+/g, ' ').trim().slice(0, 120), url: String(item.url).trim().slice(0, 500) }))
    .filter(item => item.title && item.url)
    .slice(0, 8) : [];
  const topics = cleanStringArray(row.topics, 8, 80);
  return { usedWeb: Boolean(row.usedWeb) && sources.length > 0, topics, sources };
}

function validMemory(value: unknown): AIPlayerMemory | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const row = value as Record<string, unknown>;
  const summary = typeof row.summary === 'string' ? row.summary.replace(/\s+/g, ' ').trim().slice(0, 600) : '';
  const categories = (input: unknown) => cleanStringArray(input, 7, 24).filter(item => CATEGORIES.has(item as AIQuestCategory)) as AIQuestCategory[];
  return {
    summary,
    interests: cleanStringArray(row.interests, 12, 80),
    preferredQuestStyles: cleanStringArray(row.preferredQuestStyles, 10, 80),
    successfulCategories: categories(row.successfulCategories),
    recentFailureCategories: categories(row.recentFailureCategories),
    researchTopics: cleanStringArray(row.researchTopics, 12, 100),
  };
}

function validTarget(
  target: unknown,
  verification: AIQuestVerification,
): boolean {
  if (target === undefined) return true;
  if (!target || typeof target !== 'object') return false;
  const value = target as { kind?: unknown; value?: unknown };
  if (typeof value.kind !== 'string' || !TARGET_KINDS.has(value.kind)) return false;
  if (typeof value.value !== 'number' || !Number.isFinite(value.value) || value.value <= 0 || value.value > 100_000) return false;
  if (verification === 'gps' && value.kind !== 'meters') return false;
  if (verification === 'timer' && value.kind !== 'minutes') return false;
  return true;
}

export function validateAIGameMasterResponse(
  value: unknown,
  recentTitles: string[],
  allowedDifficulties?: readonly AIQuestDifficulty[],
): AIGameMasterResponse | null {
  if (!value || typeof value !== 'object') return null;
  const r = value as AIGameMasterResponse;
  if (!Array.isArray(r.quests) || !r.quests.length || r.quests.length > 8) return null;
  if (!r.director || typeof r.briefing !== 'string') return null;
  if (r.source !== 'ai' && r.source !== 'fallback') return null;
  if (r.model !== undefined && (typeof r.model !== 'string' || r.model.length > 120)) return null;
  if (!['normal','recovery','challenge'].includes(r.director.mode)) return null;
  if (![-1,0,1].includes(r.director.difficultyBias)) return null;
  if (typeof r.director.headline !== 'string' || !r.director.headline.trim() || r.director.headline.length > 80) return null;
  if (typeof r.director.message !== 'string' || !r.director.message.trim() || r.director.message.length > 220) return null;

  const allowed = allowedDifficulties ? new Set(allowedDifficulties) : null;
  const seen: string[] = [];
  for (const q of r.quests) {
    if (!q || typeof q !== 'object') return null;
    if (typeof q.key !== 'string' || q.key.length < 3 || q.key.length > 120) return null;
    if (typeof q.title !== 'string' || q.title.trim().length < 3 || q.title.length > 80) return null;
    if (typeof q.description !== 'string' || q.description.trim().length < 5 || q.description.length > 280) return null;
    if (typeof q.reason !== 'string' || q.reason.trim().length < 3 || q.reason.length > 180) return null;
    if (!CATEGORIES.has(q.category)) return null;
    if (!DIFFICULTIES.has(q.difficulty)) return null;
    if (allowed && !allowed.has(q.difficulty)) return null;
    if (!VERIFICATION.has(q.verification)) return null;
    if (!Number.isFinite(q.estimatedMinutes) || q.estimatedMinutes < 1 || q.estimatedMinutes > 180) return null;
    if (!Number.isFinite(q.expiresInHours) || q.expiresInHours < 1 || q.expiresInHours > 72) return null;
    if (!Array.isArray(q.tags) || q.tags.length > 8 ||
        q.tags.some(tag => typeof tag !== 'string' || !tag.trim() || tag.length > 32)) return null;
    if (!validTarget(q.target, q.verification)) return null;
    if (q.templateHint !== undefined &&
        (typeof q.templateHint !== 'string' || !/^[a-z0-9_]{3,60}$/.test(q.templateHint))) return null;

    const full = `${q.title} ${q.description}`;
    if (BLOCKED.some(rx => rx.test(full))) return null;
    if (isTooSimilar(full, recentTitles, 0.72)) return null;
    if (isTooSimilar(full, seen, 0.72)) return null;
    seen.push(full);
  }

  const research = validResearch(r.research);
  const memory = validMemory(r.memory);
  return {
    ...r,
    ...(research ? { research } : {}),
    ...(memory ? { memory } : {}),
    briefing: r.briefing.trim().slice(0, 180),
    director: {
      ...r.director,
      headline: r.director.headline.trim(),
      message: r.director.message.trim(),
    },
    quests: r.quests.map(q => ({
      ...q,
      key: q.key.trim(),
      title: q.title.trim(),
      description: q.description.trim(),
      reason: q.reason.trim(),
      tags: q.tags.map(tag => tag.trim()),
    })),
  };
}
