/* Loss-tolerant view deltas: every packet references an acknowledged full baseline.
 * A dropped volatile packet cannot lose a mine, tower, sale or card. */
const HexDuoWire=(()=>{
  const STATIC=['landmarks','visibleBiomes','placements','wavePlans','deckCounts','loadout','hand','drawPile','discard','ultimateUnlocks','buildingUnlocks','runTowerDetails','metaAugments'];
  const COLLECTIONS={map:t=>t.q+','+t.r,mines:m=>String(m.id)};
  const clone=value=>JSON.parse(JSON.stringify(value));
  function collection(items,key){if(!Array.isArray(items))return null;const ids=items.map(key);if(new Set(ids).size!==ids.length)return null;return {ids,json:items.map(item=>JSON.stringify(item)),items};}
  function baseline(view,id){const saved=clone(view);return {id,view:saved,keys:saved.boards.map(board=>Object.fromEntries(STATIC.map(key=>[key,JSON.stringify(board[key])]))),collections:saved.boards.map(board=>Object.fromEntries(Object.entries(COLLECTIONS).map(([field,key])=>[field,collection(board[field],key)])))};}
  function delta(view,base){
    if(!base||base.view.serverId!==view.serverId||base.view.epoch!==view.epoch)return view;
    return {...view,wireDelta:base.id,boards:view.boards.map((board,i)=>{
      const next={...board},patches={},absent=[];
      for(const key of STATIC){if(board[key]===undefined&&base.keys[i][key]!==undefined)absent.push(key);else if(JSON.stringify(board[key])===base.keys[i][key])delete next[key];}if(absent.length)next.wireAbsent=absent;
      for(const [field,key] of Object.entries(COLLECTIONS)){
        const before=base.collections[i][field],current=collection(board[field],key);if(!before||!current)continue;
        const indices=new Map(before.ids.map((id,index)=>[id,index])),changes=[];
        for(let n=0;n<current.ids.length;n++){const old=indices.get(current.ids[n]);if(old===undefined||current.json[n]!==before.json[old])changes.push([current.ids[n],current.items[n]]);}
        const sameOrder=JSON.stringify(current.ids)===JSON.stringify(before.ids),patch={changes,...(!sameOrder?{order:current.ids}:{})};
        if(JSON.stringify(patch).length<JSON.stringify(board[field]).length){delete next[field];patches[field]=patch;}
      }
      if(Object.keys(patches).length)next.wireCollections=patches;
      return next;
    })};
  }
  function decoder(){
    const bases=new Map();
    return {accept(packet){
      if(packet.wireDelta){const base=bases.get(packet.wireDelta);if(!base||base.serverId!==packet.serverId||base.epoch!==packet.epoch)return null;
        const result={...packet,boards:packet.boards.map((board,i)=>{
          const merged={...board};
          for(const key of STATIC)if(!Object.hasOwn(board,key)&&Object.hasOwn(base.boards[i],key))merged[key]=clone(base.boards[i][key]);
          for(const [field,patch] of Object.entries(board.wireCollections||{})){
            if(!Object.hasOwn(COLLECTIONS,field))throw Error('Invalid collection');
            const items=base.boards[i][field],key=COLLECTIONS[field],lookup=new Map(items.map(item=>[key(item),item]));
            for(const [id,item] of patch.changes)lookup.set(id,item);
            merged[field]=(patch.order||items.map(key)).map(id=>{if(!lookup.has(id))throw Error('Missing record');return clone(lookup.get(id));});
          }
          for(const key of board.wireAbsent||[])if(STATIC.includes(key))delete merged[key];delete merged.wireAbsent;delete merged.wireCollections;return merged;
        })};delete result.wireDelta;return result;
      }
      if(packet.wireBase){bases.set(packet.wireBase,clone(packet));while(bases.size>4)bases.delete(bases.keys().next().value);}
      return packet;
    }};
  }
  return {baseline,delta,decoder,STATIC};
})();
if(typeof module!=='undefined')module.exports=HexDuoWire;
