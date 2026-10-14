'use strict';

// Inject trusted account verification and durable ledger explicitly. No score-upload endpoint.
function createLeaderboardHandler({ leaderboard = null, verifyAccount = async () => null, now = Date.now } = {}) {
  const attempts = new Map();
  return async function handle(req, send) {
    const url = new URL(req.url, 'http://local');
    if (url.pathname !== '/rankings' && !url.pathname.startsWith('/rankings/')) return false;
    const fail = (status, message) => { send(status, { error: { message } }); return true; };
    if (!leaderboard) return fail(503, 'Die Bestenliste ist noch nicht verfügbar.');
    const ip = req.socket?.remoteAddress || 'unknown', time = now();
    for (const [key, value] of attempts) if (time - value.at >= 60000) attempts.delete(key);
    if (!attempts.has(ip)) { if (attempts.size >= 4096) return fail(429, 'Bitte später erneut versuchen.'); attempts.set(ip, { at: time, count: 0 }); }
    if (++attempts.get(ip).count > 120) return fail(429, 'Zu viele Anfragen. Bitte kurz warten.');
    const integer = (key, fallback) => { const raw = url.searchParams.get(key); if (raw === null) return fallback; return /^\d{1,9}$/.test(raw) ? Number(raw) : NaN; };
    if (req.method === 'GET' && url.pathname === '/rankings') {
      try { send(200, leaderboard.list({ fronts: integer('fronts', 1), offset: integer('offset', 0), limit: 50, ...(url.searchParams.has('season') ? { season: url.searchParams.get('season') } : {}) })); return true; }
      catch { return fail(400, 'Ungültige Ranglistenabfrage.'); }
    }
    const match = /^\/rankings\/results\/([a-zA-Z0-9:_-]{1,128})(?:\/(claim|review))?$/.exec(url.pathname);
    if (!match && url.pathname !== '/rankings/pending') return fail(404, 'Nicht gefunden.');
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1]; let user = null;
    if (token) {
      if (token.length > 4096) return fail(401, 'Bitte erneut anmelden.');
      try { user = await verifyAccount(token); } catch { return fail(502, 'Account-Prüfung derzeit nicht verfügbar.'); }
      if (!user) return fail(401, 'Bitte erneut anmelden.');
    }
    if (req.method === 'GET' && url.pathname === '/rankings/pending') {
      if (user?.isAdmin !== true) return fail(403, 'Diese Aktion ist nur für Administratoren verfügbar.');
      try { send(200, leaderboard.pending(user, { offset: integer('offset', 0), limit: 50 })); return true; }
      catch { return fail(400, 'Ungültige Prüflistenabfrage.'); }
    }
    if (!match) return fail(405, 'Methode nicht erlaubt.');
    const [, id, action] = match, guestToken = req.headers['x-run-token'];
    if (req.method === 'GET' && !action) {
      try { send(200, leaderboard.result(id, guestToken, user)); return true; }
      catch { return fail(403, 'Dieses Ergebnis ist nicht für diese Sitzung verfügbar.'); }
    }
    if (req.method !== 'POST' || !action) return fail(405, 'Methode nicht erlaubt.');
    if (!user) return fail(401, 'Bitte zuerst anmelden.');
    if (action === 'review' && user.isAdmin !== true) return fail(403, 'Diese Aktion ist nur für Administratoren verfügbar.');
    let packet;
    try {
      const chunks = []; let length = 0;
      for await (const chunk of req) { length += chunk.length; if (length > 4096) return fail(413, 'Anfrage zu groß.'); chunks.push(chunk); }
      packet = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      if (!packet || Array.isArray(packet) || typeof packet !== 'object') throw Error();
    } catch { return fail(400, 'Ungültige Anfrage.'); }
    if (action === 'claim') {
      if (Object.keys(packet).length) return fail(400, 'Bei der Übernahme werden keine Spielwerte akzeptiert.');
      try { send(200, leaderboard.claim(id, guestToken, user)); return true; }
      catch (error) { return fail(error.message === 'Unauthorized claim' ? 403 : 503, error.message === 'Unauthorized claim' ? 'Dieser Run kann nicht übernommen werden.' : 'Speichern fehlgeschlagen. Bitte erneut versuchen.'); }
    }
    if (Object.keys(packet).sort().join(',') !== 'decision,reason' || !['accepted','rejected'].includes(packet.decision) || typeof packet.reason !== 'string' || !packet.reason.trim() || packet.reason.length > 1000) return fail(400, 'Entscheidung und Begründung sind erforderlich.');
    try { send(200, leaderboard.review(id, packet.decision, packet.reason, user)); return true; }
    catch (error) { return fail(error.message === 'Claimed result required' ? 409 : 503, error.message === 'Claimed result required' ? 'Der Run ist keinem Account zugeordnet.' : 'Entscheidung konnte nicht gespeichert werden.'); }
  };
}
module.exports = { createLeaderboardHandler };
