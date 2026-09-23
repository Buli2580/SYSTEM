const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, 'processor.test.cjs');
let source = fs.readFileSync(file, 'utf8');

function isoDay(date) {
  return date.toISOString().slice(0, 10);
}

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

const now = new Date();
const weekday = now.getUTCDay() || 7;
// Weekly fixtures need three distinct dates from one ISO week. Early in a new
// week, anchor them to the previous Sunday instead of splitting Fri/Sat/Mon
// across two week identifiers. This changes tests only; production date bounds
// and server-authoritative verification remain untouched.
const anchor = new Date(now);
if (weekday < 3) anchor.setUTCDate(anchor.getUTCDate() - weekday);
const days = [-2, -1, 0].map(offset => {
  const d = new Date(anchor);
  d.setUTCDate(d.getUTCDate() + offset);
  return isoDay(d);
});
const fixtureWeek = isoWeek(anchor);

source = source
  .replaceAll('2026-09-18', days[0])
  .replaceAll('2026-09-19', days[1])
  .replaceAll('2026-09-20', days[2])
  .replaceAll('2026-W38', fixtureWeek);

fs.writeFileSync(file, source);
console.log(`Normalized processor calendar fixtures to ${days.join(', ')} / ${fixtureWeek}`);
