// Served only by the localhost harness on a fresh origin, never the public build.
(()=>{
 const samples={frames:[],render:[],motion:[],longTasks:[],errors:[]};let last,renderer='not-created';
 const frame=t=>{if(last&&document.visibilityState==='visible')samples.frames.push(t-last);last=t;requestAnimationFrame(frame);};requestAnimationFrame(frame);
 new PerformanceObserver(list=>samples.longTasks.push(...list.getEntries().map(e=>e.duration))).observe({entryTypes:['longtask']});
 addEventListener('error',e=>samples.errors.push(e.message));addEventListener('unhandledrejection',e=>samples.errors.push(String(e.reason)));
 globalThis.__loadWrap=api=>{const create=api.create;api.create=(...args)=>{const instance=create(...args);renderer='three';for(const [method,key]of [['render','render'],['renderMotion','motion']])if(instance[method]){const original=instance[method];instance[method]=(...args)=>{const t=performance.now();try{return original(...args);}finally{samples[key].push(performance.now()-t);}};}return instance;};};
 const summarize=a=>{a.sort((a,b)=>a-b);return {n:a.length,p50:a[Math.floor(a.length*.5)]||0,p95:a[Math.floor(a.length*.95)]||0,max:a.at(-1)||0};};
 setInterval(()=>{const result={at:Date.now(),seat:location.hash.slice(-8),visibility:document.visibilityState,renderer,canvas:!!document.querySelector('canvas'),samples:Object.fromEntries(Object.entries(samples).map(([k,v])=>[k,k==='errors'?v:summarize(v)]))};fetch('/__load/metrics',{method:'POST',body:JSON.stringify(result)}).catch(()=>{});for(const k of Object.keys(samples))samples[k]=[];},2000);
})();
