(() => {
  'use strict';

  const svg = document.getElementById('board');
  const rendererCommands={
    placeTile,inspectCaravan(){document.getElementById('waveDropdown').open=true;},selectSlot(q,r,index,multiple){if(!applyBuildingTarget(q,r))selectSlot(q,r,index,multiple);},inspectBiome,
    fieldClick(){document.getElementById('towerDrawer').classList.add('hidden');if(state?.dragTower){cancelQuickTower();renderAll();}},
    selectBase(){if(applyBuildingTarget(0,0))return;document.getElementById('towerDrawer').classList.add('hidden');state.selectedBase=true;state.selectedTower=null;state.selectedSlot=null;state.selectedBuilding=null;document.getElementById('baseDropdown').open=true;renderAll();},
    hoverBuilding(slot){state.hoverBuilding=slot;renderBoard();},
    rotatePlacement(){return rotateSelected(-1);},
    viewChanged(){positionTowerPanel();positionTutorialSpotlight();if(state?.dragTower)renderDragShade();},
    hoverPlacement(id){state.hoveredPlacement=id;},
    leavePlacement(id){if(state.hoveredPlacement===id) state.hoveredPlacement=null;},
    selectBuilding(q,r,index){if(applyBuildingTarget(q,r))return;closeBasePanel();state.selectedBuilding={q,r,index};state.selectedSlot=null;state.selectedTower=null;renderAll();},
    selectTower(q,r,index,multiple=false){if(applyBuildingTarget(q,r))return;closeBasePanel();
      const tower=state.map.get(key(q,r))?.towers[index];if(!tower)return;
      chooseMany('Tower',{q,r,index},multiple);state.selectedSlot=null;state.selectedBuilding=null;state.previewTower=null;renderAll();
    },
    clearSelection(){if(state?.dragTower){cancelQuickTower();renderAll();}document.getElementById('towerDrawer').classList.add('hidden');closeBasePanel();if(state.selectedTower||state.selectedBuilding||state.selectedSlot){state.selectedTower=null;state.selectedSlot=null;state.selectedBuilding=null;state.previewTower=null;renderAll();}}
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
  let gameSpeed=1;try{gameSpeed=Math.max(1,Math.min(8,Math.round(Number(localStorage.getItem('gameSpeed'))||1)));}catch{}
  speedToggle.value=String(gameSpeed);document.getElementById('speedValue').textContent=gameSpeed+'×';
  function changeSpeed(value){advanceClock(performance.now());gameSpeed=Math.max(1,Math.min(8,Math.round(Number(value)||1)));speedToggle.value=String(gameSpeed);document.getElementById('speedValue').textContent=gameSpeed+'×';try{localStorage.setItem('gameSpeed',String(gameSpeed));}catch{}}
  speedToggle.addEventListener('input',()=>changeSpeed(speedToggle.value));
  const towerMenu = document.getElementById('towerMenu');
  const rewardOverlay = document.getElementById('rewardOverlay');
  const rewardChoices = document.getElementById('rewardChoices');
  const loadoutOverlay=document.getElementById('loadoutOverlay');
  const loadoutChoices=document.getElementById('loadoutChoices');
  const gameOverOverlay=document.getElementById('gameOverOverlay');
  const arsenalOverlay=document.getElementById('arsenalOverlay');
  let profile=HexProfile.load(HexData.TOWERS),pendingLoadout=[...profile.activeLoadout],pendingHero=profile.activeHero,pendingDifficulty=profile.difficulty||'normal',hasActiveRun=false;

  const NS = 'http://www.w3.org/2000/svg';
  const {SQRT3,HEX,OPP,key,axialToWorld,hexPoints,edgePoint,neighbor,rotatedRoads}=HexMap;

  const {CARD_LIBRARY,TOWERS}=HexData;

  let showHexGrid=false;try{showHexGrid=localStorage.getItem('hexGrid')==='true';}catch{}
  let showSlotHints=true,tutorialSeen=false;try{showSlotHints=localStorage.getItem('slotHints')!=='false';tutorialSeen=localStorage.getItem('tutorial-v1')==='done'||profile.records.runsPlayed>0;}catch{}
  let tutorial={active:false,step:0};
  let state;
  let random;
  let towerMenuKey='';
  let handRenderKey='',forecastRenderKey='',uiLanguageRevision=0;
  const deckRenderKeys=new Map(),uiWavePlans=new Map();
  // UI-only cache: never handed to the simulation or modified by consumers.
  function uiWavePlan(wave){
    const cacheKey=JSON.stringify([wave,state.income,!!state.challengeDay,state.seed,state.towerLoadout]);
    if(!uiWavePlans.has(cacheKey)){
      if(uiWavePlans.size>=4)uiWavePlans.delete(uiWavePlans.keys().next().value);
      uiWavePlans.set(cacheKey,HexWaves.plan(wave,state.income,!!state.challengeDay,state));
    }
    return uiWavePlans.get(cacheKey);
  }
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

  function shuffle(arr){return HexRunFlow.shuffle(arr,random);}
  function drawHand(){
    const result=HexRunFlow.drawHand(state,random);state.selectedCard=null;state.rotation=0;
    if(result==='rescue')setMessage('Deck blockiert: Lege das kostenlose Rettungshex. Es hat keine Turmplätze und kommt nicht ins Deck.');
    if(result==='tunnel')setMessage('Straße eingeschlossen. Ein kostenloser Rettungstunnel öffnet eine neue Front.');
    if(result==='blocked')setMessage('Keine Erweiterung möglich. Du kannst bauen und die nächste Wave starten.');
    renderUI();
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

  function placementTargets(card){
    if(card.roads.length)return openRoadTargets();
    const targets=new Map();for(const tile of state.map.values())for(let d=0;d<6;d++){const n=neighbor(tile.q,tile.r,d);if(!state.map.has(key(n.q,n.r)))targets.set(key(n.q,n.r),n);}return [...targets.values()];
  }
  function canPlace(q,r,card,rot){return HexPlacementCommands.canPlace(state,q,r,card,rot); }
  function buildGraph(){return HexMap.buildGraph(state.map);}
  const pathToBase=HexMap.pathToBase;

  function hasAnyPlacement(card,rot){return placementTargets(card).some(s=>canPlace(s.q,s.r,card,rot));}

  const slotPositions=HexMap.slotPositions;

  function applyBuildingTarget(q,r){if(!state.buildingTarget)return false;const ok=HexBuildings.setTarget(state,state.buildingTarget,key(q,r));if(ok){state.buildingTarget=null;setMessage('Zusätzliches Hex versorgt.');renderAll();}else{setMessage('Dieses Hex ist bereits versorgt. Wähle ein unversorgtes Hex.');renderAll();}return true;}
  function placeTile(q,r){
    if(state.dragTower){cancelQuickTower();renderAll();return;}
    if(applyBuildingTarget(q,r))return;
    if(state.phase!=='place'||state.waveRunning||state.celebrationActive) return;
    const id=state.hand[state.selectedCard]; if(!id) return;
    const card=id==='rescue'?state.rescueCard:CARD_LIBRARY[id];
    if(!canPlace(q,r,card,state.rotation)){
      setMessage(HexPlacementCommands.failureMessage(state,card),true); return;
    }
    const result=HexRunSession.place(state,random,{q,r,index:state.selectedCard,rotation:state.rotation});if(!result)return;
    const {connected,treasure}=result;sound.play('place');state.hoveredPlacement=null;
    if(result.opening){state.selectedCard=null;state.rotation=0;setMessage('Erster Ausgang erweitert. Lege jetzt eine Karte direkt an den zweiten Base-Ausgang.');renderAll();return;}
    state.selectedSlot=null;state.selectedBuilding=null;tutorialEvent('place');
    if(treasure||connected.gold||state.pendingShrine) sound.play('collect');
    setMessage(treasure||connected.gold?`Schatz erschlossen: +${treasure+connected.gold} Gold. Baue jetzt Türme oder starte die Wave.`:'Hex gelegt. Baue jetzt Türme oder starte die Wave.');
    if(connected.bosses) setMessage(`${connected.bosses} Bossfeld(er) angeschlossen. Wächter starten in der nächsten Wave auf ihren eigenen Hexfeldern.`);
    if(state.landmarks.get(key(q,r))?.status==='ready') setMessage('Bossfeld erschlossen: Der Wächter startet in der nächsten Wave direkt auf diesem Hex. Bereite deine Türme vor.');
    renderAll();
    if(state.pendingShrine){showShrine();renderAll();return;}
    if(autoStart.checked&&!tutorial.active) schedule(()=>startWave(),250);
  }

  function selections(kind){
    const primary=state['selected'+kind];if(!primary)return [];
    const list=state['selected'+kind+'s'];return list?.includes(primary)?list:[primary];
  }
  function chooseMany(kind,selected,multiple){
    const list=(multiple||document.getElementById('multiTowerSelection').checked)?selections(kind).slice():[],at=list.findIndex(s=>s.q===selected.q&&s.r===selected.r&&s.index===selected.index);
    if(at>=0)list.splice(at,1);else list.push(selected);
    state['selected'+kind+'s']=list;state['selected'+kind]=list.at(-1)||null;
  }
  function selectSlot(q,r,index,multiple=false){
    if(state.dragTower){dropQuickTower(state.dragTower,{q,r,index});return;}
    closeBasePanel();
    if(!['place','build','wave'].includes(state.phase)||state.hp<=0) return;
    const tile=state.map.get(key(q,r)); if(!tile||!Number.isInteger(index)||index<0||index>=tile.slots||tile.towers[index]) return;
    state.selectedTower=null;state.selectedBuilding=null;chooseMany('Slot',{q,r,index},multiple);tutorialEvent('slot');
    setMessage(selections('Slot').length+(selections('Slot').length===1?' Bauplatz':' Bauplätze')+' gewählt · Strg + Klick: weitere Plätze markieren oder abwählen.');document.getElementById('towerDrawer')?.classList.remove('hidden');document.getElementById('rulesDrawer')?.classList.add('hidden');document.getElementById('settingsDrawer')?.classList.add('hidden');renderAll();
  }

  function buyTower(type){
    const result=HexTowerCommands.buy(state,type,selections('Slot'));
    if(!result.ok){if(result.reason==='gold')setMessage('Nicht genug Gold.');return;}
    if(tutorial.active&&tutorial.step===3)document.getElementById('towerDrawer').classList.add('hidden');
    state.selectedSlots=[];state.selectedSlot=null;state.previewTower=null;state.selectedTower=null;
    sound.play('build');tutorialEvent('buy',type);
    renderAll();
  }

  function sellSelectedTower(){
    if(selections('Tower').length!==1) return;
    const selected=state.selectedTower,tile=state.map.get(key(selected.q,selected.r)),tower=tile?.towers[selected.index];
    const refund=HexData.towerRefund(state,tower);if(!refund) return;
    HexData.recordTowerStat(state,tower,'refundGold',refund.amount);if(state.runTowerDetails[tower.statId])state.runTowerDetails[tower.statId].sold=true;
    state.gold+=refund.amount;tile.towers[selected.index]=null;
    state.selectedTower=null;state.selectedSlot=['place','build','wave'].includes(state.phase)?{...selected}:null;
    sound.play('build');setMessage(`Turm zurückgegeben: +${refund.amount} Gold (${refund.percent} % der gesamten Investition inklusive Upgrades).`);renderAll();
  }
  function upgradeSelectedTower(branch){
    state.previewUpgrade=null;
    if(selections('Tower').length!==1||!HexTowerCommands.upgrade(state,state.selectedTower,branch))return;
    const tutorialUpgrade=tutorial.active&&tutorial.step===4;
    sound.play('build');tutorialEvent('upgrade');if(tutorialUpgrade){state.selectedTower=null;state.selectedTowers=[];state.selectedSlot=null;state.selectedSlots=[];state.previewTower=null;document.getElementById('towerDrawer').classList.add('hidden');}renderAll();
  }

  function spawnSources(){return HexRunRuntime.spawnSources(state);}
  function nextSourcePoints(source){return HexRunRuntime.nextSourcePoints(state,random,source);}

  const SPAWN_SPACING=20;   // Weltmaß zwischen zwei nacheinander gespawnten Gegnern
  function startWave(){
    if(state.phase==='place'){setMessage('Lege zuerst dein Hex, bevor du die nächste Welle startest.');return;}
    const result=HexRunFlow.start(state,random);if(!result)return;
    last=performance.now();clockDebt=0;tutorialEvent('wave');state.selectedSlot=null;state.previewTower=null;sound.play('wave');startWaveBtn.disabled=true;
    setMessage('Wave '+state.wave+' läuft – '+result.fronts+' offene Fronten.'+(result.waveBoss?' Bosswelle!':'')+(result.bosses?' '+result.bosses+' Wächter gestartet.':''));renderUI();
  }
  function renderSessionPhase(){
    if(state.phase==='victory'){showCampaignVictory();return;}
    state.selectedCard=null;state.rotation=0;
    if(state.phase==='bossReward')showBossReward();else if(state.phase==='reward')showRewards();else if(state.phase==='shrineReward')showShrine();else if(state.phase==='removal')showRemoval(state.removalSource);
    else {rewardOverlay.classList.add('hidden');if(state.drawResult==='rescue')setMessage('Deck blockiert: Lege das kostenlose Rettungshex.');if(state.drawResult==='tunnel')setMessage('Straße eingeschlossen. Ein kostenloser Rettungstunnel öffnet eine neue Front.');showPendingCelebration();}
    renderAll();
    if(state.phase==='build'&&!state.celebrationActive&&autoStart.checked&&!tutorial.active)schedule(()=>startWave(),250);
  }
  let rewardInputOffer=null,rewardInputAfter=0,rewardPointerReady=false;
  function openRewardSelection(){
    if(rewardInputOffer!==state.rewardOffer?.id){rewardInputOffer=state.rewardOffer?.id;rewardInputAfter=performance.now()+350;rewardPointerReady=false;}
    rewardOverlay.classList.remove('hidden');
  }
  rewardOverlay.addEventListener('pointerdown',event=>{rewardPointerReady=performance.now()>=rewardInputAfter;if(!rewardPointerReady){event.preventDefault();event.stopImmediatePropagation();}},true);
  rewardOverlay.addEventListener('click',event=>{if(performance.now()<rewardInputAfter||event.detail>0&&!rewardPointerReady){event.preventDefault();event.stopImmediatePropagation();}},true);
  function takeReward(id,index){if(!HexRunSession.choose(state,random,id,index))return false;renderSessionPhase();return true;}
  function endWave(){
    const best=state.challengeDay?(profile.dailyResults?.[state.challengeDay]?.best||0):profile.records.highestWave||0;
    const result=HexRunSession.finish(state,random,best);if(!result)return;
    if(result.campaignVictory){showCampaignVictory();return;}
    if(result.victory){showCampaignVictory();return;}sound.play('complete');renderSessionPhase();
  }
  function finishBossReward(){if(state.phase==='bossReward')takeReward(state.rewardOffer?.id,null);}
  function finishRemoval(){if(['removal','shrineReward'].includes(state.phase))takeReward(state.rewardOffer?.id,null);}
  function rewardAction(title,description,action){
    const button=document.createElement('button');button.type='button';button.className='upgradeOption';
    button.innerHTML='<strong>'+title+'</strong><small>'+description+'</small>';button.addEventListener('click',action);rewardChoices.appendChild(button);
  }
  let rewardView='selection';
  function inspectReward(view){
    rewardView=view;
    document.getElementById('rewardInspectActions').classList.remove('hidden');document.getElementById('skipRemovalBtn').textContent='Belohnung überspringen';
    rewardOverlay.classList.toggle('inspectMap',view==='map');
    rewardOverlay.setAttribute('aria-modal',String(view!=='map'));
    document.getElementById('rewardSelection').classList.toggle('hidden',view!=='selection');
    document.getElementById('rewardDeck').classList.toggle('hidden',view!=='deck');
    document.getElementById('rewardBackBtn').classList.toggle('hidden',view==='selection');
    document.getElementById('rewardMapBtn').setAttribute('aria-pressed',String(view==='map'));
    document.getElementById('rewardDeckBtn').setAttribute('aria-pressed',String(view==='deck'));
    if(view==='deck')renderDeckOverview('rewardDeckOverview');
  }
  function showPendingCelebration(){
    HexRunSession.promoteCelebration(state);if(!state.celebrationActive||!state.activeCelebration)return;
    const success=state.activeCelebration;
    document.getElementById('celebrationTitle').textContent=success.bosses?'DIE WÄCHTER SIND GEFALLEN!':'DU WÄCHST ÜBER DICH HINAUS!';
    document.getElementById('celebrationText').textContent=success.messages.join(' · ');
    document.getElementById('celebrationWave').textContent='WAVE '+success.wave+' ÜBERLEBT';
    document.getElementById('celebration').classList.remove('hidden');sound.play('complete');
    document.getElementById('celebrationContinue').focus?.();
  }
  function closeCelebration(){HexRunSession.acknowledge(state);document.getElementById('celebration').classList.add('hidden');renderHotkeyTip();startWaveBtn.focus?.();}

  function showBossReward(){
    inspectReward('selection');
    state.phase='bossReward';const id=state.bossRewards[0],rarity=HexExploration.bossRewardRarity(state.seed,id);
    document.getElementById('rewardTitle').textContent='Wächter besiegt · '+rarity+'-Beute';
    document.getElementById('rewardDescription').textContent='Zusätzlich zu den 50 Gold: Wähle genau eine Karte oder einen Run-Segen. Normale Wave-Belohnungen folgen danach.';
    document.getElementById('skipRemovalBtn').classList.remove('hidden');rewardChoices.innerHTML='';
    const offer=HexRewards.offer(state,'boss',random),picks=offer.choices.filter(c=>c.kind==='card').map(c=>c.cardId);
    for(const cardId of picks){const card=cardElement(cardId,false);card.addEventListener('click',()=>{
      if(state.phase!=='bossReward'||state.bossRewards[0]!==id) return;
      takeReward(offer.id,offer.choices.findIndex(c=>c.kind==='card'&&c.cardId===cardId));
    });rewardChoices.appendChild(card);}
    for(const [kind,title,description] of [['bastion','Bastionssegen','+5 maximale und aktuelle Base-HP für diesen Run.'],['income','Handelspakt','+2 Gold nach jeder künftig überlebten Wave in diesem Run.']])rewardAction(title,description,()=>{if(state.phase!=='bossReward'||state.bossRewards[0]!==id)return;takeReward(offer.id,offer.choices.findIndex(c=>c.blessing===kind));});
    openRewardSelection();
  }

  function showRewards(){
    inspectReward('selection');
    state.phase='reward';
    document.getElementById('rewardTitle').textContent='Deck erweitern';
    document.getElementById('rewardDescription').textContent='Wähle 1 von 3 Hexkarten. Common ist häufiger als Uncommon und Rare.';
    document.getElementById('skipRemovalBtn').classList.add('hidden');
    const offer=HexRewards.offer(state,'normal',random),picks=offer.choices.map(c=>c.cardId);
    rewardChoices.innerHTML='';
    picks.forEach(id=>{
      const el=cardElement(id,false); el.addEventListener('click',()=>{
        if(state.phase!=='reward') return;
        if(!takeReward(offer.id,picks.indexOf(id)))return;
        if(state.phase==='place') setMessage(`${CARD_LIBRARY[id].name} wurde deinem Deck hinzugefügt.`);
      }); rewardChoices.appendChild(el);
    });
    openRewardSelection();
  }
  function showShrine(){
    inspectReward('selection');
    const effect=HexExploration.shrineEffect(state.landmarks,state.pendingShrine);
    if(effect==='remove'){showRemoval('shrine');return;}
    if(effect==='repair'||effect==='upgrade'){
      const shrineId=state.pendingShrine;state.removalSource='shrine';state.phase='shrineReward';rewardChoices.innerHTML='';
      document.getElementById('rewardTitle').textContent=effect==='repair'?'Shrine erschlossen · Heilquelle':'Shrine erschlossen · Werksegen';
      document.getElementById('rewardDescription').textContent=effect==='repair'?'Heile bis zu 5 HP. Bei voller Gesundheit erhältst du stattdessen 30 Gold.':'Wähle ein kostenloses Upgrade für einen bereits gebauten Loadout-Turm. Ist keines möglich, erhältst du 30 Gold.';
      const offer=HexRewards.offer(state,'shrine',random);
      const take=index=>{if(state.phase!=='shrineReward'||state.pendingShrine!==shrineId)return;if(takeReward(offer.id,index))sound.play('collect');};
      const choices=offer.choices.filter(c=>c.kind==='upgrade').map(c=>c.choice);
      if(choices.length)for(const choice of choices)rewardAction(TOWERS[choice.type].name+' → '+choice.name,'Hex '+choice.q+','+choice.r+' · Platz '+(choice.index+1)+' · kostenlos; Verkaufswert bleibt unverändert.',()=>take(offer.choices.findIndex(c=>c.choice===choice)));
      else rewardAction(effect==='repair'&&state.hp<state.maxHp?'Bis zu +5 HP':'Vorräte · +30 Gold','Einmaliger Shrine-Segen.',()=>take(0));
      document.getElementById('skipRemovalBtn').classList.add('hidden');document.getElementById('rewardInspectActions').classList.add('hidden');openRewardSelection();return;
    }
    state.removalSource='shrine';state.phase='shrineReward';rewardChoices.innerHTML='';
    document.getElementById('rewardTitle').textContent='Shrine erschlossen · Effekt: '+(effect==='legendary'?'Legendary-Karte erhalten':effect==='epic'?'Epic-Karte erhalten':'Zusätzliche Karte wählen');
    document.getElementById('rewardDescription').textContent='Wähle eine Karte für dein Deck. Danach geht es zurück in die Bauphase. Dieser Shrine ist einmalig; Überspringen verbraucht ihn ebenfalls.';
    document.getElementById('skipRemovalBtn').classList.remove('hidden');
    const offer=HexRewards.offer(state,'shrine',random),picks=offer.choices.map(c=>c.cardId);
    for(const id of picks){
      const card=cardElement(id,false);card.addEventListener('click',()=>{
        if(state.phase!=='shrineReward') return;
        if(!takeReward(offer.id,picks.indexOf(id)))return;setMessage(`${CARD_LIBRARY[id].name} durch den Shrine zum Deck hinzugefügt.`);
      });rewardChoices.appendChild(card);
    }
    openRewardSelection();
  }
  function showRemoval(source='reward'){
    inspectReward('selection');
    state.removalSource=source;
    state.phase='removal';rewardChoices.innerHTML='';
    document.getElementById('skipRemovalBtn').textContent='Keine Karte entfernen';
    document.getElementById('rewardTitle').textContent='Deck ausdünnen (optional)';
    document.getElementById('rewardDescription').textContent='Optional: Entferne eine Kartenkopie aus deinem Deck. Mindestens 5 Karten bleiben erhalten. Bereits gelegte Hexe bleiben bestehen.'+(source==='shrine'?' Dieser Shrine ist einmalig; Überspringen verbraucht ihn ebenfalls.':'');
    document.getElementById('skipRemovalBtn').classList.remove('hidden');
    const offer=HexRewards.offer(state,'removal',random);
    const counts=new Map();state.deck.forEach(id=>counts.set(id,(counts.get(id)||0)+1));
    const rarityOrder={Common:0,Uncommon:1,Rare:2,Epic:3,Legendary:4};
    for(const [id,count] of [...counts].sort(([a],[b])=>(rarityOrder[CARD_LIBRARY[a]?.rarity]??99)-(rarityOrder[CARD_LIBRARY[b]?.rarity]??99)||CARD_LIBRARY[a].name.localeCompare(CARD_LIBRARY[b].name,'de'))){
      const card=cardElement(id,false),info=document.createElement('p');info.textContent=`${count} im Deck · 1 Kopie entfernen`;card.appendChild(info);card.disabled=state.deck.length<=5;
      card.addEventListener('click',()=>{if(state.phase!=='removal'||!takeReward(offer.id,offer.choices.findIndex(c=>c.cardId===id))) return;if(['place','build'].includes(state.phase)) setMessage(`${CARD_LIBRARY[id].name}: Eine Kopie aus dem Deck entfernt.`);});rewardChoices.appendChild(card);
    }
    openRewardSelection();
  }

  function update(dt,time,paint=true){
    if(!state.waveRunning) return;
    const outcome=HexRunRuntime.advance(state,random,dt*gameSpeed,name=>sound.play(name));
    if(state.hp<=0){state.hp=0;state.waveRunning=false;state.phase='gameover';state.enemies=[];state.projectiles=[];state.spawnQueue=[];clearRunTimers();sound.play('gameover');setMessage(`Run beendet. Du hast Wave ${state.wave} erreicht.`);showGameOver();}
    else if(outcome==='complete') endWave();
    if(paint){renderBoard(); renderUI();}
  }

  function buildRescueTunnel(){
    if(!state.tunnelOffer||state.phase!=='build'||state.waveRunning||state.hp<=0)return;
    const plan=HexMap.tunnelPlan(state.map,state.landmarks,state.difficulty==='dual');if(!plan)return;
    if(!state.tunnelConfirmed){state.tunnelConfirmed=true;setMessage('Rettungstunnel von Hex '+plan.source+' nach '+plan.q+','+plan.r+'. Kostenlos, keine Gebäude werden entfernt.');renderAll();return;}
    HexRunRuntime.rescueTunnel(state);renderAll();setMessage('Rettungstunnel geöffnet. Erweitere die neue Straße in der nächsten Runde.');
  }
  document.getElementById('tunnelRescueBtn').addEventListener('click',buildRescueTunnel);
  function renderBoard(){
    if(state.previewUpgrade){const selected=state.selectedTower,tower=selected&&state.map.get(key(selected.q,selected.r))?.towers[selected.index];if(tower!==state.previewUpgrade.tower)state.previewUpgrade=null;}
    if(state.buildingTarget&&(state.hp<=0||state.phase==='gameover'))state.buildingTarget=null;
    const card=HexPlacementCommands.card(state,state.hand[state.selectedCard]);
    const targets=state.phase==='place'&&!state.waveRunning&&card?placementTargets(card).filter(target=>!state.landmarks.get(key(target.q,target.r))?.prefab).map(target=>({...target,legal:canPlace(target.q,target.r,card,state.rotation)})):[];
    if(state.buildingTarget){targets.splice(0,targets.length,...[...state.map.values()].map(t=>({q:t.q,r:t.r,legal:HexBuildings.canTarget(state,state.buildingTarget,key(t.q,t.r))})));}
    renderer.render(state,targets);renderDragShade();
  }
  function miniPathSvg(card,rot=0){
    const geometry=HexMap.roadGeometry({q:0,r:0,type:card.id,roads:rotatedRoads(card,rot)});
    const lines=[...geometry.legs.values()].map(points=>'<polyline points="'+points.map(p=>(30+p.x*25/HEX).toFixed(1)+','+(30+p.y*25/HEX).toFixed(1)).join(' ')+'"/>').join('');
    return '<svg class="miniPath" viewBox="0 0 60 60" aria-label="Aktuelle Ausrichtung"><polygon points="51.7,17.5 51.7,42.5 30,55 8.3,42.5 8.3,17.5 30,5"/>'+lines+'</svg>';
  }

  function cardTip(id){const c=id==='rescue'?state.rescueCard:CARD_LIBRARY[id],n=(c.roads||[]).length;
    return `${c.name} (${c.rarity})
${c.desc}
${n?n+' Straßenanschlüsse':'Keine Straße'} · ${c.slots||0} Turmplatz${(c.slots||0)===1?'':'e'}${c.buildingSlots?(c.id==='deadEnd'?' · 1 Gegnerportal-Platz':' · '+c.buildingSlots+' Gebäude'):''}
R dreht die Karte, dann Feld anklicken.`;}
  function cardElement(id,selectable=true,previewRotation=0){
    const c=id==='rescue'?state.rescueCard:CARD_LIBRARY[id];const el=document.createElement('button');el.className=`card rarity-${c.rarity.toLowerCase()}`;el.type='button';
    el.innerHTML=`<div class="rarity">${c.rarity}</div>${miniPathSvg(c,previewRotation)}<h3>${c.name}</h3><p>${c.desc}</p><div class="slots">🛡️ ${c.slots||0} Turret-Slot${(c.slots||0)!==1?'s':''}${c.buildingSlots?(c.id==='deadEnd'?' · ◉ 1 Gegnerportal-Platz':` · 🏠 ${c.buildingSlots} Gebäude`):''}</div>`;
    if(!selectable){el.style.width='100%';if(state.phase!=='removal'){const count=document.createElement('p');count.className='deckCopyCount';count.textContent=state.deck.filter(cardId=>cardId===id).length+'× bereits im Deck';el.appendChild(count);}}
    return el;
  }
  function pathGlyph(c){
    if(c.id==='straight'||c.id==='empty') return '━';
    if(c.id==='smallCurve') return '⌝'; if(c.id==='bigCurve') return '◜'; if(c.id==='tee') return '┳'; if(c.id==='cross') return '╋'; if(c.id==='village') return '⌞🏠'; return '⬡';
  }


  // ---- UX-Rückmeldung: Treffer an der Base, Goldgewinn, Wave-Fortschritt, Turm-Feld statt Shop bei gewähltem Turm ----
  let lastHp=null,lastGold=null,lastRun=null;
  function uxFeedback(){
    if(lastRun!==state){lastRun=state;lastHp=state.hp;lastGold=state.gold;}
    const app=document.getElementById('app');
    if(state.hp<lastHp){app.classList.remove('hit');void app.offsetWidth;app.classList.add('hit');}
    if(state.gold>lastGold){const f=document.createElement('div');f.className='goldFloat';f.textContent='+'+(state.gold-lastGold)+' 🪙';goldEl.parentElement?.appendChild(f);f.addEventListener?.('animationend',()=>f.remove());}
    lastHp=state.hp;lastGold=state.gold;
    const bar=document.getElementById('waveBar');
    if(bar){const total=state.waveRunning?uiWavePlan(state.wave).count:0,left=state.pendingSpawns+state.enemies.filter(e=>e.alive).length;bar.style.width=total?Math.max(0,Math.min(100,100-left/total*100))+'%':'0%';}
    if(state.selectedTower||state.selectedBuilding) document.getElementById('towerDrawer')?.classList.add('hidden');
    app.classList.toggle('canStart',state.phase==='build'&&!state.waveRunning&&state.hp>0);
  }
  function renderHotkeyTip(){
    const tip=document.getElementById('hotkeyTip'),help=document.getElementById('hotkeyHelp'),settings=document.getElementById('settingsDrawer');
    if(state.lastCompletedWave>=11&&!state.waveRunning&&!state.celebrationActive&&['place','build'].includes(state.phase))state.hotkeyHintStarted=true;
    const active=!!state.hotkeyHintStarted&&!state.hotkeyHintDone&&!['gameover','victory'].includes(state.phase)&&!tutorial.active&&hasActiveRun&&mainMenu.classList.contains('hidden');
    if(active&&help.open&&!settings.classList.contains('hidden'))state.hotkeyHintDone=true;
    const shown=active&&!state.hotkeyHintDone;
    tip.classList.toggle('hidden',!shown||!settings.classList.contains('hidden'));
    document.getElementById('settingsOpenBtn').classList.toggle('hotkeyGuide',shown&&settings.classList.contains('hidden'));
    document.getElementById('hotkeyHelpSummary').classList.toggle('hotkeyGuide',shown&&!settings.classList.contains('hidden'));
    document.querySelector?.('[data-compact="menu"]')?.classList.toggle('hotkeyGuide',shown&&settings.classList.contains('hidden'));
    const inSettings=!settings.classList.contains('hidden');
    tip.classList.toggle('settingsVisible',inSettings);
    if(tip.parentElement&&tip.parentElement!==app)app.appendChild(tip);
  }
  function openHotkeySettings(){
    document.querySelectorAll?.('.drawer').forEach(panel=>panel.classList.add('hidden'));
    document.getElementById('settingsDrawer').classList.remove('hidden');renderHotkeyTip();layoutMenus();
  }
  function renderUI(){
    renderHotkeyTip();
    document.getElementById('rotateHexBtn').classList.toggle('hidden',state.phase!=='place');
    document.getElementById('rotateHexBtn').disabled=state.phase!=='place'||!state.hand[state.selectedCard];
    const tunnelButton=document.getElementById('tunnelRescueBtn');tunnelButton.classList.toggle('hidden',!state.tunnelOffer||state.phase!=='build'||state.waveRunning);tunnelButton.textContent=state.tunnelConfirmed?'Tunnel kostenlos bauen':'Rettungstunnel ansehen';
    renderQuickControls();
    uxFeedback();
    renderBasePanel();renderTutorial();
    hpEl.textContent=`${state.hp}/${state.maxHp}`;goldEl.textContent=state.gold;waveEl.textContent=state.waveRunning||['victory','gameover'].includes(state.phase)?state.wave:state.wave+1;deckCountEl.textContent=state.deck.length;
    updateArsenalHint();
    document.getElementById('upgradeStatus').checked=!!state.showUpgradeStatus;
    document.getElementById('profileDiamonds').textContent=profile.diamonds;
    document.getElementById('runDiamonds').textContent=`(+${state.metaSettled?0:state.challengeDay?(state.challengeWon&&!profile.dailyResults?.[state.challengeDay]?.won?10:0):HexProfile.runReward(profile,{wave:state.wave,...state.earnedMeta}).total})`;
    document.getElementById('profileStats').textContent=`${profile.records.runsPlayed} Runs · Bestmarke Wave ${profile.records.highestWave} · ${profile.records.bossesKilled} Bosse besiegt · ${profile.lifetime.normalKills} normale Gegner besiegt.`;
    document.getElementById('bonusIncome').textContent=`(+${state.income})`;
    renderBuildingPanel();
    handEl.classList.toggle('openingHand',state.hand.length>3);handEl.classList.toggle('singleCard',state.hand.length===1);
    document.getElementById('towerHotkeyHint').textContent=`1–${Math.min(9,state.towerLoadout.filter(id=>TOWERS[id]).length)}: Turm im geöffneten Baumenü auswählen`;document.getElementById('handHint').textContent=state.openingRemaining?`Noch ${state.openingRemaining} Base-Ausgang erweitern · Karten 1–${state.hand.length} · R dreht`:'Karte wählen (1–3) · Drehen: Knopf oder R · Hex antippen';
    document.getElementById('phaseLabel').textContent={place:'Hex platzieren',build:'Bauphase',wave:'Wave läuft',reward:'Kartenbelohnung',removal:'Deck ausdünnen (optional)',shrineReward:'Shrine-Belohnung',bossReward:'Boss-Beute',gameover:'Run beendet'}[state.phase];
    const handKey=JSON.stringify([state.hand,state.selectedCard,state.rotation,state.rescueCard,uiLanguageRevision]);
    if(handKey!==handRenderKey){
    handRenderKey=handKey;handEl.innerHTML='';
    state.hand.forEach((id,i)=>{const el=cardElement(id,true,i===state.selectedCard?state.rotation:0);el.title=cardTip(id);el.setAttribute?.("data-key",i+1);if(i===state.selectedCard)el.classList.add('selected');el.addEventListener('click',()=>{state.selectedCard=i;state.rotation=0;renderAll();});handEl.appendChild(el);});
    }
    // Keep purchase buttons stable during animation so pointer clicks/focus survive.
    const buildDiscounts=selections('Slot').map(slot=>HexBuildings.effects(state.map,slot).discount);
    const buildPrices=new Map(state.towerLoadout.filter(id=>TOWERS[id]).map(id=>[id,buildDiscounts.length?buildDiscounts.reduce((sum,discount)=>sum+Math.ceil(TOWERS[id].cost*discount),0):TOWERS[id].cost]));
    const menuKey=JSON.stringify([state.towerLoadout,selections('Slot'),state.buildingVersion]);
    if(menuKey!==towerMenuKey){
    towerMenuKey=menuKey;towerMenu.innerHTML='';towerButtons.clear();
    state.towerLoadout.map(id=>[id,TOWERS[id]]).filter(([,tower])=>tower).forEach(([id,t])=>{
      const selectedTile=state.selectedSlot?state.map.get(key(state.selectedSlot.q,state.selectedSlot.r)):null;
      const effective=HexData.towerDefinition({type:id,biome:selectedTile?HexBiomes.forTile(state,selectedTile):'grass',rangeFactor:state.challengeDay?.85:1,tileType:selectedTile?.type,supportDamage:HexBuildings.effects(state.map,selectedTile).damage});
      const price=buildPrices.get(id);
      const b=document.createElement('button');b.className='towerBtn';b.title=t.desc+'\n'+towerStats(effective)+(selections('Slot').length>1?'\nGesamtpreis für alle markierten Plätze inklusive lokaler Rabatte. Werte zeigen den zuletzt gewählten Platz.':'');
      b.innerHTML=`<span class="towerBuildIcon" aria-hidden="true">${HexArsenal.icon(id,t.color)}</span><span class="towerOffer"><strong class="towerOfferName">${t.name}</strong><small class="towerOfferDescription">${towerBuildRole(id)}</small><small class="towerOfferStats">${towerStatsMarkup(effective)}</small></span><strong class="towerOfferPrice">${price} 🪙${selections('Slot').length>1?'<small>'+selections('Slot').length+' × Türme</small>':''}<kbd>${towerMenu.children.length+1}</kbd></strong>`;
      b.disabled=!['place','build','wave'].includes(state.phase)||!state.selectedSlot||state.gold<price||state.hp<=0;
      b.addEventListener('pointerenter',()=>{state.previewTower=id;renderBoard();});
      b.addEventListener('pointerleave',()=>{state.previewTower=null;renderBoard();});
      b.addEventListener('focus',()=>{state.previewTower=id;renderBoard();});
      b.addEventListener('blur',()=>{state.previewTower=null;renderBoard();});
      b.addEventListener('click',()=>buyTower(id));towerMenu.appendChild(b);towerButtons.set(id,b);
    });
    }
    for(const [id,b] of towerButtons) b.classList.toggle('unaffordable',state.gold<buildPrices.get(id));
    for(const [id,b] of towerButtons) b.disabled=!['place','build','wave'].includes(state.phase)||!state.selectedSlot||state.gold<buildPrices.get(id)||state.hp<=0;
    renderForecast();
    const info=document.getElementById('selectedTowerInfo'),sell=document.getElementById('sellTowerBtn');
    const selected=state.selectedTower,tower=selected?state.map.get(key(selected.q,selected.r))?.towers[selected.index]:null;
    document.getElementById('towerBiomeInfo').title=tower?HexBiomes.definitions[tower.biome||'grass'].description:'';
    info.innerHTML=tower?towerStatsMarkup(HexData.towerDefinition(tower))+' · Biom: '+HexBiomes.definitions[tower.biome||'grass'].name+(CARD_LIBRARY[tower.tileType]?.towerBonus||CARD_LIBRARY[tower.tileType]?.towerRange||CARD_LIBRARY[tower.tileType]?.archerDamage||CARD_LIBRARY[tower.tileType]?.towerDamage?` · ${CARD_LIBRARY[tower.tileType].name}: Hexbonus eingerechnet`:''):'';
    renderTowerPanel();
    const refund=HexData.towerRefund(state,tower);sell.disabled=!refund||selections('Tower').length>1;
    sell.textContent=selections('Tower').length>1?'Zum Verkaufen einen einzelnen Turm wählen':refund?`${refund.percent===100?'Bau rückgängig':'Verkaufen'} · ${refund.percent} % (+${refund.amount} Gold)`:'Turm verkaufen';
    startWaveBtn.disabled=state.phase!=='build'||state.waveRunning||state.hp<=0;
    startWaveBtn.title=state.phase==='place'?'Lege zuerst dein Hex, bevor du die nächste Welle startest.':'';
    startWaveBtn.textContent=state.phase==='place'?'Zuerst Hex legen':!state.waveRunning&&HexWaves.bossProfile(state.wave+1)?`Bosswelle ${state.wave+1} starten (Leertaste)`:'Wave starten (Leertaste)';
    if(document.getElementById('deckDropdown').open) renderDeckOverview();renderSaleState();layoutMenus();
  }
  function bindUpgradePreview(button,tower,next){
    const show=()=>{state.previewUpgrade={tower,definition:next};renderBoard();};
    const clear=()=>{state.previewUpgrade=null;renderBoard();};
    button.addEventListener('pointerenter',show);button.addEventListener('pointerleave',clear);button.addEventListener('focus',show);button.addEventListener('blur',clear);
  }
  function renderDeckOverview(target='deckOverview'){
    const deckKey=JSON.stringify([state.deck,state.drawPile,state.discard,uiLanguageRevision]);
    if(deckRenderKeys.get(target)===deckKey)return;
    deckRenderKeys.set(target,deckKey);
    const content=document.getElementById(target);content.innerHTML='';
    for(const [name,ids] of [['Gesamtes Deck',state.deck],['Nachziehstapel',state.drawPile],['Ablagestapel',state.discard]]){
      const section=document.createElement('section'),heading=document.createElement('h3');
      heading.textContent=`${name} (${ids.length})`;section.appendChild(heading);
      const counts=new Map();ids.forEach(id=>counts.set(id,(counts.get(id)||0)+1));
      const list=document.createElement('ul');
      if(!ids.length){const item=document.createElement('li');item.textContent='Leer';list.appendChild(item);}
      list.className='deckHexGrid';
      const entries=name==='Nachziehstapel'?[...ids].reverse().map(id=>[id,1]):counts;
      for(const [id,count] of entries){
        const item=document.createElement('li'),badge=document.createElement('span'),card=CARD_LIBRARY[id];
        item.className='deckHexCard';item.setAttribute('tabindex','0');item.setAttribute('aria-label',count+' × '+card.name+' · '+card.rarity+': '+card.desc);item.title=card.name+' · '+card.rarity+' · '+card.desc;item.innerHTML=miniPathSvg(card)+'<small>'+card.name+'</small>';
        badge.className='deckHexCount';badge.textContent='×'+count;badge.style.backgroundColor=({Common:'#939d9e',Uncommon:'#45a77a',Rare:'#639cdb',Epic:'#b181dc',Legendary:'#e4bc57'})[card.rarity];item.style.borderColor=badge.style.backgroundColor;
        item.appendChild(badge);list.appendChild(item);
      }
      section.appendChild(list);content.appendChild(section);
    }
  }
  function renderForecast(){
    const alive=state.enemies.filter(e=>e.alive&&HexCombat.durability(e)>0);
    const aliveGold=alive.reduce((sum,e)=>sum+(e.killGold??HexWaves.economy.kill),0);
    const readyBossCount=[...state.landmarks.values()].filter(item=>item.status==='ready').length;
    const forecastKey=JSON.stringify([state.wave,state.income,!!state.challengeDay,state.heroId,state.gold,state.goldEarned,state.waveRunning,state.pendingSpawns,state.waveKills,alive.length,aliveGold,alive.filter(e=>e.type==='boss').length,readyBossCount,state.selectedSlot||state.selectedTower||state.selectedBuilding,state.towerLoadout,state.buildingVersion,uiLanguageRevision]);
    if(forecastKey===forecastRenderKey)return;
    forecastRenderKey=forecastKey;
    const plan=uiWavePlan(state.wave+1);
    const boss=HexExploration.bossProfile(plan.wave),bossGold=readyBossCount*boss.killGold;
    const groups=new Map();
    plan.enemies.forEach(enemy=>{const entry=groups.get(enemy.type)||{count:0,profile:enemy};entry.count++;groups.set(enemy.type,entry);});
    const defenses=p=>`${p.hp} Leben${p.armorHp?` + ${p.armorHp} Rüstung`:''}${p.magicHp?` + ${p.magicHp} Magieresistenz`:''}`;
    document.getElementById('waveForecast').textContent='Wave '+plan.wave+': '+plan.count+' Gegner. '+[...groups.values()].map(({count,profile})=>count+' × '+profile.name+' ('+defenses(profile)+(profile.description?', '+profile.description:profile.type==='swarm'?', schnell':'')+')').join(' · ')+'. Gelb = Leben, Orange = Rüstung, Blau = Magieresistenz.';
    if(state.challengeDay)document.getElementById('waveForecast').textContent+=' 🪙 Geldtransport: Besiegen bringt 15 Gold extra. Erreicht er die Basis, verlierst du 10 Gold.';
    if(readyBossCount) document.getElementById('waveForecast').textContent+=` Zusätzlich ${readyBossCount} Wächter: je ${defenses(boss)}, ${boss.baseDamage} Basisschaden, +${boss.killGold} Gold plus Kartenbeute (90 % Epic, 10 % Legendary).`;
    if(plan.boss) document.getElementById('waveForecast').textContent+=` Bosswelle: ${plan.boss.name} mit ${defenses(plan.boss)} und ${plan.boss.baseDamage} Basisschaden an einem zufälligen Eingang. ${plan.boss.description} +${plan.boss.killGold} Gold und Kartenbeute bei Sieg.`;
    document.getElementById('goldForecast').textContent=`Maximal +${plan.maxGold+bossGold} Gold: ${plan.count} Kills inklusive Karawanenboni = ${plan.killGold}, Bossloot +${bossGold+(plan.boss?.killGold||0)}, Wave-Abschluss +${plan.completionGold}, Hex-Bonus +${plan.income}. Nur wenn alle Gegner besiegt werden und die Wave überlebt wird. Mit aktuellem Gold: maximal ${state.gold+plan.maxGold+bossGold} vor Bauausgaben und weiteren Einnahmen der laufenden Wave.`;
    const earned=state.goldEarned;
    document.getElementById('goldSources').textContent=`Startgold ${HexHeroes.hero(state.heroId).gold} · Hero-Einkommen +${HexHeroes.hero(state.heroId).income} · regulärer Gegner +${HexWaves.economy.kill} (Splittergolem: auf drei Einheiten verteilt) · pro überlebter Wave +${HexWaves.economy.completion} · Dorf +2, Handelsstraße +4, Haus zusätzlich +3 pro Wave. Im Run verdient: Kills ${earned.kills}, Abschlüsse ${earned.completion}, Hex-/Haus-/Hero-/Beuteboni ${earned.income}, Shrines ${earned.shrine||0}, Schätze ${earned.treasure||0}, Bosse ${earned.boss||0}. Undo erstattet nur den Kaufpreis, erzeugt kein Einkommen.`;
    const remainingGold=uiWavePlan(state.wave).enemies.slice(-state.pendingSpawns||Infinity).reduce((sum,e)=>sum+(e.killGold??HexWaves.economy.kill),0)+aliveGold+HexWaves.economy.completion+state.income;
    document.getElementById('liveWaveInfo').textContent=state.waveRunning?`Laufende Wave ${state.wave}: ${state.pendingSpawns} Gegner kommen noch, ${alive.length} sind auf der Map (davon ${alive.filter(e=>e.type==='boss').length} Wächter), ${state.waveKills} normale Gegner besiegt. Noch maximal +${remainingGold} Gold bis Wave-Ende.`:'Vor dem Platzieren des Hexes ist der Einkommensbonus vorläufig; danach wird er aktualisiert.';
    const budgetSlot=state.selectedSlot||state.selectedTower||state.selectedBuilding;
    document.getElementById('towerBudget').textContent=(budgetSlot?'Preise am ausgewählten Hex: ':'Loadoutpreise: ')+state.towerLoadout.map(id=>TOWERS[id]).filter(Boolean).map(t=>{const price=HexBuildings.cost(state,budgetSlot,t.cost);return t.name+': '+price+' Gold'+(state.gold<price?' (noch '+(price-state.gold)+' nötig)':' (bezahlbar)');}).join(' · ');

  }
  function renderAll(){renderBoard();renderUI();}
  const buildingPosition=HexMap.buildingPosition;
  function towerStatsMarkup(def){
    const chip=(icon,value,label)=>'<span class="statChip" title="'+label+'" aria-label="'+label+': '+value+'"><span aria-hidden="true">'+icon+'</span> '+value+'</span>';
    const m=def.damageMultipliers||{hp:1,armor:1,magic:1};let parts=[];
    if(def.aura)parts.push(chip('❄',Math.round((1-def.slow)*100)+'%','Verlangsamung'));
    else parts.push(chip('♥',Math.round(def.damage*m.hp),'Schaden gegen Leben'),chip('⬟',Math.round(def.damage*m.armor),'Schaden gegen Rüstung'),chip('✦',Math.round(def.damage*m.magic),'Schaden gegen Magieresistenz'));
    parts.push(chip('◎',def.range,'Reichweite'));if(!def.aura)parts.push(chip('◷',def.cooldown.toFixed(2)+' s',def.mine?'Zeit zwischen Minen':'Zeit zwischen Angriffen (kleiner ist schneller)'));
    if(def.splash)parts.push(chip('✹',def.splash,'Explosionsradius'));if(def.chain)parts.push(chip('ϟ',def.chain+' / '+def.jumpRange,'Blitzziele / Sprungweite'));if(def.pierce)parts.push(chip('➶',def.pierceTargets,'Durchschlagziele'));
    if(def.hitSlow)parts.push(chip('❄',Math.round((1-def.hitSlow)*100)+'% / '+def.slowDuration+' s','Verlangsamung / Dauer'));
    if(def.soulLimit)parts.push(chip('☽',def.soulLimit,'Maximale Geister'),chip('⚔',Math.round(def.soulDamage)+'/s','Geisterschaden'),chip('⌛',def.soulDuration+' s','Geisterlebensdauer'));
    return '<span class="statChips">'+parts.join('')+'</span>';
  }
  function towerStats(def){
    if(def.aura)return `Slow ${Math.round((1-def.slow)*100)} % · Radius ${def.range} · kein Schaden`;
    const m=def.damageMultipliers||{hp:1,armor:1,magic:1},values=`Schaden gegen: ${Math.round(def.damage*m.hp)} Leben / ${Math.round(def.damage*m.armor)} Rüstung / ${Math.round(def.damage*m.magic)} Magieresistenz`;
    return `${values} · ${def.mine?'legt alle '+def.cooldown.toFixed(2)+' s eine stapelbare Mine':def.cooldown.toFixed(2)+' s je Angriff'} · Reichweite ${def.range}${def.soulLimit?` · bis zu ${def.soulLimit} Geister: ${Math.round(def.soulDamage)} Schaden/s, ${def.soulDuration} s`:''}${def.hitSlow?` · ${Math.round((1-def.hitSlow)*100)} % Slow für ${def.slowDuration} s`:''}${def.splash?` · Explosion ${def.splash}`:''}${def.chain?` · ${def.chain} Ziele · Sprungdistanz ${def.jumpRange}`:''}`;
  }
  function finishTutorial(){tutorial.active=false;tutorialSeen=true;try{localStorage.setItem('tutorial-v1','done');}catch{}}
  function tutorialEvent(event,type){if(HexTutorial.advance(tutorial,event,type))finishTutorial();}
  function renderTutorial(){
    const active=tutorial.active&&!['gameover','victory'].includes(state.phase);
    messageEl.classList.toggle('tutorialActive',active);document.getElementById('messageText').classList.toggle('hidden',active);
    document.getElementById('tutorialPanel').classList.toggle('hidden',!active);
    document.getElementById('tutorialTitle').textContent='Erste Schritte · '+(tutorial.step+1)+'/'+HexTutorial.steps.length;
    document.getElementById('tutorialText').textContent=state.openingRemaining?'Erweitere beide Base-Ausgänge: Wähle eine Handkarte, drehe sie mit R oder Mausrad-Klick und lege sie direkt an einen noch freien Ausgang.':HexTutorial.message(tutorial);
    document.getElementById('tutorialNextBtn').classList.toggle('hidden',!active||!(tutorial.step===5||tutorial.step===4&&tutorial.alternativeTower));
    if(!active)document.getElementById('tutorialFeedback').classList.add('hidden');
    positionTutorialSpotlight();
  }
  function positionTutorialSpotlight(){
    renderTutorialTargets();
    const focus=tutorial.active&&!['gameover','victory'].includes(state.phase)?({5:'healthStat',6:'startWaveBtn'})[tutorial.step]:null;
    const spotlight=document.getElementById('tutorialSpotlight'),target=focus&&document.getElementById(focus),box=target?.getBoundingClientRect?.();
    spotlight.classList.toggle('hidden',!box);if(!box)return;
    Object.assign(spotlight.style,{left:(box.left-4)+'px',top:(box.top-4)+'px',width:(box.width+8)+'px',height:(box.height+8)+'px'});
  }
  function renderTutorialTargets(){
    const layer=document.getElementById('tutorialTargets'),active=tutorial.active&&!['gameover','victory'].includes(state.phase);
    for(const [id,button] of towerButtons)button.classList.toggle('tutorialChoice',active&&tutorial.step===3&&id==='archer');
    const selected=state.selectedTower,selectedTower=selected&&state.map.get(key(selected.q,selected.r))?.towers[selected.index];
    for(const [id,button] of upgradeButtons)button.classList.toggle('tutorialChoice',active&&tutorial.step===4&&selectedTower?.type==='archer'&&id==='volley');
    layer.classList.toggle('hidden',!active||tutorial.step>=5);if(!active)return;
    if(tutorial.step===5&&globalThis.HexCompact?.small()&&document.documentElement.dataset.compact!=='stats')globalThis.HexCompact.open('stats');
    if(tutorial.step>=5||!document.querySelector)return;
    const boxes=[],circles=[],polygons=[],board=document.querySelector('.boardWrap')?.getBoundingClientRect();
    const addBox=selector=>{const b=document.querySelector(selector)?.getBoundingClientRect();if(b?.width&&b.height)boxes.push(b);};
    const point=(position,r=25)=>{const p=renderer.project(position,2);if(p&&board)circles.push({x:p.x+board.left,y:p.y+board.top,r});};
    if(tutorial.step===0)addBox('.handDock');
    if(tutorial.step===1){const card=HexPlacementCommands.card(state,state.hand[state.selectedCard]);if(card&&board)for(const p of placementTargets(card))if(canPlace(p.q,p.r,card,state.rotation)){const c=axialToWorld(p.q,p.r),corners=HexMap.hexPoints(c.x,c.y,HEX-2).split(' ').map(pair=>{const [x,y]=pair.split(',').map(Number);return renderer.project({x,y},2);});if(corners.every(Boolean))polygons.push(corners.map(p=>(p.x+board.left)+','+(p.y+board.top)).join(' '));}if(!polygons.length)addBox('.handDock');}
    if(tutorial.step===2)for(const t of state.map.values())slotPositions(t).forEach((p,i)=>{if(!t.towers[i])point(p);});
    if(tutorial.step===3){addBox('#towerDrawer:not(.hidden)');addBox('[data-drawer="towerDrawer"]');}
    if(tutorial.step===4){addBox('#towerPanel:not(.hidden)');for(const t of state.map.values())slotPositions(t).forEach((p,i)=>{if(!t.towers[i]||!board)return;const bounds=renderer.towerBounds?.({q:t.q,r:t.r,index:i});if(bounds)boxes.push({left:bounds.left+board.left,top:bounds.top+board.top,width:bounds.width,height:bounds.height});else{const base=renderer.project(p,0),top=renderer.project(p,65);if(base&&top)boxes.push({left:Math.min(base.x,top.x)+board.left-24,top:Math.min(base.y,top.y)+board.top-24,width:Math.abs(base.x-top.x)+48,height:Math.abs(base.y-top.y)+48});}});}
    const shapes=[...boxes.map(b=>'<rect x="'+(b.left-4)+'" y="'+(b.top-4)+'" width="'+(b.width+8)+'" height="'+(b.height+8)+'" rx="10"/>'),...circles.map(c=>'<circle cx="'+c.x+'" cy="'+c.y+'" r="'+c.r+'"/>'),...polygons.map(points=>'<polygon points="'+points+'"/>')].join('');
    layer.innerHTML='<svg xmlns="http://www.w3.org/2000/svg"><defs><mask id="tutorialFocusMask"><rect width="100%" height="100%" fill="white"/><g fill="black">'+shapes+'</g></mask></defs><rect width="100%" height="100%" fill="#0c1411" opacity=".42" mask="url(#tutorialFocusMask)"/><g fill="none" stroke="#ffe198" stroke-width="3">'+shapes+'</g></svg>';
  }
  function menuArea(includeTutorial=true){
    if(!document.querySelectorAll||!document.documentElement)return null;
    const width=document.documentElement.clientWidth,height=document.documentElement.clientHeight;
    const controls=[...document.querySelectorAll('.compactToolbar,.dockTL,.hud,.dockBR,.dockBL,.mapControls,.handDock')].map(el=>el.getBoundingClientRect());
    const area=height<560?HexUiLayout.freeArea(width,height,controls):HexUiLayout.safeArea(width,height,controls);
    const leftRail=document.getElementById('quickLoadout').getBoundingClientRect(),rightRail=document.getElementById('biomeRail').getBoundingClientRect();
    if(leftRail.width)area.left=Math.max(area.left,leftRail.right+10);if(rightRail.width)area.right=Math.min(area.right,rightRail.left-10);
    if(includeTutorial&&tutorial.active&&state.phase!=='gameover'){const hint=messageEl.getBoundingClientRect();area.top=Math.min(area.bottom,Math.max(area.top,hint.bottom+12));}
    return area;
  }
  function fitMenu(panel,area,x,y){
    panel.style.position='fixed';panel.style.right='auto';panel.style.bottom='auto';
    panel.style.maxHeight=Math.max(0,area.bottom-area.top)+'px';panel.style.maxWidth=Math.max(0,area.right-area.left)+'px';
    const box=panel.getBoundingClientRect(),fit=HexUiLayout.fit(area,box.width,box.height,x??box.left,y??area.top);
    panel.style.left=fit.x+'px';panel.style.top=fit.y+'px';
  }
  function measureChrome(){
    if(!document.documentElement?.style?.setProperty||!document.querySelector)return;
    const rect=selector=>document.querySelector(selector)?.getBoundingClientRect(),header=rect('.gameHeader'),footer=rect('.dockBR'),hand=rect('.handDock');if(!header||!footer)return;
    const root=document.documentElement,compact=root.clientWidth<=1000,tools=compact?Math.max(header.bottom,rect('.dockBL')?.bottom||0,rect('.mapControls')?.bottom||0):header.bottom;
    for(const [name,value] of Object.entries({'--header-bottom':header.bottom,'--footer-height':footer.height,'--play-top':tools,'--play-bottom':Math.max(root.clientHeight-footer.top,hand?root.clientHeight-hand.top:0)})){const next=Math.ceil(value)+'px';if(root.style.getPropertyValue(name)!==next)root.style.setProperty(name,next);}
  }
  function layoutMenus(){
    measureChrome();positionTutorialSpotlight();const raw=menuArea(false);if(!raw)return;
    messageEl.style.position='fixed';messageEl.style.left=((raw.left+raw.right)/2)+'px';messageEl.style.top=raw.top+'px';messageEl.style.bottom='auto';messageEl.style.maxHeight=(tutorial.active?Math.max(120,Math.min(280,document.documentElement.clientHeight-180)):Math.max(0,Math.min(240,(raw.bottom-raw.top)*.65)))+'px';if(document.documentElement.style?.setProperty)document.documentElement.style.setProperty('--tutorial-bottom',messageEl.getBoundingClientRect().bottom+'px');
    const area=menuArea();for(const panel of document.querySelectorAll('.towerPanel:not(.hidden),.drawer:not(.hidden)'))fitMenu(panel,area);
    if(state.selectedTower||state.selectedBuilding)positionTowerPanel();
    for(const panel of document.querySelectorAll('.statDetails[open]>.statPopup')){const anchor=panel.parentElement.getBoundingClientRect();fitMenu(panel,raw,anchor.right-(panel.offsetWidth||380),anchor.bottom+12);}
  }
  function positionTowerPanel(){
    if(!state.selectedTower&&!state.selectedBuilding)return;
    const panel=document.getElementById(state.selectedTower?'towerPanel':'buildingPanel'),area=menuArea();
    if(area){const narrow=document.documentElement.clientWidth<=700;fitMenu(panel,area,area.left,narrow?area.bottom-panel.getBoundingClientRect().height:area.top);}
  }
  function renderBuildingPanel(){
    const panel=document.getElementById('buildingPanel'),selected=state.selectedBuilding,tile=selected?state.map.get(key(selected.q,selected.r)):null;
    if(!tile){panel.classList.add('hidden');buildingPanelKey='';return;}
    panel.classList.remove('hidden');const building=tile.buildings?.[selected.index];
    document.getElementById('buildingPanelTitle').textContent=building?HexBuildings.definitions[building.type].name+' · Stufe '+(building.special?4:building.level||1):(tile.type==='deadEnd'?'Gegnerportal-Platz':'Gebäudeslot');
    document.getElementById('buildingPanelInfo').textContent=`${CARD_LIBRARY[tile.type]?.name||'Hex'}: automatisch +${tile.income||0} Gold je überlebter Wave. ${building?HexBuildings.definition(building,state).desc:tile.type==='deadEnd'?HexBuildings.definitions.portal.desc:'Optional einen Gebäudetyp bauen. Haus: zusätzliches Einkommen, Schmiede: Tower-Schaden, Markt: Tower-Rabatte. Ein Gebäude pro Slot.'}`;
    const panelKey=JSON.stringify([selected,building,state.map.size,state.buildingVersion]);
    const buildingChanged=buildingPanelKey!==panelKey;
    if(buildingChanged){
      buildingPanelKey=panelKey;panel._targetButton=null;buildingButtons.clear();const content=document.getElementById('buildingOptions');content.innerHTML='';
      if(!building) for(const [type,definition] of Object.entries(HexBuildings.definitions).filter(([type])=>HexBuildings.allowedTypes(tile).includes(type))){
        const button=document.createElement('button');button.className='upgradeOption';const blocked=HexBuildings.buildBlockReason(tile,type);button.title=blocked||'Kräftig: aktueller Wirkbereich. Blass: Versorgung durch andere Gebäude desselben Typs.';button.innerHTML=`<strong>${definition.name} · ${definition.cost} Gold</strong><small>${definition.desc}</small>${blocked?'<small class="buildBlockedReason">🔒 '+blocked+'</small>':''}`;
        const preview=()=>{if(HexBuildings.buildBlockReason(tile,type))return;state.previewBuilding={...selected,type};renderBoard();},clear=()=>{state.previewBuilding=null;renderBoard();};
        button.addEventListener('pointerenter',preview);button.addEventListener('pointerleave',clear);button.addEventListener('focus',preview);button.addEventListener('blur',clear);
        button.addEventListener('click',()=>{state.previewBuilding=null;if(HexBuildings.buy(state,state.selectedBuilding,type)){sound.play('build');renderAll();}});content.appendChild(button);buildingButtons.set(type,button);
      }
    }
    if(building&&buildingChanged){const content=document.getElementById('buildingOptions');content.innerHTML='';const next=HexBuildings.nextUpgrade(state,building);
      if(next){const button=document.createElement('button');button.className='upgradeOption';button._cost=next.cost;buildingButtons.set('upgrade',button);const after=HexBuildings.definition({...building,level:(building.level||1)+1});button.textContent=(next.name||'Ausbauen')+' · '+next.cost+' Gold · '+(next.desc||after.desc);button.disabled=state.gold<next.cost||state.hp<=0||!['place','build','wave'].includes(state.phase);button.addEventListener('click',()=>{if(HexBuildings.upgrade(state,state.selectedBuilding))renderAll();});content.appendChild(button);}
      else if((building.level||1)===3&&!building.special&&HexBuildings.specials[building.type]){const hint=document.createElement('p');hint.textContent='Spezialausbau im Arsenal für 40 Diamanten freischalten. Ab dem nächsten Run verfügbar.';content.appendChild(hint);}
      if(building.special&&building.type!=='house'){const choose=document.createElement('button');panel._targetButton=choose;choose.textContent=state.buildingTarget?'Hex auf der Map anklicken · Abbrechen':(building.target?'Zusatz-Hex ändern':'Zusatz-Hex auf der Map auswählen');choose.title=building.target?'Aktuelles Zusatzhex: '+building.target+' · kräftig markiert':'Zusatzhex auswählen';choose.addEventListener('pointerenter',()=>renderBoard());choose.addEventListener('focus',()=>renderBoard());choose.disabled=state.hp<=0||!['place','build','wave'].includes(state.phase);choose.addEventListener('click',()=>{state.buildingTarget=state.buildingTarget?null:{...state.selectedBuilding};state.selectedBuilding=null;setMessage('Zusatzwirkung: ein erkundetes Hex anklicken · Escape: abbrechen');renderAll();});content.appendChild(choose);}
    }
    if(panel._targetButton)panel._targetButton.disabled=state.hp<=0||!['place','build','wave'].includes(state.phase);
    for(const [type,button] of buildingButtons) button.disabled=!!HexBuildings.buildBlockReason(tile,type)||(type==='portal'&&(!['place','build'].includes(state.phase)||state.waveRunning))||!['place','build','wave'].includes(state.phase)||state.hp<=0||state.gold<(button._cost||HexBuildings.definitions[type].cost);
    const sell=document.getElementById('sellBuildingBtn'),refund=HexBuildings.refund(state,building);sell.disabled=!refund;sell.textContent=refund?`Verkaufen · ${refund.percent} % (+${refund.amount} Gold)`:'Gebäude verkaufen';
    positionTowerPanel();
  }
  function renderTowerPanel(){
    const panel=document.getElementById('towerPanel'),selected=state.selectedTower,tower=selected?state.map.get(key(selected.q,selected.r))?.towers[selected.index]:null;
    if(!tower){panel.classList.add('hidden');towerPanelKey='';return;}
    panel.classList.remove('hidden');document.getElementById('towerPanelTitle').textContent=`${HexData.towerDefinition(tower).name} · Stufe ${tower.level}`;
    const selectedTowers=selections('Tower').map(s=>state.map.get(key(s.q,s.r))?.towers[s.index]).filter(Boolean),group=selectedTowers.length>1;
    if(group){document.getElementById('towerPanelTitle').textContent=selectedTowers.length+' Türme ausgewählt';document.getElementById('selectedTowerInfo').textContent='Angriffsfokus gemeinsam einstellen · Strg + Klick: Auswahl ändern';}
    const panelKey=JSON.stringify([selections('Tower'),tower.branch,tower.finalUpgrade,tower.ultimate,tower.supportDamage,state.buildingVersion]);
    if(towerPanelKey!==panelKey){
      towerPanelKey=panelKey;upgradeButtons.clear();const content=document.getElementById('towerUpgrades');content.innerHTML='';
      const definition=HexData.towerDefinition(tower);
      const targetable=selectedTowers.filter(t=>{const d=HexData.towerDefinition(t);return !d.aura&&!d.mine;});
      if(targetable.length){
        const tower=targetable[0];
        const labels={closestBase:'Nächste an der Base',furthestBase:'Weiteste von der Base',mostHealth:'Meistes Leben',leastHealth:'Wenigstes Leben',mostArmor:'Meiste Rüstung',mostMagic:'Meiste Magieresistenz',boss:'Bosse',healer:'Heiler',closestTower:'Nächste am Turm',furthestTower:'Weiteste vom Turm'},defaults=['closestBase','mostHealth','boss'];
        tower.targetPriority=[...new Set(tower.targetPriority||defaults)];for(const value of defaults)if(tower.targetPriority.length<3&&!tower.targetPriority.includes(value))tower.targetPriority.push(value);tower.targetPriority=tower.targetPriority.slice(0,3);
        const targeting=document.createElement('section');targeting.className='targetPriorities';targeting.innerHTML='<strong>Angriffsfokus</strong><small>Priorität 1 wird zuerst geprüft. Gibt es dafür kein gültiges Ziel, folgt die nächste Zeile.</small>';
        tower.targetPriority.forEach((value,index)=>{const row=document.createElement('label');row.textContent=`${index+1}.`;const select=document.createElement('select');select.setAttribute('aria-label','Angriffsfokus Priorität '+(index+1));const mixed=targetable.some(t=>(t.targetPriority||defaults)[index]!==value);if(mixed){const option=document.createElement('option');option.value='';option.textContent='Unterschiedliche Einstellungen';option.disabled=true;option.selected=true;select.appendChild(option);}for(const [id,label] of Object.entries(labels)){const option=document.createElement('option');option.value=id;option.textContent=label;option.selected=!mixed&&id===value;select.appendChild(option);}select.addEventListener('change',()=>{for(const target of targetable){target.targetPriority=[...(target.targetPriority||defaults)];const old=target.targetPriority[index],other=target.targetPriority.indexOf(select.value);target.targetPriority[index]=select.value;if(other>=0&&other!==index)target.targetPriority[other]=old;}towerPanelKey='';renderAll();});row.appendChild(select);targeting.appendChild(row);});content.appendChild(targeting);
      }
      if(group){const hint=document.createElement('p');hint.className='hint';hint.textContent='Änderungen gelten für '+targetable.length+' Türme mit Angriffsfokus. Unterschiedliche bisherige Einstellungen werden durch die Auswahl je Zeile angepasst. Support und Minenleger bleiben unverändert. Upgrades und Verkauf: einzelnen Turm auswählen.';content.appendChild(hint);}
      else if(tower.ultimate){const hint=document.createElement('p');hint.className='hint';hint.textContent='Meta-Stufe 4 erreicht.';content.appendChild(hint);}
      else if(tower.finalUpgrade){
        const id='ultimate:'+tower.type,upgrade=HexData.ultimateDefinition(tower),unlocked=HexData.ultimateAvailable(state,tower);
        if(!unlocked){const hint=document.createElement('p');hint.className='ultimateLocked';hint.textContent=`🔒 ${upgrade.name}: im Arsenal freischalten und für den nächsten Run aktivieren.`;content.appendChild(hint);}
        else{const current=HexData.towerDefinition(tower),next=HexData.towerDefinition({...tower,ultimate:tower.type}),button=document.createElement('button'),price=HexBuildings.cost(state,selected,upgrade.cost);button.className='upgradeOption ultimateOption';button.innerHTML=`<strong>◆ ${upgrade.name} · ${price} Gold</strong><small>${upgrade.desc}</small><small>${towerStatsMarkup(current)}</small><small>Danach: ${towerStatsMarkup(next)}</small>`;bindUpgradePreview(button,tower,next);button.addEventListener('click',()=>upgradeSelectedTower(id));button._baseCost=upgrade.cost;content.appendChild(button);upgradeButtons.set(id,button);}
      } else for(const [branch,upgrade] of HexData.availableUpgrades(tower)){
        const current=HexData.towerDefinition(tower),next=HexData.towerDefinition({...tower,...(upgrade.requires?{finalUpgrade:branch}:{branch})}),button=document.createElement('button');
        button.className='upgradeOption';
        const price=HexBuildings.cost(state,selected,upgrade.cost);
        button.innerHTML=`<strong>${upgrade.name} · ${price} Gold</strong><small>${upgrade.desc}</small><small>${towerStatsMarkup(current)}</small><small>Danach: ${towerStatsMarkup(next)}</small>`;
        if(current.aura) button.innerHTML=`<strong>${upgrade.name} · ${price} Gold</strong><small>${upgrade.desc}</small><small>Slow ${Math.round((1-current.slow)*100)} → ${Math.round((1-next.slow)*100)} % · Radius ${current.range} → ${next.range}</small>`;
        bindUpgradePreview(button,tower,next);button.addEventListener('click',()=>upgradeSelectedTower(branch));button._baseCost=upgrade.cost;content.appendChild(button);upgradeButtons.set(branch,button);
      }
    }
    for(const [,button] of upgradeButtons) button.disabled=!['place','build','wave'].includes(state.phase)||state.gold<HexBuildings.cost(state,selected,button._baseCost)||state.hp<=0;
    positionTowerPanel();
  }
  function setMessage(s,notice=false){const feedback=document.getElementById('tutorialFeedback');feedback.textContent=notice?s:'';feedback.classList.toggle('hidden',!notice||!tutorial.active);document.getElementById('messageText').textContent=s;messageEl.classList.remove('show');void messageEl.offsetWidth;messageEl.classList.add('show');}

  function rotateSelected(direction=1){
    if(state.phase!=='place'||!state.hand[state.selectedCard]) return false;
    state.rotation=(state.rotation+direction+6)%6;tutorialEvent('rotate'); renderAll();return true;
  }

  const quickButtons=new Map(),biomeButtons=new Map();let quickKey='',biomeKey='',quickPointer=null,pinnedBiome=null;
  function canQuickBuild(){return ['place','build','wave'].includes(state.phase)&&state.hp>0;}
  function quickBuildOffer(type,discount=HexBuildings.freeSlotDiscount(state.map)){
    const price=Math.ceil(TOWERS[type].cost*discount);
    return {price,available:Number.isFinite(price),affordable:state.gold>=price};
  }
  function cancelQuickTower(){
    quickPointer=null;if(state){state.dragTower=null;state.dragSlot=null;}
    document.getElementById('towerDragGhost').classList.add('hidden');document.getElementById('towerDragShade').classList.add('hidden');
  }
  function armQuickTower(type){
    if(!canQuickBuild()||!state.towerLoadout.includes(type)||!quickBuildOffer(type).affordable)return false;
    state.dragTower=type;state.dragSlot=null;state.previewTower=null;
    document.getElementById('towerDrawer').classList.add('hidden');
    setMessage(TOWERS[type].name+': auf einen freien Turmplatz ziehen oder tippen · Escape: abbrechen');renderAll();return true;
  }
  function dropQuickTower(type,slot){
    cancelQuickTower();
    const tile=slot&&state.map.get(key(slot.q,slot.r));
    if(!canQuickBuild()||!state.towerLoadout.includes(type)||!tile||!Number.isInteger(slot.index)||slot.index<0||slot.index>=tile.slots||tile.towers[slot.index]){renderAll();return false;}
    const price=HexBuildings.cost(state,slot,TOWERS[type].cost);
    if(state.gold<price){setMessage('Nicht genug Gold: '+price+' Gold für diesen Platz.');renderAll();return false;}
    state.selectedSlots=[slot];state.selectedSlot=slot;state.selectedTower=null;state.selectedBuilding=null;
    tutorialEvent('slot');buyTower(type);return !!tile.towers[slot.index];
  }
  function screenSlots(){
    const result=[];for(const tile of state.map.values())slotPositions(tile).forEach((position,index)=>{if(tile.towers[index])return;const screen=renderer.project(position,2);if(screen)result.push({q:tile.q,r:tile.r,index,...screen});});return result;
  }
  function quickSlotAt(event){
    const under=document.elementFromPoint?.(event.clientX,event.clientY);if(under?.closest?.('button,nav,.drawer,.towerPanel,.hud,.handDock,.overlay'))return null;
    if(renderer.pickSlot)return renderer.pickSlot(event);
    const box=document.querySelector?.('.boardWrap')?.getBoundingClientRect();if(!box)return null;
    return HexUiLayout.pickScreenSlot(screenSlots(),event.clientX-box.left,event.clientY-box.top,box.width,box.height);
  }
  function renderDragShade(){
    const shade=document.getElementById('towerDragShade');shade.classList.toggle('hidden',!state.dragTower);if(!state.dragTower)return;
    const slots=screenSlots(),box=document.querySelector?.('.boardWrap')?.getBoundingClientRect();if(!box)return;
    shade.style.left=box.left+'px';shade.style.top=box.top+'px';shade.style.width=box.width+'px';shade.style.height=box.height+'px';
    // Keep the targets as HTML overlays: their visibility does not depend on SVG masks,
    // GPU depth, optional slot hints or the terrain render pass.
    const radius=HexUiLayout.dropRadius;
    const circles=slots.map(s=>'<circle cx="'+s.x+'" cy="'+s.y+'" r="'+radius+'" fill="black"/>').join('');
    const mask='<svg class="dragMapVeil" viewBox="0 0 '+box.width+' '+box.height+'" preserveAspectRatio="none"><defs><mask id="freeSlotMask" maskUnits="userSpaceOnUse" x="0" y="0" width="'+box.width+'" height="'+box.height+'"><rect width="100%" height="100%" fill="white"/>'+circles+'</mask></defs><rect width="100%" height="100%" fill="#202b30" fill-opacity=".42" mask="url(#freeSlotMask)"/></svg>';
    shade.innerHTML=mask+slots.map(s=>{
      const active=state.dragSlot&&s.q===state.dragSlot.q&&s.r===state.dragSlot.r&&s.index===state.dragSlot.index,price=HexBuildings.cost(state,s,TOWERS[state.dragTower].cost),affordable=state.gold>=price;
      return '<span class="dragBuildTarget'+(active?' active':'')+(affordable?'':' unaffordable')+'" data-slot="'+s.q+','+s.r+','+s.index+'" style="left:'+s.x+'px;top:'+s.y+'px;width:'+radius*2+'px;height:'+radius*2+'px"><span>'+(affordable?'+':'×')+'</span></span>';
    }).join('');
  }

  // Acknowledgement belongs to this run, not the browser profile.
  function dismissBiomeIntro(){if(!HexBiomes.acknowledgeIntro(state))return;document.getElementById('biomeIntro').classList.add('hidden');renderAll();}
  document.getElementById('biomeIntroClose').addEventListener('click',dismissBiomeIntro);
  function renderBiomeIntroDetails(){
    const ids=HexBiomes.introIds(state),active=state.highlightBiome||pinnedBiome;
    document.getElementById('biomeIntroTitle').textContent=ids.length>1?'Neue Biome entdeckt':'Neues Biom entdeckt';
    const detail=document.getElementById('biomeIntroDetail');detail.textContent=active?HexBiomes.definitions[active].name+': '+HexBiomes.definitions[active].description:ids.map(id=>HexBiomes.definitions[id].name).join('\n');
  }
  function showBiomeHighlight(id){state.highlightBiome=id;renderBiomeIntroDetails();renderBoard();}
  function renderQuickControls(){
    if(state.dragTower&&(state.hp<=0||state.phase==='gameover'))cancelQuickTower();
    const rail=document.getElementById('quickLoadout'),next=state.towerLoadout.join('|');
    if(quickKey!==next){quickKey=next;rail.innerHTML='';quickButtons.clear();for(const type of state.towerLoadout){
      const def=TOWERS[type],button=document.createElement('button');button.className='quickTower';button.setAttribute('aria-label',def.name+' bauen');button.title=def.name+' · Ziehen oder anklicken, dann Bauplatz wählen';button.innerHTML=HexArsenal.icon(type,def.color)+'<small>'+def.cost+' 🪙</small>';
      button.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();if(!armQuickTower(type))return;quickPointer={id:e.pointerId,type,x:e.clientX,y:e.clientY,moved:false};button.setPointerCapture?.(e.pointerId);});
      button.addEventListener('click',e=>{if(e.detail===0)armQuickTower(type);});button.addEventListener('lostpointercapture',()=>{if(quickPointer){if(canQuickBuild()||state.hp<=0)cancelQuickTower();else{quickPointer=null;document.getElementById('towerDragGhost').classList.add('hidden');}renderAll();}});rail.appendChild(button);quickButtons.set(type,button);
    }}
    const quickDiscount=HexBuildings.freeSlotDiscount(state.map);
    for(const [type,button] of quickButtons){const offer=quickBuildOffer(type,quickDiscount);button.disabled=!canQuickBuild()||!offer.affordable;button.classList.toggle('unaffordable',offer.available&&!offer.affordable);button.classList.toggle('active',state.dragTower===type);button.setAttribute('aria-pressed',String(state.dragTower===type));
      const price=offer.available?offer.price:TOWERS[type].cost,label=(price<TOWERS[type].cost?'ab ':'')+price+' 🪙';if(button._priceLabel!==label){button._priceLabel=label;button.innerHTML=HexArsenal.icon(type,TOWERS[type].color)+'<small>'+label+'</small>';}
      button.title=TOWERS[type].name+' · '+(!offer.available?'Kein freier Turmplatz':!offer.affordable?'Nicht genug Gold · mindestens '+price+' Gold nötig':'Ziehen oder anklicken, dann Bauplatz wählen · Preis je nach Marktrabatt');
    }
    const discovered=new Set(HexBiomes.visibleTiles(state).map(t=>HexBiomes.forTile(state,t))),ids=['grass','desert','ash','storm'].filter(id=>discovered.has(id)),key=ids.join('|'),biomes=document.getElementById('biomeRail');
    if(!HexBiomes.introIds(state).length)state.biomeIntro=null;
    if(!HexBiomes.introAcknowledged(state)&&!state.biomeIntro&&mainMenu.classList.contains('hidden')&&!['gameover','victory'].includes(state.phase)){const first=ids.filter(id=>id!=='grass');if(first.length){state.biomeIntro=first;if(globalThis.HexCompact?.small())globalThis.HexCompact.open('biomes');renderBoard();}}
    document.getElementById('biomeIntro').classList.toggle('hidden',!state.biomeIntro||!mainMenu.classList.contains('hidden'));renderBiomeIntroDetails();
    if(key!==biomeKey){biomeKey=key;biomes.innerHTML='';biomeButtons.clear();for(const id of ids){const def=HexBiomes.definitions[id],button=document.createElement('button');button.className='biomeIcon';button.style.borderColor=def.color;button.setAttribute('aria-label',def.name+': '+def.description);button.innerHTML='<span aria-hidden="true">'+({grass:'♧',desert:'☀',ash:'♨',storm:'≋'})[id]+'</span><span class="biomeTooltip"><strong>'+def.name+'</strong><small>'+def.description+'</small></span>';
      button.addEventListener('pointerenter',()=>showBiomeHighlight(id));button.addEventListener('pointerleave',()=>showBiomeHighlight(pinnedBiome));button.addEventListener('focus',()=>showBiomeHighlight(id));button.addEventListener('blur',()=>showBiomeHighlight(pinnedBiome));button.addEventListener('click',()=>{pinnedBiome=pinnedBiome===id?null:id;showBiomeHighlight(pinnedBiome);renderQuickControls();});biomes.appendChild(button);biomeButtons.set(id,button);
    }}for(const [id,button] of biomeButtons){button.classList.toggle('biomeIntroTarget',HexBiomes.introIds(state).includes(id));button.classList.toggle('active',pinnedBiome===id);button.setAttribute('aria-pressed',String(pinnedBiome===id));}
  }
  document.addEventListener('pointerdown',e=>{if(e.button!==0)return;dismissTransientPanels(e);if(!state?.dragTower||quickPointer||e.target?.closest?.('#rewardOverlay,#celebration,#campaignVictory'))return;if(e.target?.closest?.('.loadoutRail'))return;if(!quickSlotAt(e)){cancelQuickTower();renderAll();}},true);
  document.addEventListener('pointermove',e=>{if(!quickPointer||e.pointerId!==quickPointer.id)return;quickPointer.moved ||= Math.hypot(e.clientX-quickPointer.x,e.clientY-quickPointer.y)>5;state.dragSlot=quickSlotAt(e);const ghost=document.getElementById('towerDragGhost');ghost.classList.remove('hidden');ghost.style.left=(e.clientX+18)+'px';ghost.style.top=(e.clientY-22)+'px';const price=HexBuildings.cost(state,state.dragSlot,TOWERS[quickPointer.type].cost);ghost.innerHTML=HexArsenal.icon(quickPointer.type,TOWERS[quickPointer.type].color)+'<small>'+price+' 🪙</small>';renderBoard();});
  document.addEventListener('pointerup',e=>{if(!quickPointer||e.pointerId!==quickPointer.id)return;if(!canQuickBuild()){quickPointer=null;document.getElementById('towerDragGhost').classList.add('hidden');return;}const drag=quickPointer,slot=quickSlotAt(e);quickPointer=null;document.getElementById('towerDragGhost').classList.add('hidden');if(slot)dropQuickTower(drag.type,slot);else if(drag.moved){cancelQuickTower();renderAll();}});
  document.addEventListener('pointercancel',()=>{if(state.dragTower&&!canQuickBuild()&&state.hp>0&&state.phase!=='gameover'){quickPointer=null;document.getElementById('towerDragGhost').classList.add('hidden');}else cancelQuickTower();renderAll();});
  globalThis.addEventListener?.('blur',()=>{cancelQuickTower();renderAll();});

  document.addEventListener('click',event=>{if(event.button===0)dismissBiomeInfoOutside(event);},true);
  function inspectBiome(id){const def=HexBiomes.definitions[id];if(!def)return;document.getElementById('biomeInfoTitle').textContent=def.name;document.getElementById('biomeInfoText').textContent=def.description;document.getElementById('biomeInfoPanel').classList.remove('hidden');}
  function newRun(loadout=profile.activeLoadout,heroId=profile.activeHero,difficulty=profile.difficulty||'normal',challengeDay=null){
    closeSale();document.getElementById('biomeInfoPanel').classList.add('hidden');
    cancelQuickTower();if(state)state.highlightBiome=null;pinnedBiome=null;
    clearRunTimers();inspectReward('selection');document.getElementById('celebration').classList.add('hidden');
    handRenderKey=forecastRenderKey='';deckRenderKeys.clear();uiWavePlans.clear();
    towerMenuKey='';renderer.reset();
    document.getElementById('deckDropdown').open=false;
    rewardOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');gameOverOverlay.classList.remove('inspectEndMap');
    const seedInput=document.getElementById('runSeed');
    const seed=challengeDay?'caravan-v1|'+challengeDay:seedInput.value?.trim()||HexRandom.freshSeed();
    document.getElementById('campaignVictory').classList.add('hidden');document.getElementById('campaignVictory').classList.remove('inspectCampaign');
    if(!challengeDay&&difficulty==='dual'&&!profile.milestones.includes('standard35'))difficulty='normal';
    if(!HexProfile.heroUnlocked(profile,heroId))heroId='standard';
    if(challengeDay){difficulty='dual';heroId='standard';}
    const chosen=[...new Set(loadout)].filter(id=>TOWERS[id]&&profile.unlockedTowers.includes(id));
    const run=HexRunRuntime.create({seed,runId:HexRandom.freshSeed(),loadout:chosen.length===5?chosen:profile.activeLoadout,unlocks:HexProfile.runUnlocks(profile),heroId,difficulty,challengeDay});
    state=run.state;random=run.random;if(!tutorialSeen&&state.towerLoadout.includes('archer'))state.towerLoadout=['archer',...state.towerLoadout.filter(id=>id!=='archer')];Object.assign(state,{selectedCard:null,rotation:0,showHexGrid,showSlotHints,selectedSlots:[],selectedTowers:[]});
    document.getElementById('baseDropdown').open=false;
    document.getElementById('activeSeed').textContent=seed;document.getElementById('dailyRunStatus').textContent=challengeDay?'Die letzte Karawane · '+challengeDay+' · Ziel: Wave 20 · Sandsturm −15 % Tempo/Reichweite':'';
    state.drawPile=shuffle(state.deck);drawHand();tutorial=tutorialSeen?{active:false,step:0}:HexTutorial.begin(state);hasActiveRun=true;setMessage(state.openingRemaining?'Zwei Fronten: Wähle zwei der fünf Handkarten und erweitere beide Base-Ausgänge.':'Wähle eine Hexkarte und lege sie an die offene Straße der Base.');renderAll();
  }

  function captureRunCheckpoint(){return HexRunSnapshot.capture(state,random);}
  function restoreRunCheckpoint(checkpoint){
    const restored=HexRunSnapshot.restore(checkpoint);closeSale();
    cancelQuickTower();clearRunTimers();resetCameraKeys();inspectReward('selection');
    state=restored.state;random=restored.random;
    Object.assign(state,{selectedCard:null,rotation:0,selectedSlots:[],selectedTowers:[],showHexGrid,showSlotHints});
    handRenderKey=forecastRenderKey='';deckRenderKeys.clear();uiWavePlans.clear();
    towerMenuKey='';towerPanelKey='';buildingPanelKey='';pinnedBiome=null;hasActiveRun=true;
    last=performance.now();clockDebt=0;renderer.reset();
    rewardOverlay.classList.add('hidden');gameOverOverlay.classList.add('hidden');document.getElementById('celebration').classList.add('hidden');
    document.getElementById('activeSeed').textContent=state.seed;
    renderSessionPhase();
    setMessage('Runzustand wiederhergestellt.');renderAll();
  }

  function towerBuildRole(id){
    const def=TOWERS[id],role=towerRole(id);if(!def.damage)return role;
    const names={hp:'Leben',armor:'Rüstung',magic:'Magieresistenz'},multipliers=def.damageMultipliers||{},best=Math.max(...Object.keys(names).map(k=>multipliers[k]??1));
    const strengths=Object.keys(names).filter(k=>(multipliers[k]??1)===best);return strengths.length===3?role:role+', besonders gut gegen '+strengths.map(k=>names[k]).join(' / ');
  }
  function towerRole(id){return TOWERS[id].role||({archer:'Einzelziel',catapult:'Linienkontrolle',chain:'Gruppenschaden',freeze:'Support'})[id]||'Spezialist';}
  function loadoutWarnings(ids){
    if(ids.length!==5)return ['Wähle genau fünf unterschiedliche Türme.'];const defs=ids.map(id=>TOWERS[id]).filter(Boolean),warnings=[];
    if(!defs.some(t=>(t.damageMultipliers?.armor||1)>(t.damageMultipliers?.hp||1)))warnings.push('Kein klarer Spezialist gegen Rüstung.');
    if(!defs.some(t=>(t.damageMultipliers?.magic||1)>(t.damageMultipliers?.hp||1)))warnings.push('Kein klarer Spezialist gegen Magieresistenz.');
    if(!defs.some(t=>t.aura))warnings.push('Kein Supportturm zur Wegkontrolle.');
    if(!defs.some(t=>t.splash||t.chain||t.pierce||t.mine))warnings.push('Kein Turm für Gruppen oder Linien.');return warnings;
  }
  function closeBasePanel(){state.selectedBase=false;document.getElementById('baseDropdown').open=false;}
  function renderBasePanel(){
    const hero=HexHeroes.hero(state.heroId),weapon=HexHeroes.weapon(state);
    document.getElementById('baseTitle').textContent=hero.name+' · Base-Ausbau';
    document.getElementById('baseStats').textContent=state.hp+'/'+state.maxHp+' HP · Mauern '+state.baseUpgrades.walls+'/'+hero.maxLevel+' · Waffe '+state.baseUpgrades.weapon+'/'+hero.maxLevel;
    document.getElementById('baseWeaponStats').textContent=weapon?'Automatische Verteidigung: '+weapon.damage+' Schaden gegen alle Schutzarten · Reichweite '+weapon.range+' · alle '+weapon.cooldown+' s.':'Noch keine Base-Waffe. Errichte die erste Stufe für automatische Verteidigung.';
    for(const [kind,id] of [['walls','baseWallsBtn'],['weapon','baseWeaponBtn']]){const next=HexHeroes.offer(state,kind),button=document.getElementById(id);const reason=HexHeroes.blockReason(state,kind);button.disabled=!!reason;button.title=reason;button.textContent=next?(kind==='walls'?'Mauern '+next.level+': +'+next.hp+' aktuelle/maximale HP':'Base-Waffe '+next.level+': '+HexHeroes.weapon(state,next.level).damage+' Schaden, Reichweite '+next.range)+' · '+next.cost+' Gold':(kind==='walls'?'Mauern':'Base-Waffe')+': vollständig ausgebaut';if(reason&&next)button.textContent+=' — '+reason;}
  }
  function renderLoadout(){
    if(pendingDifficulty==='dual'&&!profile.milestones.includes('standard35'))pendingDifficulty='normal';
    const difficulties=document.getElementById('difficultyChoices');difficulties.innerHTML='';
    for(const [id,name,desc] of [['normal','Stufe 1 · Standard','Ein Base-Ausgang. Lege eine von drei Handkarten.'],['dual','Stufe 2 · Zwei Fronten','Zwei zufällige Base-Ausgänge. Starte mit fünf Handkarten und erweitere beide Ausgänge vor Wave 1.']]){const button=document.createElement('button');button.className='loadoutChoice'+(id===pendingDifficulty?' selected':'');button.setAttribute('aria-pressed',String(id===pendingDifficulty));button.title=desc;button.innerHTML='<strong>'+name+'</strong><small>'+desc+'</small>';button.disabled=id==='dual'&&!profile.milestones.includes('standard35');if(button.disabled)button.innerHTML+='<small class="unlockRequirement">🔒 Stufe 1: Welle 35 besiegen.</small>';button.addEventListener('click',()=>{if(button.disabled)return;pendingDifficulty=id;renderLoadout();});difficulties.appendChild(button);}

    const choices=document.getElementById('heroChoices');choices.innerHTML='';
    for(const [id,hero] of Object.entries(HexHeroes.definitions)){const unlocked=HexProfile.heroUnlocked(profile,id);const button=document.createElement('button');button.type='button';button.className='loadoutChoice'+(id===pendingHero?' selected':'');button.setAttribute('aria-pressed',String(id===pendingHero));button.title=hero.desc;button.innerHTML='<strong>'+hero.name+'</strong><small>'+hero.desc+'</small>';button.disabled=!unlocked;if(!unlocked){button.title+=(id==='builder'?' Standard: Welle 35 besiegen.':' Zwei Fronten: Welle 35 besiegen.');button.innerHTML+='<small class="unlockRequirement">🔒 '+(id==='builder'?'Stufe 1: Welle 35 besiegen.':'Stufe 2 · Zwei Fronten: Welle 35 besiegen.')+'</small>';}button.addEventListener('click',()=>{if(!unlocked)return;pendingHero=id;renderLoadout();});choices.appendChild(button);}

    const presets=document.getElementById('loadoutPresets');presets.innerHTML='';if(profile.unlockedTowers.length<=5){const locked=document.createElement('p');locked.className='presetLocked';locked.textContent='🔒 Drei Presetplätze werden mit dem ersten zusätzlichen Turm freigeschaltet.';presets.appendChild(locked);}else profile.loadoutPresets.forEach((preset,index)=>{const card=document.createElement('article');card.className='presetCard';const presetTitle=document.createElement('strong'),presetInfo=document.createElement('small');presetTitle.textContent=preset.name;presetTitle.setAttribute('data-no-translate','');
      const name=document.createElement('input');name.type='text';name.value=preset.name;name.maxLength=30;name.className='presetName';name.setAttribute('aria-label','Vorlagenname');name.setAttribute('data-no-translate','');
      const rename=document.createElement('button');rename.className='secondary';rename.textContent='Name speichern';
      const commitName=()=>{const next=HexProfile.renamePreset(profile,index,name.value,TOWERS);if(next){profile=next;presetTitle.textContent=profile.loadoutPresets[index].name;name.value=profile.loadoutPresets[index].name;}};
      rename.addEventListener('click',commitName);name.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();event.stopPropagation();commitName();}});
      presetInfo.textContent=preset.towers.map(id=>TOWERS[id]?.name||id).join(' · ');card.appendChild(presetTitle);card.appendChild(presetInfo);card.appendChild(name);card.appendChild(rename);const load=document.createElement('button'),save=document.createElement('button');load.className='secondary';load.textContent='Laden';load.addEventListener('click',()=>{pendingLoadout=[...preset.towers];renderLoadout();});save.className='secondary';save.textContent='Aktuell speichern';save.disabled=pendingLoadout.length!==5;save.addEventListener('click',()=>{const next=HexProfile.savePreset(profile,index,pendingLoadout,TOWERS);if(next){profile=next;renderLoadout();}});card.appendChild(load);card.appendChild(save);presets.appendChild(card);});
    loadoutChoices.innerHTML='';
    for(const id of profile.unlockedTowers){
      const tower=TOWERS[id];if(!tower) continue;
      const selected=pendingLoadout.includes(id),button=document.createElement('button');button.type='button';button.className='loadoutChoice'+(selected?' selected':'');
      button.innerHTML=`${HexArsenal.icon(id,tower.color)}<span class="loadoutRole">${towerRole(id)}</span><strong>${tower.name}</strong><small>${tower.desc}</small><small>${tower.cost} Startpreis · ${towerStatsMarkup(tower)}</small><span class="loadoutCheck">${selected?'✓ Im Loadout':'Auswählen'}</span>`;
      button.title=tower.name+' · '+towerRole(id)+' · '+tower.desc+' · '+tower.cost+' Gold';const info=()=>{document.getElementById('preparationInfo').textContent=tower.name+' · '+towerRole(id)+' · '+tower.cost+' Gold';document.getElementById('preparationInfo').title=button.title;};button.addEventListener('mouseenter',info);button.addEventListener('focus',info);
      button.addEventListener('click',()=>{if(selected)pendingLoadout=pendingLoadout.filter(value=>value!==id);else if(pendingLoadout.length<5)pendingLoadout.push(id);else{document.getElementById('loadoutWarning').textContent='Alle fünf Plätze sind belegt. Wähle zuerst einen markierten Turm ab, um diesen Turm mitzunehmen.';return;}renderLoadout();info();});loadoutChoices.appendChild(button);
    }
    const warnings=loadoutWarnings(pendingLoadout);document.getElementById('loadoutWarning').title=warnings.join(' ');document.getElementById('loadoutWarning').textContent=pendingLoadout.length===5?'5/5 Türme gewählt.':'Wähle genau fünf Türme.';
    document.getElementById('confirmLoadoutBtn').disabled=pendingLoadout.length!==5;document.getElementById('confirmLoadoutBtn').textContent=loadoutEdit?'Loadout speichern':'Run starten';
    document.getElementById('cancelLoadoutBtn').textContent='Zurück';document.getElementById('cancelLoadoutBtn').title=hasActiveRun&&!loadoutEdit?'Zurück zum Run':'Zurück zum Hauptmenü';
  }
  let loadoutEdit=false;   // true: vom Hauptmenü geöffnet, Bestätigen speichert nur und startet keinen Run
  function openLoadout(edit=false){loadoutEdit=edit===true;pendingDifficulty=profile.difficulty||'normal';pendingHero=profile.activeHero;pendingLoadout=[...profile.activeLoadout];renderLoadout();loadoutOverlay.classList.remove('hidden');}
  function confirmLoadout(){
    const saved=HexProfile.setLoadout({...profile,activeHero:pendingHero,difficulty:pendingDifficulty},pendingLoadout,TOWERS);if(!saved) return;
    profile=saved;loadoutOverlay.classList.add('hidden');
    if(loadoutEdit){loadoutEdit=false;openMainMenu();return;}
    newRun(profile.activeLoadout);
  }
  function inspectEndMap(enabled){gameOverOverlay.setAttribute('aria-modal',String(!enabled));state.inspectEndMap=enabled;gameOverOverlay.classList.toggle('inspectEndMap',enabled);resetCameraKeys();}
  function renderRunStatistics(){
    const format=value=>(value||0).toLocaleString(globalThis.HexI18n?.getLanguage()==='en'?'en-US':'de-DE',{maximumFractionDigits:1});
    const row=(name,stats,support=false)=>{const spent=(stats.buildGold||0)+(stats.upgradeGold||0),damage=stats.damage||0;return '<tr><th scope="row">'+name+'</th><td>'+format(damage)+'</td><td>'+format(stats.buildGold)+'</td><td>'+format(stats.upgradeGold)+'</td><td>'+format(spent)+'</td><td>'+format(stats.refundGold)+'</td><td>'+(support?'Support':spent?format(damage/spent):'—')+'</td></tr>';};
    const table=rows=>'<div class="runStatsScroll"><table class="runStatsTable"><thead><tr><th>Turm</th><th>Schaden</th><th>Bau 🪙</th><th>Upgrades 🪙</th><th>Gesamt 🪙</th><th>Erstattet 🪙</th><th>Schaden/🪙</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
    const totals=Object.entries(state.runTowerStats).filter(([id])=>TOWERS[id]).sort((a,b)=>(b[1].damage||0)-(a[1].damage||0));
    let html='<h3>Turmstatistik</h3>'+ (totals.length?table(totals.map(([id,stats])=>row(TOWERS[id].name,stats,id==='freeze')).join('')):'<p>Keine Türme gebaut.</p>');
    const details=Object.entries(state.runTowerDetails||{});if(details.length)html+='<details><summary>Einzelne Türme ('+details.length+')</summary>'+table(details.map(([id,stats])=>row('#'+id+' '+TOWERS[stats.type].name+' · Hex '+stats.q+','+stats.r+' · Platz '+(stats.index+1)+(stats.sold?' · verkauft':''),stats,stats.type==='freeze')).join(''))+'</details>';
    html+='<p class="hint">Tatsächlich verursachter Schaden an Leben, Rüstung und Magieresistenz, ohne Overkill; inklusive Minen- und Geisterschaden. Schaden/Gold nutzt die bezahlten Bau- und Verbesserungskosten vor Erstattungen. Rabatte zählen, kostenlose Shrine-Upgrades kosten 0. Freeze unterstützt durch Slow. Base-Waffenschaden separat: '+format(state.baseDamage)+'.</p>';
    document.getElementById('runStatistics').innerHTML=html;
  }
  function inspectCampaign(enabled){const panel=document.getElementById('campaignVictory');panel.classList.toggle('inspectCampaign',enabled);panel.setAttribute('aria-modal',String(!enabled));}
  document.getElementById('backToVictoryBtn').addEventListener('click',()=>inspectCampaign(false));
  function showCampaignVictory(){
    inspectCampaign(false);clearRunTimers();resetCameraKeys();
    const title=document.getElementById('campaignVictoryTitle'),note=document.getElementById('campaignVictoryNote');
    document.getElementById('dailyVictoryStatistics').classList.toggle('hidden',!state.challengeDay);
    if(state.challengeDay){
      renderRunStatistics();document.getElementById('dailyVictoryStatsContent').innerHTML=document.getElementById('runStatistics').innerHTML;
      const settled=HexProfile.settleDaily(profile,state.challengeDay,Math.max(20,state.lastCompletedWave||20),TOWERS);profile=settled.profile;state.metaSettled=true;
      title.textContent='Die Karawane ist gerettet!';
      document.getElementById('campaignVictoryText').textContent='Welle 20 geschafft!'+(settled.reward?' Tagessieg: +10 Diamanten':' Tagesbelohnung bereits erhalten.');
      note.textContent='Spiele mit deiner Karte und deinen Türmen im Endlosmodus weiter. Die Karawanenregeln bleiben aktiv. Die Tagesbelohnung gibt es nur einmal pro Tag.';
    }else{
      const milestone=state.difficulty==='dual'?'dual35':'standard35';if(!profile.milestones.includes(milestone))profile=HexProfile.save({...profile,milestones:[...profile.milestones,milestone]},TOWERS);
      title.textContent='Wave 35 geschafft!';
      document.getElementById('campaignVictoryText').textContent=state.difficulty==='normal'?'Welle 35 geschafft! Zwei Fronten und Festungsbauer sind jetzt freigeschaltet.':'Zwei Fronten gemeistert! Händlerstadt ist jetzt freigeschaltet.';
      note.textContent='Deine Map und Türme bleiben im Endless-Modus erhalten. Diamanten werden beim Beenden des Durchlaufs abgerechnet.';
    }
    document.getElementById('campaignVictory').classList.remove('hidden');renderAll();
  }
  document.getElementById('endlessBtn').addEventListener('click',()=>{if(!HexRunSession.endless(state,random))return;document.getElementById('campaignVictory').classList.add('hidden');renderSessionPhase();});
  document.getElementById('victoryMenuBtn').addEventListener('click',()=>{if(state.phase!=='victory')return;document.getElementById('campaignVictory').classList.add('hidden');state.phase='gameover';showGameOver();gameOverOverlay.classList.add('hidden');openMainMenu();});
  function showGameOver(){hasActiveRun=false;resetCameraKeys();inspectEndMap(false);renderRunStatistics();
    if(state.challengeDay){const result=HexProfile.settleDaily(profile,state.challengeDay,Math.max(state.challengeWon?20:0,state.lastCompletedWave||Math.max(0,state.wave-1)),TOWERS);profile=result.profile;state.metaSettled=true;document.getElementById('gameOverTitle').textContent=state.challengeWon?'DIE KARAWANE IST GERETTET!':'Die Karawane ist gefallen';document.getElementById('gameOverResult').textContent='Die letzte Karawane · '+state.challengeDay+' · '+(state.challengeWon?(state.endless?'Endlosmodus · Wave '+state.wave+' erreicht':'Wave 20 überlebt!'):'Wave '+state.wave+' erreicht');document.getElementById('diamondBreakdown').textContent=result.reward?'Tagessieg: +10 Diamanten':state.challengeWon?'Tagesbelohnung bereits erhalten.':'Keine Tagesbelohnung – versuche es erneut!';document.getElementById('gameOverDiamonds').textContent=profile.diamonds;document.getElementById('gameOverBest').textContent=profile.dailyResults[state.challengeDay].best;gameOverOverlay.classList.remove('hidden');return;}
    document.getElementById('gameOverTitle').textContent='Die Bastion ist gefallen';
    let reward={wave:0,bosses:0,milestones:0,total:0,duplicate:true};
    if(!state.metaSettled){const settled=HexProfile.settleRun(profile,{runId:state.runId,wave:state.wave,...state.earnedMeta,towers:state.runTowerStats},TOWERS);profile=settled.profile;reward=settled.reward;state.metaSettled=true;}
    document.getElementById('gameOverResult').textContent=`Wave ${state.wave} erreicht · ${state.earnedMeta.normalKills} normale Gegner · ${state.earnedMeta.periodicBosses+state.earnedMeta.explorationBosses} Bosse besiegt`;
    document.getElementById('diamondBreakdown').innerHTML=`<div><strong>+${reward.wave}</strong>Wave-Fortschritt</div><div><strong>+${reward.bosses}</strong>Boss-Siege</div><div><strong>+${reward.milestones}</strong>Neue Bestmarken</div>`;
    document.getElementById('gameOverDiamonds').textContent=profile.diamonds;document.getElementById('gameOverBest').textContent=profile.records.highestWave;
    document.getElementById('profileDiamonds').textContent=profile.diamonds;document.getElementById('runDiamonds').textContent='(+0)';gameOverOverlay.classList.remove('hidden');
  }
  let resetArsenalPending=false;
  function renderArsenal(message=''){
    document.getElementById('arsenalDiamonds').textContent=profile.diamonds;
    HexArsenal.render(document.getElementById('arsenalChoices'),profile,(kind,id)=>{const method={activateUltimate:HexProfile.activateUltimate,tower:HexProfile.unlockTower,ultimate:HexProfile.unlockUltimate,building:HexProfile.unlockBuilding}[kind],next=method(profile,id,TOWERS);if(!next)return;profile=next;resetArsenalPending=false;renderLoadout();renderArsenal('Freigeschaltet. Ab dem nächsten Run verfügbar.');renderUI();});
    const refund=HexProfile.resetValue(profile),button=document.getElementById('resetDiamondsBtn');button.disabled=refund===0;button.textContent=resetArsenalPending?'Bestätigen: alle Freischaltungen zurücksetzen · +'+refund+' ◆':'Reset · +'+refund+' ◆';
    document.getElementById('arsenalMessage').textContent=message||'';
  }
  const arsenalCamera=HexArsenal.enableDrag(document.getElementById('arsenalMap'),document.getElementById('arsenalChoices'),scale=>document.getElementById('arsenalZoomValue').textContent=Math.round(scale*100)+' %');
  document.getElementById('arsenalZoomIn').addEventListener('click',()=>arsenalCamera.zoom(1.2));
  document.getElementById('arsenalZoomOut').addEventListener('click',()=>arsenalCamera.zoom(1/1.2));
  document.getElementById('arsenalFit').addEventListener('click',()=>arsenalCamera.fit());
  document.getElementById('resetDiamondsBtn').addEventListener('click',()=>{if(!resetArsenalPending){resetArsenalPending=true;renderArsenal('Alle Turm- und Meta-Freischaltungen werden entfernt; Loadouts werden auf die fünf Starttürme zurückgesetzt. Ein bereits laufender Run behält seine Startauswahl. Erneut klicken zum Bestätigen.');return;}const result=HexProfile.resetUnlocks(profile,TOWERS);profile=result.profile;pendingLoadout=[...profile.activeLoadout];resetArsenalPending=false;renderLoadout();renderArsenal(result.refund+' Diamanten erstattet. Du kannst dich neu entscheiden.');renderUI();});
  function openArsenal(){resetArsenalPending=false;renderArsenal();arsenalOverlay.classList.remove('hidden');arsenalCamera.start();}

  function toggleUpgradeStatus(value=!state.showUpgradeStatus){state.showUpgradeStatus=value;document.getElementById('upgradeStatus').checked=value;renderBoard();}
  document.getElementById('upgradeStatus').addEventListener('change',e=>toggleUpgradeStatus(e.target.checked));
  const slotToggle=document.getElementById('slotHints');slotToggle.checked=showSlotHints;slotToggle.addEventListener('change',()=>{showSlotHints=slotToggle.checked;state.showSlotHints=showSlotHints;try{localStorage.setItem('slotHints',String(showSlotHints));}catch{}renderBoard();});
  document.getElementById('skipTutorialBtn').addEventListener('click',()=>{finishTutorial();renderAll();});
  document.getElementById('tutorialNextBtn').addEventListener('click',()=>{tutorialEvent(tutorial.step===4?'skipUpgrade':'health');renderAll();});
  document.getElementById('restartTutorialBtn').addEventListener('click',()=>{tutorial=HexTutorial.begin(state);document.getElementById('settingsDrawer').classList.add('hidden');renderAll();});
  const gridToggle=document.getElementById('hexGrid');gridToggle.checked=showHexGrid;
  function setHexGrid(enabled){showHexGrid=enabled;gridToggle.checked=enabled;state.showHexGrid=enabled;try{localStorage.setItem('hexGrid',String(enabled));}catch{}renderBoard();}
  gridToggle.addEventListener('change',()=>setHexGrid(gridToggle.checked));
  document.getElementById('baseDropdown').addEventListener('toggle',()=>{state.selectedBase=document.getElementById('baseDropdown').open;renderBoard();});
  for(const [kind,id] of [['walls','baseWallsBtn'],['weapon','baseWeaponBtn']])document.getElementById(id).addEventListener('click',()=>{if(HexHeroes.buy(state,kind)){sound.play('build');renderAll();}});
  if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(()=>requestAnimationFrame(layoutMenus));for(const node of document.querySelectorAll('.gameHeader,.dockBR,.handDock,.mapControls,.dockBL'))observer.observe(node);}
  globalThis.addEventListener?.('hexlanguagechange',()=>{uiLanguageRevision++;if(state){renderRunStatistics();renderUI();}});globalThis.addEventListener?.('resize',layoutMenus);document.addEventListener('toggle',layoutMenus,true);document.addEventListener('click',()=>requestAnimationFrame(layoutMenus));
  document.getElementById('hotkeyTipOpen').addEventListener('click',openHotkeySettings);
  document.getElementById('hotkeyTipClose').addEventListener('click',()=>{state.hotkeyHintDone=true;renderHotkeyTip();});
  document.getElementById('hotkeyHelp').addEventListener('toggle',renderHotkeyTip);
  document.addEventListener('click',()=>renderHotkeyTip());
  document.getElementById('rotateHexBtn').addEventListener('click',()=>rotateSelected());
  startWaveBtn.addEventListener('click',startWave);
  // ---- Hauptmenü ----
  const mainMenu=document.getElementById('mainMenu'),menuRules=document.getElementById('menuRules');
  const saveOverlay=document.getElementById('saveOverlay'),saveStatus=document.getElementById('saveStatus'),confirmImport=document.getElementById('confirmImportBtn');
  let pendingImport=null,importReadId=0;
  function closeSave(){pendingImport=null;importReadId++;saveOverlay.classList.add('hidden');openMainMenu();document.getElementById('menuSaveBtn').focus?.();}
  document.getElementById('menuSaveBtn').addEventListener('click',()=>{pendingImport=null;importReadId++;confirmImport.classList.add('hidden');document.getElementById('uploadSaveInput').value='';saveStatus.textContent='Ein Import ersetzt dein Profil. Lade zur Sicherheit zuerst eine Kopie herunter.';saveOverlay.classList.remove('hidden');});
  document.getElementById('closeSaveBtn').addEventListener('click',closeSave);
  document.getElementById('downloadSaveBtn').addEventListener('click',()=>{try{const blob=new Blob([HexProfile.exportFile(profile,TOWERS)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='autohex-spielstand-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);saveStatus.textContent='Spielstanddatei zum Download bereitgestellt.';}catch{saveStatus.textContent='Download fehlgeschlagen. Bitte erneut versuchen.';}});
  document.getElementById('uploadSaveInput').addEventListener('change',async event=>{const readId=++importReadId;pendingImport=null;confirmImport.classList.add('hidden');const file=event.target.files?.[0];if(!file)return;try{if(hasActiveRun&&state.hp>0)throw new Error('Bitte zuerst den laufenden Run beenden. Ein Profilwechsel während eines Durchlaufs ist nicht möglich.');if(file.size>2000000)throw new Error('Datei zu groß (maximal 2 MB).');const text=await file.text();if(readId!==importReadId)return;const next=HexProfile.readFile(text,TOWERS);pendingImport=text;saveStatus.textContent=next.diamonds+' Diamanten · '+next.unlockedTowers.length+' Türme freigeschaltet · Bestmarke Wave '+next.records.highestWave+'. Dein bisheriges Profil mit '+profile.diamonds+' Diamanten wird ersetzt. Eine lokale Sicherung wird angelegt.';confirmImport.classList.remove('hidden');}catch(error){if(readId===importReadId)saveStatus.textContent=error.message;}});
  confirmImport.addEventListener('click',()=>{if(!pendingImport||hasActiveRun&&state.hp>0)return;try{profile=HexProfile.importFile(pendingImport,TOWERS);pendingLoadout=[...profile.activeLoadout];pendingHero=profile.activeHero;pendingDifficulty=profile.difficulty;pendingImport=null;confirmImport.classList.add('hidden');renderLoadout();renderUI();updateArsenalHint();saveStatus.textContent='Spielstand importiert. Dein Profil ist für den nächsten Run bereit.';}catch(error){saveStatus.textContent='Import fehlgeschlagen: '+error.message;}});
  function updateArsenalHint(){const count=HexProfile.affordableUnlocks(profile),button=document.getElementById('menuArsenalBtn');button.classList.toggle('upgradeAvailable',count>0);button.textContent=count?'◆ Arsenal · Upgrade verfügbar':'◆ Arsenal';button.title=count?count+' Freischaltungen bezahlbar':'Arsenal';}
  function openMainMenu(){document.getElementById('biomeIntro').classList.add('hidden');cancelQuickTower();resetCameraKeys();updateArsenalHint();const today=new Date().toISOString().slice(0,10),daily=profile.dailyResults?.[today];document.getElementById('dailyProgress').textContent=today+' (UTC) · '+(daily?.won?'Heute geschafft · Belohnung erhalten':'Tagesbestmarke: '+(daily?.best||0)+'/20 Waves');document.getElementById('menuContinueBtn').classList.toggle('hidden',!hasActiveRun||state.hp<=0);document.getElementById('menuPlayBtn').textContent=hasActiveRun?'Neuer Run':'Spielen';document.getElementById('menuLoadoutInfo').textContent='Loadout: '+profile.activeLoadout.map(id=>TOWERS[id]?.name||id).join(' · ');mainMenu.classList.remove('hidden');}
  document.getElementById('dailyStartBtn').addEventListener('click',()=>{mainMenu.classList.add('hidden');document.getElementById('playModeOverlay').classList.add('hidden');newRun(undefined,'standard','dual',new Date().toISOString().slice(0,10));});
  document.getElementById('menuPlayBtn').addEventListener('click',()=>{mainMenu.classList.add('hidden');document.getElementById('playModeChoices').classList.remove('hidden');document.getElementById('dailyModeDetails').classList.add('hidden');document.getElementById('playModeOverlay').classList.remove('hidden');});
  document.getElementById('duoModeBtn').addEventListener('click',()=>{location.href='duo-lobby.html';});
  document.getElementById('standardModeBtn').addEventListener('click',()=>{document.getElementById('playModeOverlay').classList.add('hidden');openLoadout();});
  document.getElementById('dailyModeBtn').addEventListener('click',()=>{document.getElementById('playModeChoices').classList.add('hidden');document.getElementById('dailyModeDetails').classList.remove('hidden');});
  document.getElementById('playModeBackBtn').addEventListener('click',()=>{document.getElementById('playModeOverlay').classList.add('hidden');openMainMenu();});
  document.getElementById('menuRulesBackBtn').addEventListener('click',()=>{document.getElementById('menuRulesOverlay').classList.add('hidden');openMainMenu();});
  document.getElementById('menuContinueBtn').addEventListener('click',()=>mainMenu.classList.add('hidden'));
  document.getElementById('menuArsenalBtn').addEventListener('click',openArsenal);
  document.getElementById('menuRulesBtn').addEventListener('click',()=>{if(!menuRules.innerHTML){const source=document.getElementById('rulesDrawer').querySelector('ul');menuRules.innerHTML=globalThis.HexI18n?HexI18n.sourceHTML(source):source.outerHTML;}mainMenu.classList.add('hidden');document.getElementById('menuRulesOverlay').classList.remove('hidden');});
  document.getElementById('openMainMenuBtn').addEventListener('click',()=>{document.getElementById('settingsDrawer').classList.add('hidden');openMainMenu();});
  const menuSound=document.getElementById('menuSound'),soundToggle=document.getElementById('soundEnabled');
  menuSound.addEventListener('change',()=>{soundToggle.checked=menuSound.checked;soundToggle.dispatchEvent(new Event('change'));});
  newRunBtn.addEventListener('click',openLoadout);
  document.getElementById('confirmLoadoutBtn').addEventListener('click',confirmLoadout);
  document.getElementById('cancelLoadoutBtn').addEventListener('click',()=>{loadoutOverlay.classList.add('hidden');if(!hasActiveRun||loadoutEdit) openMainMenu();loadoutEdit=false;});
  document.getElementById('retryLoadoutBtn').addEventListener('click',()=>newRun(state.towerLoadout,state.heroId,state.difficulty,state.challengeDay));
  document.getElementById('gameOverMapBtn').addEventListener('click',()=>inspectEndMap(true));
  document.getElementById('backToRunResultBtn').addEventListener('click',()=>inspectEndMap(false));
  document.getElementById('gameOverMenuBtn').addEventListener('click',()=>{gameOverOverlay.classList.add('hidden');openMainMenu();});
  document.getElementById('changeLoadoutBtn').addEventListener('click',()=>{gameOverOverlay.classList.add('hidden');openLoadout();});

  function closeArsenal(){arsenalOverlay.classList.add('hidden');resetArsenalPending=false;renderLoadout();document.getElementById('menuArsenalBtn').focus?.();}
  document.getElementById('closeArsenalBtn').addEventListener('click',closeArsenal);
  document.getElementById('closeBiomeInfo').addEventListener('click',()=>document.getElementById('biomeInfoPanel').classList.add('hidden'));
  document.getElementById('towerBiomeInfo').addEventListener('click',()=>{const slot=state.selectedTower,tile=slot&&state.map.get(key(slot.q,slot.r));if(tile)inspectBiome(HexBiomes.forTile(state,tile));});
  function dismissBiomeInfoOutside(event){
    if(!state||!event.target?.closest||event.target.closest('#biomeInfoPanel,#towerBiomeInfo,.biomeRail'))return false;
    document.getElementById('biomeInfoPanel').classList.add('hidden');
    const changed=!!(pinnedBiome||state.highlightBiome);pinnedBiome=null;state.highlightBiome=null;
    if(document.activeElement?.closest?.('.biomeRail'))document.activeElement.blur?.();
    if(changed){for(const button of biomeButtons.values()){button.classList.remove('active');button.setAttribute('aria-pressed','false');}renderBiomeIntroDetails();renderBoard();}
    return changed;
  }
  function dismissTransientPanels(event){
    const target=event.target;if(!target?.closest||!state||target.closest('#rewardOverlay,#celebration,#campaignVictory'))return;
    let changed=false;
    if(saleRequest&&!target.closest('#'+(saleRequest.kind==='tower'?'sellTowerBtn':'sellBuildingBtn'))){closeSale();changed=true;}
    if(!target.closest('.towerPanel,.drawer,.loadoutRail')){
      if(state.selectedTower||state.selectedBuilding||state.selectedSlot){state.selectedTower=null;state.selectedBuilding=null;state.selectedSlot=null;state.previewTower=null;state.previewBuilding=null;changed=true;}
    }
    if(dismissBiomeInfoOutside(event))changed=true;
    if(changed)renderAll();
  }
  let saleRequest=null;
  const saleButton=kind=>document.getElementById(kind==='tower'?'sellTowerBtn':'sellBuildingBtn');
  function closeSale(){saleRequest=null;for(const kind of ['tower','building'])saleButton(kind).classList.remove('confirmSale');}
  function renderSaleState(){
    const request=saleRequest;if(!request)return;const selected=request.kind==='tower'?state.selectedTower:state.selectedBuilding;
    if(request.run!==state||!selected||selected.q!==request.slot.q||selected.r!==request.slot.r||selected.index!==request.slot.index||request.kind==='tower'&&selections('Tower').length!==1||state.map.get(key(selected.q,selected.r))?.[request.kind==='tower'?'towers':'buildings']?.[selected.index]!==request.object){closeSale();return;}
    const button=saleButton(request.kind);button.classList.add('confirmSale');button.textContent='Wirklich verkaufen? +'+request.amount+' Gold · erneut klicken';
  }
  function requestSale(kind){
    const slot=kind==='tower'?state.selectedTower:state.selectedBuilding;if(!slot||kind==='tower'&&selections('Tower').length!==1)return;
    const object=state.map.get(key(slot.q,slot.r))?.[kind==='tower'?'towers':'buildings']?.[slot.index];
    const refund=kind==='tower'?HexData.towerRefund(state,object):HexBuildings.refund(state,object);if(!refund){closeSale();renderAll();return;}
    if(saleRequest?.run===state&&saleRequest.kind===kind&&saleRequest.object===object&&saleRequest.amount===refund.amount){
      closeSale();if(kind==='tower')sellSelectedTower();else if(HexBuildings.sell(state,slot))renderAll();return;
    }
    closeSale();saleRequest={run:state,kind,slot:{...slot},object,amount:refund.amount};renderSaleState();
  }
  document.getElementById('sellBuildingBtn').addEventListener('click',()=>requestSale('building'));
  document.getElementById('sellTowerBtn').addEventListener('click',()=>requestSale('tower'));
  document.getElementById('closeBuildingPanel').addEventListener('click',()=>{state.selectedBuilding=null;renderAll();});
  document.getElementById('celebrationContinue').addEventListener('click',closeCelebration);
  document.getElementById('rewardMapBtn').addEventListener('click',()=>inspectReward(rewardView==='map'?'selection':'map'));
  document.getElementById('rewardDeckBtn').addEventListener('click',()=>inspectReward(rewardView==='deck'?'selection':'deck'));
  document.getElementById('rewardBackBtn').addEventListener('click',()=>inspectReward('selection'));
  document.getElementById('skipRemovalBtn').addEventListener('click',()=>takeReward(state.rewardOffer?.id,null));
  document.getElementById('closeTowerPanel').addEventListener('click',()=>{state.selectedTower=null;renderAll();});
  document.getElementById('zoomInBtn').addEventListener('click',()=>renderer.zoom(.8));
  document.getElementById('zoomOutBtn').addEventListener('click',()=>renderer.zoom(1.25));
  document.getElementById('resetViewBtn').addEventListener('click',()=>renderer.resetView());
  for(const [id,close] of [['rewardOverlay',()=>inspectReward('map')],['gameOverOverlay',()=>inspectEndMap(true)],['campaignVictory',()=>inspectCampaign(true)],['celebration',closeCelebration]]){const overlay=document.getElementById(id);overlay.addEventListener('click',e=>{if(e.target===overlay)close();});}
  document.getElementById('deckDropdown').addEventListener('toggle',()=>{if(document.getElementById('deckDropdown').open) renderDeckOverview();});
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey&&!e.altKey&&!e.metaKey&&e.key.toLowerCase()==='f'){e.preventDefault();if(!e.repeat)toggleFps();return;}
    if(state.phase==='victory'){if(e.key==='Escape'){e.preventDefault?.();inspectCampaign(!document.getElementById('campaignVictory').classList.contains('inspectCampaign'));}return;}
    if(e.key==='Escape'&&state.buildingTarget){state.buildingTarget=null;e.preventDefault?.();setMessage('Hex-Auswahl abgebrochen.');renderAll();return;}
    if(saleRequest&&e.key==='Escape'){e.preventDefault?.();closeSale();renderAll();return;}
    if(!saveOverlay.classList.contains('hidden')){if(e.key==='Escape'){e.preventDefault?.();closeSave();}return;}
    if(e.key==='Escape'&&state.dragTower){e.preventDefault?.();cancelQuickTower();renderAll();return;}
    if(e.key==='Escape'&&state.inspectEndMap){e.preventDefault?.();inspectEndMap(false);return;}
    if(e.key==='Escape'&&!arsenalOverlay.classList.contains('hidden')){e.preventDefault?.();closeArsenal();return;}
    if(state.celebrationActive){if(e.key==='Escape'){closeCelebration();e.preventDefault?.();}else if(e.code==='Space')e.preventDefault?.();return;}
    if(e.key==='Escape'){
      e.preventDefault?.();if(e.repeat)return;
      const hadPanel=state.selectedTower||state.selectedBuilding||state.selectedSlot||document.querySelector?.('.drawer:not(.hidden),.statDetails[open],#biomeInfoPanel:not(.hidden)');
      document.getElementById('biomeInfoPanel').classList.add('hidden');
      if(rewardView!=='selection'){inspectReward('selection');return;}
      document.querySelectorAll('.drawer').forEach(panel=>panel.classList.add('hidden'));
      document.querySelectorAll('.statDetails').forEach(panel=>{panel.open=false;});
      cancelQuickTower();state.highlightBiome=null;pinnedBiome=null;
      state.selectedTower=null;state.selectedBuilding=null;state.selectedSlot=null;state.selectedBase=false;state.previewTower=null;
      if(!hadPanel&&hasActiveRun&&mainMenu.classList.contains('hidden'))document.getElementById('settingsDrawer').classList.remove('hidden');
      renderHotkeyTip();renderAll();return;
    }
    if(e.key.toLowerCase()==='f'&&!e.repeat&&e.target?.id==='doubleSpeed'){e.preventDefault();changeSpeed(gameSpeed%8+1);return;}
    if(e.key.toLowerCase()==='r'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.target?.isContentEditable&&!['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)&&state.phase==='place'){e.preventDefault?.();rotateSelected();return;}
    if(['INPUT','TEXTAREA','SELECT','BUTTON','SUMMARY'].includes(e.target?.tagName)||e.target?.isContentEditable) return;
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.key.toLowerCase()==='u'&&!e.repeat){e.preventDefault();toggleUpgradeStatus();}
    if(e.key.toLowerCase()==='g'&&!e.repeat){e.preventDefault();setHexGrid(!showHexGrid);}
    if('qewasd'.includes(e.key.toLowerCase())&&e.key.length===1){e.preventDefault();cameraKeys.add(e.key.toLowerCase());}
    if(e.code==='Space'&&!e.repeat){e.preventDefault();startWave();}
    if(/^[1-9]$/.test(e.key)){const n=Number(e.key)-1;
      if(state.selectedSlot){const b=[...towerButtons.values()][n];if(b&&!b.disabled) b.click();}
      else if(state.phase==='place'&&state.hand[n]){state.selectedCard=n;state.rotation=0;renderAll();}}
    if(e.key.toLowerCase()==='p') togglePause();
    if(e.key.toLowerCase()==='r')rotateSelected();
    if(e.key.toLowerCase()==='f'&&!e.repeat){changeSpeed(gameSpeed%8+1);}
  });

  const cameraKeys=new Set();let cameraLast=performance.now(),cameraVelocity={x:0,y:0,turn:0};
  function resetCameraKeys(){cameraKeys.clear();cameraVelocity={x:0,y:0,turn:0};cameraLast=performance.now();}
  document.addEventListener('keyup',e=>cameraKeys.delete(e.key.toLowerCase()));
  globalThis.addEventListener?.('blur',resetCameraKeys);
  document.addEventListener('focusin',e=>{if(['INPUT','SELECT','TEXTAREA','BUTTON','SUMMARY'].includes(e.target?.tagName))resetCameraKeys();});
  function advanceCamera(now){
    const dt=Math.min(.05,Math.max(0,(now-cameraLast)/1000));cameraLast=now;if(document.hidden)return;
    const x=Number(cameraKeys.has('d'))-Number(cameraKeys.has('a')),y=Number(cameraKeys.has('s'))-Number(cameraKeys.has('w')),length=Math.hypot(x,y)||1;
    const targets={x:x/length,y:y/length,turn:Number(cameraKeys.has('e'))-Number(cameraKeys.has('q'))},motion={};
    for(const axis of ['x','y','turn']){const target=targets[axis],old=cameraVelocity[axis],rate=target?14:22,decay=Math.exp(-rate*dt);motion[axis]=target*dt+(old-target)*(1-decay)/rate;cameraVelocity[axis]=target+(old-target)*decay;if(!target&&Math.abs(cameraVelocity[axis])<.001)cameraVelocity[axis]=0;}
    if(Math.abs(motion.turn)>.00001)renderer.rotateView?.(motion.turn*6);if(Math.hypot(motion.x,motion.y)>.00001)renderer.panView?.(motion.x,motion.y);
  }
  let last=performance.now();
  let paused=false,clockDebt=0;
  function togglePause(){advanceClock(performance.now());paused=!paused;clockDebt=0;last=performance.now();document.getElementById('app').classList.toggle('paused',paused);const b=document.getElementById('pauseBtn');if(b) b.textContent=paused?'▶ Weiter (P)':'⏸ Pause (P)';}
  document.getElementById('pauseBtn')?.addEventListener('click',togglePause);
  function advanceClock(now){
    const elapsed=Math.max(0,(now-last)/1000);last=now;
    if(paused||!state.waveRunning){clockDebt=0;return;}
    clockDebt+=elapsed;const step=.05/gameSpeed;let count=0;
    while(clockDebt>=step&&state.waveRunning&&count++<200){clockDebt-=step;update(step,now,false);}
    if(!state.waveRunning)clockDebt=0;
    if(!document.hidden){renderBoard();renderUI();}
  }
  let fpsVisible=false,fpsStart=null,fpsFrames=0,animationFrames=0;
  const fpsEl=document.getElementById('fpsCounter');
  function toggleFps(){fpsVisible=!fpsVisible;fpsStart=null;fpsEl.classList.toggle('hidden',!fpsVisible);fpsEl.textContent='FPS: —';}
  function updateFps(now){
    if(!fpsVisible)return;
    if(document.hidden){fpsStart=null;fpsEl.textContent='FPS: —';return;}
    const count=renderer.getRenderedFrameCount?.()??animationFrames;
    if(fpsStart===null){fpsStart=now;fpsFrames=count;return;}
    const elapsed=now-fpsStart;
    if(elapsed>=500){fpsEl.textContent='FPS: '+Math.round((count-fpsFrames)*1000/elapsed);fpsStart=now;fpsFrames=count;}
  }
  function frame(now){animationFrames++;advanceCamera(now);advanceClock(now);updateFps(now);requestAnimationFrame(frame);}
  globalThis.setInterval?.(()=>{if(document.hidden)advanceClock(performance.now());},250);
  document.addEventListener('visibilitychange',()=>{fpsStart=null;if(fpsVisible)fpsEl.textContent='FPS: —';cancelQuickTower();resetCameraKeys();advanceClock(performance.now());});
  newRun(); hasActiveRun=false; openMainMenu(); requestAnimationFrame(frame);
})();
