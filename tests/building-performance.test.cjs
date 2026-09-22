const {test}=require('node:test'),assert=require('node:assert/strict');
const {load,fixture}=require('../scripts/building-performance.cjs');
const json=v=>JSON.parse(JSON.stringify(v));
function applies(b,source,target,building){const def=b.definition(building),dq=source.q-target.q,dr=source.r-target.r;return def&&(Math.max(Math.abs(dq),Math.abs(dr),Math.abs(dq+dr))<=def.radius||building.special&&building.target===target.q+','+target.r);}
test('building workload eliminates repeated definitions without dropping effects or highlighted tiles',()=>{
  const api=load(),s=fixture();
  for(const t of s.map.values())api.buildings.effects(s.map,t);
  api.buildings.highlight(s);api.buildings.refresh(s);assert.equal(api.calls,723);
  assert.equal(s.map.get('0,0').towers[0].supportDamage,1.3);
  assert.equal(s.map.get('7,0').towers[0].supportDamage,1.3);
  assert.equal(s.map.get('5,0').towers[0].supportDamage,1);
});
test('building highlights match independent coverage after upgrades, target changes and removal',()=>{
  const {buildings:b}=load(),s=fixture();
  for(let stage=0;stage<5;stage++){
    const source=s.map.get('0,0'),building=source.buildings[0];
    if(stage===1)building.level=1;
    if(stage===2)building.target='59,0';
    if(stage===3)s.map.get('20,0').buildings=[];
    if(stage===4){building.type='market';building.level=2;}
    const highlight=b.highlight(s),expected=[...s.map.values()].filter(t=>applies(b,source,t,building)),covered=new Map();
    for(const tile of s.map.values())for(const other of tile.buildings)if(other!==building&&other.type===building.type)for(const target of s.map.values())if(applies(b,tile,target,other))covered.set(target.q+','+target.r,target);
    assert.deepEqual(json(highlight.tiles),json(expected));assert.deepEqual(json(highlight.otherTiles),json([...covered.values()]));
    b.refresh(s);for(const tile of s.map.values())for(const tower of tile.towers)assert.equal(tower.supportDamage,b.effects(s.map,tile).damage);
  }
});
