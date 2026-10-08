const { test } = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { createVisits, createAdminCheck, isBot } = require('../site-visits.cjs'), { createStore } = require('../duo-store.cjs'), { createTransport } = require('../duo-transport.cjs');
const BROWSER = { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36', acceptLanguage: 'de-DE,de;q=0.9' };
const NOON = Date.parse('2026-10-08T10:00:00Z'); // 12:00 in Berlin
function tempFile(t) { const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'visits-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true })); return path.join(dir, 'visits.json'); }
const view = (visits, ip, extra = {}) => visits.record({ kind: 'view', page: 'game', ip, ...BROWSER, ...extra });

test('views, unique visitors and bots are counted separately per Berlin day and hour', t => {
	let time = NOON; const visits = createVisits(tempFile(t), { now: () => time });
	view(visits, '1.1.1.1'); view(visits, '1.1.1.1'); view(visits, '2.2.2.2');
	view(visits, '3.3.3.3', { userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' });
	view(visits, '4.4.4.4', { acceptLanguage: '' });
	view(visits, '5.5.5.5', { webdriver: true });
	time += 3600000; view(visits, '1.1.1.1');
	const stats = visits.stats();
	assert.deepEqual(stats.days, [{ date: '2026-10-08', views: 4, visitors: 2, bots: 3 }]);
	assert.deepEqual(stats.hours.map(({ views, visitors, bots }) => [views, visitors, bots]), [[3, 2, 3], [1, 1, 0]]);
	// 23:30 UTC is already the next day in Berlin: the visitor counts again under a fresh salt.
	time = Date.parse('2026-10-08T22:30:00Z'); view(visits, '1.1.1.1');
	assert.deepEqual(visits.stats().days.at(-1), { date: '2026-10-09', views: 1, visitors: 1, bots: 0 });
});

test('mass reloads from one address are moved to bots and pings only mark visitors online', t => {
	let time = NOON; const visits = createVisits(tempFile(t), { now: () => time });
	for (let index = 0; index < 75; index++) view(visits, '9.9.9.9');
	const day = visits.stats().days[0];
	assert.equal(day.views, 60); assert.equal(day.bots, 15); assert.equal(day.visitors, 1);
	visits.record({ kind: 'ping', page: 'duo', ip: '8.8.8.8', ...BROWSER });
	assert.equal(visits.stats().days[0].views, 60); assert.equal(visits.stats().online, 2);
	time += 200000; assert.equal(visits.stats().online, 0);
	assert.deepEqual(visits.record({ kind: 'view', page: 'admin', ip: '1.1.1.1', ...BROWSER }), { ok: false });
	assert.deepEqual(visits.record({ kind: 'click', page: 'game', ip: '1.1.1.1', ...BROWSER }), { ok: false });
});

test('counts survive a restart without storing raw addresses; unreadable files are set aside', t => {
	const file = tempFile(t); let time = NOON;
	let visits = createVisits(file, { now: () => time }); view(visits, '203.0.113.7'); visits.close();
	const saved = fs.readFileSync(file, 'utf8'); assert.ok(!saved.includes('203.0.113.7')); assert.ok(!saved.includes('Chrome'));
	visits = createVisits(file, { now: () => time }); view(visits, '203.0.113.7'); view(visits, '198.51.100.1');
	assert.deepEqual(visits.stats().days[0], { date: '2026-10-08', views: 3, visitors: 2, bots: 0 });
	fs.writeFileSync(file, '{broken');
	const warn = console.warn; console.warn = () => { }; t.after(() => { console.warn = warn; });
	visits = createVisits(file, { now: () => time });
	assert.deepEqual(visits.stats().days, []);
	assert.ok(fs.readdirSync(path.dirname(file)).some(name => name.startsWith('visits.json.unreadable-')));
});

test('old hourly data is pruned while daily totals stay', t => {
	let time = NOON; const visits = createVisits(tempFile(t), { now: () => time });
	view(visits, '1.1.1.1'); time += 40 * 86400000; view(visits, '1.1.1.1');
	const stats = visits.stats(); assert.equal(stats.hours.length, 1); assert.equal(stats.days.length, 2);
});

test('bot detection keeps ordinary browsers', () => {
	assert.equal(isBot(BROWSER), false);
	assert.equal(isBot({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1', acceptLanguage: 'de' }), false);
	for (const userAgent of ['curl/8.5.0', 'python-requests/2.31', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0 Safari/537.36', 'Mozilla/5.0 (compatible; bingbot/2.0)', 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2)']) assert.equal(isBot({ userAgent, acceptLanguage: 'en' }), true, userAgent);
});

test('admin check asks the account API once per token and caches the answer', async () => {
	const calls = []; let status = 200, user = { isAdmin: true };
	const fetchImpl = async (url, options) => { calls.push([url, options.headers.Authorization]); return { status, ok: status < 300, json: async () => ({ user }) }; };
	let time = 0; const check = createAdminCheck('https://api.example.test/', { fetchImpl, now: () => time });
	assert.equal(await check('admin-token'), true); assert.equal(await check('admin-token'), true);
	assert.deepEqual(calls, [['https://api.example.test/me', 'Bearer admin-token']]);
	user = { isAdmin: false }; assert.equal(await check('player-token'), false);
	status = 401; assert.equal(await check('expired-token'), false);
	status = 500; await assert.rejects(check('other-token'));
	time = 61000; status = 200; user = { isAdmin: false }; assert.equal(await check('admin-token'), false);
	assert.equal(await check(''), false);
});

test('HTTP endpoints count same-origin beacons and only show statistics to admins', async t => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'visits-http-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
	const visits = createVisits(path.join(dir, 'visits.json'), { now: () => NOON });
	const verifyAdmin = async token => { if (token === 'down') throw Error('down'); return token === 'admin'; };
	const server = createTransport(createStore(path.join(dir, 'save.json')), { browser: true, publicOrigin: 'https://autohextd.autophil.lol', visits, verifyAdmin });
	await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
	const base = 'http://127.0.0.1:' + server.address().port, origin = 'https://autohextd.autophil.lol';
	const post = (body, headers = {}) => fetch(base + '/visit', { method: 'POST', body, headers: { 'Content-Type': 'text/plain', Origin: origin, 'User-Agent': BROWSER.userAgent, 'Accept-Language': BROWSER.acceptLanguage, ...headers } });
	assert.equal((await post(JSON.stringify({ kind: 'view', page: 'game' }), { 'X-Real-IP': '203.0.113.1' })).status, 204);
	assert.equal((await post(JSON.stringify({ kind: 'view', page: 'duo' }), { 'X-Real-IP': '203.0.113.2' })).status, 204);
	assert.equal((await post(JSON.stringify({ kind: 'view', page: 'game' }), { 'X-Real-IP': '203.0.113.3', 'User-Agent': 'curl/8.5.0' })).status, 204);
	assert.equal((await post(JSON.stringify({ kind: 'view', page: 'game' }), { Origin: 'https://evil.test' })).status, 403);
	assert.equal((await post('not json')).status, 400);
	assert.equal((await post(JSON.stringify({ kind: 'view', page: 'nope' }))).status, 400);
	assert.equal((await post('x'.repeat(2000))).status, 413);
	assert.equal((await fetch(base + '/visits')).status, 401);
	assert.equal((await fetch(base + '/visits', { headers: { Authorization: 'Bearer player' } })).status, 403);
	assert.equal((await fetch(base + '/visits', { headers: { Authorization: 'Bearer down' } })).status, 502);
	const response = await fetch(base + '/visits', { headers: { Authorization: 'Bearer admin' } });
	assert.equal(response.status, 200);
	const stats = await response.json();
	assert.deepEqual(stats.days, [{ date: '2026-10-08', views: 2, visitors: 2, bots: 1 }]);
	assert.equal(stats.timeZone, 'Europe/Berlin');
});

test('behind the local proxy the address appended by the proxy is used', async t => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'visits-proxy-')); t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
	const seen = []; const visits = { record: entry => { seen.push(entry.ip); return { ok: true }; }, stats: () => ({}) };
	const server = createTransport(createStore(path.join(dir, 'save.json')), { browser: true, visits });
	await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
	const base = 'http://127.0.0.1:' + server.address().port, body = JSON.stringify({ kind: 'view', page: 'game' });
	await fetch(base + '/visit', { method: 'POST', body, headers: { 'X-Forwarded-For': '198.51.100.9, 203.0.113.5' } });
	await fetch(base + '/visit', { method: 'POST', body });
	assert.deepEqual(seen, ['203.0.113.5', '127.0.0.1']);
});

test('game and Duo lobby load the visit beacon; admin loads the chart', () => {
	const root = path.resolve(__dirname, '../..');
	assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /classes\/site-visit\.js/);
	const lobby = fs.readFileSync(path.join(root, 'duo-lobby.html'), 'utf8');
	assert.match(lobby, /classes\/site-visit\.js/); assert.match(lobby, /data-visit-page="duo"/);
	assert.match(fs.readFileSync(path.join(root, 'admin.html'), 'utf8'), /classes\/admin-visits\.js/);
	for (const config of ['deploy/Caddyfile', 'deploy/systemd/nginx-duo.conf']) assert.match(fs.readFileSync(path.join(root, config), 'utf8'), /visits?/, config);
});
