'use strict';
(async()=>{for(let attempt=0;attempt<30;attempt++){try{const r=await fetch('http://127.0.0.1:8090/healthz',{signal:AbortSignal.timeout(1000)});if(r.ok&&(await r.json()).ok){console.log('Duo ready');return;}}catch{}await new Promise(resolve=>setTimeout(resolve,500));}console.error('Duo did not become healthy');process.exitCode=1;})();
