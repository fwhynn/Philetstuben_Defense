/* Network adapter: presentation state only; never ticks or mutates the server simulation. */
const HexDuoClient=(()=>{
 function mergeMap(previous,tiles){
  const geometry=t=>JSON.stringify([t.type,t.rotation,t.roads,t.slots,t.buildingSlots,t.tunnels,t.site,t.siteSlot]);
  const same=previous?.size===tiles.length&&tiles.every(t=>{const old=previous.get(t.q+','+t.r);return old&&geometry(old)===geometry(t);});
  const map=same?previous:new Map();
  for(const tile of tiles){const id=tile.q+','+tile.r,old=previous?.get(id);
    if(old){tile.towers=(tile.towers||[]).map((tower,i)=>{const before=old.towers?.[i];if(!tower||!before||tower.statId!==before.statId||tower.type!==before.type)return tower;for(const k of Object.keys(before))if(!(k in tower))delete before[k];return Object.assign(before,tower);});
      for(const k of Object.keys(old))if(!(k in tile))delete old[k];Object.assign(old,tile);map.set(id,old);
    }else map.set(id,tile);
  }return map;
 }
 const presentationRecords=new WeakMap();
 function presentation(view,old,{lazy=false}={}){
  const previousWave=old?.wave;
  return {...view,boards:view.boards.map((board,i)=>{
   const oldBoard=old?.boards[i],record=oldBoard&&presentationRecords.get(oldBoard);
   const previous=record?(record.state||record.previous):oldBoard?.state;
   const cached={previous,state:null};
   const build=()=>cached.state??=( {...board,enemies:(board.enemies||[]).map(e=>({...e})),remoteView:true,showSlotHints:true,selectedSlot:previous?.selectedSlot,selectedTower:previous?.selectedTower,selectedBuilding:previous?.selectedBuilding,hp:view.hp,maxHp:view.maxHp,hand:board.hand||[],deck:Object.entries(board.deckCounts||{}).flatMap(([id,n])=>Array(n).fill(id)),map:Object.assign(mergeMap(previous?.map,board.map),{revealBonus:board.augments?.includes('scout')?1:0}),landmarks:new Map(board.landmarks.map(t=>[t.q+','+t.r,t])),towerLoadout:board.loadout||[],ultimateUnlocks:board.ultimateUnlocks||[],buildingUnlocks:board.buildingUnlocks||[],waveRunning:board.phase==='wave',celebrationActive:!!board.celebration,activeCelebration:board.celebration,projectiles:board.projectiles||[],selectedCard:previousWave===view.wave&&previous?.phase===board.phase&&previous?.hand?.join('|')===board.hand?.join('|')?(previous?.selectedCard??-1):-1,rotation:previous?.rotation||0,hoveredPlacement:previous?.hoveredPlacement} );
   const result=lazy?{get state(){return build();}}:{state:build()};
   presentationRecords.set(result,cached);return result;
  })};
 }
 // Accepts the bare 10-digit code or a pasted invite link (…/duo-lobby.html#join=CODE).
 function inviteCode(value){const text=String(value||'').trim(),match=text.match(/[#&?]join=([a-f0-9]{10})(?![a-z0-9])/i)||text.replace(/[\s-]/g,'').match(/^([a-f0-9]{10})$/i);return match?match[1].toUpperCase():'';}
 function create({token,fetchImpl=fetch,onView=()=>{},onStatus=()=>{},clientId=crypto.randomUUID(),ioFactory=globalThis.io}){
  const socket=typeof ioFactory==='function'?ioFactory({autoConnect:false,auth:{token,clientId,wireEnemyFields:1},reconnection:true}):null;
  const wire=(typeof HexDuoWire!=='undefined'?HexDuoWire:typeof require==='function'?require('./classes/duo-wire.js'):null)?.decoder();
  let view=null,busy=false,stopped=false,offline=false,conflict=false,invalid=false,timer;
  // Middleware rejections are not retried by Socket.IO itself: an unknown token is final, anything else retries.
  socket?.on('connect_error',error=>{if(stopped||socket.active)return;if(error?.message==='unauthorized'){invalid=true;return;}setTimeout(()=>{if(!stopped&&!socket.connected)socket.connect();},1000);});
  async function request(path,packet){if(invalid){const error=Error('Sitzung nicht gefunden.');error.reason='unauthorized';throw error;}if(socket){if(!socket.connected)throw Error('Verbindung wird wiederhergestellt …');const response=await socket.timeout(5000).emitWithAck('request',{path,packet,...(path==='/command'?{withState:true}:{})});if(response.status!==200){const error=Error('Verbindung fehlgeschlagen ('+response.status+').');error.reason=response.body.error;if(error.reason==='session-replaced'){conflict=true;error.message='Diese Sitzung ist in einem anderen Tab geöffnet.';}throw error;}return response.body;}const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),5000);try{const response=await fetchImpl(path,{method:packet?'POST':'GET',headers:{Authorization:'Bearer '+token,'X-Duo-Client':clientId,...(packet?{'Content-Type':'application/json'}:{})},...(packet?{body:JSON.stringify(packet)}:{}),signal:controller.signal});if(!response.ok){const error=Error('Verbindung fehlgeschlagen ('+response.status+').');try{error.reason=(await response.json()).error;}catch{}if(error.reason==='session-replaced'){conflict=true;error.message='Diese Sitzung ist in einem anderen Tab geöffnet.';}throw error;}return await response.json();}finally{clearTimeout(timeout);}}
  // Only real changes reach the UI; identical snapshots would re-render the whole screen for nothing.
  function accept(next){if(next.protocol!==1)throw Error('Unpassende Serverversion.');if(!view||view.serverId!==next.serverId||view.epoch!==next.epoch||next.revision>view.revision||next.revision===view.revision&&next.next>view.next){view=next;onView(view);}conflict=false;return view;}
  async function refresh(){return accept(await request('/state'));}
  // The server pushes snapshots over Socket.IO at a steady rate; polling remains the fallback.
  let pushedAt=0,queue=Promise.resolve();
  socket?.on('state',next=>{if(stopped)return;try{const decoded=wire?wire.accept(next):next;if(!decoded)return;accept(decoded);if(next.wireBase&&wire)socket.emit('state-base',next.wireBase);pushedAt=Date.now();offline=false;}catch{}});
  // Commands run one after another instead of failing while the previous one is still unconfirmed.
  function send(action,payload={}){const run=queue.then(()=>dispatch(action,payload));queue=run.catch(()=>{});return run;}
  async function dispatch(action,payload){if(conflict)throw Error('Sitzung zuerst in diesem Tab übernehmen.');const lobbyKick=action==='lobbyKick'&&view?.player===0&&view.lobbyState?.started===false&&!view.connection?.maintenance&&!view.connection?.ended;if(offline||view?.connection?.paused&&!lobbyKick)throw Error(view?.connection?.expired?'Wiederbeitrittsfenster abgelaufen · Bitte eine neue Lobby erstellen.':'Verbindung unterbrochen. Wiederverbinden läuft …');if(!view)throw Error('Bitte auf die Serverbestätigung warten.');busy=true;const packet={epoch:view.epoch,sequence:view.next,wave:view.wave,phase:view.boards[view.player].phase,action,payload};try{let result;for(let attempt=0;attempt<2;attempt++){try{result=await request('/command',packet);break;}catch(error){if(attempt)throw error;}}if(result.state){accept(result.state);delete result.state;}else await refresh();if(!result.ok)throw Error('Aktion abgelehnt: '+result.reason);return result;}finally{busy=false;}}
  function report(){const c=view.connection;onStatus(c?.maintenance?'Serverwartung · Partie sicher pausiert. Bitte warten.':c?.ended?'Die Partie wurde von einem Spieler verlassen. Zurück zur Lobby.':c?.expired?'Wiederbeitrittsfenster abgelaufen · Bitte eine neue Lobby erstellen.':c?.paused?'Partnerverbindung unterbrochen · Partie pausiert · Rückkehrfenster: '+c.remainingSeconds+' s':'Verbunden',{conflict:false,ended:!!c?.ended});}
  async function poll(){if(stopped)return;const pushing=()=>socket?.connected&&Date.now()-pushedAt<1500;try{if(!busy){if(!pushing())await refresh();offline=false;report();}}catch(error){offline=true;if(error.reason==='unauthorized'){stopped=true;socket?.disconnect();onStatus('Diese Duo-Sitzung existiert nicht mehr oder ist abgelaufen.',{invalid:true});return;}onStatus(error.message+(conflict?' Du kannst sie hier ausdrücklich übernehmen.':' Neuer Versuch läuft …'),{conflict,offline:true});}finally{if(!stopped)timer=setTimeout(poll,offline?1000:pushing()?500:100);}}
  async function session(action){if(busy)throw Error('Bitte auf die Serverbestätigung warten.');busy=true;try{let result;for(let attempt=0;attempt<2;attempt++){try{result=await request('/session',{action});break;}catch(error){if(attempt||error.reason==='session-replaced')throw error;}}if(!result.ok)throw Error('Sitzungsaktion abgelehnt.');if(action==='takeover'){conflict=false;offline=false;await refresh();onStatus('Sitzung in diesem Tab übernommen.',{conflict:false});}else{stopped=true;clearTimeout(timer);socket?.disconnect();}return result;}finally{busy=false;}}
  return {send,takeover:()=>session('takeover'),leave:()=>session('leave'),start(){stopped=false;socket?.connect();poll();},stop(){stopped=true;clearTimeout(timer);socket?.disconnect();},get player(){return view?.player;},get busy(){return busy;}};
 }
 return {create,presentation,inviteCode,mergeMap};
})();
if(typeof module!=='undefined')module.exports=HexDuoClient;
