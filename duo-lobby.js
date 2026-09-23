(()=>{
 const $=id=>document.getElementById(id),params=new URLSearchParams(location.hash.slice(1));
 const code=$('code'),status=$('status');code.value=(params.get('join')||'').toUpperCase();let pending=null,client=null,view=null,navigating=false;
 const reasons={maintenance:'Serverwartung. Bitte später erneut versuchen.',full:'Diese Lobby ist bereits voll.',capacity:'Der Server ist ausgelastet.',invalid:'Bitte einen gültigen Einladungscode eingeben.','not-found':'Lobby nicht gefunden oder abgelaufen.',expired:'Diese Lobby ist abgelaufen.'};
 async function enter(kind){
   const value=code.value.trim().toUpperCase(),key=kind+':'+value;if(!pending||pending.key!==key)pending={key,requestId:crypto.randomUUID()};
   $('create').disabled=true;$('join').querySelector('button').disabled=true;status.textContent='Verbinde …';
   try{const response=await fetch('/lobby/'+kind,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:pending.requestId,...(kind==='join'?{code:value}:{})}),signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error('Server nicht erreichbar.');const result=await response.json();if(!result.ok){pending=null;throw Error(reasons[result.reason]||'Verbindung fehlgeschlagen.');}localStorage.setItem('autohex-duo-session',result.token);history.replaceState(null,'','#session='+result.token);wait(result.token);}catch(error){status.textContent=error.message;}finally{$('create').disabled=false;$('join').querySelector('button').disabled=false;}
 }
 function wait(token){
   $('lobbyEntry').hidden=true;$('waitingLobby').hidden=false;
   const storageKey='autohex-duo-client:'+token;let clientId=sessionStorage.getItem(storageKey);if(!clientId){clientId=crypto.randomUUID();sessionStorage.setItem(storageKey,clientId);}
   client=HexDuoClient.create({token,clientId,onStatus:(text,session)=>{status.textContent=text;$('lobbyTakeover').hidden=!session?.conflict;},onView:next=>{
     view=next;const own=next.player,other=1-own,ready=next.lobbyState?.ready||[false,false];
     $('invite').value=location.origin+'/duo-lobby.html#join='+next.lobby.code;$('roomCode').textContent='Lobby '+next.lobby.code+' · '+next.lobby.players+'/2';
     $('ownReady').textContent=ready[own]?'Bereit ✓':'Nicht bereit';$('friendReady').textContent=next.lobby.players<2?'Wartet auf Beitritt …':next.connection.players[other]!=='connected'?'Verbindung unterbrochen':ready[other]?'Bereit ✓':'Nicht bereit';
     $('lobbyReady').textContent=ready[own]?'Bereitschaft zurücknehmen':'Bereit';$('lobbyReady').disabled=next.lobby.players<2||next.connection.paused;
     if(next.lobbyState?.started&&!navigating){navigating=true;client.stop();location.assign('/index.html#duo='+token);}
   }});client.start();
 }
 $('lobbyReady').addEventListener('click',async()=>{if(!view)return;try{await client.send('lobbyReady',{value:!view.lobbyState.ready[view.player]});}catch(error){status.textContent=error.message;}});
 $('lobbyTakeover').addEventListener('click',()=>client.takeover().catch(e=>status.textContent=e.message));
 $('lobbyLeave').addEventListener('click',async()=>{try{await client.leave();localStorage.removeItem('autohex-duo-session');location.replace('/duo-lobby.html');}catch(e){status.textContent=e.message;}});
 $('copyInvite').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('invite').value);status.textContent='Einladungslink kopiert.';}catch{$('invite').select();status.textContent='Link markieren und kopieren.';}});
 $('create').addEventListener('click',()=>enter('create'));$('join').addEventListener('submit',e=>{e.preventDefault();enter('join');});
 const session=params.get('session'),saved=localStorage.getItem('autohex-duo-session');
 if(session)wait(session);else if(saved){const resume=document.createElement('button');resume.textContent='Letzte Duo-Partie öffnen';resume.addEventListener('click',()=>{history.replaceState(null,'','#session='+saved);wait(saved);});$('lobbyEntry').appendChild(resume);}
 globalThis.addEventListener('pagehide',()=>client?.stop());
})();
