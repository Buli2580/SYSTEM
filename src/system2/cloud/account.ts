import { getValidSession } from './auth';
import { cloudRequest } from './http';

export type AccountDeletionRequest = {
  id: string;
  user_id: string;
  requested_at: string;
  status: string;
  reason: string | null;
};

async function requireSession() {
  const session = await getValidSession();
  if (!session) throw new Error('Najpierw zaloguj SYSTEM CLOUD.');
  return session;
}

export async function getPendingAccountDeletionRequest(): Promise<AccountDeletionRequest | null> {
  const session = await requireSession();
  const rows = await cloudRequest<AccountDeletionRequest[]>(
    '/rest/v1/account_deletion_requests?user_id=eq.' + encodeURIComponent(session.user.id) +
      '&status=eq.REQUESTED&select=*&order=requested_at.desc&limit=1',
    { method: 'GET' },
    session.accessToken,
  );
  return rows[0] ?? null;
}

export async function requestAccountDeletion(reason = 'USER_REQUEST_IN_APP'): Promise<AccountDeletionRequest> {
  const session = await requireSession();
  const existing = await getPendingAccountDeletionRequest();
  if (existing) return existing;

  const rows = await cloudRequest<AccountDeletionRequest[]>(
    '/rest/v1/account_deletion_requests?select=*',
    {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        user_id: session.user.id,
        status: 'REQUESTED',
        reason: reason.slice(0, 500),
      }),
    },
    session.accessToken,
  );
  if (!rows[0]) throw new Error('Nie udało się zapisać żądania usunięcia konta.');
  return rows[0];
}
