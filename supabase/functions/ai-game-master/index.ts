const ALLOWED_CATEGORIES = [
  'fitness','health','productivity','learning','exploration','social','recovery'
] as const;

const ALLOWED_DIFFICULTIES = ['easy','medium','hard'] as const;
const ALLOWED_DAILY_VERIFICATION = ['timer','gps'] as const;
const ALLOWED_TEMPLATE_HINTS = [
  'walk_reset','walk_fresh','walk_break','walk_route','run_easy','ride_easy',
  'focus_strength','focus_mobility','focus_begin','focus_morning','focus_evening','focus_distraction','focus_return',
  'focus_priority','focus_backlog','focus_plan','focus_draft','focus_review',
  'learn_read','learn_recall','learn_language','learn_question','learn_explain',
  'focus_social_plan','focus_social_message','focus_social_listen','focus_social_thanks',
  'organize_space','organize_tomorrow','organize_routine','organize_files',
  'create_note','focus_direction','create_sketch','focus_reflect'
] as const;

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

async function requireAuthenticatedUser(req: Request) {
  const authorization = req.headers.get('authorization') ?? '';
  if (!authorization.toLowerCase().startsWith('bearer ')) {
    throw new Response(JSON.stringify({ error: 'AUTH_REQUIRED' }), {
      status: 401,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) throw new Error('Supabase auth environment is unavailable');

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
    headers: {
      authorization,
      apikey: anonKey,
      accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Response(JSON.stringify({ error: 'INVALID_SESSION' }), {
      status: 401,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
  const user = await response.json();
  if (!user || typeof user.id !== 'string' || !user.id) {
    throw new Response(JSON.stringify({ error: 'INVALID_SESSION' }), {
      status: 401,
      headers: { 'content-type': 'application/json; charset=utf-8' },
    });
  }
  return user.id as string;
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
  let intersection = 0;
  for (const token of A) if (B.has(token)) intersection += 1;
  const union = new Set([...A, ...B]).size;
  return union ? intersection / union : 0;
}

function safeQuest(q: any, recent: string[], accepted: string[]) {
  if (!q || typeof q !== 'object') return false;
  if (typeof q.key !== 'string' || q.key.length < 3 || q.key.length > 120) return false;
  if (typeof q.title !== 'string' || q.title.trim().length < 3 || q.title.length > 80) return false;
  if (typeof q.description !== 'string' || q.description.trim().length < 5 || q.description.length > 280) return false;
  if (typeof q.reason !== 'string' || q.reason.trim().length < 3 || q.reason.length > 180) return false;
  if (!ALLOWED_CATEGORIES.includes(q.category)) return false;
  if (!ALLOWED_DIFFICULTIES.includes(q.difficulty)) return false;
  if (!ALLOWED_DAILY_VERIFICATION.includes(q.verification)) return false;
  if (!ALLOWED_TEMPLATE_HINTS.includes(q.templateHint)) return false;
  if (!Number.isFinite(q.estimatedMinutes) || q.estimatedMinutes < 1 || q.estimatedMinutes > 180) return false;
  if (!Number.isFinite(q.expiresInHours) || q.expiresInHours < 1 || q.expiresInHours > 72) return false;
  if (!Array.isArray(q.tags) || q.tags.length > 8 ||
      q.tags.some((tag: unknown) => typeof tag !== 'string' || !tag.trim() || tag.length > 32)) return false;
  if (q.target !== undefined) {
    if (!q.target || typeof q.target !== 'object') return false;
    if (!['minutes','meters','count'].includes(q.target.kind)) return false;
    if (!Number.isFinite(q.target.value) || q.target.value <= 0 || q.target.value > 100_000) return false;
    if (q.verification === 'gps' && q.target.kind !== 'meters') return false;
    if (q.verification === 'timer' && q.target.kind !== 'minutes') return false;
  }

  const blocked = [
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
  const full = `${q.title} ${q.description}`;
  if (blocked.some(rx => rx.test(full))) return false;
  if (recent.some(item => similarity(full, item) >= 0.72)) return false;
  if (accepted.some(item => similarity(full, item) >= 0.72)) return false;
  return true;
}

function fallback(context: any) {
  const debt = Number(context?.player?.systemDebt || 0);
  const recovery = {
    key: `recovery-${Date.now()}`,
    title: 'Recovery Protocol',
    description: 'Wróć do działania jednym małym, wykonalnym krokiem.',
    category: 'recovery',
    difficulty: 'easy',
    verification: 'timer',
    estimatedMinutes: 10,
    templateHint: 'focus_return',
    target: { kind: 'minutes', value: 10 },
    reason: 'Misja powrotu po niewykonanych zadaniach.',
    expiresInHours: 24,
    tags: ['recovery','system-debt'],
  };
  const normal = [
    {
      key: `daily-${Date.now()}-0`,
      title: 'Focus Sprint',
      description: 'Pracuj nad jednym ważnym zadaniem bez rozpraszaczy.',
      category: 'productivity',
      difficulty: 'easy',
      verification: 'timer',
      estimatedMinutes: 20,
      templateHint: 'focus_priority',
      target: { kind: 'minutes', value: 20 },
      reason: 'Buduje regularność i skupienie.',
      expiresInHours: 18,
      tags: ['focus','daily'],
    },
    {
      key: `daily-${Date.now()}-1`,
      title: 'Learning Burst',
      description: 'Przerób jeden konkretny fragment materiału i zapisz najważniejszy wniosek.',
      category: 'learning',
      difficulty: 'easy',
      verification: 'timer',
      estimatedMinutes: 15,
      templateHint: 'learn_read',
      target: { kind: 'minutes', value: 15 },
      reason: 'Rozwija aktywny cel.',
      expiresInHours: 18,
      tags: ['learning','daily'],
    },
    {
      key: `daily-${Date.now()}-2`,
      title: 'Reset Walk',
      description: 'Przejdź spokojną, bezpieczną trasę w równym tempie.',
      category: 'fitness',
      difficulty: 'easy',
      verification: 'gps',
      estimatedMinutes: 15,
      templateHint: 'walk_reset',
      target: { kind: 'meters', value: 600 },
      reason: 'Dodaje ruch bez przeciążenia.',
      expiresInHours: 18,
      tags: ['movement','daily'],
    },
  ];
  return {
    quests: debt > 0 ? [recovery, ...normal] : normal,
    director: {
      mode: debt > 0 ? 'recovery' : 'normal',
      difficultyBias: debt > 0 ? -1 : 0,
      headline: debt > 0 ? 'RECOVERY PROTOCOL' : 'DAILY DIRECTIVE',
      message: debt > 0
        ? 'Najpierw usuń SYSTEM DEBT.'
        : 'SYSTEM przygotował dzisiejszy zestaw misji.',
    },
    briefing: 'SYSTEM działa w trybie bezpiecznego fallbacku.',
    source: 'fallback',
  };
}

function promptFor(context: any) {
  const recent = (context?.recentQuests ?? []).slice(-50).map((q: any) => ({
    title: q.title,
    category: q.category,
    completed: q.completed,
    failed: q.failed,
  }));
  const goals = (context?.goals ?? []).slice(0, 10).map((g: any) => ({
    title: g.title,
    description: g.description,
  }));
  const locale = context?.player?.locale || 'pl-PL';

  return `You are SYSTEM AI GAME MASTER for a real-life RPG app.
Return ONLY valid JSON. No markdown.
Write titles, descriptions, reasons and briefing in locale: ${locale}.

Create 5 candidate daily quests. The app will safely select exactly 3.
The app, not you, controls verification thresholds, XP, rewards and final difficulty.

PLAYER:
level=${context?.player?.level ?? 1}
rank=${context?.player?.rank ?? 'E'}
streak=${context?.player?.streak ?? 0}
completionRate7d=${context?.player?.completionRate7d ?? 0}
systemDebt=${context?.player?.systemDebt ?? 0}

ACTIVE GOALS:
${JSON.stringify(goals)}

RECENT QUESTS - do not repeat or closely paraphrase:
${JSON.stringify(recent)}

TEMPLATE HINTS - every quest must choose exactly one:
${ALLOWED_TEMPLATE_HINTS.join(', ')}

RULES:
- Make quests achievable in ordinary daily life.
- Personalize them to active goals and recent behavior.
- Mix categories and wording.
- If systemDebt > 0, candidate #1 must be an easy recovery quest with templateHint "focus_return".
- Never prescribe medication, starvation, dangerous exercise, illegal acts, gambling, loans, spending money, public humiliation or self-harm.
- Never assign XP, levels, money, prizes, rank points, punishments or rewards.
- verification only: timer or gps.
- difficulty only: easy, medium, hard. The app can lower it.
- categories only: ${ALLOWED_CATEGORIES.join(', ')}.
- estimatedMinutes 1..180.
- expiresInHours 1..72.
- Avoid duplicate and near-duplicate quests.
- Use walk/run/ride template hints for GPS movement and focus/learn/organize/create/social hints for timer tasks.

JSON SHAPE:
{
  "quests": [{
    "key": "unique-string",
    "title": "short title",
    "description": "clear concrete action",
    "category": "fitness|health|productivity|learning|exploration|social|recovery",
    "difficulty": "easy|medium|hard",
    "verification": "timer|gps",
    "estimatedMinutes": 20,
    "templateHint": "focus_priority",
    "target": {"kind":"minutes|meters|count","value":20},
    "reason": "why this fits the player",
    "expiresInHours": 18,
    "tags": ["tag"]
  }],
  "director": {
    "mode": "normal|recovery|challenge",
    "difficultyBias": -1,
    "headline": "short SYSTEM headline",
    "message": "short SYSTEM message"
  },
  "briefing": "max 180 chars",
  "source": "ai"
}`;
}

function parseModelJson(content: string) {
  const trimmed = content.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const first = unfenced.indexOf('{');
  const last = unfenced.lastIndexOf('}');
  if (first < 0 || last <= first) throw new Error('Missing JSON object');
  return JSON.parse(unfenced.slice(first, last + 1));
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
      temperature: 0.82,
      max_tokens: 2200,
      messages: [
        {
          role: 'system',
          content: 'Return only valid JSON. Follow the schema and safety rules exactly. Never invent rewards.'
        },
        { role: 'user', content: promptFor(context) }
      ],
    }),
  });

  if (!response.ok) throw new Error(`AI provider HTTP ${response.status}`);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('Missing AI content');

  const parsed = parseModelJson(content);
  const recent = (context?.recentQuests ?? []).slice(-50)
    .map((q: any) => `${q.title} ${q.description ?? ''}`);
  const accepted: string[] = [];
  const quests = Array.isArray(parsed?.quests)
    ? parsed.quests.filter((q: any) => {
        const ok = safeQuest(q, recent, accepted);
        if (ok) accepted.push(`${q.title} ${q.description}`);
        return ok;
      }).slice(0, 6)
    : [];

  if (quests.length < 3) return fallback(context);

  const mode = ['normal','recovery','challenge'].includes(parsed?.director?.mode)
    ? parsed.director.mode
    : Number(context?.player?.systemDebt || 0) > 0 ? 'recovery' : 'normal';
  const difficultyBias = [-1,0,1].includes(parsed?.director?.difficultyBias)
    ? parsed.director.difficultyBias
    : 0;

  return {
    quests,
    director: {
      mode,
      difficultyBias,
      headline: typeof parsed?.director?.headline === 'string'
        ? parsed.director.headline.slice(0, 80)
        : 'DAILY DIRECTIVE',
      message: typeof parsed?.director?.message === 'string'
        ? parsed.director.message.slice(0, 220)
        : 'SYSTEM przygotował nowe misje.',
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
    await requireAuthenticatedUser(req);
    const body = await req.json();
    if (body?.action !== 'generate_daily') return json({ error: 'Unknown action' }, 400);
    if (!body?.context?.player) return json({ error: 'Missing player context' }, 400);
    return json(await callProvider(body.context));
  } catch (error) {
    if (error instanceof Response) return error;
    console.error(error);
    return json({ error: 'AI_GAME_MASTER_FAILED' }, 500);
  }
});
