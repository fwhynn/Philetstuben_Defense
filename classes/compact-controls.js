/* One compact tray at a time, with the same controls and IDs as desktop. */
(()=>{
 const root=document.documentElement,buttons=[...document.querySelectorAll('[data-compact]')];
 const areas={menu:'.dockTL',stats:'.hud',towers:'#quickLoadout',biomes:'#biomeRail'};
 const small=()=>matchMedia('(max-width:900px), (max-height:600px)').matches;
 function open(name){root.dataset.compact=name||'';for(const b of buttons)b.setAttribute('aria-expanded',String(b.dataset.compact===name));globalThis.dispatchEvent(new Event('resize'));}
 for(const button of buttons)button.addEventListener('click',()=>open(root.dataset.compact===button.dataset.compact?'':button.dataset.compact));
 document.addEventListener('click',event=>{if(!small()||!root.dataset.compact||event.target.closest('[data-compact]'))return;if(!event.target.closest(areas[root.dataset.compact]))open('');},true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape')open('');});
 globalThis.HexCompact={open,small};
})();
