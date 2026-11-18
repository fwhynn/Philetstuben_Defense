/* Adapter for the SINGLEPLAYER game screen. Only the server changes gameplay. */
const HexDuoGame=(()=>{
  // Follow only already traversed server path segments; never cut across a bend.
  function prepareRoad(start, end) {
    const points=end.motionPath;
    if(!Array.isArray(points)||points.length<2||end.leaping)return null;
    let best=null;
    for(let i=0;i<points.length-1;i++){
      const a=points[i],b=points[i+1],dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy;
      const u=l2?Math.max(0,Math.min(1,((start.x-a.x)*dx+(start.y-a.y)*dy)/l2)):0;
      const x=a.x+u*dx,y=a.y+u*dy,d=Math.hypot(start.x-x,start.y-y);
      if(!best||d<=best.d+1e-7)best={i,x,y,d};
    }
    if(!best||best.d>2)return null;
    const path=[{x:best.x,y:best.y},...points.slice(best.i+1)];
    const lengths=[];
    let total=0;
    for(let i=1;i<path.length;i++){
      const length=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);
      total+=length;lengths.push(length);
    }
    return {path,lengths,total};
  }
  function motionAlongRoad(start,end,t,cache){
    let road;
    if(cache?.has(end)&&cache.get(end).start===start)road=cache.get(end).road;
    else {
      road=prepareRoad(start,end);
      cache?.set(end,{start,road});
    }
    if(road){
      let distance=road.total*Math.max(0,Math.min(1,t));
      for(let i=0;i<road.lengths.length;i++){
        const length=road.lengths[i];
        if(length&&distance<=length){
          const a=road.path[i],b=road.path[i+1],u=distance/length;
          return {x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u};
        }
        distance-=length;
      }
    }
    return {x:end.x,y:end.y};
  }
  // Render a short history, rather than restarting an ease-out on every packet.
  function createMotionBuffer(delay=150,{adaptive=false}={}){
    const roads=new WeakMap();
    let frames=[],offset=null,lastTarget=-Infinity,lastDraw=null,bufferDelay=delay;
    function push(enemies,stamp,now,reset=false){
      if(reset||frames.length&&stamp<frames.at(-1).at||frames.length&&now-frames.at(-1).arrival>1000){frames=[];offset=null;lastTarget=-Infinity;lastDraw=null;bufferDelay=delay;}
      // Commands and heartbeats can repeat a simulation frame. They must not
      // overwrite its history with a rendered position or re-estimate network jitter.
      if(frames.at(-1)?.at===stamp)return;
      offset=offset===null?now-stamp:Math.min(offset,now-stamp);
      const interval=frames.length?stamp-frames.at(-1).at:100;
      const required=Math.max(delay,Math.min(400,interval+50+Math.max(0,now-stamp-offset)));
      if(adaptive)bufferDelay=required>bufferDelay?required:Math.max(required,bufferDelay-1);
      const frame={at:stamp,arrival:now,enemies:new Map(enemies.map(e=>[e.id,{x:e.x,y:e.y,motionPath:e.motionPath,leaping:e.leaping}]))};
      frames.push(frame);
      if(frames.length>16)frames.shift();
    }
    function draw(enemies,now){
      if(!frames.length)return false;
      // Never let the playhead run past received data. Recover late packets at at most
      // 110% visual pace instead of jumping to the newest position in one frame.
      const desired=Math.min(frames.at(-1).at,now-offset-bufferDelay),elapsed=lastDraw===null?0:Math.max(0,now-lastDraw);
      // Absorb jitter by gently changing playback pace (90–110%), never by
      // reversing a unit or stopping it just to enlarge the presentation buffer.
      const target=lastTarget===-Infinity?desired:Math.min(frames.at(-1).at,lastTarget+Math.max(elapsed*.9,Math.min(elapsed*1.1,desired-lastTarget)));lastTarget=target;lastDraw=now;
      while(frames.length>2&&frames[1].at<=target)frames.shift();
      const a=frames[0],b=frames.find(f=>f.at>=target)||frames.at(-1),before=frames.filter(f=>f.at<=target).at(-1)||a;
      const t=b.at>before.at?Math.max(0,Math.min(1,(target-before.at)/(b.at-before.at))):1;
      let changed=false;for(const e of enemies){const x=e.x,y=e.y,start=before.enemies.get(e.id),end=b.enemies.get(e.id);if(start&&end)Object.assign(e,t>=1?{x:end.x,y:end.y}:motionAlongRoad(start,end,t,roads));else {const first=end||frames.find(f=>f.enemies.has(e.id))?.enemies.get(e.id);if(first)Object.assign(e,{x:first.x,y:first.y});}changed ||= x!==e.x||y!==e.y;}
      return changed;
    }
    return {push,draw};
  }
  function mergeBoard(previous,next){
    // Preserve identity of unchanged selections/previews across 10 Hz snapshots.
    for(const [key,tile] of next.map){const old=previous.map?.get(key);if(!old)continue;
      tile.towers=tile.towers.map((tower,i)=>{const before=old.towers?.[i];if(tower===before)return tower;if(tower&&before&&tower.statId===before.statId&&tower.type===before.type){delete before.overloadUntil;delete before.overloadPending;Object.assign(before,tower);return before;}return tower;});
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
    if(b.phase==='build'&&view.ready[own])return say('wait','Du bist bereit','Die Welle startet, sobald dein Partner bereit ist. Weiterbauen nimmt deine Bereitschaft automatisch zurück.');
    if(b.phase==='build')return say('act','Bauphase: Türme bauen',view.ready[partner]?'Dein Partner ist schon bereit und wartet auf dich. Wenn du fertig bist: »Bereit für die Welle« (Leertaste).':'Baue Türme auf freie Plätze. Wenn du fertig bist: »Bereit für die Welle« (Leertaste). Die Welle startet, sobald ihr beide bereit seid.');
    if(b.phase==='wave')return say('combat','Gemeinsame Welle läuft','Eure Türme kämpfen automatisch auf beiden Karten. Du kannst nebenbei weiter bauen.');
    if(b.phase==='duoWait')return say('wait','Deine Welle ist geschafft','Dein Partner kämpft noch. Danach geht es für euch beide weiter.',true);
    return say('wait','Einen Moment','Der nächste Schritt wird vorbereitet.',true);
  }
  function canAutoReady(board){
    return board?.phase==='build'&&!board.celebration&&!board.tunnelOffer&&!board.openingRemaining&&!board.rewardOffer;
  }
  function mount(api){
    const $=id=>document.getElementById(id);let profileChanged=true,view=null,match=null,board=null,transferKey='',guardianKey='',leaving=false,client,picking=null,pendingSpeed=null,speedRequest=0,networkOffline=false;
    let giftKey='',giftPreview=null,giftNoticeTimer=null;
    const giftReceipts=new Set();
    const storageKey='autohex-duo-client:'+api.token;let clientId=sessionStorage.getItem(storageKey);if(!clientId){clientId=crypto.randomUUID();sessionStorage.setItem(storageKey,clientId);}
    const own=()=>view&&board===view.player;
    // Enemies arrive ~10 times per second; glide between snapshots so combat does not stutter.
    const motion=createMotionBuffer(150,{adaptive:true});let settledKey='',motionKey='';
    function track(next,switched){const now=performance.now(),key=[view.serverId,view.wave,board,view.paused,view.connection.paused,next.waveRunning].join(':');motion.push(next.enemies||[],Number.isFinite(view.frameTime)?view.frameTime:now,now,switched||key!==motionKey);motionKey=key;motion.draw(next.enemies||[],now);}
    function animate(now){return motion.draw(api.getState().enemies||[],now);}
    async function send(action,payload={}){
      if(!view||!own()){api.setMessage('Partnerkarte · Nur anschauen.');return false;}
      try{await client.send(action,payload);api.commandAccepted?.(action,payload);return true;}catch(error){api.setMessage(error.message);return false;}
    }
    function accept(switched=false){
      const next=match.boards[board].state;
      for(const key of ['selectedSlot','selectedTower','selectedBuilding','selectedCard','rotation','hoveredPlacement'])delete next[key];
      next.wavePlans??=[];next.rescueCard??=null;next.tunnelOffer??=null;next.drawPile??=[];next.discard??=[];next.runTowerStats??={};next.runTowerDetails??={};next.goldEarned??={kills:0,completion:0,income:0};next.waveKills??=0;next.pendingSpawns??=0;
      // The HUD follows the player's payout on either board.
      next.duoDiamondEstimate=view.result?0:view.boards[view.player].duoDiamondEstimate||0;
      next.duoPartnerView=!own();next.duoReinforcement=view.reinforcements[board];next.duoMode=true;next.remoteMotionBuffered=true;next.showSlotHints=api.getState().showSlotHints;next.showHexGrid=api.getState().showHexGrid;next.consumablesLocked=!own()||view.connection.paused;next.challengeDay=null;next.biomeSeed=null;
      if(!switched)mergeBoard(api.getState(),next);
      track(next,switched);api.accept(next,switched,profileChanged);profileChanged=false;
      if(!own()){api.reward(null);$('celebration').classList.add('hidden');return;}
      if(view.result){const result=view.result;api.reward({ranking:{runId:result.id,mode:'duo',wave:result.wave,kills:view.boards.reduce((total,b)=>{const e=b.earnedMeta||{};return total+(e.normalKills||0)+(e.periodicBosses||0)+(e.explorationBosses||0);},0),ruleset:globalThis.AUTOHEX_VERSION||'unknown'},description:(result.outcome==='victory'?'Gemeinsam geschafft!':'Gemeinsam gekämpft.')+' Welle '+result.wave+' · '+result.players[view.player].diamonds+' Diamanten'+(result.outcome==='victory'?' · Endlos startet erst, wenn ihr beide zustimmt. · '+(view.endlessVotes||[]).filter(Boolean).length+'/2 bereit':''),choices:[...(result.outcome==='victory'?[{label:view.endlessVotes?.[view.player]?'Endlos-Zustimmung zurücknehmen':view.endlessVotes?.[1-view.player]?'Endlos weiterspielen · Partner wartet':'Gemeinsam endlos weiterspielen'}]:[]),{label:view.rematch?.[view.player]?'Neustart-Zustimmung zurücknehmen':'Noch eine gemeinsame Partie'},{label:'Zur Lobby'}]},'result');}
      else if(next.phase==='duoDelivery'){const offer=view.delivery?.offers[view.player];api.reward(offer?{...offer,skippable:false,sent:offer.index!==null}:null,'delivery');}
      else api.reward(next.rewardOffer,'reward');
      renderGifts();
      $('celebration').classList.toggle('hidden',!next.celebrationActive);
      if(next.celebrationActive){$('celebrationTitle').textContent=next.activeCelebration.bosses?'Die Wächter sind gefallen!':'Gemeinsam geschafft!';$('celebrationWave').textContent='Welle '+next.activeCelebration.wave+' überlebt';$('celebrationText').textContent=next.activeCelebration.messages.join(' · ');}
    }
    function switchBoard(index){if(!match||index===board)return;board=index;picking=null;guardianKey='';accept(true);}
    const describeGift=choice=>choice?.kind==='gold'?'+'+choice.amount+' Gold':HexData.CARD_LIBRARY[choice?.cardId]?.name||'Karte';
    function giftIcon(choice,className){
      const icon=document.createElement('span');icon.className=className;icon.setAttribute('aria-hidden','true');
      const card=HexData.CARD_LIBRARY[choice?.cardId];
      if(card){const art=api.cardElement(card.id,false).querySelector?.('svg');if(art){icon.appendChild(art.cloneNode(true));return icon;}}
      const glyph=document.createElement('span');glyph.className='hxi hxi-'+(choice.kind==='gold'?'coin':'deck');icon.appendChild(glyph);return icon;
    }
    function notifyGifts(previous){
      const partner=1-view.player,offer=view.delivery?.offers?.[partner],paid=view.hexGifts?.[partner],events=[];
      if(offer?.index!=null)events.push({id:view.epoch+':delivery:'+offer.id+':'+view.delivery.wave,choice:offer.choices[offer.index],recent:view.boards[view.player].phase==='duoDelivery'});
      if(paid)events.push({id:view.epoch+':hex:'+paid.count,choice:{kind:'card',cardId:paid.cardId},recent:false});
      const fresh=events.filter(e=>!giftReceipts.has(e.id));for(const e of events)giftReceipts.add(e.id);
      const shown=fresh.filter(e=>previous||e.recent);if(!shown.length)return;
      const notice=$('duoGiftNotice'),content=$('duoGiftNoticeContent');content.replaceChildren();
      for(const e of shown){const item=document.createElement('div');item.className='duoGiftNoticeItem';item.appendChild(giftIcon(e.choice,'duoGiftNoticeIcon'));
        const text=document.createElement('div'),title=document.createElement('strong'),detail=document.createElement('span');title.textContent=describeGift(e.choice);
        detail.textContent=e.choice.kind==='gold'?'Deinem Gold gutgeschrieben':'Deinem Deck hinzugefügt';text.appendChild(title);text.appendChild(detail);item.appendChild(text);content.appendChild(item);}
      $('duoGiftNoticeTitle').textContent='Geschenk von '+(view.lobbyState?.names?.[partner]||'deinem Partner');notice.classList.remove('hidden');
      clearTimeout(giftNoticeTimer);giftNoticeTimer=setTimeout(()=>notice.classList.add('hidden'),8000);
    }
    function renderGifts(){
      const delivery=view.delivery,partnerOffer=delivery?.offers?.[1-view.player],ownOffer=delivery?.offers?.[view.player];
      const key=JSON.stringify([delivery,api.getState().phase,board,view.connection.paused]);if(key===giftKey)return;giftKey=key;
      giftPreview=$('duoGiftPreview');giftPreview.replaceChildren();giftPreview.classList.add('hidden');$('duoGiftHistory').replaceChildren();
      $('duoGifts').classList.toggle('hidden',!delivery);$('duoGiftReceived').classList.toggle('hidden',!partnerOffer||partnerOffer.index===null);
      if(!delivery)return;
      const describe=describeGift;
      const received=partnerOffer?.index!==null&&partnerOffer?.index!==undefined?partnerOffer.choices?.[partnerOffer.index]:null;
      const receipt=received?'Vom Partner erhalten: '+describe(received)+' · Welle '+delivery.wave:'Dein Partner hat noch kein Geschenk gewählt.';
      $('duoGiftReceived').textContent=receipt;
      function fill(box){
        const status=document.createElement('p');status.className='duoGiftReceipt';status.textContent=receipt;box.appendChild(status);
        const title=document.createElement('strong');title.textContent=received?'Dein Partner hat dir geschenkt:':'Was möchtest du erhalten? Klicke deinen Wunsch an.';box.appendChild(title);
        const choices=document.createElement('div');choices.className='duoPartnerOffers';
        for(const [index,choice] of (partnerOffer?.choices||[]).entries()){
          const item=document.createElement('button');item.type='button';item.className='duoPartnerGift';item.classList.toggle('chosen',partnerOffer.index===index);item.classList.toggle('wished',partnerOffer.wish===index);
          item.disabled=!own()||api.getState().phase!=='duoDelivery'||partnerOffer.index!==null||!partnerOffer.id||view.connection.paused;
          item.setAttribute('aria-pressed',String(partnerOffer.wish===index));item.setAttribute('aria-label',describe(choice)+(partnerOffer.wish===index?' · Wunsch zurücknehmen':' · Als Wunsch markieren'));
          item.addEventListener('click',()=>{if(!item.disabled)send('deliveryWish',{offerId:partnerOffer.id,index:partnerOffer.wish===index?null:index});});
          item.appendChild(giftIcon(choice,'duoPartnerGiftIcon'));
          const name=document.createElement('strong');name.textContent=describe(choice);item.appendChild(name);
          const detail=document.createElement('small');detail.textContent=choice.cardId?HexData.CARD_LIBRARY[choice.cardId].desc:'Sofort verfügbares Gold';item.appendChild(detail);
          const selected=document.createElement('small');selected.className='duoWishLabel';selected.textContent=partnerOffer.index===index?'✓ Erhalten':partnerOffer.wish===index?'★ Dein Wunsch':partnerOffer.index===null?'Als Wunsch markieren':'';item.appendChild(selected);choices.appendChild(item);
        }
        box.appendChild(choices);const hint=document.createElement('p');hint.textContent=ownOffer&&ownOffer.index!==null?'Du hast verschenkt: '+describe(ownOffer.choices?.[ownOffer.index]):'Stimmt euch ab. Jeder wählt das Geschenk für den anderen.';box.appendChild(hint);
      }
      fill($('duoGiftHistory'));
      if(own()&&api.getState().phase==='duoDelivery'){giftPreview.classList.remove('hidden');fill(giftPreview);}
    }
    // Check the actual DOM value: other UI renderers may also update these nodes.
    function setText(element,value){const text=String(value);if(element.textContent!==text)element.textContent=text;}
    function render(){
      if(!view)return;
      renderGifts();
      const state=api.getState(),player=view.player,partner=1-player,readonly=!own(),locked=readonly||view.connection.paused,help=guide(view,board);
      for(const id of ['duoHud','duoMapLabel','duoQuickMap','duoTurn'])$(id).classList.remove('hidden');
      const partnerName=view.lobbyState?.names?.[partner]||'Partner';
      setText($('duoQuickMap'),readonly?'Meine Karte':'Partnerkarte');$('duoQuickMap').setAttribute('aria-label',readonly?'Zurück zu meiner Karte':'Partnerkarte ansehen');
      setText($('duoMapLabel'),readonly?'Partnerkarte':'Deine Karte');$('duoMapLabel').title=readonly?partnerName+' · Nur anschauen':'Deine Festung';document.body.classList.toggle('duoPartnerView',readonly);syncPause();
      $('duoOwnMap').setAttribute('aria-pressed',String(!readonly));$('duoPartnerMap').setAttribute('aria-pressed',String(readonly));
      // Team bar: both seats, shared wave/lives and the one thing to do next.
      $('duoTurn').dataset.tone=help.tone;$('duoTurn').classList.toggle('duoTurnPartnerView',readonly);
      $('duoSeatSelf').dataset.state=help.self.state;setText($('duoSeatSelfText'),help.self.text);
      $('duoSeatPartner').dataset.state=help.partner.state;setText($('duoSeatPartnerText'),help.partner.text);
      setText($('duoPartnerName'),partnerName);$('duoSeatPartner').title=partnerName+' · '+help.partner.text;$('duoSeatSelf').title='Du · '+help.self.text;
      setText($('duoTeamHp'),view.hp+'/'+view.maxHp);$('duoTeamHp').setAttribute('aria-label','Gemeinsame Leben: '+view.hp+'/'+view.maxHp);
      setText($('duoTurnTitle'),help.title);setText($('duoTurnText'),help.text);
      document.body.classList.toggle('duoLocked',locked);
      const status='Partner '+help.partner.text;setText($('duoSummary'),'Duo · '+status);setText($('duoPartnerStatus'),status);
      const portal=view.portals[player],tower=view.reinforcements[player];
      const gifts=view.hexGifts||[null,null],giftCost=75+(gifts[player]?.count||0)*25,canGift=!locked&&view.phase==='prepare'&&['place','build'].includes(state.phase)&&gifts[player]?.wave!==view.wave;
      setText($('duoHexGiftInfo'),giftCost+' Gold · Ein Hex pro Welle · Für das Deck deines Partners');
      for(const b of $('duoHexGiftChoices').children)b.disabled=!canGift||state.gold<giftCost;
      const incomingGift=gifts[partner];setText($('duoHexGiftReceipt'),incomingGift?'Vom Partner erhalten: '+HexData.CARD_LIBRARY[incomingGift.cardId].name+' · Vor Welle '+(incomingGift.wave+1):'');
      setText($('duoSupportInfo'),'Schaffst du eine Welle ohne Lebensverlust, fliegt eine Kopie deiner Verstärkung auf das Portal deines Partners und hilft ihm bis zum Wellenende. Umgekehrt landet seine Hilfe auf deinem Portal. Alle 5 Wellen schenkt ihr euch zusätzlich etwas.');
      setText($('duoPortalState'),portal?'Hex '+portal.q+','+portal.r+' · Platz '+(portal.index+1):'Noch nicht gesetzt – ein freier Turmplatz auf deiner Karte');
      const towerType=tower&&view.boards[player].map.find(t=>t.q===tower.q&&t.r===tower.r)?.towers[tower.index]?.type;
      setText($('duoTowerState'),tower?(towerType&&HexData.TOWERS[towerType]?.name||'Turm')+' auf Hex '+tower.q+','+tower.r:'Noch nicht gewählt – einer deiner Türme');
      for(const id of ['buySpikes','buyResin','buyOverload'])if(locked)$(id).disabled=true;
      $('duoReservePortal').disabled=locked||view.phase!=='prepare';
      $('duoSendTower').disabled=locked||view.phase!=='prepare';
      $('duoClearPortal').disabled=locked||view.phase!=='prepare'||!portal;$('duoClearTower').disabled=locked||view.phase!=='prepare'||!tower;
      $('startWaveBtn').disabled=readonly||view.connection.paused||state.phase!=='build'||state.celebrationActive;
      $('startWaveBtn').classList.toggle('duoReadyOn',!readonly&&!!view.ready[player]);
      setText($('startWaveBtn'),readonly?'Partnerkarte · Nur anschauen':view.connection.paused?'Pausiert · Partner fehlt':state.phase==='place'?'Zuerst Hex legen':state.phase==='duoDelivery'?'Geschenk für den Partner wählen':state.phase==='duoWait'?'Warte auf deinen Partner':state.phase==='wave'?'Gemeinsame Welle läuft':view.ready[player]?'Bereit ✓ · zurücknehmen':view.ready[partner]?'Bereit – Partner wartet (Leertaste)':'Bereit für die Welle (Leertaste)');if(globalThis.HexCompact?.touch?.())setText($('startWaveBtn'),$('startWaveBtn').textContent.replace(' (Leertaste)',''));
      const speed=pendingSpeed??view.speed??1;$('doubleSpeed').value=String(speed);$('doubleSpeed').style.setProperty?.('--fill',(speed-1)/7*100+'%');setText($('speedValue'),speed+'×');$('doubleSpeed').title='Gemeinsames Tempo für beide Karten';setText($('pauseBtn'),view.paused?'▶ Gemeinsam fortsetzen (P)':'⏸ Pause (P)');
      for(const id of ['doubleSpeed','pauseBtn'])$(id).disabled=readonly||view.connection.paused;
      for(const button of document.querySelectorAll('#hand button'))button.disabled=locked;
      if(locked)for(const selector of ['#towerMenu button','#towerUpgrades button','#towerUpgrades select','#buildingOptions button','#quickLoadout button','#hand button'])for(const button of document.querySelectorAll(selector))button.disabled=true;
      for(const id of ['sellTowerBtn','sellBuildingBtn','baseWallsBtn','baseWeaponBtn'])if(locked)$(id).disabled=true;
      $('restartTutorialBtn').disabled=true;
      const selected=state.selectedTower&&state.map.get(state.selectedTower.q+','+state.selectedTower.r)?.towers[state.selectedTower.index];if(selected?.guestOwner!==undefined)for(const button of document.querySelectorAll('#towerUpgrades button,#towerUpgrades select'))button.disabled=true;
      const gkey=JSON.stringify([view.boards.map(b=>b.landmarks),locked,view.phase]);if(gkey!==guardianKey){guardianKey=gkey;const box=$('duoGuardians');box.replaceChildren();if(view.phase==='prepare')view.boards.forEach((b,i)=>b.landmarks.forEach(l=>{if(l.type!=='boss'||!l.claimed||!Array.isArray(l.consent)||!['pending','ready'].includes(l.status))return;const button=document.createElement('button');button.textContent='Wächter · Karte '+(i+1)+' · '+l.consent.filter(Boolean).length+'/2 bereit';button.disabled=locked;button.addEventListener('click',()=>send('guardian',{board:i,id:l.q+','+l.r,value:!l.consent[player]}));box.appendChild(button);}));$('duoGuardianSection').classList.toggle('hidden',!box.children.length);}
      const transfer=JSON.stringify([view.wave,view.pendingHelp]);if(transfer!==transferKey){transferKey=transfer;const incoming=view.pendingHelp[partner],outgoing=view.pendingHelp[player];if(incoming||outgoing){const sender=incoming?partner:player,slot=view.reinforcements[sender],type=slot&&view.boards[sender].map.find(t=>t.q===slot.q&&t.r===slot.r)?.towers[slot.index]?.type;$('duoTransfer').textContent=incoming?'➶ Partnerverstärkung ist unterwegs!':'➶ Deine Verstärkung fliegt zum Partner!';if(type){const icon=document.createElement('span');icon.innerHTML=HexArsenal.icon(type,HexData.TOWERS[type].color);$('duoTransfer').appendChild(icon);}$('duoTransfer').classList.remove('hidden');$('duoTransfer').getAnimations?.().forEach(a=>a.cancel());if(!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)$('duoTransfer').animate?.([{opacity:0,transform:'translate(-65%,10px)'},{opacity:1,transform:'translate(-50%,0)'},{opacity:0,transform:'translate(-35%,-18px)'}],{duration:1800,fill:'forwards'});}else $('duoTransfer').classList.add('hidden');}
    }
    for(const cardId of ['straight','smallCurve','bigCurve']){const b=api.cardElement(cardId,false);b.addEventListener('click',()=>send('giftHex',{cardId}));$('duoHexGiftChoices').appendChild(b);}
    // Move the real controls, retaining disclosure handlers and live wave progress.
    $('duoPhaseSlot').appendChild($('waveDropdown'));
    $('duoSupportMenu').appendChild($('duoHud'));
    function pickSupport(kind,slot){if(!picking||picking!==kind)return false;const tile=api.getState().map.get(slot.q+','+slot.r);if(kind==='tower'&&tile?.towers?.[slot.index]?.guestOwner!==undefined){api.setMessage('Wähle einen eigenen Turm, keine Partnerverstärkung.');return true;}picking=null;send(kind==='tower'?'reinforcement':'portal',{slot});return true;}
    function beginSupport(kind){const state=api.getState(),slot=kind==='tower'?state.selectedTower:state.selectedSlot;if(slot){send(kind==='tower'?'reinforcement':'portal',{slot});return;}picking=picking===kind?null:kind;$('duoHud').open=false;globalThis.HexCompact?.open('');api.setMessage(picking?(kind==='tower'?'Verstärkung: Klicke jetzt einen eigenen Turm an. Escape bricht ab.':'Partnerportal: Klicke jetzt einen freien Turmplatz an. Escape bricht ab.'):'Auswahl abgebrochen.');}
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){picking=null;if($('duoHud').open){$('duoHud').open=false;$('duoSupportShortcut').focus?.();}}});
    function syncPause(){const blocked=networkOffline||view?.connection?.paused,app=$('app');app.classList.toggle('paused',blocked||!!view?.paused);app.classList.toggle('duoDisconnected',!!blocked);app.dataset.pauseMessage=networkOffline?'Verbindung unterbrochen · Wiederverbinden …':view?.connection?.maintenance?'Serverwartung · Eure Partie ist pausiert.':view?.connection?.expired?'Partner nicht zurückgekehrt · Partie pausiert.':blocked?'Warte auf Partner · Verbindung unterbrochen. Warte, bis er wieder beitritt …':'Pause';}
    async function setSpeed(value){const serial=++speedRequest;pendingSpeed=value;render();try{return await send('speed',{value});}finally{if(serial===speedRequest){pendingSpeed=null;render();}}}
    const bridge={cycleSpeed:()=>setSpeed((pendingSpeed??view?.speed??1)%8+1),setSpeed,animate,pickSupport,render,send,offerKey:null,ready:()=>send('ready',{value:!view?.ready[view.player]}),pause:()=>send('pause',{value:!view?.paused}),async priorities(packets){for(const packet of packets)if(!await send('targetPriority',packet))break;},choose(kind,offer,index){if(kind==='result'){if(view.result?.outcome==='victory'&&index===0)send('endless',{value:!view.endlessVotes?.[view.player]});else if(index===(view.result?.outcome==='victory'?2:1))location.assign('/duo-lobby.html');else send('rematch',{value:!view.rematch?.[view.player]});}else send(kind==='delivery'?'delivery':'reward',{offerId:offer.id,index});}};
    $('duoSupportShortcut').addEventListener('click',()=>{ $('duoHud').open=!$('duoHud').open; });
    $('duoHud').addEventListener('toggle',()=>{$('duoSupportShortcut').setAttribute('aria-expanded',String($('duoHud').open));});
    $('duoGiftNoticeClose').addEventListener('click',()=>{clearTimeout(giftNoticeTimer);$('duoGiftNotice').classList.add('hidden');});
    $('duoQuickMap').addEventListener('click',()=>switchBoard(own()?1-view.player:view.player));
    $('duoOwnMap').addEventListener('click',()=>switchBoard(view.player));$('duoPartnerMap').addEventListener('click',()=>switchBoard(1-view.player));
    $('duoReservePortal').addEventListener('click',()=>beginSupport('slot'));$('duoSendTower').addEventListener('click',()=>beginSupport('tower'));$('duoClearPortal').addEventListener('click',()=>send('portal',{slot:null}));$('duoClearTower').addEventListener('click',()=>send('reinforcement',{slot:null}));
    $('duoLeave').addEventListener('click',async()=>{if(!leaving){leaving=true;$('duoLeave').textContent='Wirklich verlassen? Partie endet für beide.';return;}try{await client.leave();forget();location.replace('/duo-lobby.html');}catch(e){api.setMessage(e.message);}});
    function forget(){try{if(localStorage.getItem('autohex-duo-session')===api.token)localStorage.removeItem('autohex-duo-session');}catch{}}
    $('duoTakeover').addEventListener('click',()=>client.takeover().catch(e=>api.setMessage(e.message)));
    document.addEventListener('click',e=>{if(!e.target.closest('#duoHud,#duoSupportShortcut'))$('duoHud').open=false;});
    client=HexDuoClient.create({token:api.token,clientId,onStatus:(text,session)=>{if(session?.invalid){forget();location.replace('/duo-lobby.html#session='+api.token);return;}networkOffline=!!session?.offline;$('duoNetworkStatus').textContent=text;syncPause();$('duoTakeover').classList.toggle('hidden',!session?.conflict);},onView:next=>{
      if(!next.lobbyState?.started){client.stop();location.replace('/duo-lobby.html#session='+api.token);return;}
      const previous=view,first=!previous;view=next;match=HexDuoClient.presentation(next,match,{lazy:true});board??=next.player;
      const receipts=JSON.stringify((next.settlements||[]).map(r=>r.id));
      if(receipts!==settledKey)try{
        let profile=HexProfile.load(HexData.TOWERS);
        for(const receipt of next.settlements||[])if(!profile.duoSettledRuns.includes(receipt.id)){
          profile=HexProfile.settleDuo(profile,receipt,HexData.TOWERS);api.profileSettled?.(profile);
        }
        settledKey=receipts;profileChanged=true;
      }catch{api.setMessage('Spielstand konnte noch nicht gespeichert werden.');}
      accept(first);notifyGifts(previous);
      if(previous&&own()&&$('autoStart').checked&&!next.ready[next.player]&&!next.connection.paused&&
         !canAutoReady(previous.boards[next.player])&&canAutoReady(next.boards[next.player]))send('ready',{value:true});
    }});
    globalThis.addEventListener('pagehide',()=>client.stop());client.start();return bridge;
  }
  return {mount,mergeBoard,guide,seatStatus,motionAlongRoad,createMotionBuffer};
})();
if(typeof module!=='undefined')module.exports=HexDuoGame;
