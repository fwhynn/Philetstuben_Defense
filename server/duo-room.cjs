'use strict';
// Transport-independent trust boundary. Only the server binds a seat to a connection.
const crypto=require('node:crypto');
const loadCore=require('../headless-core.cjs');
const RULESET=require('../package.json').version;
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const exact=(v,keys)=>object(v)&&Object.keys(v).every(k=>keys.includes(k))&&keys.every(k=>Object.hasOwn(v,k));
const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
const word=v=>typeof v==='string'&&/^[a-zA-Z0-9:_-]{1,120}$/.test(v);
const slot=v=>exact(v,['q','r','index'])&&integer(v.q,-1000,1000)&&integer(v.r,-1000,1000)&&integer(v.index,0,31);
function payloadValid(action,p){
  switch(action){
    case 'guardian':return exact(p,['board','id','value'])&&integer(p.board,0,1)&&typeof p.id==='string'&&/^-?\d{1,4},-?\d{1,4}$/.test(p.id)&&typeof p.value==='boolean';
    case 'lobbyReady':
    case 'pause':
    case 'rematch':
    case 'ready':return exact(p,['value'])&&typeof p.value==='boolean';
    case 'place':return exact(p,['q','r','index','rotation'])&&integer(p.q,-1000,1000)&&integer(p.r,-1000,1000)&&integer(p.index,0,4)&&integer(p.rotation,0,5);
    case 'tower':return exact(p,['type','slots'])&&word(p.type)&&Array.isArray(p.slots)&&p.slots.length>0&&p.slots.length<=32&&p.slots.every(slot);
    case 'upgrade':return exact(p,['slot','upgrade'])&&slot(p.slot)&&word(p.upgrade);
    case 'building':return exact(p,['slot','type'])&&slot(p.slot)&&['house','forge','market','portal'].includes(p.type);
    case 'speed':return exact(p,['value'])&&integer(p.value,1,8);
    case 'consumable':return exact(p,['kind','slot'])&&['spikes','resin','overload'].includes(p.kind)&&slot(p.slot);
    case 'baseUpgrade':return exact(p,['kind'])&&['walls','weapon'].includes(p.kind);
    case 'targetPriority':return exact(p,['slot','priorities'])&&slot(p.slot)&&Array.isArray(p.priorities)&&p.priorities.length===3&&new Set(p.priorities).size===3&&p.priorities.every(v=>['closestBase','furthestBase','mostHealth','leastHealth','mostArmor','mostMagic','boss','healer','closestTower','furthestTower'].includes(v));
    case 'buildingTarget':return exact(p,['slot','target'])&&slot(p.slot)&&typeof p.target==='string'&&/^-?\d{1,4},-?\d{1,4}$/.test(p.target);
    case 'sellTower':case 'sellBuilding':
    case 'buildingUpgrade':return exact(p,['slot'])&&slot(p.slot);
    case 'portal':case 'reinforcement':return exact(p,['slot'])&&(p.slot===null||slot(p.slot));
    case 'delivery':return exact(p,['offerId','index'])&&typeof p.offerId==='string'&&p.offerId.length<=200&&integer(p.index,0,2);
    case 'reward':return exact(p,['offerId','index'])&&typeof p.offerId==='string'&&p.offerId.length<=200&&(p.index===null||integer(p.index,0,1000));
    case 'acknowledge':case 'tunnel':return exact(p,[]);
    default:return false;
  }
}
const offerId=id=>crypto.createHash('sha256').update(id).digest('hex');
const copy=v=>JSON.parse(JSON.stringify(v));
const pick=(v,fields)=>Object.fromEntries(fields.filter(k=>v[k]!==undefined).map(k=>[k,copy(v[k])]));
function createRoom({seed=crypto.randomUUID(),loadouts,now=()=>Date.now(),disconnectMs=10000,reconnectMs=120000,snapshot,lobbyRequired=false}={}){
  if(snapshot&&(snapshot.format!=='autohex-room'||snapshot.version!==1||snapshot.ruleset!==RULESET||typeof snapshot.epoch!=='string'||!Array.isArray(snapshot.seats)||snapshot.seats.length!==2||snapshot.seats.some(s=>s&&(!/^[a-f0-9]{64}$/.test(s.token)||!Number.isSafeInteger(s.next)||s.next<1))))throw Error('Invalid room checkpoint');
  const core=loadCore(),match=snapshot?core.duo.restore(snapshot.match):core.duo.create(seed,loadouts),epoch=snapshot?.epoch||crypto.randomUUID(),seats=snapshot?copy(snapshot.seats):[null,null];let revision=(snapshot?.revision||0)+1;
  if(snapshot?.lobby&&(!exact(snapshot.lobby,['started','ready'])||typeof snapshot.lobby.started!=='boolean'||!Array.isArray(snapshot.lobby.ready)||snapshot.lobby.ready.length!==2||snapshot.lobby.ready.some(v=>typeof v!=='boolean')))throw Error('Invalid lobby readiness');
  const lobby=snapshot?.lobby||{started:!lobbyRequired,ready:[false,false]};
  // Restore disconnected. Both original seats must return before combat resumes.
  if(snapshot)for(const seat of seats)if(seat){seat.seen=now()-disconnectMs;seat.at=now();seat.tokens=40;}
  const serverId=crypto.randomUUID();let connectionKey='',expired=false,ended=null,maintenanceAt=null;
  const presenceNow=()=>maintenanceAt??now();
  function setMaintenance(enabled){if(typeof enabled!=='boolean')throw Error('Invalid maintenance state');if(enabled&&maintenanceAt===null)maintenanceAt=now();else if(!enabled&&maintenanceAt!==null){const elapsed=now()-maintenanceAt;for(const s of seats)if(s)s.seen+=Math.max(0,elapsed);maintenanceAt=null;}connection();}
  function connection(){
    const time=presenceNow(),players=seats.map(s=>!s?'waiting':time-s.seen>=disconnectMs?'disconnected':'connected');
    const missing=seats.filter(s=>s&&time-s.seen>=disconnectMs);
    const remaining=missing.length?Math.max(0,Math.ceil((Math.min(...missing.map(s=>s.seen+disconnectMs+reconnectMs))-time)/1000)):null;
    if(seats.every(Boolean)&&remaining===0)expired=true;
    const paused=seats.every(Boolean)&&missing.length>0||expired||!!ended||maintenanceAt!==null;
    const status={players,paused,expired,maintenance:maintenanceAt!==null,remainingSeconds:paused?remaining:null,...(ended?{ended:{...ended}}:{})};
    const key=JSON.stringify(status);if(key!==connectionKey){connectionKey=key;revision++;}return status;
  }
  function connect(player){if(!integer(player,0,1)||seats[player])throw Error('Seat unavailable');const token=crypto.randomBytes(32).toString('hex');seats[player]={token,next:1,last:null,tokens:40,at:now(),seen:now()};if(seats.every(Boolean))for(const s of seats)s.seen=now();connection();return {token,epoch,player};}
  function touch(token){const player=seat(token);if(player<0)return false;connection();if(expired)return false;seats[player].seen=presenceNow();connection();return true;}
  function seat(token){return seats.findIndex(s=>s&&s.token===token);}
  function claim(token,clientId,takeover=false){
    const player=seat(token);if(player<0)return {ok:false,reason:'unauthorized'};
    const session=seats[player];
    if(clientId===undefined&&!session.clientId)return {ok:true,changed:false};
    if(typeof clientId!=='string'||!/^[a-f0-9-]{36}$/.test(clientId))return {ok:false,reason:'invalid-client'};
    if(session.clientId&&session.clientId!==clientId&&!takeover)return {ok:false,reason:'session-replaced'};
    if(session.clientId===clientId)return {ok:true,changed:false};
    session.clientId=clientId;revision++;return {ok:true,changed:true};
  }
  function leave(token){
    const player=seat(token);if(player<0)return {ok:false,reason:'unauthorized'};
    if(ended)return {ok:true,duplicate:true};
    ended={reason:'player-left',player};match.ready=[false,false];revision++;
    return {ok:true};
  }
  function receive(token,packet){
    const player=seat(token);if(player<0)return {ok:false,reason:'unauthorized'};
    const session=seats[player],time=now();session.tokens=Math.min(40,session.tokens+Math.max(0,time-session.at)*.02);session.at=time;
    if(session.tokens<1)return {ok:false,reason:'rate-limit',next:session.next};session.tokens--;
    if(!exact(packet,['epoch','sequence','wave','phase','action','payload'])||packet.epoch!==epoch||!integer(packet.sequence,1,Number.MAX_SAFE_INTEGER)||!integer(packet.wave,0,100000)||typeof packet.phase!=='string'||!payloadValid(packet.action,packet.payload))return {ok:false,reason:'invalid',next:session.next};
    const fingerprint=JSON.stringify(packet);
    if(packet.sequence===session.next-1&&session.last?.fingerprint===fingerprint)return {...session.last.result,duplicate:true};
    if(packet.sequence!==session.next)return {ok:false,reason:'sequence',next:session.next};
    let result;
    const presence=connection();
    if(presence.paused)result={ok:false,reason:ended?'match-ended':presence.maintenance?'maintenance':presence.expired?'reconnect-expired':'disconnected'};
    else if(packet.action==='lobbyReady'){const ok=!lobby.started&&seats.every(Boolean);if(ok){lobby.ready[player]=packet.payload.value;if(lobby.ready.every(Boolean))lobby.started=true;revision++;}result={ok,reason:ok?null:'illegal'};}
    else if(!lobby.started)result={ok:false,reason:'lobby-not-ready'};
    else if(packet.wave!==match.wave||packet.phase!==match.boards[player].state.phase)result={ok:false,reason:'stale'};
    else {let payload=packet.payload;if(packet.action==='reward'||packet.action==='delivery'){const offer=packet.action==='delivery'?match.delivery?.offers[player]:match.boards[player].state.rewardOffer;payload={...payload,offerId:offer&&offerId(offer.id)===payload.offerId?offer.id:''};}const ok=core.duo.command(match,player,{id:epoch+':'+player+':'+packet.sequence,wave:packet.wave,action:packet.action,payload});if(ok)revision++;result={ok,reason:ok?null:'illegal'};}
    result={...result,sequence:packet.sequence,next:++session.next,revision};session.last={fingerprint,result};return {...result};
  }
  const placementCache=new WeakMap();
  function placements(s){if(s.phase!=='place'||s.celebrationActive)return [];const key=JSON.stringify([s.map.size,s.hand,s.openingRemaining]),cached=placementCache.get(s);if(cached?.key===key)return cached.value;const cells=new Map();for(const t of s.map.values())for(let i=0;i<6;i++){const n=core.map.neighbor(t.q,t.r,i);if(!s.map.has(core.map.key(n.q,n.r)))cells.set(core.map.key(n.q,n.r),n);}const value=s.hand.map(id=>Array.from({length:6},(_,rotation)=>[...cells.values()].map(n=>({...n,legal:core.placement.canPlace(s,n.q,n.r,core.placement.card(s,id),rotation)}))));placementCache.set(s,{key,value});return value;}
  function view(token){const player=seat(token);if(player<0)return null;const presence=connection();
    const boards=match.boards.map(({state:s},index)=>({
      visibleBiomes:Object.fromEntries(core.biomes.visibleTiles(s).map(t=>[t.q+','+t.r,core.biomes.forTile(s,t)])),player:index,phase:s.phase,gold:s.gold,income:s.income,wave:s.wave,elapsedMs:s.elapsedMs,...pick(s,['heroId','baseUpgrades','difficulty','openingRemaining','baseExits','lastCompletedWave','pendingSpawns','waveKills','buildingVersion','goldEarned','consumables']),
      map:[...s.map.values()].map(t=>({...pick(t,['q','r','type','rotation','roads','slots','buildingSlots','buildings','income','tunnels','tunnelLabel','site','siteEffect','siteSlot','siteIncome']),biome:core.biomes.forTile(s,t),towers:(t.towers||[]).map(tower=>tower?pick(tower,['type','level','branch','finalUpgrade','ultimate','guestOwner','targetPriority','biome','tileType','rangeFactor','supportDamage','supportRange','paid','upgradeSpent','builtOnWave','statId','souls','overloadUntil','overloadPending']):null)})),
      landmarks:[...s.landmarks.values()].flatMap(l=>{const visibility=core.exploration.visibility(s.map,l);return visibility==='clear'?[pick(l,['q','r','type','claimed','status','consent','prefab'])]:visibility==='fog'?[pick(l,['q','r'])]:[];}),
      enemies:s.enemies.map(e=>pick(e,['id','type','name','originBiome','bossKind','immunity','abilityIcon','description','color','caravan','splitOnDeath','killGold','x','y','hp','maxHp','armorHp','maxArmorHp','magicHp','maxMagicHp','alive','slowFactor'])),
      projectiles:(s.projectiles||[]).map(p=>pick(p,['kind','x','y','x1','y1','x2','y2','r','ttl','max','color','tower','variant','splash','id','hits','hitAt','pts'])),
      mines:(s.mines||[]).map(m=>pick(m,['id','x','y','color'])),
      ...(index===player?{...pick(s,['runTowerStats','runTowerDetails','baseKills','consumableKills','baseDamage','patricianBonusIncome']),duoDiamondEstimate:Math.floor(Math.min(...match.boards.map(r=>r.state.lastCompletedWave||0))/2)+(s.earnedMeta?.periodicBosses||0)*5+match.boards.reduce((n,r)=>n+(r.state.earnedMeta?.explorationBosses||0),0)*3,hand:[...s.hand],placements:copy(placements(s)),rescueCard:s.rescueCard?copy(s.rescueCard):null,tunnelOffer:s.tunnelOffer?copy(s.tunnelOffer):null,ultimateUnlocks:[...s.ultimateUnlocks],buildingUnlocks:[...s.buildingUnlocks],wavePlans:[core.waves.plan(s.wave,s.income,!!s.challengeDay,s),core.waves.plan(s.wave+1,s.income,!!s.challengeDay,s)],drawPile:[...s.drawPile],discard:[...s.discard],deckCounts:s.deck.reduce((a,id)=>(a[id]=(a[id]||0)+1,a),{}),loadout:[...s.towerLoadout],rewardOffer:s.rewardOffer?{...pick(s.rewardOffer,['kind','choices','skippable']),id:offerId(s.rewardOffer.id)}:null,celebration:s.activeCelebration?copy(s.activeCelebration):null}:{}),
    }));
    return {lobbyState:copy(lobby),speed:match.speed||1,paused:!!match.paused,protocol:1,serverId,epoch,revision,player,connection:presence,next:seats[player].next,hp:match.hp,maxHp:match.maxHp,wave:match.wave,phase:match.phase,ready:[...match.ready],finished:[...match.finished],portals:copy(match.portals),reinforcements:copy(match.reinforcements),pendingHelp:match.pendingHelp.map(h=>h?{at:h.at}:null),result:publicResult(),rematch:match.rematch||[false,false],support:copy(match.support),delivery:match.delivery?{wave:match.delivery.wave,offers:match.delivery.offers.map((o,i)=>i===player?{...copy(o),id:offerId(o.id)}:{index:o.index===null?null:0})}:null,boards};
  }
  function publicResult(){return match.result?{...copy(match.result),id:offerId(match.result.id)}:null;}
  function checkpoint(){if(ended||expired)return null;return {format:'autohex-room',version:1,ruleset:RULESET,lobby:copy(lobby),epoch,revision,seats:copy(seats),match:core.duo.capture(match)};}
  return {get result(){return publicResult();},setMaintenance,connect,touch,claim,leave,receive,view,checkpoint,tick(){if(!lobby.started||connection().paused)return;for(let i=0;i<(match.speed||1);i++)core.duo.tick(match);revision++;}};
}
module.exports={createRoom,payloadValid};
