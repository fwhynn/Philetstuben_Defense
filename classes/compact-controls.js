/* One compact tray at a time, with the same controls and IDs as desktop. */
(()=>{
 const root=document.documentElement,buttons=[...document.querySelectorAll('[data-compact]')];
 const areas={menu:'.dockTL',stats:'.hud',towers:'#quickLoadout',biomes:'#biomeRail'};
 const small=()=>matchMedia('(max-width:1100px), (max-height:600px)').matches;
 let openingTap=null;
 function open(name,event){openingTap=event?.pointerType==='touch'?{x:event.clientX,y:event.clientY,time:event.timeStamp}:null;root.dataset.compact=name||'';for(const b of buttons)b.setAttribute('aria-expanded',String(b.dataset.compact===name));globalThis.dispatchEvent(new Event('resize'));}
 for(const button of buttons)button.addEventListener('click',()=>open(root.dataset.compact===button.dataset.compact?'':button.dataset.compact));
 document.addEventListener('click',event=>{const tap=openingTap;openingTap=null;if(tap&&event.timeStamp>=tap.time&&event.timeStamp-tap.time<500&&Math.hypot(event.clientX-tap.x,event.clientY-tap.y)<8)return;if(!small()||!root.dataset.compact||event.target.closest('[data-compact],#introductionNotice,#hotkeyTip'))return;if(!event.target.closest(areas[root.dataset.compact]))open('');},true);
 document.addEventListener('keydown',event=>{if(event.key==='Escape')open('');});
 const touchQuery=matchMedia('(pointer:coarse)'),touch=()=>touchQuery.matches;
 touchQuery.addEventListener?.('change',()=>globalThis.dispatchEvent(new Event('hexinputchange')));
 globalThis.HexCompact={open,small,touch};
})();
