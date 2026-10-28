/* Einstellungsfenster mit Bereichen (Spiel im #settingsDrawer, Hauptmenü im #menuSettingsOverlay).
   Schaltet die Bereiche um, öffnet bei „Steuerung“ die Tastenübersicht (#hotkeyHelp, game.js zählt das als gelesen)
   und füllt die Fußzeile: Welle, Pause, angemeldeter Account. Werte und Schalter selbst gehören weiter game.js/sound.js. */
(()=>{
 function select(win,name){
  for(const tab of win.querySelectorAll('[data-settings-tab]'))tab.setAttribute('aria-selected',String(tab.dataset.settingsTab===name));
  for(const pane of win.querySelectorAll('[data-settings-pane]'))pane.hidden=pane.dataset.settingsPane!==name;
  const help=win.querySelector('#hotkeyHelp');if(help&&name==='controls'&&!help.open)help.open=true;
 }
 function footer(win){
  const wave=document.getElementById('wave')?.textContent||'0',paused=document.getElementById('app')?.classList.contains('paused');
  const state=win.querySelector('[data-settings-runstate]');if(state)state.textContent=(paused?'Pausiert · ':'')+'Welle '+wave;
  const account=document.getElementById('menuAccountLabel')?.textContent?.trim(),line=win.querySelector('[data-settings-account]');
  if(line)line.textContent=account&&account!=='Anmelden'?'Angemeldet als '+account:'';
 }
 function install(win){
  const host=win.closest('.overlay')||win;
  for(const tab of win.querySelectorAll('[data-settings-tab]'))tab.addEventListener('click',()=>select(win,tab.dataset.settingsTab));
  for(const link of win.querySelectorAll('[data-settings-goto]'))link.addEventListener('click',()=>select(win,link.dataset.settingsGoto));
  // Pfeiltasten wechseln zwischen den Bereichen (Tab-Liste).
  win.querySelector('[role=tablist]')?.addEventListener('keydown',event=>{
   const tabs=[...win.querySelectorAll('[data-settings-tab]')],at=tabs.indexOf(document.activeElement);if(at<0)return;
   const step={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1}[event.key];if(!step)return;
   event.preventDefault();const next=tabs[(at+step+tabs.length)%tabs.length];next.focus();select(win,next.dataset.settingsTab);
  });
  for(const close of win.querySelectorAll('[data-settings-close]'))close.addEventListener('click',()=>document.getElementById('closeMenuSettingsBtn')?.click());
  // Hinweis „Tastenbelegung ansehen“: game.js markiert die Zusammenfassung, sichtbar ist hier der Reiter.
  const summary=win.querySelector('#hotkeyHelpSummary'),controls=win.querySelector('[data-settings-tab=controls]');
  if(summary&&controls)new MutationObserver(()=>controls.classList.toggle('hotkeyGuide',summary.classList.contains('hotkeyGuide'))).observe(summary,{attributes:true,attributeFilter:['class']});
  // Lautstärkeregler zeigen ihren Wert in Prozent; 0 % bedeutet aus (eigene An/Aus-Schalter gibt es nicht mehr).
  const ranges=[...win.querySelectorAll('input[type=range]')].map(input=>{const out=document.createElement('output');out.className='hxRangeValue';out.setAttribute('aria-hidden','true');input.insertAdjacentElement?.('afterend',out);const show=()=>{out.textContent=input.value+' %';};input.addEventListener('input',show);input.addEventListener('change',show);show();return show;});
  new MutationObserver(()=>{if(!host.classList.contains('hidden')){footer(win);ranges.forEach(show=>show());}}).observe(host,{attributes:true,attributeFilter:['class']});  footer(win);
 }
 const start=()=>{for(const win of document.querySelectorAll('[data-settings-window]'))install(win);};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
