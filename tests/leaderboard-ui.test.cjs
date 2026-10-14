const test = require('node:test'), assert = require('node:assert/strict');
const ui = require('../classes/leaderboard-ui.js');
const row = { username: null, rank: 6, wave: 35, kills: 1342, fronts: 2, ruleset: '1.0.0', status: 'pending' };
test('result copy distinguishes guest, review, approval, rejection and local play', () => {
  assert.equal(ui.presentation(row).claim, true); assert.match(ui.presentation(row).title, /aktuell Platz 6/);
  assert.match(ui.presentation(row).detail, /2 Fronten/);
  const pending = ui.presentation({ ...row, username: 'Phil' }); assert.equal(pending.claim, false); assert.match(pending.title, /überprüft/);
  assert.match(ui.presentation({ ...row, username: 'Phil', status: 'accepted', personalBest: true }).detail, /persönlicher Bestwert/);
  assert.match(ui.presentation({ ...row, status: 'rejected' }).title, /abgelehnt/);
  assert.equal(ui.presentation(null).claim, false); assert.doesNotMatch(ui.presentation(null).title, /Platz \d/);
});
function dom() {
  const doc = { createElement(tag) { return { tag, ownerDocument: doc, children: [], listeners: {}, textContent: '', appendChild(n) { this.children.push(n); }, replaceChildren(...nodes) { this.children = nodes; }, setAttribute() {}, addEventListener(name, fn) { this.listeners[name] = fn; } }; } };
  return doc.createElement('section');
}
test('table uses text nodes for untrusted names instead of interpolating HTML', () => {
  const host = dom(), name = '<img src=x onerror=alert(1)>';
  ui.table(host, [{ ...row, username: name, finishedAt: 0 }]);
  const table = host.children[0], cell = table.children[2].children[0].children[1];
  assert.equal(cell.textContent, name); assert.equal(cell.innerHTML, undefined);
});
test('stale result responses cannot replace a newer run and local results never call the API', async () => {
  const host = dom(); let resolve, calls = 0;
  const waiting = ui.showResult(host, { api: { getRankedResult() { calls++; return new Promise(r => resolve = r); } }, session: { runId: 'old' } });
  await ui.showResult(host, { session: null }); resolve(row); await waiting;
  assert.equal(calls, 1); assert.match(host.children[0].textContent, /lokal gespielt/);
});
test('guest CTA opens registration and signed-in claim uses server result only', async () => {
  const host = dom(); let accountMode;
  await ui.showResult(host, { api: { getRankedResult: async () => row, isLoggedIn: () => false }, session: { runId: 'run' }, onAccount(mode) { accountMode = mode; } });
  await host.children[2].listeners.click(); assert.equal(accountMode, 'register');
  let claimed = false;
  await ui.showResult(host, { api: { getRankedResult: async () => ({ ...row, username: claimed ? 'Phil' : null }), isLoggedIn: () => true, claimRankedResult: async () => { claimed = true; } }, session: { runId: 'run' } });
  await host.children[2].listeners.click(); assert.equal(claimed, true); assert.match(host.children[0].textContent, /überprüft/);
});

test('successful login refresh claims the verified guest result and shows pending review', async () => {
  const host = dom(); let loggedIn = false, claims = 0;
  const api = { getRankedResult: async () => row, isLoggedIn: () => loggedIn,
    claimRankedResult: async session => { assert.equal(session.runId, 'verified-run'); claims++; return { ...row, username: 'Phil' }; } };
  await ui.showResult(host, { api, session: { runId: 'verified-run', token: 'private-proof' } });
  assert.equal(claims, 0); loggedIn = true; await ui.refreshResult();
  assert.equal(claims, 1); assert.match(host.children[0].textContent, /überprüft/);
});
