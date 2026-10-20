/* Per-mode run boards with server-authorized moderation controls. */
(()=>{
 const $=id=>document.getElementById(id),overlay=$('leaderboardOverlay'),content=$('leaderboardContent'),status=$('leaderboardStatus');
 const legacyColumns=[['highestWave','highest_wave','Beste Welle'],['runsPlayed','runs_played','Durchläufe'],['normalKills','normal_kills','Gegner'],['bossesKilled','bosses_killed','Bosse'],['diamondsEarned','diamonds_earned','Diamanten']];
 let columns=[['highestWave','highest_wave','Beste Welle'],['normalKills','normal_kills','Kills']];
 let sort='highest_wave',orderBy='highest_wave',direction='descending',generation=0,players=null,ownName='',loading=false;
 let mode='single',loadedSort=null,fallbackNotice='';
 const modeButtons=[...document.querySelectorAll('[data-leaderboard-mode]')];
 let fields=[['rank','rank','Rang'],['username','name','Name'],...columns];
 function chooseOrder(key){
  direction=orderBy===key?(direction==='ascending'?'descending':'ascending'):(key==='name'||key==='rank'?'ascending':'descending');
  orderBy=key;
  if(mode==='legacy'&&columns.some(([,category])=>category===key)&&loadedSort!==key){sort=key;load();}
  else {generation++;loading=false;sort=loadedSort||'highest_wave';render();}
 }
 function node(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
 function render(){
  if(loading)return;
  content.replaceChildren();if(!players)return;
  const number=new Intl.NumberFormat(globalThis.HexI18n?.getLanguage?.()==='en'?'en-US':'de-DE'),table=node('table'),head=node('tr'),body=node('tbody'),thead=node('thead');
  for(const [,key,title]of fields){
   const active=key===orderBy,th=node('th',undefined,(key==='rank'||key==='name'?key+' ':'')+(active?'sorted':'')),button=node('button',title);
   th.scope='col';th.setAttribute('aria-sort',active?direction:'none');button.type='button';button.className='leaderboardColumnSort';
   if(active){const arrow=node('span',direction==='ascending'?' ↑':' ↓');arrow.setAttribute('aria-hidden','true');button.appendChild(arrow);}
   button.addEventListener('click',()=>chooseOrder(key));th.appendChild(button);head.appendChild(th);
  }
  const canDelete=mode!=='legacy'&&players.some(player=>player.id!==undefined);
  if(canDelete)head.appendChild(node('th','Verwaltung'));
  thead.appendChild(head);table.appendChild(thead);
  const field=fields.find(([,key])=>key===orderBy)[0],collator=new Intl.Collator(globalThis.HexI18n?.getLanguage?.()==='en'?'en':'de',{sensitivity:'base',numeric:true});
  const ordered=[...players].sort((a,b)=>{
   const value=field==='username'?collator.compare(String(a[field]||''),String(b[field]||'')):(Number(a[field])||0)-(Number(b[field])||0);
   return (direction==='ascending'?value:-value)||(Number(a.rank)||0)-(Number(b.rank)||0)||collator.compare(String(a.username||''),String(b.username||''));
  });
  for(const player of ordered){
   const row=node('tr',undefined,player.rank<=3?'top'+player.rank:''),name=node('td',player.username,'name');name.setAttribute('data-no-translate','');
   if(ownName&&player.username===ownName)row.classList.add('own');
   row.appendChild(node('td',String(player.rank),'rank'));row.appendChild(name);
   for(const [field,key]of columns)row.appendChild(node('td',number.format(Number(player[field])||0),key===orderBy?'sorted':''));
   if(canDelete){
    const cell=node('td');
    if(player.id!==undefined){
     const button=node('button','Löschen');button.type='button';let confirmed=false;
     button.addEventListener('click',async()=>{
      if(!confirmed){confirmed=true;button.textContent='Löschen bestätigen';return;}
      button.disabled=true;
      try{await HexApi.deleteRunRanking(player.id,player.revision);await load();}
      catch(error){button.disabled=false;confirmed=false;button.textContent='Löschen';status.textContent=error.message||'Eintrag konnte nicht gelöscht werden.';}
     });cell.appendChild(button);
    }
    row.appendChild(cell);
   }
   body.appendChild(row);
  }
  table.appendChild(body);content.appendChild(table);
 }
 async function load(){
  const current=++generation;loading=false;
  for(const button of modeButtons)button.setAttribute('aria-pressed',String(button.dataset.leaderboardMode===mode));
  if(mode==='daily'){players=[];render();status.textContent='Für diesen Modus sind noch keine Bestenlistendaten verfügbar.';return;}
  loading=true;if(!players)status.textContent='Bestenliste wird geladen …';
  const requestedSort=sort;
  try{const data=mode==='legacy'?await HexApi.getPublicLeaderboard(requestedSort):await HexApi.getRunLeaderboard(mode);if(mode!=='legacy'){if(data.mode!==mode||!Array.isArray(data.entries))throw Error();data.players=data.entries.map(r=>({...r,highestWave:r.wave,normalKills:r.kills}));}if(current!==generation)return;if(!Array.isArray(data?.players))throw Error();players=data.players;loadedSort=requestedSort;loading=false;render();status.textContent=fallbackNotice+(players.length?(mode==='legacy'?'Ungeprüfte Account-Gesamtwerte, keine getrennte Run-Wertung.':'Freigegebene Bestwerte pro Account · Welle, danach Kills.'):'Noch keine Einträge in dieser Kategorie.');}
  catch{if(current===generation){loading=false;if(mode==='single'){mode='legacy';columns=legacyColumns;fields=[['rank','rank','Rang'],['username','name','Name'],...columns];fallbackNotice='Getrennte Run-Bestenlisten sind noch nicht verfügbar. Angezeigt werden die bisherigen Gesamtwerte. ';return load();}status.textContent='Bestenliste konnte nicht geladen werden. Bitte später erneut öffnen.';}}
 }
 for(const button of modeButtons)button.addEventListener('click',()=>{
  if(mode===button.dataset.leaderboardMode)return;
  fallbackNotice='';mode=button.dataset.leaderboardMode;columns=mode==='legacy'?legacyColumns:[['highestWave','highest_wave','Beste Welle'],['normalKills','normal_kills','Kills']];fields=[['rank','rank','Rang'],['username','name','Name'],...columns];sort=orderBy='highest_wave';direction='descending';loadedSort=null;players=null;content.replaceChildren();load();
 });
 function close(){overlay.classList.add('hidden');$('menuLeaderboardBtn').focus?.();}
 function open(){
  fallbackNotice='';mode='single';columns=[['highestWave','highest_wave','Beste Welle'],['normalKills','normal_kills','Kills']];fields=[['rank','rank','Rang'],['username','name','Name'],...columns];sort=orderBy='highest_wave';direction='descending';players=null;loadedSort=null;content.replaceChildren();
  overlay.classList.remove('hidden');load();
  ownName='';if(HexApi.isLoggedIn())HexApi.currentUser().then(user=>{ownName=user?.username||'';render();}).catch(()=>{});
 }
 $('menuLeaderboardBtn').addEventListener('click',open);$('closeLeaderboardBtn').addEventListener('click',close);
 document.addEventListener('keydown',event=>{if(!overlay.classList.contains('hidden')&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}},true);
})();
