/* Review controls are convenience only; the API enforces administrator access. */
(()=>{
 const panel=document.getElementById('runReview'),list=document.getElementById('runReviewEntries');
 const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
 async function load(){
  list.replaceChildren(el('p','Prüfliste wird geladen …'));
  try{const data=await HexApi.getPendingRunRankings();list.replaceChildren();
   if(!data.entries.length)list.appendChild(el('p','Keine offenen Prüfungen.'));
   for(const row of data.entries){
    const item=el('section',''),label=el('p',`${row.username} · ${row.mode} · Welle ${row.wave} · ${row.kills} Kills · ${row.ruleset}`);
    label.setAttribute('data-no-translate','');item.appendChild(label);
    const reason=el('textarea','');reason.placeholder='Begründung der Entscheidung';reason.setAttribute('aria-label','Begründung der Entscheidung');item.appendChild(reason);
    for(const [decision,text]of [['accepted','Annehmen'],['rejected','Ablehnen']]){
     const button=el('button',text);button.type='button';button.addEventListener('click',async()=>{
      if(!reason.value.trim()){reason.focus();return;}button.disabled=true;
      try{await HexApi.reviewRunRanking(row.id,row.revision,decision,reason.value);await load();}
      catch(error){button.disabled=false;item.appendChild(el('p',error.message));}
     });item.appendChild(button);
    }
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
