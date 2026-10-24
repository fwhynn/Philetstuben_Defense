/* Recoverable startup errors must not leave a blank board or clear saved data. */
(()=>{
  let ready=false,failed=false;
  function show(){
    if(ready||failed)return;failed=true;
    const mount=()=>{
      const box=document.createElement('section');box.id='bootFailure';box.setAttribute('role','alert');
      box.style.cssText='position:fixed;inset:20% 10% auto;z-index:10000;padding:24px;background:#16291f;color:#fff2d3;border:2px solid #ddbd63;border-radius:14px;font:18px/1.5 system-ui';
      const title=document.createElement('h2');title.textContent='Das Spiel konnte nicht vollständig starten.';
      const text=document.createElement('p');text.textContent='Bitte lade die Seite neu. Dein gespeicherter Spielstand wird dabei nicht gelöscht.';
      const button=document.createElement('button');button.textContent='Spiel neu laden';button.style.cssText='padding:12px 20px;font:inherit;cursor:pointer';
      button.addEventListener('click',()=>{const url=new URL(location.href);url.searchParams.set('reload',String(Date.now()));location.replace(url.href);});
      box.append(title,text,button);document.body.appendChild(box);
    };
    if(document.body)mount();else document.addEventListener('DOMContentLoaded',mount,{once:true});
  }
  window.addEventListener('error',event=>{if(event.target?.tagName==='SCRIPT'||event.error)show();},true);
  window.addEventListener('unhandledrejection',show);
  window.addEventListener('autohex-ready',()=>{if(!failed)ready=true;});
})();
