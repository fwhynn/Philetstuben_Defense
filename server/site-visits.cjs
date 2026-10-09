'use strict';
// Privacy-friendly page view counter for the admin dashboard.
// No raw IPs are stored: visitors are counted as salted hashes and the salt is replaced every day,
// so one person can be counted per day but never followed across days.
const fs = require('node:fs'), crypto = require('node:crypto'), { atomicWrite } = require('./duo-store.cjs');
const HOUR = 3600000, KEEP_HOURS = 35 * 24, KEEP_DAYS = 400, ONLINE_WINDOW = 150000, VIEWS_PER_IP_HOUR = 60, TRACK_LIMIT = 50000;
const PAGES = new Set(['game', 'duo']), KINDS = new Set(['view', 'ping']);
const BOT_PATTERN = /bot\b|bot[/;_-]|crawl|spider|slurp|archiver|headless|lighthouse|pagespeed|prerender|phantom|selenium|puppeteer|playwright|python|curl|wget|httpclient|okhttp|axios|node-fetch|undici|go-http|java\/|libwww|scrapy|facebookexternalhit|embedly|monitor|uptime|pingdom|scanner|preview/i;

function isBot({ userAgent = '', acceptLanguage = '', webdriver = false } = {}) {
	// Real browsers always send a User-Agent and Accept-Language; simple scripts and crawlers often do not.
	return webdriver === true || !userAgent || !acceptLanguage || BOT_PATTERN.test(userAgent);
}

function createVisits(file, { now = () => Date.now(), write = atomicWrite, timeZone = 'Europe/Berlin', randomSalt = () => crypto.randomBytes(32).toString('hex') } = {}) {
	const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
	const dayKey = time => dayFormat.format(time);
	const hours = new Map(), days = new Map(), online = new Map(), ipViews = new Map();
	let current = { date: '', salt: '', hour: -1, dayVisitors: new Set(), hourVisitors: new Set() }, dirty = false, timer = null, failed = false;
	load();

	function load() {
		if (!fs.existsSync(file)) return;
		try {
			const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
			if (saved?.format !== 'autohex-visits' || saved.version !== 1) throw Error('format');
			for (const [hour, views, visitors, bots] of saved.hours) hours.set(hour, { views, visitors, bots });
			for (const [date, views, visitors, bots] of saved.days) days.set(date, { views, visitors, bots });
			const c = saved.current;
			if (c && typeof c.salt === 'string') current = { date: c.date, salt: c.salt, hour: c.hour, dayVisitors: new Set(c.dayVisitors), hourVisitors: new Set(c.hourVisitors) };
		} catch {
			// Counter data must never block the Duo server; keep the unreadable file for inspection and start fresh.
			try { fs.renameSync(file, file + '.unreadable-' + new Date(now()).toISOString().replace(/[:.]/g, '-')); } catch { }
			hours.clear(); days.clear();
			console.warn('Besucherzähler: gespeicherte Datei unlesbar, beginne neu.');
		}
	}

	function rollover(time) {
		const date = dayKey(time), hour = Math.floor(time / HOUR);
		if (date !== current.date) {
			current.date = date; current.salt = randomSalt(); current.dayVisitors = new Set(); online.clear(); dirty = true;
			const keep = new Set([...days.keys()].sort().slice(-KEEP_DAYS));
			for (const key of days.keys()) if (!keep.has(key)) days.delete(key);
		}
		if (hour !== current.hour) {
			current.hour = hour; current.hourVisitors = new Set(); ipViews.clear(); dirty = true;
			for (const key of hours.keys()) if (key <= hour - KEEP_HOURS) hours.delete(key);
		}
	}

	const digest = (...parts) => crypto.createHash('sha256').update(current.salt + '\n' + parts.join('\n')).digest('hex').slice(0, 16);
	const bucket = (map, key) => { let value = map.get(key); if (!value) map.set(key, value = { views: 0, visitors: 0, bots: 0 }); return value; };

	function record({ kind, page, ip = '', userAgent = '', acceptLanguage = '', webdriver = false } = {}) {
		if (!KINDS.has(kind) || !PAGES.has(page)) return { ok: false };
		const time = now();
		rollover(time);
		const bot = isBot({ userAgent, acceptLanguage, webdriver }), visitor = digest(ip, userAgent);
		if (kind === 'ping') {
			if (!bot && (online.has(visitor) || online.size < TRACK_LIMIT)) online.set(visitor, time);
			return { ok: true, bot };
		}
		const hourly = bucket(hours, current.hour), daily = bucket(days, current.date), ipKey = digest(ip);
		const known = ipViews.has(ipKey) || ipViews.size < TRACK_LIMIT, count = (ipViews.get(ipKey) || 0) + 1;
		if (known) ipViews.set(ipKey, count);
		dirty = true;
		// Hundreds of reloads from one address within an hour are treated like bot traffic.
		if (bot || !known || count > VIEWS_PER_IP_HOUR) { hourly.bots++; daily.bots++; return { ok: true, bot: true }; }
		hourly.views++; daily.views++;
		if (current.dayVisitors.size < TRACK_LIMIT) current.dayVisitors.add(visitor);
		if (current.hourVisitors.size < TRACK_LIMIT) current.hourVisitors.add(visitor);
		daily.visitors = current.dayVisitors.size; hourly.visitors = current.hourVisitors.size;
		if (online.has(visitor) || online.size < TRACK_LIMIT) online.set(visitor, time);
		return { ok: true, bot: false };
	}

	function onlineCount(time) {
		let count = 0;
		for (const [visitor, seen] of online) if (time - seen > ONLINE_WINDOW) online.delete(visitor); else count++;
		return count;
	}

	function stats() {
		const time = now();
		rollover(time);
		return {
			timeZone,
			generatedAt: time,
			today: current.date,
			online: onlineCount(time),
			hours: [...hours].sort((a, b) => a[0] - b[0]).map(([hour, value]) => ({ start: hour * HOUR, ...value })),
			days: [...days].sort((a, b) => a[0] < b[0] ? -1 : 1).map(([date, value]) => ({ date, ...value }))
		};
	}

	function snapshot() {
		return {
			format: 'autohex-visits', version: 1,
			hours: [...hours].map(([hour, v]) => [hour, v.views, v.visitors, v.bots]),
			days: [...days].map(([date, v]) => [date, v.views, v.visitors, v.bots]),
			current: { date: current.date, salt: current.salt, hour: current.hour, dayVisitors: [...current.dayVisitors], hourVisitors: [...current.hourVisitors] }
		};
	}

	function flush() {
		if (!dirty) return;
		write(file, JSON.stringify(snapshot()));
		dirty = false; failed = false;
	}

	function startAutosave(interval = 30000) {
		clearInterval(timer);
		timer = setInterval(() => {
			try { flush(); } catch { if (!failed) console.error('Besucherzähler konnte nicht gespeichert werden.'); failed = true; }
		}, interval);
		timer.unref?.();
	}

	function close() {
		clearInterval(timer); timer = null;
		flush();
	}

	return { record, stats, flush, startAutosave, close };
}

// Admin check for the dashboard: the account API decides who is an admin, the Duo server only asks.
function createAdminCheck(apiBaseUrl, { fetchImpl = globalThis.fetch, now = () => Date.now(), ttl = 60000, log = console.warn } = {}) {
	const base = String(apiBaseUrl).replace(/\/+$/, ''), cache = new Map();
	// Erklärt im Journal, warum die Statistik abgelehnt wurde (nie mit Token), höchstens einmal pro Minute je Grund.
	const reported = new Map();
	const report = (reason, time) => { if (time - (reported.get(reason) ?? -Infinity) < 60000) return; reported.set(reason, time); log(`Besucherstatistik abgelehnt: ${base}/me ${reason}`); };
	return async token => {
		if (typeof token !== 'string' || !token || token.length > 4096) return false;
		const key = crypto.createHash('sha256').update(token).digest('hex'), cached = cache.get(key), time = now();
		if (cached && time - cached.at < ttl) return cached.admin;
		let response;
		try { response = await fetchImpl(base + '/me', { headers: { Accept: 'application/json', Authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(5000) }); }
		catch (error) { report('nicht erreichbar (' + (error.cause?.code || error.name) + ')', time); throw error; }
		let admin;
		if (response.status === 401 || response.status === 403) { admin = false; report('antwortete ' + response.status, time); }
		else if (!response.ok) { report('antwortete ' + response.status, time); throw Error('account-api-' + response.status); }
		else { const payload = await response.json().catch(() => null), flag = payload?.user?.isAdmin; admin = flag === true || flag === 1 || flag === '1'; if (!admin) report('meldet isAdmin=' + JSON.stringify(flag ?? null), time); }
		if (cache.size > 200) cache.clear();
		cache.set(key, { admin, at: time });
		return admin;
	};
}

module.exports = { createVisits, createAdminCheck, isBot };
