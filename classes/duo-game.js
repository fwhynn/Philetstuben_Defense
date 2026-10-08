/* Adapter for the SINGLEPLAYER game screen. Only the server changes gameplay. */
const HexDuoGame=(()=>{
  function mergeBoard(previous,next){
    // Preserve identity of unchanged selections/previews across 10 Hz snapshots.
    for(const [key,tile] of next.map){const old=previous.map?.get(key);if(!old)continue;
      tile.towers=tile.towers.map((tower,i)=>{const before=old.towers?.[i];if(tower&&before&&tower.statId===before.statId&&tower.type===before.type){delete before.overloadUntil;delete before.overloadPending;Object.assign(before,tower);return before;}return tower;});
      tile.buildings=(tile.buildings||[]).map((building,i)=>{const before=old.buildings?.[i];if(building&&before&&building.type===before.type){Object.assign(before,building);return before;}return building;});
    }
    return next;
  }
  // What a seat is doing right now, phrased for the team bar ("Du … / Partner …").
  function seatStatus(view,i){
    const b=view.boards[i],c=view.connection||{},offer=view.delivery?.offers?.[i];
    if(c.players?.[i]==='disconnected'||c.players?.[i]==='waiting')return {state:'offline',text:'nicht verbunden'};
    if(view.result||['gameover','victory'].includes(b.phase))return {state:'done',text:'Partie beendet'};
    if(view.ready[i])return {state:'ready',text:'bereit ✓'};
    if(b.celebration)return {state:'todo',text:'bestätigt die Welle'};
    if(b.phase==='duoDelivery')return offer&&offer.index!==null?{state:'waiting',text:'Geschenk gewählt'}:{state:'todo',text:'wählt ein Geschenk'};
    if(b.rewardOffer)return {state:'todo',text:'wählt eine Belohnung'};
    const [state,text]={place:['todo','legt ein Hex'],build:['todo','baut'],wave:['combat','kämpft'],duoWait:['waiting','Welle geschafft'],reward:['todo','wählt eine Karte'],removal:['todo','dünnt das Deck aus'],bossReward:['todo','wählt Beute'],shrineReward:['todo','wählt einen Segen']}[b.phase]||['waiting','wartet'];
    return {state,text};
  }
  // One clear instruction for the local player: what to do now, or why nothing can be done.
  function guide(view,board=view.player){
    const own=view.player,partner=1-own,b=view.boards[own],c=view.connection||{};
    const say=(tone,title,text,locked=false)=>({tone,title,text,locked,self:seatStatus(view,own),partner:seatStatus(view,partner)});
    if(c.maintenance)return say('alert','Serverwartung','Die Partie ist sicher pausiert und geht danach automatisch weiter.',true);
    if(c.ended)return say('alert','Partie beendet','Ein Spieler hat die Partie verlassen. Über das Duo-Menü geht es zurück zur Lobby.',true);
    if(c.expired)return say('alert','Rückkehrfenster abgelaufen','Diese Partie kann nicht fortgesetzt werden. Erstellt bitte eine neue Lobby.',true);
    if(c.paused)return say('alert','Pausiert · Partner nicht verbunden','Bis dein Partner zurück ist, ist alles gesperrt'+(Number.isFinite(c.remainingSeconds)?' – er hat noch '+c.remainingSeconds+' s.':'.'),true);
    if(view.result)return say('done',view.result.outcome==='victory'?'Gemeinsam geschafft!':'Die Festungen sind gefallen','Welle '+view.result.wave+' erreicht. Startet eine neue Partie oder geht zurück zur Lobby.',true);
    if(board!==own)return say('wait','Du siehst die Partnerkarte','Hier kannst du nur zuschauen. Mit »Meine Karte« kommst du zurück.',true);
    if(view.paused)return say('wait','Gemeinsame Pause','Einer von euch hat pausiert. Mit P oder »Gemeinsam fortsetzen« geht es für beide weiter.');
    if(b.celebration)return say('act','Welle geschafft!','Bestätige die Meldung, dann geht es weiter.');
    if(b.phase==='duoDelivery'){const offer=view.delivery?.offers?.[own];return offer&&offer.index===null?say('act','Geschenk für deinen Partner','Wähle Gold oder eine Karte – sie landet direkt bei deinem Partner.'):say('wait','Geschenk verschickt','Sobald dein Partner auch gewählt hat, geht es weiter.',true);}
    if(b.rewardOffer||['reward','removal','bossReward','shrineReward'].includes(b.phase))return say('act','Wähle deine Belohnung','Dein Partner wählt gleichzeitig seine eigene.');
    if(b.phase==='place')return say('act','Du bist dran: Hex legen','Wähle unten eine Karte und klicke auf ein grünes Feld. R oder Rechtsklick dreht die Karte.');
    if(b.phase==='build'&&view.ready[own])return say('wait','Du bist bereit','Die Welle startet, sobald dein Partner auch bereit ist. Zum Weiterbauen nimm die Bereitschaft zurück.',true);
    if(b.phase==='build')return say('act','Bauphase: Türme bauen',view.ready[partner]?'Dein Partner ist schon bereit und wartet auf dich. Wenn du fertig bist: »Bereit für die Welle« (Leertaste).':'Baue Türme auf freie Plätze. Wenn du fertig bist: »Bereit für die Welle« (Leertaste). Die Welle startet, sobald ihr beide bereit seid.');
    if(b.phase==='wave')return say('combat','Gemeinsame Welle läuft','Eure Türme kämpfen automatisch auf beiden Karten. Du kannst nebenbei weiter bauen.');
    if(b.phase==='duoWait')return say('wait','Deine Welle ist geschafft','Dein Partner kämpft noch. Danach geht es für euch beide weiter.',true);
    return say('wait','Einen Moment','Der nächste Schritt wird vorbereitet.',true);
  }
  function mount(api){
    const $=id=>document.getElementById(id);let profileChanged=true,view=null,match=null,board=null,transferKey='',guardianKey='',leaving=false,client,picking=null;
    const storageKey='autohex-duo-client:'+api.token;let clientId=sessionStorage.getItem(storageKey);if(!clientId){clientId=crypto.randomUUID();sessionStorage.setItem(storageKey,clientId);}
    const own=()=>view&&board===view.player;
    // Enemies arrive ~10 times per second; glide between snapshots so combat does not stutter.
    const motion={from:new Map(),to:new Map(),at:0,span:100};let settledKey='';
    function track(next,switched){const now=performance.now(),from=new Map();if(!switched)for(const e of api.getState().enemies||[])from.set(e.id,{x:e.x,y:e.y});
      if(motion.at)motion.span=Math.min(250,Math.max(50,motion.span*.7+(now-motion.at)*.3));motion.at=now;motion.to=new Map();motion.from=new Map();
      for(const e of next.enemies||[]){const start=from.get(e.id);motion.to.set(e.id,{x:e.x,y:e.y});if(start&&Math.hypot(start.x-e.x,start.y-e.y)<120){motion.from.set(e.id,start);e.x=start.x;e.y=start.y;}}}
    function animate(now){if(!motion.from.size)return false;const t=Math.min(1,(now-motion.at)/motion.span);for(const e of api.getState().enemies||[]){const a=motion.from.get(e.id),b=motion.to.get(e.id);if(a&&b){e.x=a.x+(b.x-a.x)*t;e.y=a.y+(b.y-a.y)*t;}}if(t>=1)motion.from.clear();return true;}
    async function send(action,payload={}){
      if(!view||!own()){api.setMessage('Partnerkarte · Nur anschauen.');return false;}
      try{await client.send(action,payload);api.commandAccepted?.(action,payload);return true;}catch(error){api.setMessage(error.message);return false;}
    }
    function accept(switched=false){
      const next=match.boards[board].state;
      for(const key of ['selectedSlot','selectedTower','selectedBuilding','selectedCard','rotation','hoveredPlacement'])delete next[key];
      next.wavePlans??=[];next.rescueCard??=null;next.tunnelOffer??=null;next.drawPile??=[];next.discard??=[];next.runTowerStats??={};next.runTowerDetails??={};next.goldEarned??={kills:0,completion:0,income:0};next.waveKills??=0;next.pendingSpawns??=0;
      next.duoReinforcement=view.reinforcements[board];next.duoMode=true;next.showSlotHints=api.getState().showSlotHints;next.showHexGrid=api.getState().showHexGrid;next.consumablesLocked=!own()||view.ready[view.player]||view.connection.paused;next.challengeDay=null;next.biomeSeed=null;
      if(!switched)mergeBoard(api.getState(),next);
      track(next,switched);api.accept(next,switched,profileChanged);profileChanged=false;
      if(!own()){api.reward(null);$('celebration').classList.add('hidden');return;}
      if(view.result){const result=view.result;api.reward({description:(result.outcome==='victory'?'Gemeinsam geschafft!':'Gemeinsam gekämpft.')+' Welle '+result.wave+' · '+result.players[view.player].diamonds+' Diamanten',choices:[{label:view.rematch?.[view.player]?'Neustart-Zustimmung zurücknehmen':'Noch eine gemeinsame Partie'},{label:'Zur Lobby'}]},'result');}
      else if(next.phase==='duoDelivery'){const offer=view.delivery?.offers[view.player];api.reward(offer?.index===null?{...offer,skippable:false}:null,'delivery');}
      else api.reward(next.rewardOffer,'reward');
      $('celebration').classList.toggle('hidden',!next.celebrationActive);
      if(next.celebrationActive){$('celebrationTitle').textContent=next.activeCelebration.bosses?'Die Wächter sind gefallen!':'Gemeinsam geschafft!';$('celebrationWave').textContent='Welle '+next.activeCelebration.wave+' überlebt';$('celebrationText').textContent=next.activeCelebration.messages.join(' · ');}
    }
    function switchBoard(index){if(!match||index===board)return;board=index;picking=null;guardianKey='';accept(true);}
    function render(){
      if(!view)return;
      const state=api.getState(),player=view.player,partner=1-player,readonly=!own(),locked=readonly||view.ready[player]||view.connection.paused,help=guide(view,board);
      $('runDiamonds').textContent=view.result?'(+0)':readonly?'':'(+'+(state.duoDiamondEstimate||0)+')';
      for(const id of ['duoHud','duoMapLabel','duoQuickMap','duoTurn'])$(id).classList.remove('hidden');
      $('duoQuickMap').textContent=readonly?'⇄ Zurück zu meiner Karte':'⇄ Partnerkarte ansehen';
      $('duoMapLabel').textContent=readonly?'Partnerkarte · Nur anschauen':'Deine Festung';
      $('duoOwnMap').setAttribute('aria-pressed',String(!readonly));$('duoPartnerMap').setAttribute('aria-pressed',String(readonly));
      // Team bar: both seats, shared wave/lives and the one thing to do next.
      $('duoTurn').dataset.tone=help.tone;$('duoTurn').classList.toggle('duoTurnPartnerView',readonly);
      $('duoSeatSelf').dataset.state=help.self.state;$('duoSeatSelfText').textContent=help.self.text;
      $('duoSeatPartner').dataset.state=help.partner.state;$('duoSeatPartnerText').textContent=help.partner.text;
      $('duoTeamWave').textContent=view.phase==='combat'?'Welle '+view.wave:view.wave?'Vor Welle '+(view.wave+1):'Vorbereitung';$('duoTeamHp').textContent='♥ '+view.hp+'/'+view.maxHp+' gemeinsam';
      $('duoTurnTitle').textContent=help.title;$('duoTurnText').textContent=help.text;
      document.body.classList.toggle('duoLocked',locked);
      const status='Partner '+help.partner.text;$('duoSummary').textContent='Duo · '+status;$('duoPartnerStatus').textContent=status;
      const portal=view.portals[player],tower=view.reinforcements[player];
      $('duoSupportInfo').textContent='Schaffst du eine Welle ohne Lebensverlust, fliegt eine Kopie deiner Verstärkung auf das Portal deines Partners und hilft ihm bis zum Wellenende. Umgekehrt landet seine Hilfe auf deinem Portal. Alle 5 Wellen schenkt ihr euch zusätzlich etwas.';
      $('duoPortalState').textContent=portal?'Hex '+portal.q+','+portal.r+' · Platz '+(portal.index+1):'Noch nicht gesetzt – ein freier Turmplatz auf deiner Karte';
      const towerType=tower&&match.boards[player].state.map.get(tower.q+','+tower.r)?.towers[tower.index]?.type;
      $('duoTowerState').textContent=tower?(towerType&&HexData.TOWERS[towerType]?.name||'Turm')+' auf Hex '+tower.q+','+tower.r:'Noch nicht gewählt – einer deiner Türme';
      for(const id of ['buySpikes','buyResin','buyOverload'])if(locked)$(id).disabled=true;
      $('duoReservePortal').disabled=locked||view.phase!=='prepare';
      $('duoSendTower').disabled=locked||view.phase!=='prepare';
      $('duoClearPortal').disabled=locked||view.phase!=='prepare'||!portal;$('duoClearTower').disabled=locked||view.phase!=='prepare'||!tower;
      $('startWaveBtn').disabled=readonly||view.connection.paused||state.phase!=='build'||state.celebrationActive;
      $('startWaveBtn').classList.toggle('duoReadyOn',!readonly&&!!view.ready[player]);
      $('startWaveBtn').textContent=readonly?'Partnerkarte · Nur anschauen':view.connection.paused?'Pausiert · Partner fehlt':state.phase==='place'?'Zuerst Hex legen':state.phase==='duoDelivery'?'Geschenk für den Partner wählen':state.phase==='duoWait'?'Warte auf deinen Partner':state.phase==='wave'?'Gemeinsame Welle läuft':view.ready[player]?'Bereit ✓ · zurücknehmen':view.ready[partner]?'Bereit – Partner wartet (Leertaste)':'Bereit für die Welle (Leertaste)';
      $('doubleSpeed').value=String(view.speed||1);$('speedValue').textContent=(view.speed||1)+'×';$('pauseBtn').textContent=view.paused?'▶ Gemeinsam fortsetzen (P)':'⏸ Pause (P)';
      for(const id of ['doubleSpeed','pauseBtn'])$(id).disabled=readonly||view.connection.paused;
      for(const button of document.querySelectorAll('#hand button'))button.disabled=locked;
      if(locked)for(const selector of ['#towerMenu button','#towerUpgrades button','#towerUpgrades select','#buildingOptions button','#quickLoadout button','#hand button'])for(const button of document.querySelectorAll(selector))button.disabled=true;
      for(const id of ['sellTowerBtn','sellBuildingBtn','baseWallsBtn','baseWeaponBtn'])if(locked)$(id).disabled=true;
      $('autoStart').disabled=true;$('restartTutorialBtn').disabled=true;
      const selected=state.selectedTower&&state.map.get(state.selectedTower.q+','+state.selectedTower.r)?.towers[state.selectedTower.index];if(selected?.guestOwner!==undefined)for(const button of document.querySelectorAll('#towerUpgrades button,#towerUpgrades select'))button.disabled=true;
      const gkey=JSON.stringify([view.boards.map(b=>b.landmarks),locked,view.phase]);if(gkey!==guardianKey){guardianKey=gkey;const box=$('duoGuardians');box.replaceChildren();if(view.phase==='prepare')view.boards.forEach((b,i)=>b.landmarks.forEach(l=>{if(l.type!=='boss'||!l.claimed||!Array.isArray(l.consent)||!['pending','ready'].includes(l.status))return;const button=document.createElement('button');button.textContent='Wächter · Karte '+(i+1)+' · '+l.consent.filter(Boolean).length+'/2 bereit';button.disabled=locked;button.addEventListener('click',()=>send('guardian',{board:i,id:l.q+','+l.r,value:!l.consent[player]}));box.appendChild(button);}));$('duoGuardianSection').classList.toggle('hidden',!box.children.length);}
      const transfer=JSON.stringify([view.wave,view.pendingHelp]);if(transfer!==transferKey){transferKey=transfer;const incoming=view.pendingHelp[partner],outgoing=view.pendingHelp[player];if(incoming||outgoing){const sender=incoming?partner:player,slot=view.reinforcements[sender],type=slot&&match.boards[sender].state.map.get(slot.q+','+slot.r)?.towers[slot.index]?.type;$('duoTransfer').textContent=incoming?'➶ Partnerverstärkung ist unterwegs!':'➶ Deine Verstärkung fliegt zum Partner!';if(type){const icon=document.createElement('span');icon.innerHTML=HexArsenal.icon(type,HexData.TOWERS[type].color);$('duoTransfer').appendChild(icon);}$('duoTransfer').classList.remove('hidden');$('duoTransfer').getAnimations?.().forEach(a=>a.cancel());if(!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)$('duoTransfer').animate?.([{opacity:0,transform:'translate(-65%,10px)'},{opacity:1,transform:'translate(-50%,0)'},{opacity:0,transform:'translate(-35%,-18px)'}],{duration:1800,fill:'forwards'});}else $('duoTransfer').classList.add('hidden');}
    }
    document.querySelector('.dockTL')?.appendChild($('duoHud'));
    function pickSupport(kind,slot){if(!picking||picking!==kind)return false;const tile=api.getState().map.get(slot.q+','+slot.r);if(kind==='tower'&&tile?.towers?.[slot.index]?.guestOwner!==undefined){api.setMessage('Wähle einen eigenen Turm, keine Partnerverstärkung.');return true;}picking=null;send(kind==='tower'?'reinforcement':'portal',{slot});return true;}
    function beginSupport(kind){const state=api.getState(),slot=kind==='tower'?state.selectedTower:state.selectedSlot;if(slot){send(kind==='tower'?'reinforcement':'portal',{slot});return;}picking=picking===kind?null:kind;$('duoHud').open=false;globalThis.HexCompact?.open('');api.setMessage(picking?(kind==='tower'?'Verstärkung: Klicke jetzt einen eigenen Turm an. Escape bricht ab.':'Partnerportal: Klicke jetzt einen freien Turmplatz an. Escape bricht ab.'):'Auswahl abgebrochen.');}
    document.addEventListener('keydown',e=>{if(e.key==='Escape')picking=null;});
    const bridge={animate,pickSupport,render,send,offerKey:null,ready:()=>send('ready',{value:!view?.ready[view.player]}),pause:()=>send('pause',{value:!view?.paused}),async priorities(packets){for(const packet of packets)if(!await send('targetPriority',packet))break;},choose(kind,offer,index){if(kind==='result'){if(index===1)location.assign('/duo-lobby.html');else send('rematch',{value:!view.rematch?.[view.player]});}else send(kind==='delivery'?'delivery':'reward',{offerId:offer.id,index});}};
    $('duoQuickMap').addEventListener('click',()=>switchBoard(own()?1-view.player:view.player));
    $('duoOwnMap').addEventListener('click',()=>switchBoard(view.player));$('duoPartnerMap').addEventListener('click',()=>switchBoard(1-view.player));
    $('duoReservePortal').addEventListener('click',()=>beginSupport('slot'));$('duoSendTower').addEventListener('click',()=>beginSupport('tower'));$('duoClearPortal').addEventListener('click',()=>send('portal',{slot:null}));$('duoClearTower').addEventListener('click',()=>send('reinforcement',{slot:null}));
    $('duoLeave').addEventListener('click',async()=>{if(!leaving){leaving=true;$('duoLeave').textContent='Wirklich verlassen? Partie endet für beide.';return;}try{await client.leave();forget();location.replace('/duo-lobby.html');}catch(e){api.setMessage(e.message);}});
    function forget(){try{if(localStorage.getItem('autohex-duo-session')===api.token)localStorage.removeItem('autohex-duo-session');}catch{}}
    $('duoTakeover').addEventListener('click',()=>client.takeover().catch(e=>api.setMessage(e.message)));
    document.addEventListener('click',e=>{if(!e.target.closest('#duoHud'))$('duoHud').open=false;});
    client=HexDuoClient.create({token:api.token,clientId,onStatus:(text,session)=>{if(session?.invalid){forget();location.replace('/duo-lobby.html#session='+api.token);return;}$('duoNetworkStatus').textContent=text;$('duoTakeover').classList.toggle('hidden',!session?.conflict);},onView:next=>{
      if(!next.lobbyState?.started){client.stop();location.replace('/duo-lobby.html#session='+api.token);return;}
      const first=!view;view=next;match=HexDuoClient.presentation(next,match);board??=next.player;
      const receipts=JSON.stringify((next.settlements||[]).map(r=>r.id));if(receipts!==settledKey)try{let profile=HexProfile.load(HexData.TOWERS);for(const receipt of next.settlements||[])profile=HexProfile.settleDuo(profile,receipt,HexData.TOWERS);settledKey=receipts;profileChanged=true;}catch{api.setMessage('Spielstand konnte noch nicht gespeichert werden.');}
      accept(first);
    }});
    globalThis.addEventListener('pagehide',()=>client.stop());client.start();return bridge;
  }
  return {mount,mergeBoard,guide,seatStatus};
})();
if(typeof module!=='undefined')module.exports=HexDuoGame;
