/* Internal checkpoints, not untrusted player uploads or network views.
 * Explicit tagged values preserve Maps (including exploration metadata), Sets,
 * undefined, non-finite cooldown sentinels and independent random streams.
 */
const HexRunSnapshot=(()=>{
  const VERSION=1,RULES='duo-foundation-4';
  const ui=new Set(['duoPortal','buildingTarget','previewBuilding','selectedCard','rotation','hoveredPlacement','showHexGrid','showSlotHints','hoverBuilding','selectedSlot','selectedSlots','selectedTower','selectedTowers','selectedBuilding','selectedBase','previewTower','dragTower','dragSlot','highlightBiome','showUpgradeStatus','inspectEndMap']);
  function encode(value,stack=new Set()){
    if(value===undefined)return ['undefined'];
    if(typeof value==='number'&&!Number.isFinite(value))return ['number',String(value)];
    if(value===null||['string','number','boolean'].includes(typeof value))return ['value',value];
    if(typeof value==='function'){
      if(typeof value.snapshot!=='function')throw new Error('Function in run state');
      return ['random',value.snapshot()];
    }
    if(typeof value!=='object')throw new Error('Unsupported run value');
    if(stack.has(value))throw new Error('Cyclic run state');stack.add(value);
    const encodeOne=v=>encode(v,stack),entries=o=>Object.entries(o).map(([k,v])=>[k,encodeOne(v)]);
    const type=Object.prototype.toString.call(value);
    const result=type==='[object Map]'?['map',[...value].map(([k,v])=>[encodeOne(k),encodeOne(v)]),entries(value)]:type==='[object Set]'?['set',[...value].map(encodeOne)]:Array.isArray(value)?['array',value.map(encodeOne)]:['object',entries(value)];
    stack.delete(value);return result;
  }
  function decode(node){
    const [type,data,extra]=node;
    const assign=(target,pairs)=>{for(const [key,value] of pairs){if(['__proto__','prototype','constructor'].includes(key))throw new Error('Invalid checkpoint key');Object.defineProperty(target,key,{value:decode(value),writable:true,enumerable:true,configurable:true});}return target;};
    switch(type){
      case 'value':return data;
      case 'undefined':return undefined;
      case 'number':if(!['Infinity','-Infinity','NaN'].includes(data))throw new Error('Invalid number');return Number(data);
      case 'random':return HexRandom.restore(data);
      case 'map':return assign(new Map(data.map(([k,v])=>[decode(k),decode(v)])),extra);
      case 'set':return new Set(data.map(decode));
      case 'array':return data.map(decode);
      case 'object':return assign({},data);
      default:throw new Error('Unknown checkpoint value');
    }
  }
  function supported(state){
    if(state.celebrationActive&&!state.activeCelebration)return false;
    if(['victory','wave','build','duoWait'].includes(state.phase))return true;
    if(state.phase==='place')return Array.isArray(state.hand)&&state.hand.every(id=>id==='rescue'?!!state.rescueCard:!!HexData.CARD_LIBRARY[id]);
    return ['reward','bossReward','shrineReward','removal'].includes(state.phase)&&state.rewardOffer?.phase===state.phase&&state.rewardOffer.wave===state.wave;
  }
  function capture(state,random){
    if(!supported(state))throw new Error('Checkpoint requires combat, build or a persisted reward offer');
    return {format:'autohex-run',version:VERSION,rules:RULES,state:encode(Object.fromEntries(Object.entries(state).filter(([key])=>!ui.has(key)))),random:random.snapshot()};
  }
  function restore(snapshot){
    if(snapshot?.format!=='autohex-run'||snapshot.version!==VERSION||snapshot.rules!==RULES)throw new Error('Incompatible run checkpoint');
    const state=decode(snapshot.state),random=HexRandom.restore(snapshot.random);
    if(!(state.map instanceof Map)||!(state.landmarks instanceof Map)||!supported(state)||!Array.isArray(state.spawnQueue)||state.pendingSpawns!==state.spawnQueue.length)throw new Error('Invalid run checkpoint');
    return {state,random};
  }
  return {capture,restore,VERSION,RULES};
})();
