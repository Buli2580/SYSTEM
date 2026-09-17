// A deadline releases the UI, not the underlying SQLite operation. In particular,
// a timed-out commit may still finish: callers must re-read completion before retrying.
export async function awaitWithTimeout<T>(operation: Promise<T>, milliseconds = 15000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('Przekroczono czas oczekiwania. Sprawdź zapis ponownie.')), milliseconds);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
