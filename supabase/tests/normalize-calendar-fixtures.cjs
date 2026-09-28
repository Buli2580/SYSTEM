const fs = require('node:fs');
const path = require('node:path');

const DAY = 86400000;
function isoDay(date) { return date.toISOString().slice(0, 10); }
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / DAY) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function normalizeCalendarFixtures(source, now = new Date()) {
  if (!Number.isFinite(now.getTime())) throw new Error('Invalid fixture clock');
  // Keep the original Friday/Saturday/Sunday and following local Monday intact.
  // Shift by whole ISO weeks, including the trusted 30-day legacy streak.
  const sunday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  sunday.setUTCDate(sunday.getUTCDate() - sunday.getUTCDay());
  const shift = sunday.getTime() - Date.UTC(2026, 8, 20);
  if (shift < 0) throw new Error('Fixture clock precedes the supported test calendar');
  const shifted = date => new Date(Date.parse(date + 'T00:00:00Z') + shift);
  const replacements = Object.fromEntries(['2026-09-18','2026-09-19','2026-09-20','2026-09-21'].map(day => [day,isoDay(shifted(day))]));
  replacements['2026-W38'] = isoWeek(sunday);
  replacements['2026-W39'] = isoWeek(shifted('2026-09-21'));
  // One pass avoids cascading W38 -> W39 -> W40 replacements.
  let result = source.replace(/2026-09-(?:18|19|20|21)|2026-W(?:38|39)/g, value => replacements[value]);
  const start = shifted('2026-08-22');
  result = result.replace('Date.UTC(2026,7,22+n)', `Date.UTC(${start.getUTCFullYear()},${start.getUTCMonth()},${start.getUTCDate()}+n)`);
  return result;
}
module.exports = {normalizeCalendarFixtures};

if (require.main === module) {
  const file = path.join(__dirname, 'processor.test.cjs');
  fs.writeFileSync(file, normalizeCalendarFixtures(fs.readFileSync(file, 'utf8')));
  console.log('Normalized processor fixtures with one consistent ISO-week offset');
}
