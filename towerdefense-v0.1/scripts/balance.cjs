// Deterministic full-controller runs. No extra gold/HP, invented cards or skipped waves.
const {load}=require('../tests/helpers/game.cjs');
const fs=require('node:fs');
function run(seed,strategy,maxWave=40){
  const h=load({headless:true}),{a,elements,data}=h;
  elements.get('runSeed').value=seed;a.newRun();
  const history=[];
  const distance=(q,r)=>Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r));
  function resolve(){
    for(let guard=0;guard<30&&!['place','build','gameover'].includes(a.state.phase);guard++){
      if(a.state.phase==='removal'){a.finishRemoval();continue;}
      const choices=elements.get('rewardChoices').children;
      const rank=html=>/Lange Straße|Weites Land|Kampfstraße|Waldkurve/.test(html)?4:/Gerade|Königsstraße|Handelsstraße/.test(html)?3:/Kurve/.test(html)?2:1;
      const choice=[...choices].sort((x,y)=>rank(y.innerHTML)-rank(x.innerHTML))[0];
      if(!choice) throw Error('No reward in '+a.state.phase);
      choice.listeners.click();
    }
  }
  function place(){
    const s=a.state,candidates=[],targets=new Map();
    for(const tile of s.map.values()) for(const d of tile.roads){const n=a.neighbor(tile.q,tile.r,d);if(!s.map.has(n.q+','+n.r))targets.set(n.q+','+n.r,n);}
    s.hand.forEach((id,index)=>{const card=a.CARD_LIBRARY[id];for(const n of targets.values())for(let rotation=0;rotation<6;rotation++)if(a.canPlace(n.q,n.r,card,rotation)){
      // Extend short fronts first; prefer two-way roads and compact kill zones.
      const score=-(card.roads.length-2)*15-distance(n.q,n.r)*2+(card.slots||0)*2+(card.towerDamage?3:0);
      candidates.push({...n,index,rotation,score});
    }});
    candidates.sort((x,y)=>y.score-x.score);
    if(!candidates.length)throw Error('No legal placement');
    const c=candidates[0];s.selectedCard=c.index;s.rotation=c.rotation;a.placeTile(c.q,c.r);
  }
  function build(){
    const s=a.state;
    const refs=()=>[...s.map.values()].flatMap(tile=>(tile.towers||[]).map((tw,index)=>({tile,tw,index})));
    // Naive buys only basic archers. Other policies use upgrades and freeze support.
    for(let guard=0;guard<60;guard++){
      const all=refs(),owned=all.filter(r=>r.tw),slots=all.filter(r=>!r.tw).sort((x,y)=>distance(x.tile.q,x.tile.r)-distance(y.tile.q,y.tile.r));
      const primary=strategy==='archers'?'archer':strategy==='lightning'?'chain':'catapult';
      const branches={archer:['volley','arrowRain'],chain:['storm','tempest'],catapult:['barrage','rockStorm'],freeze:['deepFrost','absoluteZero']};
      let acted=false;
      if(strategy!=='archers')for(const ref of owned){
        const ids=branches[ref.tw.type],id=ref.tw.branch?ids[1]:ids[0];
        if(!ref.tw.finalUpgrade&&s.gold>=data.UPGRADES[id].cost){s.selectedTower={q:ref.tile.q,r:ref.tile.r,index:ref.index};h.upgradeSelectedTower(id);acted=true;break;}
      }
      if(acted)continue;
      const type=strategy!=='archers'&&owned.length%4===1?'freeze':primary;
      if(!slots.length||s.gold<data.TOWERS[type].cost)break;
      const ref=slots[0];h.selectSlot(ref.tile.q,ref.tile.r,ref.index);h.buyTower(type);
    }
  }
  for(let turn=0;turn<maxWave&&a.state.hp>0;turn++){
    resolve();if(a.state.phase==='place')place();resolve();
    if(a.state.phase!=='build')throw Error('Unexpected phase '+a.state.phase);
    build();a.startWave();let ticks=0;
    while(a.state.waveRunning&&ticks++<24000)a.update(.05,0);
    if(ticks>=24000)throw Error('Wave timeout');
    history.push({wave:a.state.wave,hp:a.state.hp,gold:a.state.gold,towers:[...a.state.map.values()].reduce((n,t)=>n+(t.towers||[]).filter(Boolean).length,0)});
  }
  return {seed,strategy,wave:a.state.wave,hp:a.state.hp,history};
}
if(require.main===module){
  const results=[];
  for(const strategy of ['archers','catapult','lightning'])for(const seed of ['balance-1','balance-2','balance-3','balance-4']){
    const result=run(seed,strategy,Number(process.env.BALANCE_WAVES)||40);results.push(result);console.log(JSON.stringify({...result,history:undefined}));
  }
  if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(results,null,2)+'\n');
}
module.exports={run};

