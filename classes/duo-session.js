/* Local authoritative prototype. No networking or persistent profile payouts. */
const HexDuoSession=(()=>{
  const VERSION=3;
  // Provisional Duo balance, independent from Solo reward weights.
  const DELIVERY=Object.freeze({interval:5,gold:20,weights:Object.freeze({Common:55,Uncommon:30,Rare:15})});
  function deliveryOffers(match){
    return match.boards.map((_,sender)=>{
      const recipient=match.boards[1-sender].state;
      const library=HexDeck.forLoadout(Object.fromEntries(Object.entries(HexData.CARD_LIBRARY).filter(([,card])=>Object.hasOwn(DELIVERY.weights,card.rarity))),recipient.towerLoadout);
      const random=HexRandom.create(match.seed+'|delivery|'+match.wave+'|'+sender);
      return {id:'delivery:'+match.wave+':'+sender,index:null,choices:[{kind:'gold',amount:DELIVERY.gold},...HexDeck.rewards(library,random,2,DELIVERY.weights).map(cardId=>({kind:'card',cardId}))]};
    });
  }
  function deliver(match,player,payload){
    const delivery=match.delivery,offer=delivery?.offers[player];
    if(match.phase!=='prepare'||!delivery||delivery.wave!==match.wave||!match.boards.every(run=>run.state.phase==='duoDelivery')||!offer||offer.index!==null||offer.id!==payload.offerId||!Number.isInteger(payload.index)||payload.index<0||payload.index>=offer.choices.length)return false;
    const recipient=match.boards[1-player].state,choice=offer.choices[payload.index];
    if(choice.kind==='gold'){recipient.gold+=choice.amount;recipient.goldEarned.partner=(recipient.goldEarned.partner||0)+choice.amount;}
    else{HexDeck.addReward(recipient,choice.cardId);}
    offer.index=payload.index;
    if(delivery.offers.every(o=>o.index!==null))for(const run of match.boards){run.state.duoDeliveryPending=false;HexRunSession.preparation(run.state,run.random);}
    return true;
  }
  const same=(a,b)=>a&&b&&a.q===b.q&&a.r===b.r&&a.index===b.index;
  function slotAt(state,slot){if(!slot||![slot.q,slot.r,slot.index].every(Number.isInteger)||slot.index<0)return null;const tile=state.map.get(HexMap.key(slot.q,slot.r));return tile&&slot.index<tile.slots?tile:null;}
  function cleanGuests(match){for(const run of match.boards){for(const tile of run.state.map.values())tile.towers=tile.towers.map(t=>t?.guestOwner!==undefined?null:t);run.state.mines=(run.state.mines||[]).filter(m=>m.source?.guestOwner===undefined);HexBuildings.refresh(run.state);}match.pendingHelp=[null,null];}
  function launchHelp(match){for(let sender=0;sender<2;sender++){const help=match.pendingHelp[sender],recipient=1-sender;if(!help||help.at>match.elapsedMs)continue;match.pendingHelp[sender]=null;if(match.finished[recipient])continue;const state=match.boards[recipient].state,slot=match.portals[recipient],tile=slotAt(state,slot);if(!tile||tile.towers[slot.index])continue;tile.towers[slot.index]={...help.tower,guestOwner:sender,statId:undefined,biome:HexBiomes.forTile(state,tile),tileType:tile.type,rangeFactor:1,paid:0,lastShot:state.elapsedMs};HexBuildings.refresh(state);}}
  function sync(match){for(const run of match.boards){run.state.hp=match.hp;run.state.maxHp=match.maxHp;}}
  function create(seed,loadouts){
    if(typeof seed!=='string'||!seed||!Array.isArray(loadouts)||loadouts.length!==2)throw new Error('Two loadouts and a seed required');
    const boards=loadouts.map((loadout,i)=>HexRunSession.create({seed:seed+'|board|'+i,runId:seed+'|duo|'+i,loadout,heroId:'standard',difficulty:'normal'}));
    for(const board of boards)board.state.duoMode=true;
    const match={version:VERSION,seed,boards,hp:40,maxHp:40,wave:0,phase:'prepare',ready:[false,false],finished:[false,false],elapsedMs:0,receipts:[[],[]],portals:[null,null],reinforcements:[null,null],waveHelp:[null,null],pendingHelp:[null,null],leaked:[false,false],support:[{},{}]};sync(match);return match;
  }
  function finishMatch(match,outcome){
    if(match.result)return;
    const wave=outcome==='victory'?match.wave:Math.min(...match.boards.map(r=>r.state.lastCompletedWave||0));
    const exploration=match.boards.reduce((sum,r)=>sum+(r.state.earnedMeta?.explorationBosses||0),0);
    match.result={id:match.seed+'|result',outcome,wave,players:match.boards.map((r,i)=>({wave,diamonds:Math.floor(wave/2)+(r.state.earnedMeta?.periodicBosses||0)*5+exploration*3,towers:JSON.parse(JSON.stringify(r.state.runTowerStats)),support:JSON.parse(JSON.stringify(match.support[i])),gold:r.state.gold}))};
    match.rematch=[false,false];
  }
  function lose(match){cleanGuests(match);match.hp=0;match.phase='gameover';match.ready=[false,false];for(const {state:s} of match.boards){s.hp=0;s.phase='gameover';s.waveRunning=false;s.spawnQueue=[];s.pendingSpawns=0;s.enemies=[];s.projectiles=[];}finishMatch(match,'defeat');}
  function collectHealth(match,state,beforeHp,beforeMax){match.maxHp+=state.maxHp-beforeMax;match.hp=Math.min(match.maxHp,Math.max(0,match.hp+state.hp-beforeHp));sync(match);if(match.hp<=0)lose(match);}
  function canReady(run){const s=run.state;return s.phase==='build'&&!s.celebrationActive&&!s.openingRemaining&&!s.rewardOffer&&HexRunRuntime.spawnSources(s).length>0;}
  function command(match,player,{id,wave,action,payload={}}={}){
    if(!Number.isInteger(player)||player<0||player>1||typeof id!=='string'||!id||id.length>120||wave!==match.wave)return false;
    if(match.receipts[player].includes(id))return false;
    if(match.result){
      if(action!=='rematch'||typeof payload.value!=='boolean')return false;
      match.rematch[player]=payload.value;match.receipts[player].push(id);
      if(match.rematch.every(Boolean)){const receipts=match.receipts;const next=create(match.seed+'|rematch',match.boards.map(r=>r.state.towerLoadout));for(const key of Object.keys(match))delete match[key];Object.assign(match,next,{receipts});}
      return true;
    }
    const run=match.boards[player],s=run.state,hp=s.hp,max=s.maxHp;let ok=false;
    if(action==='ready'){
      if(match.phase!=='prepare'||typeof payload.value!=='boolean'||payload.value&&!canReady(run))return false;
      match.ready[player]=payload.value;ok=true;
    }else{
      if(match.ready[player])return false;
      if(action==='guardian'&&match.phase==='prepare'){
        if(!Number.isInteger(payload.board)||payload.board<0||payload.board>1||typeof payload.id!=='string'||typeof payload.value!=='boolean')return false;
        const landmark=match.boards[payload.board].state.landmarks.get(payload.id);
        if(!landmark||landmark.type!=='boss'||!landmark.claimed||!['pending','ready'].includes(landmark.status)||!Array.isArray(landmark.consent))return false;
        landmark.consent[player]=payload.value;landmark.status=landmark.consent.every(Boolean)?'ready':'pending';match.ready=[false,false];ok=true;
      }
      else if(action==='portal'&&match.phase==='prepare'){const tile=slotAt(s,payload.slot);if(payload.slot===null){match.portals[player]=null;ok=true;}else if(tile&&!tile.towers[payload.slot.index]){match.portals[player]={...payload.slot};ok=true;}}
      else if(action==='reinforcement'&&match.phase==='prepare'){const tile=slotAt(s,payload.slot),tower=tile?.towers[payload.slot.index];if(payload.slot===null){match.reinforcements[player]=null;ok=true;}else if(tower&&tower.guestOwner===undefined){match.reinforcements[player]={...payload.slot};ok=true;}}
      else if(action==='delivery')ok=deliver(match,player,payload);
      else if(action==='place'&&match.phase==='prepare')ok=!!HexRunSession.place(s,run.random,payload);
      else if(action==='reward'&&match.phase==='prepare')ok=HexRunSession.choose(s,run.random,payload.offerId,payload.index);
      else if(action==='acknowledge'&&match.phase==='prepare')ok=HexRunSession.acknowledge(s);
      else if(action==='tower'&&!payload.slots?.some(slot=>same(slot,match.portals[player])))ok=HexTowerCommands.buy(s,payload.type,payload.slots).ok;
      else if(action==='upgrade'&&slotAt(s,payload.slot)?.towers[payload.slot.index]?.guestOwner===undefined)ok=HexTowerCommands.upgrade(s,payload.slot,payload.upgrade);
      else if(action==='building')ok=HexBuildings.buy(s,payload.slot,payload.type);
      else if(action==='buildingUpgrade')ok=HexBuildings.upgrade(s,payload.slot);
      else if(action==='tunnel'&&match.phase==='prepare')ok=HexRunRuntime.rescueTunnel(s);
    }
    if(!ok)return false;
    match.receipts[player].push(id);match.receipts[player]=match.receipts[player].slice(-256);collectHealth(match,s,hp,max);
    if(match.phase==='prepare'&&match.ready.every(Boolean)){
      if(!match.boards.every(canReady)){match.ready=[false,false];return true;}
      for(const board of match.boards)HexRunFlow.start(board.state,board.random);
      match.waveHelp=match.boards.map((board,i)=>{const slot=match.reinforcements[i],t=slotAt(board.state,slot)?.towers[slot?.index];if(!t)return null;const copy={};for(const name of ['type','level','branch','finalUpgrade','ultimate','targetPriority'])if(t[name]!==undefined)copy[name]=Array.isArray(t[name])?[...t[name]]:t[name];return copy;});match.leaked=[false,false];match.pendingHelp=[null,null];
      match.wave++;match.phase='combat';match.finished=[false,false];match.ready=[false,false];
    }
    return true;
  }
  function tick(match){
    if(match.phase!=='combat')return;
    match.elapsedMs+=50;launchHelp(match);
    for(let i=0;i<2;i++){
      const run=match.boards[i],s=run.state;if(match.finished[i]){s.elapsedMs=match.elapsedMs;continue;}
      const hp=s.hp,max=s.maxHp,result=HexRunRuntime.advance(s,run.random,.05);if(s.hp<hp)match.leaked[i]=true;for(const [owner,types] of Object.entries(s.duoSupport||{}))for(const [type,damage] of Object.entries(types))match.support[owner][type]=(match.support[owner][type]||0)+damage;s.duoSupport={};collectHealth(match,s,hp,max);
      if(match.phase==='gameover')return;
      if(result==='complete'){match.finished[i]=true;s.waveRunning=false;s.phase='duoWait';if(!match.leaked[i]&&match.waveHelp[i])match.pendingHelp[i]={at:match.elapsedMs+1500,tower:match.waveHelp[i]};}
    }
    if(match.finished.every(Boolean)){
      cleanGuests(match);match.phase='prepare';
      // Replace each local exploration reward with one shared, origin-qualified reward per player.
      // Periodic bosses remain local. Queues are merged only at the joint combat boundary.
      const guardians=match.boards.flatMap((run,owner)=>run.state.bossRewards.filter(id=>!id.startsWith('wave:')).map(id=>'duo:'+owner+':'+id));
      for(const run of match.boards)run.state.bossRewards=[...run.state.bossRewards.filter(id=>id.startsWith('wave:')),...new Set(guardians)];
      if(match.wave===35){for(const run of match.boards){HexRunFlow.finish(run.state);run.state.phase='victory';}match.phase='victory';finishMatch(match,'victory');sync(match);return;}
      if(match.wave>0&&match.wave%DELIVERY.interval===0){match.delivery={wave:match.wave,offers:deliveryOffers(match)};for(const run of match.boards)run.state.duoDeliveryPending=true;}
      for(const run of match.boards)HexRunSession.finish(run.state,run.random);
      sync(match);
    }
  }
  function capture(match){

    return {duo:JSON.parse(JSON.stringify({portals:match.portals,reinforcements:match.reinforcements,waveHelp:match.waveHelp,pendingHelp:match.pendingHelp,leaked:match.leaked,support:match.support,delivery:match.delivery||null,result:match.result||null,rematch:match.rematch||[false,false]})),format:'autohex-duo',version:VERSION,seed:match.seed,hp:match.hp,maxHp:match.maxHp,wave:match.wave,phase:match.phase,ready:[...match.ready],finished:[...match.finished],elapsedMs:match.elapsedMs,receipts:match.receipts.map(r=>[...r]),boards:match.boards.map(run=>HexRunSnapshot.capture(run.state,run.random))};
  }
  function restore(snapshot){
    if(snapshot?.format!=='autohex-duo'||![2,VERSION].includes(snapshot.version)||!Array.isArray(snapshot.boards)||snapshot.boards.length!==2||!['prepare','combat','gameover','victory'].includes(snapshot.phase))throw new Error('Invalid Duo checkpoint');
    for(const key of ['ready','finished','receipts'])if(!Array.isArray(snapshot[key])||snapshot[key].length!==2)throw new Error('Invalid Duo checkpoint');
    if(!Number.isFinite(snapshot.hp)||snapshot.hp<0||!Number.isFinite(snapshot.maxHp)||snapshot.hp>snapshot.maxHp||!Number.isInteger(snapshot.wave)||snapshot.wave<0||!Number.isFinite(snapshot.elapsedMs)||snapshot.elapsedMs<0)throw new Error('Invalid Duo checkpoint');
    const match={version:VERSION,seed:snapshot.seed,hp:snapshot.hp,maxHp:snapshot.maxHp,wave:snapshot.wave,phase:snapshot.phase,ready:[...snapshot.ready],finished:[...snapshot.finished],elapsedMs:snapshot.elapsedMs,receipts:snapshot.receipts.map(r=>[...r]),boards:snapshot.boards.map(HexRunSnapshot.restore)};
    if(match.boards.some(r=>r.state.wave!==match.wave||r.state.hp!==match.hp||r.state.maxHp!==match.maxHp))throw new Error('Inconsistent Duo checkpoint');
    for(const field of ['portals','reinforcements','waveHelp','pendingHelp','leaked','support']){if(!Array.isArray(snapshot.duo?.[field])||snapshot.duo[field].length!==2)throw new Error('Invalid Duo checkpoint');match[field]=JSON.parse(JSON.stringify(snapshot.duo[field]));}
    match.delivery=snapshot.version===2?null:JSON.parse(JSON.stringify(snapshot.duo.delivery??null));
    match.result=snapshot.duo?.result?JSON.parse(JSON.stringify(snapshot.duo.result)):null;match.rematch=snapshot.duo?.rematch||[false,false];
    const terminal=['gameover','victory'].includes(match.phase);
    if(terminal!==!!match.result||match.phase==='gameover'&&match.hp!==0||!terminal&&match.hp<=0||match.phase==='victory'&&(match.hp<=0||match.wave!==35))throw new Error('Invalid Duo result phase');
    if(!Array.isArray(match.rematch)||match.rematch.length!==2||match.rematch.some(v=>typeof v!=='boolean'))throw new Error('Invalid rematch votes');
    if(terminal){const expected={...match,result:null};finishMatch(expected,match.phase==='victory'?'victory':'defeat');if(JSON.stringify(expected.result)!==JSON.stringify(match.result))throw new Error('Invalid Duo result');}
    const pending=match.boards.some(run=>run.state.duoDeliveryPending);
    if(match.delivery){
      const d=match.delivery;
      if(!Number.isInteger(d.wave)||d.wave<=0||d.wave%DELIVERY.interval||d.wave>match.wave||!Array.isArray(d.offers)||d.offers.length!==2)throw new Error('Invalid Duo delivery');
      const expected=deliveryOffers({...match,wave:d.wave});
      if(d.offers.some((o,i)=>!o||o.id!==expected[i].id||JSON.stringify(o.choices)!==JSON.stringify(expected[i].choices)||o.index!==null&&(!Number.isInteger(o.index)||o.index<0||o.index>=o.choices.length)))throw new Error('Invalid Duo delivery');
      const unfinished=d.offers.some(o=>o.index===null);
      if(unfinished&&(match.phase!=='prepare'||d.wave!==match.wave||!match.boards.every(run=>run.state.duoDeliveryPending))||pending!==unfinished)throw new Error('Inconsistent Duo delivery');
    }else if(pending)throw new Error('Missing Duo delivery');
    return match;
  }
  return {create,command,tick,capture,restore,DELIVERY};
})();
