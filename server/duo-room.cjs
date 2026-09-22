'use strict';
// Transport-independent trust boundary. Only the server binds a seat to a connection.
const crypto=require('node:crypto');
const loadCore=require('../towerdefense-v0.1/headless-core.cjs');
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const exact=(v,keys)=>object(v)&&Object.keys(v).every(k=>keys.includes(k))&&keys.every(k=>Object.hasOwn(v,k));
const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
const word=v=>typeof v==='string'&&/^[a-zA-Z0-9:_-]{1,120}$/.test(v);
const slot=v=>exact(v,['q','r','index'])&&integer(v.q,-1000,1000)&&integer(v.r,-1000,1000)&&integer(v.index,0,31);
function payloadValid(action,p){
  switch(action){
    case 'ready':return exact(p,['value'])&&typeof p.value==='boolean';
    case 'place':return exact(p,['q','r','index','rotation'])&&integer(p.q,-1000,1000)&&integer(p.r,-1000,1000)&&integer(p.index,0,4)&&integer(p.rotation,0,5);
    case 'tower':return exact(p,['type','slots'])&&word(p.type)&&Array.isArray(p.slots)&&p.slots.length>0&&p.slots.length<=32&&p.slots.every(slot);
    case 'upgrade':return exact(p,['slot','upgrade'])&&slot(p.slot)&&word(p.upgrade);
    case 'building':return exact(p,['slot','type'])&&slot(p.slot)&&['house','forge','market'].includes(p.type);
    case 'buildingUpgrade':return exact(p,['slot'])&&slot(p.slot);
    case 'portal':case 'reinforcement':return exact(p,['slot'])&&(p.slot===null||slot(p.slot));
    case 'reward':return exact(p,['offerId','index'])&&typeof p.offerId==='string'&&p.offerId.length<=200&&(p.index===null||integer(p.index,0,1000));
    case 'acknowledge':case 'tunnel':return exact(p,[]);
    default:return false;
  }
}
const offerId=id=>crypto.createHash('sha256').update(id).digest('hex');
const copy=v=>JSON.parse(JSON.stringify(v));
const pick=(v,fields)=>Object.fromEntries(fields.filter(k=>v[k]!==undefined).map(k=>[k,copy(v[k])]));
function createRoom({seed=crypto.randomUUID(),loadouts,now=()=>Date.now()}={}){
  const core=loadCore(),match=core.duo.create(seed,loadouts),epoch=crypto.randomUUID(),seats=[null,null];let revision=0;
  function connect(player){if(!integer(player,0,1)||seats[player])throw Error('Seat unavailable');const token=crypto.randomBytes(32).toString('hex');seats[player]={token,next:1,last:null,tokens:40,at:now()};return {token,epoch,player};}
  function seat(token){return seats.findIndex(s=>s&&s.token===token);}
  function receive(token,packet){
    const player=seat(token);if(player<0)return {ok:false,reason:'unauthorized'};
    const session=seats[player],time=now();session.tokens=Math.min(40,session.tokens+Math.max(0,time-session.at)*.02);session.at=time;
    if(session.tokens<1)return {ok:false,reason:'rate-limit',next:session.next};session.tokens--;
    if(!exact(packet,['epoch','sequence','wave','phase','action','payload'])||packet.epoch!==epoch||!integer(packet.sequence,1,Number.MAX_SAFE_INTEGER)||!integer(packet.wave,0,100000)||typeof packet.phase!=='string'||!payloadValid(packet.action,packet.payload))return {ok:false,reason:'invalid',next:session.next};
    const fingerprint=JSON.stringify(packet);
    if(packet.sequence===session.next-1&&session.last?.fingerprint===fingerprint)return {...session.last.result,duplicate:true};
    if(packet.sequence!==session.next)return {ok:false,reason:'sequence',next:session.next};
    let result;
    if(packet.wave!==match.wave||packet.phase!==match.boards[player].state.phase)result={ok:false,reason:'stale'};
    else {let payload=packet.payload;if(packet.action==='reward'){const offer=match.boards[player].state.rewardOffer;payload={...payload,offerId:offer&&offerId(offer.id)===payload.offerId?offer.id:''};}const ok=core.duo.command(match,player,{id:epoch+':'+player+':'+packet.sequence,wave:packet.wave,action:packet.action,payload});if(ok)revision++;result={ok,reason:ok?null:'illegal'};}
    result={...result,sequence:packet.sequence,next:++session.next,revision};session.last={fingerprint,result};return {...result};
  }
  const placementCache=new WeakMap();
  function placements(s){if(s.phase!=='place'||s.celebrationActive)return [];const key=JSON.stringify([s.map.size,s.hand,s.openingRemaining]),cached=placementCache.get(s);if(cached?.key===key)return cached.value;const cells=new Map();for(const t of s.map.values())for(let i=0;i<6;i++){const n=core.map.neighbor(t.q,t.r,i);if(!s.map.has(core.map.key(n.q,n.r)))cells.set(core.map.key(n.q,n.r),n);}const value=s.hand.map(id=>Array.from({length:6},(_,rotation)=>[...cells.values()].map(n=>({...n,legal:core.placement.canPlace(s,n.q,n.r,core.placement.card(s,id),rotation)}))));placementCache.set(s,{key,value});return value;}
  function view(token){const player=seat(token);if(player<0)return null;
    const boards=match.boards.map(({state:s},index)=>({
      player:index,phase:s.phase,gold:s.gold,income:s.income,wave:s.wave,elapsedMs:s.elapsedMs,
      map:[...s.map.values()].map(t=>({...pick(t,['q','r','type','rotation','roads','slots','buildingSlots','buildings','income','tunnels','tunnelLabel']),biome:core.biomes.forTile(s,t),towers:(t.towers||[]).map(tower=>tower?pick(tower,['type','level','branch','finalUpgrade','ultimate','guestOwner','targetPriority','biome','tileType','rangeFactor','supportDamage']):null)})),
      landmarks:[...s.landmarks.values()].flatMap(l=>{const visibility=core.exploration.visibility(s.map,l);return visibility==='clear'?[pick(l,['q','r','type','claimed','status','prefab'])]:visibility==='fog'?[pick(l,['q','r'])]:[];}),
      enemies:s.enemies.map(e=>pick(e,['id','type','name','bossKind','x','y','hp','maxHp','armorHp','maxArmorHp','magicHp','maxMagicHp','alive','slowFactor'])),
      projectiles:(s.projectiles||[]).map(p=>pick(p,['kind','x','y','x1','y1','x2','y2','r','ttl','max','color','tower','id','hits','hitAt'])),
      mines:(s.mines||[]).map(m=>pick(m,['id','x','y','color'])),
      ...(index===player?{hand:[...s.hand],placements:copy(placements(s)),rescueCard:s.rescueCard?copy(s.rescueCard):null,tunnelOffer:s.tunnelOffer?copy(s.tunnelOffer):null,ultimateUnlocks:[...s.ultimateUnlocks],buildingUnlocks:[...s.buildingUnlocks],deckCounts:s.deck.reduce((a,id)=>(a[id]=(a[id]||0)+1,a),{}),loadout:[...s.towerLoadout],rewardOffer:s.rewardOffer?{...pick(s.rewardOffer,['kind','choices','skippable']),id:offerId(s.rewardOffer.id)}:null,celebration:s.activeCelebration?copy(s.activeCelebration):null}:{}),
    }));
    return {protocol:1,epoch,revision,player,next:seats[player].next,hp:match.hp,maxHp:match.maxHp,wave:match.wave,phase:match.phase,ready:[...match.ready],finished:[...match.finished],portals:copy(match.portals),reinforcements:copy(match.reinforcements),pendingHelp:match.pendingHelp.map(h=>h?{at:h.at}:null),support:copy(match.support),boards};
  }
  return {connect,receive,view,tick(){core.duo.tick(match);revision++;}};
}
module.exports={createRoom,payloadValid};
