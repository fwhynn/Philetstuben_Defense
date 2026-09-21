(() => {
	'use strict';

	const baseUrl = 'https://api.autohextd.zlyfer.net';
	let testUserRequest = null;

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

	function fetchTestUserOnce() {
		if (testUserRequest) return testUserRequest;

		testUserRequest = getUserById(0)
			.then((payload) => {
				console.info('Autohex TD API test user loaded:', payload);
				return payload;
			})
			.catch((error) => {
				console.warn('Autohex TD API test user request failed:', error);
				throw error;
			});

		return testUserRequest;
	}

	globalThis.HexApi = {
		baseUrl,
		getUserById,
		fetchTestUserOnce,
	};
})();