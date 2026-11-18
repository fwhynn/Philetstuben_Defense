'use strict';
// Transport-independent trust boundary. Only the server binds a seat to a connection.
const crypto = require('node:crypto');
const loadCore = require('../headless-core.cjs');
const RULESET = require('../package.json').version;
// Reviewed checkpoint compatibility, including legacy 20-gold gift migration.
function compatibleRuleset(source,target=RULESET){
  if(target==='1.3.3'&&['1.2.8','1.2.9','1.3.0','1.3.1','1.3.2'].includes(source))return true;
  if(target==='1.3.2'&&['1.2.8','1.2.9','1.3.0','1.3.1'].includes(source))return true;
  if(target==='1.3.1'&&['1.2.8','1.2.9','1.3.0'].includes(source))return true;
  if(target==='1.3.0'&&['1.2.8','1.2.9'].includes(source))return true;
  if(target==='1.2.9'&&source==='1.2.8')return true;
  return source===target || target==='1.2.1'&&source==='1.2.0' || target==='1.2.2'&&['1.1.9','1.2.0','1.2.1'].includes(source) || target==='1.2.3'&&['1.1.9','1.2.0','1.2.1','1.2.2'].includes(source) || target==='1.2.4'&&['1.1.9','1.2.0','1.2.1','1.2.2','1.2.3'].includes(source) || target==='1.2.5'&&['1.1.9','1.2.0','1.2.1','1.2.2','1.2.3','1.2.4'].includes(source);
}
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const exact = (v, keys) => object(v) && Object.keys(v).every(k => keys.includes(k)) && keys.every(k => Object.hasOwn(v, k));
const integer = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const word = v => typeof v === 'string' && /^[a-zA-Z0-9:_-]{1,120}$/.test(v);
const slot = v => exact(v, ['q', 'r', 'index']) && integer(v.q, -1000, 1000) && integer(v.r, -1000, 1000) && integer(v.index, 0, 31);
function payloadValid(action, p) {
  switch (action) {
    case 'lobbyAugments': return exact(p,['cards']) && Array.isArray(p.cards) && p.cards.length<=5 && new Set(p.cards).size===p.cards.length && p.cards.every(word);
    case 'guardian': return exact(p, ['board', 'id', 'value']) && integer(p.board, 0, 1) && typeof p.id === 'string' && /^-?\d{1,4},-?\d{1,4}$/.test(p.id) && typeof p.value === 'boolean';
    case 'lobbyLoadout': return (exact(p,['towers']) || exact(p,['towers','heroId','difficulty']) && word(p.heroId) && ['normal','dual'].includes(p.difficulty)) && Array.isArray(p.towers) && p.towers.length===5 && new Set(p.towers).size===5 && p.towers.every(word);
    case 'lobbyStart': return exact(p, []);
    case 'lobbyReady':
    case 'pause':
    case 'rematch':
    case 'endless':
    case 'ready': return exact(p, ['value']) && typeof p.value === 'boolean';
    case 'place': return exact(p, ['q', 'r', 'index', 'rotation']) && integer(p.q, -1000, 1000) && integer(p.r, -1000, 1000) && integer(p.index, 0, 4) && integer(p.rotation, 0, 5);
    case 'tower': return exact(p, ['type', 'slots']) && word(p.type) && Array.isArray(p.slots) && p.slots.length > 0 && p.slots.length <= 32 && p.slots.every(slot);
    case 'upgrade': return exact(p, ['slot', 'upgrade']) && slot(p.slot) && word(p.upgrade);
    case 'building': return exact(p, ['slot', 'type']) && slot(p.slot) && ['house', 'forge', 'market', 'bastion', 'portal'].includes(p.type);
    case 'speed': return exact(p, ['value']) && integer(p.value, 1, 8);
    case 'consumable': return exact(p, ['kind', 'slot']) && ['spikes', 'resin', 'overload'].includes(p.kind) && (slot(p.slot) || p.kind!=='overload' && exact(p.slot,['q','r','index','x','y']) && slot({q:p.slot.q,r:p.slot.r,index:p.slot.index}) && Number.isFinite(p.slot.x) && Number.isFinite(p.slot.y));
    case 'baseUpgrade': return exact(p, ['kind']) && ['walls', 'weapon'].includes(p.kind);
    case 'targetPriority': return exact(p, ['slot', 'priorities']) && slot(p.slot) && Array.isArray(p.priorities) && p.priorities.length === 3 && new Set(p.priorities).size === 3 && p.priorities.every(v => ['closestBase', 'furthestBase', 'mostHealth', 'leastHealth', 'mostArmor', 'mostMagic', 'boss', 'healer', 'closestTower', 'furthestTower'].includes(v));
    case 'buildingTarget': return exact(p, ['slot', 'target']) && slot(p.slot) && typeof p.target === 'string' && /^-?\d{1,4},-?\d{1,4}$/.test(p.target);
    case 'sellTower': case 'sellBuilding':
    case 'buildingUpgrade': return exact(p, ['slot']) && slot(p.slot);
    case 'giftHex': return exact(p,['cardId'])&&['straight','smallCurve','bigCurve'].includes(p.cardId);
    case 'delivery': return exact(p, ['offerId', 'index']) && typeof p.offerId === 'string' && p.offerId.length <= 200 && integer(p.index, 0, 2);
    case 'deliveryWish': return exact(p, ['offerId', 'index']) && typeof p.offerId === 'string' && p.offerId.length <= 200 && (p.index === null || integer(p.index, 0, 2));
    case 'reward': return exact(p, ['offerId', 'index']) && typeof p.offerId === 'string' && p.offerId.length <= 200 && (p.index === null || integer(p.index, 0, 1000));
    case 'merchant': return exact(p,['site','item']) && typeof p.site==='string' && /^-?\d{1,4},-?\d{1,4}$/.test(p.site) && ['repair','protection'].includes(p.item);
    case 'redraw': case 'extraHex': case 'acknowledge': case 'tunnel': return exact(p, []);
    default: return false;
  }
}
const offerId = id => crypto.createHash('sha256').update(id).digest('hex');
// Views contain plain JSON values. Copy them directly instead of encoding and parsing
// every nested field for every enemy, tower and mine on both clients' snapshots.
function copy(v){
  if(v===null||typeof v!=='object')return typeof v==='number'&&!Number.isFinite(v)?null:v;
  if(Array.isArray(v))return Array.from(v,item=>item===undefined?null:copy(item));
  const result={};for(const key of Object.keys(v))if(v[key]!==undefined)result[key]=copy(v[key]);return result;
}
function pick(value, fields) {
  const result = {};
  for (const key of fields) if (value[key] !== undefined) result[key] = copy(value[key]);
  return result;
}
// Bounded, already travelled path for presentation; no future route or private seed.
function motionPath(e) {
  const result=[{x:e.x,y:e.y}];let distance=0;
  if(e.leaping||!Array.isArray(e.points))return result;
  for(let i=e.index;i>=0&&result.length<64;i--){
    const p=e.points[i],last=result[0];
    if(e.points[i+1]?.tunnel)break;
    distance+=Math.hypot(last.x-p.x,last.y-p.y);
    // Keep corners, but collapse collinear samples. A longer trail also covers
    // fast units at 8× during a late packet without inflating straight roads.
    if(result.length>1){const b=result[0],c=result[1],ab={x:b.x-p.x,y:b.y-p.y},bc={x:c.x-b.x,y:c.y-b.y};if(Math.abs(ab.x*bc.y-ab.y*bc.x)<1e-7&&ab.x*bc.x+ab.y*bc.y>=0)result.shift();}
    result.unshift({x:p.x,y:p.y});if(distance>=512)break;
  }
  return result;
}
function createRoom({ seed = crypto.randomUUID(), loadouts, now = () => Date.now(), disconnectMs = 10000, reconnectMs = 120000, snapshot, lobbyRequired = false } = {}) {
  if (snapshot && (snapshot.format !== 'autohex-room' || snapshot.version !== 1 || !compatibleRuleset(snapshot.ruleset) || typeof snapshot.epoch !== 'string' || !Array.isArray(snapshot.seats) || snapshot.seats.length !== 2 || snapshot.seats.some(s => s && (!/^[a-f0-9]{64}$/.test(s.token) || !Number.isSafeInteger(s.next) || s.next < 1)))) throw Error('Invalid room checkpoint');
  const core = loadCore(), match = snapshot ? core.duo.restore(snapshot.match) : core.duo.create(seed, loadouts), epoch = snapshot?.epoch || crypto.randomUUID(), seats = snapshot ? copy(snapshot.seats) : [null, null]; let revision = (snapshot?.revision || 0) + 1;
  if (snapshot?.lobby && (!exact(snapshot.lobby, ['started', 'ready']) || typeof snapshot.lobby.started !== 'boolean' || !Array.isArray(snapshot.lobby.ready) || snapshot.lobby.ready.length !== 2 || snapshot.lobby.ready.some(v => typeof v !== 'boolean'))) throw Error('Invalid lobby readiness');
  const lobby = snapshot?.lobby || { started: !lobbyRequired, ready: [false, false] };
  // Restore disconnected. Both original seats must return before combat resumes.
  if (snapshot) seats.forEach((seat, player) => {
    if (!seat) return;
    seat.seen = now() - disconnectMs; seat.at = now(); seat.tokens = 40;
    // Older lobbies only stored the five selected towers on the board.
    if (!lobby.started && !seat.setupOptions && seat.loadoutChosen === undefined) {
      const loadout = match.boards[player].state.towerLoadout;
      seat.loadoutChosen = lobby.ready[player] || loadout.join('|') !== core.profile.START_TOWERS.join('|');
    }
  });
  let matchGeneration=0;
  const serverId = crypto.randomUUID(); let frameTime=now(); let connectionKey = '', expired = false, ended = null, maintenanceAt = null;
  const presenceNow = () => maintenanceAt ?? now();
  function setMaintenance(enabled) { if (typeof enabled !== 'boolean') throw Error('Invalid maintenance state'); if (enabled && maintenanceAt === null) maintenanceAt = now(); else if (!enabled && maintenanceAt !== null) { const elapsed = now() - maintenanceAt; for (const s of seats) if (s) s.seen += Math.max(0, elapsed); maintenanceAt = null; } connection(); }
  function connection() {
    const time = presenceNow(), players = seats.map(s => !s ? 'waiting' : time - s.seen >= disconnectMs ? 'disconnected' : 'connected');
    const missing = seats.filter(s => s && time - s.seen >= disconnectMs);
    const remaining = missing.length ? Math.max(0, Math.ceil((Math.min(...missing.map(s => s.seen + disconnectMs + reconnectMs)) - time) / 1000)) : null;
    if (seats.every(Boolean) && remaining === 0) expired = true;
    const paused = seats.every(Boolean) && missing.length > 0 || expired || !!ended || maintenanceAt !== null;
    const status = { players, paused, expired, maintenance: maintenanceAt !== null, remainingSeconds: paused ? remaining : null, ...(ended ? { ended: { ...ended } } : {}) };
    const key = JSON.stringify(status); if (key !== connectionKey) { connectionKey = key; revision++; } return status;
  }
  function connect(player) { if (!integer(player, 0, 1) || seats[player]) throw Error('Seat unavailable'); const token = crypto.randomBytes(32).toString('hex'); seats[player] = { token, next: 1, last: null, tokens: 40, at: now(), seen: now() }; if (seats.every(Boolean)) for (const s of seats) s.seen = now(); connection(); return { token, epoch, player }; }
  function touch(token) { const player = seat(token); if (player < 0) return false; connection(); if (expired) return false; seats[player].seen = presenceNow(); connection(); return true; }
  function seat(token) { return seats.findIndex(s => s && s.token === token); }
  function claim(token, clientId, takeover = false) {
    const player = seat(token); if (player < 0) return { ok: false, reason: 'unauthorized' };
    const session = seats[player];
    if (clientId === undefined && !session.clientId) return { ok: true, changed: false };
    if (typeof clientId !== 'string' || !/^[a-f0-9-]{36}$/.test(clientId)) return { ok: false, reason: 'invalid-client' };
    if (session.clientId && session.clientId !== clientId && !takeover) return { ok: false, reason: 'session-replaced' };
    if (session.clientId === clientId) return { ok: true, changed: false };
    session.clientId = clientId; revision++; return { ok: true, changed: true };
  }
  function leave(token) {
    const player = seat(token); if (player < 0) return { ok: false, reason: 'unauthorized' };
    if (ended) return { ok: true, duplicate: true };
    ended = { reason: 'player-left', player }; match.ready = [false, false]; revision++;
    return { ok: true };
  }
  function receive(token, packet) {
    const player = seat(token); if (player < 0) return { ok: false, reason: 'unauthorized' };
    const session = seats[player], time = now(); session.tokens = Math.min(40, session.tokens + Math.max(0, time - session.at) * .02); session.at = time;
    if (session.tokens < 1) return { ok: false, reason: 'rate-limit', next: session.next }; session.tokens--;
    if (!exact(packet, ['epoch', 'sequence', 'wave', 'phase', 'action', 'payload']) || packet.epoch !== epoch || !integer(packet.sequence, 1, Number.MAX_SAFE_INTEGER) || !integer(packet.wave, 0, 100000) || typeof packet.phase !== 'string' || !payloadValid(packet.action, packet.payload)) return { ok: false, reason: 'invalid', next: session.next };
    const fingerprint = JSON.stringify(packet);
    if (packet.sequence === session.next - 1 && session.last?.fingerprint === fingerprint) return { ...session.last.result, duplicate: true };
    if (packet.sequence !== session.next) return { ok: false, reason: 'sequence', next: session.next };
    matchGeneration++; // A validated command may mutate state even when rejected.
    let result;
    const clockBoundary=[match.phase,match.wave,!!match.paused].join(':');
    const presence = connection();
    if (presence.paused) result = { ok: false, reason: ended ? 'match-ended' : presence.maintenance ? 'maintenance' : presence.expired ? 'reconnect-expired' : 'disconnected' };
    else if (packet.action === 'lobbyLoadout') {
      const s=match.boards[player].state,{towers,heroId=s.heroId,difficulty=s.difficulty}=packet.payload;
      const access=session.setupOptions||{heroes:['standard'],twoFronts:false};
      const ok=!lobby.started&&towers.every(id=>Object.hasOwn(core.data.TOWERS,id)&&(!access.towers||access.towers.includes(id)))&&access.heroes.includes(heroId)&&(player===0?(difficulty==='normal'||access.twoFronts):difficulty===match.boards[0].state.difficulty);
      if(ok){
        core.duo.configureBoard(match,player,{loadout:towers,heroId,difficulty,unlocks:[...s.ultimateUnlocks,...s.buildingUnlocks],metaAugments:s.metaAugments});
        if(player===0&&match.boards[1].state.difficulty!==difficulty){
          const other=match.boards[1].state;core.duo.configureBoard(match,1,{loadout:other.towerLoadout,heroId:other.heroId,difficulty,unlocks:[...other.ultimateUnlocks,...other.buildingUnlocks],metaAugments:other.metaAugments});lobby.ready[1]=false;
        }
        session.loadoutChosen=true;lobby.ready[player]=false;revision++;
      }
      result={ok,reason:ok?null:'illegal'};
    }
    else if(packet.action==='lobbyAugments'){
      const access=session.setupOptions?.augments,cards=packet.payload.cards,s=match.boards[player].state;
      const ok=!lobby.started&&!!access&&cards.length<=access.slots&&cards.every(id=>access.choices.some(c=>c.id===id)&&(!Object.hasOwn(core.data.TOWERS,id)||s.towerLoadout.includes(id)));
      if(ok){session.augmentSelection=[...cards];s.metaAugments={version:1,cards:cards.map(id=>({...access.choices.find(c=>c.id===id)}))};lobby.ready[player]=false;revision++;}
      result={ok,reason:ok?null:'illegal'};
    }
    else if(packet.action==='lobbyStart'){const ok=player===0&&!lobby.started&&seats.every(Boolean)&&lobby.ready[1];if(ok){lobby.ready=[true,true];lobby.started=true;revision++;}result={ok,reason:ok?null:'partner-not-ready'};}
    else if (packet.action === 'lobbyReady') { const ok = !lobby.started && seats.every(Boolean); if (ok) { lobby.ready[player] = packet.payload.value; if (lobby.ready.every(Boolean)) lobby.started = true; revision++; } result = { ok, reason: ok ? null : 'illegal' }; }
    else if (!lobby.started) result = { ok: false, reason: 'lobby-not-ready' };
    else if (packet.wave !== match.wave || packet.phase !== match.boards[player].state.phase) result = { ok: false, reason: 'stale' };
    else { let payload = packet.payload; if (packet.action === 'reward' || packet.action === 'delivery' || packet.action === 'deliveryWish') { const offer = packet.action === 'deliveryWish' ? match.delivery?.offers[1-player] : packet.action === 'delivery' ? match.delivery?.offers[player] : match.boards[player].state.rewardOffer; payload = { ...payload, offerId: offer && offerId(offer.id) === payload.offerId ? offer.id : '' }; } const ok = core.duo.command(match, player, { id: epoch + ':' + player + ':' + packet.sequence, wave: packet.wave, action: packet.action, payload }); if (ok) revision++; result = { ok, reason: ok ? null : 'illegal' }; }
    // The first frame of a new wave/resume starts now, not at the end of the
    // previous wave. Clients must never interpolate through minutes of planning.
    if(clockBoundary!==[match.phase,match.wave,!!match.paused].join(':'))frameTime=now();
    result = { ...result, sequence: packet.sequence, next: ++session.next, revision }; session.last = { fingerprint, result }; return { ...result };
  }
  const placementCache = new WeakMap();
  function placements(s) { if (s.phase !== 'place' || s.celebrationActive) return []; const key = JSON.stringify([s.map.size, s.hand, s.openingRemaining]), cached = placementCache.get(s); if (cached?.key === key) return cached.value; const cells = new Map(); for (const t of s.map.values()) for (let i = 0; i < 6; i++) { const n = core.map.neighbor(t.q, t.r, i); if (!s.map.has(core.map.key(n.q, n.r))) cells.set(core.map.key(n.q, n.r), n); } const value = s.hand.map(id => Array.from({ length: 6 }, (_, rotation) => [...cells.values()].map(n => ({ ...n, legal: core.placement.canPlace(s, n.q, n.r, core.placement.card(s, id), rotation) })))); placementCache.set(s, { key, value }); return value; }
  const forecastCache = new WeakMap();
  function wavePlans(state) {
    const key = JSON.stringify([state.wave,state.income,state.seed,state.towerLoadout,state.difficulty]);
    const cached = forecastCache.get(state);
    if (cached?.key === key) return cached.plans;
    const plans = [state.wave,state.wave+1].map(wave => core.waves.plan(wave,state.income,false,state));
    forecastCache.set(state,{key,plans});
    return plans;
  }
  function applyAugments(token,profile,guest) {
    const player=seat(token);if(player<0)return {ok:false,reason:'unauthorized'};
    if(lobby.started||ended||maintenanceAt!==null)return {ok:false,reason:'illegal'};
    matchGeneration++;
    const s=match.boards[player].state;
    const session=seats[player],progress=core.profile.normalize(profile||guest||null,core.data.TOWERS);
    const heroes=Object.keys(core.heroes.definitions).filter(id=>core.profile.heroUnlocked(progress,id));
    const twoFronts=progress.milestones.includes('standard35');
    const first=!session.setupOptions&&!session.loadoutChosen;
    const hero=first?progress.activeHero:s.heroId,heroId=heroes.includes(hero)?hero:'standard';
    const difficulty=player===1?match.boards[0].state.difficulty:twoFronts&&(first?progress.difficulty:s.difficulty)==='dual'?'dual':'normal';
    const towers=[...new Set([...core.profile.START_TOWERS,...progress.unlockedTowers.filter(id=>Object.hasOwn(core.data.TOWERS,id))])];
    const preferred=first&&(profile||guest)?.activeLoadout?.length===5?progress.activeLoadout:s.towerLoadout;
    const loadout=[...new Set([...preferred.filter(id=>towers.includes(id)),...towers])].slice(0,5);
    const unlocks=core.profile.runUnlocks(progress).filter(id=>id.startsWith('ultimate:')||id.startsWith('building:')&&Object.hasOwn(core.profile.BUILDING_UNLOCKS,id.slice(9)));
    const accountAugments=core.augmentCards.clean(progress.augmentCards),slots=profile&&core.augmentCards.unlocked(progress)?core.augmentCards.slots(progress):0;
    const choices=slots?Object.keys(core.augmentCards.catalog).map(id=>({id,tier:core.augmentCards.tier(accountAugments.cards,id)})).filter(c=>c.tier>=0):[];
    // The lobby loadout belongs to this party; never rewrite the account save to change it.
    const selection=session.augmentSelection||accountAugments.equipped;
    const selected={version:1,cards:selection.filter(id=>choices.some(c=>c.id===id)).slice(0,slots).filter(id=>!Object.hasOwn(core.data.TOWERS,id)||loadout.includes(id)).map(id=>({...choices.find(c=>c.id===id)}))};
    if(heroId!==s.heroId||difficulty!==s.difficulty||loadout.join('|')!==s.towerLoadout.join('|')){
      core.duo.configureBoard(match,player,{loadout,heroId,difficulty,unlocks,metaAugments:selected});
    }else{
      s.metaAugments=copy(selected);s.ultimateUnlocks=unlocks.filter(id=>id.startsWith('ultimate:'));s.buildingUnlocks=unlocks.filter(id=>id.startsWith('building:'));
    }
    if(player===0&&match.boards[1].state.difficulty!==difficulty){const other=match.boards[1].state;core.duo.configureBoard(match,1,{loadout:other.towerLoadout,heroId:other.heroId,difficulty,unlocks:[...other.ultimateUnlocks,...other.buildingUnlocks],metaAugments:other.metaAugments});lobby.ready[1]=false;}
    const identity=profile?._duoIdentity;if(identity&&typeof identity.username==='string'&&identity.username.length<=80)session.identity={id:String(identity.id),username:identity.username};else if(!profile)delete session.identity;
    session.setupOptions={heroes,twoFronts,towers,augments:{slots,choices}};lobby.ready[player]=false;revision++;
    const equipped=match.boards[player].state;
    return {ok:true,name:session.identity?.username||('Gast '+(player+1)),cards:copy(selected.cards),setupOptions:copy(session.setupOptions),heroId,difficulty,loadout:[...loadout],ultimateUnlocks:[...equipped.ultimateUnlocks],buildingUnlocks:[...equipped.buildingUnlocks]};
  }
  // Geometry changes rarely during combat; do not walk every road for each landmark at 10 Hz per viewer.
  const terrainCache=new WeakMap();
  function terrain(s){
    const key=JSON.stringify([[...s.map.keys()],s.map.revealBonus,s.biomeSeed,s.biomeLayoutVersion,s.challengeDay,[...s.landmarks.values()].map(l=>[l.q,l.r,l.claimed,!!l.prefab,l.relicLocated])]);
    let cached=terrainCache.get(s);
    if(cached?.key!==key){cached={key,biomes:Object.fromEntries(core.biomes.visibleTiles(s).map(t=>[t.q+','+t.r,core.biomes.forTile(s,t)])),visibility:new Map([...s.landmarks.values()].map(l=>[l.q+','+l.r,core.exploration.visibility(s.map,l)]))};terrainCache.set(s,cached);}
    return cached;
  }
  function view(token) {
    const player = seat(token); if (player < 0) return null; const presence = connection();
    const boards = match.boards.map(({ state: s }, index) => {const ground=terrain(s);return ({
      visibleBiomes: copy(ground.biomes), player: index, phase: s.phase, gold: s.gold, income: s.income, wave: s.wave, elapsedMs: s.elapsedMs, ...pick(s, ['heroId', 'baseUpgrades', 'earnedMeta', 'difficulty', 'openingRemaining', 'baseExits', 'lastCompletedWave', 'pendingSpawns', 'waveKills', 'buildingVersion', 'goldEarned', 'consumables', 'consumableUsage', 'extraHexPurchases', 'extraHexWave', 'augments', 'freeTowerBuilds', 'freeExtraHexes', 'redrawWave', 'merchantPurchases', 'merchantProtectionWave', 'merchantProtection']),
      map: [...s.map.values()].map(t => ({ ...pick(t, ['q', 'r', 'type', 'rotation', 'roads', 'slots', 'buildingSlots', 'buildings', 'income', 'tunnels', 'tunnelLabel', 'site', 'siteEffect', 'siteSlot', 'siteIncome']), biome: core.biomes.forTile(s, t), towers: (t.towers || []).map(tower => tower ? pick(tower, ['type', 'level', 'branch', 'finalUpgrade', 'ultimate', 'guestOwner', 'targetPriority', 'biome', 'tileType', 'rangeFactor', 'supportDamage', 'supportRange', 'forgeSupported', 'paid', 'upgradeSpent', 'builtOnWave', 'statId', 'souls', 'aim', 'overloadUntil', 'overloadPending']) : null) })),
      landmarks: [...s.landmarks.values()].flatMap(l => { const visibility = ground.visibility.get(l.q+','+l.r); return visibility === 'clear' ? [pick(l, ['q', 'r', 'type', 'claimed', 'status', 'consent', 'prefab', 'augment', 'merchant'])] : visibility === 'fog' ? [pick(l, ['q', 'r'])] : []; }),
      enemies: s.enemies.map(e => ({motionPath:motionPath(e),...pick(e, ['id', 'type', 'name', 'originBiome', 'bossKind', 'immunity', 'abilityIcon', 'description', 'color', 'caravan', 'splitOnDeath', 'killGold', 'x', 'y', 'hp', 'maxHp', 'armorHp', 'maxArmorHp', 'magicHp', 'maxMagicHp', 'alive', 'slowFactor', 'shieldHits', 'molted', 'sprinting', 'leaping', 'leapProgress', 'crouching', 'sporeHidden', 'charge'])})),
      projectiles: (s.projectiles || []).map(p => pick(p, ['kind', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'r', 'ttl', 'max', 'fade', 'color', 'tower', 'variant', 'splash', 'id', 'hits', 'hitAt', 'pts'])),
      mines: (s.mines || []).map(m => pick(m, ['id', 'x', 'y', 'color'])),
      hand:[...s.hand],loadout:[...s.towerLoadout],deckCounts:s.deck.reduce((a,id)=>(a[id]=(a[id]||0)+1,a),{}),
      ...(index === player ? { ...pick(s, ['removalSource', 'metaAugments', 'augmentMarketWave', 'runTowerStats', 'runTowerDetails', 'baseKills', 'consumableKills', 'baseDamage', 'patricianBonusIncome']), duoDiamondEstimate: Math.max(0, core.profile.waveDiamonds(Math.min(...match.boards.map(r => r.state.lastCompletedWave || 0))) + (s.earnedMeta?.periodicBosses || 0) * 5 + match.boards.reduce((n, r) => n + (r.state.earnedMeta?.explorationBosses || 0), 0) * 3 - (match.victoryPaid?.[index] || 0)), hand: [...s.hand], placements: copy(placements(s)), rescueCard: s.rescueCard ? copy(s.rescueCard) : null, tunnelOffer: s.tunnelOffer ? copy(s.tunnelOffer) : null, ultimateUnlocks: [...s.ultimateUnlocks], buildingUnlocks: [...s.buildingUnlocks], wavePlans: wavePlans(s), drawPile: [...s.drawPile], discard: [...s.discard], deckCounts: s.deck.reduce((a, id) => (a[id] = (a[id] || 0) + 1, a), {}), loadout: [...s.towerLoadout], rewardOffer: s.rewardOffer ? { ...pick(s.rewardOffer, ['kind', 'choices', 'skippable']), ...(s.rewardOffer.kind==='shrine'?{shrineEffect:core.exploration.shrineEffect(s.landmarks,s.pendingShrine)}:s.rewardOffer.kind==='boss'?{rarity:core.exploration.bossRewardRarity(s.seed,s.bossRewards[0])}:{}), id: offerId(s.rewardOffer.id) } : null, celebration: s.activeCelebration ? copy(s.activeCelebration) : null } : {}),
    });});
    const value={ lobbyState: {...copy(lobby),names:seats.map((seat,i)=>seat?.identity?.username||('Gast '+(i+1))),host:0,...(!lobby.started?{setupOptions:copy(seats[player].setupOptions||{heroes:['standard'],twoFronts:false})}:{}),augments:match.boards.map(r=>copy(r.state.metaAugments?.cards||[])),loadouts:match.boards.map(r=>[...r.state.towerLoadout])}, speed: match.speed || 1, paused: !!match.paused, protocol: 1, frameTime, serverId, epoch, revision, player, connection: presence, next: seats[player].next, hp: match.hp, maxHp: match.maxHp, wave: match.wave, phase: match.phase, ready: [...match.ready], finished: [...match.finished], portals: copy(match.portals), reinforcements: copy(match.reinforcements), pendingHelp: match.pendingHelp.map(h => h ? { at: h.at } : null), result: publicResult(), endless:!!match.endless, endlessVotes:copy(match.endlessVotes||[false,false]), rematch: copy(match.rematch || [false, false]), support: copy(match.support), hexGifts:copy(match.hexGifts||[null,null]), delivery: match.delivery ? { wave: match.delivery.wave, offers: match.delivery.offers.map((o, i) => i === player ? { ...copy(o), id: offerId(o.id) } : { id:offerId(o.id), index:o.index, wish:o.wish??null, choices:copy(o.choices) }) } : null, boards };
    return value;
  }
  function publicResult() { return match.result ? { ...copy(match.result), id: offerId(match.result.id) } : null; }
  // Cache only serialized match data; always refresh seats, rate limits and receipts.
  let savedGeneration=-1,savedMatch;
  function serializeCheckpoint() {
    if(ended||expired)return null;
    if(savedGeneration!==matchGeneration){savedMatch=core.duo.stringify(match);savedGeneration=matchGeneration;}
    const header={format:'autohex-room',version:1,ruleset:RULESET,lobby:copy(lobby),epoch,revision,seats:copy(seats)};
    return JSON.stringify(header).slice(0,-1)+',"match":'+savedMatch+'}';
  }
  function checkpoint() { if (ended || expired) return null; return { format: 'autohex-room', version: 1, ruleset: RULESET, lobby: copy(lobby), epoch, revision, seats: copy(seats), match: core.duo.capture(match) }; }
  return { applyAugments, hasSeat:token=>seat(token)>=0, pushKey(token){const i=seat(token);if(i<0)return null;connection();return serverId+epoch+':'+revision+':'+seats[i].next;}, get result() { return publicResult(); }, setMaintenance, connect, touch, claim, leave, receive, view, presence() { return connection(); }, checkpoint, serializeCheckpoint, tick() { if (!lobby.started || connection().paused || match.paused || match.phase!=='combat') return; matchGeneration++;frameTime=now(); for (let i = 0; i < (match.speed || 1) * core.runtime.PLAYBACK_RATE; i++)core.duo.tick(match); revision++; } };
}
module.exports = { createRoom, payloadValid, RULESET, motionPath, compatibleRuleset };
