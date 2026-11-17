// Isolated CPU work; no GPU or browser FPS claim.
const fs=require('node:fs'),path=require('node:path'),{performance}=require('node:perf_hooks'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../classes/three-renderer.js'),'utf8');
const begin=source.indexOf('  const objectSignatures='),end=source.indexOf('  function syncObjects()',begin);
const cached=Function('baseUpgradeParts',source.slice(begin,end)+'return objectSig;')(()=>({key:'base'}));
const reference=t=>JSON.stringify([t.type==='base'?'base':'',t.slots,t.buildingSlots,t.type,t.rotation,(t.towers||[]).map(t=>t&&[t.type,t.branch,t.finalUpgrade,t.ultimate,t.level,t.tileType,t.supportRange,t.rangeFactor,t.biome]),(t.buildings||[]).map(b=>b&&b.type)]);
const tiles=Array.from({length:160},(_,i)=>({q:i,r:0,type:'straight',rotation:i%6,slots:2,buildingSlots:1,towers:[{type:'archer',level:2,supportRange:1.2},{type:'mine',level:1}],buildings:[{type:'forge'}]}));
const oldTimes=[],newTimes=[],median=xs=>xs.sort((a,b)=>a-b)[Math.floor(xs.length/2)];
for(let i=0;i<100;i++){
 tiles[i%tiles.length].towers[0].level=i%4;
 const old=()=>{const start=performance.now();const result=tiles.map(reference);if(i>=10)oldTimes.push(performance.now()-start);return result;};
 const next=()=>{const start=performance.now();const result=tiles.map(cached);if(i>=10)newTimes.push(performance.now()-start);return result;};
 let a,b;if(i%2){a=old();b=next();}else{b=next();a=old();}assert.deepEqual(b,a);
}
console.log(JSON.stringify({scope:'160 tiles, 320 towers; one tower edited per render; 90 samples after warmup',referenceMs:median(oldTimes),cachedMs:median(newTimes)},null,2));
