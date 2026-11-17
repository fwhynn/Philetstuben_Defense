/* Loss-tolerant view deltas: every packet references an acknowledged full baseline.
 * A dropped volatile packet cannot lose a mine, tower, sale or card. */
const HexDuoWire=(()=>{
  const STATIC=['landmarks','visibleBiomes','placements','wavePlans','deckCounts','loadout','hand','drawPile','discard','ultimateUnlocks','buildingUnlocks','runTowerDetails','metaAugments'];
  const COLLECTIONS={map:t=>t.q+','+t.r,mines:m=>String(m.id)};
  const clone=value=>JSON.parse(JSON.stringify(value));
  function collection(items,key){if(!Array.isArray(items))return null;const ids=items.map(key),indices=new Map(ids.map((id,index)=>[id,index]));if(indices.size!==ids.length)return null;const json=items.map(item=>JSON.stringify(item));return {ids,indices,json,items,length:2+Math.max(0,items.length-1)+json.reduce((n,value)=>n+value.length,0)};}
  function enemyBase(items){const base=collection(items,e=>String(e.id));if(base)base.fields=items.map(e=>Object.fromEntries(Object.entries(e).map(([key,value])=>[key,JSON.stringify(value)])));return base;}
  function baseline(view,id,{enemyFields=false}={}){const saved=clone(view);return {id,view:saved,enemyFields:enemyFields?saved.boards.map(board=>enemyBase(board.enemies)):null,keys:saved.boards.map(board=>Object.fromEntries(STATIC.map(key=>[key,JSON.stringify(board[key])]))),collections:saved.boards.map(board=>Object.fromEntries(Object.entries(COLLECTIONS).map(([field,key])=>[field,collection(board[field],key)])))};}
  function delta(view,base){
    if(!base||base.view.serverId!==view.serverId||base.view.epoch!==view.epoch)return view;
    return {...view,wireDelta:base.id,boards:view.boards.map((board,i)=>{
      const next={...board},patches={},absent=[];
      for(const key of STATIC){if(board[key]===undefined&&base.keys[i][key]!==undefined)absent.push(key);else if(JSON.stringify(board[key])===base.keys[i][key])delete next[key];}if(absent.length)next.wireAbsent=absent;
      for(const [field,key] of Object.entries(COLLECTIONS)){
        const before=base.collections[i][field],current=collection(board[field],key);if(!before||!current)continue;
        const indices=before.indices,changes=[];
        for(let n=0;n<current.ids.length;n++){const old=indices.get(current.ids[n]);if(old===undefined||current.json[n]!==before.json[old])changes.push([current.ids[n],current.items[n]]);}
        const sameOrder=current.ids.length===before.ids.length&&current.ids.every((id,n)=>id===before.ids[n]),patch={changes,...(!sameOrder?{order:current.ids}:{})};
        if(JSON.stringify(patch).length<current.length){delete next[field];patches[field]=patch;}
      }
      if(Object.keys(patches).length)next.wireCollections=patches;
      const enemies=base.enemyFields?.[i],current=enemies&&collection(board.enemies,e=>String(e.id));
      if(enemies&&current){
        const changes=[];
        current.ids.forEach((id,n)=>{const old=enemies.indices.get(id),item=current.items[n];if(old===undefined){changes.push([id,item]);return;}
          const fields={},absent=[],previous=enemies.items[old];
          // Most enemy fields are unchanged scalars. Avoid allocating their JSON
          // again; nested values and non-finite numbers still use JSON semantics.
          for(const key of Object.keys(item)){const value=item[key];if(value===previous[key]&&(value===null||typeof value!=='object'))continue;if(JSON.stringify(value)!==enemies.fields[old][key])fields[key]=value;}
          for(const key of Object.keys(enemies.items[old]))if(!Object.hasOwn(item,key))absent.push(key);
          if(Object.keys(fields).length||absent.length)changes.push(absent.length?[id,fields,absent]:[id,fields]);
        });
        const same=current.ids.length===enemies.ids.length&&current.ids.every((id,n)=>id===enemies.ids[n]);
        const patch={changes,...(!same?{order:current.ids}:{})};if(JSON.stringify(patch).length<current.length){delete next.enemies;next.wireEnemies=patch;}
      }
      return next;
    })};
  }
  function decoder(){
    const bases=new Map();
    return {accept(packet){
      if(packet.wireDelta){const saved=bases.get(packet.wireDelta),base=saved?.view;if(!base||base.serverId!==packet.serverId||base.epoch!==packet.epoch)return null;
        const result={...packet,boards:packet.boards.map((board,i)=>{
          const merged={...board};
          for(const key of STATIC)if(!Object.hasOwn(board,key)&&Object.hasOwn(base.boards[i],key))merged[key]=clone(base.boards[i][key]);
          for(const [field,patch] of Object.entries(board.wireCollections||{})){
            if(!Object.hasOwn(COLLECTIONS,field))throw Error('Invalid collection');
            const before=saved.collections[i][field],changes=new Map(patch.changes);
            // Clone the reconstructed list once. Neither presentation nor a later
            // packet may mutate the acknowledged baseline or this packet's records.
            merged[field]=clone((patch.order||before.ids).map(id=>{if(changes.has(id))return changes.get(id);const index=before.indices.get(id);if(index===undefined)throw Error('Missing record');return before.items[index];}));
          }
          if(board.wireEnemies){
            const before=saved.enemies[i],patch=board.wireEnemies,changes=new Map(patch.changes.map(([id,fields,absent])=>[id,{fields,absent}]));
            if(!before)throw Error('Invalid enemy baseline');
            merged.enemies=clone((patch.order||before.ids).map(id=>{const index=before.indices.get(id),change=changes.get(id);if(index===undefined&&!change)throw Error('Missing enemy');const enemy={...(index===undefined?{}:before.items[index]),...change?.fields};for(const key of change?.absent||[])delete enemy[key];return enemy;}));
            delete merged.wireEnemies;
          }
          for(const key of board.wireAbsent||[])if(STATIC.includes(key))delete merged[key];delete merged.wireAbsent;delete merged.wireCollections;return merged;
        })};delete result.wireDelta;return result;
      }
      if(packet.wireBase){const view=clone(packet);bases.set(packet.wireBase,{view,enemies:view.boards.map(board=>collection(board.enemies,e=>String(e.id))),collections:view.boards.map(board=>Object.fromEntries(Object.entries(COLLECTIONS).map(([field,key])=>{const items=board[field]||[],ids=items.map(key);return [field,{items,ids,indices:new Map(ids.map((id,index)=>[id,index]))}];})))});while(bases.size>4)bases.delete(bases.keys().next().value);}
      return packet;
    }};
  }
  return {baseline,delta,decoder,STATIC};
})();
if(typeof module!=='undefined')module.exports=HexDuoWire;
