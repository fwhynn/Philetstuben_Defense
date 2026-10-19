/* Local-only isolated first-player profile. Never a server/admin permission. */
(()=>{
 const available=typeof location!=='undefined'&&['localhost','127.0.0.1','[::1]'].includes(location.hostname);
 let enabled=false;try{enabled=available&&localStorage.getItem('autohex-dev-enabled')==='true';}catch{}
 const active=enabled&&new URLSearchParams(location.search).get('first-player-test')==='1'&&!new URLSearchParams(location.hash.slice(1)).has('duo');
 const prefix='autohex-first-player-test:';
 const storage={getItem:key=>localStorage.getItem(prefix+key),setItem:(key,value)=>localStorage.setItem(prefix+key,String(value)),removeItem:key=>localStorage.removeItem(prefix+key)};
 const scenarios=['tutorial','upgrade','upgrade-poor','enemies'];
 const requested=typeof location==='undefined'?null:new URLSearchParams(location.search).get('dev-scenario');
 const scenario=active&&scenarios.includes(requested)?requested:null;
 function start(next=null){if(!enabled||new URLSearchParams(location.hash.slice(1)).has('duo'))return;for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key?.startsWith(prefix))localStorage.removeItem(key);}const url=new URL(location.href);url.searchParams.set('first-player-test','1');url.searchParams.delete('dev-scenario');if(scenarios.includes(next))url.searchParams.set('dev-scenario',next);url.hash='';location.assign(url.href);}
 function exit(){const url=new URL(location.href);url.searchParams.delete('first-player-test');url.searchParams.delete('dev-scenario');location.assign(url.href);}
 function toggle(){if(!available)return;enabled=!enabled;try{localStorage.setItem('autohex-dev-enabled',String(enabled));}catch{}if(!enabled&&active){exit();return;}return enabled;}
 globalThis.HexFirstPlayerTest={available,active,get enabled(){return enabled;},toggle,storage,start,exit,scenario};
})();
