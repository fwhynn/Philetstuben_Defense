// Synthetic building effects/overlay work; no DOM, renderer or FPS measurement.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{performance}=require('node:perf_hooks'),{createHash}=require('node:crypto');
function load(){
  const context=vm.createContext({});
  const source=fs.readFileSync(path.join(__dirname,'../classes/buildings.js'),'utf8').replace('function definition(building,state){','function definition(building,state){calls++;');
  vm.runInContext('let calls=0;'+source,context);
  return vm.runInContext('({buildings:HexBuildings,get calls(){return calls;}})',context);
}
function fixture(){return {map:new Map(Array.from({length:60},(_,q)=>[q+',0',{q,r:0,slots:3,towers:Array.from({length:3},()=>({type:'archer'})),buildings:q%10===0?[{type:q%20===0?'forge':'market',level:3,special:true,target:((q+7)%60)+',0'}]:[]}])),selectedBuilding:{q:0,r:0,index:0}};}
function sample(){
  const api=load(),state=fixture(),start=performance.now();
  const effects=[...state.map.values()].map(t=>api.buildings.effects(state.map,t));
  const highlight=api.buildings.highlight(state);api.buildings.refresh(state);
  const ms=performance.now()-start;
  const hash=createHash('sha256').update(JSON.stringify({effects,highlight,tiles:[...state.map.values()]})).digest('hex');
  return {ms,definitions:api.calls,hash};
}
if(require.main===module){sample();const samples=Array.from({length:20},sample);if(samples.some(s=>s.hash!==samples[0].hash))throw Error('Unstable output');const report={scope:'60 tiles, 180 towers, six buildings; effects for all tiles, one forge overlay and full support refresh',node:process.version,samples,meanMs:samples.reduce((sum,s)=>sum+s.ms,0)/samples.length};if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({meanMs:report.meanMs,...samples[0]}));}
module.exports={load,fixture};
