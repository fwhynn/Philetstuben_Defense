const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function load({headless=false,initialProfile=null,initialStorage={},rotateView=null,pickSlot=null}={}){
  const elements=new Map();
  function element(){const classes=new Set();return {textContent:'',get innerHTML(){return this.html||'';},set innerHTML(value){this.html=value;this.children=[];},style:{},children:[],attributes:{},listeners:{},classList:{add(...names){names.forEach(n=>classes.add(n));},remove(...names){names.forEach(n=>classes.delete(n));},contains(n){return classes.has(n);},toggle(n,force){const on=force??!classes.has(n);if(on)classes.add(n);else classes.delete(n);return on;}},setAttribute(name,value){this.attributes[name]=value;},addEventListener(name,fn){this.listeners[name]=fn;},appendChild(e){this.children.push(e);}};}
  const timers=new Map();let next=1;
  const storage=new Map(Object.entries({'tutorial-v1':'done',...initialStorage}));if(initialProfile)storage.set('hex-bastion-profile-v1',JSON.stringify(initialProfile));const documentListeners={};
  const context={document:{getElementById(id){if(!elements.has(id)) elements.set(id,element());return elements.get(id);},createElement:element,createElementNS:element,addEventListener(name,fn){documentListeners[name]=fn;}},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,String(value))},performance:{now:()=>0},requestAnimationFrame(){},setTimeout(fn){const id=next++;timers.set(id,fn);return id;},clearTimeout(id){timers.delete(id);},Math};
  let source=fs.readFileSync(path.join(__dirname,'../../game.js'),'utf8');
  if(headless) source=source.replace('renderBoard(); renderUI();','');
  for(const file of ['biomes.js','data.js','ui-layout.js','tutorial.js','heroes.js','profile.js','map.js','random.js','waves.js','combat.js','rewards.js','deck.js','buildings.js','exploration.js','camera.js','svg-renderer.js','arsenal.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../'+file),'utf8'),context);
  if(rotateView||pickSlot){const svgRenderer=vm.runInNewContext('HexSvgRenderer',context);context.HexThreeRenderer={create:(...args)=>({...svgRenderer.create(...args),rotateView,...(pickSlot?{pickSlot}:{})})};}
  source=source.replace('newRun(); hasActiveRun=false; openMainMenu(); requestAnimationFrame(frame);','newRun(); globalThis.api={get state(){return state;},rendererCommands,newRun,advanceClock,advanceCamera,canPlace,rotatedRoads,neighbor,edgePoint,axialToPixel:axialToWorld,buildGraph,pathToBase,spawnSources,startWave,update,drawHand,showRewards,showRemoval,placeTile,finishRemoval,renderAll,endWave,showBossReward,finishBossReward,CARD_LIBRARY};');
  vm.runInNewContext(source.replace('newRun(); globalThis.api=', 'newRun(); globalThis.upgradeSelectedTower=upgradeSelectedTower;globalThis.selectSlot=selectSlot;globalThis.sellSelectedTower=sellSelectedTower;globalThis.buyTower=buyTower;globalThis.slotPositions=slotPositions; globalThis.nextSourcePoints=nextSourcePoints; globalThis.api='),context);
  return {data:vm.runInNewContext("HexData",context),waves:vm.runInNewContext("HexWaves",context),a:context.api,upgradeSelectedTower:context.upgradeSelectedTower,selectSlot:context.selectSlot,buyTower:context.buyTower,sellSelectedTower:context.sellSelectedTower,slotPositions:context.slotPositions,nextSourcePoints:context.nextSourcePoints,timers,elements,storage,documentListeners};
}


module.exports={load};


