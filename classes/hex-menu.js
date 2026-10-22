/* Hauptmenü-Hexe: Pfeiltasten springen zum nächstgelegenen bedienbaren Hex in Pfeilrichtung. Tab bleibt unverändert.
   Dazu das Einstellungsfenster des Hauptmenüs, dessen Schalter die vorhandenen Spieleinstellungen spiegeln. */
(()=>{
 const cluster=document.getElementById('hexCluster');if(!cluster)return;
 const DIRS={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
 const center=el=>{const r=el.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2];};
 cluster.addEventListener('keydown',event=>{
   const dir=DIRS[event.key],from=event.target.closest?.('.hexBtn');if(!dir||!from)return;
   const [fx,fy]=center(from);let best=null,score=Infinity;
   for(const el of cluster.querySelectorAll('.hexBtn')){
     if(el===from||el.disabled||!el.getClientRects().length)continue;
     const [x,y]=center(el),dx=x-fx,dy=y-fy,along=dx*dir[0]+dy*dir[1];if(along<=1)continue;
     // Abweichung quer zur Pfeilrichtung zählt doppelt, damit „hoch“ nicht diagonal ausweicht.
     const value=along+Math.abs(dx*dir[1]-dy*dir[0])*2;if(value<score){score=value;best=el;}
   }
   if(best){event.preventDefault();best.focus();}
 });

 const overlay=document.getElementById('menuSettingsOverlay'),opener=document.getElementById('menuSettingsBtn');if(!overlay||!opener)return;
 // [Menüschalter, Spielschalter, Eigenschaft, weitergereichte Ereignisse]
 const mirrors=[['menuSoundEnabled','soundEnabled','checked',['change']],['menuSoundVolume','soundVolume','value',['input','change']],['menuOnboardingHints','onboardingHints','checked',['change']]]
   .map(([mine,game,prop,events])=>({mine:document.getElementById(mine),game:document.getElementById(game),prop,events})).filter(m=>m.mine&&m.game);
 for(const m of mirrors)for(const type of m.events)m.mine.addEventListener(type,()=>{m.game[m.prop]=m.mine[m.prop];m.game.dispatchEvent(new Event(type,{bubbles:true}));});
 const open=()=>{for(const m of mirrors)m.mine[m.prop]=m.game[m.prop];overlay.classList.remove('hidden');};
 const close=()=>{overlay.classList.add('hidden');opener.focus?.();};
 opener.addEventListener('click',open);document.getElementById('closeMenuSettingsBtn')?.addEventListener('click',close);
 document.addEventListener('keydown',event=>{if(event.key!=='Escape'||overlay.classList.contains('hidden'))return;event.preventDefault();event.stopImmediatePropagation();close();},true);
})();
