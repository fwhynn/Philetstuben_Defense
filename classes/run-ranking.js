/* Provisional run comparison; the API decides acceptance or review. */
(function(root){
 const KEY='autohex-guest-ranking-v1';let current=null,generation=0;
 function score(state,mode='single'){
  const e=state.earnedMeta||{};
  if(state.challengeKind==='greed'){const endless=!!state.endless;return {runId:state.runId+(endless?':endless':':35'),mode:endless?'greedEndless':'greed35',day:state.challengeDay,gold:endless?root.HexWaves.greedGold(state):state.greedGold35,wave:endless?Math.max(35,state.lastCompletedWave||35):35,ruleset:root.AUTOHEX_VERSION||'unknown'};}
  return {runId:state.runId,mode,wave:Math.max(0,state.lastCompletedWave||0),kills:Math.max(0,(e.normalKills||0)+(e.periodicBosses||0)+(e.explorationBosses||0)),ruleset:root.AUTOHEX_VERSION||'unknown'};
 }
 function remember(run){try{const saved=JSON.parse(localStorage.getItem(KEY)||'[]');localStorage.setItem(KEY,JSON.stringify([...saved.filter(r=>r.runId!==run.runId),run].slice(-20)));}catch{}}
 function forget(run){try{const saved=JSON.parse(localStorage.getItem(KEY)||'[]');localStorage.setItem(KEY,JSON.stringify(saved.filter(r=>r.runId!==run.runId)));}catch{}}
 async function show(host,run,{api=root.HexApi,onAccount=()=>{}}={}){
  if(!host||!run)return;
  const token=++generation;current={host,run,options:{api,onAccount}};
  const doc=host.ownerDocument||document,el=(tag,text)=>{const n=doc.createElement(tag);n.textContent=text;return n;};
  host.replaceChildren(el('p','Platzierung wird ermittelt …'));
  if(!api?.isLoggedIn())remember(run);
  const title=el('h3',''),detail=el('p',''),note=el('p','');
  const label=run.mode.startsWith('greed')?(run.mode==='greed35'?'Gier · Welle 35':'Gier · Endlos'):run.mode==='duo'?'Duo':run.mode==='dual'?'Solo · Zwei Fronten':'Solo · Eine Front';
  host.replaceChildren(title,detail,note);detail.textContent=`${label} · Welle ${run.wave} abgeschlossen · ${run.mode.startsWith('greed')?run.gold+' Gold verdient':run.kills+' Kills'}`;
  title.textContent='Platzierung wird ermittelt …';
  if(!api?.isLoggedIn()){
   note.textContent='Erstelle einen Account oder melde dich an, um diesen Run einzureichen. Gier-Ergebnisse werden vor Veröffentlichung geprüft. Er bleibt dafür in diesem Browser gespeichert.';
   for(const [text,mode] of [['Account erstellen und Run übernehmen','register'],['Ich habe bereits einen Account','login']]){
    const button=el('button',text);button.type='button';button.addEventListener('click',()=>onAccount(mode));host.appendChild(button);
   }
  }else{
   try{const result=await api.submitRunRanking(run);if(token!==generation)return;
    forget(run);note.textContent=result.status==='accepted'?'Dein Run wurde angenommen.':result.status==='rejected'?'Dein Run wurde abgelehnt.':'Dein Run wird überprüft und später angenommen oder abgelehnt.';
   }catch{if(token!==generation)return;note.textContent='Der Run konnte noch nicht eingereicht werden. Bitte erneut versuchen.';const retry=el('button','Erneut versuchen');retry.addEventListener('click',()=>show(host,run,{api,onAccount}));host.appendChild(retry);}
  }
  try{const data=await api.previewRunRanking(run);if(token!==generation)return;
   if(data.mode!==run.mode||!Number.isSafeInteger(data.rank)||data.rank<1)throw Error();
   // Eingereichte Account-Runs stehen schon in der Wertung; Gäste sehen nur, wo sie stünden.
   title.textContent=api?.isLoggedIn()?`Damit bist du aktuell Platz ${data.rank}`:`Damit wärst du aktuell Platz ${data.rank}`;
   host.appendChild(el('p','Vorläufiger Vergleich mit freigegebenen Bestwerten. Bei Gier zählt verdientes Gold, sonst Welle und Kills. Die Platzierung kann sich ändern.'));
  }catch{if(token===generation)title.textContent='Platzierung momentan nicht verfügbar';}
 }
 async function refresh(){
  const api=current?.options.api||root.HexApi;
  if(api?.isLoggedIn()){
   let saved=[];try{saved=JSON.parse(localStorage.getItem(KEY)||'[]');}catch{}
   for(const run of saved){try{await api.submitRunRanking(run);forget(run);}catch{break;}}
  }
  if(current)return show(current.host,current.run,current.options);
 }
 const api={score,show,refresh};if(typeof module!=='undefined')module.exports=api;else root.HexRunRanking=api;
})(globalThis);
