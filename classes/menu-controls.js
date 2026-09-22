/* HUD disclosures and nonmodal drawers dismiss before an outside click is handled. */
(()=>{
 const panels=[...document.querySelectorAll('.hud .statDetails')];
 for(const panel of panels){
   panel.setAttribute('name','hud-information');
   panel.querySelector('summary')?.addEventListener('click',()=>{if(!panel.open)for(const other of panels)if(other!==panel)other.open=false;});
   panel.addEventListener('toggle',()=>{if(panel.open)for(const other of panels)if(other!==panel)other.open=false;});
 }
 const dismiss=event=>{
   if(event.button!==undefined&&event.button!==0)return;
   if(event.target.closest?.('#rewardOverlay,#celebration,#campaignVictory'))return;
   for(const panel of panels)if(panel.open&&!panel.contains(event.target))panel.open=false;
   for(const panel of document.querySelectorAll('details[open]'))if(panel.open&&!panel.contains(event.target))panel.open=false;
   for(const drawer of document.querySelectorAll('.drawer:not(.hidden)')){
     const opener=event.target.closest?.('[data-drawer]');
     if(!drawer.contains(event.target)&&opener?.dataset.drawer!==drawer.id)drawer.classList.add('hidden');
   }
 };
 // Capture clicks too: synthesized/touch clicks and pointer capture do not
 // necessarily deliver a fresh pointerdown to the clicked map element.
 let pointerGesture=false;
 document.addEventListener('pointerdown',event=>{pointerGesture=true;dismiss(event);},true);
 document.addEventListener('pointercancel',()=>{pointerGesture=false;},true);
 document.addEventListener('click',event=>{const handled=pointerGesture;pointerGesture=false;if(!handled||event.detail===0)dismiss(event);},true);
})();
