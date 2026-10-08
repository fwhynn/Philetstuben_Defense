(() => {
	'use strict';

	// Anonymer Seitenaufruf-Zähler für die Admin-Übersicht: ein Aufruf beim ersten Sichtbarwerden,
	// danach ein Lebenszeichen pro Minute, solange der Tab sichtbar ist („gerade auf der Seite“).
	if (!location.protocol.startsWith('http')) return;

	const page = document.documentElement.dataset.visitPage || 'game';
	const PING_INTERVAL = 60000;
	let counted = false;
	let timer = null;

	function send(kind) {
		try {
			const body = JSON.stringify({ kind, page, webdriver: navigator.webdriver === true });
			if (navigator.sendBeacon && navigator.sendBeacon('/visit', new Blob([body], { type: 'text/plain' }))) return;
			fetch('/visit', { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => { });
		} catch {
			// Zählen ist optional und darf das Spiel nie stören.
		}
	}

	function update() {
		if (document.visibilityState !== 'visible') {
			clearInterval(timer);
			timer = null;
			return;
		}

		if (!counted) {
			counted = true;
			send('view');
		} else if (!timer) {
			send('ping');
		}

		if (!timer) timer = setInterval(() => send('ping'), PING_INTERVAL);
	}

	document.addEventListener('visibilitychange', update);
	update();
})();
