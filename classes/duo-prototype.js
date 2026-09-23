(() => {
  const token = new URLSearchParams(location.hash.slice(1)).get('session'); let remote = null;
  const loadout = ['archer', 'catapult', 'chain', 'freeze', 'mine'];
  let match, saved = null, sequence = 0, last = performance.now(), debt = 0;
  let activeBoard = 0;
  function switchBoard(index) { activeBoard = index; document.querySelectorAll('main article').forEach((panel, i) => panel.hidden = i !== index); for (let i = 0; i < 2; i++)document.getElementById('view' + i).setAttribute('aria-pressed', String(i === index)); render(); }
  for (let i = 0; i < 2; i++)document.getElementById('view' + i).addEventListener('click', () => switchBoard(i));
  const views = [{}, {}], message = document.getElementById('message');
  function button(parent, label, action, disabled = false) { const b = document.createElement('button'); b.textContent = label; b.disabled = disabled; b.addEventListener('click', action); parent.appendChild(b); return b; }
  function send(player, action, payload = {}) { if (remote) { if (player !== remote.player || remote.busy) return false; remote.send(action, payload).then(() => { message.textContent = 'Aktion bestätigt.'; }).catch(error => { message.textContent = error.message; }); return false; } const ok = HexDuoSession.command(match, player, { id: 'local-' + (++sequence), wave: match.wave, action, payload }); message.textContent = ok ? '' : 'Aktion aktuell nicht möglich. Prüfe Phase, Auswahl und Gold.'; render(); return ok; }
  const renderers = [0, 1].map(player => HexSvgRenderer.create(document.getElementById('board' + player), {
    placeTile(q, r) { const s = match.boards[player].state; if(s.selectedCard == null || s.selectedCard < 0)return; send(player, 'place', { q, r, index: s.selectedCard || 0, rotation: s.rotation || 0 }); },
    selectSlot(q, r, index) { views[player].slot = { q, r, index }; views[player].tower = null; views[player].building = null; render(); },
    selectTower(q, r, index) { views[player].tower = { q, r, index }; views[player].slot = null; views[player].building = null; render(); },
    selectBuilding(q, r, index) { views[player].building = { q, r, index }; views[player].slot = null; views[player].tower = null; render(); },
    selectBase() { message.textContent = 'Beide Festungen teilen sich das Team-Leben. Base-Ausbau folgt in einer späteren Duo-Etappe.'; },
    clearSelection() { views[player] = {}; render(); }, hoverBuilding() { }, inspectBiome(id) { message.textContent = HexBiomes.definitions[id].description; },
    hoverPlacement(id) { match.boards[player].state.hoveredPlacement = id; }, leavePlacement() { match.boards[player].state.hoveredPlacement = null; },
    rotatePlacement() { const s = match.boards[player].state; if (s.phase !== 'place' || match.ready[player]) return false; s.rotation = ((s.rotation || 0) + 1) % 6; render(); return true; }
  }));
  const targetCache = new WeakMap(), handRefs = new WeakMap();
  function targets(s) {
    if (s.selectedCard == null || s.selectedCard < 0 || s.phase !== 'place' || s.celebrationActive) return [];
    if (remote) return s.placements?.[s.selectedCard || 0]?.[s.rotation || 0] || [];
    const card = HexPlacementCommands.card(s, s.hand[s.selectedCard || 0]); if (!card) return [];
    const cacheKey = [s.map.size, card.id, s.rotation || 0, s.openingRemaining || 0].join('|'), cached = targetCache.get(s); if (cached?.key === cacheKey) return cached.targets;
    const found = new Map(); for (const tile of s.map.values()) for (let d = 0; d < 6; d++) { const n = HexMap.neighbor(tile.q, tile.r, d); if (!s.map.has(HexMap.key(n.q, n.r))) found.set(HexMap.key(n.q, n.r), { ...n, legal: HexPlacementCommands.canPlace(s, n.q, n.r, card, s.rotation || 0) }); } const result = [...found.values()]; targetCache.set(s, { key: cacheKey, targets: result }); return result;
  }
  const phases = { duoDelivery: 'Partner-Lieferung', place: 'Hex legen', build: 'Bauen', wave: 'Kampf', duoWait: 'Wartet auf Partner', reward: 'Karte wählen', bossReward: 'Wächterbeute', shrineReward: 'Shrine', removal: 'Deck ausdünnen (optional)', gameover: 'Run beendet' };
  function render() {
    if (!match) return;
    const partner = 1 - activeBoard; document.getElementById('partnerStatus').textContent = 'Partner: ' + (match.ready[partner] ? 'Bereit' : phases[match.boards[partner].state.phase] || match.boards[partner].state.phase) + (match.pendingHelp[partner] ? ' · Verstärkung unterwegs' : '');
    document.getElementById('teamStatus').textContent = 'Team ' + match.hp + '/' + match.maxHp + ' HP · Wave ' + match.wave + (match.phase === 'gameover' ? ' · Verloren' : '');
    for (let player = 0; player < 2; player++) {
      const s = match.boards[player].state, v = views[player]; if(!remote&&handRefs.get(s)!==s.hand){s.selectedCard=-1;handRefs.set(s,s.hand);} s.selectedCard ??= -1; if (s.selectedCard >= s.hand.length) s.selectedCard = -1; s.rotation ??= 0; s.showSlotHints = true; s.duoPortal = match.portals[player]; s.selectedSlot = v.slot; s.selectedTower = v.tower; s.selectedBuilding = v.building;
      document.getElementById('status' + player).textContent = '· ' + s.gold + ' Gold · ' + (match.ready[player] ? 'Bereit' : phases[s.phase] || s.phase);
      renderers[player].render(s, targets(s));
      const box = document.getElementById('controls' + player); box.replaceChildren();
      button(box, '−', () => renderers[player].zoom(1.2)); button(box, '+', () => renderers[player].zoom(1 / 1.2)); button(box, 'Zur Base', () => renderers[player].resetView());
      if(match.result){
        const result=match.result,summary=result.players[player],title=document.createElement('h2');title.textContent=result.outcome==='victory'?'Gemeinsam geschafft!':'Gemeinsam gekämpft';box.appendChild(title);
        const text=document.createElement('p');text.textContent='Überstandene Wellen: '+result.wave+' · Diamanten: '+summary.diamonds+' · Unterstützungsschaden: '+Math.round(Object.values(summary.support).reduce((a,b)=>a+b,0));box.appendChild(text);
        for(const [type,stats] of Object.entries(summary.towers)){const row=document.createElement('p');const paid=(stats.buildGold||0)+(stats.upgradeGold||0);row.textContent=(HexData.TOWERS[type]?.name||type)+' · Schaden '+Math.round(stats.damage||0)+' · Gold '+paid+' · Schaden/Gold '+(paid?((stats.damage||0)/paid).toFixed(1):'—');box.appendChild(row);}
        if(!remote||player===remote.player)button(box,match.rematch?.[player]?'Neustart-Zustimmung zurücknehmen':'Noch eine Partie mit demselben Partner',()=>send(player,'rematch',{value:!match.rematch?.[player]}),!!match.connection?.paused);
        const lobby=document.createElement('a');lobby.href='/duo-lobby.html';lobby.textContent='Zur Lobby';box.appendChild(lobby);continue;
      }
      if (remote && player !== remote.player) { const note = document.createElement('p'); note.textContent = 'Partner-Map · Nur anschauen'; box.appendChild(note); continue; }
      if (remote && match.lobby?.players === 1) { const wait = document.createElement('p'); wait.textContent = 'Warte auf deinen Partner. Teile den Einladungslink oben.'; box.appendChild(wait); continue; }
      if(remote&&match.connection?.paused){const notice=document.createElement('p');notice.textContent=match.connection.maintenance?'Serverwartung · Partie sicher pausiert. Bitte warten.':match.connection.ended?'Die Partie wurde verlassen. Zur Lobby zurückkehren.':match.connection.expired?'Wiederbeitrittsfenster abgelaufen. Bitte eine neue Lobby erstellen.':'Partie pausiert. Warte auf die Wiederverbindung deines Partners.';box.appendChild(notice);continue;}
      if(match.phase==='prepare')for(let board=0;board<2;board++)for(const [id,landmark] of match.boards[board].state.landmarks){
        if(landmark.type!=='boss'||!landmark.claimed||!Array.isArray(landmark.consent)||!['pending','ready'].includes(landmark.status))continue;
        const note=document.createElement('p');note.textContent='Wächter auf Karte '+(board+1)+' · Hex '+id+' · Zustimmung '+landmark.consent.filter(Boolean).length+'/2';box.appendChild(note);
        button(box,landmark.consent[player]?'Wächter verschieben':'Wächter für nächste Welle freigeben',()=>send(player,'guardian',{board,id,value:!landmark.consent[player]}),match.ready[player]);
      }
      if (s.celebrationActive) { const p = document.createElement('p'); p.textContent = s.activeCelebration.messages.join(' · '); box.appendChild(p); button(box, 'Weiter geht’s!', () => send(player, 'acknowledge')); continue; }
      if (s.rewardOffer) {
        const offer = s.rewardOffer;if(offer.kind==='boss'){const title=document.createElement('p');title.textContent='Wächterbeute · Wähle deine eigene Belohnung.';box.appendChild(title);} offer.choices.forEach((c, index) => {
          const label = c.cardId ? HexData.CARD_LIBRARY[c.cardId].name + ' · ' + s.deck.filter(id => id === c.cardId).length + '× im Deck' : c.kind === 'upgrade' ? c.choice.name : ({ bastion: '+5 Team-HP (aktuell/maximal)', income: '+2 eigenes Einkommen', repair: 'Heilquelle: bis +5 Team-HP / sonst 30 Gold', supplies: '+30 eigenes Gold' })[c.blessing];
          button(box, label, () => send(player, 'reward', { offerId: offer.id, index }));
        }); if (offer.skippable) button(box, 'Überspringen', () => send(player, 'reward', { offerId: offer.id, index: null })); continue;
      }
      if (s.phase === 'duoDelivery') {
        const offer = match.delivery?.offers[player], note = document.createElement('p');
        note.textContent = 'Partner-Lieferung · Wähle ein kostenloses Geschenk für deinen Partner. Karten kommen oben auf dessen Nachziehstapel und werden als Nächstes gezogen.';
        box.appendChild(note);
        if (!match.boards.every(run => run.state.phase === 'duoDelivery')) {
          const wait = document.createElement('p'); wait.textContent = 'Dein Partner wählt noch seine Wellenbelohnung.'; box.appendChild(wait);
        } else if (offer?.index === null) {
          offer.choices.forEach((choice, index) => button(box, choice.kind === 'gold' ? '+' + choice.amount + ' Gold für deinen Partner' : HexData.CARD_LIBRARY[choice.cardId].name + ' · Karte verschenken', () => send(player, 'delivery', { offerId: offer.id, index })));
        } else {
          const wait = document.createElement('p'); wait.textContent = 'Geschenk zugestellt. Warte auf die Lieferung deines Partners.'; box.appendChild(wait);
        }
        continue;
      }
      if (s.phase === 'place') { s.hand.forEach((id, index) => { const b = button(box, HexPlacementCommands.card(s, id).name, () => { s.selectedCard = index; render(); }); b.setAttribute('aria-pressed', String(index === s.selectedCard)); }); button(box, 'Hex drehen ↻', () => { s.rotation = (s.rotation + 1) % 6; render(); }); }
      if (match.phase === 'prepare') { if (v.slot) button(box, 'Hier Partner-Portal reservieren', () => send(player, 'portal', { slot: v.slot }), match.ready[player]); if (v.tower) button(box, 'Als Verstärkung senden', () => send(player, 'reinforcement', { slot: v.tower }), match.ready[player]); if (match.portals[player]) button(box, 'Portal aufheben', () => send(player, 'portal', { slot: null }), match.ready[player]); if (match.reinforcements[player]) button(box, 'Verstärkung abwählen', () => send(player, 'reinforcement', { slot: null }), match.ready[player]); }
      const helpInfo = document.createElement('p'); helpInfo.textContent = (match.portals[player] ? 'Portal: Hex ' + match.portals[player].q + ',' + match.portals[player].r + ' · Platz ' + (match.portals[player].index + 1) : 'Kein Portal reserviert – keine Partnerhilfe möglich.') + ' · ' + (match.reinforcements[player] ? 'Verstärkung ausgewählt' : 'Kein Verstärkungsturm gewählt') + ' · Unterstützungsschaden: ' + Math.round(Object.values(match.support[player]).reduce((a, b) => a + b, 0)); box.appendChild(helpInfo);
      if (v.slot) for (const type of s.towerLoadout) { const price = HexBuildings.cost(s, v.slot, HexData.TOWERS[type].cost); button(box, HexData.TOWERS[type].name + ' · ' + price, () => { if (send(player, 'tower', { type, slots: [v.slot] })) { views[player] = {}; render(); } }, s.gold < price || match.ready[player] || !!(match.portals[player] && v.slot && match.portals[player].q === v.slot.q && match.portals[player].r === v.slot.r && match.portals[player].index === v.slot.index)); }
      if (v.tower) { const tower = s.map.get(HexMap.key(v.tower.q, v.tower.r))?.towers[v.tower.index]; if (tower && tower.guestOwner === undefined) for (const [upgrade, d] of HexData.runUpgrades(s, tower)) { const price = HexBuildings.cost(s, v.tower, d.cost); button(box, d.name + ' · ' + price, () => send(player, 'upgrade', { slot: v.tower, upgrade }), s.gold < price || match.ready[player]); } }
      if (v.building) { const building = s.map.get(HexMap.key(v.building.q, v.building.r))?.buildings?.[v.building.index]; if (!building) for (const [type, d] of Object.entries(HexBuildings.definitions).filter(([type])=>HexBuildings.allowedTypes(s.map.get(HexMap.key(v.building.q,v.building.r))).includes(type))) button(box, d.name + ' · ' + d.cost + (HexBuildings.buildBlockReason(s.map.get(HexMap.key(v.building.q,v.building.r)),type)?' · '+HexBuildings.buildBlockReason(s.map.get(HexMap.key(v.building.q,v.building.r)),type):''), () => send(player, 'building', { slot: v.building, type }), !!HexBuildings.buildBlockReason(s.map.get(HexMap.key(v.building.q,v.building.r)),type) || s.gold < d.cost || match.ready[player]); else { const d = HexBuildings.nextUpgrade(s, building); if (d) button(box, 'Gebäude ausbauen · ' + d.cost, () => send(player, 'buildingUpgrade', { slot: v.building }), s.gold < d.cost || match.ready[player]); } }
      if (s.tunnelOffer) button(box, 'Kostenlosen Rettungstunnel bauen', () => { if (confirm(HexI18n.text('Rettungstunnel nach ' + s.tunnelOffer.q + ',' + s.tunnelOffer.r + ' bauen?'))) send(player, 'tunnel'); }, match.ready[player]);
      if (s.phase === 'build') button(box, match.ready[player] ? 'Bereitschaft zurücknehmen' : 'Bereit für nächste Wave', () => send(player, 'ready', { value: !match.ready[player] }));
    }
  }
  function restart() { match = HexDuoSession.create(HexRandom.freshSeed(), [loadout, loadout]); views[0] = {}; views[1] = {}; renderers.forEach(r => r.reset()); last = performance.now(); debt = 0; message.textContent = 'Beide Spieler platzieren zuerst ein Hex und bauen ihre Verteidigung.'; render(); }
  document.getElementById('restart').addEventListener('click', () => { if (confirm(HexI18n.text('Lokalen Duo-Run neu starten?'))) restart(); });
  document.getElementById('checkpoint').addEventListener('click', () => { try { saved = JSON.stringify(HexDuoSession.capture(match)); document.getElementById('restore').disabled = false; message.textContent = 'Beide Karten und der gemeinsame Spielstand sind für diesen Tab gespeichert.'; } catch (error) { message.textContent = error.message; } });
  document.getElementById('restore').addEventListener('click', () => { if (!saved) return; match = HexDuoSession.restore(JSON.parse(saved)); views[0] = {}; views[1] = {}; last = performance.now(); debt = 0; renderers.forEach(r => r.reset()); render(); });
  if (token) {
    document.querySelector('a[href="index.html"]').hidden = true;
    document.querySelector('h1').textContent = 'Zwillingsfestungen · Server-Prototyp';
    for (const id of ['restart', 'checkpoint', 'restore', 'speed']) document.getElementById(id).disabled = true;
    document.getElementById('duoIntro').textContent = 'Server-Duo · Baue auf deiner eigenen Map. Die Partner-Map kannst du anschauen. Beide müssen bereit sein. Tempo vorerst 1×.';
    let first = true, controlsKey = ''; remote = HexDuoClient.create({ token, onStatus: (text,session) => { document.getElementById('networkStatus').textContent = text;document.getElementById('takeoverSession').hidden=!session?.conflict;document.getElementById('leaveSession').disabled=!!session?.conflict||!!session?.ended; }, onView: view => { if(typeof HexProfile!=='undefined')try{let profile=HexProfile.load(HexData.TOWERS);for(const receipt of view.settlements||[])profile=HexProfile.settleDuo(profile,receipt,HexData.TOWERS);}catch(error){message.textContent='Diamanten konnten noch nicht gespeichert werden. Bitte den Spielstand prüfen und die Verbindung erneut laden.';} match = HexDuoClient.presentation(view, match); if (view.lobby) { document.getElementById('invitePanel').hidden = false; document.getElementById('inviteCode').textContent = 'Lobby ' + view.lobby.code + ' · ' + view.lobby.players + '/2 Spieler'; document.getElementById('inviteLink').value = location.origin + '/duo-lobby.html#join=' + view.lobby.code; } if (first) { first = false; activeBoard = view.player; switchBoard(activeBoard); } const own = view.boards[view.player], key = JSON.stringify([view.wave, view.hp, view.phase, view.result, view.rematch, view.delivery, view.lobby, view.connection?.maintenance,view.connection?.paused,view.connection?.expired,view.connection?.ended,view.ready, view.boards.map(b => [b.phase,b.landmarks]), view.pendingHelp, view.portals, view.reinforcements, own.phase, own.gold, own.hand, own.rewardOffer, own.celebration, own.map]); if (key !== controlsKey) { controlsKey = key; render(); } else renderers[activeBoard].render(match.boards[activeBoard].state, targets(match.boards[activeBoard].state)); } });
    const invite = document.createElement('section'); invite.id = 'invitePanel'; invite.hidden = true; const inviteCode = document.createElement('p'); inviteCode.id = 'inviteCode'; invite.appendChild(inviteCode); const inviteLink = document.createElement('input'); inviteLink.id = 'inviteLink'; inviteLink.readOnly = true; inviteLink.setAttribute('aria-label', 'Einladungslink'); inviteLink.style.width = 'min(100%,600px)'; inviteLink.style.minHeight = '44px'; invite.appendChild(inviteLink); button(invite, 'Einladungslink kopieren', async () => { try { await navigator.clipboard.writeText(inviteLink.value); message.textContent = 'Einladungslink kopiert.'; } catch { inviteLink.select(); message.textContent = 'Link markieren und kopieren.'; } }); message.parentElement.appendChild(invite);
    const status = document.createElement('p'); status.id = 'networkStatus'; status.setAttribute('role', 'status'); message.parentElement.appendChild(status);
    const sessionControls=document.createElement('section');const takeover=button(sessionControls,'Sitzung hier übernehmen',async()=>{try{await remote.takeover();}catch(error){message.textContent=error.message;}});takeover.id='takeoverSession';takeover.hidden=true;
    let leaveArmed=false;const leave=button(sessionControls,'Partie verlassen',async()=>{if(!leaveArmed){leaveArmed=true;leave.textContent='Wirklich verlassen? Partie endet für beide.';return;}try{await remote.leave();location.replace('/duo-lobby.html');}catch(error){message.textContent=error.message;}});leave.id='leaveSession';leave.addEventListener('blur',()=>{leaveArmed=false;leave.textContent='Partie verlassen';});
    const lobby=document.createElement('a');lobby.href='/duo-lobby.html';lobby.textContent='Zur Lobby';sessionControls.appendChild(lobby);message.parentElement.appendChild(sessionControls);remote.start();
  } else { restart(); switchBoard(0); }
  function frame(now) {
    const elapsed = Math.max(0, Math.min(.25, (now - last) / 1000)); last = now;
    if (remote || !match) { requestAnimationFrame(frame); return; }
    if (match.phase === 'combat') { debt += elapsed * Number(document.getElementById('speed').value); while (debt >= .05 && match.phase === 'combat') { HexDuoSession.tick(match); debt -= .05; } } else debt = 0;
    // Keep controls stable while clicking; map animation updates independently.
    if (match.phase !== frame.phase || match.hp !== frame.hp || match.boards.some((r, i) => r.state.gold !== frame.gold?.[i] || r.state.phase !== frame.boardPhase?.[i])) { render(); frame.phase = match.phase; frame.hp = match.hp; frame.gold = match.boards.map(r => r.state.gold); frame.boardPhase = match.boards.map(r => r.state.phase); } else for (const i of [activeBoard]) renderers[i].render(match.boards[i].state, targets(match.boards[i].state));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
