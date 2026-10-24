(() => {
	'use strict';
	if(globalThis.HexChallengeLab?.active)return;

	const productionBaseUrl = 'https://api.autohextd.zlyfer.net';
	const configuredBaseUrl = globalThis.AUTOHEX_CONFIG && globalThis.AUTOHEX_CONFIG.apiBaseUrl;
	const baseUrl = typeof configuredBaseUrl === 'string' && configuredBaseUrl
		? configuredBaseUrl.replace(/\/+$/, '')
		: productionBaseUrl;
	// Never send a production login token to a separately configured test API.
	const TOKEN_KEY = baseUrl === productionBaseUrl
		? 'hex-bastion-auth-token'
		: 'hex-bastion-auth-token:' + baseUrl;
	// This baseline belongs to the loaded profile, never to a freshly probed cloud save.
	let saveRevision, pendingSave = null;
	let sessionToken = getToken();
	let statsStatus = null;
	function assertSession() { if (getToken() !== sessionToken) throw saveError('Der Account wurde in einem anderen Tab geändert. Bitte die Seite neu laden.'); }
	try { saveRevision = JSON.parse(localStorage.getItem(TOKEN_KEY + ':save-base') || 'null'); } catch {}
	function rememberRevision(token, revision) {
		saveRevision = { token, revision };
		try { localStorage.setItem(TOKEN_KEY + ':save-base', JSON.stringify(pendingSave ? { token, revision: null } : saveRevision)); } catch {}
	}
	function commitLoadedSave(data) {
		if (!pendingSave || pendingSave.data !== data || pendingSave.token !== getToken()) throw saveError('Der geladene Account-Spielstand ist nicht mehr aktuell.');
		pendingSave = null;
		rememberRevision(saveRevision.token, saveRevision.revision);
	}
	function saveError(message, status = 409) { return Object.assign(new Error(message), { status }); }
	function rememberUser(user) { if(user?.id != null) localStorage.setItem(TOKEN_KEY + ':user',JSON.stringify({token:getToken(),id:user.id})); }
	function storedUserId() { try { const user=JSON.parse(localStorage.getItem(TOKEN_KEY+':user')); return user?.token===getToken()?user.id:null; } catch {return null;} }

	async function parseJson(response) {
		const payload = await response.json().catch(() => null);

		if (!response.ok) {
			const message = payload && payload.error && payload.error.message
				? payload.error.message
				: `API request failed with status ${response.status}`;
			throw saveError(message, response.status);
		}

		return payload;
	}

	function getToken() {
		try {
			return localStorage.getItem(TOKEN_KEY);
		} catch {
			return null;
		}
	}

	function setToken(token) {
		try {
			localStorage.setItem(TOKEN_KEY, token);
		} catch {
			// Kein localStorage (privater Modus o. Ä.): Login funktioniert dann nur für diese Sitzung nicht dauerhaft.
		}
	}

	function clearToken() {
		try {
			localStorage.removeItem(TOKEN_KEY);
		} catch {
			// siehe setToken
		}
	}

	function authHeaders() {
		assertSession();
		const token = getToken();
		return token ? { Authorization: `Bearer ${token}` } : {};
	}

	async function getUserById(id) {
		const response = await fetch(`${baseUrl}/users/${encodeURIComponent(id)}`, {
			method: 'GET',
			headers: {
				Accept: 'application/json'
			},
			cache: 'no-store'
		});

		return parseJson(response);
	}

	async function register(username, password) {
		const response = await fetch(`${baseUrl}/register`, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ username, password })
		});

		const payload = await parseJson(response);
		setToken(payload.token);
		sessionToken = payload.token;
		rememberRevision(payload.token, 'empty');
		rememberUser(payload.user);
		return payload.user;
	}

	async function login(username, password) {
		const response = await fetch(`${baseUrl}/login`, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ username, password })
		});

		const payload = await parseJson(response);
		setToken(payload.token);
		sessionToken = payload.token;
		rememberRevision(payload.token, null);
		rememberUser(payload.user);
		return payload.user;
	}

	async function logout() {
		assertSession();
		const token = getToken();
		clearToken();
		sessionToken = null;

		if (!token) {
			return;
		}

		await fetch(`${baseUrl}/logout`, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${token}`
			}
		}).catch(() => {
			// Token ist lokal schon entfernt; ein fehlgeschlagener Serveraufruf blockt den Logout nicht.
		});
	}

	async function currentUser() {
		assertSession();
		const token = getToken();
		if (!getToken()) {
			return null;
		}

		const response = await fetch(`${baseUrl}/me`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				...authHeaders()
			},
			cache: 'no-store'
		});

		if (getToken() !== token) throw saveError('Account wurde inzwischen gewechselt.');
		if (response.status === 401) {
			clearToken();
			sessionToken = null;
			return null;
		}

		const payload = await parseJson(response);
		if (getToken() !== token) throw saveError('Account wurde inzwischen gewechselt.');
		rememberUser(payload.user); return payload.user;
	}

	async function getSave({ deferCommit = false } = {}) {
		assertSession();
		const token = getToken();
		const response = await fetch(`${baseUrl}/saves`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				...authHeaders()
			},
			cache: 'no-store'
		});

		if (response.status === 404) {
			if (getToken() === token) rememberRevision(token, null);
			return null;
		}

		const payload = await parseJson(response);
		if (getToken() !== token) throw saveError('Account wurde inzwischen gewechselt.');
		pendingSave = deferCommit && payload.data ? { token, data: payload.data } : null;
		statsStatus = payload.statsStatus || null;
		rememberRevision(token, payload.revision || null);
		return payload.data;
	}

	async function putSave(data) {
		assertSession();
		const token = getToken();
		if (!token || saveRevision?.token !== token || !saveRevision.revision) {
			throw saveError('Cloud-Speicherung angehalten: Bitte zuerst den Account-Spielstand laden. Der lokale Stand bleibt erhalten.');
		}
		const body = typeof data === 'string' ? JSON.parse(data) : { ...data };
		body._baseRevision = saveRevision.revision;
		// Capability check also makes a client-first deployment fail closed on an old API.
		// Do not adopt this revision: doing so would bless a stale local profile.
		const probe = await fetch(`${baseUrl}/saves`, { headers: { Accept: 'application/json', ...authHeaders() }, cache: 'no-store' });
		const remote = await parseJson(probe);
		if (!remote?.revision) throw saveError('Die API unterstützt noch keine sichere Cloud-Speicherung.', 428);
		if (remote.revision !== body._baseRevision) throw saveError('Cloud-Speicherung angehalten: Ein neuerer Account-Spielstand liegt vor. Dein lokaler Stand bleibt erhalten. Bitte den Account-Spielstand laden.');
		if (getToken() !== token) throw saveError('Account wurde inzwischen gewechselt.');
		const response = await fetch(`${baseUrl}/saves`, {
			method: 'PUT',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				...authHeaders()
			},
			body: JSON.stringify(body)
		});

		const payload = await parseJson(response);
		if (getToken() !== token) throw saveError('Account wurde inzwischen gewechselt.');
		if (!payload.revision) throw saveError('Die API unterstützt noch keine sichere Cloud-Speicherung.', 428);
		rememberRevision(token, payload.revision);
		statsStatus = payload.statsStatus || null;
		return payload;
	}

	async function pulsePresence({ mode = 'solo', wave = 0 } = {}) {
		if (!getToken()) {
			return null;
		}

		const response = await fetch(`${baseUrl}/presence`, {
			method: 'PUT',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				...authHeaders()
			},
			body: JSON.stringify({ mode, wave }),
			cache: 'no-store'
		});

		return parseJson(response);
	}

	async function clearPresence() {
		const token = getToken();
		if (!token) {
			return;
		}

		await fetch(`${baseUrl}/presence`, {
			method: 'DELETE',
			headers: {
				Accept: 'application/json',
				Authorization: `Bearer ${token}`
			},
			keepalive: true
		}).catch(() => {
			// Presence is best-effort; logout or offline must not break the game.
		});
	}

	async function getAdminStats() {
		const response = await fetch(`${baseUrl}/admin/stats`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				...authHeaders()
			},
			cache: 'no-store'
		});

		return parseJson(response);
	}

	// Der Besucherzähler läuft im Duo-Server auf der Spiel-Domain, nicht in der Account-API.
	async function getSiteVisits() {
		const response = await fetch('/visits', {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				...authHeaders()
			},
			cache: 'no-store'
		});

		if (response.ok) {
			return response.json();
		}

		const messages = {
			401: 'Besucherstatistik: bitte neu anmelden.',
			403: 'Kein Zugriff auf die Besucherstatistik.',
			404: 'Besucherzähler ist auf dem Server noch nicht eingerichtet.',
			502: 'Besucherzähler: Duo-Server oder Account-API nicht erreichbar.'
		};
		throw new Error(messages[response.status] || `Besucherstatistik nicht verfügbar (Status ${response.status}).`);
	}

	async function getAdminPlayers({ limit = 25, offset = 0, sort = 'runs_played', direction = 'desc' } = {}) {
		const parameters = new URLSearchParams({ limit, offset, sort, direction });
		const response = await fetch(`${baseUrl}/admin/players?${parameters}`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				...authHeaders()
			},
			cache: 'no-store'
		});

		return parseJson(response);
	}

	// Öffentliche Topliste der Account-API: ohne Token, damit sie für alle gleich ist und gecacht werden darf.
	async function getPublicLeaderboard(sort = 'highest_wave') {
		const response = await fetch(`${baseUrl}/leaderboard?${new URLSearchParams({ sort })}`, {
			method: 'GET',
			headers: {
				Accept: 'application/json'
			}
		});

		return parseJson(response);
	}

	async function rankingRequest(path, { method = 'GET', body, guestToken } = {}) {
		const response = await fetch('/rankings' + path, {
			method, cache: 'no-store', signal: AbortSignal.timeout(10000),
			headers: { Accept: 'application/json', ...authHeaders(), ...(body ? { 'Content-Type': 'application/json' } : {}), ...(guestToken ? { 'X-Run-Token': guestToken } : {}) },
			...(body ? { body: JSON.stringify(body) } : {})
		});
		if (response.status === 404 || response.status === 503) throw Error('Die Bestenliste ist noch nicht verfügbar. Bitte später erneut versuchen.');
		return parseJson(response);
	}
	async function runRankingRequest(path, body, greed=false) {
 const response=await fetch(baseUrl+(greed?'/greed-leaderboard':'/run-leaderboard')+path,{method:body?'POST':'GET',cache:'no-store',signal:AbortSignal.timeout(10000),headers:{Accept:'application/json',...authHeaders(),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 return parseJson(response);
 }
 globalThis.HexApi = {
 getGreedLeaderboard:(mode,day)=>runRankingRequest('?'+new URLSearchParams({mode,day}),undefined,true),
 getRunLeaderboard:mode=>runRankingRequest('?'+new URLSearchParams({mode})),
 previewRunRanking:run=>runRankingRequest('/preview?'+new URLSearchParams({mode:run.mode,wave:run.wave,kills:run.kills,...(run.day?{day:run.day,gold:run.gold}:{})}),undefined,run.mode.startsWith('greed')),
 submitRunRanking:run=>runRankingRequest('',run,run.mode.startsWith('greed')),
 getPendingGreedRankings:()=>runRankingRequest('/pending',undefined,true),
 reviewGreedRanking:(id,revision,decision)=>runRankingRequest('/'+encodeURIComponent(id)+'/review',{revision,decision},true),
 getPendingRunRankings:()=>runRankingRequest('/pending'),
 reviewRunRanking:(id,revision,decision,reason)=>runRankingRequest('/'+encodeURIComponent(id)+'/review',{revision,decision,reason}),
 deleteRunRanking:(id,revision)=>runRankingRequest('/'+encodeURIComponent(id)+'/delete',{revision}),
		getLeaderboard: (fronts = 1, offset = 0) => rankingRequest('?' + new URLSearchParams({ fronts, offset })),
		getRankedResult: session => rankingRequest('/results/' + encodeURIComponent(session.runId), { guestToken: session.token }),
		claimRankedResult: session => rankingRequest('/results/' + encodeURIComponent(session.runId) + '/claim', { method: 'POST', body: {}, guestToken: session.token }),
		getPendingRankings: (offset = 0) => rankingRequest('/pending?' + new URLSearchParams({ offset })),
		reviewRanking: (runId, decision, reason) => rankingRequest('/results/' + encodeURIComponent(runId) + '/review', { method: 'POST', body: { decision, reason } }),
		baseUrl,
		storedUserId,
		get statsStatus(){return statsStatus;},
		getUserById,
		register,
		login,
		logout,
		currentUser,
		getSave,
		commitLoadedSave,
		putSave,
		pulsePresence,
		clearPresence,
		getAdminStats,
		getAdminPlayers,
		getPublicLeaderboard,
		getSiteVisits,
		isLoggedIn: () => !!getToken(),
	};
})();
