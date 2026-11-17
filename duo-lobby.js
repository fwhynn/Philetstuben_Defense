(async()=>{
 await globalThis.HexLocalStore?.ready;
 const $=id=>document.getElementById(id),params=new URLSearchParams(location.hash.slice(1));
 const code=$('code'),status=$('status');code.value=HexDuoClient.inviteCode(params.get('join'));let pending=null,client=null,view=null,navigating=false,noticeUntil=0,draftLoadout=null,loadoutKey='',loadoutRenderKey='',savingLoadout=false,augmentSession=null,draftHero='standard',draftFronts='normal';
 let lobbyProfile=HexProfile.load(HexData.TOWERS);
 const canCreate=()=>HexProfile.modesUnlocked(lobbyProfile);
 const lockCreate=()=>{const open=canCreate();$('create').disabled=!open;$('createLocked').hidden=open;};lockCreate();
 // Short-lived feedback (copied, errors) must not be overwritten by the 10 Hz connection status.
 const notice=text=>{status.textContent=text;noticeUntil=Date.now()+4000;};
 const reasons={maintenance:'Serverwartung. Bitte später erneut versuchen.',full:'Diese Lobby ist bereits voll.',capacity:'Der Server ist ausgelastet.',invalid:'Bitte einen gültigen Einladungscode eingeben.','not-found':'Lobby nicht gefunden oder abgelaufen.',expired:'Diese Lobby ist abgelaufen.'};
 async function enter(kind){
   if(kind==='create'&&!canCreate()){notice('Überlebe Welle 35 im Standardspiel, um eigene Lobbys zu erstellen. Einladungen kannst du jederzeit annehmen.');return;}
   const value=kind==='join'?HexDuoClient.inviteCode(code.value):'',key=kind+':'+value;if(kind==='join'){if(!value){notice(reasons.invalid);code.focus();return;}code.value=value;}if(!pending||pending.key!==key)pending={key,requestId:crypto.randomUUID()};
   $('create').disabled=true;$('join').querySelector('button').disabled=true;status.textContent='Verbinde …';
   try{const response=await fetch('/lobby/'+kind,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:pending.requestId,...(kind==='join'?{code:value}:{})}),signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error('Server nicht erreichbar.');const result=await response.json();if(!result.ok){pending=null;throw Error(reasons[result.reason]||'Verbindung fehlgeschlagen.');}status.textContent='';localStorage.setItem('autohex-duo-session',result.token);history.replaceState(null,'','#session='+result.token);wait(result.token);}catch(error){notice(error.message);}finally{lockCreate();$('join').querySelector('button').disabled=false;}
 }
 function step(id,state){$(id).dataset.state=state;}
 const draftKey=()=>JSON.stringify([draftLoadout,draftHero,draftFronts]);
 function renderLoadouts(next){
   const own=next.lobbyState?.loadouts?.[next.player]||next.boards[next.player].loadout||[],partner=next.lobbyState?.loadouts?.[1-next.player]||[];
   const ownBoard=next.boards[next.player],otherBoard=next.boards[1-next.player];
   const access=next.lobbyState.setupOptions||{heroes:['standard'],twoFronts:false};
   const key=JSON.stringify([own,ownBoard.heroId||'standard',ownBoard.difficulty||'normal']);
   if(key!==loadoutKey||!draftLoadout){loadoutKey=key;draftLoadout=[...own];draftHero=ownBoard.heroId||'standard';draftFronts=ownBoard.difficulty||'normal';}
   const ready=!!next.lobbyState?.ready?.[next.player],available=new Set(access.towers||['archer','catapult','chain','freeze','mine',...lobbyProfile.unlockedTowers||[],...own]);
   const presets=(lobbyProfile.loadoutPresets||[]).filter(p=>p.towers.length===5&&p.towers.every(id=>available.has(id)));
   const dirty=draftKey()!==key,renderKey=JSON.stringify([draftKey(),otherBoard?.heroId,otherBoard?.difficulty,ownBoard.ultimateUnlocks,ownBoard.buildingUnlocks,access,presets,partner,savingLoadout,next.lobby.players,dirty,ready,!!augmentSession?.loading,next.lobbyState?.augments,[...available]]);

   if(renderKey===loadoutRenderKey)return;loadoutRenderKey=renderKey;
   const locked=savingLoadout||ready,heroSelect=$('lobbyHero'),fronts=$('lobbyFronts');
   heroSelect.replaceChildren();
   for(const [id,def] of Object.entries(HexHeroes.definitions)){
     const option=document.createElement('option');option.value=id;option.disabled=!access.heroes.includes(id);option.textContent=def.name+(option.disabled?(id==='builder'?' · Standard, Welle 35':' · Zwei Fronten, Welle 35'):'');heroSelect.appendChild(option);
   }
   heroSelect.value=draftHero;heroSelect.disabled=locked;
   $('lobbyHeroInfo').textContent=HexHeroes.hero(draftHero).desc;
   fronts.value=draftFronts;fronts.disabled=locked||next.player!==0||!access.twoFronts;$('lobbyFrontHint').hidden=next.player===0&&access.twoFronts;$('lobbyFrontHint').textContent=next.player===0?'Zwei Fronten schaltest du mit Welle 35 im Standardspiel frei.':'Die Frontenzahl legt der Host für euch beide fest.';
   const partnerFortress=otherBoard?.heroId||'standard';
   $('lobbyPartnerFortress').textContent=next.lobby.players<2?'Wartet auf Beitritt …':HexHeroes.hero(partnerFortress).name+' · '+(otherBoard.difficulty==='dual'?'Zwei Fronten':'Eine Front');
   const preset=$('lobbyPreset');preset.replaceChildren();$('lobbyPresetLabel').hidden=!presets.length;
   for(const [value,name] of [['','Vorlage wählen'],...presets.map(p=>[p.towers.join('|'),p.name])]){
     const option=document.createElement('option');option.value=value;option.textContent=name;preset.appendChild(option);
   }
   preset.value='';preset.disabled=locked;
   const arsenal=$('lobbyArsenalList');arsenal.replaceChildren();
   for(const id of [...(ownBoard.ultimateUnlocks||[]),...(ownBoard.buildingUnlocks||[])]){
     const [kind,type,branch]=id.split(':');
     const name=kind==='ultimate'&&draftLoadout.includes(type)?HexData.ultimateDefinition({type,branch})?.name:kind==='building'?HexBuildings.specials[type]?.name:null;
     if(name){const item=document.createElement('li');item.textContent=(kind==='ultimate'?HexData.TOWERS[type].name:HexBuildings.definitions[type].name)+' · '+name;arsenal.appendChild(item);}
   }
   $('lobbyArsenal').hidden=!arsenal.children.length;
   // Hexwerk: je Spieler eine Zeile mit Karten-Chips (Symbol und Seltenheit per CSS aus data-augment/data-tier).
   const augments=next.lobbyState?.augments||[[],[]],augmentBox=$('lobbyAugments');augmentBox.replaceChildren();
   for(const [label,cards] of [['Deine Augments:',augments[next.player]||[]],['Partner:',augments[1-next.player]||[]]]){const row=document.createElement('span');row.className='lobbyAugmentRow';const head=document.createElement('strong');head.textContent=label;row.appendChild(head);
    if(!cards.length){const none=document.createElement('span');none.className='lobbyAugmentNone';none.textContent=label==='Deine Augments:'&&augmentSession?.loading?'Wird geladen …':label==='Partner:'&&next.lobby.players<2?'Wartet auf Beitritt …':'Keine Augments';row.appendChild(none);}
    for(const c of cards){const chip=document.createElement('span');chip.className='augmentLoadoutChip';chip.dataset.augment=c.id;chip.dataset.tier=String(c.tier);chip.textContent=HexAugmentCards.catalog[c.id].name+' · '+HexAugmentCards.rarities[c.tier];row.appendChild(chip);}
    augmentBox.appendChild(row);}
   const augmentNote=document.createElement('small');augmentNote.textContent='Aktive Augments für eure Turmauswahl. Gäste spielen ohne Account-Augments.';augmentBox.appendChild(augmentNote);
   $('lobbyLoadoutCount').textContent=draftLoadout.length+'/5';$('lobbyLoadoutChoices').replaceChildren();$('lobbyPartnerLoadout').replaceChildren();
   function tower(id,selected,interactive){const def=HexData.TOWERS[id],button=document.createElement(interactive?'button':'div');button.className='lobbyTowerChoice';button.innerHTML=HexArsenal.icon(id,def.color);const name=document.createElement('span');name.textContent=def.name+(interactive&&!available.has(id)?' · Gesperrt':'');button.appendChild(name);if(interactive){button.type='button';button.setAttribute('aria-pressed',String(selected));button.disabled=savingLoadout||ready||!available.has(id)||(!selected&&draftLoadout.length>=5);button.addEventListener('click',()=>{draftLoadout=selected?draftLoadout.filter(t=>t!==id):[...draftLoadout,id];show(view);saveSelection();});}return button;}
   for(const id of Object.keys(HexData.TOWERS))$('lobbyLoadoutChoices').appendChild(tower(id,draftLoadout.includes(id),true));
   if(next.lobby.players<2)$('lobbyPartnerLoadout').textContent='Wartet auf deinen Partner …';else for(const id of partner)$('lobbyPartnerLoadout').appendChild(tower(id,true,false));
 }
 function show(next){
   const own=next.player,other=1-own,ready=next.lobbyState?.ready||[false,false],joined=next.lobby.players>=2,online=next.connection.players[other]==='connected';
   $('ownName').textContent=(next.lobbyState.names?.[own]||'Du')+(own===0?' · Host':'');$('friendName').textContent=joined?(next.lobbyState.names?.[other]||'Dein Partner')+(other===0?' · Host':''):'Dein Partner';
   $('invite').value=location.origin+'/duo-lobby.html#join='+next.lobby.code;
   $('roomCode').replaceChildren('Code: ',Object.assign(document.createElement('strong'),{textContent:next.lobby.code}),' · '+next.lobby.players+'/2');
   $('seatOwn').dataset.state=ready[own]?'ready':'notready';$('ownReady').textContent=ready[own]?'Bereit ✓':'Noch nicht bereit';
   $('seatFriend').dataset.state=!joined?'open':!online?'offline':ready[other]?'ready':'notready';
   $('friendReady').textContent=!joined?'Wartet auf Beitritt …':!online?'Verbindung unterbrochen':ready[other]?'Bereit ✓':'Noch nicht bereit';
   step('stepInvite',joined?'done':'current');step('stepJoin',joined?'done':'');step('stepReady',ready.every(Boolean)?'done':joined?'current':'');
   $('lobbyReady').textContent=own===0?(ready[other]?'Spiel starten':'Warte auf Partner · noch nicht bereit'):ready[own]?'Bereitschaft zurücknehmen':'Ich bin bereit';renderLoadouts(next);$('lobbyReady').disabled=!joined||next.connection.paused||savingLoadout||draftKey()!==loadoutKey||draftLoadout.length!==5||own===0&&!ready[other];
   $('lobbyHint').textContent=!joined?'Schicke deinem Partner den Link. Sobald er beitritt, könnt ihr euch bereit melden.':!online?'Dein Partner ist gerade nicht verbunden. Warte kurz, bis er zurück ist.':ready[own]&&!ready[other]?'Du bist bereit. Das Spiel startet, sobald dein Partner auch bereit ist.':!ready[own]&&ready[other]?'Dein Partner ist bereit. Du kannst das Spiel starten.':'Wählt eure Türme. Der Partner bestätigt mit Bereit, der Host startet.';
 }
 async function syncAugments(){
   const session=augmentSession;session.loading=true;show(view);
   // The account endpoint accepts one lookup per seat per second.
   const delay=session.nextLookup-Date.now();
   if(delay>0)await new Promise(resolve=>setTimeout(resolve,delay));
   if(session!==augmentSession)return;
   let result;
   try{lobbyProfile=HexProfile.load(HexData.TOWERS);result=await HexApi.applyDuoAugments(session.token,session.clientId,lobbyProfile);}
   finally{session.loading=false;session.nextLookup=Date.now()+1000;}
   if(session!==augmentSession||!view||view.lobbyState.started)return;
   const augments=[...(view.lobbyState.augments||[[],[]])];augments[view.player]=result.cards;
   const player=view.player,boards=[...view.boards],loadouts=[...view.lobbyState.loadouts];
   if(result.loadout){loadouts[player]=result.loadout;boards[player]={...boards[player],heroId:result.heroId,difficulty:result.difficulty,loadout:result.loadout,ultimateUnlocks:result.ultimateUnlocks,buildingUnlocks:result.buildingUnlocks};}
   view={...view,boards,lobbyState:{...view.lobbyState,augments,loadouts,setupOptions:result.setupOptions||view.lobbyState.setupOptions}};show(view);
 }
 function wait(token){
   $('lobbyEntry').hidden=true;$('waitingLobby').hidden=false;
   const storageKey='autohex-duo-client:'+token;let clientId=sessionStorage.getItem(storageKey);if(!clientId){clientId=crypto.randomUUID();sessionStorage.setItem(storageKey,clientId);}
   augmentSession={token,clientId,nextLookup:0};let initialView=true;
   client=HexDuoClient.create({token,clientId,onStatus:(text,session)=>{if(session?.invalid)return closed(token);$('lobbyTakeover').hidden=!session?.conflict;if(Date.now()<noticeUntil&&!session?.conflict)return;status.textContent=/^Verbunden/.test(text)?'':text;},onView:next=>{
     view=next;
     if(initialView){
       initialView=false;
       if(!next.lobbyState.started&&!next.lobbyState.ready[next.player]){
         savingLoadout=true;const current=augmentSession;
         syncAugments().catch(error=>{if(current===augmentSession)notice(error.message);}).finally(()=>{if(current===augmentSession){savingLoadout=false;if(view)show(view);}});
       }
     }
     show(next);
     if(next.lobbyState?.started&&!navigating){navigating=true;client.stop();status.textContent='Beide bereit – das Spiel startet …';location.assign('/index.html#duo='+token);}
   }});client.start();
 }
 // Expired or removed rooms answer 401 forever; drop the stale link instead of retrying.
 function closed(token){client?.stop();client=null;view=null;augmentSession=null;savingLoadout=false;draftLoadout=null;loadoutRenderKey='';if(localStorage.getItem('autohex-duo-session')===token)localStorage.removeItem('autohex-duo-session');$('resumeDuo')?.remove();history.replaceState(null,'',location.pathname);$('waitingLobby').hidden=true;$('lobbyEntry').hidden=false;notice('Diese Duo-Lobby existiert nicht mehr oder ist abgelaufen.');}
 $('lobbyHero').addEventListener('change',()=>{draftHero=$('lobbyHero').value;show(view);saveSelection();});
 $('lobbyFronts').addEventListener('change',()=>{draftFronts=$('lobbyFronts').value;show(view);saveSelection();});
 $('lobbyPreset').addEventListener('change',()=>{const preset=$('lobbyPreset').value;if(preset){draftLoadout=preset.split('|');show(view);saveSelection();}});
 async function saveSelection(){if(!client||!view||savingLoadout||draftLoadout?.length!==5||draftKey()===loadoutKey)return;savingLoadout=true;show(view);try{await client.send('lobbyLoadout',{towers:[...draftLoadout],heroId:draftHero,difficulty:draftFronts});await syncAugments();}catch(e){notice(e.message);}finally{savingLoadout=false;if(view)show(view);}}
 $('lobbyReady').addEventListener('click',async()=>{
   if(!view||savingLoadout)return;const ready=!view.lobbyState.ready[view.player];savingLoadout=true;show(view);
   try{if(view.player===0){await client.send('lobbyStart',{});}else{if(ready)await syncAugments();await client.send('lobbyReady',{value:ready});}}
   catch(error){notice(error.message);}finally{savingLoadout=false;if(view)show(view);}
 });
 $('lobbyTakeover').addEventListener('click',()=>client.takeover().catch(e=>notice(e.message)));
 $('lobbyLeave').addEventListener('click',async()=>{try{await client.leave();localStorage.removeItem('autohex-duo-session');location.replace('/duo-lobby.html');}catch(e){notice(e.message);}});
 $('copyInvite').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('invite').value);notice('Einladungslink kopiert – schick ihn jetzt deinem Partner.');$('copyInvite').textContent='Kopiert ✓';setTimeout(()=>$('copyInvite').textContent='Link kopieren',2000);}catch{$('invite').select();notice('Link markieren und kopieren.');}});
 $('create').addEventListener('click',()=>enter('create'));$('join').addEventListener('submit',e=>{e.preventDefault();enter('join');});
 const session=params.get('session'),saved=localStorage.getItem('autohex-duo-session');
 if(session)wait(session);else if(saved){const resume=document.createElement('button');resume.id='resumeDuo';resume.className='lobbyGhost';resume.textContent='Letzte Duo-Partie öffnen';resume.addEventListener('click',()=>{history.replaceState(null,'','#session='+saved);wait(saved);});$('resumeSlot').appendChild(resume);}
 // Pasting an invite link into the address bar of this page only changes the hash.
 globalThis.addEventListener('hashchange',()=>{const join=HexDuoClient.inviteCode(new URLSearchParams(location.hash.slice(1)).get('join'));if(join&&!client){code.value=join;code.focus();}});
 globalThis.addEventListener('pagehide',()=>client?.stop());
})();
