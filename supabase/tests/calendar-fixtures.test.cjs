const {test}=require('node:test');
const assert=require('node:assert/strict');
const {normalizeCalendarFixtures}=require('./normalize-calendar-fixtures.cjs');
const fixture="2026-09-18 2026-09-19 2026-09-20 2026-09-21 2026-09-20T22:30:00Z 2026-W38 2026-W39 Date.UTC(2026,7,22+n) 2099-12-31";
for(const [clock,expected] of [
 ['2026-09-28','2026-09-25 2026-09-26 2026-09-27 2026-09-28 2026-09-27T22:30:00Z 2026-W39 2026-W40 Date.UTC(2026,7,29+n) 2099-12-31'],
 ['2026-10-01','2026-09-25 2026-09-26 2026-09-27 2026-09-28 2026-09-27T22:30:00Z 2026-W39 2026-W40 Date.UTC(2026,7,29+n) 2099-12-31'],
 ['2027-01-03','2027-01-01 2027-01-02 2027-01-03 2027-01-04 2027-01-03T22:30:00Z 2026-W53 2027-W01 Date.UTC(2026,11,5+n) 2099-12-31'],
]) test('calendar fixtures retain streak, Sunday/Monday and ISO weeks on '+clock,()=>{
 assert.equal(normalizeCalendarFixtures(fixture,new Date(clock+'T12:00:00Z')),expected);
});
test('unchanged base week and assertions are preserved',()=>{
 assert.equal(normalizeCalendarFixtures(fixture,new Date('2026-09-20T12:00:00Z')),fixture);
 const assertions="assert.equal(status,'PROCESSED'); assert.equal(reason,'DUPLICATE'); assert.equal(reason,'INVALID_PAYLOAD');";
 assert.equal(normalizeCalendarFixtures(assertions),assertions);
});
