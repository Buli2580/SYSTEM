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
const days = [-2, -1, 0].map(offset => {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + offset);
  return isoDay(d);
});
const currentWeek = isoWeek(now);

// Keep the original three-day fixture shape while preventing calendar-driven CI expiry.
source = source
  .replaceAll('2026-09-18', days[0])
  .replaceAll('2026-09-19', days[1])
  .replaceAll('2026-09-20', days[2])
  .replaceAll('2026-W38', currentWeek);

fs.writeFileSync(file, source);
console.log(`Normalized processor calendar fixtures to ${days.join(', ')} / ${currentWeek}`);
