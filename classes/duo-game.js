/* Adapter for the SINGLEPLAYER game screen. Only the server changes gameplay. */
const HexDuoGame=(()=>{
  function mergeBoard(previous,next){
    // Preserve identity of unchanged selections/previews across 10 Hz snapshots.
    for(const [key,tile] of next.map){const old=previous.map?.get(key);if(!old)continue;
      tile.towers=tile.towers.map((tower,i)=>{const before=old.towers?.[i];if(tower&&before&&tower.statId===before.statId&&tower.type===before.type){Object.assign(before,tower);return before;}return tower;});
      tile.buildings=(tile.buildings||[]).map((building,i)=>{const before=old.buildings?.[i];if(building&&before&&building.type===before.type){Object.assign(before,building);return before;}return building;});
    }
    return next;
  }
  function mount(api){
    const $=id=>document.getElementById(id);let view=null,match=null,board=null,transferKey='',guardianKey='',leaving=false,client;
    const storageKey='autohex-duo-client:'+api.token;let clientId=sessionStorage.getItem(storageKey);if(!clientId){clientId=crypto.randomUUID();sessionStorage.setItem(storageKey,clientId);}
    const own=()=>view&&board===view.player;
    async function send(action,payload={}){
      if(!view||!own()){api.setMessage('Partnerkarte · Nur anschauen.');return false;}
      try{await client.send(action,payload);api.commandAccepted?.(action,payload);return true;}catch(error){api.setMessage(error.message);return false;}
    }
    function accept(switched=false){
      const next=match.boards[board].state;
      for(const key of ['selectedSlot','selectedTower','selectedBuilding','selectedCard','rotation','hoveredPlacement'])delete next[key];
      next.wavePlans??=[];next.rescueCard??=null;next.tunnelOffer??=null;next.drawPile??=[];next.discard??=[];next.runTowerStats??={};next.runTowerDetails??={};next.goldEarned??={kills:0,completion:0,income:0};next.waveKills??=0;next.pendingSpawns??=0;
      next.duoReinforcement=view.reinforcements[board];next.duoMode=true;next.showSlotHints=api.getState().showSlotHints;next.showHexGrid=api.getState().showHexGrid;next.challengeDay=null;next.biomeSeed=null;
      if(!switched)mergeBoard(api.getState(),next);
      api.accept(next,switched);
      if(!own()){api.reward(null);$('celebration').classList.add('hidden');return;}
      if(view.result){const result=view.result;api.reward({description:(result.outcome==='victory'?'Gemeinsam geschafft!':'Gemeinsam gekämpft.')+' Welle '+result.wave+' · '+result.players[view.player].diamonds+' Diamanten',choices:[{label:view.rematch?.[view.player]?'Neustart-Zustimmung zurücknehmen':'Noch eine gemeinsame Partie'},{label:'Zur Lobby'}]},'result');}
      else if(next.phase==='duoDelivery'){const offer=view.delivery?.offers[view.player];api.reward(offer?.index===null?{...offer,skippable:false}:null,'delivery');}
      else api.reward(next.rewardOffer,'reward');
      $('celebration').classList.toggle('hidden',!next.celebrationActive);
      if(next.celebrationActive){$('celebrationTitle').textContent=next.activeCelebration.bosses?'Die Wächter sind gefallen!':'Gemeinsam geschafft!';$('celebrationWave').textContent='Welle '+next.activeCelebration.wave+' überlebt';$('celebrationText').textContent=next.activeCelebration.messages.join(' · ');}
    }
    function switchBoard(index){if(!match||index===board)return;board=index;guardianKey='';accept(true);}
    function render(){
      if(!view)return;
      const state=api.getState(),player=view.player,partner=1-player,readonly=!own(),locked=readonly||view.ready[player]||view.connection.paused;
      $('runDiamonds').textContent=view.result?'(+0)':readonly?'':'(+'+(state.duoDiamondEstimate||0)+')';$('duoHud').classList.remove('hidden');$('duoMapLabel').classList.remove('hidden');
      $('duoMapLabel').textContent=readonly?'Partnerkarte · Nur anschauen':'Deine Festung';
      $('duoOwnMap').setAttribute('aria-pressed',String(!readonly));$('duoPartnerMap').setAttribute('aria-pressed',String(readonly));
      const partnerPhase=match.boards[partner].state.phase,phaseNames={place:'legt ein Hex',build:'baut',wave:'kämpft',duoWait:'hat die Welle geschafft',duoDelivery:'wählt ein Geschenk',reward:'wählt eine Karte',removal:'dünnt das Deck aus',bossReward:'wählt Beute',shrineReward:'wählt einen Segen'};
      const status=view.ready[partner]?'Partner ist bereit ✓':'Partner '+(phaseNames[partnerPhase]||'wartet');$('duoSummary').textContent='Duo · '+status;$('duoPartnerStatus').textContent=status;
      const portal=view.portals[player],tower=view.reinforcements[player];$('duoSupportInfo').textContent=(portal?'Partner-Portal reserviert. ':'Reserviere einen freien Turmplatz für Partnerhilfe. ')+(tower?'Verstärkung ausgewählt: Hex '+tower.q+','+tower.r+'.':'Wähle einen eigenen Turm als Verstärkung.')+' Nach einer verlustfreien Welle hilft eine Kopie beim Partner. Sein Portal muss frei sein. Alle 5 Wellen wählt ihr ein Geschenk füreinander.';
      $('duoReservePortal').disabled=locked||view.phase!=='prepare'||!state.selectedSlot;
      $('duoSendTower').disabled=locked||view.phase!=='prepare'||!state.selectedTower||state.map.get(state.selectedTower.q+','+state.selectedTower.r)?.towers[state.selectedTower.index]?.guestOwner!==undefined;
      $('duoClearPortal').disabled=locked||view.phase!=='prepare'||!portal;$('duoClearTower').disabled=locked||view.phase!=='prepare'||!tower;
      $('startWaveBtn').disabled=readonly||view.connection.paused||state.phase!=='build'||state.celebrationActive;
      $('startWaveBtn').textContent=readonly?'Partnerkarte · Nur anschauen':state.phase==='place'?'Zuerst Hex legen':state.phase==='duoDelivery'?'Geschenk für den Partner wählen':state.phase==='duoWait'?'Warte auf deinen Partner':state.phase==='wave'?'Gemeinsame Welle läuft':view.ready[player]?'Bereitschaft zurücknehmen':'Bereit für die Welle (Leertaste)';
      $('doubleSpeed').value=String(view.speed||1);$('speedValue').textContent=(view.speed||1)+'×';$('pauseBtn').textContent=view.paused?'▶ Gemeinsam fortsetzen (P)':'⏸ Pause (P)';
      for(const id of ['doubleSpeed','pauseBtn'])$(id).disabled=readonly||view.connection.paused;
      for(const button of document.querySelectorAll('#hand button'))button.disabled=locked;
      if(locked)for(const selector of ['#towerMenu button','#towerUpgrades button','#towerUpgrades select','#buildingOptions button','#quickLoadout button','#hand button'])for(const button of document.querySelectorAll(selector))button.disabled=true;
      for(const id of ['sellTowerBtn','sellBuildingBtn','baseWallsBtn','baseWeaponBtn'])if(locked)$(id).disabled=true;
      $('autoStart').disabled=true;$('restartTutorialBtn').disabled=true;
      const selected=state.selectedTower&&state.map.get(state.selectedTower.q+','+state.selectedTower.r)?.towers[state.selectedTower.index];if(selected?.guestOwner!==undefined)for(const button of document.querySelectorAll('#towerUpgrades button,#towerUpgrades select'))button.disabled=true;
      const gkey=JSON.stringify([view.boards.map(b=>b.landmarks),locked,view.phase]);if(gkey!==guardianKey){guardianKey=gkey;const box=$('duoGuardians');box.replaceChildren();if(view.phase==='prepare')view.boards.forEach((b,i)=>b.landmarks.forEach(l=>{if(l.type!=='boss'||!l.claimed||!Array.isArray(l.consent)||!['pending','ready'].includes(l.status))return;const button=document.createElement('button');button.textContent='Wächter · Karte '+(i+1)+' · '+l.consent.filter(Boolean).length+'/2 bereit';button.disabled=locked;button.addEventListener('click',()=>send('guardian',{board:i,id:l.q+','+l.r,value:!l.consent[player]}));box.appendChild(button);}));}
      const transfer=JSON.stringify([view.wave,view.pendingHelp]);if(transfer!==transferKey){transferKey=transfer;const incoming=view.pendingHelp[partner],outgoing=view.pendingHelp[player];if(incoming||outgoing){const sender=incoming?partner:player,slot=view.reinforcements[sender],type=slot&&match.boards[sender].state.map.get(slot.q+','+slot.r)?.towers[slot.index]?.type;$('duoTransfer').textContent=incoming?'➶ Partnerverstärkung ist unterwegs!':'➶ Deine Verstärkung fliegt zum Partner!';if(type){const icon=document.createElement('span');icon.innerHTML=HexArsenal.icon(type,HexData.TOWERS[type].color);$('duoTransfer').appendChild(icon);}$('duoTransfer').classList.remove('hidden');$('duoTransfer').getAnimations?.().forEach(a=>a.cancel());if(!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)$('duoTransfer').animate?.([{opacity:0,transform:'translate(-65%,10px)'},{opacity:1,transform:'translate(-50%,0)'},{opacity:0,transform:'translate(-35%,-18px)'}],{duration:1800,fill:'forwards'});}else $('duoTransfer').classList.add('hidden');}
    }
    document.querySelector('.dockTL')?.appendChild($('duoHud'));
    const bridge={render,send,offerKey:null,ready:()=>send('ready',{value:!view?.ready[view.player]}),pause:()=>send('pause',{value:!view?.paused}),async priorities(packets){for(const packet of packets)if(!await send('targetPriority',packet))break;},choose(kind,offer,index){if(kind==='result'){if(index===1)location.assign('/duo-lobby.html');else send('rematch',{value:!view.rematch?.[view.player]});}else send(kind==='delivery'?'delivery':'reward',{offerId:offer.id,index});}};
    $('duoOwnMap').addEventListener('click',()=>switchBoard(view.player));$('duoPartnerMap').addEventListener('click',()=>switchBoard(1-view.player));
    $('duoReservePortal').addEventListener('click',()=>send('portal',{slot:api.getState().selectedSlot}));$('duoSendTower').addEventListener('click',()=>send('reinforcement',{slot:api.getState().selectedTower}));$('duoClearPortal').addEventListener('click',()=>send('portal',{slot:null}));$('duoClearTower').addEventListener('click',()=>send('reinforcement',{slot:null}));
    $('duoLeave').addEventListener('click',async()=>{if(!leaving){leaving=true;$('duoLeave').textContent='Wirklich verlassen? Partie endet für beide.';return;}try{await client.leave();location.replace('/duo-lobby.html');}catch(e){api.setMessage(e.message);}});
    $('duoTakeover').addEventListener('click',()=>client.takeover().catch(e=>api.setMessage(e.message)));
    document.addEventListener('click',e=>{if(!e.target.closest('#duoHud'))$('duoHud').open=false;});
    client=HexDuoClient.create({token:api.token,clientId,onStatus:(text,session)=>{$('duoNetworkStatus').textContent=text;$('duoTakeover').classList.toggle('hidden',!session?.conflict);},onView:next=>{
      if(!next.lobbyState?.started){client.stop();location.replace('/duo-lobby.html#session='+api.token);return;}
      const first=!view;view=next;match=HexDuoClient.presentation(next,match);board??=next.player;
      try{let profile=HexProfile.load(HexData.TOWERS);for(const receipt of next.settlements||[])profile=HexProfile.settleDuo(profile,receipt,HexData.TOWERS);}catch{api.setMessage('Spielstand konnte noch nicht gespeichert werden.');}
      accept(first);
    }});
    globalThis.addEventListener('pagehide',()=>client.stop());client.start();return bridge;
  }
  return {mount,mergeBoard};
})();
if(typeof module!=='undefined')module.exports=HexDuoGame;
