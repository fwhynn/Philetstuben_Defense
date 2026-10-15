/* Public top list from the account API. Values come from uploaded saves and are not verified; names render as text only. */
(()=>{
 const $=id=>document.getElementById(id),overlay=$('leaderboardOverlay'),content=$('leaderboardContent'),status=$('leaderboardStatus');
 const columns=[['highestWave','highest_wave','Beste Welle'],['runsPlayed','runs_played','Durchläufe'],['normalKills','normal_kills','Gegner'],['bossesKilled','bosses_killed','Bosse'],['diamondsEarned','diamonds_earned','Diamanten']];
 let sort='highest_wave',generation=0,players=null,ownName='';
 function node(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
 function render(){
  content.replaceChildren();if(!players?.length)return;
  const number=new Intl.NumberFormat(globalThis.HexI18n?.getLanguage?.()==='en'?'en-US':'de-DE'),table=node('table'),head=node('tr'),body=node('tbody'),thead=node('thead');
  for(const [title,className]of [['Rang','rank'],['Name','name'],...columns.map(([,key,label])=>[label,key===sort?'sorted':''])]){const th=node('th',title,className);th.scope='col';head.appendChild(th);}
  thead.appendChild(head);table.appendChild(thead);
  for(const player of players){
   const row=node('tr',undefined,player.rank<=3?'top'+player.rank:''),name=node('td',player.username,'name');name.setAttribute('data-no-translate','');
   if(ownName&&player.username===ownName)row.classList.add('own');
   row.appendChild(node('td',String(player.rank),'rank'));row.appendChild(name);
   for(const [field,key]of columns)row.appendChild(node('td',number.format(Number(player[field])||0),key===sort?'sorted':''));
   body.appendChild(row);
  }
  table.appendChild(body);content.appendChild(table);
 }
 async function load(){
  const current=++generation;players=null;render();status.textContent='Bestenliste wird geladen …';
  for(const button of document.querySelectorAll('[data-leaderboard-sort]'))button.setAttribute('aria-pressed',String(button.dataset.leaderboardSort===sort));
  try{const data=await HexApi.getPublicLeaderboard(sort);if(current!==generation)return;if(!Array.isArray(data?.players))throw Error();players=data.players;render();status.textContent=players.length?'':'Noch keine Einträge in dieser Kategorie.';}
  catch{if(current===generation)status.textContent='Bestenliste konnte nicht geladen werden. Bitte später erneut öffnen.';}
 }
 function close(){overlay.classList.add('hidden');$('menuLeaderboardBtn').focus?.();}
 function open(){
  overlay.classList.remove('hidden');load();
  // Own row is highlighted once the account answers; a failed lookup only skips the highlight.
  if(HexApi.isLoggedIn())HexApi.currentUser().then(user=>{ownName=user?.username||'';render();}).catch(()=>{});else ownName='';
 }
 $('menuLeaderboardBtn').addEventListener('click',open);$('closeLeaderboardBtn').addEventListener('click',close);
 for(const button of document.querySelectorAll('[data-leaderboard-sort]'))button.addEventListener('click',()=>{if(button.dataset.leaderboardSort===sort)return;sort=button.dataset.leaderboardSort;load();});
 document.addEventListener('keydown',event=>{if(!overlay.classList.contains('hidden')&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}},true);
})();
