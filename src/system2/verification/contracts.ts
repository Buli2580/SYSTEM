export type VerificationRequest<E> = {
  questId: string; method: string; evidence: E; requestedAt: string;
};
export type VerificationResult<E> = {
  providerId: string; code: string; checkedAt: string;
} & (
  | { status: 'VERIFIED'; evidence: E }
  | { status: 'REJECTED' | 'PENDING' | 'UNAVAILABLE'; reason: string }
);
export interface VerificationProvider<E> {
  readonly id: string;
  canHandle(request: VerificationRequest<E>): boolean;
  verify(request: VerificationRequest<E>): Promise<VerificationResult<E>>;
}
// E is provider-specific metadata; future providers need explicit evidence types and trust rules.
// A PENDING result is not proof and must never be converted into XP.
