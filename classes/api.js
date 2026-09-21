(() => {
	'use strict';

	const baseUrl = 'https://api.autohextd.zlyfer.net';

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

	globalThis.HexApi = {
		baseUrl,
		getUserById,
	};
})();