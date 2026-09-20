
type Json = Record<string, unknown>;

const ALLOWED_CATEGORIES = [
  'fitness','health','productivity','learning','exploration','social','recovery'
];
const ALLOWED_DIFFICULTIES = ['easy','medium','hard'];
const ALLOWED_VERIFICATION = ['manual','timer','gps'];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(a: string, b: string) {
  const A = new Set(normalize(a).split(' ').filter(Boolean));
  const B = new Set(normalize(b).split(' ').filter(Boolean));
  if (!A.size || !B.size) return 0;
  let i = 0;
  for (const t of A) if (B.has(t)) i++;
  const union = new Set([...A, ...B]).size;
  return union ? i / union : 0;
}

function safeQuest(q: any, recent: string[], accepted: string[]) {
  if (!q || typeof q !== 'object') return false;
  if (typeof q.key !== 'string' || q.key.length < 3) return false;
  if (typeof q.title !== 'string' || q.title.length < 3 || q.title.length > 80) return false;
  if (typeof q.description !== 'string' || q.description.length < 5 || q.description.length > 280) return false;
  if (!ALLOWED_CATEGORIES.includes(q.category)) return false;
  if (!ALLOWED_DIFFICULTIES.includes(q.difficulty)) return false;
  if (!ALLOWED_VERIFICATION.includes(q.verification)) return false;
  if (!Number.isFinite(q.estimatedMinutes) || q.estimatedMinutes < 1 || q.estimatedMinutes > 180) return false;
  if (!Number.isFinite(q.expiresInHours) || q.expiresInHours < 1 || q.expiresInHours > 72) return false;

  const blocked = [
    /self[-\s]?harm/i,/samobĂłj/i,/gĹ‚odĂłw/i,/nie jedz/i,/hazard/i,/poĹĽycz/i,/ukrad/i,/wĹ‚am/i
  ];
  const full = `${q.title} ${q.description}`;
  if (blocked.some(rx => rx.test(full))) return false;
  if (recent.some(r => similarity(full, r) >= 0.72)) return false;
  if (accepted.some(r => similarity(full, r) >= 0.72)) return false;
  return true;
}

function fallback(context: any) {
  const debt = Number(context?.player?.systemDebt || 0);
  return {
    quests: debt > 0
      ? [{
          key: `recovery-${Date.now()}`,
          title: 'Recovery Protocol',
          description: 'Wykonaj 15 minut spokojnego marszu i zakoĹ„cz jedno maĹ‚e zalegĹ‚e zadanie.',
          category: 'recovery',
          difficulty: 'easy',
          verification: 'timer',
          estimatedMinutes: 15,
          target: { kind: 'minutes', value: 15 },
          reason: 'Misja powrotu po niewykonanych zadaniach.',
          expiresInHours: 24,
          tags: ['recovery','system-debt'],
        }]
      : [{
          key: `daily-${Date.now()}-0`,
          title: 'Focus Sprint',
          description: 'Przez 20 minut pracuj nad jednym waĹĽnym zadaniem bez rozpraszaczy.',
          category: 'productivity',
          difficulty: 'easy',
          verification: 'timer',
          estimatedMinutes: 20,
          target: { kind: 'minutes', value: 20 },
          reason: 'Buduje regularnoĹ›Ä‡.',
          expiresInHours: 18,
          tags: ['focus','daily'],
        }],
    director: {
      mode: debt > 0 ? 'recovery' : 'normal',
      difficultyBias: debt > 0 ? -1 : 0,
      headline: debt > 0 ? 'RECOVERY PROTOCOL' : 'DAILY DIRECTIVE',
      message: debt > 0
        ? 'Najpierw usuĹ„ SYSTEM DEBT.'
        : 'SYSTEM przygotowaĹ‚ dzisiejszÄ… misjÄ™.',
    },
    briefing: 'SYSTEM dziaĹ‚a w trybie fallback.',
    source: 'fallback',
  };
}

function promptFor(context: any) {
  const recent = (context?.recentQuests ?? []).slice(-50).map((q: any) => q.title);
  const goals = (context?.goals ?? []).slice(0, 10).map((g: any) => g.title);

  return `You are SYSTEM AI GAME MASTER.
Return ONLY valid JSON. No markdown.

Create 4 quests for this player.

PLAYER:
level=${context?.player?.level ?? 1}
rank=${context?.player?.rank ?? 'E'}
streak=${context?.player?.streak ?? 0}
completionRate7d=${context?.player?.completionRate7d ?? 0}
systemDebt=${context?.player?.systemDebt ?? 0}

GOALS:
${JSON.stringify(goals)}

RECENT QUEST TITLES - do not repeat or closely paraphrase:
${JSON.stringify(recent)}

RULES:
- Make quests achievable in ordinary daily life.
- Mix categories when possible.
- If systemDebt > 0, include exactly one easy recovery quest.
- Never prescribe medication, starvation, dangerous exercise, illegal acts, gambling, loans, spending money, public humiliation, or self-harm.
- Do not assign XP, levels, money, prizes, rank points, or rewards.
- verification must be only manual, timer, or gps.
- difficulty must be only easy, medium, hard.
- categories only: ${ALLOWED_CATEGORIES.join(', ')}.
- estimatedMinutes 1..180.
- expiresInHours 1..72.
- Avoid duplicate or near-duplicate quests.

JSON SHAPE:
{
  "quests": [{
    "key": "unique-string",
    "title": "short title",
    "description": "clear action",
    "category": "fitness|health|productivity|learning|exploration|social|recovery",
    "difficulty": "easy|medium|hard",
    "verification": "manual|timer|gps",
    "estimatedMinutes": 20,
    "target": {"kind":"minutes|meters|count","value":20},
    "reason": "one short reason",
    "expiresInHours": 18,
    "tags": ["tag"]
  }],
  "director": {
    "mode": "normal|recovery|challenge",
    "difficultyBias": -1,
    "headline": "short system headline",
    "message": "short system message"
  },
  "briefing": "max 180 chars",
  "source": "ai"
}`;
}

async function callProvider(context: any) {
  const key = Deno.env.get('AI_API_KEY');
  if (!key) return fallback(context);

  const base = (Deno.env.get('AI_BASE_URL') || 'https://openrouter.ai/api/v1').replace(/\/$/, '');
  const model = Deno.env.get('AI_MODEL') || 'openrouter/free';

  const response = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${key}`,
      'HTTP-Referer': Deno.env.get('AI_APP_URL') || 'https://system.local',
      'X-Title': 'SYSTEM AI GAME MASTER',
    },
    body: JSON.stringify({
      model,
      temperature: 0.85,
      max_tokens: 1800,
      messages: [
        {
          role: 'system',
          content: 'Return only valid JSON. Follow all safety and schema rules exactly.'
        },
        { role: 'user', content: promptFor(context) }
      ],
    }),
  });

  if (!response.ok) throw new Error(`AI provider HTTP ${response.status}`);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('Missing AI content');

  const parsed = JSON.parse(content);
  const recent = (context?.recentQuests ?? []).slice(-50).map((q: any) => `${q.title} ${q.description ?? ''}`);
  const accepted: string[] = [];
  const quests = Array.isArray(parsed?.quests)
    ? parsed.quests.filter((q: any) => {
        const ok = safeQuest(q, recent, accepted);
        if (ok) accepted.push(`${q.title} ${q.description}`);
        return ok;
      }).slice(0, 6)
    : [];

  if (!quests.length) return fallback(context);

  return {
    quests,
    director: parsed.director ?? {
      mode: 'normal',
      difficultyBias: 0,
      headline: 'DAILY DIRECTIVE',
      message: 'SYSTEM prepared new missions.',
    },
    briefing: typeof parsed.briefing === 'string' ? parsed.briefing.slice(0, 180) : '',
    source: 'ai',
    model,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return json({ ok: true });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    if (body?.action !== 'generate_daily') return json({ error: 'Unknown action' }, 400);
    if (!body?.context?.player) return json({ error: 'Missing player context' }, 400);

    return json(await callProvider(body.context));
  } catch (error) {
    console.error(error);
    return json({ error: 'AI_GAME_MASTER_FAILED' }, 500);
  }
});

