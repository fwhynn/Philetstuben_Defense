(() => {
	'use strict';

	const PAGE_SIZE = 25;
	const $ = id => document.getElementById(id);
	const views = ['loadingView', 'loginView', 'deniedView', 'dashboard'];
	const number = new Intl.NumberFormat('de-DE');
	const date = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
	const state = { offset: 0, sort: 'runs_played', direction: 'desc', total: 0, user: null };

	function show(view) {
		for (const id of views) $(id).classList.toggle('hidden', id !== view);
		$('logoutBtn').classList.toggle('hidden', !state.user);
		$('refreshBtn').classList.toggle('hidden', view !== 'dashboard');
	}

	function setStatus(message = '') {
		$('dashboardStatus').textContent = message;
	}

	function setMetric(name, value, detail) {
		const item = document.querySelector(`[data-metric="${name}"]`);
		if (!item) return;
		const valueNode = item.querySelector('[data-value]');
		const detailNode = item.querySelector('[data-detail]');
		if (valueNode && valueNode.textContent !== value) valueNode.textContent = value;
		if (detailNode && detail !== undefined && detailNode.textContent !== detail) detailNode.textContent = detail;
	}

	function renderStats(payload) {
		const totals = payload.totals;
		const highest = payload.max.highestWave;
		const runs = payload.max.runsPlayed;
		setMetric('accounts', number.format(totals.users), `${number.format(totals.playersWithSave)} mit Cloud-Save`);
		setMetric('runs', number.format(totals.runsPlayed));
		setMetric('highestWave', number.format(highest?.value || 0), highest?.user.username || 'Noch keine Runs');
		setMetric('mostRuns', number.format(runs?.value || 0), runs?.user.username || 'Noch keine Runs');
		setMetric('kills', number.format(totals.normalKills), `${number.format(totals.bossesKilled)} Bosse · ${number.format(totals.diamondsEarned)} Diamanten`);
		renderLive(payload.soloLive, payload.duoLive);
		$('lastUpdated').textContent = `Synchronisiert ${date.format(new Date())}`;
	}

	function setLiveRow(kind, mode, title, detail) {
		const row = document.querySelector(`[data-live="${kind}"]`);
		if (!row) return;
		const titleNode = row.querySelector('strong');
		const detailNode = row.querySelector('[data-live-detail]');
		if (!row.classList.contains(mode)) {
			row.classList.remove('online', 'offline', 'maintenance');
			row.classList.add(mode);
		}
		if (titleNode.textContent !== title) titleNode.textContent = title;
		if (detailNode.textContent !== detail) detailNode.textContent = detail;
	}

	function renderLive(soloLive, duoLive) {
		const soloPlayers = Number(soloLive?.players || 0);
		setLiveRow('solo', soloPlayers > 0 ? 'online' : 'offline', 'Solo', `${number.format(soloPlayers)} aktiv`);

		if (!duoLive) {
			setLiveRow('duo', 'offline', 'Duo', 'nicht erreichbar');
			return;
		}

		const roomWord = duoLive.rooms === 1 ? 'Lobby' : 'Lobbys';
		const extra = [
			duoLive.seatsWaiting ? `${duoLive.seatsWaiting} wartet` : '',
			duoLive.seatsDisconnected ? `${duoLive.seatsDisconnected} getrennt` : ''
		].filter(Boolean).join(' · ');
		const detail = `${duoLive.seatsConnected} aktiv · ${duoLive.rooms} ${roomWord}${extra ? ` · ${extra}` : ''}`;
		setLiveRow('duo', duoLive.maintenance ? 'maintenance' : 'online', duoLive.maintenance ? 'Duo · Wartung' : 'Duo', detail);
	}

	function renderPlayers(payload) {
		state.total = payload.pagination.total;
		const body = $('playerRows');
		body.replaceChildren();

		for (const player of payload.players) {
			const row = document.createElement('tr');
			const values = [
				player.username,
				number.format(player.runsPlayed),
				number.format(player.highestWave),
				number.format(player.normalKills),
				number.format(player.bossesKilled),
				number.format(player.diamondsEarned),
				date.format(new Date(player.updatedAt))
			];

			for (const value of values) {
				const cell = document.createElement('td');
				cell.textContent = value;
				row.append(cell);
			}

			body.append(row);
		}

		if (!payload.players.length) {
			const row = document.createElement('tr');
			const cell = document.createElement('td');
			row.className = 'emptyRow';
			cell.colSpan = 7;
			cell.textContent = state.offset ? 'Auf dieser Seite gibt es keine Spieler.' : 'Noch keine synchronisierten Spielstände.';
			row.append(cell);
			body.append(row);
		}

		const first = state.total ? state.offset + 1 : 0;
		const last = Math.min(state.offset + PAGE_SIZE, state.total);
		$('playerCount').textContent = `${number.format(first)}–${number.format(last)} von ${number.format(state.total)}`;
		$('pageInfo').textContent = `Seite ${Math.floor(state.offset / PAGE_SIZE) + 1}`;
		$('previousPage').disabled = state.offset === 0;
		$('nextPage').disabled = state.offset + PAGE_SIZE >= state.total;

		for (const button of document.querySelectorAll('[data-sort]')) {
			button.removeAttribute('aria-sort');
			if (button.dataset.sort === state.sort) {
				button.setAttribute('aria-sort', state.direction === 'asc' ? 'ascending' : 'descending');
			}
		}
	}

	async function loadStats() {
		try {
			const stats = await HexApi.getAdminStats();
			renderStats(stats);
			setStatus();
		} catch (error) {
			renderLive({ players: 0 }, null);
			throw error;
		}
	}

	async function loadPlayers() {
		const payload = await HexApi.getAdminPlayers({
			limit: PAGE_SIZE,
			offset: state.offset,
			sort: state.sort,
			direction: state.direction
		});
		renderPlayers(payload);
	}

	async function refreshAll() {
		$('refreshBtn').disabled = true;
		setStatus('Daten werden aktualisiert …');

		try {
			await Promise.all([loadStats(), loadPlayers(), AdminVisits.refresh()]);
			setStatus();
		} catch (error) {
			setStatus(error.message);
		} finally {
			$('refreshBtn').disabled = false;
		}
	}

	async function enterDashboard(user) {
		state.user = user;
		$('signedInAs').textContent = user.username;
		show('dashboard');
		AdminVisits.start();
		await refreshAll();
	}

	async function logout() {
		AdminVisits.stop();
		await HexApi.logout();
		state.user = null;
		$('signedInAs').textContent = '';
		$('loginForm').reset();
		$('loginStatus').textContent = '';
		show('loginView');
	}

	$('loginForm').addEventListener('submit', async event => {
		event.preventDefault();
		const submit = event.currentTarget.querySelector('button[type="submit"]');
		submit.disabled = true;
		$('loginStatus').textContent = 'Anmeldung wird geprüft …';

		try {
			await HexApi.login($('username').value.trim(), $('password').value);
			const user = await HexApi.currentUser();
			$('password').value = '';

			if (!user?.isAdmin) {
				state.user = user;
				$('signedInAs').textContent = user?.username || '';
				show('deniedView');
				return;
			}

			$('loginStatus').textContent = '';
			await enterDashboard(user);
		} catch (error) {
			$('loginStatus').textContent = error.message;
		} finally {
			submit.disabled = false;
		}
	});

	for (const button of document.querySelectorAll('[data-sort]')) {
		button.addEventListener('click', async () => {
			const sort = button.dataset.sort;
			state.direction = state.sort === sort && state.direction === 'desc' ? 'asc' : 'desc';
			state.sort = sort;
			state.offset = 0;
			try {
				await loadPlayers();
			} catch (error) {
				setStatus(error.message);
			}
		});
	}

	$('previousPage').addEventListener('click', async () => {
		state.offset = Math.max(0, state.offset - PAGE_SIZE);
		try { await loadPlayers(); } catch (error) { setStatus(error.message); }
	});

	$('nextPage').addEventListener('click', async () => {
		if (state.offset + PAGE_SIZE >= state.total) return;
		state.offset += PAGE_SIZE;
		try { await loadPlayers(); } catch (error) { setStatus(error.message); }
	});

	$('refreshBtn').addEventListener('click', refreshAll);
	$('logoutBtn').addEventListener('click', logout);
	$('deniedLogoutBtn').addEventListener('click', logout);

	(async () => {
		try {
			const user = await HexApi.currentUser();

			if (!user) {
				show('loginView');
			} else if (!user.isAdmin) {
				state.user = user;
				$('signedInAs').textContent = user.username;
				show('deniedView');
			} else {
				await enterDashboard(user);
			}
		} catch (error) {
			show('loginView');
			$('loginStatus').textContent = error.message;
		}
	})();
})();
