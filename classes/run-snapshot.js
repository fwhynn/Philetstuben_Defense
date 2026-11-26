/* Internal checkpoints, not untrusted player uploads or network views.
 * Explicit tagged values preserve Maps (including exploration metadata), Sets,
 * undefined, non-finite cooldown sentinels and independent random streams.
 */
const HexRunSnapshot=(()=>{
  const VERSION=1,RULES='duo-foundation-4';
  const ui=new Set(['villageMove','workshopPicking','duoPortal','consumablePickUI','buildingTarget','previewBuilding','selectedCard','rotation','hoveredPlacement','showHexGrid','showSlotHints','hoverBuilding','selectedSlot','selectedSlots','selectedTower','selectedTowers','selectedBuilding','selectedBase','previewTower','previewUpgrade','dragTower','dragSlot','highlightBiome','biomeIntro','showUpgradeStatus','inspectEndMap']);
  function encode(value,stack=new Set()){
    if(value===undefined)return ['undefined'];
    if(typeof value==='number'&&!Number.isFinite(value))return ['number',String(value)];
    if(value===null||['string','number','boolean'].includes(typeof value))return ['value',value];
    if(typeof value==='function'){
      if(typeof value.snapshot!=='function')throw new Error('Function in run state');
      return ['random',value.snapshot()];
    }
    if(typeof value!=='object')throw new Error('Unsupported run value');
    if(stack.has(value))throw new Error('Cyclic run state');
    stack.add(value);
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
    if(state.phase==='duoDelivery')return state.duoMode===true&&state.duoDeliveryPending===true;
    if(state.celebrationActive&&!state.activeCelebration)return false;
    if(['gameover','victory','wave','build','duoWait'].includes(state.phase))return true;
    if(state.phase==='place')return Array.isArray(state.hand)&&state.hand.every(id=>id==='rescue'?!!state.rescueCard:!!HexData.CARD_LIBRARY[id]);
    return ['reward','bossReward','shrineReward','removal'].includes(state.phase)&&state.rewardOffer?.phase===state.phase&&state.rewardOffer.wave===state.wave;
  }
  function capture(state,random){
    if(!supported(state))throw new Error('Checkpoint requires combat, build or a persisted reward offer');
    return {format:'autohex-run',version:VERSION,rules:RULES,state:encode(Object.fromEntries(Object.entries(state).filter(([key])=>!ui.has(key)))),random:random.snapshot()};
  }
  // Emit the existing tagged JSON directly, without allocating its large tree.
  // Caches live for one call only. Equal plain routes keep exactly their original
  // property order and values; restoration still creates independent objects.
  function stringify(state,random){
    if(!supported(state))throw new Error('Checkpoint requires combat, build or a persisted reward offer');
    const memo=new WeakMap(),stack=new Set(),routes=new Map(),routeKeys=new WeakMap(),names=new Map(),json=JSON.stringify;
    // Bind native helpers once: resolving VM globals for every route coordinate
    // dominates large checkpoints. All caches are scoped to this one snapshot.
    const isArray=Array.isArray,finite=Number.isFinite,entriesOf=Object.entries,valuesOf=Object.values,prototypeOf=Object.getPrototypeOf,plain=Object.prototype,tag=Function.call.bind(Object.prototype.toString),arrayFrom=Array.from,fromEntries=Object.fromEntries;
    function routeKey(value){
      if(!isArray(value))return null;if(routeKeys.has(value))return routeKeys.get(value);
      const valid=value.every(p=>p&&prototypeOf(p)===plain&&valuesOf(p).every(v=>v===null||typeof v==='string'||typeof v==='boolean'||typeof v==='number'&&finite(v)));
      const key=valid?json(value):null;routeKeys.set(value,key);return key;
    }
    function entries(value){return entriesOf(value).map(([k,v])=>{
      let text,key;if(k==='points'&&(key=routeKey(v))!==null){text=routes.get(key);if(text===undefined){text=write(v);routes.set(key,text);}}else text=write(v);
      let name=names.get(k);if(name===undefined){name=json(k);names.set(k,name);}return '['+name+','+text+']';
    }).join(',');}
    function write(value){
      if(value===undefined)return '["undefined"]';
      if(typeof value==='number'&&!finite(value))return '["number",'+json(String(value))+']';
      if(value===null||['string','number','boolean'].includes(typeof value))return '["value",'+json(value)+']';
      if(typeof value==='function'){if(typeof value.snapshot!=='function')throw new Error('Function in run state');return '["random",'+json(value.snapshot())+']';}
      if(typeof value!=='object')throw new Error('Unsupported run value');
      if(stack.has(value))throw new Error('Cyclic run state');if(memo.has(value))return memo.get(value);stack.add(value);
      const type=tag(value);let result;
      if(type==='[object Map]')result='["map",['+[...value].map(([k,v])=>'['+write(k)+','+write(v)+']').join(',')+'],['+entries(value)+']]';
      else if(type==='[object Set]')result='["set",['+[...value].map(write).join(',')+']]';
      else if(isArray(value))result='["array",['+arrayFrom({length:value.length},(_,i)=>i in value?write(value[i]):'null').join(',')+']]';
      else result='["object",['+entries(value)+']]';
      stack.delete(value);memo.set(value,result);return result;
    }
    return '{"format":"autohex-run","version":'+VERSION+',"rules":'+json(RULES)+',"state":'+write(fromEntries(entriesOf(state).filter(([key])=>!ui.has(key))))+',"random":'+json(random.snapshot())+'}';
  }
  function restore(snapshot){
    if(snapshot?.format!=='autohex-run'||snapshot.version!==VERSION||snapshot.rules!==RULES)throw new Error('Incompatible run checkpoint');
    const state=decode(snapshot.state),random=HexRandom.restore(snapshot.random);
    if(!(state.map instanceof Map)||!(state.landmarks instanceof Map)||!supported(state)||!Array.isArray(state.spawnQueue)||state.pendingSpawns!==state.spawnQueue.length)throw new Error('Invalid run checkpoint');
    // Older blocked draws kept the rejected cards in hand during the build phase.
    const normalHand=!state.openingRemaining&&(!state.challengeKind||['caravan','greed'].includes(state.challengeKind));
    const staleHand=normalHand&&state.hand?.length>0;
    if(state.phase==='build'&&state.hp>0&&!state.waveRunning&&(staleHand||state.tunnelOffer||['tunnel','blocked'].includes(state.drawResult))){
      if(staleHand){state.discard.push(...state.hand.filter(id=>id!=='rescue'));state.hand=[];state.rescueCard=null;}
      if(!state.tunnelOffer){
        const lastTile=Array.from(state.map.values()).at(-1);
        if(lastTile?.type==='rescueTunnel'&&HexMap.hasExteriorFront(state.map,state.landmarks))state.drawResult='ready';
        else {
          const blockedDraw=['tunnel','blocked'].includes(state.drawResult);
          const blockedRoad=blockedDraw||!HexMap.rescue(state.map,state.landmarks,state.difficulty==='dual'?2:1);
          if(blockedRoad){state.tunnelOffer=HexMap.tunnelPlan(state.map,state.landmarks,true,state.difficulty==='dual'?2:1);state.tunnelConfirmed=false;}
        }
      }
    }
    if(state.tunnelOffer){
      state.tunnelOffer=HexMap.tunnelPlan(state.map,state.landmarks,true,state.difficulty==='dual'?2:1);
      if(!state.tunnelOffer?.choices.some(p=>p.q===state.tunnelChoice?.q&&p.r===state.tunnelChoice?.r&&p.source===state.tunnelChoice?.source))state.tunnelChoice=null;
    }
    state.biomeLayoutVersion??=1;
    // Support multipliers are derived from buildings, not permanent purchases.
    // Reconcile older forge values without changing paid costs or owned levels.
    if([...state.map.values()].some(tile=>tile.site==='guardian'||tile.buildings?.some(b=>['forge','bastion'].includes(b?.type))))HexBuildings.refresh(state);
    return {state,random};
  }
  return {capture,stringify,restore,VERSION,RULES};
})();
