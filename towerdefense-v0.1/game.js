(() => {
  'use strict';

  const svg = document.getElementById('board');
  const rendererCommands={
    placeTile,selectSlot,
    viewChanged:positionTowerPanel,
    hoverPlacement(id){state.hoveredPlacement=id;},
    leavePlacement(id){if(state.hoveredPlacement===id) state.hoveredPlacement=null;},
    selectBuilding(q,r,index){state.selectedBuilding={q,r,index};state.selectedSlot=null;state.selectedTower=null;renderAll();},
    selectTower(q,r,index){
      const selected=state.selectedTower;
      state.selectedTower=selected&&selected.q===q&&selected.r===r&&selected.index===index?null:{q,r,index};
      state.selectedSlot=null;state.selectedBuilding=null;state.previewTower=null;renderAll();
    },
    clearSelection(){if(state.selectedTower||state.selectedBuilding){state.selectedTower=null;state.selectedBuilding=null;renderAll();}}
  };
  // 3D-Renderer (three-renderer.js) wenn verfügbar, sonst SVG-Prototyp.
  let renderer;
  try{renderer=(globalThis.HexThreeRenderer||HexSvgRenderer).create(svg,rendererCommands);}
  catch(error){console.warn('3D-Renderer nicht nutzbar, verwende SVG:',error);svg.style.display='';renderer=HexSvgRenderer.create(svg,rendererCommands);}
  const towerButtons=new Map();
  const handEl = document.getElementById('hand');
  const hpEl = document.getElementById('hp');
  const goldEl = document.getElementById('gold');
  const waveEl = document.getElementById('wave');
  const deckCountEl = document.getElementById('deckCount');
  const messageEl = document.getElementById('message');
  const startWaveBtn = document.getElementById('startWaveBtn');
  const newRunBtn = document.getElementById('newRunBtn');
  const autoStart = document.getElementById('autoStart');
  const speedToggle=document.getElementById('doubleSpeed');
  const towerMenu = document.getElementById('towerMenu');
  const rewardOverlay = document.getElementById('rewardOverlay');
  const rewardChoices = document.getElementById('rewardChoices');

  const NS = 'http://www.w3.org/2000/svg';
  const {SQRT3,HEX,OPP,key,axialToWorld,hexPoints,edgePoint,neighbor,rotatedRoads}=HexMap;

  const {CARD_LIBRARY,TOWERS}=HexData;

  let state;
  let random;
  let towerMenuKey='';
  let towerPanelKey='';
  let buildingPanelKey='';const buildingButtons=new Map();
  const upgradeButtons=new Map();
  const sound=typeof HexAudio==='undefined'?{play(){}}:HexAudio;
  const runTimers = new Set();

  function schedule(callback, delay){
    const run = state;
    const timer = setTimeout(()=>{
      runTimers.delete(timer);
      if(state===run) callback();
    },delay);
    runTimers.add(timer);
  }
  function clearRunTimers(){
    runTimers.forEach(clearTimeout);
    runTimers.clear();
  }

  function freshState(){
    return {
      hp:20,gold:HexWaves.economy.startGold,wave:0,
      goldEarned:{kills:0,completion:0,income:0},waveKills:0,
      map:new Map(),
      deck:['straight','straight','smallCurve','bigCurve','tee'],
      drawPile:[],discard:[],hand:[],
      selectedCard:0,rotation:0,hoveredPlacement:null,
      phase:'place',selectedSlot:null,selectedTower:null,selectedBuilding:null,previewTower:null,
      enemies:[],projectiles:[],waveRunning:false,bossRewards:[],
      income:0,nextEnemyId:1,pendingSpawns:0,elapsedMs:0,spawnQueue:[]
    };
  }

  function setupBase(){
    state.map.set(key(0,0),{q:0,r:0,type:'base',roads:[0],slots:0,towers:[],income:0});
  }

  function shuffle(arr){
    const a=[...arr];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }
  function refillDraw(){
    if(state.drawPile.length===0){state.drawPile=shuffle(state.discard);state.discard=[];}
  }
  function drawHand(){
    state.hand=[];
    let guard=0;
    while(state.hand.length<3 && guard<30){
      guard++;
      refillDraw();
      if(state.drawPile.length===0) break;
      state.hand.push(state.drawPile.pop());
    }
    const playable=ensurePlayableHand();
    state.selectedCard=0; state.rotation=0;
    if(!playable){
      const rescue=HexMap.rescue(state.map,state.landmarks);
      if(rescue){state.discard.push(...state.hand);CARD_LIBRARY.rescue=rescue;state.hand=['rescue'];setMessage('Deck blockiert: Lege das kostenlose Rettungshex. Es hat keine Turmplätze und kommt nicht ins Deck.');}
      else {state.phase='build';setMessage('Keine Erweiterung möglich. Du kannst bauen und die nächste Wave starten.');}
    }
    renderUI();
  }
  function ensurePlayableHand(){
    const playableIds=new Set(state.deck.filter(id=>{
      for(let rot=0;rot<6;rot++) if(hasAnyPlacement(CARD_LIBRARY[id],rot)) return true;
      return false;
    }));
    if(!playableIds.size) return false;
    let guard=0;
    while(!handHasPlayable() && guard<20){
      state.discard.push(...state.hand);
      state.hand=[];
      while(state.hand.length<3){
        refillDraw(); if(!state.drawPile.length) break;
        state.hand.push(state.drawPile.pop());
      }
      guard++;
    }
    // Guarantee progress even when random redraws repeatedly miss a playable card.
    if(!handHasPlayable()){
      const pile=[state.drawPile,state.discard].find(p=>p.some(id=>playableIds.has(id)));
      const index=pile.findIndex(id=>playableIds.has(id));
      const [id]=pile.splice(index,1);
      if(state.hand.length===3) state.discard.push(state.hand.pop());
      state.hand.push(id);
    }
    return true;
  }
  function handHasPlayable(){
    return state.hand.some(id=>{
      const card=CARD_LIBRARY[id];
      for(let rot=0;rot<6;rot++) if(hasAnyPlacement(card,rot)) return true;
      return false;
    });
  }

  function openRoadTargets(){
    const spots=[];
    for(const tile of state.map.values()){
      for(const d of tile.roads||[]){
        const n=neighbor(tile.q,tile.r,d);
        if(!state.map.has(key(n.q,n.r))) spots.push({q:n.q,r:n.r,needs:OPP(d)});
      }
    }
    const uniq=new Map(); spots.forEach(s=>uniq.set(key(s.q,s.r),s));
    return [...uniq.values()];
  }

  function canPlace(q,r,card,rot){if(state.landmarks.get(key(q,r))?.prefab) return false;return HexMap.canPlace(state.map,q,r,card,rot,state.landmarks);}
  function buildGraph(){return HexMap.buildGraph(state.map);}
  const pathToBase=HexMap.pathToBase;

  function hasAnyPlacement(card,rot){return openRoadTargets().some(s=>canPlace(s.q,s.r,card,rot));}

  const slotPositions=HexMap.slotPositions;

  function placeTile(q,r){
    if(state.phase!=='place'||state.waveRunning) return;
    const id=state.hand[state.selectedCard]; if(!id) return;
    const card=CARD_LIBRARY[id];
    if(!canPlace(q,r,card,state.rotation)){
      setMessage('Nicht erlaubt: Straßen müssen passen und mindestens ein Gegner-Eingang muss offen bleiben.'); return;
    }
    const tile={q,r,type:id,rotation:state.rotation,roads:rotatedRoads(card,state.rotation),slots:card.slots||0,buildingSlots:card.buildingSlots||0,buildings:Array(card.buildingSlots||0).fill(null),towers:Array(card.slots||0).fill(null),income:card.income||0};
    state.map.set(key(q,r),tile);
    const connected=HexExploration.attach(state);
    state.vision=HexExploration.expand(state.landmarks,state.map);
    sound.play('place');
    state.hoveredPlacement=null;
    state.income += tile.income;
    state.discard.push(...state.hand.filter(id=>!CARD_LIBRARY[id].rescue));
    state.hand=[];
    state.phase='build'; state.selectedSlot=null;state.selectedBuilding=null;
    const treasure=HexExploration.claim(state,q,r);
    if(treasure||connected.gold||state.pendingShrine) sound.play('collect');
    setMessage(treasure||connected.gold?`Schatz erschlossen: +${treasure+connected.gold} Gold. Baue jetzt Türme oder starte die Wave.`:'Hex gelegt. Baue jetzt Türme oder starte die Wave.');
    if(connected.bosses) setMessage(`${connected.bosses} Bossfeld(er) angeschlossen. Wächter starten in der nächsten Wave auf ihren eigenen Hexfeldern.`);
    if(state.landmarks.get(key(q,r))?.status==='ready') setMessage('Bossfeld erschlossen: Der Wächter startet in der nächsten Wave direkt auf diesem Hex. Bereite deine Türme vor.');
    renderAll();
    if(state.pendingShrine){showShrine();renderAll();return;}
    if(autoStart.checked) schedule(()=>startWave(),250);
  }

  function selectSlot(q,r,index){
    if(!['build','wave'].includes(state.phase)||state.hp<=0) return;
    const tile=state.map.get(key(q,r)); if(!tile||tile.towers[index]) return;
    state.selectedTower=null;state.selectedBuilding=null;state.selectedSlot={q,r,index}; renderAll();
    setMessage('Turret-Slot gewählt. Kaufe rechts einen Turm.');
  }

  function buyTower(type){
    if(!state.selectedSlot||!['build','wave'].includes(state.phase)||state.hp<=0) return;
    const tdef=TOWERS[type],price=HexBuildings.cost(state,state.selectedSlot,tdef.cost); if(state.gold<price){setMessage('Nicht genug Gold.');return;}
    const tile=state.map.get(key(state.selectedSlot.q,state.selectedSlot.r));
    if(!tile||tile.towers[state.selectedSlot.index]) return;
    const selected=state.selectedSlot;
    tile.towers[selected.index]={type,tileType:tile.type,level:1,lastShot:-Infinity,builtOnWave:state.phase==='build'?state.wave:null,paid:price};
    state.gold-=price;HexBuildings.refresh(state); state.selectedSlot=null;state.previewTower=null;state.selectedTower=null;
    sound.play('build');
    renderAll();
  }

  function sellSelectedTower(){
    if(!state.selectedTower) return;
    const selected=state.selectedTower,tile=state.map.get(key(selected.q,selected.r)),tower=tile?.towers[selected.index];
    const refund=HexData.towerRefund(state,tower);if(!refund) return;
    state.gold+=refund.amount;tile.towers[selected.index]=null;
    state.selectedTower=null;state.selectedSlot=['build','wave'].includes(state.phase)?{...selected}:null;
    sound.play('build');setMessage(`Turm zurückgegeben: +${refund.amount} Gold (${refund.percent} % der gesamten Investition inklusive Upgrades).`);renderAll();
  }
  function upgradeSelectedTower(branch){
    if(!['build','wave'].includes(state.phase)||!state.selectedTower||state.hp<=0) return;
    const selected=state.selectedTower,tower=state.map.get(key(selected.q,selected.r))?.towers[selected.index],upgrade=HexData.UPGRADES[branch];
    const price=upgrade?HexBuildings.cost(state,selected,upgrade.cost):Infinity;
    if(!tower||!HexData.availableUpgrades(tower).some(([id])=>id===branch)||state.gold<price) return;
    if(upgrade.requires){tower.finalUpgrade=branch;tower.level=3;}else{tower.branch=branch;tower.level=2;}
    tower.paid+=price;state.gold-=price;
    sound.play('build');renderAll();
  }

  function spawnSources(){
    const routes=HexMap.routeGraph(state.map),sources=[];
    for(const tile of state.map.values()){
      const id=key(tile.q,tile.r);if(tile.type==='base'||!routes.distances.has(id)) continue;
      for(const d of tile.roads||[]){
        const n=neighbor(tile.q,tile.r,d);if(state.map.has(key(n.q,n.r))) continue;
        const c=axialToWorld(tile.q,tile.r),spawn=edgePoint(c.x,c.y,d,1.02);
        const points=[spawn,...routes.geometry.get(id).legs.get(d).slice().reverse()];
        sources.push({tile,dir:d,points,routes,branchCounts:new Map()});
      }
    }
    return sources;
  }
  function nextSourcePoints(source){
    if(source.routes){
      const points=source.points.slice(),{graph,distances}=source.routes;
      let current=key(source.tile.q,source.tile.r);
      while(current!==key(0,0)){
        const choices=graph.get(current).filter(edge=>Math.abs(edge.cost+distances.get(edge.next)-distances.get(current))<1e-7);
        const count=source.branchCounts.get(current)||0,edge=choices[count%choices.length];
        source.branchCounts.set(current,count+1);points.push(...edge.points.slice(1));current=edge.next;
      }
      return points;
    }
    return [];
  }

  function startWave(){
    if(state.waveRunning||state.phase!=='build') return;
    const sources=spawnSources();
    if(!sources.length){setMessage('Es gibt noch keinen offenen Spawnpunkt mit Weg zur Base.');return;}
    state.waveRunning=true; state.wave++;
    state.phase='wave'; state.selectedSlot=null;state.previewTower=null;
    sound.play('wave');
    startWaveBtn.disabled=true;
    const count=HexWaves.plan(state.wave,state.income).count;
    state.waveKills=0;
    state.pendingSpawns=count;
    for(let i=0;i<count;i++){
      const src=sources[i%sources.length];
      const run=state;
      state.spawnQueue.push({due:state.elapsedMs+i*320,callback:()=>{
        if(state!==run) return;
        if(!state.waveRunning) return;
        spawnEnemy(nextSourcePoints(src),i);
        state.pendingSpawns--;
      }});
    }
    const bosses=spawnReadyBosses();
    setMessage(`Wave ${state.wave} läuft – ${sources.length} offene Front${sources.length>1?'en':''}.${bosses?' '+bosses+' Wächter auf ihren erschlossenen Hexfeldern gestartet.':''}`);
    renderUI();
  }

  function spawnEnemy(points,idx){
    if(state.hp<=0) return;
    const plan=HexWaves.plan(state.wave,state.income),profile=plan.enemies[idx||0],hp=profile.hp;
    const start=points[0];
    state.enemies.push({id:state.nextEnemyId++,...profile,points,index:0,t:0,hp,maxHp:hp,alive:true,x:start.x,y:start.y});
  }
  function spawnReadyBosses(){
    const routes=HexMap.routeGraph(state.map);let count=0;
    for(const landmark of state.landmarks.values()){
      if(landmark.status!=='ready') continue;
      const id=key(landmark.q,landmark.r);if(!routes.distances.has(id)) continue;
      const source={tile:state.map.get(id),routes,points:[routes.geometry.get(id).hub],branchCounts:new Map()};
      const points=nextSourcePoints(source);if(points.length<2) continue;
      const profile=HexExploration.bossProfile(state.wave),start=points[0];landmark.status='fighting';
      state.enemies.push({id:state.nextEnemyId++,...profile,landmarkId:id,points,index:0,t:0,maxHp:profile.hp,alive:true,x:start.x,y:start.y});count++;
    }
    return count;
  }

  function endWave(){
    if(state.hp<=0) return;
    state.waveRunning=false; state.gold += HexWaves.economy.completion + state.income;
    state.projectiles=[];
    state.goldEarned.completion+=HexWaves.economy.completion;state.goldEarned.income+=state.income;
    sound.play('complete');
    state.phase='place'; state.selectedSlot=null;
    if(state.bossRewards.length) showBossReward();else continueWaveRewards();
    renderAll();
  }
  function continueWaveRewards(){
    if(state.wave%2===0) showRewards();
    else {state.phase='place';drawHand();if(state.phase==='place') setMessage(`Wave ${state.wave} geschafft. Wähle dein nächstes Hex.`);}
  }
  function finishBossReward(){
    if(state.phase!=='bossReward') return;
    state.bossRewards.shift();
    if(state.bossRewards.length) showBossReward();
    else {rewardOverlay.classList.add('hidden');continueWaveRewards();}
    renderAll();
  }
  function showBossReward(){
    state.phase='bossReward';const id=state.bossRewards[0],rarity=HexExploration.bossRewardRarity(state.seed,id);
    document.getElementById('rewardTitle').textContent='Wächter besiegt · '+rarity+'-Beute';
    document.getElementById('rewardDescription').textContent='Zusätzlich zu den 50 Gold: Wähle eine Karte für dein Deck. Normale Wave-Belohnungen folgen danach.';
    document.getElementById('skipRemovalBtn').classList.remove('hidden');rewardChoices.innerHTML='';
    const library=Object.fromEntries(Object.entries(CARD_LIBRARY).filter(([,card])=>card.rarity===rarity));
    const picks=HexDeck.rewards(library,HexRandom.create(state.seed+'|bossloot|'+id));
    for(const cardId of picks){const card=cardElement(cardId,false);card.addEventListener('click',()=>{
      if(state.phase!=='bossReward'||state.bossRewards[0]!==id) return;
      state.deck.push(cardId);state.discard.push(cardId);finishBossReward();
    });rewardChoices.appendChild(card);}
    rewardOverlay.classList.remove('hidden');
  }

  function showRewards(){
    state.phase='reward';
    document.getElementById('rewardTitle').textContent='Deck erweitern';
    document.getElementById('rewardDescription').textContent='Wähle 1 von 3 Hexkarten. Common ist häufiger als Uncommon und Rare.';
    document.getElementById('skipRemovalBtn').classList.add('hidden');
    const picks=HexDeck.rewards(CARD_LIBRARY,random);
    rewardChoices.innerHTML='';
    picks.forEach(id=>{
      const el=cardElement(id,false); el.addEventListener('click',()=>{
        if(state.phase!=='reward') return;
        state.deck.push(id); state.discard.push(id);
        if(state.wave>0&&state.wave%6===0){showRemoval();renderAll();return;}
        finishReward();
        if(state.phase==='place') setMessage(`${CARD_LIBRARY[id].name} wurde deinem Deck hinzugefügt.`);
      }); rewardChoices.appendChild(el);
    });
    rewardOverlay.classList.remove('hidden');
  }
  function finishReward(){
    rewardOverlay.classList.add('hidden');state.phase='place';drawHand();renderAll();
  }
  function finishRemoval(){
    if(state.removalSource!=='shrine'){finishReward();return;}
    state.pendingShrine=state.shrineQueue?.shift()||null;state.removalSource=null;
    if(state.pendingShrine){showShrine();renderAll();return;}
    rewardOverlay.classList.add('hidden');state.phase='build';renderAll();
    setMessage('Shrine genutzt. Baue jetzt Türme oder starte die Wave.');
    if(autoStart.checked) schedule(()=>startWave(),250);
  }
  function showShrine(){
    const effect=HexExploration.shrineEffect(state.landmarks,state.pendingShrine);
    if(effect==='remove'){showRemoval('shrine');return;}
    state.removalSource='shrine';state.phase='shrineReward';rewardChoices.innerHTML='';
    document.getElementById('rewardTitle').textContent='Shrine erschlossen · Effekt: '+(effect==='legendary'?'Legendary-Karte erhalten':effect==='epic'?'Epic-Karte erhalten':'Zusätzliche Karte wählen');
    document.getElementById('rewardDescription').textContent='Wähle eine Karte für dein Deck. Danach geht es zurück in die Bauphase. Dieser Shrine ist einmalig; Überspringen verbraucht ihn ebenfalls.';
    document.getElementById('skipRemovalBtn').classList.remove('hidden');
    const rarity={epic:'Epic',legendary:'Legendary'}[effect];
    const library=rarity?Object.fromEntries(Object.entries(CARD_LIBRARY).filter(([,card])=>card.rarity===rarity)):CARD_LIBRARY;
    const picks=HexDeck.rewards(library,HexRandom.create(state.seed+'|shrine|'+state.pendingShrine));
    for(const id of picks){
      const card=cardElement(id,false);card.addEventListener('click',()=>{
        if(state.phase!=='shrineReward') return;
        state.deck.push(id);state.discard.push(id);finishRemoval();setMessage(`${CARD_LIBRARY[id].name} durch den Shrine zum Deck hinzugefügt.`);
      });rewardChoices.appendChild(card);
    }
    rewardOverlay.classList.remove('hidden');
  }
  function showRemoval(source='reward'){
    state.removalSource=source;
    state.phase='removal';rewardChoices.innerHTML='';
    document.getElementById('rewardTitle').textContent=source==='shrine'?'Shrine erschlossen · Effekt: Karte entfernen':'Deck ausdünnen';
    document.getElementById('rewardDescription').textContent='Optional: Entferne eine Kartenkopie aus deinem Deck. Mindestens 5 Karten bleiben erhalten. Bereits gelegte Hexe bleiben bestehen.'+(source==='shrine'?' Dieser Shrine ist einmalig; Überspringen verbraucht ihn ebenfalls.':'');
    document.getElementById('skipRemovalBtn').classList.remove('hidden');
    const counts=new Map();state.deck.forEach(id=>counts.set(id,(counts.get(id)||0)+1));
    for(const [id,count] of counts){
      const card=cardElement(id,false),info=document.createElement('p');info.textContent=`${count} im Deck · 1 Kopie entfernen`;card.appendChild(info);card.disabled=state.deck.length<=5;
      card.addEventListener('click',()=>{if(state.phase!=='removal'||!HexDeck.remove(state,id)) return;finishRemoval();if(['place','build'].includes(state.phase)) setMessage(`${CARD_LIBRARY[id].name}: Eine Kopie aus dem Deck entfernt.`);});rewardChoices.appendChild(card);
    }
    rewardOverlay.classList.remove('hidden');
  }

  function update(dt,time){
    if(!state.waveRunning) return;
    dt*=speedToggle.checked?2:1;
    state.elapsedMs+=dt*1000;time=state.elapsedMs;
    while(state.spawnQueue.length&&state.spawnQueue[0].due<=time) state.spawnQueue.shift().callback();
    const towerRefs=[];
    for(const tile of state.map.values()){
      const slots=slotPositions(tile);
      (tile.towers||[]).forEach((tw,i)=>{if(tw) towerRefs.push({tw,pos:slots[i],tile});});
    }
    HexCombat.step(state,towerRefs,TOWERS,dt,time,name=>sound.play(name));
    if(state.hp<=0){state.hp=0;state.waveRunning=false;state.phase='gameover';state.enemies=[];state.projectiles=[];state.spawnQueue=[];clearRunTimers();sound.play('gameover');setMessage(`Run beendet. Du hast Wave ${state.wave} erreicht.`);}
    else if(state.pendingSpawns===0&&state.enemies.length===0) endWave();
    renderBoard(); renderUI();
  }

  function renderBoard(){
    const card=CARD_LIBRARY[state.hand[state.selectedCard]];
    const targets=state.phase==='place'&&!state.waveRunning&&card?openRoadTargets().filter(target=>!state.landmarks.get(key(target.q,target.r))?.prefab).map(target=>({...target,legal:canPlace(target.q,target.r,card,state.rotation)})):[];
    renderer.render(state,targets);
  }
  function miniPathSvg(card,rot=0){
    const geometry=HexMap.roadGeometry({q:0,r:0,type:card.id,roads:rotatedRoads(card,rot)});
    const lines=[...geometry.legs.values()].map(points=>'<polyline points="'+points.map(p=>(30+p.x*25/HEX).toFixed(1)+','+(30+p.y*25/HEX).toFixed(1)).join(' ')+'"/>').join('');
    return '<svg class="miniPath" viewBox="0 0 60 60" aria-label="Aktuelle Ausrichtung"><polygon points="51.7,17.5 51.7,42.5 30,55 8.3,42.5 8.3,17.5 30,5"/>'+lines+'</svg>';
  }

  function cardElement(id,selectable=true,previewRotation=0){
    const c=CARD_LIBRARY[id];const el=document.createElement('button');el.className=`card rarity-${c.rarity.toLowerCase()}`;el.type='button';
    el.innerHTML=`<div class="rarity">${c.rarity}</div>${miniPathSvg(c,previewRotation)}<h3>${c.name}</h3><p>${c.desc}</p><div class="slots">🛡️ ${c.slots||0} Turret-Slot${(c.slots||0)!==1?'s':''}${c.buildingSlots?` · 🏠 ${c.buildingSlots} Gebäude`:''}</div>`;
    if(!selectable) el.style.width='100%';
    return el;
  }
  function pathGlyph(c){
    if(c.id==='straight'||c.id==='empty') return '━';
    if(c.id==='smallCurve') return '⌝'; if(c.id==='bigCurve') return '◜'; if(c.id==='tee') return '┳'; if(c.id==='cross') return '╋'; if(c.id==='village') return '⌞🏠'; return '⬡';
  }

  function renderUI(){
    hpEl.textContent=state.hp;goldEl.textContent=state.gold;waveEl.textContent=state.wave;deckCountEl.textContent=state.deck.length;
    document.getElementById('bonusIncome').textContent=`(+${state.income})`;
    renderBuildingPanel();
    document.getElementById('phaseLabel').textContent={place:'Hex platzieren',build:'Bauphase',wave:'Wave läuft',reward:'Kartenbelohnung',removal:'Deck ausdünnen',shrineReward:'Shrine-Belohnung',bossReward:'Boss-Beute',gameover:'Run beendet'}[state.phase];
    handEl.innerHTML='';
    state.hand.forEach((id,i)=>{const el=cardElement(id,true,i===state.selectedCard?state.rotation:0);if(i===state.selectedCard)el.classList.add('selected');el.addEventListener('click',()=>{state.selectedCard=i;state.rotation=0;renderAll();});handEl.appendChild(el);});
    // Keep purchase buttons stable during animation so pointer clicks/focus survive.
    const menuKey=JSON.stringify([state.phase,state.selectedSlot,state.buildingVersion]);
    if(menuKey!==towerMenuKey){
    towerMenuKey=menuKey;towerMenu.innerHTML='';towerButtons.clear();
    Object.entries(TOWERS).forEach(([id,t])=>{
      const selectedTile=state.selectedSlot?state.map.get(key(state.selectedSlot.q,state.selectedSlot.r)):null;
      const effective=HexData.towerDefinition({type:id,tileType:selectedTile?.type,supportDamage:HexBuildings.effects(state.map,selectedTile).damage});
      const price=HexBuildings.cost(state,state.selectedSlot,t.cost);
      const b=document.createElement('button');b.className='towerBtn';
      b.innerHTML=`<span class="towerOffer"><strong class="towerOfferName">${t.name}</strong><small class="towerOfferDescription">${t.desc}</small><small class="towerOfferStats">${t.aura?"Slow-Aura · kein Schaden":effective.damage+" Schaden · "+(1/effective.cooldown).toFixed(1)+"/s"} · ${effective.range} Reichweite</small></span><strong class="towerOfferPrice">${price} 🪙</strong>`;
      b.disabled=!['build','wave'].includes(state.phase)||!state.selectedSlot||state.gold<price||state.hp<=0;
      b.addEventListener('pointerenter',()=>{state.previewTower=id;renderBoard();});
      b.addEventListener('pointerleave',()=>{state.previewTower=null;renderBoard();});
      b.addEventListener('focus',()=>{state.previewTower=id;renderBoard();});
      b.addEventListener('blur',()=>{state.previewTower=null;renderBoard();});
      b.addEventListener('click',()=>buyTower(id));towerMenu.appendChild(b);towerButtons.set(id,b);
    });
    }
    for(const [id,b] of towerButtons) b.disabled=!['build','wave'].includes(state.phase)||!state.selectedSlot||state.gold<HexBuildings.cost(state,state.selectedSlot,TOWERS[id].cost)||state.hp<=0;
    renderForecast();
    const info=document.getElementById('selectedTowerInfo'),sell=document.getElementById('sellTowerBtn');
    const selected=state.selectedTower,tower=selected?state.map.get(key(selected.q,selected.r))?.towers[selected.index]:null;
    info.textContent=tower?towerStats(HexData.towerDefinition(tower))+(CARD_LIBRARY[tower.tileType]?.towerRange||CARD_LIBRARY[tower.tileType]?.archerDamage||CARD_LIBRARY[tower.tileType]?.towerDamage?` · ${CARD_LIBRARY[tower.tileType].name}: Hexbonus eingerechnet`:''):'';
    renderTowerPanel();
    const refund=HexData.towerRefund(state,tower);sell.disabled=!refund;
    sell.textContent=refund?`${refund.percent===100?'Bau rückgängig':'Verkaufen'} · ${refund.percent} % (+${refund.amount} Gold)`:'Turm verkaufen';
    startWaveBtn.disabled=state.phase!=='build'||state.waveRunning||state.hp<=0;
    if(document.getElementById('deckDropdown').open) renderDeckOverview();
  }
  function renderDeckOverview(){
    const content=document.getElementById('deckOverview');content.innerHTML='';
    for(const [name,ids] of [['Gesamtes Deck',state.deck],['Nachziehstapel',state.drawPile],['Ablagestapel',state.discard]]){
      const section=document.createElement('section'),heading=document.createElement('h3');
      heading.textContent=`${name} (${ids.length})`;section.appendChild(heading);
      const counts=new Map();ids.forEach(id=>counts.set(id,(counts.get(id)||0)+1));
      const list=document.createElement('ul');
      if(!ids.length){const item=document.createElement('li');item.textContent='Leer';list.appendChild(item);}
      for(const [id,count] of counts){
        const item=document.createElement('li'),badge=document.createElement('span'),card=CARD_LIBRARY[id];
        item.textContent=`${count} × ${card.name} `;
        badge.className=`rarityBadge rarity-${card.rarity.toLowerCase()}`;badge.textContent=card.rarity;
        item.appendChild(badge);list.appendChild(item);
      }
      section.appendChild(list);content.appendChild(section);
    }
  }
  function renderForecast(){
    const plan=HexWaves.plan(state.wave+1,state.income);
    const bosses=[...state.landmarks.values()].filter(item=>item.status==='ready'),boss=HexExploration.bossProfile(plan.wave),bossGold=bosses.length*boss.killGold;
    const groups=new Map();
    plan.enemies.forEach(enemy=>{const entry=groups.get(enemy.type)||{count:0,profile:enemy};entry.count++;groups.set(enemy.type,entry);});
    document.getElementById('waveForecast').textContent='Wave '+plan.wave+': '+plan.count+' Gegner. '+[...groups.values()].map(({count,profile})=>count+' × '+profile.name+' ('+profile.hp+' HP'+(profile.armor?', 50 % weniger Archer-Schaden':'')+(profile.type==='swarm'?', schnell':'')+')').join(' · ')+'. Katapult/Blitz gegen Rüstung, Salven/Blitz gegen Gruppen, Freeze als Support.';
    if(bosses.length) document.getElementById('waveForecast').textContent+=` Zusätzlich ${bosses.length} Wächter: je ${boss.hp} HP, Rüstung, ${boss.baseDamage} Basisschaden, +${boss.killGold} Gold plus Kartenbeute (90 % Epic, 10 % Legendary). Spawn auf dem jeweils erschlossenen Bosshex.`;
    document.getElementById('goldForecast').textContent=`Maximal +${plan.maxGold+bossGold} Gold: ${plan.count} Kills × ${HexWaves.economy.kill} = ${plan.killGold}, Bossloot +${bossGold}, Wave-Abschluss +${plan.completionGold}, Hex-Bonus +${plan.income}. Nur wenn alle Gegner besiegt werden und die Wave überlebt wird. Mit aktuellem Gold: maximal ${state.gold+plan.maxGold+bossGold} vor Bauausgaben und weiteren Einnahmen der laufenden Wave.`;
    const earned=state.goldEarned;
    document.getElementById('goldSources').textContent=`Startgold ${HexWaves.economy.startGold} · pro Kill +${HexWaves.economy.kill} · pro überlebter Wave +${HexWaves.economy.completion} · Dorf +2, Handelsstraße +4, Haus zusätzlich +3 pro Wave. Im Run verdient: Kills ${earned.kills}, Abschlüsse ${earned.completion}, Hex-/Hausboni ${earned.income}, Schätze ${earned.treasure||0}, Bosse ${earned.boss||0}. Undo erstattet nur den Kaufpreis, erzeugt kein Einkommen.`;
    const alive=state.enemies.filter(e=>e.alive&&e.hp>0),remainingGold=state.pendingSpawns*HexWaves.economy.kill+alive.reduce((sum,e)=>sum+(e.killGold??HexWaves.economy.kill),0)+HexWaves.economy.completion+state.income;
    document.getElementById('liveWaveInfo').textContent=state.waveRunning?`Laufende Wave ${state.wave}: ${state.pendingSpawns} Gegner kommen noch, ${alive.length} sind auf der Map (davon ${alive.filter(e=>e.type==='boss').length} Wächter), ${state.waveKills} normale Gegner besiegt. Noch maximal +${remainingGold} Gold bis Wave-Ende.`:'Vor dem Hex-Placement ist der Hex-Bonus vorläufig; er wird nach dem Placement aktualisiert.';
    const budgetSlot=state.selectedSlot||state.selectedTower||state.selectedBuilding;
    document.getElementById('towerBudget').textContent=(budgetSlot?'Preise am ausgewählten Hex: ':'Listenpreise: ')+Object.values(TOWERS).map(t=>{const price=HexBuildings.cost(state,budgetSlot,t.cost);return t.name+': '+price+' Gold'+(state.gold<price?' (noch '+(price-state.gold)+' nötig)':' (bezahlbar)');}).join(' · ');

  }
  function renderAll(){renderBoard();renderUI();}
  const buildingPosition=HexMap.buildingPosition;
  function towerStats(def){
    return def.aura?`Slow ${Math.round((1-def.slow)*100)} % · Radius ${def.range} · kein Schaden`:`${def.damage} Schaden · ${def.cooldown.toFixed(2)} s je Schuss · Reichweite ${def.range}${def.splash?` · Splash ${def.splash}`:''}${def.chain?` · ${def.chain} Ziele · Sprungdistanz ${def.jumpRange}`:''}`;
  }
  function positionTowerPanel(){
    const selected=state.selectedTower||state.selectedBuilding;if(!selected) return;
    const tile=state.map.get(key(selected.q,selected.r));if(!tile) return;
    const position=state.selectedTower?slotPositions(tile)[selected.index]:buildingPosition(tile),screen=renderer.project(position);if(!screen) return;
    const panel=document.getElementById(state.selectedTower?'towerPanel':'buildingPanel');
    panel.style.left=`${Math.max(8,Math.min(screen.x+20,screen.width-panel.offsetWidth-8))}px`;
    panel.style.top=`${Math.max(55,Math.min(screen.y-30,screen.height-panel.offsetHeight-8))}px`;
  }
  function renderBuildingPanel(){
    const panel=document.getElementById('buildingPanel'),selected=state.selectedBuilding,tile=selected?state.map.get(key(selected.q,selected.r)):null;
    if(!tile){panel.classList.add('hidden');buildingPanelKey='';return;}
    panel.classList.remove('hidden');const building=tile.buildings?.[selected.index];
    document.getElementById('buildingPanelTitle').textContent=building?HexBuildings.definitions[building.type].name:'Gebäudeslot';
    document.getElementById('buildingPanelInfo').textContent=`${CARD_LIBRARY[tile.type]?.name||'Hex'}: automatisch +${tile.income||0} Gold je überlebter Wave. ${building?HexBuildings.definitions[building.type].desc:'Optional einen Gebäudetyp bauen. Haus: zusätzliches Einkommen, Schmiede: Tower-Schaden, Markt: Tower-Rabatte. Ein Gebäude pro Slot.'}`;
    const panelKey=JSON.stringify([selected,building?.type,state.phase]);
    if(buildingPanelKey!==panelKey){
      buildingPanelKey=panelKey;buildingButtons.clear();const content=document.getElementById('buildingOptions');content.innerHTML='';
      if(!building) for(const [type,definition] of Object.entries(HexBuildings.definitions)){
        const button=document.createElement('button');button.className='upgradeOption';button.innerHTML=`<strong>${definition.name} · ${definition.cost} Gold</strong><small>${definition.desc}</small>`;
        button.addEventListener('click',()=>{if(HexBuildings.buy(state,state.selectedBuilding,type)){sound.play('build');renderAll();}});content.appendChild(button);buildingButtons.set(type,button);
      }
    }
    for(const [type,button] of buildingButtons) button.disabled=!['build','wave'].includes(state.phase)||state.hp<=0||state.gold<HexBuildings.definitions[type].cost;
    positionTowerPanel();
  }
  function renderTowerPanel(){
    const panel=document.getElementById('towerPanel'),selected=state.selectedTower,tower=selected?state.map.get(key(selected.q,selected.r))?.towers[selected.index]:null;
    if(!tower){panel.classList.add('hidden');towerPanelKey='';return;}
    panel.classList.remove('hidden');document.getElementById('towerPanelTitle').textContent=`${HexData.towerDefinition(tower).name} · Stufe ${tower.level}`;
    const panelKey=JSON.stringify([selected,tower.branch,tower.finalUpgrade,tower.supportDamage,state.buildingVersion,state.phase]);
    if(towerPanelKey!==panelKey){
      towerPanelKey=panelKey;upgradeButtons.clear();const content=document.getElementById('towerUpgrades');content.innerHTML='';
      if(tower.finalUpgrade){const hint=document.createElement('p');hint.className='hint';hint.textContent='Finale Stufe erreicht.';content.appendChild(hint);}
      else for(const [branch,upgrade] of HexData.availableUpgrades(tower)){
        const current=HexData.towerDefinition(tower),next=HexData.towerDefinition({...tower,...(upgrade.requires?{finalUpgrade:branch}:{branch})}),button=document.createElement('button');
        button.className='upgradeOption';
        const price=HexBuildings.cost(state,selected,upgrade.cost);
        button.innerHTML=`<strong>${upgrade.name} · ${price} Gold</strong><small>${upgrade.desc}</small><small>Schaden ${current.damage} → ${next.damage} · Reichweite ${current.range} → ${next.range}</small><small>Schussintervall ${current.cooldown.toFixed(2)} → ${next.cooldown.toFixed(2)} s${next.splash?` · Splash ${next.splash}`:''}${next.chain?` · Ziele ${current.chain} → ${next.chain} · Sprünge ${current.jumpRange} → ${next.jumpRange}`:''}</small>`;
        if(current.aura) button.innerHTML=`<strong>${upgrade.name} · ${price} Gold</strong><small>${upgrade.desc}</small><small>Slow ${Math.round((1-current.slow)*100)} → ${Math.round((1-next.slow)*100)} % · Radius ${current.range} → ${next.range}</small>`;
        button.addEventListener('click',()=>upgradeSelectedTower(branch));content.appendChild(button);upgradeButtons.set(branch,button);
      }
    }
    for(const [branch,button] of upgradeButtons) button.disabled=!['build','wave'].includes(state.phase)||state.gold<HexBuildings.cost(state,selected,HexData.UPGRADES[branch].cost)||state.hp<=0;
    positionTowerPanel();
  }
  function setMessage(s){messageEl.textContent=s;}

  function rotateSelected(){
    if(state.phase!=='place'||!state.hand.length) return;
    state.rotation=(state.rotation+1)%6; renderAll();
  }

  function newRun(){
    clearRunTimers();
    towerMenuKey='';renderer.reset();
    document.getElementById('deckDropdown').open=false;
    rewardOverlay.classList.add('hidden');
    const seedInput=document.getElementById('runSeed');
    const seed=seedInput.value?.trim()||HexRandom.freshSeed();
    random=HexRandom.create(seed);
    state=freshState();state.seed=seed;state.landmarks=HexExploration.create(HexRandom.create(seed+'|exploration'));
    state.vision=HexExploration.expand(state.landmarks,new Map([['0,0',{q:0,r:0}]]));
    document.getElementById('activeSeed').textContent=seed;
    setupBase();state.drawPile=shuffle(state.deck);drawHand();setMessage('Wähle eine Hexkarte und lege sie an die offene Straße der Base.');renderAll();
  }

  startWaveBtn.addEventListener('click',startWave);
  newRunBtn.addEventListener('click',newRun);
  document.getElementById('sellTowerBtn').addEventListener('click',sellSelectedTower);
  document.getElementById('closeBuildingPanel').addEventListener('click',()=>{state.selectedBuilding=null;renderAll();});
  document.getElementById('skipRemovalBtn').addEventListener('click',()=>{if(state.phase==='bossReward') finishBossReward();else if(['removal','shrineReward'].includes(state.phase)) finishRemoval();});
  document.getElementById('closeTowerPanel').addEventListener('click',()=>{state.selectedTower=null;renderAll();});
  document.getElementById('zoomInBtn').addEventListener('click',()=>renderer.zoom(.8));
  document.getElementById('zoomOutBtn').addEventListener('click',()=>renderer.zoom(1.25));
  document.getElementById('resetViewBtn').addEventListener('click',()=>renderer.resetView());
  document.getElementById('deckDropdown').addEventListener('toggle',()=>{if(document.getElementById('deckDropdown').open) renderDeckOverview();});
  document.addEventListener('keydown',e=>{
    if(e.key.toLowerCase()==='f'&&!e.repeat&&e.target?.id==='doubleSpeed'){e.preventDefault();e.target.checked=!e.target.checked;return;}
    if(['INPUT','TEXTAREA','SELECT','BUTTON','SUMMARY'].includes(e.target?.tagName)||e.target?.isContentEditable) return;
    if(e.code==='Space'&&!e.repeat){e.preventDefault();startWave();}
    if(e.key.toLowerCase()==='r')rotateSelected();
    if(e.key.toLowerCase()==='f'&&!e.repeat){const toggle=document.getElementById('doubleSpeed');toggle.checked=!toggle.checked;}
  });

  let last=performance.now();
  function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;update(dt,now);requestAnimationFrame(frame);}  
  newRun(); requestAnimationFrame(frame);
})();





