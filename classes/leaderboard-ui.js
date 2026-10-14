/* Render only results returned by the verified-result endpoint, never local scores. */
(function(root) {
  'use strict';
  function presentation(result) {
    if (!result) return { title: 'Noch keine Ranglistenwertung', detail: 'Dieser Lauf wurde lokal gespielt. Eine geprüfte Platzierung ist dafür nicht verfügbar.', claim: false };
    const rank = Number.isSafeInteger(result.rank) && result.rank > 0 ? result.rank : null;
    const guest = result.username === null;
    const category = result.fronts === 1 ? 'Eine Front' : result.fronts + ' Fronten';
    const score = `Welle ${result.wave} abgeschlossen · ${result.kills} Kills · ${category} · Version ${result.ruleset}`;
    if (result.status === 'rejected') return { title: 'Dieser Run wurde abgelehnt', detail: score + '. Er erscheint nicht in der öffentlichen Bestenliste.', claim: false };
    if (guest) return { title: rank ? `Damit wärst du aktuell Platz ${rank}` : 'Dein Ergebnis ist gesichert',
      detail: score + '. Erstelle einen Account oder melde dich an, um diesen Run zur Prüfung einzureichen. Die Platzierung kann sich noch ändern.', claim: true };
    if (result.status === 'pending') return { title: 'Dein Run wird überprüft', detail: score + `. Nach der Prüfung wird er angenommen oder abgelehnt.${rank ? ` Aktuell entspräche er Platz ${rank}.` : ''}`, claim: false };
    if (result.status !== 'accepted') return { title: 'Platzierung wird ermittelt', detail: 'Das bestätigte Ergebnis wird nachgeladen.', claim: false };
    return { title: rank ? `Dieser Versuch: Platz ${rank}` : 'Dein Run wurde angenommen',
      detail: score + (result.personalBest ? '. Neuer persönlicher Bestwert!' : result.best ? `. Dein persönlicher Bestwert bleibt bei Welle ${result.best.wave} mit ${result.best.kills} Kills.` : '') + ' Die Platzierung ist eine aktuelle Momentaufnahme.', claim: false };
  }
  function node(doc, tag, text) { const el = doc.createElement(tag); if (text !== undefined) el.textContent = text; return el; }
  function table(host, entries) {
    const doc = host.ownerDocument; host.replaceChildren();
    if (!entries.length) { host.appendChild(node(doc, 'p', 'Noch keine freigegebenen Ergebnisse in dieser Kategorie.')); return; }
    const table = node(doc, 'table'), caption = node(doc, 'caption', 'Freigegebene Bestwerte pro Account'); table.appendChild(caption);
    const head = node(doc, 'thead'), heading = node(doc, 'tr');
    for (const title of ['Platz','Spieler','Welle','Kills','Version','Datum']) { const th = node(doc, 'th', title); th.scope = 'col'; heading.appendChild(th); }
    head.appendChild(heading); table.appendChild(head); const body = node(doc, 'tbody');
    for (const row of entries) { const tr = node(doc, 'tr');
      for (const value of [row.rank,row.username,row.wave,row.kills,row.ruleset,new Date(row.finishedAt).toLocaleDateString('de-DE')]) tr.appendChild(node(doc, 'td', String(value)));
      body.appendChild(tr);
    }
    table.appendChild(body); host.appendChild(table);
  }
  let resultGeneration = 0, current = null;
  async function showResult(host, { api, session = null, onAccount = () => {} } = {}, claimAfterLogin = false) {
    if (!host) return;
    current = { host, options: { api, session, onAccount } }; const generation = ++resultGeneration, doc = host.ownerDocument;
    host.replaceChildren(node(doc, 'p', session ? 'Platzierung wird ermittelt …' : presentation(null).detail));
    if (!session) return;
    try {
      let result = await api.getRankedResult(session);
      if (generation !== resultGeneration) return;
      if (claimAfterLogin && result.username === null && api.isLoggedIn()) {
        result = await api.claimRankedResult(session);
        if (generation !== resultGeneration) return;
      }
      const view = presentation(result); host.replaceChildren(node(doc, 'h3', view.title), node(doc, 'p', view.detail));
      if (view.claim) {
        const loggedIn = api.isLoggedIn(), button = node(doc, 'button', loggedIn ? 'Run zur Prüfung einreichen' : 'Account erstellen und Ergebnis sichern');
        button.type = 'button'; button.className = 'primary';
        button.addEventListener('click', async () => {
          if (!api.isLoggedIn()) return onAccount('register');
          button.disabled = true;
          try { await api.claimRankedResult(session); if (generation === resultGeneration) await showResult(host, { api, session, onAccount }); }
          catch (error) { if (generation === resultGeneration) { button.disabled = false; const message = node(doc, 'p', error.message); message.setAttribute('role','alert'); host.appendChild(message); } }
        }); host.appendChild(button);
        if (!loggedIn) { const login = node(doc, 'button', 'Ich habe bereits einen Account'); login.type = 'button'; login.className = 'secondary'; login.addEventListener('click', () => onAccount('login')); host.appendChild(login); }
      }
    } catch (error) {
      if (generation !== resultGeneration) return;
      host.replaceChildren(node(doc, 'p', error.message)); const retry = node(doc, 'button', 'Platzierung erneut laden'); retry.type = 'button'; retry.addEventListener('click', () => showResult(host, { api, session, onAccount })); host.appendChild(retry);
    }
  }
  const api = { presentation, table, showResult, refreshResult() { if (current) return showResult(current.host, current.options, true); } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HexLeaderboardUI = api;
})(globalThis);
