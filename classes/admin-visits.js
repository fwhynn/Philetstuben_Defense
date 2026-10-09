(() => {
	'use strict';

	const HOUR = 3600000;
	const DAY = 86400000;
	const RANGES = {
		'24h': { label: '24 Stunden', hours: 24 },
		'7d': { label: '7 Tage', days: 7 },
		'30d': { label: '30 Tage', days: 30 },
		'90d': { label: '90 Tage', days: 90 }
	};
	const SVG = 'http://www.w3.org/2000/svg';
	const $ = id => document.getElementById(id);
	const number = new Intl.NumberFormat('de-DE');
	const state = { range: '7d', showBots: false, data: null, timer: null };

	try {
		const saved = localStorage.getItem('autohex-admin-visit-range');
		if (RANGES[saved]) state.range = saved;
	} catch {
		// Ohne localStorage bleibt der Standardzeitraum.
	}

	const empty = () => ({ views: 0, visitors: 0, bots: 0 });
	const isoDay = time => new Date(time).toISOString().slice(0, 10);
	const shiftDay = (date, offset) => isoDay(Date.parse(date + 'T00:00:00Z') + offset * DAY);

	function formatters(timeZone) {
		return {
			hour: new Intl.DateTimeFormat('de-DE', { timeZone, hour: '2-digit', minute: '2-digit' }),
			hourOnly: new Intl.DateTimeFormat('de-DE', { timeZone, hour: '2-digit', hourCycle: 'h23' }),
			hourDay: new Intl.DateTimeFormat('de-DE', { timeZone, weekday: 'short', day: '2-digit', month: '2-digit' }),
			day: new Intl.DateTimeFormat('de-DE', { timeZone: 'UTC', weekday: 'short', day: '2-digit', month: '2-digit' }),
			dayShort: new Intl.DateTimeFormat('de-DE', { timeZone: 'UTC', day: '2-digit', month: '2-digit' })
		};
	}

	// Lückenlose Reihe für den gewählten Zeitraum; Stunden/Tage ohne Aufrufe werden als 0 ergänzt.
	function buildSeries(data, range) {
		const config = RANGES[range];
		const format = formatters(data.timeZone);

		if (config.hours) {
			const byStart = new Map(data.hours.map(entry => [entry.start, entry]));
			const currentHour = Math.floor(data.generatedAt / HOUR) * HOUR;
			return Array.from({ length: config.hours }, (_, index) => {
				const start = currentHour - (config.hours - 1 - index) * HOUR;
				const value = byStart.get(start) || empty();
				return {
					...value,
					axis: format.hour.format(start),
					title: `${format.hourDay.format(start)} · ${format.hour.format(start)}–${format.hour.format(start + HOUR)}`
				};
			});
		}

		const byDate = new Map(data.days.map(entry => [entry.date, entry]));
		return Array.from({ length: config.days }, (_, index) => {
			const date = shiftDay(data.today, index - config.days + 1);
			const time = Date.parse(date + 'T00:00:00Z');
			const value = byDate.get(date) || empty();
			return {
				...value,
				axis: config.days <= 7 ? format.day.format(time) : format.dayShort.format(time),
				title: format.day.format(time) + (date === data.today ? ' (heute)' : '')
			};
		});
	}

	// Summe der Aufrufe je Uhrzeit über die letzten 30 Tage: zeigt, wann die Seite genutzt wird.
	function buildDayProfile(data) {
		const format = formatters(data.timeZone);
		const since = data.generatedAt - 30 * DAY;
		const slots = Array.from({ length: 24 }, (_, hour) => ({ ...empty(), axis: String(hour).padStart(2, '0'), title: `${String(hour).padStart(2, '0')}:00–${String((hour + 1) % 24).padStart(2, '0')}:00 Uhr` }));
		for (const entry of data.hours) {
			if (entry.start < since) continue;
			// format() liefert auf Deutsch „17 Uhr“; nur die Stundenzahl verwenden.
			const hour = Number(format.hourOnly.formatToParts(entry.start).find(part => part.type === 'hour').value) % 24;
			const slot = slots[hour];
			slot.views += entry.views;
			slot.bots += entry.bots;
		}
		return slots;
	}

	// Obergrenze der y-Achse aus vier glatten, ganzzahligen Schritten (1, 2, 2.5, 5 × 10^n).
	function niceMax(value) {
		const raw = Math.max(1, value / 4);
		const magnitude = 10 ** Math.floor(Math.log10(raw));
		const step = [1, 2, 2.5, 5, 10].map(factor => factor * magnitude).find(candidate => candidate >= raw && Number.isInteger(candidate));
		return step * 4;
	}

	function element(name, attributes = {}, parent) {
		const node = document.createElementNS(SVG, name);
		for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
		if (parent) parent.append(node);
		return node;
	}

	// Balken mit abgerundetem Datenende, am Nullpunkt gerade abgeschnitten.
	function barPath(x, y, width, height) {
		if (height <= 0) return '';
		const radius = Math.min(4, width / 2, height);
		return `M${x},${y + height}V${y + radius}Q${x},${y} ${x + radius},${y}H${x + width - radius}Q${x + width},${y} ${x + width},${y + radius}V${y + height}Z`;
	}

	function renderChart(container, tooltip, series, { showVisitors, showBots, emptyText }) {
		container.replaceChildren();
		tooltip.classList.add('hidden');

		const width = Math.max(320, container.clientWidth || 640);
		const height = width < 560 ? 220 : 280;
		const margin = { top: 14, right: 8, bottom: 30, left: 40 };
		const plotWidth = width - margin.left - margin.right;
		const plotHeight = height - margin.top - margin.bottom;
		const total = series.reduce((sum, entry) => sum + entry.views + (showBots ? entry.bots : 0), 0);
		const peak = Math.max(0, ...series.map(entry => Math.max(entry.views + (showBots ? entry.bots : 0), showVisitors ? entry.visitors : 0)));
		const yMax = niceMax(peak);
		const y = value => margin.top + plotHeight - (value / yMax) * plotHeight;
		const slot = plotWidth / series.length;
		const barWidth = Math.max(2, Math.min(28, slot - 2));

		const svg = element('svg', { viewBox: `0 0 ${width} ${height}`, width, height, role: 'img', class: 'chartSvg' }, container);
		const totalViews = series.reduce((sum, entry) => sum + entry.views, 0);
		svg.setAttribute('aria-label', `${number.format(totalViews)} Aufrufe im Zeitraum, höchster Wert ${number.format(peak)}`);

		const grid = element('g', { class: 'chartGrid' }, svg);
		for (let tick = 0; tick <= 4; tick++) {
			const value = (yMax / 4) * tick;
			const lineY = y(value);
			element('line', { x1: margin.left, x2: width - margin.right, y1: lineY, y2: lineY, class: tick === 0 ? 'baseline' : '' }, grid);
			const label = element('text', { x: margin.left - 8, y: lineY + 4, 'text-anchor': 'end' }, grid);
			label.textContent = number.format(Math.round(value));
		}

		const labelEvery = Math.max(1, Math.ceil(series.length / Math.max(3, Math.floor(plotWidth / 64))));
		const axis = element('g', { class: 'chartAxis' }, svg);
		series.forEach((entry, index) => {
			if ((series.length - 1 - index) % labelEvery !== 0) return;
			const label = element('text', { x: margin.left + slot * index + slot / 2, y: height - 9, 'text-anchor': 'middle' }, axis);
			label.textContent = entry.axis;
		});

		const highlight = element('rect', { class: 'chartHighlight hidden', y: margin.top, height: plotHeight, width: slot, x: margin.left, rx: 4 }, svg);
		const bars = element('g', {}, svg);
		series.forEach((entry, index) => {
			const x = margin.left + slot * index + (slot - barWidth) / 2;
			const viewTop = y(entry.views);
			element('path', { d: barPath(x, viewTop, barWidth, y(0) - viewTop), class: 'barViews' }, bars);
			if (showBots && entry.bots) {
				const botTop = y(entry.views + entry.bots);
				// 2px Abstand zwischen gestapelten Segmenten.
				const gap = entry.views ? 2 : 0;
				element('path', { d: barPath(x, botTop, barWidth, viewTop - botTop - gap), class: 'barBots' }, bars);
			}
		});

		let marker = null;
		if (showVisitors) {
			const points = series.map((entry, index) => [margin.left + slot * index + slot / 2, y(entry.visitors)]);
			element('polyline', { points: points.map(point => point.join(',')).join(' '), class: 'lineVisitors' }, svg);
			if (series.length <= 31) for (const [cx, cy] of points) element('circle', { cx, cy, r: 4, class: 'dotVisitors' }, svg);
			marker = element('circle', { r: 5, class: 'dotVisitors active hidden' }, svg);
		}

		if (!total) {
			const note = element('text', { x: margin.left + plotWidth / 2, y: margin.top + plotHeight / 2, 'text-anchor': 'middle', class: 'chartEmpty' }, svg);
			note.textContent = emptyText;
		}

		// Trefferflächen über die volle Höhe jeder Spalte, größer als die Balken selbst.
		const hits = element('g', {}, svg);
		series.forEach((entry, index) => {
			const hit = element('rect', { x: margin.left + slot * index, y: margin.top, width: slot, height: plotHeight, class: 'chartHit' }, hits);
			hit.addEventListener('pointerenter', () => {
				highlight.setAttribute('x', margin.left + slot * index);
				highlight.classList.remove('hidden');
				if (marker) {
					marker.setAttribute('cx', margin.left + slot * index + slot / 2);
					marker.setAttribute('cy', y(entry.visitors));
					marker.classList.remove('hidden');
				}
				showTooltip(tooltip, container, entry, { showVisitors, showBots }, (margin.left + slot * index + slot / 2) / width);
			});
		});
		svg.addEventListener('pointerleave', () => {
			highlight.classList.add('hidden');
			marker?.classList.add('hidden');
			tooltip.classList.add('hidden');
		});
	}

	function showTooltip(tooltip, container, entry, { showVisitors, showBots }, ratio) {
		const rows = [['views', 'Aufrufe', entry.views]];
		if (showVisitors) rows.push(['visitors', 'Besucher', entry.visitors]);
		rows.push(['bots', showBots ? 'Bots' : 'Bots (ausgeblendet)', entry.bots]);

		const title = document.createElement('strong');
		title.textContent = entry.title;
		const list = document.createElement('dl');
		for (const [kind, label, value] of rows) {
			const term = document.createElement('dt');
			const swatch = document.createElement('span');
			swatch.className = `swatch ${kind}`;
			term.append(swatch, label);
			const detail = document.createElement('dd');
			detail.textContent = number.format(value);
			list.append(term, detail);
		}
		tooltip.replaceChildren(title, list);
		tooltip.classList.remove('hidden');

		const box = container.getBoundingClientRect();
		const left = Math.min(Math.max(ratio * box.width, tooltip.offsetWidth / 2 + 4), box.width - tooltip.offsetWidth / 2 - 4);
		tooltip.style.left = `${left}px`;
	}

	function setStat(name, value, detail) {
		const item = document.querySelector(`[data-visit="${name}"]`);
		if (!item) return;
		item.querySelector('[data-value]').textContent = value;
		item.querySelector('[data-detail]').textContent = detail;
	}

	function render() {
		const range = state.range;
		const config = RANGES[range];
		// Auswahl sofort zeigen, auch solange noch keine Daten geladen sind.
		for (const button of document.querySelectorAll('[data-visit-range]')) {
			button.setAttribute('aria-pressed', String(button.dataset.visitRange === range));
		}

		const data = state.data;
		if (!data) return;

		const byDate = new Map(data.days.map(entry => [entry.date, entry]));
		const today = byDate.get(data.today) || empty();
		const yesterday = byDate.get(shiftDay(data.today, -1)) || empty();
		const botNote = value => value.bots ? ` · ${number.format(value.bots)} Bots gefiltert` : '';
		setStat('today', number.format(today.views), `${number.format(today.visitors)} Besucher${botNote(today)}`);
		setStat('yesterday', number.format(yesterday.views), `${number.format(yesterday.visitors)} Besucher${botNote(yesterday)}`);

		const series = buildSeries(data, range);
		const views = series.reduce((sum, entry) => sum + entry.views, 0);
		const average = config.hours ? `Ø ${number.format(Math.round(views / config.hours * 10) / 10)} pro Stunde` : `Ø ${number.format(Math.round(views / config.days * 10) / 10)} pro Tag`;
		setStat('range', number.format(views), `${config.label} · ${average}`);
		setStat('online', number.format(data.online), 'Besucher mit offener Seite');

		$('visitRangeTitle').textContent = config.hours ? 'Aufrufe pro Stunde' : 'Aufrufe pro Tag';
		$('legendBots').classList.toggle('hidden', !state.showBots);
		renderChart($('visitChart'), $('visitTooltip'), series, { showVisitors: true, showBots: state.showBots, emptyText: 'Noch keine Aufrufe in diesem Zeitraum' });
		renderChart($('visitProfile'), $('visitProfileTooltip'), buildDayProfile(data), { showVisitors: false, showBots: state.showBots, emptyText: 'Noch keine Aufrufe in den letzten 30 Tagen' });
	}

	async function refresh() {
		try {
			state.data = await HexApi.getSiteVisits();
			$('visitStatus').textContent = '';
			render();
		} catch (error) {
			$('visitStatus').textContent = error.message;
		}
	}

	// Die „gerade online“-Zahl und die laufende Stunde bleiben ohne Klick aktuell.
	function start() {
		clearInterval(state.timer);
		state.timer = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 60000);
	}

	function stop() {
		clearInterval(state.timer);
		state.timer = null;
	}

	for (const button of document.querySelectorAll('[data-visit-range]')) {
		button.addEventListener('click', () => {
			state.range = button.dataset.visitRange;
			try { localStorage.setItem('autohex-admin-visit-range', state.range); } catch { }
			render();
		});
	}

	$('showBots').addEventListener('change', event => {
		state.showBots = event.currentTarget.checked;
		render();
	});

	let resizeFrame = 0;
	new ResizeObserver(() => {
		cancelAnimationFrame(resizeFrame);
		resizeFrame = requestAnimationFrame(render);
	}).observe($('visitChart'));

	globalThis.AdminVisits = { start, stop, refresh, buildSeries, buildDayProfile };
})();
