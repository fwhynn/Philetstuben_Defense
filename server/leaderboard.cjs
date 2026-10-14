'use strict';

// Internal service only. Results must come from the authoritative simulation,
// identities from the account verifier; never pass browser JSON to record().
const crypto = require('node:crypto');
const clone = value => JSON.parse(JSON.stringify(value));
const text = value => typeof value === 'string' && value.length > 0 && value.length <= 128;
const natural = value => Number.isSafeInteger(value) && value >= 0;
const better = (a, b) => a.wave > b.wave || a.wave === b.wave && a.kills > b.kills;
const equal = (a, b) => a.wave === b.wave && a.kills === b.kills;
const digest = value => crypto.createHash('sha256').update(value).digest('hex');

function createLeaderboard({ snapshot, persist = () => {}, now = Date.now, season = 'initial' } = {}) {
  let data = snapshot ? clone(snapshot) : { format: 'autohex-leaderboard', version: 1, season, results: [] };
  function validResult(r) {
    return r && text(r.runId) && text(r.season) && text(r.ruleset) && natural(r.wave) && natural(r.kills)
      && Number.isSafeInteger(r.fronts) && r.fronts > 0 && natural(r.finishedAt)
      && (r.account === null || text(r.account?.id) && text(r.account?.name))
      && ['pending','accepted','rejected'].includes(r.status) && Array.isArray(r.reviews)
      && (r.claimHash === null || /^[a-f0-9]{64}$/.test(r.claimHash));
  }
  if (data.format !== 'autohex-leaderboard' || data.version !== 1 || !text(data.season)
    || !Array.isArray(data.results) || data.results.some(r => !validResult(r))
    || new Set(data.results.map(r => r.runId)).size !== data.results.length) throw Error('Invalid leaderboard checkpoint');

  // Persist before publishing any mutation; failed writes leave the old state intact.
  function commit(next) { persist(clone(next)); data = next; }
  function publicRow(r) {
    return { runId: r.runId, username: r.account?.name ?? null, wave: r.wave, kills: r.kills,
      fronts: r.fronts, season: r.season, ruleset: r.ruleset, finishedAt: r.finishedAt, status: r.status };
  }
  function bests(fronts, selectedSeason, excluding = null) {
    const byAccount = new Map();
    for (const r of data.results) {
      if (!r.account || r.status !== 'accepted' || r.account.id === excluding || r.fronts !== fronts || r.season !== selectedSeason) continue;
      const previous = byAccount.get(r.account.id);
      if (!previous || better(r, previous) || equal(r, previous) && r.finishedAt < previous.finishedAt) byAccount.set(r.account.id, r);
    }
    return [...byAccount.values()].sort((a, b) => b.wave - a.wave || b.kills - a.kills || a.finishedAt - b.finishedAt || a.runId.localeCompare(b.runId));
  }
  function standing(r) {
    const others = bests(r.fronts, r.season, r.account?.id);
    const own = r.account && bests(r.fronts, r.season).find(row => row.account.id === r.account.id);
    return { ...publicRow(r), rank: 1 + others.filter(other => better(other, r)).length,
      provisional: !r.account || r.status !== 'accepted', personalBest: !!own && own.runId === r.runId,
      best: own ? { ...publicRow(own), rank: 1 + others.filter(other => better(other, own)).length } : null };
  }
  return {
    get season() { return data.season; },
    checkpoint() { return clone(data); },
    result(runId, claimToken, verifiedAccount) {
      const r = data.results.find(row => row.runId === runId);
      const owner = r?.account && verifiedAccount?.id === r.account.id;
      const guest = !r?.account && r?.claimHash && typeof claimToken === 'string' && /^[a-f0-9]{64}$/.test(claimToken)
        && crypto.timingSafeEqual(Buffer.from(r.claimHash, 'hex'), Buffer.from(digest(claimToken), 'hex'));
      if (!r || !owner && !guest) throw Error('Unauthorized result');
      return standing(r);
    },
    // Caller must authorize administration. A release/version change never calls this.
    changeSeason(value) { if (!text(value)) throw Error('Invalid season'); commit({ ...data, season: value }); },
    pending(verifiedAdmin, { offset = 0, limit = 50 } = {}) {
      if (verifiedAdmin?.isAdmin !== true || !text(verifiedAdmin.id)) throw Error('Administrator required');
      if (!natural(offset) || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw Error('Invalid review query');
      const rows = data.results.filter(r => r.account && r.status === 'pending');
      return { total: rows.length, entries: rows.slice(offset, offset + limit).map(publicRow) };
    },
    record({ runId, ruleset, fronts, wave, kills, account = null, claimToken = null, season: runSeason = data.season }) {
      if (claimToken !== null && (typeof claimToken !== 'string' || !/^[a-f0-9]{64}$/.test(claimToken))) throw Error('Invalid claim credential');
      const r = { runId, ruleset, fronts, wave, kills, season: runSeason, account: account ? clone(account) : null,
        claimHash: !account && claimToken ? digest(claimToken) : null, finishedAt: now(), status: 'pending', reviews: [] };
      if (!validResult(r) || !account && !r.claimHash) throw Error('Invalid verified result');
      const existing = data.results.find(row => row.runId === runId);
      if (existing) {
        if (existing.ruleset !== ruleset || existing.fronts !== fronts || existing.season !== runSeason || !equal(existing, r)) throw Error('Conflicting result');
        return standing(existing);
      }
      commit({ ...data, results: [...data.results, r] });
      return standing(r);
    },
    claim(runId, claimToken, verifiedAccount) {
      if (!text(verifiedAccount?.id) || !text(verifiedAccount?.name) || typeof claimToken !== 'string' || !/^[a-f0-9]{64}$/.test(claimToken)) throw Error('Unauthorized claim');
      const r = data.results.find(row => row.runId === runId);
      if (!r?.claimHash || !crypto.timingSafeEqual(Buffer.from(r.claimHash, 'hex'), Buffer.from(digest(claimToken), 'hex'))
        || r.account && r.account.id !== verifiedAccount.id) throw Error('Unauthorized claim');
      if (r.account) return standing(r);
      const claimed = { ...r, account: clone(verifiedAccount) };
      commit({ ...data, results: data.results.map(row => row === r ? claimed : row) });
      return standing(claimed);
    },
    // Pass only an identity returned by the server's administrator verifier.
    review(runId, decision, reason, verifiedAdmin) {
      if (verifiedAdmin?.isAdmin !== true || !text(verifiedAdmin.id)) throw Error('Administrator required');
      if (!['accepted','rejected'].includes(decision) || typeof reason !== 'string' || !reason.trim() || reason.length > 1000) throw Error('Review reason required');
      const r = data.results.find(row => row.runId === runId);
      if (!r?.account) throw Error('Claimed result required');
      const reviewed = { ...r, status: decision, reviews: [...r.reviews, { decision, reason, adminId: verifiedAdmin.id, at: now() }] };
      commit({ ...data, results: data.results.map(row => row === r ? reviewed : row) });
      return standing(reviewed);
    },
    list({ fronts = 1, season: selectedSeason = data.season, offset = 0, limit = 50 } = {}) {
      if (!Number.isSafeInteger(fronts) || fronts < 1 || !text(selectedSeason) || !natural(offset) || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw Error('Invalid leaderboard query');
      const rows = bests(fronts, selectedSeason); let rank = 0;
      return { fronts, season: selectedSeason, total: rows.length, entries: rows.map((r, i) => {
        if (!i || !equal(r, rows[i - 1])) rank = i + 1;
        return { ...publicRow(r), rank };
      }).slice(offset, offset + limit) };
    }
  };
}

module.exports = { createLeaderboard };
