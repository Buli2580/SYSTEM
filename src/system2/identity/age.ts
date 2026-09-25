// Date-only ISO birth dates. Feb 29 birthdays advance on March 1 in non-leap years.
export function calculateAge(birthDate: string | undefined, today = new Date(Date.now())): number | null {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate) || !Number.isFinite(today.getTime())) return null;
  const [year, month, day] = birthDate.split('-').map(Number);
  const parsed = new Date(birthDate + 'T00:00:00Z');
  if (year < 1 || parsed.getUTCFullYear() !== year || parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== day) return null;
  const age = today.getFullYear() - year - (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day) ? 1 : 0);
  return age < 0 ? null : age;
}
export function validateBirthDate(value: string, today = new Date(Date.now())): string {
  if (calculateAge(value, today) === null) throw new Error('Wpisz prawidłową datę urodzenia RRRR-MM-DD, nie późniejszą niż dzisiaj.');
  return value;
}
