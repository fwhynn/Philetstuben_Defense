/* Review controls are convenience only; the API enforces administrator access. */
(()=>{
 const panel=document.getElementById('runReview'),list=document.getElementById('runReviewEntries');
 const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
 async function load(){
  list.replaceChildren(el('p','Prüfliste wird geladen …'));
  try{const data=await HexApi.getPendingRunRankings();let greedError='';if(HexApi.getPendingGreedRankings){try{const greed=await HexApi.getPendingGreedRankings();data.entries.push(...greed.entries);}catch{greedError='Gier-Prüfliste momentan nicht verfügbar.';}}list.replaceChildren();if(greedError)list.appendChild(el('p',greedError));
   if(!data.entries.length)list.appendChild(el('p','Keine offenen Prüfungen.'));
   for(const row of data.entries){
    const item=el('section',''),label=el('p',`${row.username} · ${row.mode} · Welle ${row.wave} · ${row.mode.startsWith('greed')?row.gold+' Gold · '+row.challenge_day:row.kills+' Kills'} · ${row.ruleset}`);
    label.setAttribute('data-no-translate','');item.appendChild(label);
    item.appendChild(el('p',row.suspicion||'Vorhandene Meldung ohne automatischen Prüfgrund.'));
    const reason=el('textarea','');reason.placeholder='Begründung der Entscheidung';reason.setAttribute('aria-label','Begründung der Entscheidung');item.appendChild(reason);
    for(const [decision,text]of [['accepted','Annehmen'],['rejected','Ablehnen']]){
     const button=el('button',text);button.type='button';button.addEventListener('click',async()=>{
      if(!reason.value.trim()){reason.focus();return;}button.disabled=true;
      try{await (row.mode.startsWith('greed')?HexApi.reviewGreedRanking(row.id,row.revision,decision):HexApi.reviewRunRanking(row.id,row.revision,decision,reason.value));await load();}
      catch(error){button.disabled=false;item.appendChild(el('p',error.message));}
     });item.appendChild(button);
    }
    const remove=el('button','Löschen');remove.type='button';let confirmed=false;
    remove.addEventListener('click',async()=>{
     if(!confirmed){confirmed=true;remove.textContent='Löschen bestätigen';return;}
     remove.disabled=true;
     try{await (row.mode.startsWith('greed')?HexApi.reviewGreedRanking(row.id,row.revision,'rejected'):HexApi.deleteRunRanking(row.id,row.revision));await load();}
     catch(error){remove.disabled=false;confirmed=false;remove.textContent='Löschen';item.appendChild(el('p',error.message));}
    });item.appendChild(remove);
    list.appendChild(item);
   }
  }catch(error){list.replaceChildren(el('p',error.message));}
 }
 document.getElementById('menuLeaderboardBtn').addEventListener('click',async()=>{
  panel.hidden=true;if(!HexApi.isLoggedIn())return;
  try{const user=await HexApi.currentUser();if(user?.isAdmin){panel.hidden=false;if(panel.open)load();}}catch{}
 });
 panel.addEventListener('toggle',()=>{if(panel.open&&!panel.hidden)load();});
})();
