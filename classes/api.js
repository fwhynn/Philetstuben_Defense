(() => {
	'use strict';

	const productionBaseUrl = 'https://api.autohextd.zlyfer.net';
	const configuredBaseUrl = globalThis.AUTOHEX_CONFIG && globalThis.AUTOHEX_CONFIG.apiBaseUrl;
	const baseUrl = typeof configuredBaseUrl === 'string' && configuredBaseUrl
		? configuredBaseUrl.replace(/\/+$/, '')
		: productionBaseUrl;
	// Never send a production login token to a separately configured test API.
	const TOKEN_KEY = baseUrl === productionBaseUrl
		? 'hex-bastion-auth-token'
		: 'hex-bastion-auth-token:' + baseUrl;

	async function parseJson(response) {
		const payload = await response.json().catch(() => null);

		if (!response.ok) {
			const message = payload && payload.error && payload.error.message
				? payload.error.message
				: `API request failed with status ${response.status}`;
			throw new Error(message);
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
		return payload.user;
	}

	async function logout() {
		const token = getToken();
		clearToken();

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

		if (response.status === 401) {
			clearToken();
			return null;
		}

		const payload = await parseJson(response);
		return payload.user;
	}

	async function getSave() {
		const response = await fetch(`${baseUrl}/saves`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				...authHeaders()
			},
			cache: 'no-store'
		});

		if (response.status === 404) {
			return null;
		}

		const payload = await parseJson(response);
		return payload.data;
	}

	async function putSave(data) {
		const response = await fetch(`${baseUrl}/saves`, {
			method: 'PUT',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				...authHeaders()
			},
			body: typeof data === 'string' ? data : JSON.stringify(data)
		});

		return parseJson(response);
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
	async function runRankingRequest(path, body) {
 const response=await fetch(baseUrl+'/run-leaderboard'+path,{method:body?'POST':'GET',cache:'no-store',signal:AbortSignal.timeout(10000),headers:{Accept:'application/json',...authHeaders(),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 return parseJson(response);
 }
 globalThis.HexApi = {
 getRunLeaderboard:mode=>runRankingRequest('?'+new URLSearchParams({mode})),
 previewRunRanking:run=>runRankingRequest('/preview?'+new URLSearchParams({mode:run.mode,wave:run.wave,kills:run.kills})),
 submitRunRanking:run=>runRankingRequest('',run),
 getPendingRunRankings:()=>runRankingRequest('/pending'),
 reviewRunRanking:(id,revision,decision,reason)=>runRankingRequest('/'+encodeURIComponent(id)+'/review',{revision,decision,reason}),
		getLeaderboard: (fronts = 1, offset = 0) => rankingRequest('?' + new URLSearchParams({ fronts, offset })),
		getRankedResult: session => rankingRequest('/results/' + encodeURIComponent(session.runId), { guestToken: session.token }),
		claimRankedResult: session => rankingRequest('/results/' + encodeURIComponent(session.runId) + '/claim', { method: 'POST', body: {}, guestToken: session.token }),
		getPendingRankings: (offset = 0) => rankingRequest('/pending?' + new URLSearchParams({ offset })),
		reviewRanking: (runId, decision, reason) => rankingRequest('/results/' + encodeURIComponent(runId) + '/review', { method: 'POST', body: { decision, reason } }),
		baseUrl,
		getUserById,
		register,
		login,
		logout,
		currentUser,
		getSave,
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
