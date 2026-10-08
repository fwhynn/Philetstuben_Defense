(() => {
	'use strict';

	const productionBaseUrl = 'https://api.autohextd.zlyfer.net';
	const configuredBaseUrl = globalThis.AUTOHEX_CONFIG && globalThis.AUTOHEX_CONFIG.apiBaseUrl;
	const baseUrl = typeof configuredBaseUrl === 'string' && configuredBaseUrl
		? configuredBaseUrl.replace(/\/+$/, '')
		: productionBaseUrl;
	const TOKEN_KEY = 'hex-bastion-auth-token';

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

	globalThis.HexApi = {
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
		isLoggedIn: () => !!getToken(),
	};
})();
