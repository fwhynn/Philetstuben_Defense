(() => {
  'use strict';
  const challengeLab = globalThis.HexChallengeLab?.active ? globalThis.HexChallengeLab : null;
  const testProfile = !!globalThis.HexFirstPlayerTest?.active || !!challengeLab;
  let devEnemyQueue=[];
  function renderDevEnemies(){
    const allowed=typeof HexDevEnemies!=='undefined'&&HexDevEnemies.allowed()&&!duoToken;
    for(const id of ['devEnemyType','devEnemyCount','devEnemyAdd','devEnemyClear'])document.getElementById(id).disabled=!allowed;
    document.getElementById('devEnemyQueue').textContent=!allowed?'Starte zuerst den separaten Gegnertest.':devEnemyQueue.length?devEnemyQueue.map(row=>row.count+' × '+HexDevEnemies.entries.find(e=>e[0]===row.id)[1]).join(' → '):'Keine Auswahl: Die nächste Welle ist normal.';
  }
  const gameStorage = challengeLab ? challengeLab.storage : testProfile ? HexFirstPlayerTest.storage : globalThis.HexLocalStore || localStorage;
  const arsenalNotifications = HexArsenal.notifications(gameStorage);
  const duoToken = typeof location === 'undefined' ? null : new URLSearchParams(location.hash.slice(1)).get('duo');
  let duoBridge = null;
  function duoAction(action, payload = {}) { return duoBridge?.send(action, payload); }


  const svg = document.getElementById('board');
  const rendererCommands = {
    consumePoint(point) {
      if (!consumablePick || consumablePick === 'overload') return false;
      const slot = laneTarget(point);
      if (slot) consumeAt(slot.q, slot.r, undefined, slot);
      else setMessage('Klicke direkt auf die Straße. Escape: abbrechen.');
      return true;
    },
    togglePowerField(id){if(HexPowerGrid.toggleField(state,id)){renderAll();saveRunAutosave(true);}else setMessage(state.waveRunning?'Stromnetz während der Welle gesperrt.':'Maximal sechs Leitfelder: Schalte zuerst ein gelbes Feld aus.');},
    placeTile, inspectCaravan() { document.getElementById('waveDropdown').open = true; }, selectSlot(q, r, index, multiple, pointerType) { if (!applyBuildingTarget(q, r)) selectSlot(q, r, index, multiple, pointerType); }, inspectBiome,
    fieldClick() { document.getElementById('towerDrawer').classList.add('hidden'); if (state?.dragTower) { cancelQuickTower(); renderAll(); } },
    selectBase(event) { if (applyBuildingTarget(0, 0)) return; if (globalThis.HexCompact?.small()) HexCompact.open('stats',event); document.getElementById('towerDrawer').classList.add('hidden'); state.selectedBase = true; state.selectedTower = null; state.selectedSlot = null; state.selectedBuilding = null; document.getElementById('baseDropdown').open = true; renderAll(); },
    hoverBuilding(slot) { state.hoverBuilding = slot; renderBoard(); },
    rotatePlacement() { return rotateSelected(-1); },
    viewChanged() { positionTowerPanel(); positionTutorialSpotlight(); if (state?.dragTower) renderDragShade(); if (state?.consumablePickUI) renderConsumablePreview(); },
    hoverPlacement(id) { state.hoveredPlacement = id; const [q, r] = id.split(',').map(Number); if (orientPlacement(q, r)) renderBoard(); },
    leavePlacement(id) { if (state.hoveredPlacement === id) state.hoveredPlacement = null; },
    selectBuilding(q, r, index) { globalThis.HexCompact?.open(''); if (applyBuildingTarget(q, r)) return; closeBasePanel(); state.selectedBuilding = { q, r, index }; state.selectedSlot = null; state.selectedTower = null; renderAll(); },
    selectTower(q, r, index, multiple = false) {
      if (consumeAt(q, r, index)) return; if (duoBridge?.pickSupport?.('tower', { q, r, index })) return; if (pickWorkshopTower(q, r, index)) return; globalThis.HexCompact?.open(''); if (applyBuildingTarget(q, r)) return; closeBasePanel();
      const tower = state.map.get(key(q, r))?.towers[index]; if (!tower) return;
      chooseMany('Tower', { q, r, index }, multiple); state.selectedSlot = null; state.selectedBuilding = null; state.previewTower = null; renderAll();
    },
    clearSelection() { cancelConsumableSelection({}); if (state?.dragTower) { cancelQuickTower(); renderAll(); } document.getElementById('towerDrawer').classList.add('hidden'); closeBasePanel(); if (state.selectedTower || state.selectedBuilding || state.selectedSlot) { state.selectedTower = null; state.selectedSlot = null; state.selectedBuilding = null; state.previewTower = null; renderAll(); } }
  };
  // 3D-Renderer (three-renderer.js) wenn verfügbar, sonst SVG-Prototyp.
  let renderer;
  try { renderer = (globalThis.HexThreeRenderer || HexSvgRenderer).create(svg, rendererCommands); }
  catch (error) { console.warn('3D-Renderer nicht nutzbar, verwende SVG:', error); svg.style.display = ''; renderer = HexSvgRenderer.create(svg, rendererCommands); }
  const towerButtons = new Map();
  const handEl = document.getElementById('hand');
  const hpEl = document.getElementById('hp');
  const goldEl = document.getElementById('gold');
  const waveEl = document.getElementById('wave');
  const deckCountEl = document.getElementById('deckCount');
  const messageEl = document.getElementById('message');
  const startWaveBtn = document.getElementById('startWaveBtn');
  const newRunBtn = document.getElementById('newRunBtn');
  const autoStart = document.getElementById('autoStart');
  const speedToggle = document.getElementById('doubleSpeed');
  let gameSpeed = 1; try { gameSpeed = Math.max(1, Math.min(8, Math.round(Number(gameStorage.getItem('gameSpeed')) || 1))); } catch { }
  const syncSpeedFill = () => speedToggle.style.setProperty?.('--fill', ((Number(speedToggle.value) - 1) / 7 * 100) + '%');
  speedToggle.value = String(gameSpeed); document.getElementById('speedValue').textContent = gameSpeed + '×'; syncSpeedFill(); speedToggle.addEventListener('input', syncSpeedFill);
  function changeSpeed(value) { if (duoToken) { duoAction('speed', { value: Number(value) }); return; } advanceClock(performance.now()); gameSpeed = Math.max(1, Math.min(8, Math.round(Number(value) || 1))); speedToggle.value = String(gameSpeed); syncSpeedFill(); document.getElementById('speedValue').textContent = gameSpeed + '×'; try { gameStorage.setItem('gameSpeed', String(gameSpeed)); } catch { } saveGameSettings(); }
  speedToggle.addEventListener('input', () => changeSpeed(speedToggle.value));
  const towerMenu = document.getElementById('towerMenu');
  let towerMenuNeedsFreshTouch = false;
  towerMenu.addEventListener('pointerdown', () => { towerMenuNeedsFreshTouch = false; }, true);
  towerMenu.addEventListener('click', event => {
    if (towerMenuNeedsFreshTouch && event.detail !== 0) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  const rewardOverlay = document.getElementById('rewardOverlay');
  const rewardChoices = document.getElementById('rewardChoices');
  const loadoutOverlay = document.getElementById('loadoutOverlay');
  const loadoutChoices = document.getElementById('loadoutChoices');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const arsenalOverlay = document.getElementById('arsenalOverlay');
  let profile = HexProfile.load(HexData.TOWERS), pendingLoadout = [...profile.activeLoadout], pendingHero = profile.activeHero, pendingDifficulty = profile.difficulty || 'normal', hasActiveRun = false, presenceTimer = null;
  if(challengeLab)profile={...profile,unlockedTowers:Object.keys(HexData.TOWERS)};
  function stopSoloPresence() { if (presenceTimer) { clearInterval(presenceTimer); presenceTimer = null; } if (!testProfile) globalThis.HexApi?.clearPresence?.(); }
  function startSoloPresence() { stopSoloPresence(); if (testProfile || duoToken || !globalThis.HexApi?.isLoggedIn?.()) return; const beat = () => { if (!hasActiveRun || !state || state.hp <= 0 || ['gameover', 'victory'].includes(state.phase)) { stopSoloPresence(); return; } HexApi.pulsePresence({ mode: 'solo', wave: state.wave || 0 }).catch(() => { }); }; beat(); presenceTimer = setInterval(beat, 30000); }
  globalThis.addEventListener?.('pagehide', () => stopSoloPresence());

  const NS = 'http://www.w3.org/2000/svg';
  const { SQRT3, HEX, OPP, key, axialToWorld, hexPoints, edgePoint, neighbor, rotatedRoads } = HexMap;

  const { CARD_LIBRARY, TOWERS } = HexData;

  let showHexGrid = false; try { showHexGrid = gameStorage.getItem('hexGrid') === 'true'; } catch { }
  let showSlotHints = true, tutorialSeen = false; try { showSlotHints = gameStorage.getItem('slotHints') !== 'false'; tutorialSeen = gameStorage.getItem('tutorial-v1') === 'done' || profile.records.runsPlayed > 0 || profile.introduction.skipped || profile.introduction.bestWave > 0; } catch { }
  let onboardingHints = true; try { onboardingHints = gameStorage.getItem('onboardingHints') !== 'false'; } catch { }
  if (duoToken) tutorialSeen = true;
  let tutorial = { active: false, step: 0 };
  let consumablePick = null;
  function cancelConsumableSelection(event) {
    if (!consumablePick) return false;
    consumablePick = null; event.preventDefault?.(); setMessage('Auswahl abgebrochen.'); renderAll(); return true;
  }
  document.addEventListener('contextmenu', cancelConsumableSelection, true);
  let consumablePointer = null;
  function laneTarget(point) {
    if (!point) return null;
    let slot = null, distance = Infinity;
    for (const tile of state.map.values()) {
      if (tile.type === 'base') continue;
      const p = HexCombat.lanePoint(tile, point), d = p ? Math.hypot(p.x-point.x,p.y-point.y) : Infinity;
      if (d < distance) { distance = d; slot = { q:tile.q, r:tile.r, index:0, ...p }; }
    }
    return slot;
  }
  function consumableAllowed(slot) {
    return !!slot && !state.consumablesLocked && HexCombat.buyConsumable(state, consumablePick, slot, true);
  }
  function renderConsumablePreview(highlight = true) {
    const ghost = document.getElementById('consumableGhost'), overlay = document.getElementById('consumableTargets');
    const active = !!consumablePick && state.hp > 0 && ['place','build','wave'].includes(state.phase) && mainMenu.classList.contains('hidden');
    ghost.classList.toggle('hidden', !active || !consumablePointer); overlay.classList.toggle('hidden', !active);
    if (!active) { renderer.setConsumablePreview?.(null); return; }
    const box = document.querySelector?.('.boardWrap')?.getBoundingClientRect(); if (!box) return;
    if (highlight) {
      Object.assign(overlay.style,{left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px'});
      overlay.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);
      const shapes = [], color = ok => ok ? '#64ed9a' : '#ff7474';
      for (const tile of state.map.values()) {
        if (consumablePick === 'overload') {
          slotPositions(tile).forEach((p,index)=>{
            if (!tile.towers[index] || !consumableAllowed({q:tile.q,r:tile.r,index})) return;
            const screen=renderer.project?.(p,tile.type==='base'?80:35); if(screen)shapes.push(`<circle cx="${screen.x}" cy="${screen.y}" r="24" fill="#64ed9a33" stroke="#64ed9a" stroke-width="3"/>`);
          });
        } else if (tile.type !== 'base' && tile.roads?.length) {
          for (const leg of HexMap.roadGeometry(tile).legs.values()) {
            const points=leg.map(p=>renderer.project?.(p,3)); if(points.some(p=>!p))continue;
            const ok=consumableAllowed({q:tile.q,r:tile.r,index:0,x:leg[0].x,y:leg[0].y});
            shapes.push(`<polyline points="${points.map(p=>p.x+','+p.y).join(' ')}" fill="none" stroke="${color(ok)}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>`);
          }
        }
      }
      overlay.innerHTML=shapes.join('');
    }
    if (!consumablePointer) return;
    const e=consumablePointer, overBoard=!!e.target?.closest?.('.boardWrap') && !e.target?.closest?.('button,details,.drawer,.towerPanel,.modal');
    const target=overBoard?renderer.consumableTarget?.(e):null;
    const slot=consumablePick==='overload'?target?.slot:laneTarget(target?.point), valid=consumableAllowed(slot);
    const modelPreview=renderer.setConsumablePreview?.(consumablePick,overBoard?(consumablePick!=='overload'&&slot?slot:target?.point):null,valid);
    ghost.classList.toggle('valid',valid);
    ghost.style.left=Math.max(0,Math.min(e.clientX+18,(globalThis.innerWidth||Infinity)-190))+'px'; ghost.style.top=Math.max(0,Math.min(e.clientY+18,(globalThis.innerHeight||Infinity)-74))+'px';
    const paths={spikes:'<path d="M8 26L24 6l-3 24M8 26l25-9M12 12l18 21"/>',resin:'<path d="M20 4C16 12 8 17 8 25a12 12 0 0 0 24 0C32 17 24 12 20 4Z"/>',overload:'<path d="M23 3L8 23h11l-2 14 16-22H22Z"/>'};
    ghost.classList.toggle('modelPreview',!!modelPreview);
    ghost.innerHTML=`${modelPreview?'':`<svg viewBox="0 0 40 40">${paths[consumablePick]}</svg>`}<span>${HexCombat.consumables[consumablePick].name}</span><small>${valid?'✓ Platzieren':state.gold<HexCombat.consumables[consumablePick].cost?'× Nicht genug Gold':consumablePick==='overload'?'× Geeigneten Turm wählen':'× Auf die Straße zeigen'}</small>`;
  }
  document.addEventListener('pointermove', e => { consumablePointer=e; if(consumablePick)renderConsumablePreview(false); });
  document.addEventListener('pointerleave', () => { consumablePointer=null; renderer.setConsumablePreview?.(null); document.getElementById('consumableGhost').classList.add('hidden'); });
  let state;
  let random;
  let towerMenuKey = '';
  let handRenderKey = '', forecastRenderKey = '', uiLanguageRevision = 0;
  const deckRenderKeys = new Map(), uiWavePlans = new Map();
  // UI-only cache: never handed to the simulation or modified by consumers.
  function uiWavePlan(wave) {
    if (duoToken && state.wavePlans?.some(p => p.wave === wave)) return state.wavePlans.find(p => p.wave === wave);
    const cacheKey = JSON.stringify([wave, state.income, !!state.challengeDay, state.seed, state.towerLoadout, state.greedContract]);
    if (!uiWavePlans.has(cacheKey)) {
      if (uiWavePlans.size >= 4) uiWavePlans.delete(uiWavePlans.keys().next().value);
      uiWavePlans.set(cacheKey, HexWaves.plan(wave, state.income, !!state.challengeDay, state));
    }
    return uiWavePlans.get(cacheKey);
  }
  let copiedTowerPriorities = null;
  let towerPanelKey = '';
  let towerComparison = null, towerSelectionKey = '', towerFocusOpen = false, towerComparisonScroll = 0, towerComparedPreview = null;
  let buildingPanelKey = ''; const buildingButtons = new Map();
  const upgradeButtons = new Map();
  const sound = typeof HexAudio === 'undefined' ? { play() { } } : HexAudio;
  const runTimers = new Set();

  function schedule(callback, delay) {
    const run = state;
    const timer = setTimeout(() => {
      runTimers.delete(timer);
      if (state === run) callback();
    }, delay);
    runTimers.add(timer);
  }
  function clearRunTimers() {
    runTimers.forEach(clearTimeout);
    runTimers.clear();
  }

  function shuffle(arr) { return HexRunFlow.shuffle(arr, random); }
  function drawHand() {
    const result = HexRunFlow.drawHand(state, random); state.selectedCard = null; state.rotation = 0;
    if (result === 'rescue') setMessage('Deck blockiert: Lege das kostenlose Rettungshex. Es hat keine Turmplätze und kommt nicht ins Deck.');
    if (result === 'tunnel') setMessage('Straße eingeschlossen. Ein kostenloser Rettungstunnel öffnet eine neue Front.');
    if (result === 'blocked') setMessage('Keine Erweiterung möglich. Du kannst bauen und die nächste Wave starten.');
    renderUI();
  }

  function openRoadTargets() {
    const spots = [];
    for (const tile of state.map.values()) {
      for (const d of tile.roads || []) {
        const n = neighbor(tile.q, tile.r, d);
        if (!state.map.has(key(n.q, n.r))) spots.push({ q: n.q, r: n.r, needs: OPP(d) });
      }
    }
    const uniq = new Map(); spots.forEach(s => uniq.set(key(s.q, s.r), s));
    return [...uniq.values()];
  }

  function placementTargets(card) {
    if (duoToken) return [...new Map((state.placements?.[state.selectedCard] || []).flat().map(p => [key(p.q, p.r), p])).values()];
    if (card.roads.length) return openRoadTargets();
    const targets = new Map(); for (const tile of state.map.values()) for (let d = 0; d < 6; d++) { const n = neighbor(tile.q, tile.r, d); if (!state.map.has(key(n.q, n.r))) targets.set(key(n.q, n.r), n); } return [...targets.values()];
  }
  function canPlace(q, r, card, rot) { if (duoToken) return !!state.placements?.[state.selectedCard]?.[rot]?.find(p => p.q === q && p.r === r)?.legal; return HexPlacementCommands.canPlace(state, q, r, card, rot); }
  function validRotations(q, r, card) {
    return Array.from({ length: 6 }, (_, rotation) => rotation).filter(rotation => canPlace(q, r, card, rotation));
  }
  function orientPlacement(q, r) {
    if (state.phase !== 'place' || state.waveRunning || state.buildingTarget || consumablePick) return false;
    const card = HexPlacementCommands.card(state, state.hand[state.selectedCard]); if (!card) return false;
    const valid = validRotations(q, r, card);
    if (!valid.length || valid.includes(state.rotation)) return false;
    state.rotation = valid[0]; return true;
  }
  function buildGraph() { return HexMap.buildGraph(state.map); }
  const pathToBase = HexMap.pathToBase;

  function hasAnyPlacement(card, rot) { return placementTargets(card).some(s => canPlace(s.q, s.r, card, rot)); }

  const slotPositions = HexMap.slotPositions;

  function applyBuildingTarget(q, r) { if (!state.buildingTarget) return false; if (duoToken) { duoAction('buildingTarget', { slot: state.buildingTarget, target: key(q, r) }); state.buildingTarget = null; return true; } const ok = HexBuildings.setTarget(state, state.buildingTarget, key(q, r)); if (ok) { state.buildingTarget = null; setMessage('Zusätzliches Hex versorgt.'); renderAll(); } else { setMessage('Dieses Hex ist bereits versorgt. Wähle ein unversorgtes Hex.'); renderAll(); } return true; }
  function placeTile(q, r) {
    if (consumeAt(q, r)) return;
    if (state.dragTower) { cancelQuickTower(); renderAll(); return; }
    if (applyBuildingTarget(q, r)) return;
    if (state.phase !== 'place' || state.waveRunning || state.celebrationActive) return;
    const id = state.hand[state.selectedCard]; if (!id) return;
    const card = id === 'rescue' ? state.rescueCard : CARD_LIBRARY[id];
    orientPlacement(q, r);
    if (!canPlace(q, r, card, state.rotation)) {
      if (!duoToken && !card.rescue && !state.openingRemaining && !state.hand.some(id => { const c = HexPlacementCommands.card(state, id); return c && Array.from({ length: 6 }, (_, rot) => rot).some(rot => openRoadTargets().some(n => canPlace(n.q, n.r, c, rot))); })) {
        state.discard.push(...state.hand.filter(id => id !== 'rescue')); state.hand = []; drawHand(); return;
      }
      setMessage(HexPlacementCommands.failureMessage(state, card), true); return;
    }
    if (duoToken) { duoAction('place', { q, r, index: state.selectedCard, rotation: state.rotation }); return; }
    const result = HexRunSession.place(state, random, { q, r, index: state.selectedCard, rotation: state.rotation }); if (!result) return;
    const { connected, treasure } = result; sound.play('place'); state.hoveredPlacement = null;
    if (result.opening) { state.selectedCard = null; state.rotation = 0; setMessage('Erster Ausgang erweitert. Lege jetzt eine Karte direkt an den zweiten Base-Ausgang.'); renderAll(); return; }
    state.selectedSlot = null; state.selectedBuilding = null; tutorialEvent('place');
    if(state.challengeKind === 'expedition'){showRelicEvents(result.relicEvents||[]);setMessage(connected.gold?'Relikt geborgen · '+state.expedition.collected.length+'/3 · +'+connected.gold+' Gold':'Hex gelegt · Noch '+state.expedition.remaining+' Platzierungen');renderAll();saveRunAutosave();return;}
    if(state.challengeKind === 'detour'){setMessage('Straße gelegt. Baue weiter oder wähle Welle starten.');renderAll();saveRunAutosave();return;}
    if (treasure || connected.gold || state.pendingShrine) sound.play('collect');
    setMessage(treasure || connected.gold ? `Schatz erschlossen: +${treasure + connected.gold} Gold. Baue jetzt Türme oder starte die Wave.` : 'Hex gelegt. Baue jetzt Türme oder starte die Wave.');
    if (connected.bosses) setMessage(`${connected.bosses} Bossfeld(er) angeschlossen. Wächter starten in der nächsten Wave auf ihren eigenen Hexfeldern.`);
    if (state.landmarks.get(key(q, r))?.status === 'ready') setMessage('Bossfeld erschlossen: Der Wächter startet in der nächsten Wave direkt auf diesem Hex. Bereite deine Türme vor.');
    renderAll();
    if (state.pendingShrine) { showShrine(); renderAll(); return; }
    if (autoStart.checked && !tutorial.active) schedule(() => startWave(), 250);
  }

  function selections(kind) {
    const primary = state['selected' + kind]; if (!primary) return [];
    const list = state['selected' + kind + 's']; return list?.includes(primary) ? list : [primary];
  }
  function chooseMany(kind, selected, multiple) {
    const list = multiple ? selections(kind).slice() : [], at = list.findIndex(s => s.q === selected.q && s.r === selected.r && s.index === selected.index);
    if (at >= 0) list.splice(at, 1); else list.push(selected);
    state['selected' + kind + 's'] = list; state['selected' + kind] = list.at(-1) || null;
  }
  function selectSlot(q, r, index, multiple = false, pointerType) {
    if(state.villageMove){
      if((state.challengeKind==='movingFortress'?HexMovingFortress:HexVillages).move(state,state.villageMove,{q,r,index})){state.villageMove=null;state.selectedTower={q,r,index};state.selectedTowers=[state.selectedTower];state.selectedSlot=null;renderAll();saveRunAutosave(true);}
      else setMessage('Wähle einen freien Bauplatz. Umzüge sind nur in der Bauphase möglich.');
      return;
    }
    towerMenuNeedsFreshTouch = pointerType === 'touch';
    if (consumeAt(q, r, index)) return;
    if (duoBridge?.pickSupport?.('slot', { q, r, index })) return;
    globalThis.HexCompact?.open('');
    if (state.dragTower) { if (pointerType === 'touch') cancelQuickTower(); else { dropQuickTower(state.dragTower, { q, r, index }); return; } }
    closeBasePanel();
    if (!['place', 'build', 'wave'].includes(state.phase) || state.hp <= 0) return;
    const tile = state.map.get(key(q, r)); if (!tile || !Number.isInteger(index) || index < 0 || index >= tile.slots || tile.towers[index]) return;
    state.selectedTower = null; state.selectedBuilding = null; chooseMany('Slot', { q, r, index }, multiple); tutorialEvent('slot');
    document.getElementById('towerSelectionHint').textContent = selections('Slot').length + (selections('Slot').length === 1 ? ' Bauplatz' : ' Bauplätze') + ' gewählt · Wähle einen Turm zum Bauen.'; if (!tutorial.active) messageEl.classList.remove('show'); document.getElementById('towerDrawer')?.classList.remove('hidden'); document.getElementById('rulesDrawer')?.classList.add('hidden'); document.getElementById('settingsDrawer')?.classList.add('hidden'); renderAll();
  }

  function buyTower(type) {
    cancelQuickTower();
    if (duoToken) { duoAction('tower', { type, slots: selections('Slot') }); return; }
    const result = HexTowerCommands.buy(state, type, selections('Slot'));
    if (!result.ok) { if (result.reason === 'gold') setMessage('Nicht genug Gold.'); return; }
    if (globalThis.HexCompact?.small()) { document.getElementById('towerDrawer').classList.add('hidden'); HexCompact.open(''); }
    if (tutorial.active && tutorial.step === 3) document.getElementById('towerDrawer').classList.add('hidden');
    state.selectedSlots = []; state.selectedSlot = null; state.previewTower = null; state.selectedTower = null;
    sound.play('build'); tutorialEvent('buy', type);
    renderAll();
  }

  function sellSelectedTower() {
    if (duoToken) { duoAction('sellTower', { slot: state.selectedTower }); return; }
    if (selections('Tower').length !== 1) return;
    const selected = state.selectedTower, tile = state.map.get(key(selected.q, selected.r)), tower = tile?.towers[selected.index];
    const refund = HexData.towerRefund(state, tower); if (!refund) return;
    HexData.recordTowerStat(state, tower, 'refundGold', refund.amount); if (state.runTowerDetails[tower.statId]) state.runTowerDetails[tower.statId].sold = true;
    state.gold += refund.amount; tile.towers[selected.index] = null;
    state.selectedTower = null; state.selectedSlot = ['place', 'build', 'wave'].includes(state.phase) ? { ...selected } : null;
    sound.play('build'); setMessage(`Turm zurückgegeben: +${refund.amount} Gold (${refund.percent} % der gesamten Investition inklusive Upgrades).`); renderAll();
  }
  function upgradeSelectedTower(branch) {
    if (duoToken) { duoAction('upgrade', { slot: state.selectedTower, upgrade: branch }); return; }
    state.previewUpgrade = null;
    if (selections('Tower').length !== 1 || !HexTowerCommands.upgrade(state, state.selectedTower, branch)) return;
    const tutorialUpgrade = tutorial.active && tutorial.step === 4;
    sound.play('build'); tutorialEvent('upgrade'); if (tutorialUpgrade) { state.selectedTower = null; state.selectedTowers = []; state.selectedSlot = null; state.selectedSlots = []; state.previewTower = null; document.getElementById('towerDrawer').classList.add('hidden'); } renderAll();
  }

  function spawnSources() { return HexRunRuntime.spawnSources(state); }
  function nextSourcePoints(source) { return HexRunRuntime.nextSourcePoints(state, random, source); }

  const SPAWN_SPACING = 20;   // Weltmaß zwischen zwei nacheinander gespawnten Gegnern
  function startWave() {
    if (duoToken) { duoBridge?.ready(); return; }
    if (!document.getElementById('greedOverlay').classList.contains('hidden')) return;
    state.villageMove=null;
    if(state.challengeKind==='detour'&&state.phase==='place')HexDetour.finishPlanning(state);
    if (state.phase === 'place') { setMessage('Lege zuerst dein Hex, bevor du die nächste Welle startest.'); return; }
    if(typeof HexDevEnemies!=='undefined'&&HexDevEnemies.allowed()&&devEnemyQueue.length&&!state.waveRunning&&state.phase==='build'){
      state.devEnemyWave=state.wave+1;state.devEnemyRoster=devEnemyQueue.map(row=>({...row}));uiWavePlans.clear();
    }
    const result = HexRunFlow.start(state, random); if (!result) return;
    if(state.devEnemyWave===state.wave){devEnemyQueue=[];renderDevEnemies();}
    last = performance.now(); clockDebt = 0; tutorialEvent('wave'); state.selectedSlot = null; state.previewTower = null; sound.play('wave'); startWaveBtn.disabled = true;
    setMessage('Wave ' + state.wave + ' läuft – ' + result.fronts + ' offene Fronten.' + (result.waveBoss ? ' Bosswelle!' : '') + (result.bosses ? ' ' + result.bosses + ' Wächter gestartet.' : '')); renderUI();
  }
  function renderSessionPhase() {
    if (state.phase === 'victory') { showCampaignVictory(); return; }
    state.selectedCard = null; state.rotation = 0;
    if (state.phase === 'bossReward') showBossReward(); else if (state.phase === 'reward') showRewards(); else if (state.phase === 'shrineReward') showShrine(); else if (state.phase === 'removal') showRemoval(state.removalSource);
    else { rewardOverlay.classList.add('hidden'); if (state.drawResult === 'rescue') setMessage('Deck blockiert: Lege das kostenlose Rettungshex.'); if (state.drawResult === 'tunnel') setMessage('Straße eingeschlossen. Ein kostenloser Rettungstunnel öffnet eine neue Front.'); showPendingCelebration(); }
    renderAll();
    if (!['detour','villages','powerGrid','expedition','towerDraft','movingFortress'].includes(state.challengeKind) && state.phase === 'build' && !state.celebrationActive && autoStart.checked && !tutorial.active) schedule(() => startWave(), 250);
  }
  let rewardInputOffer = null, rewardInputAfter = 0, rewardPointerReady = false;
  function openRewardSelection() {
    document.getElementById('skipRemovalTopBtn').classList.toggle('hidden', state.phase !== 'removal' && state.rewardOffer?.kind !== 'removal');
    if (rewardInputOffer !== state.rewardOffer?.id) { rewardInputOffer = state.rewardOffer?.id; rewardInputAfter = performance.now() + 350; rewardPointerReady = false; }
    rewardOverlay.classList.remove('hidden');
  }
  rewardOverlay.addEventListener('pointerdown', event => { rewardPointerReady = performance.now() >= rewardInputAfter; if (!rewardPointerReady) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
  rewardOverlay.addEventListener('click', event => { if (performance.now() < rewardInputAfter || event.detail > 0 && !rewardPointerReady) { event.preventDefault(); event.stopImmediatePropagation(); } }, true);
  function takeReward(id, index) { state.workshopPicking = false; rewardChoices.classList.remove('workshopChoices'); if (duoToken) { duoAction('reward', { offerId: id, index }); return false; } if (!HexRunSession.choose(state, random, id, index)) return false; renderSessionPhase(); return true; }
  function endWave() {
    const previousFortressStage=state.movingFortress?.stage;
    const best = state.challengeDay ? (profile.dailyResults?.[state.challengeDay]?.best || 0) : profile.records.highestWave || 0;
    const result = HexRunSession.finish(state, random, best); if (!result) return;
    clearBuildingInteraction();
    if (!state.challengeDay && !state.duoMode) { profile = HexProfile.recordIntroduction(profile, state.lastCompletedWave, TOWERS); scheduleCloudSave(); }
    if (result.objectiveFailed) { sound.play('gameover');showGameOver();renderAll();saveRunAutosave();return; }
    if (result.campaignVictory) { showCampaignVictory(); saveRunAutosave(); return; }
    if (result.victory) { showCampaignVictory(); saveRunAutosave(); return; } if(state.challengeKind!=='expedition')sound.play('complete'); renderSessionPhase(); if(state.movingFortress&&state.movingFortress.stage!==previousFortressStage)renderer.resetView(); saveRunAutosave();
  }
  function clearBuildingInteraction() {
    if (state.buildingTarget) { messageEl.classList.remove('show'); document.getElementById('messageText').textContent = ''; }
    state.buildingTarget = state.selectedBuilding = state.previewBuilding = state.hoverBuilding = null;
    buildingPanelKey = '';
    document.getElementById('buildingPanel').classList.add('hidden');
  }
  function finishBossReward() { if (state.phase === 'bossReward') takeReward(state.rewardOffer?.id, null); }
  function finishRemoval() { if (['removal', 'shrineReward'].includes(state.phase)) takeReward(state.rewardOffer?.id, null); }
  function rewardAction(title, description, action) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'upgradeOption';
    button.innerHTML = '<strong>' + title + '</strong><small>' + description + '</small>'; button.addEventListener('click', action); rewardChoices.appendChild(button);
  }
  let rewardView = 'selection';
  function inspectReward(view) {
    rewardView = view;
    if (view === 'selection' && !state?.workshopPicking) rewardChoices.classList.remove('workshopChoices');
    document.getElementById('rewardInspectActions').classList.remove('hidden'); document.getElementById('skipRemovalBtn').textContent = 'Belohnung überspringen';
    rewardOverlay.classList.toggle('inspectMap', view === 'map');
    rewardOverlay.setAttribute('aria-modal', String(view !== 'map'));
    document.getElementById('rewardSelection').classList.toggle('hidden', view !== 'selection');
    document.getElementById('rewardDeck').classList.toggle('hidden', view !== 'deck');
    document.getElementById('rewardBackBtn').classList.toggle('hidden', view === 'selection');
    document.getElementById('rewardMapBtn').setAttribute('aria-pressed', String(view === 'map'));
    document.getElementById('rewardDeckBtn').setAttribute('aria-pressed', String(view === 'deck'));
    if (view === 'deck') renderDeckOverview('rewardDeckOverview');
  }
  function showPendingCelebration() {
    HexRunSession.promoteCelebration(state); if (!state.celebrationActive || !state.activeCelebration) return;
    const success = state.activeCelebration;
    document.getElementById('celebrationTitle').textContent = success.bosses ? 'DIE WÄCHTER SIND GEFALLEN!' : 'DU WÄCHST ÜBER DICH HINAUS!';
    document.getElementById('celebrationText').textContent = success.messages.join(' · ');
    document.getElementById('celebrationWave').textContent = 'WAVE ' + success.wave + ' ÜBERLEBT';
    document.getElementById('celebration').classList.remove('hidden'); sound.play('complete');
    document.getElementById('celebrationContinue').focus?.();
  }
  function closeCelebration() { if (duoToken) { duoAction('acknowledge'); return; } HexRunSession.acknowledge(state); document.getElementById('celebration').classList.add('hidden'); renderHotkeyTip(); startWaveBtn.focus?.(); }

  function showBossReward() {
    inspectReward('selection');
    state.phase = 'bossReward'; state.bossRewards=state.bossRewards.map(id=>typeof id==='string'?id:'wave:'+state.wave); const id = state.bossRewards[0], rarity = HexExploration.bossRewardRarity(state.seed, id);
    document.getElementById('rewardTitle').textContent = 'Wächter besiegt · ' + rarity + '-Beute';
    document.getElementById('rewardDescription').textContent = 'Zusätzlich zu den 50 Gold: Wähle genau eine Karte oder einen Run-Segen. Normale Wave-Belohnungen folgen danach.';
    document.getElementById('skipRemovalBtn').classList.remove('hidden'); rewardChoices.innerHTML = '';
    const offer = HexRewards.offer(state, 'boss', random), picks = offer.choices.filter(c => c.kind === 'card').map(c => c.cardId);
    for (const cardId of picks) {
      const card = cardElement(cardId, false); card.addEventListener('click', () => {
        if (state.phase !== 'bossReward' || state.bossRewards[0] !== id) return;
        takeReward(offer.id, offer.choices.findIndex(c => c.kind === 'card' && c.cardId === cardId));
      }); rewardChoices.appendChild(card);
    }
    for (const [kind, title, description] of [['bastion', 'Bastionssegen', '+5 maximale und aktuelle Base-HP für diesen Run.'], ['income', 'Handelspakt', '+2 Gold nach jeder künftig überlebten Wave in diesem Run.']]) rewardAction(title, description, () => { if (state.phase !== 'bossReward' || state.bossRewards[0] !== id) return; takeReward(offer.id, offer.choices.findIndex(c => c.blessing === kind)); });
    openRewardSelection();
  }

  function showRewards() {
    inspectReward('selection');
    state.phase = 'reward';
    document.getElementById('rewardTitle').textContent = 'Deck erweitern';
    document.getElementById('rewardDescription').textContent = 'Wähle 1 von 3 Hexkarten. Common ist häufiger als Uncommon und Rare.';
    document.getElementById('skipRemovalBtn').classList.add('hidden');
    const offer = HexRewards.offer(state, 'normal', random), picks = offer.choices.map(c => c.cardId);
    rewardChoices.innerHTML = '';
    picks.forEach(id => {
      const el = cardElement(id, false); el.addEventListener('click', () => {
        if (state.phase !== 'reward') return;
        if (!takeReward(offer.id, picks.indexOf(id))) return;
        if (state.phase === 'place') setMessage(`${CARD_LIBRARY[id].name} wurde deinem Deck hinzugefügt.`);
      }); rewardChoices.appendChild(el);
    });
    openRewardSelection();
  }
  function startWorkshop(offer) {
    state.workshopPicking = true; state.rewardOffer = offer; inspectReward('map'); setMessage('Werksegen: Klicke einen Turm auf der Karte an. Danach wählst du sein kostenloses Upgrade.'); renderAll();
  }
  function pickWorkshopTower(q, r, index) {
    if (!state.workshopPicking || state.phase !== 'shrineReward') return false;
    const offer = state.rewardOffer, choices = offer?.choices?.map((c, i) => ({ ...c, offerIndex: i })).filter(c => c.kind === 'upgrade' && c.choice.q === q && c.choice.r === r && c.choice.index === index) || [];
    if (!choices.length) { setMessage('Dieser Turm kann keinen Werksegen erhalten. Wähle einen ausbaubaren eigenen Turm.'); return true; }
    rewardChoices.innerHTML = ''; rewardChoices.classList.remove('workshopChoices'); inspectReward('selection');
    document.getElementById('rewardTitle').textContent = 'Werksegen · ' + TOWERS[choices[0].choice.type].name;
    document.getElementById('rewardDescription').textContent = 'Wähle ein kostenloses Upgrade für den angeklickten Turm.';
    for (const c of choices) rewardAction(c.choice.name, 'Kostenlos · Verkaufswert bleibt unverändert.', () => takeReward(offer.id, c.offerIndex));
    rewardAction('Anderen Turm wählen', 'Zurück zur Karte.', () => startWorkshop(offer)); return true;
  }
  function showShrine() {
    inspectReward('selection');
    const effect = HexExploration.shrineEffect(state.landmarks, state.pendingShrine);
    if (effect === 'augment') {
      state.phase='shrineReward';rewardChoices.innerHTML='';const offer=HexRewards.offer(state,'shrine',random);
      document.getElementById('rewardTitle').textContent='Seltenes Augment wählen';
      document.getElementById('rewardDescription').textContent='Wähle einen Bonus für diesen Durchlauf. Gewählte Augments erscheinen nicht erneut.';
      offer.choices.forEach((choice,index)=>rewardAction(choice.label,choice.desc,()=>{if(takeReward(offer.id,index))saveRunAutosave();}));
      document.getElementById('skipRemovalBtn').classList.add('hidden');openRewardSelection();return;
    }
    if (effect === 'remove') { showRemoval('shrine'); return; }
    if (effect === 'aura') {
      state.phase = 'shrineReward'; rewardChoices.innerHTML = ''; const offer = HexRewards.offer(state, 'shrine', random);
      document.getElementById('rewardTitle').textContent = 'Schrein · dauerhaften Segen wählen';
      document.getElementById('rewardDescription').textContent = 'Wirkt auf diesem Hex und allen direkten Nachbarhexen. Gleiche Schreinboni sind nicht stapelbar.';
      offer.choices.forEach((choice, index) => rewardAction(choice.label, choice.desc, () => takeReward(offer.id, index)));
      document.getElementById('skipRemovalBtn').classList.add('hidden'); document.getElementById('rewardInspectActions').classList.add('hidden'); openRewardSelection(); return;
    }
    if (effect === 'repair' || effect === 'upgrade') {
      const shrineId = state.pendingShrine; state.removalSource = 'shrine'; state.phase = 'shrineReward'; rewardChoices.innerHTML = '';
      document.getElementById('rewardTitle').textContent = effect === 'repair' ? 'Shrine erschlossen · Heilquelle' : 'Shrine erschlossen · Werksegen';
      document.getElementById('rewardDescription').textContent = effect === 'repair' ? 'Heile bis zu 5 HP. Bei voller Gesundheit erhältst du stattdessen 30 Gold.' : 'Wähle ein kostenloses Upgrade für einen bereits gebauten Loadout-Turm. Ist keines möglich, erhältst du 30 Gold.';
      const offer = HexRewards.offer(state, 'shrine', random);
      const take = index => { if (state.phase !== 'shrineReward' || state.pendingShrine !== shrineId) return; if (takeReward(offer.id, index)) sound.play('collect'); };
      const choices = offer.choices.filter(c => c.kind === 'upgrade').map(c => c.choice);
      if (choices.length) for (const choice of choices) rewardAction(TOWERS[choice.type].name + ' → ' + choice.name, 'Hex ' + choice.q + ',' + choice.r + ' · Platz ' + (choice.index + 1) + ' · kostenlos; Verkaufswert bleibt unverändert.', () => take(offer.choices.findIndex(c => c.choice === choice)));
      else rewardAction(effect === 'repair' && state.hp < state.maxHp ? 'Bis zu +5 HP' : 'Vorräte · +30 Gold', 'Einmaliger Shrine-Segen.', () => take(0));
      if (choices.length) { rewardChoices.classList.add('workshopChoices'); rewardAction('Turm auf der Karte wählen', 'Klicke danach den gewünschten Turm an und wähle sein kostenloses Upgrade.', () => startWorkshop(offer)); }
      document.getElementById('skipRemovalBtn').classList.add('hidden'); document.getElementById('rewardInspectActions').classList.add('hidden'); openRewardSelection(); return;
    }
    state.removalSource = 'shrine'; state.phase = 'shrineReward'; rewardChoices.innerHTML = '';
    document.getElementById('rewardTitle').textContent = 'Shrine erschlossen · Effekt: ' + (effect === 'legendary' ? 'Legendary-Karte erhalten' : effect === 'epic' ? 'Epic-Karte erhalten' : 'Zusätzliche Karte wählen');
    document.getElementById('rewardDescription').textContent = 'Wähle eine Karte für dein Deck. Danach geht es zurück in die Bauphase. Dieser Shrine ist einmalig; Überspringen verbraucht ihn ebenfalls.';
    document.getElementById('skipRemovalBtn').classList.remove('hidden');
    const offer = HexRewards.offer(state, 'shrine', random), picks = offer.choices.map(c => c.cardId);
    for (const id of picks) {
      const card = cardElement(id, false); card.addEventListener('click', () => {
        if (state.phase !== 'shrineReward') return;
        if (!takeReward(offer.id, picks.indexOf(id))) return; setMessage(`${CARD_LIBRARY[id].name} durch den Shrine zum Deck hinzugefügt.`);
      }); rewardChoices.appendChild(card);
    }
    openRewardSelection();
  }
  function bindRemovalConfirmation(card, remove) {
    const prompt = document.createElement('span'); prompt.className = 'removalConfirm';
    const title = document.createElement('strong'); title.textContent = 'Bist du dir sicher?';
    const hint = document.createElement('span'); hint.textContent = 'Erneut antippen, um 1 Kopie zu entfernen.';
    prompt.appendChild(title); prompt.appendChild(hint); card.appendChild(prompt);
    card.setAttribute('aria-pressed', 'false');
    card.addEventListener('click', () => {
      if (card.disabled) return;
      if (card.classList.contains('removalPending')) { remove(); return; }
      for (const other of rewardChoices.children) { other.classList.remove('removalPending'); other.setAttribute('aria-pressed', 'false'); }
      card.classList.add('removalPending'); card.setAttribute('aria-pressed', 'true');
    });
  }
  function showRemoval(source = 'reward') {
    inspectReward('selection');
    state.removalSource = source;
    state.phase = 'removal'; rewardChoices.innerHTML = '';
    document.getElementById('rewardTitle').textContent = 'Deck ausdünnen (optional)';
    document.getElementById('rewardDescription').textContent = 'Optional: Entferne eine Kartenkopie aus deinem Deck. Mindestens 5 Karten bleiben erhalten. Bereits gelegte Hexe bleiben bestehen.' + (source === 'shrine' ? ' Dieser Shrine ist einmalig; Überspringen verbraucht ihn ebenfalls.' : '');
    document.getElementById('skipRemovalBtn').classList.add('hidden');
    const offer = HexRewards.offer(state, 'removal', random);
    const counts = new Map(); state.deck.forEach(id => counts.set(id, (counts.get(id) || 0) + 1));
    const rarityOrder = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4 };
    for (const [id, count] of [...counts].sort(([a], [b]) => (rarityOrder[CARD_LIBRARY[a]?.rarity] ?? 99) - (rarityOrder[CARD_LIBRARY[b]?.rarity] ?? 99) || CARD_LIBRARY[a].name.localeCompare(CARD_LIBRARY[b].name, 'de'))) {
      const card = cardElement(id, false), info = document.createElement('p'); info.textContent = `${count} im Deck · 1 Kopie entfernen`; card.appendChild(info); card.disabled = state.deck.length <= 5;
      bindRemovalConfirmation(card, () => { if (state.phase !== 'removal' || !takeReward(offer.id, offer.choices.findIndex(c => c.cardId === id))) return; if (['place', 'build'].includes(state.phase)) setMessage(`${CARD_LIBRARY[id].name}: Eine Kopie aus dem Deck entfernt.`); }); rewardChoices.appendChild(card);
    }
    openRewardSelection();
  }

  function update(dt, time, paint = true) {
    if (duoToken) return;
    if (!state.waveRunning) return;
    const outcome = HexRunRuntime.advance(state, random, dt * gameSpeed, name => sound.play(name));
    if (state.hp <= 0) { HexCombat.clearConsumables(state); state.hp = 0; state.waveRunning = false; state.phase = 'gameover'; state.enemies = []; state.projectiles = []; state.spawnQueue = []; clearRunTimers(); sound.play('gameover'); setMessage(`Run beendet. Du hast Wave ${state.wave} erreicht.`); showGameOver(); }
    else if (outcome === 'complete') endWave();
    if (paint) { renderBoard(); renderUI(); }
  }

  function buildRescueTunnel() {
    if (duoToken) { duoAction('tunnel'); return; }
    if (!state.tunnelOffer || state.phase !== 'build' || state.waveRunning || state.hp <= 0) return;
    const plan = HexMap.tunnelPlan(state.map, state.landmarks, !!state.tunnelOffer); if (!plan) { setMessage('Kein gültiger Rettungstunnel verfügbar.'); return; }
    if (!state.tunnelConfirmed) { state.tunnelConfirmed = true; setMessage('Rettungstunnel von Hex ' + plan.source + ' nach ' + plan.q + ',' + plan.r + '. Kostenlos, keine Gebäude werden entfernt.'); renderAll(); return; }
    const built = HexRunRuntime.rescueTunnel(state); renderAll(); if(built)saveRunAutosave(); setMessage(built ? 'Rettungstunnel geöffnet. Erweitere die neue Straße in der nächsten Runde.' : 'Kein gültiger Rettungstunnel verfügbar.');
  }
  document.getElementById('tunnelRescueBtn').addEventListener('click', buildRescueTunnel);
  function renderBoard() {
    state.showSlotHints=showSlotHints&&(state.challengeKind!=='towerDraft'||Object.values(state.towerDraft.inventory).some(n=>n>0));
    if (state.previewUpgrade) { const selected = state.selectedTower, tower = selected && state.map.get(key(selected.q, selected.r))?.towers[selected.index]; if (tower !== state.previewUpgrade.tower) state.previewUpgrade = null; }
    if (state.buildingTarget && (state.hp <= 0 || state.phase === 'gameover')) state.buildingTarget = null;
    const card = HexPlacementCommands.card(state, state.hand[state.selectedCard]);
    if (state.hoveredPlacement) { const [q, r] = state.hoveredPlacement.split(',').map(Number); orientPlacement(q, r); }
    const targets = state.phase === 'place' && !state.waveRunning && card ? placementTargets(card).filter(target => !state.landmarks.get(key(target.q, target.r))?.prefab).map(target => ({ ...target, legal: validRotations(target.q, target.r, card).length > 0 })) : [];
    if (globalThis.HexCompact?.small() && card && targets.length && !targets.some(t => key(t.q, t.r) === state.hoveredPlacement)) {
      const preview = targets.find(t => t.legal) || targets[0]; state.hoveredPlacement = key(preview.q, preview.r); orientPlacement(preview.q, preview.r);
    }
    if (state.buildingTarget) { targets.splice(0, targets.length, ...[...state.map.values()].map(t => ({ q: t.q, r: t.r, legal: HexBuildings.canTarget(state, state.buildingTarget, key(t.q, t.r)) }))); }
    if (consumablePick) targets.length = 0;
    state.consumablePickUI = consumablePick;
    renderer.render(state, targets); renderDragShade(); renderConsumablePreview();
  }
  // Kartenbild: Kachel in Schrägsicht wie cards/road_*_tilt.svg, Straßen aus der echten Kachelgeometrie (Drehung und Sonderformen stimmen).
  // Verläufe und Maske stehen einmal als #hxCardDefs am Anfang von index.html: Doppelte IDs in jeder Karte
  // brachen die Darstellung, sobald das erste Vorkommen in einem ausgeblendeten Fenster lag (Deck, Turmfenster).
  const CARD_TUFTS = [[250, 330, 1], [612, 296, 0], [300, 706, 0], [640, 690, 1], [433, 214, 1], [433, 800, 0], [170, 520, 0], [700, 540, 1], [540, 420, 0], [330, 590, 1]];
  function miniPathSvg(card, rot = 0) {
    const geometry = HexMap.roadGeometry({ q: 0, r: 0, type: card.id, roads: rotatedRoads(card, rot) });
    const points = list => list.map(p => (433 + p.x * 480 / HEX).toFixed(0) + ',' + (500 + p.y * 480 / HEX).toFixed(0)).join(' ');
    const legs = [...geometry.legs.values()], road = (color, width, extra = '') => legs.map(list => '<polyline points="' + points(list) + '" fill="none" stroke="' + color + '" stroke-width="' + width + '" stroke-linecap="round" stroke-linejoin="round"' + extra + '/>').join('');
    const tufts = CARD_TUFTS.map(([x, y, light]) => '<ellipse cx="' + x + '" cy="' + y + '" rx="30" ry="18" fill="' + (light ? '#b9e086' : '#6f9f45') + '"/>').join('')
      + '<ellipse cx="560" cy="760" rx="22" ry="15" fill="#c7c2b0"/><ellipse cx="250" cy="420" rx="16" ry="11" fill="#c7c2b0"/>';
    return '<svg class="hxCardArt" viewBox="0 0 866 740" aria-label="Aktuelle Ausrichtung">'
      + '<ellipse cx="433" cy="712" rx="370" ry="26" fill="#000" opacity=".18"/>'
      + '<path d="M17 459L433 608L433 703L17 554Z" fill="url(#hxCardEarth)"/><path d="M433 608L849 459L849 554L433 703Z" fill="#8f6a3e"/>'
      + '<path d="M17 459L433 608L433 630L17 481ZM433 608L849 459L849 481L433 630Z" fill="#5f8f3c"/>'
      + '<path d="M17 554L433 703L849 554" fill="none" stroke="#5b3f22" stroke-width="6" stroke-linejoin="round"/>'
      + '<g transform="scale(1 .62)"><polygon points="433,20 848.7,260 848.7,740 433,980 17.3,740 17.3,260" fill="#5f8f3c" stroke="#5f8f3c" stroke-width="34" stroke-linejoin="round"/>'
      + '<polygon points="433,60 814,280 814,720 433,940 52,720 52,280" fill="url(#hxCardMeadow)" stroke="#b5d38a" stroke-width="10" stroke-linejoin="round"/>'
      + '<g clip-path="url(#hxCardClip)">' + tufts + road('#a8763f', 214) + road('#ecd19a', 150) + road('#f6e4b8', 56, ' opacity=".55"') + '</g></g></svg>';
  }


  function cardTip(id) {
    const c = HexPlacementCommands.card(state, id), n = (c.roads || []).length;
    return `${c.name} (${c.rarity})
${c.desc}
${n ? n + ' Straßenanschlüsse' : 'Keine Straße'} · ${c.slots || 0} Turmplatz${(c.slots || 0) === 1 ? '' : 'e'}${c.buildingSlots ? (c.id === 'deadEnd' ? ' · 1 Gegnerportal-Platz' : ' · ' + c.buildingSlots + ' Gebäude') : ''}
R dreht die Karte, dann Feld anklicken.`;
  }
  function cardElement(id, selectable = true, previewRotation = 0) {
    const c = HexPlacementCommands.card(state, id); const el = document.createElement('button'); el.className = `card rarity-${c.rarity.toLowerCase()}`; el.type = 'button';
    const towerSlotLabel = c.slots === 1 ? 'Turmplatz' : 'Turmplätze';
    const capacity = `${c.slots || 0} ${towerSlotLabel}${c.buildingSlots ? ` · ${c.buildingSlots} ${c.id === 'deadEnd' ? 'Gegnerportal-Plätze' : 'Gebäudeplätze'}` : ''}`;
    el.innerHTML = `<div class="rarity">${c.rarity}</div>${miniPathSvg(c, previewRotation)}<h3>${c.name}</h3><p>${c.desc}</p><div class="slots" aria-label="${capacity}" title="${capacity}"><span aria-hidden="true"><span class="hxi hxi-towerSlot"></span> ${c.slots || 0}<span class="slotLabel"> ${towerSlotLabel}</span>${c.buildingSlots ? ` · <span class="hxi hxi-${c.id === 'deadEnd' ? 'waveStart' : 'building_house'}"></span> ${c.buildingSlots}<span class="slotLabel"> ${c.id === 'deadEnd' ? 'Gegnerportal' : 'Gebäude'}</span>` : ''}</span></div>`;
    if(state.challengeKind === 'detour' && selectable){const stock=document.createElement('small');stock.textContent=(state.detour.stock[id]||0)+'× verfügbar';el.appendChild(stock);}
    if (!selectable) { el.style.width = '100%'; if (state.phase !== 'removal') { const count = document.createElement('p'); count.className = 'deckCopyCount'; count.textContent = state.deck.filter(cardId => cardId === id).length + '× bereits im Deck'; el.appendChild(count); } }
    return el;
  }
  function pathGlyph(c) {
    if (c.id === 'straight' || c.id === 'empty') return '━';
    if (c.id === 'smallCurve') return '⌝'; if (c.id === 'bigCurve') return '◜'; if (c.id === 'tee') return '┳'; if (c.id === 'cross') return '╋'; if (c.id === 'village') return '⌞🏠'; return '⬡';
  }


  // ---- UX-Rückmeldung: Treffer an der Base, Goldgewinn, Wave-Fortschritt, Turm-Feld statt Shop bei gewähltem Turm ----
  let lastHp = null, lastGold = null, lastRun = null;
  function uxFeedback() {
    if (lastRun !== state) { lastRun = state; lastHp = state.hp; lastGold = state.gold; }
    const app = document.getElementById('app');
    if (state.hp < lastHp) { app.classList.remove('hit'); void app.offsetWidth; app.classList.add('hit'); }
    if (state.gold > lastGold) {
      const f = document.createElement('div'), compact = !!globalThis.HexCompact?.small();
      f.className = compact ? 'goldFloat goldFloatCompact' : 'goldFloat'; f.textContent = '+' + (state.gold - lastGold) + ' 🪙';
      (compact ? document.getElementById('app') : goldEl.parentElement)?.appendChild(f);
      f.addEventListener?.('animationend', () => f.remove()); setTimeout(() => f.remove?.(), 1400);
    }
    lastHp = state.hp; lastGold = state.gold;
    const bar = document.getElementById('waveBar');
    if (bar) { const total = state.waveRunning ? uiWavePlan(state.wave).count : 0, left = state.pendingSpawns + state.enemies.filter(e => e.alive).length; bar.style.width = total ? Math.max(0, Math.min(100, 100 - left / total * 100)) + '%' : '0%'; }
    if (state.selectedTower || state.selectedBuilding) document.getElementById('towerDrawer')?.classList.add('hidden');
    app.classList.toggle('canStart', state.phase === 'build' && !state.waveRunning && state.hp > 0);
  }
  function renderHotkeyTip() {
    if(state.challengeDay){document.getElementById('hotkeyTip').classList.add('hidden');document.getElementById('settingsOpenBtn').classList.remove('hotkeyGuide');return;}
    const tip = document.getElementById('hotkeyTip'), help = document.getElementById('hotkeyHelp'), settings = document.getElementById('settingsDrawer');
    if (state.lastCompletedWave >= 11 && !state.waveRunning && !state.celebrationActive && ['place', 'build'].includes(state.phase)) state.hotkeyHintStarted = true;
    const active = !state.introduction && onboardingHints && !!state.hotkeyHintStarted && !state.hotkeyHintDone && !['gameover', 'victory'].includes(state.phase) && !tutorial.active && hasActiveRun && mainMenu.classList.contains('hidden');
    if (active && help.open && !settings.classList.contains('hidden')) state.hotkeyHintDone = true;
    const shown = active && !state.hotkeyHintDone;
    tip.classList.toggle('hidden', !shown || !settings.classList.contains('hidden'));
    document.getElementById('settingsOpenBtn').classList.toggle('hotkeyGuide', shown && settings.classList.contains('hidden'));
    document.getElementById('hotkeyHelpSummary').classList.toggle('hotkeyGuide', shown && !settings.classList.contains('hidden'));
    document.querySelector?.('[data-compact="menu"]')?.classList.toggle('hotkeyGuide', shown && settings.classList.contains('hidden'));
    const inSettings = !settings.classList.contains('hidden');
    tip.classList.toggle('settingsVisible', inSettings);
    if (tip.parentElement && tip.parentElement !== app) app.appendChild(tip);
  }
  function openHotkeySettings() {
    document.querySelectorAll?.('.drawer').forEach(panel => panel.classList.add('hidden'));
    document.getElementById('settingsDrawer').classList.remove('hidden'); renderHotkeyTip(); layoutMenus();
  }
  function consumeAt(q, r, index, point) {
    if (!consumablePick) return false;
    if (consumablePick === 'overload' && !Number.isInteger(index)) { setMessage('Überladung: Klicke einen eigenen angreifenden Turm an.'); return true; }
    const slot = { q, r, index: Number.isInteger(index) ? index : 0, ...(point ? { x: point.x, y: point.y } : {}) }, kind = consumablePick;
    if (duoToken) { duoAction('consumable', { kind, slot }); renderAll(); return true; }
    if (HexCombat.buyConsumable(state, kind, slot)) { setMessage(HexCombat.consumables[kind].name + ' eingesetzt · gilt höchstens bis Wellenende.'); sound.play('build'); } else setMessage('Hier nicht möglich: Gold, Ziel oder bereits aktiven Effekt prüfen.'); renderAll(); return true;
  }
  for (const [id, kind] of [['buySpikes', 'spikes'], ['buyResin', 'resin'], ['buyOverload', 'overload']]) document.getElementById(id).addEventListener('click', () => { consumablePick = kind; state.selectedCard = null; document.getElementById('consumableMenu').open = false; globalThis.HexCompact?.open(''); document.getElementById('towerDrawer').classList.add('hidden'); state.selectedTower = state.selectedBuilding = null; setMessage(kind === 'overload' ? 'Überladung: eigenen angreifenden Turm anklicken. Escape: abbrechen.' : 'Position auf der Straße für ' + HexCombat.consumables[kind].name + ' anklicken. Escape: abbrechen.'); renderAll(); });
  document.getElementById('compactConsumables').addEventListener('click', () => { const menu = document.getElementById('consumableMenu'); globalThis.HexCompact?.open(''); document.getElementById('towerDrawer').classList.add('hidden'); state.selectedTower = state.selectedBuilding = null; menu.open = !menu.open; document.getElementById('compactConsumables').setAttribute('aria-expanded', String(menu.open)); renderAll(); });
  document.getElementById('consumableMenu').addEventListener('toggle', () => document.getElementById('compactConsumables').setAttribute('aria-expanded', String(document.getElementById('consumableMenu').open)));
  document.querySelectorAll('[data-compact]').forEach(button => button.addEventListener('click', () => { document.getElementById('consumableMenu').open = false; }));
  document.getElementById('cancelConsumable').addEventListener('click', () => { consumablePick = null; document.getElementById('consumableMenu').open = false; renderAll(); });
  function renderUI() {
    renderGreed();
    renderDetour();renderVillages();renderExpedition();
    renderDevEnemies();
    const consumableValues=HexCombat.consumableStats(state);
    document.getElementById('spikesStats').textContent='20 × '+consumableValues.spikeDamage+' Schaden';
    document.getElementById('resinStats').textContent=consumableValues.resinCharges+' Gegner · −35 % · '+consumableValues.resinDuration+' s';
    document.getElementById('overloadStats').textContent='+50 % · '+consumableValues.overloadDuration+' s';
    const canConsume = state.hp > 0 && ['place', 'build', 'wave'].includes(state.phase) && !state.consumablesLocked;
    document.getElementById('consumableMenu').classList.toggle('hidden', !canConsume); document.getElementById('compactConsumables').disabled = !canConsume;
    for (const [id, kind] of [['buySpikes', 'spikes'], ['buyResin', 'resin'], ['buyOverload', 'overload']]) { const button=document.getElementById(id), remaining=HexCombat.consumableRemaining(state,kind); button.disabled = !canConsume || remaining===0 || state.gold < HexCombat.consumables[kind].cost; button.title=remaining+' / 3 Einsätze in dieser Welle übrig'; }
    if (!canConsume || consumablePick && HexCombat.consumableRemaining(state,consumablePick)===0) consumablePick = null;
    renderHotkeyTip();
    document.getElementById('rotateHexBtn').classList.toggle('hidden', state.phase !== 'place');
    document.getElementById('rotateHexBtn').disabled = state.phase !== 'place' || !state.hand[state.selectedCard];
    for (const [id,kind] of [['spikesStats','spikes'],['resinStats','resin'],['overloadStats','overload']]) { const label=document.getElementById(id); if(label)label.textContent+=' · '+HexCombat.consumableRemaining(state,kind)+'/3'; }
    document.getElementById('goldDetails')?.classList.toggle('hidden',state.challengeKind==='towerDraft');
    const villageHud=document.getElementById('villageHud');document.getElementById('healthStat').classList.toggle('hidden',state.challengeKind==='villages');villageHud.classList.toggle('hidden',state.challengeKind!=='villages');
    if(state.challengeKind==='villages'){villageHud.replaceChildren();for(const g of state.villages.goals){const box=document.createElement('div'),label=document.createElement('strong'),bar=document.createElement('progress');box.title=g.name;label.textContent=['N','M','S'][g.id]+' ♥ '+g.hp+'/'+g.maxHp;bar.max=g.maxHp;bar.value=g.hp;bar.setAttribute('aria-label',g.name);box.appendChild(label);box.appendChild(bar);villageHud.appendChild(box);}}
    const touchControls = !!globalThis.HexCompact?.touch?.();
    document.getElementById('rotateHexBtn').textContent = touchControls ? 'Drehen' : 'Drehen (R)';
    const tunnelAvailable=!!state.tunnelOffer&&state.phase==='build'&&!state.waveRunning&&state.hp>0;
    document.getElementById('tunnelRescuePanel').classList.toggle('hidden',!tunnelAvailable);
    const tunnelButton = document.getElementById('tunnelRescueBtn'); tunnelButton.classList.toggle('hidden',!tunnelAvailable); tunnelButton.textContent = state.tunnelConfirmed ? 'Tunnel kostenlos bauen' : 'Rettungstunnel ansehen';
    document.getElementById('tunnelRescueText').textContent=state.tunnelConfirmed?'Kostenlos eine neue Front öffnen. Bestehende Hexe und Gebäude bleiben erhalten.':'Keine passende Straße? Öffne kostenlos eine neue Front.';
    renderQuickControls(); renderIntroductionNotice();
    uxFeedback();
    renderBasePanel(); renderTutorial();
    const bossWave = !!HexWaves.bossProfile(state.waveRunning ? state.wave : state.wave + 1), phaseKind = state.waveRunning ? (bossWave ? 'boss' : 'wave') : 'build';
    document.getElementById('waveDropdown').dataset.phase = phaseKind; document.getElementById('phaseName').textContent = state.phase === 'gameover' ? 'Niederlage' : state.phase === 'victory' ? 'Sieg' : phaseKind === 'boss' ? 'Bosswelle' : phaseKind === 'wave' ? 'Welle läuft' : 'Bauphase';
    hpEl.textContent = `${state.hp}/${state.maxHp}`; goldEl.textContent = state.gold; waveEl.textContent = state.waveRunning || ['victory', 'gameover'].includes(state.phase) ? state.wave : state.wave + 1; deckCountEl.textContent = state.deck.length;
    updateArsenalHint();
    document.getElementById('upgradeStatus').checked = !!state.showUpgradeStatus;
    document.getElementById('profileDiamonds').textContent = profile.diamonds;
    document.getElementById('runDiamonds').textContent = `(+${state.metaSettled ? 0 : state.challengeDay ? (state.challengeWon && !profile.dailyResults?.[state.challengeDay]?.won ? 10 : 0) : HexProfile.runReward(profile, { wave: state.wave, ...state.earnedMeta }).total})`;
    document.getElementById('profileStats').textContent = `${profile.records.runsPlayed} Runs · Bestmarke Wave ${profile.records.highestWave} · ${profile.records.bossesKilled} Bosse besiegt · ${profile.lifetime.normalKills} normale Gegner besiegt.`;
    document.getElementById('bonusIncome').textContent = `(+${state.income})`;
    renderBuildingPanel();
    handEl.classList.toggle('openingHand', state.hand.length > 3); handEl.classList.toggle('singleCard', state.hand.length === 1);
    document.getElementById('towerHotkeyHint').textContent = `1–${Math.min(9, state.towerLoadout.filter(id => TOWERS[id]).length)}: Turm im geöffneten Baumenü auswählen`; document.getElementById('handHint').textContent = state.challengeKind === 'movingFortress' ? 'Wandernde Festung · Station '+(state.movingFortress.stage+1)+'/4' : state.challengeKind === 'towerDraft' ? 'Turm-Draft · Türme platzieren · '+state.challengeTarget+' Wellen' : state.challengeKind === 'expedition' ? 'Expedition · '+state.expedition.collected.length+'/3 Relikte · '+state.expedition.remaining+' Platzierungen' : state.challengeKind === 'powerGrid' ? 'Stromnetz · Versorgung prüfen · Zwölf Wellen' : state.challengeKind === 'villages' ? 'Drei Dörfer · Feste Karte · Verteidigung vorbereiten' : state.challengeKind === 'detour' ? 'Straßenbudget: ' + state.detour.remaining + ' · Feste Türme · 15 Angriffe' : state.challengeKind === 'garrison' ? 'Feste Karte · Budget einteilen · drei Angriffe abwehren' : state.openingRemaining ? `Noch ${state.openingRemaining} Base-Ausgang erweitern · ${touchControls ? 'Karte antippen · Knopf zum Drehen' : `Karten 1–${state.hand.length} · R dreht`}` : touchControls ? 'Karte wählen · Knopf zum Drehen · Hex antippen' : `Karte wählen (1–${Math.max(3,state.hand.length)}) · Drehen: Knopf oder R · Hex antippen`;
    document.getElementById('phaseLabel').textContent = { place: 'Hex platzieren', build: 'Bauphase', wave: 'Wave läuft', duoWait: 'Warte auf Partner', duoDelivery: 'Partner-Geschenk', reward: 'Kartenbelohnung', removal: 'Deck ausdünnen (optional)', shrineReward: 'Shrine-Belohnung', bossReward: 'Boss-Beute', gameover: 'Run beendet' }[state.phase];
    const handKey = JSON.stringify([state.hand, state.selectedCard, state.rotation, state.rescueCard, state.detour?.stock, uiLanguageRevision]);
    if (handKey !== handRenderKey) {
      handRenderKey = handKey; handEl.innerHTML = '';
      state.hand.forEach((id, i) => { const el = cardElement(id, true, i === state.selectedCard ? state.rotation : 0); el.title = cardTip(id); el.setAttribute?.("data-key", i + 1); if (i === state.selectedCard) el.classList.add('selected'); el.addEventListener('click', () => { state.selectedCard = i; state.rotation = 0; renderAll(); }); handEl.appendChild(el); });
    }
    // Keep purchase buttons stable during animation so pointer clicks/focus survive.
    const buildDiscounts = selections('Slot').map(slot => HexBuildings.effects(state.map, slot).discount);
    const buildPrices = new Map(state.towerLoadout.filter(id => TOWERS[id]).map(id => [id, buildDiscounts.length ? buildDiscounts.reduce((sum, discount, index) => sum + ((state.freeTowerBuilds||0)>index?0:Math.ceil(TOWERS[id].cost * discount)), 0) : state.freeTowerBuilds>0?0:TOWERS[id].cost]));
    if(state.challengeKind==='towerDraft')for(const id of state.towerLoadout)buildPrices.set(id,0);
    const menuKey = JSON.stringify([state.towerDraft?.inventory,state.towerLoadout, selections('Slot'), state.buildingVersion, state.freeTowerBuilds]);
    if (menuKey !== towerMenuKey) {
      towerMenuKey = menuKey; towerMenu.innerHTML = ''; towerButtons.clear();
      state.towerLoadout.map(id => [id, TOWERS[id]]).filter(([, tower]) => tower).forEach(([id, t]) => {
        const selectedTile = state.selectedSlot ? state.map.get(key(state.selectedSlot.q, state.selectedSlot.r)) : null;
        const effective = HexData.towerDefinition({ type: id, biome: selectedTile ? HexBiomes.forTile(state, selectedTile) : 'grass', rangeFactor: state.challengeDay && (!state.challengeKind || state.challengeKind === 'caravan') ? .85 : 1, tileType: selectedTile?.type, supportRange: HexBuildings.rangeBonus(state.map, state.selectedSlot), supportDamage: HexBuildings.effects(state.map, selectedTile).damage });
        const price = buildPrices.get(id);
        const b = document.createElement('button'); b.className = 'towerBtn'; b.title = t.desc + '\n' + towerStats(effective) + (selections('Slot').length > 1 ? '\nGesamtpreis für alle markierten Plätze inklusive lokaler Rabatte. Werte zeigen den zuletzt gewählten Platz.' : '');
        // Zeile wie die Upgrade-Karten im Turmfenster: Symbol/Porträt, Name mit Typ, Kurzwerte, Stärke, Preis mit Taste.
        const kind = HexTowerView.kind(effective);
        b.innerHTML = `<span class="towerBuildIcon" aria-hidden="true">${HexArsenal.icon(id, t.color)}</span><span class="towerOffer"><span class="towerOfferTitle"><strong class="towerOfferName">${t.name}</strong><span class="towerUpgradeTag" data-kind="${kind.id}">${kind.label}</span></span><small class="towerOfferStats">${HexTowerView.upgradeStats(effective)}</small><small class="towerOfferDescription">${towerBuildRole(id)}</small></span><strong class="towerOfferPrice"><span class="towerPriceTag"><span class="towerPriceValue">${state.challengeKind==='towerDraft'?(state.towerDraft.inventory[id]||0)+' ×':price}</span>${state.challengeKind==='towerDraft'?'<span class="sr-only"> im Inventar</span>':'<span class="hxi hxi-coin" aria-hidden="true"></span><span class="sr-only"> Gold</span>'}</span>${selections('Slot').length > 1 ? '<small>' + selections('Slot').length + ' × Türme</small>' : ''}<kbd>${towerMenu.children.length + 1}</kbd></strong>`;
        b.disabled = !['place', 'build', 'wave'].includes(state.phase) || !state.selectedSlot || state.gold < price || state.hp <= 0;
        b.addEventListener('pointerenter', () => { state.previewTower = id; renderBoard(); });
        b.addEventListener('pointerleave', () => { state.previewTower = null; renderBoard(); });
        b.addEventListener('focus', () => { state.previewTower = id; renderBoard(); });
        b.addEventListener('blur', () => { state.previewTower = null; renderBoard(); });
        b.addEventListener('click', () => buyTower(id)); towerMenu.appendChild(b); towerButtons.set(id, b);
        syncTowerPortrait(b.querySelector?.('.towerBuildIcon'), ['tower_' + id]);
      });
    }
    for (const [id, b] of towerButtons) b.classList.toggle('unaffordable', state.gold < buildPrices.get(id));
    for (const [id, b] of towerButtons) b.disabled = !['place', 'build', 'wave'].includes(state.phase) || !state.selectedSlot || state.gold < buildPrices.get(id) || state.hp <= 0;
    if(state.challengeKind==='towerDraft')for(const [id,b]of towerButtons)b.disabled=!state.selectedSlot||!HexTowerDraft.canBuild(state,id,selections('Slot').length);
    renderForecast();
    const info = document.getElementById('selectedTowerInfo'), sell = document.getElementById('sellTowerBtn');
    const selected = state.selectedTower, tower = selected ? state.map.get(key(selected.q, selected.r))?.towers[selected.index] : null;
    info.innerHTML = tower ? HexTowerView.headline(towerPanelDefinition(tower)) : '';
    renderTowerPanel();
    const refund = HexData.towerRefund(state, tower); sell.disabled = !refund || selections('Tower').length > 1;
    sell.textContent = selections('Tower').length > 1 ? 'Zum Verkaufen einen einzelnen Turm wählen' : refund ? `${refund.percent === 100 ? 'Bau rückgängig' : 'Verkaufen'} · ${refund.percent} % (+${refund.amount} Gold)` : 'Turm verkaufen';
    const redrawBtn=document.getElementById('redrawHandBtn');redrawBtn.classList.toggle('hidden',!state.augments?.includes('wayfinder'));redrawBtn.disabled=!HexRewards.canRedraw(state)||!!state.consumablesLocked;
    const merchantBtn=document.getElementById('merchantOpenBtn');merchantBtn.classList.toggle('hidden',!merchantSite());merchantBtn.disabled=!['place','build'].includes(state.phase)||!!state.consumablesLocked;
    if(!document.getElementById('merchantOverlay').classList.contains('hidden')){if(!['place','build'].includes(state.phase)||!hasActiveRun||!mainMenu.classList.contains('hidden'))closeMerchant();else renderMerchant();}
    const extraHexButton = document.getElementById('buyExtraHexBtn');
    extraHexButton.classList.toggle('hidden', state.wave < 34 || !!state.challengeDay || state.waveRunning || !['place','build'].includes(state.phase));
    extraHexButton.disabled = !HexRunSession.canBuyExtraHex(state) || !!state.consumablesLocked;
    extraHexButton.textContent = state.extraHexWave === state.wave ? 'Zusatzhex gekauft' : 'Zusatzhex kaufen · ' + HexRunSession.extraHexPrice(state) + ' Gold';
    extraHexButton.title = 'Ein zusätzliches Hex je Bauphase ab Welle 35. Jeder Kauf erhöht den Preis um 100 Gold.';
    startWaveBtn.disabled = (state.phase !== 'build' && !(state.challengeKind==='detour'&&HexDetour.ready(state))) || state.waveRunning || state.hp <= 0 || state.challengeKind==='greed'&&state.greedContract?.wave!==state.wave+1; startWaveBtn.dataset.state = state.waveRunning ? 'running' : startWaveBtn.disabled ? 'locked' : 'ready';
    startWaveBtn.title = state.phase === 'place' ? 'Lege zuerst dein Hex, bevor du die nächste Welle startest.' : '';
    startWaveBtn.textContent = state.phase === 'place' && state.challengeKind!=='detour' ? 'Zuerst Hex legen' : (!state.waveRunning && (['detour','villages','powerGrid'].includes(state.challengeKind)?uiWavePlan(state.wave + 1).boss:HexWaves.bossProfile(state.wave + 1)) ? `Bosswelle ${state.wave + 1} starten` : 'Wave starten') + (touchControls ? '' : ' (Leertaste)');
    renderPowerGrid();renderDraft();renderChallengeGuide();
    if(state.challengeKind==='movingFortress'&&!HexMovingFortress.building(state))for(const b of towerButtons.values())b.disabled=true;
    if (document.getElementById('deckDropdown').open) renderDeckOverview(); renderSaleState(); layoutMenus(); duoBridge?.render();
  }
  function bindUpgradePreview(button, tower, next) {
    const show = () => { state.previewUpgrade = { tower, definition: next }; renderBoard(); };
    const clear = () => { state.previewUpgrade = towerComparison ? towerComparedPreview : null; renderBoard(); };
    button.addEventListener('pointerenter', show); button.addEventListener('pointerleave', clear); button.addEventListener('focus', show); button.addEventListener('blur', clear);
  }
  function renderDeckOverview(target = 'deckOverview') {
    const deckKey = JSON.stringify([state.deck, state.drawPile, state.discard, uiLanguageRevision]);
    if (deckRenderKeys.get(target) === deckKey) return;
    deckRenderKeys.set(target, deckKey);
    const content = document.getElementById(target); content.innerHTML = '';
    for (const [name, ids] of [['Gesamtes Deck', state.deck], ['Nachziehstapel', state.drawPile], ['Ablagestapel', state.discard]]) {
      const section = document.createElement('section'), heading = document.createElement('h3');
      heading.textContent = `${name} (${ids.length})`; section.appendChild(heading);
      const counts = new Map(); ids.forEach(id => counts.set(id, (counts.get(id) || 0) + 1));
      const list = document.createElement('ul');
      if (!ids.length) { const item = document.createElement('li'); item.textContent = 'Leer'; list.appendChild(item); }
      list.className = 'deckHexGrid';
      const entries = name === 'Nachziehstapel' ? [...ids].reverse().map(id => [id, 1]) : counts;
      for (const [id, count] of entries) {
        const item = document.createElement('li'), badge = document.createElement('span'), card = CARD_LIBRARY[id];
        item.className = 'deckHexCard'; item.setAttribute('tabindex', '0'); item.setAttribute('aria-label', count + ' × ' + card.name + ' · ' + card.rarity + ': ' + card.desc); item.title = card.name + ' · ' + card.rarity + ' · ' + card.desc; item.innerHTML = miniPathSvg(card) + '<small>' + card.name + '</small>';
        badge.className = 'deckHexCount'; badge.textContent = '×' + count; badge.style.backgroundColor = ({ Common: '#939d9e', Uncommon: '#45a77a', Rare: '#639cdb', Epic: '#b181dc', Legendary: '#e4bc57' })[card.rarity]; item.style.borderColor = badge.style.backgroundColor;
        item.appendChild(badge); list.appendChild(item);
      }
      section.appendChild(list); content.appendChild(section);
    }
  }
  function renderForecast() {
    const alive = state.enemies.filter(e => e.alive && HexCombat.durability(e) > 0);
    const aliveGold = alive.reduce((sum, e) => sum + (e.killGold ?? HexWaves.economy.kill), 0);
    const readyBossCount = [...state.landmarks.values()].filter(item => item.status === 'ready').length;
    const forecastKey = JSON.stringify([state.wave, state.income, !!state.challengeDay, state.heroId, state.gold, state.goldEarned, state.waveRunning, state.pendingSpawns, state.waveKills, alive.length, aliveGold, alive.filter(e => e.type === 'boss').length, readyBossCount, state.selectedSlot || state.selectedTower || state.selectedBuilding, state.towerLoadout, state.buildingVersion, uiLanguageRevision]);
    if (forecastKey === forecastRenderKey) return;
    forecastRenderKey = forecastKey;
    const fullPlan = document.getElementById('garrisonForecast'); fullPlan.classList.toggle('hidden', state.challengeKind !== 'garrison');
    if (state.challengeKind === 'garrison') fullPlan.innerHTML = [1, 2, 3].map(w => { const p = uiWavePlan(w), groups = new Map(); for (const e of p.enemies) { const entry = groups.get(e.type) || { e, n: 0 }; entry.n++; groups.set(e.type, entry); } return '<details><summary>Angriff ' + w + ' · ' + p.count + ' Gegner</summary><ul>' + [...groups.values()].map(({ e, n }) => '<li>' + n + ' × ' + e.name + ' · ' + e.hp + ' LP' + (e.armorHp ? ' + ' + e.armorHp + ' Rüstung' : '') + (e.magicHp ? ' + ' + e.magicHp + ' Magieresistenz' : '') + '</li>').join('') + '</ul></details>'; }).join('');
    const plan = uiWavePlan(state.waveRunning ? state.wave : state.wave + 1);
    const boss = HexExploration.bossProfile(plan.wave), bossGold = readyBossCount * boss.killGold;
    const groups = new Map();
    plan.enemies.forEach(enemy => { const entry = groups.get(enemy.type) || { count: 0, profile: enemy }; entry.count++; groups.set(enemy.type, entry); });
    const defenses = p => `${p.hp} Leben${p.armorHp ? ` + ${p.armorHp} Rüstung` : ''}${p.magicHp ? ` + ${p.magicHp} Magieresistenz` : ''}`;
    document.getElementById('waveForecast').textContent = 'Wave ' + plan.wave + ': ' + plan.count + ' Gegner. ' + [...groups.values()].map(({ count, profile }) => count + ' × ' + profile.name + ' (' + defenses(profile) + (profile.description ? ', ' + profile.description : profile.type === 'swarm' ? ', schnell' : '') + ')').join(' · ') + '. Gelb = Leben, Orange = Rüstung, Blau = Magieresistenz.';
    if (state.challengeDay && state.challengeKind === 'caravan') document.getElementById('waveForecast').textContent += ' · Geldtransport: Besiegen bringt 15 Gold extra. Erreicht er die Basis, verlierst du 10 Gold.';
    if (readyBossCount) document.getElementById('waveForecast').textContent += ` Zusätzlich ${readyBossCount} Wächter: je ${defenses(boss)}, ${boss.baseDamage} Basisschaden, +${boss.killGold} Gold plus Kartenbeute (90 % Epic, 10 % Legendary).`;
    if (plan.boss) document.getElementById('waveForecast').textContent += ` Bosswelle: ${plan.boss.name} mit ${defenses(plan.boss)} und ${plan.boss.baseDamage} Basisschaden an einem zufälligen Eingang. ${plan.boss.description} +${plan.boss.killGold} Gold und Kartenbeute bei Sieg.`;
    document.getElementById('goldForecast').textContent = `Maximal +${plan.maxGold + bossGold} Gold: ${plan.count} Kills inklusive Karawanenboni = ${plan.killGold}, Bossloot +${bossGold + (plan.boss?.killGold || 0)}, Wave-Abschluss +${plan.completionGold}, Hex-Bonus +${plan.income}. Nur wenn alle Gegner besiegt werden und die Wave überlebt wird. Mit aktuellem Gold: maximal ${state.gold + plan.maxGold + bossGold} vor Bauausgaben und weiteren Einnahmen der laufenden Wave.`;
    const earned = state.goldEarned;
    document.getElementById('goldSources').textContent = `Startgold ${HexHeroes.hero(state.heroId).gold} · Hero-Einkommen +${HexHeroes.hero(state.heroId).income} · regulärer Gegner +${HexWaves.economy.kill} (Splittergolem: auf drei Einheiten verteilt) · pro überlebter Wave +${HexWaves.economy.completion} · Dorf +2, Handelsstraße +4, Haus zusätzlich +3 pro Wave. Im Run verdient: Kills ${earned.kills}, Abschlüsse ${earned.completion}, Hex-/Haus-/Hero-/Beuteboni ${earned.income}, Shrines ${earned.shrine || 0}, Schätze ${earned.treasure || 0}, Bosse ${earned.boss || 0}. Undo erstattet nur den Kaufpreis, erzeugt kein Einkommen.`;
    const remainingGold = state.challengeKind === 'garrison' ? 0 : uiWavePlan(state.wave).enemies.slice(-state.pendingSpawns || Infinity).reduce((sum, e) => sum + (e.killGold ?? HexWaves.economy.kill), 0) + aliveGold + HexWaves.economy.completion + state.income;
    document.getElementById('liveWaveInfo').textContent = state.waveRunning ? `Laufende Wave ${state.wave}: ${state.pendingSpawns} Gegner kommen noch, ${alive.length} sind auf der Map (davon ${alive.filter(e => e.type === 'boss').length} Wächter), ${state.waveKills} normale Gegner besiegt. Noch maximal +${remainingGold} Gold bis Wave-Ende.` : 'Vor dem Platzieren des Hexes ist der Einkommensbonus vorläufig; danach wird er aktualisiert.';
    if(state.challengeKind==='towerDraft'){document.getElementById('goldSources').textContent='Gold kann im Turm-Draft nicht ausgegeben werden. Verwende dein Inventar und Upgrade-Tickets.';}
    if (state.challengeKind === 'garrison') document.getElementById('goldSources').textContent = '1.200 Startgold für die gesamte Mission. Keine Einnahmen und keine Verkäufe. Restbudget: ' + state.gold + ' Gold.';
    if (state.challengeKind === 'garrison') { document.getElementById('goldForecast').textContent = 'Keine Goldeinnahmen in dieser Mission.'; if (!state.waveRunning) document.getElementById('liveWaveInfo').textContent = 'Feste Karte. Alle drei Angriffe sind vorab planbar; Restgold bleibt zwischen den Wellen erhalten.'; }
    const budgetSlot = state.selectedSlot || state.selectedTower || state.selectedBuilding;
    document.getElementById('towerBudget').textContent = (budgetSlot ? 'Preise am ausgewählten Hex: ' : 'Loadoutpreise: ') + state.towerLoadout.map(id => TOWERS[id]).filter(Boolean).map(t => { const price = HexTowerCommands.buildPrice(state, budgetSlot, t.cost); return t.name + ': ' + price + ' Gold' + (state.gold < price ? ' (noch ' + (price - state.gold) + ' nötig)' : ' (bezahlbar)'); }).join(' · ');

  }
  function renderAll() { renderBoard(); renderUI(); }
  const buildingPosition = HexMap.buildingPosition;
  function towerStatsMarkup(def) {
    // Werte-Icons aus assets/uidesign (icons/ bzw. towers/); Farbe über data-stat in hexwerk.css.
    const chip = (icon, value, label) => '<span class="statChip" data-stat="' + icon + '" title="' + label + '" aria-label="' + label + ': ' + value + '"><span class="hxi hxi-' + icon + '" aria-hidden="true"></span> ' + value + '</span>';
    const m = def.damageMultipliers || { hp: 1, armor: 1, magic: 1 }; let parts = [];
    if (def.aura) parts.push(chip('tower_freeze', Math.round((1 - def.slow) * 100) + '%', 'Verlangsamung'));
    else parts.push(chip('vsHealth', Math.round(def.damage * m.hp), 'Schaden gegen Leben'), chip('vsArmor', Math.round(def.damage * m.armor), 'Schaden gegen Rüstung'), chip('vsMagic', Math.round(def.damage * m.magic), 'Schaden gegen Magieresistenz'));
    parts.push(chip('range', def.range, 'Reichweite')); if (!def.aura) parts.push(chip('cooldown', def.cooldown.toFixed(2) + ' s', def.mine ? 'Zeit zwischen Minen' : 'Zeit zwischen Angriffen (kleiner ist schneller)'));
    if (def.splash) parts.push(chip('area', def.splash, 'Explosionsradius')); if (def.chain) parts.push(chip('tower_chain', def.chain + ' / ' + def.jumpRange, 'Blitzziele / Sprungweite')); if (def.pierce) parts.push(chip('single', def.pierceTargets, 'Durchschlagziele'));
    if (def.hitSlow) parts.push(chip('tower_freeze', Math.round((1 - def.hitSlow) * 100) + '% / ' + def.slowDuration + ' s', 'Verlangsamung / Dauer'));
    if (def.soulLimit) parts.push(chip('tower_necromancer', def.soulLimit, 'Maximale Geister'), chip('damage', Math.round(def.soulDamage) + '/s', 'Geisterschaden'), chip('cooldown', def.soulDuration + ' s', 'Geisterlebensdauer'));
    return '<span class="statChips">' + parts.join('') + '</span>';
  }
  function towerStats(def) {
    if (def.aura) return `Slow ${Math.round((1 - def.slow) * 100)} % · Radius ${def.range} · kein Schaden`;
    const m = def.damageMultipliers || { hp: 1, armor: 1, magic: 1 }, values = `Schaden gegen: ${Math.round(def.damage * m.hp)} Leben / ${Math.round(def.damage * m.armor)} Rüstung / ${Math.round(def.damage * m.magic)} Magieresistenz`;
    return `${values} · ${def.mine ? 'legt alle ' + def.cooldown.toFixed(2) + ' s eine stapelbare Mine' : def.cooldown.toFixed(2) + ' s je Angriff'} · Reichweite ${def.range}${def.soulLimit ? ` · bis zu ${def.soulLimit} Geister: ${Math.round(def.soulDamage)} Schaden/s, ${def.soulDuration} s` : ''}${def.hitSlow ? ` · ${Math.round((1 - def.hitSlow) * 100)} % Slow für ${def.slowDuration} s` : ''}${def.splash ? ` · Explosion ${def.splash}` : ''}${def.chain ? ` · ${def.chain} Ziele · Sprungdistanz ${def.jumpRange}` : ''}`;
  }
  function finishTutorial() { tutorial.active = false; tutorialSeen = true; try { gameStorage.setItem('tutorial-v1', 'done'); } catch { } }
  function tutorialEvent(event, type) { if (HexTutorial.advance(tutorial, event, type)) finishTutorial(); }
  function renderTutorial() {
    const consuming = !!consumablePick;
    messageEl.classList.toggle('consumableActive', consuming);
    if (consuming) document.getElementById('messageText').textContent = (consumablePick === 'overload' ? 'Überladung: eigenen angreifenden Turm anklicken.' : 'Position auf der Straße für ' + HexCombat.consumables[consumablePick].name + ' anklicken.') + ' Escape / Rechtsklick: abbrechen.';
    const active = !consuming && tutorial.active && !['gameover', 'victory'].includes(state.phase);
    messageEl.classList.toggle('tutorialActive', active); document.getElementById('messageText').classList.toggle('hidden', active);
    document.getElementById('tutorialPanel').classList.toggle('hidden', !active);
    document.getElementById('tutorialTitle').textContent = 'Erste Schritte · ' + (tutorial.step + 1) + '/' + HexTutorial.steps.length;
    document.getElementById('tutorialText').textContent = state.openingRemaining ? 'Erweitere beide Base-Ausgänge: Wähle eine Handkarte, drehe sie mit R oder Mausrad-Klick und lege sie direkt an einen noch freien Ausgang.' : HexTutorial.message(tutorial);
    if (globalThis.HexCompact?.touch?.()) document.getElementById('tutorialText').textContent = document.getElementById('tutorialText').textContent.replace(/mit R oder Mausrad-Klick/g, 'mit dem Drehen-Knopf').replace('mit der Leertaste oder mit dem', 'mit dem');
    document.getElementById('tutorialNextBtn').classList.toggle('hidden', !active || !(tutorial.step === 5 || tutorial.step === 4 && tutorial.alternativeTower));
    if (!active) document.getElementById('tutorialFeedback').classList.add('hidden');
    positionTutorialSpotlight();
  }
  function positionTutorialSpotlight() {
    renderTutorialTargets();
    const focus = tutorial.active && !['gameover', 'victory'].includes(state.phase) ? ({ 5: 'healthStat', 6: 'startWaveBtn' })[tutorial.step] : null;
    const spotlight = document.getElementById('tutorialSpotlight'), target = focus && document.getElementById(focus), box = target?.getBoundingClientRect?.();
    spotlight.classList.toggle('hidden', !box); if (!box) return;
    Object.assign(spotlight.style, { left: (box.left - 4) + 'px', top: (box.top - 4) + 'px', width: (box.width + 8) + 'px', height: (box.height + 8) + 'px' });
  }
  function renderTutorialTargets() {
    const layer = document.getElementById('tutorialTargets'), active = tutorial.active && !['gameover', 'victory'].includes(state.phase);
    for (const [id, button] of towerButtons) button.classList.toggle('tutorialChoice', active && tutorial.step === 3 && id === 'archer');
    const selected = state.selectedTower, selectedTower = selected && state.map.get(key(selected.q, selected.r))?.towers[selected.index];
    for (const [id, button] of upgradeButtons) button.classList.toggle('tutorialChoice', active && tutorial.step === 4 && selectedTower?.type === 'archer' && id === 'volley');
    layer.classList.toggle('hidden', !active || tutorial.step >= 5); if (!active) return;
    if (tutorial.step === 5 && globalThis.HexCompact?.small() && document.documentElement.dataset.compact !== 'stats') globalThis.HexCompact.open('stats');
    if (tutorial.step >= 5 || !document.querySelector) return;
    const boxes = [], circles = [], polygons = [], board = document.querySelector('.boardWrap')?.getBoundingClientRect();
    const addBox = selector => { const b = document.querySelector(selector)?.getBoundingClientRect(); if (b?.width && b.height) boxes.push(b); };
    const point = (position, r = 25) => { const p = renderer.project(position, 2); if (p && board) circles.push({ x: p.x + board.left, y: p.y + board.top, r }); };
    if (tutorial.step === 0) addBox('.handDock');
    if (tutorial.step === 1) { const card = HexPlacementCommands.card(state, state.hand[state.selectedCard]); if (card && board) for (const p of placementTargets(card)) if (canPlace(p.q, p.r, card, state.rotation)) { const c = axialToWorld(p.q, p.r), corners = HexMap.hexPoints(c.x, c.y, HEX - 2).split(' ').map(pair => { const [x, y] = pair.split(',').map(Number); return renderer.project({ x, y }, 2); }); if (corners.every(Boolean)) polygons.push(corners.map(p => (p.x + board.left) + ',' + (p.y + board.top)).join(' ')); } if (!polygons.length) addBox('.handDock'); }
    if (tutorial.step === 2) for (const t of state.map.values()) slotPositions(t).forEach((p, i) => { if (!t.towers[i]) point(p); });
    if (tutorial.step === 3) { addBox('#towerDrawer:not(.hidden)'); addBox('[data-drawer="towerDrawer"]'); }
    if (tutorial.step === 4) { addBox('#towerPanel:not(.hidden)'); for (const t of state.map.values()) slotPositions(t).forEach((p, i) => { if (!t.towers[i] || !board) return; const bounds = renderer.towerBounds?.({ q: t.q, r: t.r, index: i }); if (bounds) boxes.push({ left: bounds.left + board.left, top: bounds.top + board.top, width: bounds.width, height: bounds.height }); else { const base = renderer.project(p, 0), top = renderer.project(p, 65); if (base && top) boxes.push({ left: Math.min(base.x, top.x) + board.left - 24, top: Math.min(base.y, top.y) + board.top - 24, width: Math.abs(base.x - top.x) + 48, height: Math.abs(base.y - top.y) + 48 }); } }); }
    const shapes = [...boxes.map(b => '<rect x="' + (b.left - 4) + '" y="' + (b.top - 4) + '" width="' + (b.width + 8) + '" height="' + (b.height + 8) + '" rx="10"/>'), ...circles.map(c => '<circle cx="' + c.x + '" cy="' + c.y + '" r="' + c.r + '"/>'), ...polygons.map(points => '<polygon points="' + points + '"/>')].join('');
    layer.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"><defs><mask id="tutorialFocusMask"><rect width="100%" height="100%" fill="white"/><g fill="black">' + shapes + '</g></mask></defs><rect width="100%" height="100%" fill="#0c1411" opacity=".42" mask="url(#tutorialFocusMask)"/><g fill="none" stroke="#ffe198" stroke-width="3">' + shapes + '</g></svg>';
  }
  function menuArea(includeTutorial = true) {
    if (!document.querySelectorAll || !document.documentElement) return null;
    const width = document.documentElement.clientWidth, height = document.documentElement.clientHeight;
    const compact = width <= 1100 || height <= 600;
    const controls = [...document.querySelectorAll('.compactToolbar,.dockTL,.hud,.dockBR,.dockBL,.mapControls,.handDock,.duoQuickMap' + (compact ? ',#quickLoadout,#biomeRail' : ''))].map(el => el.getBoundingClientRect());
    const area = height < 560 ? HexUiLayout.freeArea(width, height, controls) : HexUiLayout.safeArea(width, height, controls);
    const leftRail = document.getElementById('quickLoadout').getBoundingClientRect(), rightRail = document.getElementById('biomeRail').getBoundingClientRect();
    if (!compact && leftRail.width) area.left = Math.max(area.left, leftRail.right + 10); if (!compact && rightRail.width) area.right = Math.min(area.right, rightRail.left - 10);
    if (includeTutorial && tutorial.active && state.phase !== 'gameover') { const hint = messageEl.getBoundingClientRect(); area.top = Math.min(area.bottom, Math.max(area.top, hint.bottom + 12)); }
    return area;
  }
  // Wirksamer CSS-Zoom (hexwerk.css skaliert Fenster am Desktop mit --hx-k). Positionen und Größen in Bildschirmpixeln
  // werden durch ihn geteilt, weil der Browser Längen eines gezoomten Elements selbst noch einmal mit dem Zoom multipliziert.
  function cssZoom(el) {
    if (typeof el?.currentCSSZoom === 'number') return el.currentCSSZoom || 1;
    let zoom = 1; try { for (let node = el; node && node.nodeType === 1; node = node.parentElement) { const value = parseFloat(getComputedStyle(node).zoom); if (value > 0) zoom *= value; } } catch { }
    return zoom || 1;
  }
  function fitMenu(panel, area, x, y) {
    const zoom = cssZoom(panel);
    panel.style.position = 'fixed'; panel.style.right = 'auto'; panel.style.bottom = 'auto';
    panel.style.maxHeight = Math.max(0, area.bottom - area.top) / zoom + 'px'; panel.style.maxWidth = Math.max(0, area.right - area.left) / zoom + 'px';
    const box = panel.getBoundingClientRect(), fit = HexUiLayout.fit(area, box.width, box.height, x ?? box.left, y ?? area.top);
    panel.style.left = fit.x / zoom + 'px'; panel.style.top = fit.y / zoom + 'px';
  }
  function measureChrome() {
    if (!document.documentElement?.style?.setProperty || !document.querySelector) return;
    const rect = selector => document.querySelector(selector)?.getBoundingClientRect(), header = rect('.gameHeader'), footer = rect('.dockBR'), hand = rect('.handDock'); if (!header || !footer) return;
    const root = document.documentElement, compact = root.clientWidth <= 1000, tools = compact ? Math.max(header.bottom, rect('.dockBL')?.bottom || 0, rect('.mapControls')?.bottom || 0) : header.bottom;
    for (const [name, value] of Object.entries({ '--header-bottom': header.bottom, '--footer-height': footer.height, '--play-top': tools, '--play-bottom': Math.max(root.clientHeight - footer.top, hand ? root.clientHeight - hand.top : 0) })) { const next = Math.ceil(value) + 'px'; if (root.style.getPropertyValue(name) !== next) root.style.setProperty(name, next); }
  }
  function layoutMenus() {
    for (const slots of document.querySelectorAll('.card .slots')) {
      slots.classList.remove('compactSlots');
      if (slots.clientWidth > 0 && slots.scrollWidth > slots.clientWidth) slots.classList.add('compactSlots');
    }
    measureChrome(); positionTutorialSpotlight(); const raw = menuArea(false); if (!raw) return;
    messageEl.style.position = 'fixed'; messageEl.style.left = ((raw.left + raw.right) / 2) + 'px'; messageEl.style.top = raw.top + 'px'; messageEl.style.bottom = 'auto'; messageEl.style.maxHeight = (tutorial.active ? Math.max(120, Math.min(280, document.documentElement.clientHeight - 180)) : Math.max(0, Math.min(240, (raw.bottom - raw.top) * .65))) + 'px'; if (document.documentElement.style?.setProperty) document.documentElement.style.setProperty('--tutorial-bottom', messageEl.getBoundingClientRect().bottom + 'px');
    // Das Einstellungsfenster ist ein mittiges Hexwerk-Fenster und behält seine eigene Größe (hexwerk.css).
    const area = menuArea(); for (const panel of document.querySelectorAll('.towerPanel:not(.hidden),.drawer:not(.hidden):not(.settingsWindow)')) {
      let bounds=area;
      if(document.documentElement.clientWidth>700){
        const viewWidth=document.documentElement.clientWidth,zoom=cssZoom(panel),columnWidth=(panel.classList.contains('buildDrawer')?Math.min(540,Math.max(440,viewWidth*.3)):440)*zoom;// Turm bauen wie in hexwerk.css: clamp(440px,30vw,540px), mal Zoom
        const left=viewWidth>1100?area.left:12,right=Math.min(viewWidth-12,left+columnWidth),height=document.documentElement.clientHeight;
        const obstacles=[...document.querySelectorAll('.compactToolbar,.dockTL,.hud,.dockBR,.dockBL,.mapControls,.handDock,.duoQuickMap')].map(el=>el.getBoundingClientRect()).filter(r=>r.right>left&&r.left<right);
        bounds=HexUiLayout.columnArea(document.documentElement.clientWidth,height,obstacles,left,right-left);
        if(tutorial.active)bounds.top=Math.max(bounds.top,area.top);
        panel.style.height=Math.max(0,bounds.bottom-bounds.top)/zoom+'px';
      }else panel.style.height='';
      fitMenu(panel,bounds);
    }
    if (state.selectedTower || state.selectedBuilding) positionTowerPanel();
    for (const panel of document.querySelectorAll('.statDetails[open]>.statPopup')) { const anchor = panel.parentElement.getBoundingClientRect(), viewWidth = document.documentElement.clientWidth, height = document.documentElement.clientHeight, width = panel.offsetWidth || 380, left = Math.max(12, panel.parentElement.id === 'waveDropdown' ? (anchor.left + anchor.right - width) / 2 : anchor.right - width), right = Math.min(viewWidth - 12, left + width); const obstacles = [...document.querySelectorAll('.compactToolbar,.dockTL,.hud,.dockBR,.dockBL,.mapControls,.handDock,.duoTurn')].map(el => el.getBoundingClientRect()).filter(r => r.right > left && r.left < right); const bounds = HexUiLayout.safeArea(viewWidth, height, obstacles); fitMenu(panel, bounds, left, anchor.bottom + 12); }
  }
  function positionTowerPanel() {
    if (!state.selectedTower && !state.selectedBuilding) return;
    const panel = document.getElementById(state.selectedTower ? 'towerPanel' : 'buildingPanel'), area = menuArea();
    if (area && document.documentElement.clientWidth>700) { const zoom=cssZoom(panel),left=document.documentElement.clientWidth>1100?area.left:12,right=Math.min(document.documentElement.clientWidth-12,left+440*zoom),height=document.documentElement.clientHeight;const obstacles=[...document.querySelectorAll('.compactToolbar,.dockTL,.hud,.dockBL,.mapControls,.handDock,.duoQuickMap,#quickLoadout,#biomeRail')].map(el=>el.getBoundingClientRect()).filter(r=>r.right>left&&r.left<right);const bounds=HexUiLayout.columnArea(document.documentElement.clientWidth,height,obstacles,left,right-left);if(tutorial.active)bounds.top=Math.max(bounds.top,area.top);panel.style.height=Math.max(0,bounds.bottom-bounds.top)/zoom+'px';fitMenu(panel,bounds,bounds.left,bounds.top);return;}
    if (area) { const narrow = document.documentElement.clientWidth <= 700; fitMenu(panel, area, area.left, narrow ? area.bottom - panel.getBoundingClientRect().height : area.top); }
  }
  function renderBuildingPanel() {
    const panel = document.getElementById('buildingPanel'), selected = state.selectedBuilding, tile = selected ? state.map.get(key(selected.q, selected.r)) : null;
    if (!tile) { panel.classList.add('hidden'); buildingPanelKey = ''; return; }
    panel.classList.remove('hidden'); const building = tile.buildings?.[selected.index];
    document.getElementById('buildingPanelTitle').textContent = building ? HexBuildings.definitions[building.type].name + ' · Stufe ' + (building.special ? 4 : building.level || 1) : (tile.type === 'deadEnd' ? 'Gegnerportal-Platz' : 'Gebäudeslot');
    document.getElementById('buildingPanelInfo').textContent = `${CARD_LIBRARY[tile.type]?.name || 'Hex'}: automatisch +${tile.income || 0} Gold je überlebter Wave. ${building ? HexBuildings.definition(building, state).desc : tile.type === 'deadEnd' ? HexBuildings.definitions.portal.desc : 'Optional einen Gebäudetyp bauen. Haus: zusätzliches Einkommen, Schmiede: Tower-Schaden, Markt: Tower-Rabatte. Ein Gebäude pro Slot.'}`;
    if(building?.type==='market') document.getElementById('buildingPanelInfo').textContent += ' Bereits gewährte Rabatte werden vom Verkaufserlös abgezogen.';
    const panelKey = JSON.stringify([selected, building, state.map.size, state.buildingVersion]);
    const buildingChanged = buildingPanelKey !== panelKey;
    if (buildingChanged) {
      buildingPanelKey = panelKey; panel._targetButton = null; buildingButtons.clear(); const content = document.getElementById('buildingOptions'); content.innerHTML = '';
      if (!building) for (const [type, definition] of Object.entries(HexBuildings.definitions).filter(([type]) => HexBuildings.allowedTypes(tile).includes(type))) {
        const button = document.createElement('button'); button.className = 'upgradeOption'; const blocked = HexBuildings.buildBlockReason(tile, type); button.title = blocked || 'Kräftig: aktueller Wirkbereich. Blass: Versorgung durch andere Gebäude desselben Typs.'; button.innerHTML = `<strong>${definition.name} · ${definition.cost} Gold</strong><small>${definition.desc}</small>${blocked ? '<small class="buildBlockedReason">🔒 ' + blocked + '</small>' : ''}`;
        const preview = () => { if (HexBuildings.buildBlockReason(tile, type)) return; state.previewBuilding = { ...selected, type }; renderBoard(); }, clear = () => { state.previewBuilding = null; renderBoard(); };
        button.addEventListener('pointerenter', preview); button.addEventListener('pointerleave', clear); button.addEventListener('focus', preview); button.addEventListener('blur', clear);
        button.addEventListener('click', () => { state.previewBuilding = null; if (duoToken) { duoAction('building', { slot: state.selectedBuilding, type }); return; } if (HexBuildings.buy(state, state.selectedBuilding, type)) { sound.play('build'); renderAll(); } }); content.appendChild(button); buildingButtons.set(type, button);
      }
    }
    if (building && buildingChanged) {
      const content = document.getElementById('buildingOptions'); content.innerHTML = ''; const next = HexBuildings.nextUpgrade(state, building);
      if (next) { const button = document.createElement('button'); button.className = 'upgradeOption'; button._cost = next.cost; buildingButtons.set('upgrade', button); const after = HexBuildings.definition({ ...building, level: (building.level || 1) + 1 }); button.textContent = (next.name || 'Ausbauen') + ' · ' + next.cost + ' Gold · ' + (next.desc || after.desc); button.disabled = state.gold < next.cost || state.hp <= 0 || !['place', 'build', 'wave'].includes(state.phase); button.addEventListener('click', () => { if (duoToken) { duoAction('buildingUpgrade', { slot: state.selectedBuilding }); return; } if (HexBuildings.upgrade(state, state.selectedBuilding)) renderAll(); }); content.appendChild(button); }
      else if ((building.level || 1) === 3 && !building.special && HexBuildings.specials[building.type]) { const hint = document.createElement('p'); hint.textContent = 'Spezialausbau im Arsenal für 40 Diamanten freischalten. Ab dem nächsten Run verfügbar.'; content.appendChild(hint); }
      if (building.special && building.type !== 'house') { const choose = document.createElement('button'); panel._targetButton = choose; choose.textContent = HexBuildings.redundantTarget(state,building) ? 'Zusatz-Hex bereits gleich stark versorgt · neu wählen' : HexBuildings.targetRemaining(building)===0 ? 'Zusatz-Hex festgelegt · keine Änderung mehr möglich' : state.buildingTarget ? 'Hex auf der Map anklicken · Abbrechen' : (building.target ? 'Zusatz-Hex ändern' : 'Zusatz-Hex auf der Map auswählen'); choose.title = building.type==='market' ? 'Zusatz-Hex: einmal wählen, einmal korrigieren. Noch '+HexBuildings.targetRemaining(building)+' Platzierungen.' : building.target ? 'Aktuelles Zusatzhex: ' + building.target + ' · kräftig markiert' : 'Zusatzhex auswählen'; choose.addEventListener('pointerenter', () => renderBoard()); choose.addEventListener('focus', () => renderBoard()); choose.disabled = state.hp <= 0 || !['place', 'build', 'wave'].includes(state.phase); choose.addEventListener('click', () => { state.buildingTarget = state.buildingTarget ? null : { ...state.selectedBuilding }; state.selectedBuilding = null; setMessage('Zusatzwirkung: ein erkundetes Hex anklicken · Escape: abbrechen'); renderAll(); }); content.appendChild(choose); }
    }
    if (panel._targetButton) panel._targetButton.disabled = HexBuildings.targetRemaining(building)<=0 || state.hp <= 0 || !['place', 'build', 'wave'].includes(state.phase);
    for (const [type, button] of buildingButtons) button.disabled = !!HexBuildings.buildBlockReason(tile, type) || (type === 'portal' && (!['place', 'build'].includes(state.phase) || state.waveRunning)) || !['place', 'build', 'wave'].includes(state.phase) || state.hp <= 0 || state.gold < (button._cost || HexBuildings.definitions[type].cost);
    const sell = document.getElementById('sellBuildingBtn'), refund = HexBuildings.refund(state, building); sell.disabled = !refund; sell.textContent = refund ? `Verkaufen · ${refund.percent} % (+${refund.amount} Gold)` : 'Gebäude verkaufen';
    positionTowerPanel();
  }
  function towerPanelDefinition(tower) {
    const definition = HexData.towerDefinition(tower);
    if (tower.overloadUntil > state.elapsedMs) definition.cooldown /= 1.5;
    return definition;
  }
  function closeTowerComparison() {
    if (!towerComparison) return false;
    const previous = towerComparison; towerComparison = null; state.previewUpgrade = null;
    renderAll(); document.getElementById('compare-' + previous)?.focus?.({preventScroll:true}); document.getElementById('towerPanelScroll').scrollTop = towerComparisonScroll; return true;
  }
  function towerUpgradeCard(content, tower, id, upgrade, next, locked = false) {
    const current = towerPanelDefinition(tower), comparing = towerComparison === id;
    const card = document.createElement('section'); card.className = 'towerUpgradeCard'; card.classList.toggle('comparing', comparing);
    const icon = document.createElement('span'); icon.className = 'towerPathIcon'; icon.setAttribute('aria-hidden', 'true'); const pathArt = HexArsenal.pathIcon?.(id, next.color); icon.innerHTML = pathArt || HexArsenal.icon(tower.type, next.color); card.appendChild(icon);
    // Eigenes Pfad-Symbol unterscheidet die Ausbauten besser als das kleine Modellporträt; das Porträt bleibt nur Ersatz.
    if (!pathArt) syncTowerPortrait(icon, upgradeModelNames(tower, id));
    // Name und Typ als eine Titelzeile, die bei schmalem Fenster umbricht, statt den Preis zu verdrängen.
    const title = document.createElement('div'); title.className = 'towerUpgradeTitle'; card.appendChild(title);
    const heading = document.createElement('strong'); heading.textContent = upgrade.name; title.appendChild(heading);
    const kind = HexTowerView.kind(next), tag = document.createElement('span'); tag.className = 'towerUpgradeTag'; tag.dataset.kind = kind.id; tag.textContent = kind.label; title.appendChild(tag);
    const stats = document.createElement('div'); stats.className = 'towerUpgradeStats'; stats.innerHTML = HexTowerView.upgradeStats(next); card.appendChild(stats);
    const progress = document.createElement('div'); progress.className = 'towerPathProgress'; progress.innerHTML = HexTowerView.pathProgress(tower); card.appendChild(progress);
    const description = document.createElement('p'); description.className = 'towerUpgradeDescription'; description.textContent = upgrade.desc; card.appendChild(description);
    const tradeoff = HexTowerView.tradeoff(current, next);
    if (tradeoff) { const note = document.createElement('small'); note.className = 'towerTradeoff'; note.textContent = tradeoff; card.appendChild(note); }
    if (comparing) {
      state.previewUpgrade = { tower, definition: next };
      towerComparedPreview = state.previewUpgrade;
      const table = document.createElement('section'); table.id = 'towerComparisonSheet'; table.className = 'towerComparisonSheet'; table.setAttribute('aria-label', upgrade.name + ' · Vergleich');
      table.innerHTML = '<h3>' + HexTowerView.escape(upgrade.name) + '</h3><p class="hint">' + HexTowerView.escape(upgrade.desc) + '</p>' + HexTowerView.comparison(current, next);
      const back = document.createElement('button'); back.className = 'secondary'; back.textContent = 'Vergleich schließen'; back.addEventListener('click', closeTowerComparison); table.appendChild(back);
      content.appendChild(table);
    }
    const actions = document.createElement('div'); actions.className = 'towerUpgradeActions';
    const compare = document.createElement('button'); compare.className = 'secondary'; compare.id = 'compare-' + id;
    // Beschreibung, Abwägung und Vergleichstabelle erst auf Wunsch (Details); die Karte selbst zeigt nur Kurzwerte und Preis.
    compare.className = 'secondary towerDetailsToggle'; compare.textContent = comparing ? 'Details schließen' : 'Details & Vergleich'; compare.setAttribute('aria-label', upgrade.name + ' · ' + compare.textContent); compare.setAttribute('aria-expanded', String(comparing));
    compare.setAttribute('aria-pressed', String(comparing));
    compare.addEventListener('click', () => {
      if (comparing) { closeTowerComparison(); return; }
      if (!towerComparison) towerComparisonScroll = document.getElementById('towerPanelScroll').scrollTop || 0;
      towerComparison = id; state.previewUpgrade = { tower, definition: next }; renderAll(); document.getElementById('compare-' + id)?.focus?.();
      document.getElementById('towerComparisonSheet')?.scrollIntoView?.({block:'nearest'});
    }); actions.appendChild(compare);
    if (locked) { const hint = document.createElement('p'); hint.className = 'ultimateLocked'; hint.textContent = HexBuildings.cost(state, state.selectedTower, upgrade.cost) + ' Gold · Im Arsenal freischalten und für den nächsten Run aktivieren.'; card.appendChild(hint); }
    else {
      const buy = document.createElement('button'); buy.className = 'upgradeOption towerBuy'; buy._baseCost = upgrade.cost;
      buy._upgradeName = upgrade.name; buy.addEventListener('click', () => { towerComparison = null; upgradeSelectedTower(id); });
      bindUpgradePreview(buy, tower, next); actions.appendChild(buy); upgradeButtons.set(id, buy);
    }
    card.appendChild(actions); content.appendChild(card);
  }
  // Turmporträts (classes/tower-portraits.mjs): gleiche Modellwahl wie der 3D-Renderer; ohne Porträt bleibt das Icon sichtbar.
  function towerModelNames(tower) {
    const names = [], variant = tower.finalUpgrade || tower.branch;
    if (tower.ultimate && tower.finalUpgrade) names.push('tower_' + tower.type + '_' + tower.finalUpgrade + '_ultimate');
    if (variant) names.push('tower_' + tower.type + '_' + variant);
    names.push('tower_' + tower.type); return names;
  }
  function upgradeModelNames(tower, id) {
    if (id.startsWith('ultimate:')) return towerModelNames({ ...tower, ultimate: tower.type });
    const upgrade = HexData.UPGRADES?.[id];
    return towerModelNames({ type: tower.type, ...(upgrade?.requires ? { branch: upgrade.requires, finalUpgrade: id } : { branch: id }) });
  }
  function syncTowerPortrait(element, names) {
    const id = names.join('|') + '|' + (typeof HexAssetEdition !== 'undefined' ? HexAssetEdition.get() : 'normal');
    if (!element || element._portraitKey === id) return;
    const request = globalThis.HexTowerPortraits?.url(names); if (!request) return;
    element._portraitKey = id; element.classList?.remove('hasPortrait');
    request.then(url => { if (element._portraitKey !== id) return; element.style.setProperty?.('--portrait', url ? 'url(' + url + ')' : 'none'); element.classList?.toggle('hasPortrait', !!url); });
  }
  globalThis.addEventListener?.('hexportraitsready', () => { towerPanelKey = ''; if (state?.selectedTower) renderAll(); });
  document.querySelectorAll?.('[data-close-tower-details]').forEach(button => button.addEventListener('click', () => { document.getElementById('towerExtraDetails').open = false; document.getElementById('towerValuesBtn')?.focus?.(); }));
  // „Werte & Einflüsse“ sitzt in der Fußzeile neben „Verkaufen“ und öffnet die Unteransicht.
  document.getElementById('towerValuesBtn')?.addEventListener('click', () => { document.getElementById('towerExtraDetails').open = true; document.getElementById('towerPanelScroll').scrollTop = 0; document.querySelector?.('#towerExtraDetails .towerBack')?.focus?.(); });
  function renderTowerPanel() {
    const panel = document.getElementById('towerPanel'), selected = state.selectedTower, tower = selected ? state.map.get(key(selected.q, selected.r))?.towers[selected.index] : null;
    if (!tower) { panel.classList.add('hidden'); towerPanelKey = ''; towerSelectionKey = ''; towerComparison = null; state.previewUpgrade = null; return; }
    const selectionKey = JSON.stringify(selections('Tower'));
    if (towerSelectionKey !== selectionKey) { towerSelectionKey = selectionKey; towerComparison = null; towerFocusOpen = false; document.getElementById('towerExtraDetails').open = false; }
    panel.classList.remove('hidden'); document.getElementById('towerPanelTitle').textContent = HexData.towerDefinition(tower).name;
    document.getElementById('towerPanelStage').textContent = tower.ultimate ? 'Ultimate' : tower.finalUpgrade ? 'Stufe 3 · Zweigfinale' : tower.branch ? 'Stufe 2 · Spezialisierung' : 'Basisstufe';
    document.getElementById('towerSubNote').textContent = HexData.towerDefinition(tower).name + ' · ' + document.getElementById('towerPanelStage').textContent;
    const portrait = document.getElementById('towerPortrait'); if (portrait._fallbackType !== tower.type) { portrait._fallbackType = tower.type; portrait.innerHTML = HexArsenal.icon(tower.type, HexData.towerDefinition(tower).color); }
    syncTowerPortrait(portrait, towerModelNames(tower));
    const selectedTowers = selections('Tower').map(s => state.map.get(key(s.q, s.r))?.towers[s.index]).filter(Boolean), group = selectedTowers.length > 1;
    if (group) { document.getElementById('towerPanelTitle').textContent = selectedTowers.length + ' Türme ausgewählt'; document.getElementById('towerPanelStage').textContent = 'Gemeinsam einstellen'; document.getElementById('selectedTowerInfo').textContent = 'Angriffsfokus gemeinsam einstellen · Strg + Klick: Auswahl ändern'; }
    const definition = towerPanelDefinition(tower);
    const validChoices = tower.ultimate ? [] : tower.finalUpgrade ? ['ultimate:' + tower.type] : HexData.availableUpgrades(tower).map(([id]) => id);
    if (towerComparison && !validChoices.includes(towerComparison)) towerComparison = null;
    document.getElementById('selectedTowerInfo').classList.remove('hidden');
    document.getElementById('towerExtraDetails').classList.toggle('hidden', group);
    const panelKey = JSON.stringify([state.towerDraft?.upgrades,selections('Tower'), definition, tower.biome, tower.tileType, tower.overloadPending, selectedTowers.map(t => t.targetPriority), state.buildingVersion, towerComparison, uiLanguageRevision]);
    if (towerPanelKey !== panelKey) {
      towerPanelKey = panelKey; upgradeButtons.clear(); const content = document.getElementById('towerUpgrades'); content.innerHTML = '';
      document.getElementById('towerDescription').textContent = definition.desc;
      document.getElementById('towerExtraValues').innerHTML = HexTowerView.valueSheet(definition);
      document.getElementById('towerFactors').innerHTML = HexTowerView.factors(definition);
      // Einflüsse als Text (wie bisher) mit passendem Bild: Biom-Icon, Kachelbild, Gebäude oder Wertsymbol.
      const biome = HexBiomes.definitions[tower.biome || 'grass'], terrain = CARD_LIBRARY[tower.tileType], influences = [biome.name + ': ' + biome.description], influenceIcons = ['<span class="hxi hxi-biome_' + (tower.biome || 'grass') + '"></span>'];
      const bonus = HexData.tileBonusLabel(terrain); if (bonus) { influences.push(terrain.name + ': ' + bonus); influenceIcons[1] = miniPathSvg(terrain, state.map.get(key(selected.q, selected.r))?.rotation || 0); }
      const selectedTile = state.map.get(key(selected.q, selected.r));
      if (selectedTile?.site === 'guardian' && selected.index === selectedTile.siteSlot) influences.push('Wächter-Bauplatz: +20 % Reichweite.');
      for (const tile of state.map.values()) {
        const distance = Math.max(Math.abs(tile.q - selected.q), Math.abs(tile.r - selected.r), Math.abs(tile.q + tile.r - selected.q - selected.r));
        if (distance <= 1 && tile.siteEffect) influences.push('Schrein (' + tile.q + ', ' + tile.r + '): ' + (tile.siteEffect === 'damage' ? '+10 % Schaden' : '+15 % Reichweite'));
        for (const building of tile.buildings || []) if (building && ['forge', 'market'].includes(building.type)) {
          const effect = HexBuildings.definition(building);
          if (distance <= effect.radius || building.special && building.target === key(selected.q, selected.r)) { influenceIcons[influences.length] = '<span class="hxi hxi-building_' + building.type + '"></span>'; influences.push(effect.name + ' (' + tile.q + ', ' + tile.r + '): ' + effect.desc); }
        }
      }
      if (tower.overloadPending) influences.push('Überladung: für die nächste Welle vorgemerkt.');
      if (tower.overloadUntil > state.elapsedMs) influences.push('Überladung aktiv: +50 % Angriffstempo.');
      if (tower.supportDamage && tower.supportDamage !== 1) influences.push('Unterstützung · Schaden ×' + HexTowerView.number(tower.supportDamage));
      if (tower.supportRange && tower.supportRange !== 1) influences.push('Unterstützung · Reichweite ×' + HexTowerView.number(tower.supportRange));
      if (tower.rangeFactor && tower.rangeFactor !== 1) influences.push('Durchlauf · Reichweite ×' + HexTowerView.number(tower.rangeFactor));
      const discount = HexBuildings.cost(state, selected, 100); if (discount !== 100) influences.push('Standort-Rabatt: ' + (100 - discount) + ' %');
      // Erklärzeile je Einfluss: woher er kommt (Biom, bebautes Hex, Gebäude, Schrein …).
      const influenceSource = (text, i) => i === 0 ? 'Biom des Bauplatzes' : i === 1 && bonus ? 'Bonus des bebauten Hexes' : /^Schrein/.test(text) ? 'Schrein in der Nähe' : /^Wächter/.test(text) ? 'Besiegter Erkundungswächter' : /hxi-building_/.test(influenceIcons[i] || '') ? 'Gebäude in Reichweite' : /^Überladung/.test(text) ? 'Verbrauchshilfe' : '';
      document.getElementById('towerInfluences').innerHTML = influences.map((text, i) => { const split = text.search(/: | · /), name = split > 0 ? text.slice(0, split) : text, effect = split > 0 ? text.slice(split + 2).trim() : '', source = influenceSource(text, i);
        return '<div class="towerInfluence"><span class="towerInfluenceIcon" aria-hidden="true">' + (influenceIcons[i] || '<span class="hxi hxi-upgrade"></span>') + '</span><p><strong>' + HexTowerView.escape(name) + '</strong>' + (effect ? '<span>' + HexTowerView.escape(effect) + '</span>' : '') + (source ? '<small>' + source + '</small>' : '') + '</p></div>'; }).join('');
      let focusSection = null, focusActions = [];
      const targetable = selectedTowers.filter(t => { const d = HexData.towerDefinition(t); return !d.aura && !d.mine; });
      if (targetable.length) {
        const tower = targetable[0];
        const labels = { closestBase: 'Nächste an der Base', furthestBase: 'Weiteste von der Base', mostHealth: 'Meistes Leben', leastHealth: 'Wenigstes Leben', mostArmor: 'Meiste Rüstung', mostMagic: 'Meiste Magieresistenz', boss: 'Bosse', healer: 'Heiler', closestTower: 'Nächste am Turm', furthestTower: 'Weiteste vom Turm' }, defaults = HexData.defaultTargetPriority(tower);
        tower.targetPriority = [...new Set(tower.targetPriority || defaults)]; for (const value of defaults) if (tower.targetPriority.length < 3 && !tower.targetPriority.includes(value)) tower.targetPriority.push(value); tower.targetPriority = tower.targetPriority.slice(0, 3);
        const targeting = document.createElement('details'); targeting.className = 'targetPriorities towerDisclosure'; targeting.setAttribute('aria-label', 'Angriffsfokus'); targeting.open = group || towerFocusOpen;
        const summary = document.createElement('summary'); summary.innerHTML = '<span class="focusLabel">Angriffsfokus</span><span class="focusValue">' + HexTowerView.escape(targetable.some(t => (t.targetPriority || defaults)[0] !== tower.targetPriority[0]) ? 'Unterschiedliche Einstellungen' : labels[tower.targetPriority[0]]) + '</span>'; targeting.appendChild(summary);
        targeting.addEventListener('toggle', () => { towerFocusOpen = targeting.open; }); focusSection = targeting;
        const copy = document.createElement('button'), paste = document.createElement('button');
        copy.className = paste.className = 'towerFocusCopy'; copy.textContent = 'Fokus kopieren'; paste.textContent = 'Fokus einfügen'; paste.disabled = !copiedTowerPriorities;
        copy.addEventListener('click', () => { copiedTowerPriorities = [...tower.targetPriority]; towerPanelKey = ''; renderAll(); });
        paste.addEventListener('click', () => { if (!copiedTowerPriorities) return; if (duoToken) duoBridge?.priorities(selections('Tower').filter(slot => { const t=state.map.get(key(slot.q,slot.r))?.towers[slot.index]; return targetable.includes(t); }).map(slot => ({slot,priorities:[...copiedTowerPriorities]}))); else for (const target of targetable) target.targetPriority = [...copiedTowerPriorities]; towerPanelKey = ''; renderAll(); });
        focusActions = [copy, paste];
        tower.targetPriority.forEach((value, index) => { const row = document.createElement('label'); row.textContent = `${index + 1}.`; const select = document.createElement('select'); select.setAttribute('aria-label', 'Angriffsfokus Priorität ' + (index + 1)); const mixed = targetable.some(t => (t.targetPriority || defaults)[index] !== value); if (mixed) { const option = document.createElement('option'); option.value = ''; option.textContent = 'Unterschiedliche Einstellungen'; option.disabled = true; option.selected = true; select.appendChild(option); } for (const [id, label] of Object.entries(labels)) { const option = document.createElement('option'); option.value = id; option.textContent = label; option.selected = !mixed && id === value; select.appendChild(option); } select.addEventListener('change', () => { if (duoToken) { const packets = selections('Tower').map(slot => { const target = state.map.get(key(slot.q, slot.r))?.towers[slot.index], priorities = [...(target.targetPriority || defaults)], old = priorities[index], other = priorities.indexOf(select.value); priorities[index] = select.value; if (other >= 0 && other !== index) priorities[other] = old; return { slot, priorities }; }); duoBridge?.priorities(packets); return; } for (const target of targetable) { target.targetPriority = [...(target.targetPriority || defaults)]; const old = target.targetPriority[index], other = target.targetPriority.indexOf(select.value); target.targetPriority[index] = select.value; if (other >= 0 && other !== index) target.targetPriority[other] = old; } towerPanelKey = ''; renderAll(); }); row.appendChild(select); targeting.appendChild(row); });
      }
      if (group) { const hint = document.createElement('p'); hint.className = 'hint'; hint.textContent = 'Änderungen gelten für ' + targetable.length + ' Türme mit Angriffsfokus. Unterschiedliche bisherige Einstellungen werden durch die Auswahl je Zeile angepasst. Support und Minenleger bleiben unverändert. Upgrades und Verkauf: einzelnen Turm auswählen.'; content.appendChild(hint); }
      else if (tower.ultimate) { const hint = document.createElement('p'); hint.className = 'hint'; hint.textContent = 'Meta-Stufe 4 erreicht.'; content.appendChild(hint); }
      else if (tower.finalUpgrade && state.challengeKind==='towerDraft') { const hint=document.createElement('p');hint.textContent='Maximale Draft-Stufe erreicht.';content.appendChild(hint); }
      else if (tower.finalUpgrade) {
        const id = 'ultimate:' + tower.type, upgrade = HexData.ultimateDefinition(tower), unlocked = HexData.ultimateAvailable(state, tower);
        towerUpgradeCard(content, tower, id, upgrade, towerPanelDefinition({ ...tower, ultimate: tower.type }), !unlocked);
      } else for (const [branch, upgrade] of HexData.availableUpgrades(tower)) {
        const next = towerPanelDefinition({ ...tower, ...(upgrade.requires ? { finalUpgrade: branch } : { branch }) });
        towerUpgradeCard(content, tower, branch, upgrade, next);
      }
      if (focusSection) { content.appendChild(focusSection); for (const button of focusActions) content.appendChild(button); }
    }
    for (const [, button] of upgradeButtons) {
      const price = HexBuildings.cost(state, selected, button._baseCost), unavailable = !['place', 'build', 'wave'].includes(state.phase) || state.hp <= 0;
      button.disabled = (state.challengeKind==='movingFortress'&&!HexMovingFortress.building(state)) || unavailable || state.gold < price || (state.challengeKind==='towerDraft'&&!HexTowerDraft.canUpgrade(state)); button.toggleAttribute?.('data-locked', unavailable);
      const text = state.challengeKind==='towerDraft' ? (HexTowerDraft.canUpgrade(state)?'Ausbauen · 1 Upgrade-Ticket':'Kein Upgrade-Ticket verfügbar') : unavailable ? 'Zurzeit nicht ausbaubar' : state.gold < price ? price + ' Gold · ' + (price - state.gold) + ' fehlen' : price + ' Gold';
      if (button.textContent !== text) button.textContent = text;
      button.setAttribute('aria-label', button._upgradeName + ' · ' + text);
    }
    positionTowerPanel();
  }
  function setMessage(s, notice = false) { if(consumablePick) s=(consumablePick==='overload'?'Überladung: eigenen angreifenden Turm anklicken.':'Position auf der Straße für '+HexCombat.consumables[consumablePick].name+' anklicken.')+' Escape / Rechtsklick: abbrechen.'; const feedback = document.getElementById('tutorialFeedback'); feedback.textContent = notice ? s : ''; feedback.classList.toggle('hidden', !notice || !tutorial.active); document.getElementById('messageText').textContent = s; messageEl.classList.remove('show'); if (!s.trim()) return; void messageEl.offsetWidth; messageEl.classList.add('show'); }

  function rotateSelected(direction = 1) {
    if (state.phase !== 'place' || !state.hand[state.selectedCard]) return false;
    const card = HexPlacementCommands.card(state, state.hand[state.selectedCard]);
    const target = state.hoveredPlacement ? state.hoveredPlacement.split(',').map(Number) : null;
    const valid = target ? validRotations(...target, card) : Array.from({ length: 6 }, (_, rot) => rot).filter(rot => hasAnyPlacement(card, rot));
    if (!valid.length) { setMessage('Hier passt die Karte in keiner Ausrichtung. Wähle ein anderes Feld.'); return true; }
    const shapes=new Set(valid.map(rot=>HexMap.rotatedRoads(card,rot).slice().sort().join(',')));
    if(valid.length===1||(!card.slots&&!card.buildingSlots&&shapes.size===1)){setMessage('Nicht drehbar: Nur diese Ausrichtung passt an die vorhandenen Anschlüsse.');return true;}
    for (let step = 1; step <= 6; step++) { const rot = (state.rotation + direction * step + 12) % 6; if (valid.includes(rot)) { state.rotation = rot; break; } }
    tutorialEvent('rotate'); renderAll(); return true;
  }

  const quickButtons = new Map(), biomeButtons = new Map(); let quickKey = '', biomeKey = '', quickPointer = null, pinnedBiome = null;
  function canQuickBuild() { if(state.challengeKind==='movingFortress'&&!HexMovingFortress.building(state))return false; if(state.challengeKind==='towerDraft'&&!HexTowerDraft.building(state))return false; if(state.challengeKind==='powerGrid'&&!HexPowerGrid.planning(state))return false; return state.challengeKind !== 'detour' && ['place', 'build', 'wave'].includes(state.phase) && state.hp > 0; }
  function quickBuildOffer(type, discount = HexBuildings.freeSlotDiscount(state.map)) {
    if(state.challengeKind==='towerDraft')return {price:0,available:Number.isFinite(discount),affordable:Number.isFinite(discount)&&HexTowerDraft.canBuild(state,type,1)};
    const price = state.freeTowerBuilds>0&&Number.isFinite(discount)?0:Math.ceil(TOWERS[type].cost * discount);
    return { price, available: Number.isFinite(price), affordable: state.gold >= price };
  }
  function cancelQuickTower() {
    quickPointer = null; if (state) { state.dragTower = null; state.dragSlot = null; }
    document.getElementById('towerDragGhost').classList.add('hidden'); document.getElementById('towerDragShade').classList.add('hidden');
  }
  function armQuickTower(type) {
    if (!canQuickBuild() || !state.towerLoadout.includes(type) || !quickBuildOffer(type).affordable) return false;
    state.dragTower = type; state.dragSlot = null; state.previewTower = null;
    document.getElementById('towerDrawer').classList.add('hidden');
    setMessage(TOWERS[type].name + ': auf einen freien Turmplatz ziehen oder tippen · Escape: abbrechen'); renderAll(); return true;
  }
  function dropQuickTower(type, slot) {
    cancelQuickTower();
    const tile = slot && state.map.get(key(slot.q, slot.r));
    if (!canQuickBuild() || !state.towerLoadout.includes(type) || !tile || !Number.isInteger(slot.index) || slot.index < 0 || slot.index >= tile.slots || tile.towers[slot.index]) { renderAll(); return false; }
    const price = state.challengeKind==='towerDraft'?0:HexTowerCommands.buildPrice(state, slot, TOWERS[type].cost);
    if (state.gold < price) { setMessage('Nicht genug Gold: ' + price + ' Gold für diesen Platz.'); renderAll(); return false; }
    state.selectedSlots = [slot]; state.selectedSlot = slot; state.selectedTower = null; state.selectedBuilding = null;
    tutorialEvent('slot'); buyTower(type); return !!tile.towers[slot.index];
  }
  function screenSlots() {
    const result = []; for (const tile of state.map.values()) slotPositions(tile).forEach((position, index) => { if (tile.towers[index]) return; const screen = renderer.project(position, 2); if (screen) result.push({ q: tile.q, r: tile.r, index, ...screen }); }); return result;
  }
  function quickSlotAt(event) {
    const under = document.elementFromPoint?.(event.clientX, event.clientY); if (under?.closest?.('button,nav,.drawer,.towerPanel,.hud,.handDock,.overlay')) return null;
    if (renderer.pickSlot) return renderer.pickSlot(event);
    const box = document.querySelector?.('.boardWrap')?.getBoundingClientRect(); if (!box) return null;
    return HexUiLayout.pickScreenSlot(screenSlots(), event.clientX - box.left, event.clientY - box.top, box.width, box.height);
  }
  function renderDragShade() {
    const shade = document.getElementById('towerDragShade'); shade.classList.toggle('hidden', !state.dragTower); if (!state.dragTower) return;
    const slots = screenSlots(), box = document.querySelector?.('.boardWrap')?.getBoundingClientRect(); if (!box) return;
    shade.style.left = box.left + 'px'; shade.style.top = box.top + 'px'; shade.style.width = box.width + 'px'; shade.style.height = box.height + 'px';
    // Keep the targets as HTML overlays: their visibility does not depend on SVG masks,
    // GPU depth, optional slot hints or the terrain render pass.
    const radius = HexUiLayout.dropRadius;
    const circles = slots.map(s => '<circle cx="' + s.x + '" cy="' + s.y + '" r="' + radius + '" fill="black"/>').join('');
    const mask = '<svg class="dragMapVeil" viewBox="0 0 ' + box.width + ' ' + box.height + '" preserveAspectRatio="none"><defs><mask id="freeSlotMask" maskUnits="userSpaceOnUse" x="0" y="0" width="' + box.width + '" height="' + box.height + '"><rect width="100%" height="100%" fill="white"/>' + circles + '</mask></defs><rect width="100%" height="100%" fill="#202b30" fill-opacity=".42" mask="url(#freeSlotMask)"/></svg>';
    shade.innerHTML = mask + slots.map(s => {
      const active = state.dragSlot && s.q === state.dragSlot.q && s.r === state.dragSlot.r && s.index === state.dragSlot.index, price = HexTowerCommands.buildPrice(state, s, TOWERS[state.dragTower].cost), affordable = state.gold >= price;
      return '<span class="dragBuildTarget' + (active ? ' active' : '') + (affordable ? '' : ' unaffordable') + '" data-slot="' + s.q + ',' + s.r + ',' + s.index + '" style="left:' + s.x + 'px;top:' + s.y + 'px;width:' + radius * 2 + 'px;height:' + radius * 2 + 'px"><span>' + (affordable ? '+' : '×') + '</span></span>';
    }).join('');
  }

  // Acknowledgement belongs to this run, not the browser profile.
  function dismissBiomeIntro() { if (!HexBiomes.acknowledgeIntro(state)) return; document.getElementById('biomeIntro').classList.add('hidden'); renderAll(); }
  document.getElementById('biomeIntroClose').addEventListener('click', dismissBiomeIntro);
  function renderBiomeIntroDetails() {
    const ids = HexBiomes.introIds(state), active = state.highlightBiome || pinnedBiome;
    document.getElementById('biomeIntroTitle').textContent = ids.length > 1 ? 'Neue Biome entdeckt' : 'Neues Biom entdeckt';
    const detail = document.getElementById('biomeIntroDetail'); detail.textContent = ''; detail.replaceChildren();
    if (active) detail.textContent = HexBiomes.definitions[active].name + ': ' + HexBiomes.definitions[active].description;
    else for (const id of ids) { const row = document.createElement('span'); row.className = 'biomeIntroName'; row.textContent = HexBiomes.definitions[id].name; detail.appendChild(row); }
  }
  function showBiomeHighlight(id) { state.highlightBiome = id; for (const [biome, button] of biomeButtons) button.classList.toggle('showTooltip', biome === id); renderBiomeIntroDetails(); renderBoard(); }
  function renderQuickControls() {
    if (state.dragTower && (state.hp <= 0 || state.phase === 'gameover')) cancelQuickTower();
    const visibleTypes=state.challengeKind==='detour'?[]:state.challengeKind==='towerDraft'?state.towerLoadout.filter(t=>(state.towerDraft.inventory[t]||0)>0):state.towerLoadout;
    const rail = document.getElementById('quickLoadout'), next = visibleTypes.join('|');rail.classList.toggle('draftRail',['towerDraft','movingFortress','expedition'].includes(state.challengeKind));
    if (quickKey !== next) {
      quickKey = next; rail.innerHTML = ''; quickButtons.clear(); for (const type of visibleTypes) {
        const def = TOWERS[type], button = document.createElement('button'); button.className = 'quickTower hxHex'; button.setAttribute('aria-label', def.name + ' bauen'); button.title = def.name + ' · Ziehen oder anklicken, dann Bauplatz wählen'; button.innerHTML = HexArsenal.icon(type, def.color) + '<small>' + def.cost + '</small>';
        button.addEventListener('pointerdown', e => { if (e.button !== 0) return; e.preventDefault(); e.stopPropagation(); if (!armQuickTower(type)) return; quickPointer = { id: e.pointerId, type, x: e.clientX, y: e.clientY, moved: false }; button.setPointerCapture?.(e.pointerId); });
        button.addEventListener('click', e => { if (e.detail === 0) armQuickTower(type); }); button.addEventListener('lostpointercapture', () => { if (quickPointer) { if (canQuickBuild() || state.hp <= 0) cancelQuickTower(); else { quickPointer = null; document.getElementById('towerDragGhost').classList.add('hidden'); } renderAll(); } }); rail.appendChild(button); quickButtons.set(type, button);
      }
    }
    const quickDiscount = HexBuildings.freeSlotDiscount(state.map);
    for (const [type, button] of quickButtons) {
      const offer = quickBuildOffer(type, quickDiscount); button.disabled = !canQuickBuild() || !offer.affordable; button.classList.toggle('unaffordable', offer.available && !offer.affordable); button.classList.toggle('active', state.dragTower === type); button.setAttribute('aria-pressed', String(state.dragTower === type));
      const price = offer.available ? offer.price : TOWERS[type].cost, label = state.challengeKind==='towerDraft'?(state.towerDraft.inventory[type]||0)+' ×':(price < TOWERS[type].cost ? 'ab ' : '') + price; if (button._priceLabel !== label) { button._priceLabel = label; button.innerHTML = HexArsenal.icon(type, TOWERS[type].color) + '<small>' + label + '</small>'; }
      button.title = TOWERS[type].name + ' · ' + (!offer.available ? 'Kein freier Turmplatz' : state.challengeKind==='towerDraft' ? (offer.affordable?'Aus dem Inventar platzieren':'Nicht im Inventar oder Auswahl noch offen') : !offer.affordable ? 'Nicht genug Gold · mindestens ' + price + ' Gold nötig' : 'Ziehen oder anklicken, dann Bauplatz wählen · Preis je nach Marktrabatt');
    }
    if (!onboardingHints || state.introduction) state.biomeIntro = null;
    const discovered = new Set(HexBiomes.visibleTiles(state).map(t => HexBiomes.forTile(state, t))), ids = ['grass', 'desert', 'ash', 'storm'].filter(id => discovered.has(id)), key = ids.join('|'), biomes = document.getElementById('biomeRail');
    biomes.classList.toggle('hidden', !!state.introduction && ids.length === 1); document.querySelector?.('[data-compact="biomes"]')?.classList.toggle('hidden', !!state.introduction && ids.length === 1);
    if (!HexBiomes.introIds(state).length) state.biomeIntro = null;
    if (!state.introduction && onboardingHints && !HexBiomes.introAcknowledged(state) && !state.biomeIntro && mainMenu.classList.contains('hidden') && !['gameover', 'victory'].includes(state.phase)) { const first = ids.filter(id => id !== 'grass'); if (first.length) { state.biomeIntro = first; if (globalThis.HexCompact?.small()) globalThis.HexCompact.open('biomes'); renderBoard(); } }
    document.getElementById('biomeIntro').classList.toggle('hidden', !state.biomeIntro || !mainMenu.classList.contains('hidden')); renderBiomeIntroDetails();
    if (key !== biomeKey) {
      biomeKey = key; biomes.innerHTML = ''; biomeButtons.clear(); for (const id of ids) {
        const def = HexBiomes.definitions[id], button = document.createElement('button'); button.className = 'biomeIcon hxHex'; button.dataset.biome = id; button.style.borderColor = def.color; button.setAttribute('aria-label', def.name + ': ' + def.description); button.innerHTML = '<span class="hxi hxi-biome_' + id + '" aria-hidden="true"></span><span class="biomeTooltip"><strong>' + def.name + '</strong><small>' + def.description + '</small></span>';
        button.addEventListener('pointerenter', () => showBiomeHighlight(id)); button.addEventListener('pointerleave', () => showBiomeHighlight(pinnedBiome)); button.addEventListener('focus', () => showBiomeHighlight(id)); button.addEventListener('blur', () => showBiomeHighlight(pinnedBiome)); button.addEventListener('click', () => { pinnedBiome = pinnedBiome === id ? null : id; showBiomeHighlight(pinnedBiome); renderQuickControls(); }); biomes.appendChild(button); biomeButtons.set(id, button);
      }
    } for (const [id, button] of biomeButtons) { button.classList.toggle('biomeIntroTarget', HexBiomes.introIds(state).includes(id)); button.classList.toggle('active', pinnedBiome === id); button.classList.toggle('showTooltip', state.highlightBiome === id); button.setAttribute('aria-pressed', String(pinnedBiome === id)); }
  }
  document.addEventListener('pointerdown', e => { if (e.button !== 0) return; dismissTransientPanels(e); if (!state?.dragTower || quickPointer || e.target?.closest?.('#rewardOverlay,#celebration,#campaignVictory,#hotkeyTip,#introductionNotice')) return; if (e.target?.closest?.('.loadoutRail')) return; if (!quickSlotAt(e)) { cancelQuickTower(); renderAll(); } }, true);
  document.addEventListener('pointermove', e => { if (!quickPointer || e.pointerId !== quickPointer.id) return; quickPointer.moved ||= Math.hypot(e.clientX - quickPointer.x, e.clientY - quickPointer.y) > 5; if(quickPointer.draft){if(!quickPointer.moved)return;const drag=quickPointer,offer=drag.draft;if(state.towerDraft.serial!==offer.serial||!HexTowerDraft.choose(state,offer.index)){quickPointer=null;return;}delete drag.draft;armQuickTower(drag.type);quickPointer=drag;saveRunAutosave(true);} state.dragSlot = quickSlotAt(e); const ghost = document.getElementById('towerDragGhost'); ghost.classList.remove('hidden'); ghost.style.left = (e.clientX + 18) + 'px'; ghost.style.top = (e.clientY - 22) + 'px'; const price = state.challengeKind==='towerDraft'?0:HexTowerCommands.buildPrice(state, state.dragSlot, TOWERS[quickPointer.type].cost); ghost.innerHTML = HexArsenal.icon(quickPointer.type, TOWERS[quickPointer.type].color) + '<small>' + price + '<span class="sr-only"> Gold</span></small>'; renderBoard(); });
  document.addEventListener('pointerup', e => { if (!quickPointer || e.pointerId !== quickPointer.id) return; if(quickPointer.draft){const offer=quickPointer.draft;quickPointer=null;if(state.towerDraft.serial===offer.serial&&HexTowerDraft.choose(state,offer.index)){renderAll();saveRunAutosave(true);}return;} if (!canQuickBuild()) { quickPointer = null; document.getElementById('towerDragGhost').classList.add('hidden'); return; } const drag = quickPointer, slot = quickSlotAt(e); quickPointer = null; document.getElementById('towerDragGhost').classList.add('hidden'); if (slot) dropQuickTower(drag.type, slot); else if (drag.moved) { cancelQuickTower(); renderAll(); } });
  document.addEventListener('pointercancel', () => { if (state.dragTower && !canQuickBuild() && state.hp > 0 && state.phase !== 'gameover') { quickPointer = null; document.getElementById('towerDragGhost').classList.add('hidden'); } else cancelQuickTower(); renderAll(); });
  globalThis.addEventListener?.('blur', () => { cancelQuickTower(); renderAll(); });

  document.addEventListener('click', event => { if (event.button === 0) dismissBiomeInfoOutside(event); }, true);
  function inspectBiome(id) { const def = HexBiomes.definitions[id]; if (!def) return; document.getElementById('biomeInfoTitle').textContent = def.name; document.getElementById('biomeInfoText').textContent = def.description; document.getElementById('biomeInfoPanel').classList.remove('hidden'); }
  function newRun(loadout = profile.activeLoadout, heroId = profile.activeHero, difficulty = profile.difficulty || 'normal', challengeDay = null, preserveAutosave = false) {
    if(challengeLab) challengeDay=challengeLab.mission.day;
    devEnemyQueue=[];
    if (!preserveAutosave) clearRunAutosave();
    closeSale(); document.getElementById('biomeInfoPanel').classList.add('hidden');
    cancelQuickTower(); if (state) state.highlightBiome = null; pinnedBiome = null;
    clearRunTimers(); inspectReward('selection'); document.getElementById('celebration').classList.add('hidden');
    handRenderKey = forecastRenderKey = ''; deckRenderKeys.clear(); uiWavePlans.clear();
    towerMenuKey = ''; renderer.reset();
    document.getElementById('deckDropdown').open = false;
    rewardOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden'); gameOverOverlay.classList.remove('inspectEndMap');
    const seedInput = document.getElementById('runSeed');
    const seed = challengeLab||challengeDay&&['expedition','towerDraft'].includes(HexWaves.daily(challengeDay).id)?HexRandom.freshSeed():challengeDay ? HexWaves.daily(challengeDay).id + '-v1|' + challengeDay : seedInput.value?.trim() || HexRandom.freshSeed();
    document.getElementById('campaignVictory').classList.add('hidden'); document.getElementById('campaignVictory').classList.remove('inspectCampaign');
    if (!challengeDay && difficulty === 'dual' && !profile.milestones.includes('standard35')) difficulty = 'normal';
    if (!HexProfile.heroUnlocked(profile, heroId)) heroId = 'standard';
    if (challengeDay) { difficulty = 'dual'; heroId = 'standard'; }
    const introduction = !duoToken && !challengeDay && HexProfile.learning(profile) ? profile.introduction : null;
    const chosen = [...new Set(loadout)].filter(id => TOWERS[id] && profile.unlockedTowers.includes(id));
    const run = HexRunRuntime.create({ seed, runId: HexRandom.freshSeed(), loadout: chosen.length === 5 ? chosen : introduction || profile.activeLoadout.length === 5 ? profile.activeLoadout : [...HexProfile.START_TOWERS], unlocks: HexProfile.runUnlocks(profile), heroId, difficulty, challengeDay, introduction });
    state = run.state; state.challengePractice=!!challengeLab; random = run.random; if (testProfile && typeof HexAssetEdition !== 'undefined') HexAssetEdition.set('normal'); if (onboardingHints && !tutorialSeen && state.towerLoadout.includes('archer')) state.towerLoadout = ['archer', ...state.towerLoadout.filter(id => id !== 'archer')]; Object.assign(state, { selectedCard: null, rotation: 0, showHexGrid, showSlotHints, showUpgradeStatus: document.getElementById('upgradeStatus').checked, selectedSlots: [], selectedTowers: [] });
    document.getElementById('baseDropdown').open = false;
    document.getElementById('activeSeed').textContent = seed; document.getElementById('dailyRunStatus').textContent = challengeDay ? HexWaves.daily(challengeDay).name + ' · ' + challengeDay + (state.challengeKind==='expedition'?' · Frist: Welle ':' · Ziel: Welle ') + state.challengeTarget + (state.challengeKind === 'garrison' ? ' · 1.200 Gold · keine Einnahmen' : state.challengeKind === 'movingFortress' ? ' · Vier Stationen, je drei Wellen' : state.challengeKind === 'towerDraft' ? ' · Drei Angebote, eine Wahl' : state.challengeKind === 'expedition' ? ' · Drei Relikte bis Ende Welle 12' : state.challengeKind === 'powerGrid' ? ' · Zwei Generatoren · Sechs Strom' : state.challengeKind === 'villages' ? ' · Drei getrennte Lebensbalken' : state.challengeKind === 'detour' ? ' · Feste Türme · Straßen planen' : state.challengeKind === 'greed' ? ' · Freiwillige Gierverträge' : ' · Sandsturm −15 % Tempo/Reichweite') : '';
    state.drawPile = shuffle(state.deck); drawHand(); tutorial = challengeDay || tutorialSeen || !onboardingHints ? { active: false, step: 0 } : HexTutorial.begin(state); hasActiveRun = true; startSoloPresence(); setMessage(challengeLab ? challengeLab.mission.description : state.challengeKind === 'towerDraft' ? 'Wähle drei Startangebote und platziere die Türme aus deinem Inventar.' : ['villages','powerGrid','movingFortress'].includes(state.challengeKind) ? 'Bereite die Verteidigung auf der Karte vor und starte die erste Welle.' : state.challengeKind === 'garrison' ? 'Verteidige drei Angriffe. 1.200 Gold für die gesamte Mission – keine Einnahmen, keine Verkäufe.' : onboardingHints ? (state.openingRemaining ? 'Zwei Fronten: Wähle zwei der fünf Handkarten und erweitere beide Base-Ausgänge.' : 'Wähle eine Hexkarte und lege sie an die offene Straße der Base.') : ''); renderAll();
    if(state.expedition)showRelicEvents([...state.landmarks.values()].filter(l=>l.relicLocated).map(l=>({kind:'revealed',q:l.q,r:l.r,name:l.relicName})),false);
  }

  const RUN_AUTOSAVE_KEY = 'autohex-solo-autosave-v1';
  function clearRunAutosave() { if (!duoToken) { try { gameStorage.setItem(RUN_AUTOSAVE_KEY, ''); } catch {} } }
  function saveRunAutosave(manual = false) {
    if (duoToken || state?.duoMode || state?.hp <= 0 || (!manual && !state?.lastCompletedWave)) return false;
    try { gameStorage.setItem(RUN_AUTOSAVE_KEY, JSON.stringify({ checkpoint: captureRunCheckpoint(), tutorial, manual, savedAt: Date.now() })); scheduleCloudSave(); return true; }
    catch { setMessage('Speichern fehlgeschlagen. Bitte diesen Tab geöffnet lassen.'); return false; }
  }
  function readRunAutosave() {
    try {
      const raw = gameStorage.getItem(RUN_AUTOSAVE_KEY); if (!raw) return null;
      const saved = JSON.parse(raw), restored = HexRunSnapshot.restore(saved.checkpoint);
      if (!!restored.state.challengePractice !== !!challengeLab || (challengeLab && restored.state.challengeKind !== challengeLab.mission.id) || restored.state.duoMode || restored.state.hp <= 0 || restored.state.phase === 'gameover' || (!saved.manual && (restored.state.waveRunning || !restored.state.lastCompletedWave)) || profile.settledRuns.includes(restored.state.runId)) return null;
      return saved;
    } catch { return null; }
  }
  function suspendSoloRun() {
    if (duoToken) return false;
    if (hasActiveRun && state.hp>0 && state.phase!=='gameover') {
      if (!saveRunAutosave(true)) return false;
      hasActiveRun=false;clearRunTimers();stopSoloPresence();clockDebt=0;
    }
    consumablePick=null;clearBuildingInteraction();
    document.getElementById('settingsDrawer').classList.add('hidden');
    rewardOverlay.classList.add('hidden');document.getElementById('campaignVictory').classList.add('hidden');
    openMainMenu();return true;
  }
  function captureRunCheckpoint() { return HexRunSnapshot.capture(state, random); }
  function applyDeveloperScenario() {
    const scenario = globalThis.HexFirstPlayerTest?.scenario;
    if (!testProfile || duoToken || !scenario) return false;
    profile = HexProfile.save(HexProfile.defaults(), TOWERS);
    pendingLoadout = [...profile.activeLoadout]; pendingHero = profile.activeHero; pendingDifficulty = 'normal';
    // A reload discards UI timers and rebuilds this fixture through real game commands.
    document.getElementById('runSeed').value = 'autohex-developer-v1';
    onboardingHints = scenario === 'tutorial'; tutorialSeen = !onboardingHints;
    hintsToggle.checked = onboardingHints;
    document.getElementById('restartTutorialBtn').disabled = !onboardingHints;
    autoStart.checked = false; changeSpeed(1);
    newRun();
    if (scenario === 'showcase') applyShowcaseScenario();
    else if (scenario !== 'tutorial') {
      state.hand = ['straight'];
      const slot = { ...neighbor(0, 0, 0), index: 0 };
      if (!HexPlacementCommands.place(state, { ...slot, rotation: 0 })) throw new Error('Developer scenario placement failed');
      state.gold = 1000;
      if(scenario==='enemies'){
        for(let q=2;q<=5;q++)state.map.set(key(q,0),{q,r:0,type:'straight',rotation:0,roads:[0,3],slots:1,towers:[],income:0});
        state.hp=state.maxHp=999;state.gold=1000;
      }else if (!HexTowerCommands.buy(state, 'archer', [slot]).ok) throw new Error('Developer scenario tower failed');
      state.gold = scenario === 'enemies'?1000:scenario === 'upgrade-poor' ? 0 : 200;
      state.selectedTower = scenario==='enemies'?null:slot; state.selectedTowers = scenario==='enemies'?[]:[slot];
      state.hotkeyHintDone = true; tutorial.active = false;
    }
    mainMenu.classList.add('hidden'); hasActiveRun = true;
    renderIntroductionMenu(); renderAll();
    setMessage(scenario === 'showcase'?'Designer-Lieferung: Flammenturm ausgewählt, Ultimate kaufbar. Erste Welle bringt Eisenkoloss, Sturmjäger und Seelenmatriarchin; weitere Bosse unter Einstellungen → Entwicklermenü.':scenario === 'enemies'?'Gegnertest: Gegner unter Einstellungen → Entwicklermenü auswählen, dann Welle starten.':scenario === 'tutorial' ? 'Testszenario: Tutorial von Anfang.' : 'Testszenario: Bogenschütze verbessern · ' + state.gold + ' Gold.');
    return true;
  }
  // Temporäre Abnahme der Designer-Lieferung (docs/ASSET_SPEC.md, Abschnitt 0): korrigierte Tiles, Ultimate-Türme, Bossgestalten.
  const SHOWCASE_TILES = ['royalBend', 'bigCurve', 'watchtower', 'mirrorJunction', 'fanJunction', 'sideCross', 'deadEnd'];
  // [Turm, Zweig, Endstufe, schon Ultimate]; der erste Turm bleibt auf der Endstufe, damit der Ultimate-Kauf testbar ist.
  const SHOWCASE_TOWERS = [['flame', 'inferno', 'sunfire', false], ['flame', 'wildfire', 'firestorm', true], ['archer', 'volley', 'arrowRain', true], ['archer', 'marksman', 'eagleEye', true],
    ['ballista', 'harpoon', 'dragonSlayer', true], ['ballista', 'repeater', 'boltStorm', true], ['element', 'elementFire', 'elementVolcano', true], ['element', 'elementWater', 'elementTide', true],
    ['necromancer', 'soulKeeper', 'soulLord', true], ['freeze', 'deepFrost', 'absoluteZero', true], ['chain', 'storm', 'tempest', true], ['catapult', 'siege', 'fortressBreaker', true]];
  function applyShowcaseScenario() {
    const distance = ({ q, r }) => (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
    state.openingRemaining = 0; state.towerLoadout = Object.keys(TOWERS);
    state.ultimateUnlocks = Object.keys(TOWERS).map(type => 'ultimate:' + type);
    for (const type of SHOWCASE_TILES) {
      const spots = [];
      for (const tile of state.map.values()) for (let d = 0; d < 6; d++) {
        const n = neighbor(tile.q, tile.r, d);
        for (let rotation = 0; rotation < 6; rotation++) if (HexPlacementCommands.canPlace(state, n.q, n.r, CARD_LIBRARY[type], rotation)) spots.push({ q: n.q, r: n.r, rotation });
      }
      spots.sort((a, b) => distance(a) - distance(b) || a.q - b.q || a.r - b.r || a.rotation - b.rotation);
      state.phase = 'place'; state.hand = [type];
      if (!spots.length || !HexPlacementCommands.place(state, { ...spots[0], index: 0 })) throw new Error('Developer showcase placement failed: ' + type);
    }
    state.gold = 1e6;
    const slots = [...state.map.values()].filter(tile => tile.type !== 'base').flatMap(tile => Array.from({ length: tile.slots || 0 }, (_, index) => ({ q: tile.q, r: tile.r, index })));
    SHOWCASE_TOWERS.slice(0, slots.length).forEach(([type, branch, final, ultimate], i) => {
      const slot = slots[i], built = HexTowerCommands.buy(state, type, [slot]).ok && HexTowerCommands.upgrade(state, slot, branch) && HexTowerCommands.upgrade(state, slot, final);
      if (!built || (ultimate && !HexTowerCommands.upgrade(state, slot, 'ultimate:' + type))) throw new Error('Developer showcase tower failed: ' + type);
    });
    state.hp = state.maxHp = 999; state.gold = 1000;
    state.selectedTower = slots[0]; state.selectedTowers = [slots[0]];
    devEnemyQueue = ['iron', 'hunter', 'summoner'].map(id => ({ id, count: 1 })); renderDevEnemies();
    state.hotkeyHintDone = true; tutorial.active = false;
  }
  function restoreRunCheckpoint(checkpoint) {
    const restored = HexRunSnapshot.restore(checkpoint); HexDeck.recoverMissing(restored.state); closeSale();
    cancelQuickTower(); clearRunTimers(); resetCameraKeys(); inspectReward('selection');
    state = restored.state; random = restored.random;
    if(!duoToken&&state.hp>0&&!state.waveRunning&&state.phase==='build'&&!state.tunnelOffer&&['tunnel','blocked'].includes(state.drawResult)){
      state.tunnelOffer=HexMap.tunnelPlan(state.map,state.landmarks,true);state.tunnelConfirmed=false;
    }
    Object.assign(state, { selectedCard: null, rotation: 0, selectedSlots: [], selectedTowers: [], showHexGrid, showSlotHints, showUpgradeStatus: document.getElementById('upgradeStatus').checked });
    handRenderKey = forecastRenderKey = ''; deckRenderKeys.clear(); uiWavePlans.clear();
    towerMenuKey = ''; towerPanelKey = ''; buildingPanelKey = ''; pinnedBiome = null; hasActiveRun = true; startSoloPresence();
    last = performance.now(); clockDebt = 0; renderer.reset();
    rewardOverlay.classList.add('hidden'); gameOverOverlay.classList.add('hidden'); document.getElementById('celebration').classList.add('hidden');
    document.getElementById('activeSeed').textContent = state.seed;
    renderSessionPhase();
    setMessage('Runzustand wiederhergestellt.'); renderAll();
  }

  function towerBuildRole(id) {
    const def = TOWERS[id], role = towerRole(id); if (!def.damage) return role;
    const names = { hp: 'Leben', armor: 'Rüstung', magic: 'Magieresistenz' }, multipliers = def.damageMultipliers || {}, best = Math.max(...Object.keys(names).map(k => multipliers[k] ?? 1));
    const strengths = Object.keys(names).filter(k => (multipliers[k] ?? 1) === best); return strengths.length === 3 ? role : role + ', besonders gut gegen ' + strengths.map(k => names[k]).join(' / ');
  }
  function towerRole(id) { return TOWERS[id].role || ({ archer: 'Einzelziel', catapult: 'Linienkontrolle', chain: 'Gruppenschaden', freeze: 'Support' })[id] || 'Spezialist'; }
  function loadoutWarnings(ids) {
    if (ids.length !== 5) return ['Wähle genau fünf unterschiedliche Türme.']; const defs = ids.map(id => TOWERS[id]).filter(Boolean), warnings = [];
    if (!defs.some(t => (t.damageMultipliers?.armor || 1) > (t.damageMultipliers?.hp || 1))) warnings.push('Kein klarer Spezialist gegen Rüstung.');
    if (!defs.some(t => (t.damageMultipliers?.magic || 1) > (t.damageMultipliers?.hp || 1))) warnings.push('Kein klarer Spezialist gegen Magieresistenz.');
    if (!defs.some(t => t.aura)) warnings.push('Kein Supportturm zur Wegkontrolle.');
    if (!defs.some(t => t.splash || t.chain || t.pierce || t.mine)) warnings.push('Kein Turm für Gruppen oder Linien.'); return warnings;
  }
  function closeBasePanel() { state.selectedBase = false; document.getElementById('baseDropdown').open = false; }
  function renderBasePanel() {
    const hero = HexHeroes.hero(state.heroId), weapon = HexHeroes.weapon(state);
    document.getElementById('baseTitle').textContent = hero.name + ' · Base-Ausbau';
    document.getElementById('baseStats').textContent = state.hp + '/' + state.maxHp + ' HP · Mauern ' + state.baseUpgrades.walls + '/' + hero.maxLevel + ' · Waffe ' + state.baseUpgrades.weapon + '/' + hero.maxLevel + ' · Turmplätze: ' + (state.map.get('0,0')?.slots || 0);
    document.getElementById('baseWeaponStats').textContent = weapon ? 'Automatische Verteidigung: ' + weapon.damage + ' Schaden gegen alle Schutzarten · Reichweite ' + weapon.range + ' · alle ' + weapon.cooldown + ' s.' : 'Noch keine Base-Waffe. Errichte die erste Stufe für automatische Verteidigung.';
    for (const [kind, id] of [['walls', 'baseWallsBtn'], ['weapon', 'baseWeaponBtn']]) { const next = HexHeroes.offer(state, kind), button = document.getElementById(id); const reason = HexHeroes.blockReason(state, kind); button.disabled = !!reason; button.title = reason; button.textContent = next ? (kind === 'walls' ? 'Mauern ' + next.level + ': +' + next.hp + ' aktuelle/maximale HP' : 'Base-Waffe ' + next.level + ': ' + HexHeroes.weapon(state, next.level).damage + ' Schaden, Reichweite ' + next.range + ' · ' + next.slots + ' Turmplätze insgesamt') + ' · ' + next.cost + ' Gold' : (kind === 'walls' ? 'Mauern' : 'Base-Waffe') + ': vollständig ausgebaut'; if (reason && next) button.textContent += ' — ' + reason; }
  }
  function renderLoadout() {
    if (pendingDifficulty === 'dual' && !profile.milestones.includes('standard35')) pendingDifficulty = 'normal';
    const difficulties = document.getElementById('difficultyChoices'); difficulties.innerHTML = '';
    for (const [id, name, desc] of [['normal', 'Stufe 1 · Standard', 'Ein Base-Ausgang. Lege eine von drei Handkarten.'], ['dual', 'Stufe 2 · Zwei Fronten', 'Zwei zufällige Base-Ausgänge. Starte mit fünf Handkarten und erweitere beide Ausgänge vor Wave 1.']]) { const button = document.createElement('button'); button.className = 'loadoutChoice' + (id === pendingDifficulty ? ' selected' : ''); button.setAttribute('aria-pressed', String(id === pendingDifficulty)); button.title = desc; button.innerHTML = '<strong>' + name + '</strong><small>' + desc + '</small>'; button.disabled = id === 'dual' && !profile.milestones.includes('standard35'); if (button.disabled) button.innerHTML += '<small class="unlockRequirement">🔒 Stufe 1: Welle 35 besiegen.</small>'; button.addEventListener('click', () => { if (button.disabled) return; pendingDifficulty = id; renderLoadout(); }); difficulties.appendChild(button); }

    const choices = document.getElementById('heroChoices'); choices.innerHTML = '';
    for (const [id, hero] of Object.entries(HexHeroes.definitions)) { const unlocked = HexProfile.heroUnlocked(profile, id); const button = document.createElement('button'); button.type = 'button'; button.className = 'loadoutChoice' + (id === pendingHero ? ' selected' : ''); button.setAttribute('aria-pressed', String(id === pendingHero)); button.title = hero.desc; button.innerHTML = '<strong>' + hero.name + '</strong><small class="heroEffects">' + hero.desc + '</small>'; button.disabled = !unlocked; if (!unlocked) { button.title += (id === 'builder' ? ' Standard: Welle 35 besiegen.' : ' Zwei Fronten: Welle 35 besiegen.'); button.innerHTML += '<small class="unlockRequirement">🔒 ' + (id === 'builder' ? 'Stufe 1: Welle 35 besiegen.' : 'Stufe 2 · Zwei Fronten: Welle 35 besiegen.') + '</small>'; } button.addEventListener('click', () => { if (!unlocked) return; pendingHero = id; renderLoadout(); }); choices.appendChild(button); }

    const presets = document.getElementById('loadoutPresets'); presets.innerHTML = ''; if (profile.unlockedTowers.length <= 5) { const locked = document.createElement('p'); locked.className = 'presetLocked'; locked.textContent = '🔒 Drei Presetplätze werden mit dem ersten zusätzlichen Turm freigeschaltet.'; presets.appendChild(locked); } else profile.loadoutPresets.forEach((preset, index) => {
      const card = document.createElement('article'); card.className = 'presetCard'; const presetTitle = document.createElement('strong'), presetInfo = document.createElement('small'); presetTitle.textContent = preset.name; presetTitle.setAttribute('data-no-translate', '');
      const name = document.createElement('input'); name.type = 'text'; name.value = preset.name; name.maxLength = 30; name.className = 'presetName'; name.setAttribute('aria-label', 'Vorlagenname'); name.setAttribute('data-no-translate', '');
      const rename = document.createElement('button'); rename.className = 'secondary'; rename.textContent = 'Name speichern';
      const commitName = () => { const next = HexProfile.renamePreset(profile, index, name.value, TOWERS); if (next) { profile = next; presetTitle.textContent = profile.loadoutPresets[index].name; name.value = profile.loadoutPresets[index].name; } };
      rename.addEventListener('click', commitName); name.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); event.stopPropagation(); commitName(); } });
      presetInfo.textContent = preset.towers.map(id => TOWERS[id]?.name || id).join(' · '); card.appendChild(presetTitle); card.appendChild(presetInfo); card.appendChild(name); card.appendChild(rename); const load = document.createElement('button'), save = document.createElement('button'); load.className = 'secondary'; load.textContent = 'Laden'; load.addEventListener('click', () => { pendingLoadout = [...preset.towers]; renderLoadout(); }); save.className = 'secondary'; save.textContent = 'Aktuell speichern'; save.disabled = pendingLoadout.length !== 5; save.addEventListener('click', () => { const next = HexProfile.savePreset(profile, index, pendingLoadout, TOWERS); if (next) { profile = next; renderLoadout(); } }); card.appendChild(load); card.appendChild(save); presets.appendChild(card);
    });
    loadoutChoices.innerHTML = '';
    for (const id of profile.unlockedTowers) {
      const tower = TOWERS[id]; if (!tower) continue;
      const selected = pendingLoadout.includes(id), button = document.createElement('button'); button.type = 'button'; button.className = 'loadoutChoice' + (selected ? ' selected' : '');
      button.innerHTML = `${HexArsenal.icon(id, tower.color)}<span class="loadoutRole">${towerRole(id)}</span><strong>${tower.name}</strong><small>${tower.desc}</small><small>${tower.cost} Startpreis · ${towerStatsMarkup(tower)}</small><span class="loadoutCheck">${selected ? '✓ Im Loadout' : 'Auswählen'}</span>`;
      button.title = tower.name + ' · ' + towerRole(id) + ' · ' + tower.desc + ' · ' + tower.cost + ' Gold'; const info = () => { document.getElementById('preparationInfo').textContent = tower.name + ' · ' + towerRole(id) + ' · ' + tower.cost + ' Gold'; document.getElementById('preparationInfo').title = button.title; }; button.addEventListener('mouseenter', info); button.addEventListener('focus', info);
      button.addEventListener('click', () => { if (selected) pendingLoadout = pendingLoadout.filter(value => value !== id); else if (pendingLoadout.length < 5) pendingLoadout.push(id); else { document.getElementById('loadoutWarning').textContent = 'Alle fünf Plätze sind belegt. Wähle zuerst einen markierten Turm ab, um diesen Turm mitzunehmen.'; return; } renderLoadout(); info(); }); loadoutChoices.appendChild(button);
    }
    const warnings = loadoutWarnings(pendingLoadout); document.getElementById('loadoutWarning').title = warnings.join(' '); document.getElementById('loadoutWarning').textContent = pendingLoadout.length === 5 ? '5/5 Türme gewählt.' : 'Wähle genau fünf Türme.';
    document.getElementById('confirmLoadoutBtn').disabled = pendingLoadout.length !== 5; document.getElementById('confirmLoadoutBtn').textContent = loadoutEdit ? 'Loadout speichern' : 'Run starten';
    document.getElementById('cancelLoadoutBtn').textContent = 'Zurück'; document.getElementById('cancelLoadoutBtn').title = hasActiveRun && !loadoutEdit ? 'Zurück zum Run' : 'Zurück zum Hauptmenü';
  }
  let loadoutEdit = false;   // true: vom Hauptmenü geöffnet, Bestätigen speichert nur und startet keinen Run
  function confirmRunRestart() {
    if (duoToken) return true;
    const saved = !hasActiveRun && readRunAutosave(), old = hasActiveRun ? state : saved ? HexRunSnapshot.restore(saved.checkpoint).state : null;
    if (!old || old.phase === 'gameover' || old.hp <= 0) return true;
    const settlementProfile = pendingServerProfile ? HexProfile.readFile(JSON.stringify(pendingServerProfile), TOWERS) : profile;
    const summary = { runId: old.runId, wave: old.wave, ...old.earnedMeta, towers: old.runTowerStats }, dailyWave = old.lastCompletedWave || 0;
    const reward = challengeLab || old.metaSettled || settlementProfile.settledRuns.includes(old.runId) ? 0 : old.challengeDay ? (dailyWave >= (old.challengeTarget || 20) && (old.challengeKind!=='expedition'||old.challengeWon===true) && !settlementProfile.dailyResults?.[old.challengeDay]?.won ? 10 : 0) : HexProfile.runReward(settlementProfile, summary).total;
    if (!globalThis.confirm?.('Dein Durchlauf (Welle ' + old.wave + ') wird beendet. Du erhältst ' + reward + ' Diamanten. Wirklich neu starten?')) return false;
    applyPendingServerProfile();
    if (!old.metaSettled) profile = old.challengeDay ? HexProfile.settleDaily(profile, old.challengeDay, dailyWave, TOWERS, old.challengeTarget || 20, 0, old.challengeKind!=='expedition'||old.challengeWon===true).profile : HexProfile.settleRun(profile, summary, TOWERS).profile;
    old.metaSettled = true; old.phase = 'gameover'; old.waveRunning = false;
    hasActiveRun = false; clearRunTimers(); stopSoloPresence(); clearRunAutosave(); scheduleCloudSave(); return true;
  }
  let pendingChallengeDay=null;
  function openLoadout(edit = false) { pendingChallengeDay=null; if (edit !== true && !confirmRunRestart()) return; if (HexProfile.learning(profile) && !duoToken && !challengeLab) { mainMenu.classList.add('hidden'); newRun(); return; } if (duoToken) { location.assign('/duo-lobby.html'); return; } loadoutEdit = edit === true; pendingDifficulty = profile.difficulty || 'normal'; pendingHero = profile.activeHero; pendingLoadout = [...profile.activeLoadout]; renderLoadout(); loadoutOverlay.classList.remove('hidden'); }
  function confirmLoadout() {
    if (!loadoutEdit && !confirmRunRestart()) return;
    const saved = HexProfile.setLoadout({ ...profile, activeHero: pendingHero, difficulty: pendingDifficulty }, pendingLoadout, TOWERS); if (!saved) return;
    profile = saved; loadoutOverlay.classList.add('hidden');
    if (loadoutEdit) { loadoutEdit = false; openMainMenu(); return; }
    const day=pendingChallengeDay;pendingChallengeDay=null;newRun(profile.activeLoadout,undefined,undefined,day);
  }
  HexRunShare.install(() => state);
  function inspectEndMap(enabled) { gameOverOverlay.setAttribute('aria-modal', String(!enabled)); state.inspectEndMap = enabled; gameOverOverlay.classList.toggle('inspectEndMap', enabled); resetCameraKeys(); }
  function renderRunStatistics() {
    const format = value => (value || 0).toLocaleString(globalThis.HexI18n?.getLanguage() === 'en' ? 'en-US' : 'de-DE', { maximumFractionDigits: 1 });
    // Kompakte Tabelle wie im Ergebnisfenster; Bau, Upgrades und Erstattung stehen in der Kostenzeile darunter (Klick auf eine Zeile).
    const icon = type => TOWERS[type] ? '<span class="runStatsIcon" aria-hidden="true"><span class="hxi hxi-tower_' + type + '"></span></span>' : '';
    const costs = stats => 'Bau: <strong>' + format(stats.buildGold) + '</strong> · Upgrades: <strong>' + format(stats.upgradeGold) + '</strong> · Erstattet: <strong>' + format(stats.refundGold) + ' Gold</strong>';
    const row = (name, stats, support = false, type = '') => { const spent = (stats.buildGold || 0) + (stats.upgradeGold || 0), damage = stats.damage || 0; return '<tr data-run-costs="' + costs(stats).replace(/"/g, '&quot;') + '" data-run-name="' + name.replace(/"/g, '&quot;') + '" tabindex="0"><th scope="row">' + icon(type) + name + '</th><td>' + format(damage) + '</td><td>' + format(stats.kills) + '</td><td>' + format(spent) + '</td><td class="runStatsRatio">' + (support ? 'Support' : spent ? format(damage / spent) : '—') + '</td></tr>'; };
    const table = rows => '<div class="runStatsScroll"><table class="runStatsTable"><thead><tr><th>Turm</th><th>Schaden</th><th>Kills</th><th>Gold gesamt 🪙</th><th>Schaden/🪙</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    const totals = Object.entries(state.runTowerStats).filter(([id]) => TOWERS[id]).sort((a, b) => (b[1].damage || 0) - (a[1].damage || 0));
    const share = HexRunShare.summary(state), bosses = (state.earnedMeta?.periodicBosses || 0) + (state.earnedMeta?.explorationBosses || 0);
    const stat = (iconName, value, label) => '<div><span class="runEndHex" aria-hidden="true"><span class="hxi hxi-' + iconName + '"></span></span><strong>' + format(value) + '</strong><span>' + label + '</span></div>';
    let html = '<div class="runEndStats">' + stat('damage', share.kills, 'Kills') + stat('wave', bosses, 'Bosse besiegt') + stat('coin', share.gold, 'Gold verdient') + '</div>';
    html += '<h3>Turmstatistik</h3>' + (totals.length ? table(totals.map(([id, stats]) => row(TOWERS[id].name, stats, id === 'freeze', id)).join('')) + '<p class="runStatsCosts" aria-live="polite"></p>' : '<p>Keine Türme gebaut.</p>');
    const details = Object.entries(state.runTowerDetails || {}); if (details.length) html += '<details class="runStatsSingles"><summary>Einzelne Türme (' + details.length + ')</summary>' + table(details.map(([id, stats]) => row('#' + id + ' ' + TOWERS[stats.type].name + ' · Hex ' + stats.q + ',' + stats.r + ' · Platz ' + (stats.index + 1) + (stats.sold ? ' · verkauft' : ''), stats, stats.type === 'freeze', stats.type)).join('')) + '</details>';
    html += '<details class="runShareDetails"><summary>Ergebnis teilen</summary>' + HexRunShare.markup(state) + '</details>';
    html += '<p class="hint">Tatsächlich verursachter Schaden an Leben, Rüstung und Magieresistenz, ohne Overkill; inklusive Minen- und Geisterschaden. Ein Kill zählt für den Turm, der den tödlichen Treffer verursacht; Minen und Geister zählen zum Ursprungsturm. Schaden/Gold nutzt die bezahlten Bau- und Verbesserungskosten vor Erstattungen. Rabatte zählen, kostenlose Shrine-Upgrades kosten 0. Freeze unterstützt durch Slow. Base-Waffenschaden separat: ' + format(state.baseDamage) + '.</p>';
    const host = document.getElementById('runStatistics'); host.innerHTML = html;
    // Kostenzeile: erste Zeile vorgewählt, Klick oder Enter wählt eine andere.
    const pick = row => { const line = host.querySelector?.('.runStatsCosts'); if (!line || !row) return; line.innerHTML = (row.querySelector?.('.runStatsIcon')?.outerHTML || '') + '<span><b>' + row.dataset.runName + '</b> – Kosten (gesamt)<br>' + row.dataset.runCosts + '</span>'; for (const other of host.querySelectorAll('tr[data-run-costs]')) other.classList.toggle('picked', other === row); };
    for (const row of host.querySelectorAll?.('tr[data-run-costs]') || []) { row.addEventListener('click', () => pick(row)); row.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pick(row); } }); }
    pick(host.querySelector?.('tr[data-run-costs]'));
  }
  function inspectCampaign(enabled) { const panel = document.getElementById('campaignVictory'); panel.classList.toggle('inspectCampaign', enabled); panel.setAttribute('aria-modal', String(!enabled)); }
  document.getElementById('backToVictoryBtn').addEventListener('click', () => inspectCampaign(false));
  function showCampaignVictory() {
    inspectCampaign(false); clearRunTimers(); resetCameraKeys();
    document.getElementById('endlessBtn').classList.toggle('hidden',['detour','villages','powerGrid','expedition','towerDraft','movingFortress'].includes(state.challengeKind));
    const title = document.getElementById('campaignVictoryTitle'), note = document.getElementById('campaignVictoryNote'); applyPendingServerProfile();
    document.getElementById('dailyVictoryStatistics').classList.toggle('hidden', !state.challengeDay);
    if (state.challengeDay) {
      renderRunStatistics(); document.getElementById('dailyVictoryStatsContent').innerHTML = document.getElementById('runStatistics').innerHTML;
      const settled = HexProfile.settleDaily(profile, state.challengeDay, Math.max(state.challengeTarget || 20, state.lastCompletedWave || 0), TOWERS, state.challengeTarget || 20, 0, state.challengeKind!=='expedition'||state.challengeWon===true); profile = settled.profile; state.metaSettled = true;
      title.textContent = state.challengeKind === 'movingFortress' ? 'Festung sicher angekommen!' : state.challengeKind === 'towerDraft' ? 'Draft gemeistert!' : state.challengeKind === 'expedition' ? 'Expedition erfolgreich!' : state.challengeKind === 'powerGrid' ? 'Das Netz hält!' : state.challengeKind === 'villages' ? 'Alle drei Dörfer gerettet!' : state.challengeKind === 'detour' ? 'Der Umweg hat sich gelohnt!' : state.challengeKind === 'greed' ? 'Dem Fluch widerstanden!' : state.challengeKind === 'garrison' ? 'Die Garnison hält stand!' : 'Die Karawane ist gerettet!';
      document.getElementById('campaignVictoryText').textContent = 'Welle ' + (state.challengeTarget || 20) + ' geschafft!' + (state.challengeKind === 'greed' ? ' Verdientes Gold: ' + (state.greedGold35 ?? HexWaves.greedGold(state)) + '.' : '') + (challengeLab ? ' Testlauf – keine Tagesbelohnung.' : settled.reward ? ' Tagessieg: +10 Diamanten' : ' Tagesbelohnung bereits erhalten.');
      showRunRanking(document.getElementById('victoryRanking'));
      note.textContent = state.challengeKind === 'movingFortress' ? 'Alle vier Stationen verteidigt. Kein Endlosmodus.' : state.challengeKind === 'towerDraft' ? state.challengeTarget+' Wellen mit deiner gedrafteten Verteidigung überlebt. Kein Endlosmodus.' : state.challengeKind === 'expedition' ? 'Alle drei Relikte geborgen und den letzten Angriff überlebt. Kein Endlosmodus.' : state.challengeKind === 'powerGrid' ? 'Zwölf Angriffe mit deiner Stromversorgung abgewehrt. Kein Endlosmodus.' : state.challengeKind === 'villages' ? '20 Angriffe überstanden. Alle drei Dörfer stehen noch! Kein Endlosmodus.' : state.challengeKind === 'detour' ? 'Alle 15 Angriffe abgewehrt. Diese Straßenmission ist abgeschlossen; es gibt keinen Endlosmodus.' : state.challengeKind === 'greed' ? 'Im Endlosmodus gehen Verträge und Goldwertung weiter. Deine Wertung bis Welle 35 bleibt separat gespeichert. Die Tagesbelohnung gibt es nur einmal pro Tag.' : state.challengeKind === 'garrison' ? 'Drei Angriffe abgewehrt! Im optionalen Endlosmodus gelten das verbleibende Budget und die feste Karte weiter.' : 'Spiele mit deiner Karte und deinen Türmen im Endlosmodus weiter. Die Karawanenregeln bleiben aktiv. Die Tagesbelohnung gibt es nur einmal pro Tag.';
    } else {
      const milestone = state.difficulty === 'dual' ? 'dual35' : 'standard35'; if (!profile.milestones.includes(milestone)) profile = HexProfile.save({ ...profile, milestones: [...profile.milestones, milestone] }, TOWERS);
      title.textContent = 'Wave 35 geschafft!';
      document.getElementById('campaignVictoryText').textContent = state.difficulty === 'normal' ? 'Welle 35 geschafft! Zwei Fronten, Festungsbauer, Tagesherausforderung und Duo sind jetzt freigeschaltet.' : 'Zwei Fronten gemeistert! Händlerstadt ist jetzt freigeschaltet.';
      note.textContent = 'Deine Map und Türme bleiben im Endless-Modus erhalten. Diamanten werden beim Beenden des Durchlaufs abgerechnet.';
    }
    showRunRanking(document.getElementById('victoryRanking'));
    document.getElementById('campaignVictory').classList.remove('hidden'); renderAll(); scheduleCloudSave();
  }
  document.getElementById('endlessBtn').addEventListener('click', () => { if (!HexRunSession.endless(state, random)) return; document.getElementById('campaignVictory').classList.add('hidden'); renderSessionPhase(); });
  document.getElementById('victoryMenuBtn').addEventListener('click', () => { if (state.phase !== 'victory') return; document.getElementById('campaignVictory').classList.add('hidden'); state.phase = 'gameover'; showGameOver(); gameOverOverlay.classList.add('hidden'); openMainMenu(); });
  function rememberGreedGold(){
    if(state.challengeKind!=='greed'||state.greedGold35===undefined)return;
    const day=state.challengeDay,old=profile.dailyResults?.[day]||{best:35,won:true};
    profile=HexProfile.save({...profile,dailyResults:{...profile.dailyResults,[day]:{...old,bestGold35:Math.max(old.bestGold35||0,state.greedGold35),bestGoldEndless:Math.max(old.bestGoldEndless||0,state.endless?HexWaves.greedGold(state):0)}}},TOWERS);
  }
  function showRunRanking(host, run = null) {
    rememberGreedGold();
    if (!host) return;
    host.classList.toggle('hidden', !!state.challengeDay && !(state.challengeKind==='greed'&&state.greedGold35!==undefined) || testProfile || !!state.devEnemyRoster);
    if (state.challengeDay && !(state.challengeKind==='greed'&&state.greedGold35!==undefined) || testProfile || state.devEnemyRoster) return;
    const mode=duoToken?'duo':state.difficulty==='dual'?'dual':'single';
    globalThis.HexRunRanking?.show(host,run||globalThis.HexRunRanking.score(state,mode),{onAccount(mode){setAccountMode(mode);openAccount();}});
  }
  // Kopf des Ergebnisfensters: Modus und Spieler, erreichte Welle, Diamanten dieses Durchlaufs.
  function renderRunEndHero(diamonds) {
    const mode = duoToken ? 'Duo' : state.challengeDay ? 'Tägliche Herausforderung' : state.difficulty === 'dual' ? 'Zwei Fronten' : 'Eine Front';
    document.getElementById('runEndSubtitle').textContent = mode + (accountUser ? ' · ' + accountUser.username : '');
    document.getElementById('runEndWave').textContent = 'Welle ' + state.wave;
    const done = Math.max(0, state.lastCompletedWave || 0); document.getElementById('runEndCompleted').textContent = done + (done === 1 ? ' Welle abgeschlossen' : ' Wellen abgeschlossen');
    document.getElementById('runEndDiamonds').textContent = '+' + (diamonds || 0);
    document.querySelector?.('.runEndWindow')?.classList.toggle('isDaily', !!state.challengeDay);
  }
  function showGameOver() {
    clearRunAutosave();
    const ranking = document.getElementById('runRanking');
    showRunRanking(ranking);
    hasActiveRun = false; stopSoloPresence(); resetCameraKeys(); inspectEndMap(false); renderRunStatistics(); applyPendingServerProfile();
    if (state.challengeDay) { const result = HexProfile.settleDaily(profile, state.challengeDay, Math.max(state.challengeWon ? (state.challengeTarget || 20) : 0, state.lastCompletedWave || Math.max(0, state.wave - 1)), TOWERS, state.challengeTarget || 20, 0, state.challengeKind!=='expedition'||state.challengeWon===true); profile = result.profile; state.metaSettled = true; document.getElementById('gameOverTitle').textContent = state.challengeKind === 'movingFortress' ? (state.challengeWon?'Festung sicher angekommen!':'Die Festung ist gefallen') : state.challengeKind === 'towerDraft' ? (state.challengeWon?'Draft gemeistert!':'Draft gescheitert') : state.challengeKind === 'expedition' ? (state.challengeWon?'Expedition erfolgreich!':state.expedition.failed?'Expedition gescheitert · Relikte fehlen':'Expedition gescheitert') : state.challengeKind === 'powerGrid' ? (state.challengeWon?'Das Netz hält!':'Stromnetz überrannt') : state.challengeKind === 'villages' ? (state.challengeWon?'Alle drei Dörfer gerettet!':'Ein Dorf ist gefallen') : state.challengeKind === 'detour' ? (state.challengeWon ? 'DER UMWEG HAT SICH GELOHNT!' : 'Die Straße hielt nicht stand') : state.challengeKind === 'greed' ? (state.challengeWon ? 'DEM FLUCH WIDERSTANDEN!' : 'Der Gier erlegen') : state.challengeKind === 'garrison' ? (state.challengeWon ? 'DIE GARNISON HÄLT STAND!' : 'Die Garnison ist gefallen') : (state.challengeWon ? 'DIE KARAWANE IST GERETTET!' : 'Die Karawane ist gefallen'); document.getElementById('gameOverResult').textContent = (state.challengeKind === 'movingFortress' ? 'Wandernde Festung' : state.challengeKind === 'towerDraft' ? 'Turm-Draft' : state.challengeKind === 'expedition' ? 'Expedition ins Unbekannte · '+state.expedition.collected.length+'/3 Relikte' : state.challengeKind === 'powerGrid' ? 'Stromnetz' : state.challengeKind === 'villages' ? 'Drei Dörfer' : state.challengeKind === 'detour' ? 'Die Kunst des Umwegs' : state.challengeKind === 'greed' ? 'Der Fluch der Gier · Verdientes Gold: ' + HexWaves.greedGold(state) : state.challengeKind === 'garrison' ? 'Die letzte Garnison' : 'Die letzte Karawane') + ' · ' + state.challengeDay + ' · ' + (state.challengeWon ? (state.endless ? 'Endlosmodus · Wave ' + state.wave + ' erreicht' : 'Welle ' + (state.challengeTarget || 20) + ' überlebt!') : 'Wave ' + state.wave + ' erreicht'); document.getElementById('diamondBreakdown').textContent = challengeLab ? 'Testlauf – keine Tagesbelohnung oder Bestenliste.' : result.reward ? 'Tagessieg: +10 Diamanten' : state.challengeWon ? 'Tagesbelohnung bereits erhalten.' : 'Keine Tagesbelohnung – versuche es erneut!'; document.getElementById('gameOverDiamonds').textContent = profile.diamonds; document.getElementById('gameOverBest').textContent = profile.dailyResults[state.challengeDay].best; gameOverOverlay.classList.remove('hidden'); return; }
    document.getElementById('gameOverTitle').textContent = 'Durchlauf beendet';
    let reward = { wave: 0, bosses: 0, milestones: 0, total: 0, duplicate: true };
    if (!state.metaSettled) { const settled = HexProfile.settleRun(profile, { runId: state.runId, wave: state.wave, ...state.earnedMeta, towers: state.runTowerStats }, TOWERS); profile = settled.profile; reward = settled.reward; state.metaSettled = true; }
    document.getElementById('gameOverResult').textContent = `Wave ${state.wave} erreicht · ${state.earnedMeta.normalKills} normale Gegner · ${state.earnedMeta.periodicBosses + state.earnedMeta.explorationBosses} Bosse besiegt`;
    document.getElementById('diamondBreakdown').innerHTML = `<div><strong>+${reward.wave}</strong>Wave-Fortschritt</div><div><strong>+${reward.bosses}</strong>Boss-Siege</div><div><strong>+${reward.milestones}</strong>Neue Bestmarken</div>`;
    document.getElementById('gameOverDiamonds').textContent = profile.diamonds; document.getElementById('gameOverBest').textContent = profile.records.highestWave;
    renderRunEndHero(reward.total);
    document.getElementById('profileDiamonds').textContent = profile.diamonds; document.getElementById('runDiamonds').textContent = '(+0)'; gameOverOverlay.classList.remove('hidden'); saveRunToCloud();
  }
  let resetArsenalPending = false;
  function renderArsenal(message = '') {
    document.getElementById('arsenalDiamonds').textContent = profile.diamonds;
    const onUnlock = (kind, id) => { const method = { activateUltimate: HexProfile.activateUltimate, tower: HexProfile.unlockTower, ultimate: HexProfile.unlockUltimate, building: HexProfile.unlockBuilding }[kind], next = method(profile, id, TOWERS); if (!next) return; profile = next; resetArsenalPending = false; scheduleCloudSave(); renderLoadout(); renderArsenal('Freigeschaltet. Ab dem nächsten Run verfügbar.'); renderUI(); };
    HexArsenal.render(document.getElementById('arsenalChoices'), profile, onUnlock, document.getElementById('arsenalTabs'), arsenalNotifications, () => { updateArsenalHint(); saveGameSettings(); });
    // Test-Ansicht „Baum“ (classes/arsenal-tree.js): gleiche Daten, gleiche Freischaltung. HexArsenalTree ist „const“, daher typeof statt globalThis.
    if (typeof HexArsenalTree !== 'undefined') HexArsenalTree.render(document.getElementById('arsenalTree'), HexArsenal.trees(profile), profile, onUnlock);
    const refund = HexProfile.resetValue(profile), button = document.getElementById('resetDiamondsBtn'); button.disabled = refund === 0; button.textContent = resetArsenalPending ? 'Bestätigen: alle Freischaltungen zurücksetzen · +' + refund + ' ◆' : 'Reset · +' + refund + ' ◆';
    document.getElementById('arsenalMessage').textContent = message || '';
  }
  document.getElementById('resetDiamondsBtn').addEventListener('click', () => { if (!resetArsenalPending) { resetArsenalPending = true; renderArsenal('Alle Turm- und Meta-Freischaltungen werden entfernt; Loadouts werden auf die fünf Starttürme zurückgesetzt. Ein bereits laufender Run behält seine Startauswahl. Erneut klicken zum Bestätigen.'); return; } const result = HexProfile.resetUnlocks(profile, TOWERS); profile = result.profile; scheduleCloudSave(); pendingLoadout = [...profile.activeLoadout]; resetArsenalPending = false; renderLoadout(); renderArsenal(result.refund + ' Diamanten erstattet. Du kannst dich neu entscheiden.'); renderUI(); });
  function openArsenal() { resetArsenalPending = false; renderArsenal(); arsenalOverlay.classList.remove('hidden'); }
  // Ansicht im Arsenal: Baum oder Werkstatt; gilt für diese Sitzung.
  for (const button of document.querySelectorAll?.('[data-arsenal-view]') || []) button.addEventListener('click', () => { arsenalOverlay.dataset.view = button.dataset.arsenalView; for (const other of document.querySelectorAll('[data-arsenal-view]')) other.setAttribute('aria-pressed', String(other === button)); });

  function toggleUpgradeStatus(value = !state.showUpgradeStatus) { state.showUpgradeStatus = value; document.getElementById('upgradeStatus').checked = value; saveGameSettings(); renderBoard(); }
  document.getElementById('upgradeStatus').addEventListener('change', e => toggleUpgradeStatus(e.target.checked));
  const slotToggle = document.getElementById('slotHints'); slotToggle.checked = showSlotHints; slotToggle.addEventListener('change', () => { showSlotHints = slotToggle.checked; state.showSlotHints = showSlotHints; try { gameStorage.setItem('slotHints', String(showSlotHints)); } catch { } saveGameSettings(); renderBoard(); });
  document.getElementById('skipTutorialBtn').addEventListener('click', () => { finishTutorial(); renderAll(); });
  document.getElementById('tutorialNextBtn').addEventListener('click', () => { tutorialEvent(tutorial.step === 4 ? 'skipUpgrade' : 'health'); renderAll(); });
  const hintsToggle = document.getElementById('onboardingHints'); hintsToggle.checked = onboardingHints; document.getElementById('restartTutorialBtn').disabled = !onboardingHints;
  hintsToggle.addEventListener('change', () => { onboardingHints = hintsToggle.checked; try { gameStorage.setItem('onboardingHints', String(onboardingHints)); } catch { } if (!onboardingHints) { tutorial.active = false; state.biomeIntro = null; } document.getElementById('restartTutorialBtn').disabled = !onboardingHints; saveGameSettings(); renderAll(); });
  document.getElementById('restartTutorialBtn').addEventListener('click', () => { if (!onboardingHints) return; tutorial = HexTutorial.begin(state); document.getElementById('settingsDrawer').classList.add('hidden'); renderAll(); });
  const gridToggle = document.getElementById('hexGrid'); gridToggle.checked = showHexGrid;
  function setHexGrid(enabled) { showHexGrid = enabled; gridToggle.checked = enabled; state.showHexGrid = enabled; try { gameStorage.setItem('hexGrid', String(enabled)); } catch { } saveGameSettings(); renderBoard(); }
  gridToggle.addEventListener('change', () => setHexGrid(gridToggle.checked));
  document.getElementById('baseDropdown').addEventListener('toggle', () => { state.selectedBase = document.getElementById('baseDropdown').open; renderBoard(); });
  for (const [kind, id] of [['walls', 'baseWallsBtn'], ['weapon', 'baseWeaponBtn']]) document.getElementById(id).addEventListener('click', () => { if (duoToken) { duoAction('baseUpgrade', { kind }); return; } if (HexHeroes.buy(state, kind)) { sound.play('build'); renderAll(); } });
  if (typeof ResizeObserver !== 'undefined') { const observer = new ResizeObserver(() => requestAnimationFrame(layoutMenus)); for (const node of document.querySelectorAll('.gameHeader,.dockBR,.handDock,.mapControls,.dockBL')) observer.observe(node); }
  globalThis.addEventListener?.('hexlanguagechange', () => { uiLanguageRevision++; saveGameSettings(); if (state) { renderRunStatistics(); renderUI(); } }); globalThis.addEventListener?.('hexinputchange', () => { if (state) renderAll(); }); globalThis.addEventListener?.('resize', layoutMenus); document.addEventListener('toggle', layoutMenus, true); document.addEventListener('click', () => requestAnimationFrame(layoutMenus));
  document.getElementById('hotkeyTipOpen').addEventListener('click', openHotkeySettings);
  document.getElementById('hotkeyTipClose').addEventListener('click', () => { state.hotkeyHintDone = true; renderHotkeyTip(); });
  document.getElementById('hotkeyHelp').addEventListener('toggle', renderHotkeyTip);
  document.addEventListener('click', () => renderHotkeyTip());
  document.getElementById('rotateHexBtn').addEventListener('click', () => rotateSelected());
  document.getElementById('redrawHandBtn').addEventListener('click',()=>{if(duoToken){duoAction('redraw');return;}if(HexRewards.redraw(state,random)){renderSessionPhase();saveRunAutosave();}});
  let selectedMerchantSite=null;
  function merchantSite(){if(state.map.get(selectedMerchantSite)?.site==='merchant')return selectedMerchantSite;const tile=[...state.map.values()].find(t=>t.site==='merchant');return tile?key(tile.q,tile.r):null;}

  function closeGreed(){document.getElementById('greedOverlay').classList.add('hidden');document.getElementById('greedOpenBtn').focus?.();}
  let draftPanelKey='';
  function renderChallengeGuide(){
    const box=document.getElementById('challengeGuide'),active=!!state.challengeDay;
    box.classList.toggle('hidden',!active);if(!active)return;
    const mission=HexWaves.daily(state.challengeDay),completed=state.lastCompletedWave||Math.max(0,state.wave-(state.waveRunning?1:0));
    document.getElementById('challengeGoal').textContent=mission.name+(state.challengeKind==='expedition'?' · ◆ '+state.expedition.collected.length+'/3 Relikte':' · Geschafft: '+completed+'/'+(state.challengeTarget||mission.target)+' Wellen');
    const hints={
      greed:'Erreiche Welle 35 und verdiene so viel Gold wie möglich. Vor jeder Welle wählst du einen von drei wechselnden Risikoverträgen oder Kein Vertrag. Ausgegebenes Gold zählt weiterhin; Verkäufe zählen nicht. Danach ist Endlos möglich.',
      detour:'15 Angriffe, zehn feste Türme. Erst sechs, danach zwei Straßen; ab Welle 6 drei. Neue Karten nach Welle 3, 6 und 9. Karten bleiben im Vorrat. Starte direkt mit Welle starten; ungenutzte Platzierungen verfallen.',
      villages:'Alle drei Dörfer müssen 20 Wellen überleben. Die Markierungen zeigen Eingang und Ziel. Gemeinsame Wege nutzen; zwischen Wellen zwei Türme kostenlos umsetzen.',
      powerGrid:'Überlebe zwölf Wellen. Klicke die Blitzsymbole auf der Karte: bis zu sechs benachbarte Leitfelder mit einem Generator verbinden. Gelbe Felder versorgen alle Türme darauf automatisch. Graue Felder sind aus; orange Felder sind eingeschaltet, aber nicht verbunden. Während der Welle bleibt die Auswahl fest.',
      expedition:'Das erste Relikt ist markiert; nach einer Bergung wird das nächste sichtbar. Relikte sind die goldenen ◆-Missionsfelder. Verbinde alle drei über Straßen mit der Basis und überlebe danach eine Welle. Je früher, desto besser; spätestens Welle 12. Aufdecken allein reicht nicht! Zwei Hexe pro Bauphase, Ausgespielte Karten werden sofort durch neue ersetzt. Danach Planung abschließen.',
      towerDraft:'Wähle vor dem ersten Angriff drei Angebote, danach eines nach jeder zweiten Welle. Ziehe gewählte Türme direkt auf freie Bauplätze oder wähle sie links. Tickets am gebauten Turm auch während der Welle einlösen. Klicken legt einen Turm ins Inventar; Ziehen platziert ihn direkt. Nach jeder Welle wächst die Karte um ein Hex. Angebote und Erweiterungen ändern sich mit jedem Durchlauf. Ziel: 35 Wellen; kein Gold.',
      movingFortress:'Überlebe zwölf Wellen. Nach Welle 3, 6 und 9 zieht die Festung weiter. Alle vier Stationen liegen auf derselben verbundenen Karte. Die Festung teleportiert sich; deine Türme bleiben stehen. Beim Wechsel kannst du sie kostenlos umsetzen.',
      caravan:'Überlebe zwanzig Wellen auf zwei Fronten. Erst beide Basis-Ausgänge verlängern. Goldtransporter geben 18 Gold; bei Durchbruch verlierst du bis zu 10 Gold. Der Sandsturm senkt Reichweite und Gegnertempo.',
      garrison:'Überlebe drei schwere Angriffe mit insgesamt 1200 Gold. Keine Einnahmen und keine neuen Hexe. Baue und verbessere deine Verteidigung vor dem ersten Angriff; Restgold bleibt für spätere Anpassungen.'
    };
    document.getElementById('challengeInstructions').textContent=hints[state.challengeKind]||'';
  }
  function renderDraft(){
    const active=state.challengeKind==='towerDraft';document.getElementById('draftControls').classList.toggle('hidden',!active||state.waveRunning||state.phase!=='build');if(!active){draftPanelKey='';return;}
    const d=state.towerDraft,enabled=HexTowerDraft.planning(state);
    document.getElementById('draftStatus').textContent=(state.wave===0?'WÄHLE DEINE 3 STARTTÜRME · '+(3-d.picks)+'/3 gewählt':d.picks?'WÄHLE 1 VERSTÄRKUNG':'Vorbereitung')+' · Ziel: '+state.challengeTarget+' Wellen · Tickets: '+d.upgrades;
    const growthInterval=d.rulesVersion>=3?1:d.rulesVersion===2?5:3,nextGrowth=(Math.floor(state.wave/growthInterval)+1)*growthInterval;
    document.getElementById('draftGrowth').textContent=(nextGrowth<state.challengeTarget?'Karte wächst nach Welle '+nextGrowth+' um '+(d.rulesVersion>=3?'1 Straßenhex':'2 Straßenhexe')+' am Gegner-Eingang.':'Karte vollständig erweitert.')+' Nachschub: alle 2 Wellen.';
    const signature=JSON.stringify([d.offers,d.serial,enabled]);if(signature!==draftPanelKey){draftPanelKey=signature;const container=document.getElementById('draftOffers');container.innerHTML='';d.offers.forEach((o,index)=>{const b=document.createElement('button');b.className='draftCard';b.dataset.kind=o.kind;b.innerHTML=o.kind==='tower'?HexArsenal.icon(o.type,TOWERS[o.type].color):'<span class="draftSymbol" aria-hidden="true"><span class="hxi hxi-'+(o.kind==='upgrade'?'upgrade':'heart')+'"></span></span>';const caption=document.createElement('strong');caption.textContent=o.kind==='tower'?'1 × '+TOWERS[o.type].name:o.kind==='upgrade'?(o.count||1)+' Upgrade-Tickets':'Reparatur: +5 Leben';b.appendChild(caption);const help=document.createElement('small');help.textContent=o.kind==='tower'?'Direkt auf einen Bauplatz ziehen oder antippen':o.kind==='upgrade'?'Am gebauten Turm einlösen':'Sofort +5 Leben';b.appendChild(help);b.disabled=!enabled;let pointerChosen=false;const serial=d.serial;b.addEventListener('pointerdown',event=>{if(event.button!==0||o.kind!=='tower'||state.towerDraft.serial!==serial)return;event.preventDefault();event.stopPropagation();pointerChosen=true;document.getElementById('draftControls').setPointerCapture?.(event.pointerId);quickPointer={id:event.pointerId,type:o.type,x:event.clientX,y:event.clientY,moved:false,draft:{index,serial}};});b.addEventListener('click',()=>{if(pointerChosen||state.towerDraft.serial!==serial)return;if(HexTowerDraft.choose(state,index)){renderAll();saveRunAutosave(true);}});container.appendChild(b);});}
    if(d.picks&&!state.waveRunning){startWaveBtn.disabled=true;startWaveBtn.textContent='Zuerst Draft wählen';}
  }
  document.getElementById('devFortressStart').addEventListener('click',()=>{if(!testProfile||!globalThis.HexFirstPlayerTest?.enabled||duoToken){setMessage('Starte zuerst das isolierte Erstspieler-Testprofil im Dev-Modus.');return;}newRun(undefined,undefined,undefined,'2026-12-07');mainMenu.classList.add('hidden');document.getElementById('settingsDrawer').classList.add('hidden');renderAll();});
  document.getElementById('devDraftStart').addEventListener('click',()=>{if(!testProfile||!globalThis.HexFirstPlayerTest?.enabled||duoToken){setMessage('Starte zuerst das isolierte Erstspieler-Testprofil im Dev-Modus.');return;}newRun(undefined,undefined,undefined,'2026-11-29');mainMenu.classList.add('hidden');document.getElementById('settingsDrawer').classList.add('hidden');renderAll();});
  let relicEffects=[];
  function showRelicEvents(events,focus=true){
    if(events.some(e=>e.kind==='claimed')&&events.some(e=>e.kind==='revealed')){const owner=state,reveals=events.filter(e=>e.kind==='revealed');schedule(()=>{if(state===owner)showRelicEvents(reveals,focus);},1300);events=events.filter(e=>e.kind!=='revealed');}
    const host=document.getElementById('relicEffects');
    for(const e of events){
      sound.play(e.kind==='claimed'?'relicClaim':'relicReveal');
      const el=document.createElement('div');el.className='relicBurst '+e.kind;
      const label=document.createElement('strong');label.textContent=(e.kind==='claimed'?'◆ Geborgen: ':'◆ Entdeckt: ')+e.name;el.appendChild(label);
      for(let i=0;i<12;i++){const star=document.createElement('i');star.textContent='✦';const angle=i*Math.PI/6;star.style.setProperty?.('--dx',Math.cos(angle)*(e.kind==='claimed'?110:75)+'px');star.style.setProperty?.('--dy',Math.sin(angle)*(e.kind==='claimed'?90:60)+'px');el.appendChild(star);}
      host.appendChild(el);relicEffects.push({el,point:axialToWorld(e.q,e.r),until:performance.now()+2600,owner:state});
    }
    const reveal=events.find(e=>e.kind==='revealed');if(focus&&reveal&&!state.waveRunning)renderer.focusAt?.(axialToWorld(reveal.q,reveal.r));
    positionRelicEffects();
  }
  function positionRelicEffects(){
    relicEffects=relicEffects.filter(f=>{if(f.owner!==state||performance.now()>f.until){f.el.remove?.();return false;}const p=renderer.project(f.point,20),box=document.querySelector?.('.boardWrap')?.getBoundingClientRect();f.el.style.display=p?'':'none';if(p){f.el.style.left=(p.x+(box?.left||0))+'px';f.el.style.top=(p.y+(box?.top||0))+'px';}return true;});
  }
  let deadlineOwner=null,deadlineWave=null;
  function renderExpedition(){
    const active=state.challengeKind==='expedition';document.getElementById('expeditionControls').classList.toggle('hidden',!active);document.getElementById('expeditionDeadline').classList.toggle('hidden',!active);if(!active)return;
    document.getElementById('expeditionProgress').textContent='◆ Relikte geborgen: '+state.expedition.collected.length+'/3 · '+(state.expedition.collected.length===3?'Alle geborgen! Noch eine Welle überleben.':'Straße zu ◆ bauen und andocken.')+' · Platzierungen: '+state.expedition.remaining+'/2';
    document.getElementById('expeditionRelics').textContent=[...state.landmarks.values()].map(l=>(l.claimed?'✓ ':'◆ ')+l.relicName+': '+(l.claimed?'geborgen':HexExploration.visibility(state.map,l)==='clear'?'Straße anschließen':'erkunden & anschließen')).join('\n');
    const left=Math.max(0,12-(state.lastCompletedWave||0)),deadline=document.getElementById('expeditionDeadline');deadline.textContent='⌛ Noch '+left+' Wellen · Frist: Ende Welle 12';deadline.classList.toggle('urgent',left<=3);if(deadlineOwner===state.runId&&deadlineWave!==null&&left<deadlineWave){sound.play(left<=3?'deadlineUrgent':'deadline');deadline.classList.remove('deadlineTick');void deadline.offsetWidth;deadline.classList.add('deadlineTick');}deadlineOwner=state.runId;deadlineWave=left;
    const button=document.getElementById('expeditionReadyBtn');button.disabled=!HexExpedition.planning(state)||(state.phase==='place'?!HexRunRuntime.spawnSources(state).length:!state.expedition.remaining);button.textContent=state.phase==='place'?'Planung abschließen':'Planung fortsetzen';
  }
  document.getElementById('expeditionReadyBtn').addEventListener('click',()=>{if(state.phase==='place'?HexExpedition.finishPlanning(state):HexExpedition.resumePlanning(state)){renderAll();saveRunAutosave(true);}});
  document.getElementById('devExpeditionStart').addEventListener('click',()=>{
    if(!testProfile||!globalThis.HexFirstPlayerTest?.enabled||duoToken){setMessage('Starte zuerst das isolierte Erstspieler-Testprofil im Dev-Modus.');return;}
    newRun(undefined,undefined,undefined,'2026-11-22');mainMenu.classList.add('hidden');document.getElementById('settingsDrawer').classList.add('hidden');renderAll();
  });
  function renderPowerGrid(){
    const active=state.challengeKind==='powerGrid',toggle=document.getElementById('powerTowerBtn');
    document.getElementById('powerControls').classList.toggle('hidden',!active);toggle.classList.toggle('hidden',!active||state.powerGrid?.version===2);if(!active){document.getElementById('powerEditor').open=false;return;}
    const grid=state.powerGrid,network=HexPowerGrid.evaluate(state),planning=HexPowerGrid.planning(state);
    if(grid.version===2){document.getElementById('powerStatus').textContent='⚡ '+grid.enabled.length+'/6 Leitfelder · '+network.used+' Türme versorgt';document.getElementById('powerHint').textContent=planning?'Klicke ⚡ auf der Karte. Verbinde bis zu 6 benachbarte Leitfelder mit einem Generator. Gelb: alle Türme darauf greifen an. Grau: kein Strom. Orange: eingeschaltet, aber nicht verbunden.':'⚡ Gelb = versorgt. Stromnetz während der Welle gesperrt.';document.getElementById('powerEditor').classList.add('hidden');return;}document.getElementById('powerEditor').classList.remove('hidden');
    document.getElementById('powerStatus').textContent='Stromnetz: '+network.used+'/'+network.capacity+' Türme versorgt · Leitfelder: '+grid.enabled.length+'/'+grid.limit;
    document.getElementById('powerHint').textContent=planning?(grid.enabled.length>=grid.limit?'Alle sechs Leitfelder sind an. Schalte zuerst ein Feld aus, um ein anderes einzuschalten.':'Verbinde benachbarte eingeschaltete Felder mit einem Generator. Straßenanschlüsse spielen für Strom keine Rolle.'):'Welle läuft: Die Versorgung ist bis zum letzten Gegner festgelegt. Auch bei Pause kannst du erst danach umschalten.';
    const fields=document.getElementById('powerFields'),fieldKey=JSON.stringify([grid.enabled,planning,uiLanguageRevision]);
    if(fields.dataset.powerKey!==fieldKey){fields.dataset.powerKey=fieldKey;fields.innerHTML='';
    for(const node of grid.nodes.filter(n=>!n.capacity)){
      const on=grid.enabled.includes(node.key),button=document.createElement('button');button.className='secondary';const component=network.components.find(c=>c.keys.includes(node.key));button.textContent=node.name+' · '+(on?'EIN':'AUS')+'\n'+(on?(component?.capacity?'Generator verbunden':'Kein Generator verbunden'):'Leitet keinen Strom');button.setAttribute('aria-pressed',String(on));button.disabled=!planning||!on&&grid.enabled.length>=grid.limit;
      button.addEventListener('click',()=>{if(HexPowerGrid.toggleField(state,node.key)){renderAll();saveRunAutosave(true);}});fields.appendChild(button);
    }
    }
    const towerList=document.getElementById('powerTowers'),entries=[...state.map.values()].flatMap(t=>(t.towers||[]).flatMap((tw,index)=>tw?[{tw,slot:{q:t.q,r:t.r,index},node:grid.nodes.find(n=>n.key===key(t.q,t.r))}]:[]));
    const towerKey=JSON.stringify([planning,uiLanguageRevision,entries.map(e=>[e.tw.statId,e.tw.type,e.tw.powerOff,network.status.get(e.tw.statId),e.slot])]);
    if(towerList.dataset.powerKey!==towerKey){towerList.dataset.powerKey=towerKey;towerList.innerHTML='';
      if(!entries.length)towerList.textContent='Noch keine Türme gebaut. Schließe diese Übersicht und wähle einen freien Bauplatz.';
      for(const {tw,slot,node}of entries){const button=document.createElement('button');button.className='secondary';button.disabled=!planning;button.setAttribute('aria-pressed',String(!tw.powerOff));button.textContent=TOWERS[tw.type].name+' · '+(node?.name||'Generator')+'\n'+HexPowerGrid.reasons[network.status.get(tw.statId)]+' · '+(tw.powerOff?'Einschalten':'Ausschalten');button.addEventListener('click',()=>{if(HexPowerGrid.toggleTower(state,slot)){renderAll();saveRunAutosave(true);}});towerList.appendChild(button);}
    }
    const selected=state.selectedTower,tw=selected?state.map.get(key(selected.q,selected.r))?.towers[selected.index]:null;
    toggle.textContent=tw?HexPowerGrid.reasons[network.status.get(tw.statId)]+' · '+(tw.powerOff?'Strom einschalten':'Strom ausschalten'):'Stromversorgung';
    toggle.disabled=!planning||!tw||selections('Tower').length>1;
    if(!planning)for(const button of towerButtons.values())button.disabled=true;
  }
  document.getElementById('powerCloseBtn').addEventListener('click',()=>{document.getElementById('powerEditor').open=false;});
  document.getElementById('powerTowerBtn').addEventListener('click',()=>{if(HexPowerGrid.toggleTower(state,state.selectedTower)){renderAll();saveRunAutosave(true);}});
  function renderVillages(){
    const moving=state.challengeKind==='movingFortress',active=state.challengeKind==='villages'||moving,move=document.getElementById('villageMoveBtn');
    document.getElementById('villageControls').classList.toggle('hidden',!active);
    move.classList.toggle('hidden',!active);if(!active)return;
    if(moving){
      const f=state.movingFortress,planning=HexMovingFortress.planning(state);if(!planning)state.villageMove=null;
      document.getElementById('villageHealth').textContent='Wandernde Festung · '+f.stations[f.stage].name+' · '+state.hp+'/'+state.maxHp+' Leben';
      document.getElementById('villageTargets').textContent='Wellen '+(f.stage*3+1)+'–'+(f.stage*3+3)+(f.stage<3?' · Nächster Halt: '+f.stations[f.stage+1].name:' · Letzte Station');
      document.getElementById('villageMoves').textContent=state.villageMove?'Freien Bauplatz wählen · Escape: abbrechen':f.relocation?'Etappenwechsel: alten Turm wählen → Umsetzen → freien Platz an neuer Station wählen':'Umsetzen nach Welle 3, 6 und 9';
      document.getElementById('villageMoveCancel').classList.toggle('hidden',!state.villageMove);move.disabled=!planning||!f.relocation||!state.selectedTower||selections('Tower').length>1;return;
    }
    if(!HexVillages.planning(state))state.villageMove=null;
    const v=state.villages,targets=HexVillages.targets(state.waveRunning?state.wave:Math.min(state.challengeTarget,state.wave+1));
    document.getElementById('villageHealth').textContent=v.goals.map(g=>g.name+': '+g.hp+'/'+g.maxHp).join(' · ');
    document.getElementById('villageTargets').textContent=(state.waveRunning?'Unter Angriff: ':'Nächster Angriff: ')+targets.map(i=>v.goals[i].name).join(' + ');
    document.getElementById('villageMoves').textContent=state.villageMove?'Freien Bauplatz wählen · Escape: abbrechen':'Kostenlose Umzüge: '+v.moves+'/2';
    document.getElementById('villageMoveCancel').classList.toggle('hidden',!state.villageMove);
    move.disabled=!HexVillages.planning(state)||v.moves<=0||!state.selectedTower||selections('Tower').length>1;
  }
  document.getElementById('villageMoveBtn').addEventListener('click',()=>{
    if(!state.selectedTower||(state.challengeKind==='movingFortress'?(!HexMovingFortress.planning(state)||!state.movingFortress.relocation):(!HexVillages.planning(state)||state.villages.moves<=0)))return;
    state.villageMove={...state.selectedTower};state.dragTower=null;state.selectedSlot=null;renderAll();
  });
  document.getElementById('villageMoveCancel').addEventListener('click',()=>{state.villageMove=null;renderAll();});
  document.getElementById('devVillagesStart').addEventListener('click',()=>{
    if(!testProfile||!globalThis.HexFirstPlayerTest?.enabled||duoToken){setMessage('Starte zuerst das isolierte Erstspieler-Testprofil im Dev-Modus.');return;}
    newRun(undefined,undefined,undefined,'2026-11-08');mainMenu.classList.add('hidden');document.getElementById('settingsDrawer').classList.add('hidden');renderAll();
  });
  function renderDetour(){
    const active=state.challengeKind==='detour',planning=active&&HexDetour.planning(state);
    document.getElementById('detourControls').classList.toggle('hidden',!planning);
    if(!active)return;
    document.getElementById('detourStatus').textContent='Angriff '+Math.min(state.challengeTarget,state.wave+1)+' / '+state.challengeTarget+' · '+state.detour.remaining+' Straßen platzierbar';
    document.getElementById('detourStock').textContent='Karten bleiben im Vorrat. Nach jeder Welle gibt es Nachschub. Neue Karten nach Welle 3, 6 und 9. Starte den Angriff mit „Welle starten“, sobald deine Straße bereit ist.';
  }
  document.getElementById('devDetourStart').addEventListener('click',()=>{
    if(!testProfile||!globalThis.HexFirstPlayerTest?.enabled||duoToken){setMessage('Starte zuerst das isolierte Erstspieler-Testprofil im Dev-Modus.');return;}
    newRun(undefined,undefined,undefined,'2026-11-01');mainMenu.classList.add('hidden');document.getElementById('settingsDrawer').classList.add('hidden');renderAll();
  });
  // Vertragssymbole aus dem Hexwerk-Iconsatz; „×2“ und „—“ bleiben als Schrift.
  const GREED_ICONS={swarm:'wave',healers:'heart',elite:'vsArmor',boss:'boss',haste:'speed3',bulwark:'vsMagic',giants:'upgrade'};
  function renderGreed(){
    const active=state.challengeKind==='greed'&&state.hp>0&&state.phase==='build'&&!state.waveRunning&&!state.celebrationActive&&state.greedContract?.wave!==state.wave+1;
    document.getElementById('greedOpenBtn').classList.add('hidden');document.getElementById('greedOverlay').classList.add('hidden');
    const dock=document.getElementById('greedDock');dock.classList.toggle('hidden',!active);if(!active)return;
    document.getElementById('greedDockStatus').textContent='Welle '+(state.wave+1)+' · Verdient: '+HexWaves.greedGold(state)+' Gold · Wähle einen Vertrag oder „Kein Vertrag“. Vertragsgold erst nach überlebter Welle.';
    const choices=document.getElementById('greedDockChoices'),key=JSON.stringify([state.runId,state.wave,state.greedContract]);if(choices.dataset.key===key)return;choices.dataset.key=key;choices.innerHTML='';
    for(const offer of HexWaves.greedOffers(state)){const b=document.createElement('button');b.className='greedCard';b.dataset.offer=offer.id;let symbol;for(const [tag,text]of [['span',offer.icon],['strong',offer.name],['small',offer.description],['b','+'+offer.gold+' Gold nach der Welle']]){const el=document.createElement(tag);el.textContent=text;b.appendChild(el);symbol||=el;}const hexIcon=GREED_ICONS[offer.id];symbol.className='greedIcon';symbol.setAttribute('aria-hidden','true');if(hexIcon){symbol.textContent='';const i=document.createElement('span');i.className='hxi hxi-'+hexIcon;symbol.appendChild(i);}b.addEventListener('click',()=>{if(!HexWaves.acceptGreed(state,offer.id))return;uiWavePlans.clear();forecastRenderKey='';saveRunAutosave(true);renderAll();});choices.appendChild(b);}
  }
  document.getElementById('greedOpenBtn').addEventListener('click',()=>{if(state.challengeKind!=='greed'||state.phase!=='build'||state.celebrationActive)return;document.getElementById('greedOverlay').classList.remove('hidden');renderGreed();document.getElementById('greedTitle').focus?.();});
  document.getElementById('greedCloseBtn').addEventListener('click',closeGreed);
  document.getElementById('greedOverlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closeGreed();});
  document.getElementById('devGreedStart').addEventListener('click',()=>{if(!testProfile||!globalThis.HexFirstPlayerTest?.enabled||duoToken){setMessage('Starte zuerst das isolierte Erstspieler-Testprofil im Dev-Modus.');return;}newRun(undefined,undefined,undefined,'2026-10-25');mainMenu.classList.add('hidden');document.getElementById('settingsDrawer').classList.add('hidden');renderAll();});

  function closeMerchant(){document.getElementById('merchantOverlay').classList.add('hidden');document.getElementById('merchantOpenBtn').focus?.();}
  function renderMerchant(){
    const host=document.getElementById('merchantChoices'),site=merchantSite();
    const cache=JSON.stringify([site,[...state.map.values()].filter(t=>t.site==='merchant').map(t=>key(t.q,t.r)),state.gold,state.hp,state.maxHp,state.phase,state.wave,state.merchantPurchases,state.merchantProtectionWave,state.consumablesLocked,uiLanguageRevision]);if(host._view===cache)return;host._view=cache;host.innerHTML='';
    document.getElementById('merchantStatus').textContent=state.gold+' Gold · '+state.hp+'/'+state.maxHp+' HP';
    const merchants=[...state.map.values()].filter(t=>t.site==='merchant');
    if(merchants.length>1)merchants.forEach((tile,index)=>{const id=key(tile.q,tile.r),button=document.createElement('button');button.type='button';button.textContent=(globalThis.HexI18n?.getLanguage()==='en'?'Merchant ':'Händler ')+(index+1)+' ('+id+')';button.setAttribute('aria-pressed',String(id===site));button.disabled=id===site;button.onclick=()=>{selectedMerchantSite=id;renderMerchant();};host.appendChild(button);});
    for(const [id,item]of Object.entries(HexRewards.merchantOffers)){
      const button=document.createElement('button');button.type='button';button.className='upgradeOption';button.innerHTML='<strong>'+item.label+' · '+HexRewards.merchantPrice(state,id,site)+' Gold</strong><small>'+item.desc+'</small>';
      button.disabled=!!state.consumablesLocked||!HexRewards.canTrade(state,site,id);button.onclick=()=>{if(duoToken){duoAction('merchant',{site,item:id});return;}if(HexRewards.trade(state,site,id)){renderAll();saveRunAutosave();}};host.appendChild(button);
    }
  }
  document.getElementById('merchantOpenBtn').addEventListener('click',()=>{if(!merchantSite()||!['place','build'].includes(state.phase)||state.consumablesLocked)return;document.getElementById('merchantOverlay').classList.remove('hidden');renderMerchant();document.getElementById('merchantTitle').focus?.();});
  document.getElementById('merchantCloseBtn').addEventListener('click',closeMerchant);
  document.getElementById('merchantOverlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closeMerchant();});
  document.getElementById('buyExtraHexBtn').addEventListener('click', () => {
    if (duoToken) { duoAction('extraHex'); return; }
    if (!HexRunSession.buyExtraHex(state, random)) { setMessage('Zusatzhex aktuell nicht möglich: Gold, Bauphase und freien Anschluss prüfen.'); return; }
    state.selectedCard = null; state.rotation = 0; state.hoveredPlacement = null;
    renderAll(); saveRunAutosave(); setMessage('Zusatzhex gekauft. Wähle eine Karte und lege sie an.');
  });
  startWaveBtn.addEventListener('click', startWave);
  // ---- Hauptmenü ----
  const mainMenu = document.getElementById('mainMenu');
  const saveOverlay = document.getElementById('saveOverlay'), saveStatus = document.getElementById('saveStatus'), confirmImport = document.getElementById('confirmImportBtn');
  let pendingImport = null, importReadId = 0;
  function closeSave() { pendingImport = null; importReadId++; saveOverlay.classList.add('hidden'); openMainMenu(); document.getElementById('menuAccountBtn')?.focus?.(); }
  document.getElementById('menuSaveBtn')?.addEventListener('click', () => { pendingImport = null; importReadId++; confirmImport.classList.add('hidden'); document.getElementById('uploadSaveInput').value = ''; saveStatus.textContent = 'Ein Import ersetzt dein Profil. Lade zur Sicherheit zuerst eine Kopie herunter.'; saveOverlay.classList.remove('hidden'); });
  document.getElementById('closeSaveBtn').addEventListener('click', closeSave);
  document.getElementById('downloadSaveBtn').addEventListener('click', () => { try { const blob = new Blob([HexProfile.exportFile(profile, TOWERS)], { type: 'application/json' }), url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = 'autohex-spielstand-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); saveStatus.textContent = 'Spielstanddatei zum Download bereitgestellt.'; } catch { saveStatus.textContent = 'Download fehlgeschlagen. Bitte erneut versuchen.'; } });
  document.getElementById('uploadSaveInput').addEventListener('change', async event => { const readId = ++importReadId; pendingImport = null; confirmImport.classList.add('hidden'); const file = event.target.files?.[0]; if (!file) return; try { if (hasActiveRun && state.hp > 0) throw new Error('Bitte zuerst den laufenden Run beenden. Ein Profilwechsel während eines Durchlaufs ist nicht möglich.'); if (file.size > 2000000) throw new Error('Datei zu groß (maximal 2 MB).'); const text = await file.text(); if (readId !== importReadId) return; const next = HexProfile.readFile(text, TOWERS); pendingImport = text; saveStatus.textContent = next.diamonds + ' Diamanten · ' + next.unlockedTowers.length + ' Türme freigeschaltet · Bestmarke Wave ' + next.records.highestWave + '. Dein bisheriges Profil mit ' + profile.diamonds + ' Diamanten wird ersetzt. Eine lokale Sicherung wird angelegt.'; confirmImport.classList.remove('hidden'); } catch (error) { if (readId === importReadId) saveStatus.textContent = error.message; } });
  confirmImport.addEventListener('click', () => { if (!pendingImport || hasActiveRun && state.hp > 0) return; try { profile = HexProfile.importFile(pendingImport, TOWERS); pendingLoadout = [...profile.activeLoadout]; pendingHero = profile.activeHero; pendingDifficulty = profile.difficulty; pendingImport = null; confirmImport.classList.add('hidden'); tutorialSeen ||= profile.introduction.skipped || profile.introduction.bestWave > 0; renderIntroductionMenu(); renderLoadout(); renderUI(); updateArsenalHint(); saveStatus.textContent = 'Spielstand importiert. Dein Profil ist für den nächsten Run bereit.'; } catch (error) { saveStatus.textContent = 'Import fehlgeschlagen: ' + error.message; } });
  // ---- Account: Anmeldung, Registrierung und automatischer Spielstand-Abgleich über die API ----
  // Regeln: Anmelden lädt den Server-Stand (lokaler Stand wird vorher gesichert), Registrieren lädt den lokalen Stand hoch,
  // nach jedem abgeschlossenen Spiel und nach Arsenal-Käufen wird gespeichert. Läuft gerade ein Spiel, wird ein geladener
  // Server-Stand erst bei dessen Ende übernommen, damit die Abrechnung auf dem aktuellen Stand landet.
  const accountOverlay = document.getElementById('accountOverlay'), accountStatus = document.getElementById('accountStatus'), accountLoggedOut = document.getElementById('accountLoggedOut'), accountLoggedIn = document.getElementById('accountLoggedIn');
  const CLOUD_DIRTY = 'hex-cloud-dirty', CLOUD_LAST = 'hex-cloud-last-sync', PROFILE_BACKUP = 'hex-bastion-profile-backup';
  const cloudStore = { get(key) { try { return gameStorage.getItem(key); } catch { return null; } }, set(key, value) { try { if (value == null) gameStorage.removeItem(key); else gameStorage.setItem(key, value); } catch {/* Speicher nicht verfügbar */ } } };
  const accountApi = () => testProfile ? null : globalThis.HexApi;
  let accountUser = null, accountMode = 'login', accountBusy = false, pendingServerProfile = null, cloudSaveTimer = null;
  let applyingGameSettings = false;
  const gameSettingChecks = ['slotHints','onboardingHints','hexGrid','upgradeStatus','autoStart'];
  function readGameSettings() {
    const settings = Object.fromEntries(gameSettingChecks.map(id => [id, !!document.getElementById(id).checked]));
    return {...settings, arsenalSeen: arsenalNotifications.snapshot(), gameSpeed, language: globalThis.HexI18n?.getLanguage(), assetEdition: typeof HexAssetEdition === 'undefined' ? undefined : HexAssetEdition.get()};
  }
  function saveGameSettings() {
    if (applyingGameSettings) return;
    const settings = readGameSettings();
    try { gameStorage.setItem('hex-game-settings-v1', JSON.stringify(settings)); } catch {}
    if (pendingServerProfile) pendingServerProfile.gameSettings = settings;
    scheduleCloudSave();
  }
  function applyGameSettings(settings) {
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return;
    applyingGameSettings = true;
    try {
      arsenalNotifications.restore(settings.arsenalSeen);
      for (const id of gameSettingChecks) if (typeof settings[id] === 'boolean') document.getElementById(id).checked = settings[id];
      showSlotHints = slotToggle.checked; showHexGrid = gridToggle.checked; onboardingHints = hintsToggle.checked;
      if (state) { Object.assign(state, {showSlotHints, showHexGrid, showUpgradeStatus: document.getElementById('upgradeStatus').checked}); if (!onboardingHints) { tutorial.active = false; state.biomeIntro = null; } }
      document.getElementById('restartTutorialBtn').disabled = !onboardingHints;
      if (Number.isInteger(settings.gameSpeed) && settings.gameSpeed >= 1 && settings.gameSpeed <= 8 && !duoToken) { gameSpeed = settings.gameSpeed; speedToggle.value = String(gameSpeed); syncSpeedFill(); document.getElementById('speedValue').textContent = gameSpeed + '×'; }
      if (!testProfile) { if (['de','en'].includes(settings.language)) globalThis.HexI18n?.setLanguage(settings.language); if (typeof HexAssetEdition !== 'undefined' && (HexAssetEdition.EDITIONS || ['normal','sakura']).includes(settings.assetEdition)) HexAssetEdition.set(settings.assetEdition); }
      try { for (const [key,value] of Object.entries({slotHints:showSlotHints,hexGrid:showHexGrid,onboardingHints,gameSpeed})) gameStorage.setItem(key,String(value)); gameStorage.setItem('hex-game-settings-v1', JSON.stringify(readGameSettings())); } catch {}
      if (state) renderAll();
    } finally { applyingGameSettings = false; }
  }
  try { applyGameSettings(JSON.parse(gameStorage.getItem('hex-game-settings-v1') || 'null')); } catch {}
  document.getElementById('autoStart').addEventListener('change', saveGameSettings);
  if (typeof HexAssetEdition !== 'undefined') HexAssetEdition.onChange?.(saveGameSettings);
  function setAccountStatus(text, kind = 'info') { accountStatus.textContent = text; accountStatus.dataset.kind = text ? kind : ''; }
  function formatSyncTime(iso) {
    const time = iso ? Date.parse(iso) : NaN; if (!Number.isFinite(time)) return '–';
    const minutes = Math.round((Date.now() - time) / 60000);
    if (minutes < 1) return 'gerade eben'; if (minutes < 60) return 'vor ' + minutes + ' Min.';
    return new Date(time).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
  function renderAccount() {
    const loggedIn = !!accountUser, dirty = cloudStore.get(CLOUD_DIRTY) === '1';
    accountLoggedOut.classList.toggle('hidden', loggedIn); accountLoggedIn.classList.toggle('hidden', !loggedIn);
    document.getElementById('menuAccountLabel').textContent = loggedIn ? accountUser.username : 'Anmelden';
    document.getElementById('accountAvatar').textContent = loggedIn ? accountUser.username.slice(0, 1).toUpperCase() : '☁';
    document.getElementById('accountTitle').textContent = loggedIn ? 'Account & Spielstand' : accountMode === 'register' ? 'Account erstellen' : 'Anmelden';
    document.getElementById('accountSubtitle').textContent = loggedIn ? 'Dein Fortschritt auf einen Blick.' : 'Sichere deinen Fortschritt und spiele auf jedem Gerät weiter.';
    document.querySelector?.('.accountFoot')?.classList.toggle('hidden', !loggedIn);
    if (!loggedIn) return;
    document.getElementById('accountHelloName').textContent = 'Hallo, ' + accountUser.username + '!';
    document.getElementById('accountWhoami').textContent = 'Angemeldet als ' + accountUser.username;
    document.getElementById('accountSyncState').textContent = dirty ? 'Änderungen noch nicht gesichert.' : 'Auf dem neuesten Stand.';
    document.getElementById('accountSyncDot').dataset.state = dirty ? 'pending' : 'ok';
    document.getElementById('accountSyncInfo').textContent = cloudSaveError || (dirty ? 'Nicht gesicherte Änderungen – werden beim nächsten Mal übertragen.' : accountApi()?.statsStatus==='pending' ? 'Spielstand gesichert. Die Bestenliste wird noch aktualisiert.' : 'Wird nach jeder abgeschlossenen Welle und nach jedem Spiel gesichert.');
    document.getElementById('accountDiamonds').textContent = profile.diamonds;
    document.getElementById('accountBestWave').textContent = profile.records?.highestWave || 0;
    document.getElementById('accountLastSync').textContent = formatSyncTime(cloudStore.get(CLOUD_LAST));
  }
  function setAccountMode(mode) {
    accountMode = mode; const register = mode === 'register';
    for (const [id, active] of [['accountTabLogin', !register], ['accountTabRegister', register]]) { const tab = document.getElementById(id); tab.classList.toggle('active', active); tab.setAttribute('aria-selected', String(active)); }
    document.getElementById('accountSubmitBtn').textContent = register ? 'Account erstellen' : 'Anmelden';
    if (!accountUser) document.getElementById('accountTitle').textContent = register ? 'Account erstellen' : 'Anmelden';
    document.getElementById('accountPassword').setAttribute('autocomplete', register ? 'new-password' : 'current-password');
    document.getElementById('accountHint').textContent = register ? 'Benutzername 3–20 Zeichen, Passwort mindestens 8 Zeichen. Dein aktueller Fortschritt wird übernommen.' : 'Nach der Anmeldung wird dein gespeicherter Spielstand automatisch geladen.';
    setAccountStatus('');
  }
  function setAccountBusy(busy) { accountBusy = busy; for (const id of ['accountSubmitBtn', 'accountSaveServerBtn', 'accountLoadServerBtn', 'accountLogoutBtn']) document.getElementById(id).disabled = busy; accountOverlay.classList.toggle('accountBusy', busy); }
  async function refreshAccountView() {
    if (accountApi()?.isLoggedIn()) { try { accountUser = await accountApi().currentUser(); } catch {/* offline: letzten bekannten Stand behalten */ } } else accountUser = null;
    renderAccount();
  }
  function applyServerProfile(data) {
    globalThis.HexLocalStore?.activate(accountUser?.id);
    cloudStore.set(PROFILE_BACKUP, HexProfile.exportFile(profile, TOWERS));   // Sicherung des ersetzten lokalen Stands
    const previousIntro = profile.introduction;
    profile = HexProfile.importFile(JSON.stringify(data), TOWERS);
    profile = HexProfile.save({ ...profile, introduction: { ...profile.introduction, bestWave: Math.max(previousIntro.bestWave, profile.introduction.bestWave), skipped: previousIntro.skipped || profile.introduction.skipped, legacy: previousIntro.legacy || profile.introduction.legacy } }, TOWERS);
    tutorialSeen ||= profile.introduction.skipped || profile.introduction.bestWave > 0; renderIntroductionMenu();
    if (data.audioSettings) sound.applySettings?.(data.audioSettings);
    applyGameSettings(data.gameSettings);
    if (Object.prototype.hasOwnProperty.call(data, 'runAutosave')) {
      // Preserve checkpoints from newer versions even when this client cannot resume them.
      gameStorage.setItem(RUN_AUTOSAVE_KEY, data.runAutosave ? JSON.stringify(data.runAutosave) : '');
    }
    pendingLoadout = [...profile.activeLoadout]; pendingHero = profile.activeHero; pendingDifficulty = profile.difficulty;
    renderLoadout(); renderUI(); updateArsenalHint();
  }
  function applyPendingServerProfile() { if (!pendingServerProfile) return; const data = pendingServerProfile; applyServerProfile(data); accountApi()?.commitLoadedSave?.(data); pendingServerProfile = null; }
  // Server-Stand holen: 'loaded', 'deferred' (Spiel läuft) oder 'empty' (noch nichts gespeichert).
  let cloudUpload = null, cloudChange = 0, cloudSaveError = '';
  function adoptCurrentProfileForAccount() {
    if(!globalThis.HexLocalStore) return;
    const snapshot=gameStorage.getItem(RUN_AUTOSAVE_KEY),settings=readGameSettings();
    HexLocalStore.activate(accountUser.id);
    if(gameStorage.getItem(HexProfile.STORAGE_KEY)) profile=HexProfile.load(TOWERS);
    else { profile=HexProfile.save(profile,TOWERS);if(snapshot)gameStorage.setItem(RUN_AUTOSAVE_KEY,snapshot);applyGameSettings(settings); }
  }
  async function pullFromServer() {
    if (cloudUpload) await cloudUpload;
    const data = await accountApi().getSave({ deferCommit: true });
    cloudSaveError = '';
    if (!data) { adoptCurrentProfileForAccount(); return 'empty'; }
    data.gameSettings = {...data.gameSettings, arsenalSeen: Array.isArray(data.gameSettings?.arsenalSeen) ? data.gameSettings.arsenalSeen : []};
    applyGameSettings(data.gameSettings);
    cloudStore.set(CLOUD_DIRTY, null); cloudStore.set(CLOUD_LAST, new Date().toISOString());
    if (hasActiveRun && state?.hp > 0) { pendingServerProfile = data; return 'deferred'; }
    try { applyServerProfile(data); accountApi().commitLoadedSave?.(data); }
    catch (error) { cloudSaveError = 'Cloud-Spielstand konnte nicht übernommen werden. Automatisches Hochladen ist angehalten.'; throw error; }
    if (!mainMenu.classList.contains('hidden')) openMainMenu(); return 'loaded';
  }
  async function pushToServer() {
    if (!accountApi()?.isLoggedIn()) return false; clearTimeout(cloudSaveTimer);
    if (cloudUpload) return cloudUpload;
    if (globalThis.HexLocalStore?.blocked) { setAccountStatus('Speichern gesperrt: Dieses Profil ist in einem anderen Tab geöffnet. Bitte den anderen Tab schließen und neu laden.', 'error'); return false; }
    if (HexProfile.storageProblem) { cloudSaveError = 'Das lokale Profil ist beschädigt oder benötigt eine neuere Spielversion. Cloud-Upload angehalten; bitte den Account-Spielstand laden.'; setAccountStatus(cloudSaveError, 'error'); return false; }
    if (cloudSaveError) return false;
    const change = cloudChange;
    cloudUpload = Promise.resolve().then(async () => {
      try {
        const payload=pendingServerProfile ? JSON.parse(JSON.stringify(pendingServerProfile)) : JSON.parse(HexProfile.exportFile(profile, TOWERS));
        if (!pendingServerProfile) payload.runAutosave=JSON.parse(gameStorage.getItem(RUN_AUTOSAVE_KEY) || 'null');
        payload.gameSettings=readGameSettings(); payload.audioSettings=sound.settings?.() || null;
        await accountApi().putSave(JSON.stringify(payload));
        cloudStore.set(CLOUD_DIRTY, change === cloudChange ? null : '1');
        cloudStore.set(CLOUD_LAST, new Date().toISOString()); renderAccount();
        if (change !== cloudChange) cloudSaveTimer = setTimeout(pushToServer, 800);
        return true;
      } catch (error) {
        cloudStore.set(CLOUD_DIRTY, '1');
        if (error.status === 409 || error.status === 428) {
          cloudSaveError = error.message;
          cloudStore.set(PROFILE_BACKUP, HexProfile.exportFile(profile, TOWERS));
          setAccountStatus(cloudSaveError, 'error');
        }
        renderAccount(); return false;
      } finally { cloudUpload = null; }
    });
    return cloudUpload;
  }
  function scheduleCloudSave() { if (!accountApi()?.isLoggedIn()) return; cloudChange++; cloudStore.set(CLOUD_DIRTY, '1'); clearTimeout(cloudSaveTimer); cloudSaveTimer = setTimeout(pushToServer, 800); }
  // Nach einem abgeschlossenen Spiel: sichern und im Ergebnisfenster Bescheid geben.
  async function saveRunToCloud() {
    const note = document.getElementById('cloudSaveNote'); note.classList.remove('hidden');
    if (!accountApi()?.isLoggedIn()) { note.dataset.state = 'hint'; note.textContent = 'Tipp: Mit einem Account wird dein Fortschritt automatisch gesichert.'; return; }
    note.dataset.state = 'saving'; note.textContent = '☁ Spielstand wird gesichert …';
    const ok = await pushToServer(); note.dataset.state = ok ? 'ok' : 'error'; note.textContent = ok ? (accountApi()?.statsStatus==='pending' ? '☁ Spielstand gesichert. Die Bestenliste wird noch aktualisiert.' : '☁ Spielstand in deinem Account gesichert.') : cloudSaveError || '☁ Gerade offline – wird beim nächsten Mal gesichert.';
  }
  function openAccount() { setAccountStatus(''); renderAccount(); accountOverlay.classList.remove('hidden'); refreshAccountView().then(() => { if (!accountUser) document.getElementById('accountUsername').focus?.(); }); }
  function closeAccount() { accountOverlay.classList.add('hidden'); document.getElementById('accountPassword').value = ''; openMainMenu(); document.getElementById('menuAccountBtn').focus?.(); }
  document.getElementById('menuAccountBtn').addEventListener('click', openAccount);
  document.getElementById('closeAccountBtn').addEventListener('click', closeAccount);
  for (const button of document.querySelectorAll?.('[data-account-close]') || []) button.addEventListener('click', closeAccount);
  document.getElementById('accountTabLogin').addEventListener('click', () => setAccountMode('login'));
  document.getElementById('accountTabRegister').addEventListener('click', () => setAccountMode('register'));
  document.getElementById('accountShowPassword').addEventListener('click', () => { const input = document.getElementById('accountPassword'), show = input.type === 'password'; input.type = show ? 'text' : 'password'; const button = document.getElementById('accountShowPassword'); button.setAttribute('aria-label', show ? 'Passwort verbergen' : 'Passwort anzeigen'); button.title = button.getAttribute('aria-label'); });
  document.getElementById('accountForm').addEventListener('submit', async event => {
    event.preventDefault?.(); if (accountBusy || !accountApi()) return;
    const username = document.getElementById('accountUsername').value.trim(), password = document.getElementById('accountPassword').value;
    if (!username || !password) { setAccountStatus('Bitte Benutzername und Passwort eingeben.', 'error'); return; }
    const register = accountMode === 'register'; setAccountBusy(true); setAccountStatus(register ? 'Account wird erstellt …' : 'Anmelden …');
    try {
      if (cloudUpload) await cloudUpload;
      clearTimeout(cloudSaveTimer); cloudSaveError = '';
      accountUser = register ? await accountApi().register(username, password) : await accountApi().login(username, password);
      await globalThis.HexLocalStore?.prepare(accountUser.id);
      if (register) adoptCurrentProfileForAccount();
      document.getElementById('accountPassword').value = '';
      if (register) { const ok = await pushToServer(); setAccountStatus(ok ? 'Account erstellt. Dein Fortschritt ist jetzt gesichert.' : 'Account erstellt. Der Spielstand wird beim nächsten Mal gesichert.', 'success'); }
      else {
        setAccountStatus('Angemeldet. Spielstand wird geladen …');
        const result = await pullFromServer();
        if (result === 'empty') { await pushToServer(); setAccountStatus('Willkommen, ' + accountUser.username + '! Dein aktueller Fortschritt wurde in deinem Account gesichert.', 'success'); }
        else if (result === 'deferred') setAccountStatus('Angemeldet. Dein Spielstand wird nach dem laufenden Spiel übernommen.', 'success');
        else setAccountStatus('Willkommen zurück, ' + accountUser.username + '! Dein Spielstand wurde geladen.', 'success');
      }
    } catch (error) { setAccountStatus((register ? 'Registrierung fehlgeschlagen: ' : 'Anmeldung fehlgeschlagen: ') + error.message, 'error'); }
    finally { setAccountBusy(false); renderAccount(); globalThis.HexLeaderboardUI?.refreshResult(); globalThis.HexRunRanking?.refresh(); }
  });
  document.getElementById('accountLogoutBtn').addEventListener('click', async () => { setAccountBusy(true); clearTimeout(cloudSaveTimer); if (cloudUpload) await cloudUpload; clearTimeout(cloudSaveTimer); if(hasActiveRun){saveRunAutosave(true);hasActiveRun=false;clearRunTimers();stopSoloPresence();} await accountApi()?.logout(); cloudSaveError = ''; accountUser = null; pendingServerProfile = null; if(globalThis.HexLocalStore){HexLocalStore.activate();profile=HexProfile.load(TOWERS);applyGameSettings(JSON.parse(gameStorage.getItem('hex-game-settings-v1')||'null'));openMainMenu();} else cloudStore.set(CLOUD_DIRTY, null); setAccountBusy(false); setAccountMode('login'); renderAccount(); setAccountStatus('Abgemeldet. Dein Spielstand bleibt auf diesem Gerät erhalten.', 'success'); });
  document.getElementById('accountSaveServerBtn').addEventListener('click', async () => {
    setAccountBusy(true); setAccountStatus('Spielstand wird gesichert …');
    const ok = await pushToServer(); setAccountBusy(false); setAccountStatus(ok ? 'Spielstand gesichert.' : cloudSaveError || 'Sichern fehlgeschlagen. Bitte Verbindung prüfen.', ok ? 'success' : 'error');
  });
  document.getElementById('accountLoadServerBtn').addEventListener('click', async () => {
    setAccountBusy(true); setAccountStatus('Spielstand wird geladen …');
    try { const result = await pullFromServer(); setAccountStatus(result === 'empty' ? 'Auf dem Server liegt noch kein Spielstand für diesen Account.' : result === 'deferred' ? 'Der Spielstand wird nach dem laufenden Spiel übernommen.' : 'Spielstand vom Server geladen.', result === 'empty' ? 'info' : 'success'); }
    catch (error) { setAccountStatus('Laden fehlgeschlagen: ' + error.message, 'error'); }
    finally { setAccountBusy(false); renderAccount(); }
  });
  // Beim Start: angemeldet bleiben und abgleichen. Nicht übertragene Änderungen zuerst hochladen, sonst den Server-Stand holen.
  (async () => {
    if (!accountApi()?.isLoggedIn()) return;
    await refreshAccountView(); if (!accountUser) return;
    await globalThis.HexLocalStore?.prepare(accountUser.id);
    try { if (cloudStore.get(CLOUD_DIRTY) === '1' && (!globalThis.HexLocalStore || HexLocalStore.scope === 'user-'+accountUser.id)) await pushToServer(); else await pullFromServer(); } catch {/* offline: später erneut */ }
    renderAccount();
  })();
  function updateArsenalHint() { const count = HexProfile.affordableUnlocks(profile), button = document.getElementById('menuArsenalBtn'); button.classList.toggle('upgradeAvailable', arsenalNotifications.pending(profile));  document.getElementById('menuArsenalDetail').textContent = count ? '◆ Upgrade verfügbar' : ''; button.title = count ? count + ' Freischaltungen bezahlbar' : 'Arsenal'; }
  function renderIntroductionMenu() {
    const devButton=document.getElementById('devToggleBtn'),dev=globalThis.HexFirstPlayerTest;
    devButton.classList.toggle('hidden',!dev?.available || !!duoToken);devButton.setAttribute('aria-pressed',String(!!dev?.enabled));devButton.textContent=dev?.enabled?'Dev: an':'Dev: aus';
    for (const prefix of ['menu', 'settings']) {
      document.getElementById(prefix + 'DeveloperTools').classList.toggle('hidden', !globalThis.HexFirstPlayerTest?.enabled || !!duoToken);
      document.getElementById(prefix + 'DeveloperReset').disabled = !globalThis.HexFirstPlayerTest?.scenario;
    }
    document.getElementById('firstPlayerTestBtn').classList.toggle('hidden', !globalThis.HexFirstPlayerTest?.enabled || !!duoToken);
    document.getElementById('firstPlayerTestBtn').textContent = testProfile ? 'Erstspieler-Test neu starten' : 'Erstspieler-Test starten';
    for (const id of ['exitFirstPlayerTestBtn', 'exitFirstPlayerTestSettings', 'firstPlayerTestBadge']) document.getElementById(id).classList.toggle('hidden', !globalThis.HexFirstPlayerTest?.active);
    document.getElementById('menuAccountBtn').classList.toggle('hidden', testProfile);
    const learning = HexProfile.learning(profile), modes = HexProfile.modesUnlocked(profile);
    for (const id of ['skipIntroductionBtn', 'skipIntroductionSettings']) document.getElementById(id).classList.toggle('hidden', !learning);
    for (const id of ['dailyModeBtn', 'duoModeBtn']) { document.getElementById(id).classList.toggle('hidden', !modes); document.getElementById(id).disabled = !modes; }
    // Hauptmenü-Hexe bleiben sichtbar und nennen ihre Freischaltbedingung.
    for (const id of ['menuDailyBtn', 'menuDuoBtn']) { document.getElementById(id).classList.toggle('locked', !modes); document.getElementById(id).disabled = !modes; }
    document.getElementById('menuArsenalBtn').classList.toggle('hidden', learning && profile.records.runsPlayed === 0);
    document.getElementById('introductionMenuNote').classList.toggle('hidden', !learning);
  }
  function skipIntroduction() {
    profile = HexProfile.skipIntroduction(profile, TOWERS); finishTutorial();
    if (state.introduction) { state.towerLoadout = [...profile.activeLoadout]; state.introduction.notices = []; state.introduction.bestWave = 35; state.introduction.biomeAnnounced = true; }
    renderIntroductionMenu(); renderAll(); scheduleCloudSave();
  }
  document.getElementById('devToggleBtn').addEventListener('click',()=>{globalThis.HexFirstPlayerTest?.toggle();devEnemyQueue=[];renderIntroductionMenu();renderDevEnemies();});
  if(typeof HexDevEnemies!=='undefined')for(const [id,name] of HexDevEnemies.entries){const option=document.createElement('option');option.value=id;option.textContent=name;document.getElementById('devEnemyType').appendChild(option);}
  document.getElementById('devEnemyTestStart').addEventListener('click',()=>globalThis.HexFirstPlayerTest?.start('enemies'));
  document.getElementById('devEnemyAdd').addEventListener('click',()=>{
    if(typeof HexDevEnemies==='undefined'||!HexDevEnemies.allowed()||duoToken)return;
    const id=document.getElementById('devEnemyType').value,count=Math.min(20,Math.max(1,Math.floor(Number(document.getElementById('devEnemyCount').value)||1)));
    if(!HexDevEnemies.entries.some(e=>e[0]===id))return;
    if(devEnemyQueue.reduce((n,row)=>n+row.count,0)+count>60){setMessage('Maximal 60 Testgegner pro Welle.');return;}
    devEnemyQueue.push({id,count});renderDevEnemies();
  });
  document.getElementById('devEnemyClear').addEventListener('click',()=>{devEnemyQueue=[];if(!state.waveRunning){delete state.devEnemyWave;delete state.devEnemyRoster;uiWavePlans.clear();}renderDevEnemies();});
  document.getElementById('firstPlayerTestBtn').addEventListener('click', () => globalThis.HexFirstPlayerTest?.start());
  for (const prefix of ['menu', 'settings']) {
    const select = document.getElementById(prefix + 'DeveloperScenario');
    const enemyOption=document.createElement('option');enemyOption.value='enemies';enemyOption.textContent='Gegner ansehen · freie Teststrecke';select.appendChild(enemyOption);
    select.value = globalThis.HexFirstPlayerTest?.scenario || 'tutorial';
    document.getElementById(prefix + 'DeveloperStart').addEventListener('click', () => globalThis.HexFirstPlayerTest?.start(select.value));
    document.getElementById(prefix + 'DeveloperReset').addEventListener('click', () => globalThis.HexFirstPlayerTest?.start(globalThis.HexFirstPlayerTest?.scenario));
  }
  for (const id of ['exitFirstPlayerTestBtn', 'exitFirstPlayerTestSettings']) document.getElementById(id).addEventListener('click', () => globalThis.HexFirstPlayerTest?.exit());
  for (const id of ['skipIntroductionBtn', 'skipIntroductionSettings']) document.getElementById(id).addEventListener('click', skipIntroduction);
  document.getElementById('introductionNoticeClose').addEventListener('click', () => { state.introduction?.notices.shift(); renderIntroductionNotice(); });
  function renderIntroductionNotice() {
    const notice = document.getElementById('introductionNotice'), intro = state.introduction;
    const available = !!intro && onboardingHints && !tutorial.active && !state.waveRunning && !state.celebrationActive && ['place', 'build'].includes(state.phase) && mainMenu.classList.contains('hidden') && document.getElementById('settingsDrawer').classList.contains('hidden') && rewardOverlay.classList.contains('hidden') && document.getElementById('campaignVictory').classList.contains('hidden');
    if (intro?.biomeUnlocked && !intro.biomeAnnounced && HexBiomes.visibleTiles(state).some(t => HexBiomes.forTile(state, t) === 'desert')) { intro.biomeAnnounced = true; intro.notices.push('desert'); }
    const id = available && intro.notices[0]; notice.classList.toggle('hidden', !id);
    for (const [type, button] of quickButtons) button.classList.toggle('newTower', id === type);
    document.querySelector?.('[data-compact="towers"]')?.classList.toggle('newTower', !!id && id !== 'desert');
    if (!id) return;
    document.getElementById('introductionNoticeText').textContent = id === 'desert' ? 'Neues Biom: Dünenmeer. Gegner bewegen sich hier langsamer; Türme haben weniger Reichweite. Tippe auf das Sonnensymbol für Details.' : 'Neuer Turm freigeschaltet: ' + TOWERS[id].name + '. ' + ({ freeze: 'Verlangsamt Gegner in seiner Nähe.', chain: 'Blitze springen zwischen Gegnern und sind besonders stark gegen Magieresistenz.', mine: 'Legt explosive Minen auf die Straße.' }[id] || '');
    const button = quickButtons.get(id), box = button?.getBoundingClientRect?.();
    notice.classList.toggle('compact', !!globalThis.HexCompact?.small());
    if (box && !globalThis.HexCompact?.small()) { notice.style.left = (box.right + 12) + 'px'; notice.style.top = Math.max(100, Math.min(box.top, (document.documentElement?.clientHeight || 800) - 160)) + 'px'; }
  }
  function renderDailyMission() { const day = new Date().toISOString().slice(0, 10), mission = HexWaves.daily(day), garrison = mission.id === 'garrison'; document.getElementById('dailyMissionName').textContent = mission.name; document.getElementById('dailyMissionShort').textContent = (mission.id==='expedition'?'Drei Relikte + letzter Angriff · Frist: Welle 12':'Ziel: ' + mission.target + ' Wellen') + ' · Wechsel um 00:00 UTC'; document.getElementById('dailyMissionTitle').textContent = mission.name + ' · Tägliche Herausforderung'; document.getElementById('dailyCaravanRules').classList.toggle('hidden', mission.id !== 'caravan'); document.getElementById('dailyGreedRules').classList.toggle('hidden', mission.id !== 'greed'); document.getElementById('dailyFortressRules').classList.toggle('hidden',mission.id!=='movingFortress'); document.getElementById('dailyDraftRules').classList.toggle('hidden',mission.id!=='towerDraft'); document.getElementById('dailyExpeditionRules').classList.toggle('hidden',mission.id!=='expedition'); document.getElementById('dailyPowerRules').classList.toggle('hidden',mission.id!=='powerGrid'); document.getElementById('dailyVillagesRules').classList.toggle('hidden',mission.id!=='villages'); document.getElementById('dailyDetourRules').classList.toggle('hidden', mission.id !== 'detour'); document.getElementById('dailyGarrisonRules').classList.toggle('hidden', !garrison); document.getElementById('dailyStartBtn').textContent = 'Heutige Mission starten'; }
  function openMainMenu() { renderIntroductionMenu(); renderDailyMission(); if (duoToken) { location.assign('/duo-lobby.html'); return; } document.getElementById('biomeIntro').classList.add('hidden'); cancelQuickTower(); resetCameraKeys(); updateArsenalHint(); const today = new Date().toISOString().slice(0, 10), daily = profile.dailyResults?.[today]; document.getElementById('dailyProgress').textContent = today + ' (UTC) · ' + (daily?.won ? 'Heute geschafft · Belohnung erhalten' : 'Tagesbestmarke: ' + (daily?.best || 0) + '/' + HexWaves.daily(today).target + ' Wellen') + (HexWaves.daily(today).id === 'greed' ? ' · Gold-Bestwert W35: ' + (daily?.bestGold35 || 0) : ''); const activeRun = hasActiveRun && state.hp > 0, saved = activeRun ? null : readRunAutosave(), resume = activeRun ? state : saved && HexRunSnapshot.restore(saved.checkpoint).state;
    const resumeWave = resume ? (resume.waveRunning || ['victory', 'gameover'].includes(resume.phase) ? resume.wave : resume.wave + 1) : 0; menuResume = !!resume;
    // Gespeicherter Run: „Spielen“ zeigt die Welle und öffnet die Spielauswahl mit „Fortsetzen“ an erster Stelle.
    document.getElementById('menuContinueBtn').classList.toggle('hidden', !resume); document.getElementById('menuContinueDetail').textContent = resume ? 'Welle ' + resumeWave : '';
    mainMenu.classList.toggle('canContinue', !!resume); document.getElementById('menuPlayLabel').textContent = 'Spielen'; document.getElementById('menuPlayDetail').textContent = resume ? 'Fortsetzen · Welle ' + resumeWave : ''; mainMenu.classList.remove('hidden'); }
  let menuResume = false;
  function openPlayChoices() { mainMenu.classList.add('hidden'); document.getElementById('playModeChoices').classList.remove('hidden'); document.getElementById('dailyModeDetails').classList.add('hidden'); document.getElementById('playModeOverlay').classList.remove('hidden'); }
  document.getElementById('dailyStartBtn').addEventListener('click', () => { if (!HexProfile.modesUnlocked(profile) || !confirmRunRestart()) return; mainMenu.classList.add('hidden'); document.getElementById('playModeOverlay').classList.add('hidden'); const day=new Date().toISOString().slice(0,10);if(['greed','villages'].includes(HexWaves.daily(day).id)){openLoadout();pendingChallengeDay=day;}else newRun(undefined,'standard','dual',day); });
  document.getElementById('menuPlayBtn').addEventListener('click', () => { if (menuResume) { openPlayChoices(); return; } if (!HexProfile.modesUnlocked(profile) && !confirmRunRestart()) return; mainMenu.classList.add('hidden'); if (!HexProfile.modesUnlocked(profile)) { if (HexProfile.learning(profile)) newRun(); else openLoadout(); return; } document.getElementById('playModeChoices').classList.remove('hidden'); document.getElementById('dailyModeDetails').classList.add('hidden'); document.getElementById('playModeOverlay').classList.remove('hidden'); });
  function openDuoLobby() { if (!HexProfile.modesUnlocked(profile) || !suspendSoloRun()) return; location.href = 'duo-lobby.html'; }
  for (const id of ['duoModeBtn', 'menuDuoBtn']) document.getElementById(id).addEventListener('click', openDuoLobby);
  document.getElementById('menuDailyBtn').addEventListener('click', () => { if (!HexProfile.modesUnlocked(profile)) return; mainMenu.classList.add('hidden'); renderDailyMission(); document.getElementById('playModeChoices').classList.add('hidden'); document.getElementById('dailyModeDetails').classList.remove('hidden'); document.getElementById('playModeOverlay').classList.remove('hidden'); });
  document.getElementById('standardModeBtn').addEventListener('click', () => {
    // Vor der Freischaltung der Modi: neuer Run wie bisher direkt (Einführung) bzw. über die Run-Vorbereitung.
    if (!HexProfile.modesUnlocked(profile)) { if (!confirmRunRestart()) return; document.getElementById('playModeOverlay').classList.add('hidden'); if (HexProfile.learning(profile)) newRun(); else openLoadout(); return; }
    document.getElementById('playModeOverlay').classList.add('hidden'); openLoadout();
  });
  document.getElementById('dailyModeBtn').addEventListener('click', () => { if (!HexProfile.modesUnlocked(profile)) return; renderDailyMission(); document.getElementById('playModeChoices').classList.add('hidden'); document.getElementById('dailyModeDetails').classList.remove('hidden'); });
  document.getElementById('playModeBackBtn').addEventListener('click', () => { document.getElementById('playModeOverlay').classList.add('hidden'); openMainMenu(); });
  document.getElementById('menuContinueBtn').addEventListener('click', () => {
    if (!hasActiveRun) {
      const saved = readRunAutosave(); if (!saved) { openMainMenu(); return; }
      autoStart.checked = false; paused = false; document.getElementById('app').classList.remove('paused');
      consumablePick = null;
      tutorial = saved.tutorial && Number.isInteger(saved.tutorial.step) ? { active: onboardingHints && !!saved.tutorial.active, step: Math.max(0, Math.min(HexTutorial.steps.length - 1, saved.tutorial.step)) } : { active: false, step: 0 };
      restoreRunCheckpoint(saved.checkpoint);
    }
    mainMenu.classList.add('hidden'); document.getElementById('playModeOverlay').classList.add('hidden');
  });
  document.getElementById('menuArsenalBtn').addEventListener('click', openArsenal);
  document.getElementById('openMainMenuBtn').addEventListener('click', () => { if (!duoToken) { suspendSoloRun(); return; } document.getElementById('settingsDrawer').classList.add('hidden'); openMainMenu(); });
  const soundToggle = document.getElementById('soundEnabled');
  soundToggle.addEventListener('change', scheduleCloudSave);
  document.getElementById('soundVolume').addEventListener('change', scheduleCloudSave);
  document.getElementById('musicEnabled').addEventListener('change', scheduleCloudSave);
  document.getElementById('musicVolume').addEventListener('change', scheduleCloudSave);
  newRunBtn.addEventListener('click', openLoadout);
  document.getElementById('confirmLoadoutBtn').addEventListener('click', confirmLoadout);
  document.getElementById('cancelLoadoutBtn').addEventListener('click', () => { loadoutOverlay.classList.add('hidden'); if (!hasActiveRun || loadoutEdit) openMainMenu(); loadoutEdit = false; });
  document.getElementById('retryLoadoutBtn').addEventListener('click', () => { if(confirmRunRestart()) newRun(state.towerLoadout, state.heroId, state.difficulty, state.challengeDay); });
  document.getElementById('gameOverMapBtn').addEventListener('click', () => inspectEndMap(true));
  document.getElementById('backToRunResultBtn').addEventListener('click', () => inspectEndMap(false));
  document.getElementById('gameOverMenuBtn').addEventListener('click', () => { gameOverOverlay.classList.add('hidden'); openMainMenu(); });
  document.getElementById('changeLoadoutBtn').addEventListener('click', () => { gameOverOverlay.classList.add('hidden'); openLoadout(); });

  function closeArsenal() { arsenalOverlay.classList.add('hidden'); resetArsenalPending = false; renderLoadout(); document.getElementById('menuArsenalBtn').focus?.(); }
  document.getElementById('closeArsenalBtn').addEventListener('click', closeArsenal);
  document.getElementById('closeBiomeInfo').addEventListener('click', () => document.getElementById('biomeInfoPanel').classList.add('hidden'));
  function dismissBiomeInfoOutside(event) {
    if (!state || !event.target?.closest || event.target.closest('#biomeInfoPanel,.biomeRail')) return false;
    document.getElementById('biomeInfoPanel').classList.add('hidden');
    const changed = !!(pinnedBiome || state.highlightBiome); pinnedBiome = null; state.highlightBiome = null;
    if (document.activeElement?.closest?.('.biomeRail')) document.activeElement.blur?.();
    if (changed) { for (const button of biomeButtons.values()) { button.classList.remove('active', 'showTooltip'); button.setAttribute('aria-pressed', 'false'); } renderBiomeIntroDetails(); renderBoard(); }
    return changed;
  }
  function dismissTransientPanels(event) {
    const target = event.target; if (!target?.closest || !state || target.closest('#rewardOverlay,#celebration,#campaignVictory,#hotkeyTip,#introductionNotice')) return;
    let changed = false;
    if (!target.closest('#consumableMenu,#compactConsumables')) document.getElementById('consumableMenu').open = false;
    if (saleRequest && !target.closest('#' + (saleRequest.kind === 'tower' ? 'sellTowerBtn' : 'sellBuildingBtn'))) { closeSale(); changed = true; }
    if (!target.closest('.towerPanel,.drawer,.loadoutRail,#duoHud')) {
      if (state.selectedTower || state.selectedBuilding || state.selectedSlot) { state.selectedTower = null; state.selectedBuilding = null; state.selectedSlot = null; state.previewTower = null; state.previewBuilding = null; changed = true; }
    }
    if (dismissBiomeInfoOutside(event)) changed = true;
    if (changed) renderAll();
  }
  let saleRequest = null;
  const saleButton = kind => document.getElementById(kind === 'tower' ? 'sellTowerBtn' : 'sellBuildingBtn');
  function closeSale() { saleRequest = null; for (const kind of ['tower', 'building']) saleButton(kind).classList.remove('confirmSale'); }
  function renderSaleState() {
    const request = saleRequest; if (!request) return; const selected = request.kind === 'tower' ? state.selectedTower : state.selectedBuilding;
    if (request.run !== state || !selected || selected.q !== request.slot.q || selected.r !== request.slot.r || selected.index !== request.slot.index || request.kind === 'tower' && selections('Tower').length !== 1 || state.map.get(key(selected.q, selected.r))?.[request.kind === 'tower' ? 'towers' : 'buildings']?.[selected.index] !== request.object) { closeSale(); return; }
    const button = saleButton(request.kind); button.classList.add('confirmSale'); button.textContent = 'Wirklich verkaufen? +' + request.amount + ' Gold · erneut klicken';
  }
  function requestSale(kind) {
    const slot = kind === 'tower' ? state.selectedTower : state.selectedBuilding; if (!slot || kind === 'tower' && selections('Tower').length !== 1) return;
    const object = state.map.get(key(slot.q, slot.r))?.[kind === 'tower' ? 'towers' : 'buildings']?.[slot.index];
    const refund = kind === 'tower' ? HexData.towerRefund(state, object) : HexBuildings.refund(state, object); if (!refund) { closeSale(); renderAll(); return; }
    if (saleRequest?.run === state && saleRequest.kind === kind && saleRequest.object === object && saleRequest.amount === refund.amount) {
      closeSale(); if (kind === 'tower') sellSelectedTower(); else if (duoToken) duoAction('sellBuilding', { slot }); else if (HexBuildings.sell(state, slot)) renderAll(); return;
    }
    closeSale(); saleRequest = { run: state, kind, slot: { ...slot }, object, amount: refund.amount }; renderSaleState();
  }
  document.getElementById('sellBuildingBtn').addEventListener('click', () => requestSale('building'));
  document.getElementById('sellTowerBtn').addEventListener('click', () => requestSale('tower'));
  document.getElementById('closeBuildingPanel').addEventListener('click', () => { state.selectedBuilding = null; renderAll(); });
  document.getElementById('celebrationContinue').addEventListener('click', closeCelebration);
  document.getElementById('rewardMapBtn').addEventListener('click', () => inspectReward(rewardView === 'map' ? 'selection' : 'map'));
  document.getElementById('rewardDeckBtn').addEventListener('click', () => inspectReward(rewardView === 'deck' ? 'selection' : 'deck'));
  document.getElementById('rewardBackBtn').addEventListener('click', () => { if (state.workshopPicking) { state.workshopPicking = false; showShrine(); } else inspectReward('selection'); });
  document.getElementById('skipRemovalBtn').addEventListener('click', () => takeReward(state.rewardOffer?.id, null));
  document.getElementById('skipRemovalTopBtn').addEventListener('click', () => takeReward(state.rewardOffer?.id, null));
  document.getElementById('closeTowerPanel').addEventListener('click', () => { state.selectedTower = null; renderAll(); });
  document.getElementById('zoomInBtn').addEventListener('click', () => renderer.zoom(.8));
  document.getElementById('zoomOutBtn').addEventListener('click', () => renderer.zoom(1.25));
  document.getElementById('resetViewBtn').addEventListener('click', () => renderer.resetView());
  for (const [id, close] of [['rewardOverlay', () => inspectReward('map')], ['gameOverOverlay', () => inspectEndMap(true)], ['campaignVictory', () => inspectCampaign(true)], ['celebration', closeCelebration]]) { const overlay = document.getElementById(id); overlay.addEventListener('click', e => { if (e.target === overlay) close(); }); }
  document.getElementById('deckDropdown').addEventListener('toggle', () => { if (document.getElementById('deckDropdown').open) renderDeckOverview(); });
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && !e.altKey && !e.metaKey && e.key.toLowerCase() === 'f') { e.preventDefault(); if (!e.repeat) toggleFps(); return; }
    if (document.getElementById('patchNotesOverlay')?.classList.contains('hidden') === false) return;
    if (document.getElementById('leaderboardOverlay')?.classList.contains('hidden') === false) return;
    if (state.phase === 'victory') { if (e.key === 'Escape') { e.preventDefault?.(); inspectCampaign(!document.getElementById('campaignVictory').classList.contains('inspectCampaign')); } return; }
    if (e.key === 'Escape' && document.getElementById('consumableMenu').open) { document.getElementById('consumableMenu').open = false; e.preventDefault?.(); return; }
    if(!document.getElementById('greedOverlay').classList.contains('hidden')){if(e.key==='Escape'){e.preventDefault?.();closeGreed();}return;}
    if(!document.getElementById('merchantOverlay').classList.contains('hidden')){if(e.key==='Escape'){e.preventDefault?.();closeMerchant();}return;}
    if (e.key === 'Escape' && cancelConsumableSelection(e)) return;
    if (e.key === 'Escape' && state.buildingTarget) { state.buildingTarget = null; e.preventDefault?.(); setMessage('Hex-Auswahl abgebrochen.'); renderAll(); return; }
    if (saleRequest && e.key === 'Escape') { e.preventDefault?.(); closeSale(); renderAll(); return; }
    if (!saveOverlay.classList.contains('hidden')) { if (e.key === 'Escape') { e.preventDefault?.(); closeSave(); } return; }
    if (!accountOverlay.classList.contains('hidden')) { if (e.key === 'Escape') { e.preventDefault?.(); closeAccount(); } return; }
    if (e.key === 'Escape' && state.villageMove) { e.preventDefault?.();state.villageMove=null;renderAll();return; }
    if (e.key === 'Escape' && state.dragTower) { e.preventDefault?.(); cancelQuickTower(); renderAll(); return; }
    if (e.key === 'Escape' && document.getElementById('powerEditor').open) { e.preventDefault?.(); document.getElementById('powerEditor').open=false; return; }
    if (e.key === 'Escape' && state.inspectEndMap) { e.preventDefault?.(); inspectEndMap(false); return; }
    if (e.key === 'Escape' && !arsenalOverlay.classList.contains('hidden')) { e.preventDefault?.(); closeArsenal(); return; }
    if (state.celebrationActive) { if (e.key === 'Escape') { closeCelebration(); e.preventDefault?.(); } else if (e.code === 'Space') e.preventDefault?.(); return; }
    if (e.key === 'Escape' && towerComparison) { e.preventDefault?.(); closeTowerComparison(); return; }
    if (e.key === 'Escape') {
      e.preventDefault?.(); if (e.repeat) return;
      const hadPanel = state.selectedTower || state.selectedBuilding || state.selectedSlot || document.querySelector?.('.drawer:not(.hidden),.statDetails[open],#biomeInfoPanel:not(.hidden)');
      document.getElementById('biomeInfoPanel').classList.add('hidden');
      if (rewardView !== 'selection') { inspectReward('selection'); return; }
      document.querySelectorAll('.drawer').forEach(panel => panel.classList.add('hidden'));
      document.querySelectorAll('.statDetails').forEach(panel => { panel.open = false; });
      cancelQuickTower(); state.highlightBiome = null; pinnedBiome = null;
      state.selectedTower = null; state.selectedBuilding = null; state.selectedSlot = null; state.selectedBase = false; state.previewTower = null;
      if (!hadPanel && hasActiveRun && mainMenu.classList.contains('hidden')) document.getElementById('settingsDrawer').classList.remove('hidden');
      renderHotkeyTip(); renderAll(); return;
    }
    if (e.key.toLowerCase() === 'f' && !e.repeat && e.target?.id === 'doubleSpeed') { e.preventDefault(); changeSpeed(gameSpeed % 8 + 1); return; }
    if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.target?.isContentEditable && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName) && state.phase === 'place') { e.preventDefault?.(); rotateSelected(); return; }
    if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'SUMMARY'].includes(e.target?.tagName) || e.target?.isContentEditable) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.toLowerCase() === 'u' && !e.repeat) { e.preventDefault(); toggleUpgradeStatus(); }
    if (e.key.toLowerCase() === 'g' && !e.repeat) { e.preventDefault(); setHexGrid(!showHexGrid); }
    if ('qewasd'.includes(e.key.toLowerCase()) && e.key.length === 1) { e.preventDefault(); cameraKeys.add(e.key.toLowerCase()); }
    if (e.code === 'Space' && !e.repeat) { e.preventDefault(); startWave(); }
    if (/^[1-9]$/.test(e.key)) {
      const n = Number(e.key) - 1;
      if (state.selectedSlot) { const b = [...towerButtons.values()][n]; if (b && !b.disabled) b.click(); }
      else if (state.phase === 'place' && state.hand[n]) { state.selectedCard = n; state.rotation = 0; renderAll(); }
    }
    if (e.key.toLowerCase() === 'p') togglePause();
    if (e.key.toLowerCase() === 'r') rotateSelected();
    if (e.key.toLowerCase() === 'f' && !e.repeat) { changeSpeed(gameSpeed % 8 + 1); }
  });

  const cameraKeys = new Set(); let cameraLast = performance.now(), cameraVelocity = { x: 0, y: 0, turn: 0 };
  function resetCameraKeys() { cameraKeys.clear(); cameraVelocity = { x: 0, y: 0, turn: 0 }; cameraLast = performance.now(); }
  document.addEventListener('keyup', e => cameraKeys.delete(e.key.toLowerCase()));
  globalThis.addEventListener?.('blur', resetCameraKeys);
  document.addEventListener('focusin', e => { if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'SUMMARY'].includes(e.target?.tagName)) resetCameraKeys(); });
  function advanceCamera(now) {
    const dt = Math.min(.05, Math.max(0, (now - cameraLast) / 1000)); cameraLast = now; if (document.hidden) return;
    const x = Number(cameraKeys.has('d')) - Number(cameraKeys.has('a')), y = Number(cameraKeys.has('s')) - Number(cameraKeys.has('w')), length = Math.hypot(x, y) || 1;
    const targets = { x: x / length, y: y / length, turn: Number(cameraKeys.has('e')) - Number(cameraKeys.has('q')) }, motion = {};
    for (const axis of ['x', 'y', 'turn']) { const target = targets[axis], old = cameraVelocity[axis], rate = target ? 14 : 22, decay = Math.exp(-rate * dt); motion[axis] = target * dt + (old - target) * (1 - decay) / rate; cameraVelocity[axis] = target + (old - target) * decay; if (!target && Math.abs(cameraVelocity[axis]) < .001) cameraVelocity[axis] = 0; }
    if (Math.abs(motion.turn) > .00001) renderer.rotateView?.(motion.turn * 6); if (Math.hypot(motion.x, motion.y) > .00001) renderer.panView?.(motion.x, motion.y);
  }
  let last = performance.now();
  let paused = false, clockDebt = 0;
  function togglePause() { if (duoToken) { duoBridge?.pause(); return; } advanceClock(performance.now()); paused = !paused; clockDebt = 0; last = performance.now(); document.getElementById('app').classList.toggle('paused', paused); const b = document.getElementById('pauseBtn'); if (b) b.textContent = paused ? '▶ Weiter (P)' : '⏸ Pause (P)'; }
  document.getElementById('pauseBtn')?.addEventListener('click', togglePause);
  function advanceClock(now) {
    if (duoToken) { last = now; clockDebt = 0; if (state.waveRunning && !document.hidden && duoBridge?.animate?.(now)) { if(renderer.renderMotion) renderer.renderMotion(); else renderBoard(); } return; }
    const elapsed = Math.max(0, (now - last) / 1000); last = now;
    if (paused || !hasActiveRun || !state.waveRunning) { clockDebt = 0; return; }
    clockDebt += elapsed * HexRunRuntime.PLAYBACK_RATE; const step = .05 / gameSpeed; let count = 0;
    while (clockDebt >= step && state.waveRunning && count++ < 200) { clockDebt -= step; update(step, now, false); }
    if (!state.waveRunning) clockDebt = 0;
    if (!document.hidden) { renderBoard(); renderUI(); }
  }
  let fpsVisible = false, fpsStart = null, fpsFrames = 0, animationFrames = 0;
  const fpsEl = document.getElementById('fpsCounter');
  function toggleFps() { fpsVisible = !fpsVisible; fpsStart = null; fpsEl.classList.toggle('hidden', !fpsVisible); fpsEl.textContent = 'FPS: —'; }
  function updateFps(now) {
    if (!fpsVisible) return;
    if (document.hidden) { fpsStart = null; fpsEl.textContent = 'FPS: —'; return; }
    const count = renderer.getRenderedFrameCount?.() ?? animationFrames;
    if (fpsStart === null) { fpsStart = now; fpsFrames = count; return; }
    const elapsed = now - fpsStart;
    if (elapsed >= 500) { fpsEl.textContent = 'FPS: ' + Math.round((count - fpsFrames) * 1000 / elapsed); fpsStart = now; fpsFrames = count; }
  }
  function frame(now) { animationFrames++; positionRelicEffects(); advanceCamera(now); advanceClock(now); updateFps(now); requestAnimationFrame(frame); }
  globalThis.setInterval?.(() => { if (document.hidden) advanceClock(performance.now()); }, 250);
  document.addEventListener('visibilitychange', () => { fpsStart = null; if (fpsVisible) fpsEl.textContent = 'FPS: —'; cancelQuickTower(); resetCameraKeys(); advanceClock(performance.now()); });
  if (duoToken) {
    document.getElementById('openMainMenuBtn').textContent='Duo-Lobby';
    newRun(); tutorial.active = false; mainMenu.classList.add('hidden'); document.body.classList.add('duoGame');
    duoBridge = HexDuoGame.mount({
      token: duoToken, getState: () => state, render: renderAll, renderer, cardElement, setMessage,
      accept(next, switched = false, profileChanged = true) {
        if (switched) { consumablePick = null; closeSale(); cancelQuickTower(); state.selectedSlot = state.selectedTower = state.selectedBuilding = null; state.selectedSlots = []; state.selectedTowers = []; state.previewUpgrade = state.previewTower = state.previewBuilding = state.buildingTarget = state.hoveredPlacement = null; state.selectedCard = null; state.rotation = 0; towerMenuKey = towerPanelKey = buildingPanelKey = ''; renderer.reset(); }
        if (state.waveRunning && !next.waveRunning || state.phase !== next.phase) clearBuildingInteraction();
        const changedHand = state.hand.join('|') !== next.hand.join('|') || state.phase !== next.phase;
        Object.assign(state, next, {showHexGrid, showSlotHints, showUpgradeStatus: document.getElementById('upgradeStatus').checked});
        state.selectedSlots = selections('Slot').filter(slot => { const t = state.map.get(key(slot.q, slot.r)); return t && slot.index < t.slots && !t.towers[slot.index]; }); state.selectedSlot = state.selectedSlots.at(-1) || null;
        state.selectedTowers = selections('Tower').filter(slot => state.map.get(key(slot.q, slot.r))?.towers[slot.index]); state.selectedTower = state.selectedTowers.at(-1) || null;
        if (changedHand) { state.selectedCard = null; state.rotation = 0; }
        if (profileChanged) profile = HexProfile.load(TOWERS); tutorial.active = false; hasActiveRun = true; mainMenu.classList.add('hidden'); renderAll();
      }, commandAccepted(action) { if (action === 'tower' && globalThis.HexCompact?.small()) { document.getElementById('towerDrawer').classList.add('hidden'); HexCompact.open(''); } if (['tower', 'upgrade', 'building', 'buildingUpgrade', 'sellTower', 'sellBuilding', 'baseUpgrade'].includes(action)) { state.previewTower = state.previewUpgrade = null; sound.play('build'); renderAll(); } }, reward(offer, kind) {
        const signature = JSON.stringify([offer, kind]); if (duoBridge?.offerKey === signature) return; if (duoBridge) duoBridge.offerKey = signature;
        rewardChoices.innerHTML = ''; rewardChoices.classList.remove('workshopChoices'); if (!offer) { rewardOverlay.classList.add('hidden'); return; }
        inspectReward('selection');
        document.getElementById('rewardTitle').textContent = kind === 'delivery' ? 'Geschenk für deinen Partner' : kind === 'result' ? 'Gemeinsamer Durchlauf beendet' : offer.kind === 'removal' ? 'Deck ausdünnen (optional)' : 'Belohnung wählen';
        document.getElementById('rewardDescription').textContent = kind === 'delivery' ? 'Wähle eine Karte oder Gold für deinen Partner.' : kind === 'result' ? offer.description : 'Wähle deine Belohnung.';
        document.getElementById('skipRemovalBtn').classList.toggle('hidden', !offer.skippable || offer.kind === 'removal'); document.getElementById('rewardInspectActions').classList.add('hidden');
        for (const [index, choice] of offer.choices.entries()) { const button = choice.cardId ? cardElement(choice.cardId, false) : document.createElement('button'); if (!choice.cardId) { button.className = 'upgradeOption'; button.textContent = (choice.label ? choice.label + (choice.desc ? ' · ' + choice.desc : '') : '') || choice.choice?.name || ({ bastion: '+5 Team-Leben', income: '+2 Einkommen', repair: 'Heilquelle', supplies: '+30 Gold' })[choice.blessing] || '+' + choice.amount + ' Gold'; } if (kind === 'delivery' && choice.kind === 'gold') { button.className = 'card duoGoldGift'; const icon=document.createElement('span'); icon.className='duoGiftIcon'; icon.setAttribute('aria-hidden','true'); const giftCoin=document.createElement('span'); giftCoin.className='hxi hxi-coin'; icon.appendChild(giftCoin); const title=document.createElement('strong'); title.textContent='+'+choice.amount+' Gold'; const hint=document.createElement('span'); hint.textContent='Für deinen Partner · sofort verfügbar'; button.textContent=''; button.appendChild(icon); button.appendChild(title); button.appendChild(hint); } if (offer.kind === 'removal' && choice.cardId) bindRemovalConfirmation(button, () => duoBridge.choose(kind, offer, index)); else button.addEventListener('click', () => duoBridge.choose(kind, offer, index)); rewardChoices.appendChild(button); }
        if (offer.choices.some(c => c.kind === 'upgrade')) { rewardChoices.classList.add('workshopChoices'); rewardAction('Turm auf der Karte wählen', 'Klicke einen eigenen Turm an, um sein kostenloses Upgrade zu wählen.', () => startWorkshop(offer)); }
        if (kind === 'result') { renderRunStatistics(); const stats = document.createElement('section'); stats.className = 'duoResultStats'; stats.innerHTML = document.getElementById('runStatistics').innerHTML; rewardChoices.appendChild(stats); const ranking=document.createElement('section');rewardChoices.appendChild(ranking);showRunRanking(ranking,offer.ranking); } state.rewardOffer = kind === 'result' ? null : offer; openRewardSelection();
      }
    });
    requestAnimationFrame(frame);
   } else if(challengeLab) {
    newRun(undefined,undefined,undefined,challengeLab.mission.day,true);
    mainMenu.classList.add('hidden');
    const bar=document.createElement('aside');bar.id='challengeLabBar';bar.className='challengeLabBar';
    const label=document.createElement('span');label.textContent='Testlabor · '+challengeLab.mission.name+' · Ohne Belohnungen';bar.appendChild(label);
    const back=document.createElement('a');back.href='challenge-lab.html';back.textContent='Mission wechseln';bar.appendChild(back);
    const saved=readRunAutosave();
    if(saved)restoreRunCheckpoint(saved.checkpoint);
    if(!saved&&['greed','villages'].includes(challengeLab.mission.id))openLoadout();
    const restart=document.createElement('button');restart.className='secondary';restart.textContent='Neu starten';restart.addEventListener('click',()=>{if(['greed','villages'].includes(challengeLab.mission.id)){openLoadout();return;}if(confirmRunRestart()){newRun();mainMenu.classList.add('hidden');saveRunAutosave(true);}});bar.appendChild(restart);
    back.addEventListener('click',()=>saveRunAutosave(true));
    globalThis.addEventListener('pagehide',()=>saveRunAutosave(true));
    const report=document.createElement('button');report.className='secondary';report.textContent='Testbericht';report.addEventListener('click',()=>{
      const wasPaused=state.paused;state.paused=true;
      const dialog=document.createElement('dialog');dialog.addEventListener('close',()=>{state.paused=wasPaused;dialog.remove();});dialog.className='challengeLabReport';
      const text=document.createElement('textarea');text.readOnly=true;text.rows=12;
      text.value=['AutoHex TD – Testlabor', 'Version: '+(document.querySelector('[data-app-version]')?.textContent||document.title),'Mission: '+state.challengeKind,'Seed: '+state.seed,'Welle: '+state.wave,'Phase: '+state.phase,'Abgeschlossen: '+(state.lastCompletedWave||0),'','Letzte Schritte:','Erwartetes Verhalten:','Beobachteter Fehler:'].join('\n');
      const close=document.createElement('button');close.className='primary';close.textContent='Schließen';close.addEventListener('click',()=>dialog.close());dialog.append(text,close);document.body.appendChild(dialog);dialog.showModal();text.select();
    });bar.appendChild(report);document.body.appendChild(bar);requestAnimationFrame(frame);
  } else { newRun(undefined, undefined, undefined, null, true); hasActiveRun = false; openMainMenu(); applyDeveloperScenario(); requestAnimationFrame(frame); }
})();
