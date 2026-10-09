const { test } = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');

function loadAdminVisits() {
	const node = () => ({ addEventListener() { }, classList: { add() { }, remove() { }, toggle() { } }, setAttribute() { } });
	const context = { document: { getElementById: node, querySelectorAll: () => [] }, localStorage: { getItem: () => null, setItem() { } }, ResizeObserver: class { observe() { } }, Intl, Date, Math, Number, String, Map, Array, Object, setInterval, clearInterval };
	vm.runInNewContext(fs.readFileSync('classes/admin-visits.js', 'utf8'), context);
	return context.AdminVisits;
}

test('visits by time of day are grouped by the Berlin hour', () => {
	const visits = loadAdminVisits();
	const generatedAt = Date.parse('2026-10-09T18:00:00Z');
	const hours = [
		{ start: Date.parse('2026-10-09T15:00:00Z'), views: 5, visitors: 3, bots: 1 }, // 17 Uhr in Berlin
		{ start: Date.parse('2026-10-08T15:00:00Z'), views: 2, visitors: 2, bots: 0 }, // gestern 17 Uhr
		{ start: Date.parse('2026-10-08T22:00:00Z'), views: 4, visitors: 1, bots: 0 }, // 0 Uhr in Berlin
		{ start: Date.parse('2026-08-01T15:00:00Z'), views: 99, visitors: 9, bots: 0 } // älter als 30 Tage
	];
	const profile = visits.buildDayProfile({ timeZone: 'Europe/Berlin', generatedAt, hours, days: [] });
	assert.equal(profile.length, 24);
	assert.equal(profile[17].views, 7); assert.equal(profile[17].bots, 1);
	assert.equal(profile[0].views, 4);
	assert.equal(profile.reduce((sum, slot) => sum + slot.views, 0), 11);
});

test('daily series fills days without visits and marks today', () => {
	const visits = loadAdminVisits();
	const series = visits.buildSeries({ timeZone: 'Europe/Berlin', generatedAt: Date.parse('2026-10-09T18:00:00Z'), today: '2026-10-09', hours: [], days: [{ date: '2026-10-08', views: 2, visitors: 2, bots: 0 }, { date: '2026-10-09', views: 16, visitors: 8, bots: 0 }] }, '7d');
	assert.equal(series.length, 7);
	assert.deepEqual(series.map(entry => entry.views), [0, 0, 0, 0, 0, 2, 16]);
	assert.match(series[6].title, /heute/);
});
