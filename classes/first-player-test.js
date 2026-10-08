/* Local-only isolated first-player profile. Never a server/admin permission. */
(()=>{
 const available=typeof location!=='undefined'&&['localhost','127.0.0.1','[::1]'].includes(location.hostname);
 const active=available&&new URLSearchParams(location.search).get('first-player-test')==='1'&&!new URLSearchParams(location.hash.slice(1)).has('duo');
 const prefix='autohex-first-player-test:';
 const storage={getItem:key=>localStorage.getItem(prefix+key),setItem:(key,value)=>localStorage.setItem(prefix+key,String(value)),removeItem:key=>localStorage.removeItem(prefix+key)};
 function start(){if(!available)return;for(let i=localStorage.length-1;i>=0;i--){const key=localStorage.key(i);if(key?.startsWith(prefix))localStorage.removeItem(key);}const url=new URL(location.href);url.searchParams.set('first-player-test','1');url.hash='';location.assign(url.href);}
 function exit(){const url=new URL(location.href);url.searchParams.delete('first-player-test');location.assign(url.href);}
 globalThis.HexFirstPlayerTest={available,active,storage,start,exit};
})();
