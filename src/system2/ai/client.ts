import type {
  AIGameMasterContext,
  AIGameMasterResponse,
} from './types';
import { buildFallback } from './fallback';
import { validateAIGameMasterResponse } from './validate';

export interface AIGameMasterClientOptions {
  endpoint: string;
  accessToken?: string | null;
  timeoutMs?: number;
}

export async function requestAIGameMaster(
  context: AIGameMasterContext,
  options: AIGameMasterClientOptions
): Promise<AIGameMasterResponse> {
  if (context.player.ageMode !== 'ADULT') return buildFallback(context);
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? 12000
  );

  try {
    const response = await fetch(options.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(options.accessToken
          ? { authorization: `Bearer ${options.accessToken}` }
          : {}),
      },
      body: JSON.stringify({
        action: 'generate_daily',
        context,
      }),
      signal: controller.signal,
    });

    if (!response.ok) return buildFallback(context);

    const json = await response.json();
    const validated = validateAIGameMasterResponse(
      json,
      context.recentQuests.map(q => q.title)
    );

    return validated ?? buildFallback(context);
  } catch {
    return buildFallback(context);
  } finally {
    clearTimeout(timeout);
  }
}
