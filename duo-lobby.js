(()=>{
 const $=id=>document.getElementById(id),params=new URLSearchParams(location.hash.slice(1));
 const code=$('code'),status=$('status');code.value=HexDuoClient.inviteCode(params.get('join'));let pending=null,client=null,view=null,navigating=false,noticeUntil=0;
 const canCreate=()=>HexProfile.modesUnlocked(HexProfile.load(HexData.TOWERS));
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
 function show(next){
   const own=next.player,other=1-own,ready=next.lobbyState?.ready||[false,false],joined=next.lobby.players>=2,online=next.connection.players[other]==='connected';
   $('invite').value=location.origin+'/duo-lobby.html#join='+next.lobby.code;
   $('roomCode').replaceChildren('Code: ',Object.assign(document.createElement('strong'),{textContent:next.lobby.code}),' · '+next.lobby.players+'/2');
   $('seatOwn').dataset.state=ready[own]?'ready':'notready';$('ownReady').textContent=ready[own]?'Bereit ✓':'Noch nicht bereit';
   $('seatFriend').dataset.state=!joined?'open':!online?'offline':ready[other]?'ready':'notready';
   $('friendReady').textContent=!joined?'Wartet auf Beitritt …':!online?'Verbindung unterbrochen':ready[other]?'Bereit ✓':'Noch nicht bereit';
   step('stepInvite',joined?'done':'current');step('stepJoin',joined?'done':'');step('stepReady',ready.every(Boolean)?'done':joined?'current':'');
   $('lobbyReady').textContent=ready[own]?'Bereitschaft zurücknehmen':'Ich bin bereit';$('lobbyReady').disabled=!joined||next.connection.paused;
   $('lobbyHint').textContent=!joined?'Schicke deinem Partner den Link. Sobald er beitritt, könnt ihr euch bereit melden.':!online?'Dein Partner ist gerade nicht verbunden. Warte kurz, bis er zurück ist.':ready[own]&&!ready[other]?'Du bist bereit. Das Spiel startet, sobald dein Partner auch bereit ist.':!ready[own]&&ready[other]?'Dein Partner ist bereit und wartet auf dich.':'Das Spiel startet, sobald ihr beide bereit seid.';
 }
 function wait(token){
   $('lobbyEntry').hidden=true;$('waitingLobby').hidden=false;
   const storageKey='autohex-duo-client:'+token;let clientId=sessionStorage.getItem(storageKey);if(!clientId){clientId=crypto.randomUUID();sessionStorage.setItem(storageKey,clientId);}
   client=HexDuoClient.create({token,clientId,onStatus:(text,session)=>{if(session?.invalid)return closed(token);$('lobbyTakeover').hidden=!session?.conflict;if(Date.now()<noticeUntil&&!session?.conflict)return;status.textContent=/^Verbunden/.test(text)?'':text;},onView:next=>{
     view=next;show(next);
     if(next.lobbyState?.started&&!navigating){navigating=true;client.stop();status.textContent='Beide bereit – das Spiel startet …';location.assign('/index.html#duo='+token);}
   }});client.start();
 }
 // Expired or removed rooms answer 401 forever; drop the stale link instead of retrying.
 function closed(token){client?.stop();client=null;view=null;if(localStorage.getItem('autohex-duo-session')===token)localStorage.removeItem('autohex-duo-session');$('resumeDuo')?.remove();history.replaceState(null,'',location.pathname);$('waitingLobby').hidden=true;$('lobbyEntry').hidden=false;notice('Diese Duo-Lobby existiert nicht mehr oder ist abgelaufen.');}
 $('lobbyReady').addEventListener('click',async()=>{if(!view)return;try{await client.send('lobbyReady',{value:!view.lobbyState.ready[view.player]});}catch(error){notice(error.message);}});
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
