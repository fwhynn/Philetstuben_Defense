/* Player-facing release notes; never render repository text as HTML. */
(()=>{
 const $=id=>document.getElementById(id),overlay=$('patchNotesOverlay'),content=$('patchNotesContent');let pending=null;
 function close(){overlay.classList.add('hidden');$('menuPatchNotesBtn').focus?.();}
 async function open(){
  overlay.classList.remove('hidden');content.textContent='Änderungen werden geladen …';
  try{pending??=fetch('patch-notes.json',{cache:'no-store'}).then(response=>{if(!response.ok)throw Error();return response.json();});const releases=await pending;if(!Array.isArray(releases))throw Error();content.replaceChildren();
   for(const release of releases){const article=document.createElement('article'),title=document.createElement('h3'),date=document.createElement('small'),list=document.createElement('ul');title.textContent=(release.version==='next'?'In Vorbereitung':'Version '+release.version)+' · '+release.title;date.textContent=release.date||'Noch nicht veröffentlicht';article.appendChild(title);article.appendChild(date);for(const change of release.changes){const li=document.createElement('li');li.textContent=change;list.appendChild(li);}article.appendChild(list);content.appendChild(article);}
  }catch{pending=null;content.textContent='Patch Notes konnten nicht geladen werden. Bitte später erneut öffnen.';}
 }
 $('menuPatchNotesBtn').addEventListener('click',open);$('closePatchNotesBtn').addEventListener('click',close);
 document.addEventListener('keydown',event=>{if(!overlay.classList.contains('hidden')&&event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}},true);
})();
