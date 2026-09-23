/* Read-only HTTP ping: no lobby, player session or game simulation is created. */
const HexDuoServerStatus=(()=>{
  function create({fetcher=globalThis.fetch.bind(globalThis),now=()=>performance.now(),schedule=setTimeout,cancel=clearTimeout,onStatus=()=>{},interval=20000,timeout=5000}={}){
    let stopped=true,timer=null,controller=null,generation=0;
    async function ping(){
      if(stopped)return;
      const current=++generation,abort=controller=new AbortController(),started=now();
      const deadline=schedule(()=>abort.abort(),timeout);
      try{
        const response=await fetcher('/healthz',{cache:'no-store',credentials:'omit',signal:abort.signal});
        const body=await response.json();
        if(abort.signal.aborted)throw Error('timeout');
        if(!response.ok||body.ok!==true||body.service!=='autohex-duo')throw Error('unavailable');
        if(!stopped&&current===generation)onStatus({state:body.maintenance?'maintenance':'online',ms:Math.max(0,Math.round(now()-started))});
      }catch{
        if(!stopped&&current===generation)onStatus({state:'offline'});
      }finally{
        cancel(deadline);
        if(current===generation){controller=null;if(!stopped)timer=schedule(ping,interval);}
      }
    }
    return {start(){if(!stopped)return;stopped=false;onStatus({state:'checking'});ping();},stop(){stopped=true;generation++;cancel(timer);controller?.abort();controller=null;}};
  }
  function mount(document){
    const indicator=document.getElementById('duoServerStatus'),label=document.getElementById('duoServerStatusText');
    if(!indicator||!label)return;
    const monitor=create({onStatus:status=>{
      indicator.dataset.state=status.state;
      label.textContent=({checking:'Server wird geprüft …',online:'Server erreichbar',offline:'Server nicht erreichbar',maintenance:'Server in Wartung'})[status.state]+(status.ms!==undefined?' · '+status.ms+' ms':'');
      indicator.title=status.ms!==undefined?'HTTP-Antwortzeit: '+status.ms+' ms':'';
    }});
    const visibility=()=>{if(document.hidden)monitor.stop();else monitor.start();};
    document.addEventListener('visibilitychange',visibility);
    globalThis.addEventListener('pagehide',()=>monitor.stop());
    globalThis.addEventListener('pageshow',visibility);
    visibility();
  }
  return {create,mount};
})();
if(typeof module!=='undefined')module.exports=HexDuoServerStatus;
if(typeof document!=='undefined')HexDuoServerStatus.mount(document);
