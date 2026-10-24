/* Player-facing notes: structured highlights and stat changes, with legacy fallback. */
(()=>{
 const $=id=>document.getElementById(id),overlay=$('patchNotesOverlay'),content=$('patchNotesContent');let pending=null;
 const icons={buff:'↑',nerf:'↓',new:'✦',removed:'−'};
 function text(tag,value,className){const el=document.createElement(tag);el.textContent=value;if(className)el.className=className;return el;}
 function list(parent,items){const ul=document.createElement('ul');for(const value of items||[])ul.appendChild(text('li',value));parent.appendChild(ul);}
 function structured(article,release){
  if(release.summary)article.appendChild(text('p',release.summary,'patchIntro'));
  const overview=document.createElement('section');overview.className='patchOverview';overview.setAttribute('aria-label','Patch auf einen Blick');
  for(const group of release.overview||[]){const kind=Object.hasOwn(icons,group.kind)?group.kind:'new',card=document.createElement('div');card.className='patchHighlight '+kind;const mark=text('span',icons[kind],'patchMark');mark.setAttribute('aria-hidden','true');card.appendChild(mark);card.appendChild(text('h4',group.title));list(card,group.items);overview.appendChild(card);}article.appendChild(overview);
  for(const section of release.sections){const block=document.createElement('section');block.className='patchSection';block.appendChild(text('h4',section.title));
   for(const entry of section.entries){const item=document.createElement('section');item.className='patchEntry';item.appendChild(text('h5',entry.title));if(entry.summary)item.appendChild(text('p',entry.summary,'patchReason'));
    if(entry.stats?.length){const table=document.createElement('table');table.className='patchStats';table.appendChild(text('caption',entry.title+' · '+(globalThis.HexI18n?.text?.('Werteänderungen')||'Werteänderungen'),'sr-only'));const head=document.createElement('thead'),row=document.createElement('tr');for(const label of ['Wert','Alt','Neu']){const th=text('th',label);th.setAttribute('scope','col');row.appendChild(th);}head.appendChild(row);table.appendChild(head);const body=document.createElement('tbody');for(const stat of entry.stats){const tr=document.createElement('tr'),label=text('th',stat.label);label.setAttribute('scope','row');tr.appendChild(label);tr.appendChild(text('td',stat.before,'patchBefore'));tr.appendChild(text('td','→ '+stat.after,'patchAfter'));body.appendChild(tr);}table.appendChild(body);item.appendChild(table);}
    if(entry.bullets?.length)list(item,entry.bullets);block.appendChild(item);
   }article.appendChild(block);
  }
 }
 function close(){overlay.classList.add('hidden');$('menuPatchNotesBtn').focus?.();}
 async function open(){
  overlay.classList.remove('hidden');content.textContent='Änderungen werden geladen …';
  try{pending??=fetch('patch-notes.json',{cache:'no-store'}).then(response=>{if(!response.ok)throw Error();return response.json();});const releases=await pending;if(!Array.isArray(releases))throw Error();content.replaceChildren();
   for(const [index,release]of releases.entries()){
    const article=document.createElement('article'),heading=(release.version==='next'?'In Vorbereitung':'Version '+release.version)+' · '+release.title;
    article.appendChild(text('h3',heading));article.appendChild(text('small',release.date||'Noch nicht veröffentlicht'));
    if(Array.isArray(release.sections))structured(article,release);else list(article,release.changes);
    if(index===0)content.appendChild(article);else{const archive=document.createElement('details');archive.className='patchArchive';archive.appendChild(text('summary',heading));archive.appendChild(article);content.appendChild(archive);}
   }
  }catch{pending=null;content.textContent='Patch Notes konnten nicht geladen werden. Bitte später erneut öffnen.';}
 }
 $('menuPatchNotesBtn').addEventListener('click',open);$('closePatchNotesBtn').addEventListener('click',close);
 document.addEventListener('keydown',event=>{if(!overlay.classList.contains('hidden')&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}},true);
})();
