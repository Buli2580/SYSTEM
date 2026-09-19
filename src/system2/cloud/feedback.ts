import Constants from 'expo-constants';
import { getValidSession } from './auth';
import { cloudRequest } from './http';

export type TesterFeedbackReport = {
  message: string;
  diagnostics: Record<string, unknown>;
};

export async function submitTesterFeedbackReport(input: TesterFeedbackReport): Promise<string> {
  const session = await getValidSession();
  if (!session) throw new Error('Zaloguj SYSTEM ONLINE, aby wysłać raport bezpośrednio.');

  const message = input.message.trim().slice(0, 5000);
  if (!message) throw new Error('Dodaj krótki opis problemu.');

  const diagnosticsJson = JSON.stringify(input.diagnostics);
  if (diagnosticsJson.length > 24_000) {
    throw new Error('Raport diagnostyczny jest zbyt duży.');
  }

  const rows = await cloudRequest<{ id: string }[]>(
    '/rest/v1/feedback_reports?select=id',
    {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        user_id: session.user.id,
        category: 'Other',
        message,
        app_version: Constants.expoConfig?.version ?? null,
        diagnostics: input.diagnostics,
        status: 'OPEN',
      }),
    },
    session.accessToken,
  );

  if (!rows[0]?.id) throw new Error('SYSTEM CLOUD nie potwierdził zapisu raportu.');
  return rows[0].id;
}
