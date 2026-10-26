/* Entwürfe für das Hauptmenü zum Vergleichen im Browser (?menu=insel | ?menu=seite | ?menu=gespiegelt, ohne Parameter: insel)
   und Look des Hintergrunds (?look=klassisch, ohne Parameter: pracht).
   Setzt <html data-menu-variant> und <html data-menu-look>; menu-backdrop.js und hexwerk.css richten sich danach.
   Der Umschalter erscheint lokal (localhost) oder wenn ?menu= gesetzt ist. */
(()=>{
 const VARIANTS={insel:'1 · Karten links und rechts',seite:'2 · Menü links, Karte rechts',gespiegelt:'3 · Karte links, Menü rechts'};
 const LOOKS={pracht:'Pracht',klassisch:'Klassisch'};
 let params;try{params=new URLSearchParams(location.search);}catch{return;}
 const chosen=params.get('menu'),variant=VARIANTS[chosen]?chosen:'insel';
 document.documentElement.dataset.menuVariant=variant;
 const look=LOOKS[params.get('look')]?params.get('look'):'pracht';
 document.documentElement.dataset.menuLook=look;
 const local=/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
 if(!local&&!params.has('menu')&&!params.has('look'))return;
 const mount=()=>{
   const menu=document.getElementById('mainMenu');if(!menu)return;
   const bar=document.createElement('nav');bar.className='menuVariantSwitch';bar.setAttribute('aria-label','Hauptmenü-Entwurf');bar.dataset.noTranslate='';
   bar.append(Object.assign(document.createElement('span'),{textContent:'Entwurf'}));
   for(const [id,label] of Object.entries(VARIANTS)){
     const link=document.createElement('a'),next=new URLSearchParams(location.search);
     if(id==='insel')next.delete('menu');else next.set('menu',id);
     link.href=location.pathname+(next.toString()?'?'+next:'')+location.hash;link.textContent=label;
     if(id===variant)link.setAttribute('aria-current','true');bar.append(link);
   }
   bar.append(Object.assign(document.createElement('span'),{textContent:'Look'}));
   for(const [id,label] of Object.entries(LOOKS)){
     const link=document.createElement('a'),next=new URLSearchParams(location.search);
     if(id==='pracht')next.delete('look');else next.set('look',id);
     link.href=location.pathname+(next.toString()?'?'+next:'')+location.hash;link.textContent=label;
     if(id===look)link.setAttribute('aria-current','true');bar.append(link);
   }
   menu.append(bar);
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
