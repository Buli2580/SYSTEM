// Two separate confirmations; merely opening Settings or tapping Reset is inert.
export function createResetConfirmation() {
  let stage = 0;
  return {
    begin() { stage = 1; },
    confirmWarning() { if (stage !== 1) throw new Error('Potwierdź ostrzeżenie.'); stage = 2; },
    confirmErase(text: string) { if (stage !== 2 || text !== 'RESET') throw new Error('Wpisz RESET, aby potwierdzić usunięcie danych.'); stage = 0; return true as const; },
    cancel() { stage = 0; },
  };
}
