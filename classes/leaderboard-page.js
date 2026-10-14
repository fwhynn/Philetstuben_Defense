(() => {
  'use strict';
  const $ = id => document.getElementById(id), api = HexApi;
  let offset = 0, request = 0, pendingOffset = 0, pendingRequest = 0;
  async function load() {
    const generation = ++request; $('rankingStatus').textContent = 'Bestenliste wird geladen …';
    $('rankingTable').replaceChildren(); $('page').textContent = ''; $('previous').disabled = $('next').disabled = true;
    try {
      const data = await api.getLeaderboard(Number($('fronts').value), offset);
      if (generation !== request) return;
      HexLeaderboardUI.table($('rankingTable'), data.entries);
      $('rankingStatus').textContent = `Season: ${data.season} · ${data.total} gewertete Accounts`;
      $('page').textContent = data.total ? `${offset + 1}–${offset + data.entries.length} von ${data.total}` : '';
      $('previous').disabled = offset === 0; $('next').disabled = offset + data.entries.length >= data.total;
    } catch (error) { if (generation === request) $('rankingStatus').textContent = error.message; }
  }
  $('fronts').addEventListener('change', () => { offset = 0; load(); });
  $('refresh').addEventListener('click', load);
  $('previous').addEventListener('click', () => { offset = Math.max(0, offset - 50); load(); });
  $('next').addEventListener('click', () => { offset += 50; load(); });
  async function pending() {
    const generation = ++pendingRequest;
    $('reviewStatus').textContent = 'Prüfliste wird geladen …'; $('pending').replaceChildren(); $('morePending').hidden = true;
    try {
      const data = await api.getPendingRankings(pendingOffset); if (generation !== pendingRequest) return;
      $('reviewStatus').textContent = `${data.total} Runs warten auf Prüfung.`;
      $('morePending').hidden = pendingOffset + data.entries.length >= data.total;
      for (const row of data.entries) {
        const card = document.createElement('article'), title = document.createElement('h3'), detail = document.createElement('p');
        title.textContent = row.username; detail.textContent = `Welle ${row.wave} · ${row.kills} Kills · ${row.fronts} Front(en) · Version ${row.ruleset} · Run ${row.runId}`;
        const label = document.createElement('label'), reason = document.createElement('textarea');
        reason.maxLength = 1000; reason.required = true; label.textContent = 'Begründung der Entscheidung'; label.appendChild(reason);
        card.append(title, detail, label); const buttons = [];
        for (const [decision, text] of [['accepted','Annehmen'],['rejected','Ablehnen']]) {
          const button = document.createElement('button'); button.type = 'button'; button.textContent = text; buttons.push(button);
          button.addEventListener('click', async () => {
            if (!reason.value.trim()) { reason.setCustomValidity('Bitte begründe die Entscheidung.'); reason.reportValidity(); return; }
            reason.setCustomValidity(''); buttons.forEach(b => b.disabled = true);
            try {
              await api.reviewRanking(row.runId, decision, reason.value.trim());
              if (generation !== pendingRequest) return;
              pendingOffset = 0; await pending(); load();
            } catch (error) { if (generation === pendingRequest) { $('reviewStatus').textContent = error.message; buttons.forEach(b => b.disabled = false); } }
          }); card.appendChild(button);
        }
        reason.addEventListener('input', () => reason.setCustomValidity(''));
        $('pending').appendChild(card);
      }
    } catch (error) { if (generation === pendingRequest) $('reviewStatus').textContent = error.message; }
  }
  $('loadPending').addEventListener('click', () => { pendingOffset = 0; pending(); });
  $('morePending').addEventListener('click', () => { pendingOffset += 50; pending(); });
  api.currentUser().then(user => { $('reviewSection').hidden = ![true,1,'1'].includes(user?.isAdmin); }).catch(() => {});
  load();
})();
