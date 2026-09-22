const {test}=require('node:test'),assert=require('node:assert/strict');
const {load,fixture}=require('./helpers/mine-trigger.cjs');
function compare(state){
  const original=JSON.parse(JSON.stringify(state)),events=[],expected=[];
  load(true).trigger(original,e=>expected.push(e));load().trigger(state,e=>events.push(e));
  assert.deepEqual(JSON.parse(JSON.stringify(state)),JSON.parse(JSON.stringify(original)));
  assert.deepEqual(events,expected);
}
test('spatial mine triggers preserve entire state and events for sparse, dense and small encounters',()=>{
  for(const kind of ['spread','mixed','dense','small'])compare(fixture(kind));
});
test('spatial triggers preserve inclusive radius, negative cell edges, dead enemies and stacking',()=>{
  for(const x of [-56,-28,-14,0,14,28,56])for(const offset of [13.999999,14,14.000001]){
    const s=fixture();s.enemies.forEach(e=>{e.x+=10000;e.y+=10000;});
    s.enemies[0]={...s.enemies[0],x:x+offset,y:0,hp:1,armorHp:0,magicHp:0};
    s.enemies[1]={...s.enemies[1],x,y:0,alive:false};
    s.enemies[2]={...s.enemies[2],x,y:0,hp:0,armorHp:0,magicHp:0};
    s.mines[0]={...s.mines[0],x,y:0};s.mines[1]={...s.mines[0],id:1};
    compare(s);
  }
});
test('sparse mine field performs fewer exact distance tests',()=>{
  const before=load(true),after=load();before.trigger(fixture(),()=>{});after.trigger(fixture(),()=>{});
  assert.ok(after.checks<before.checks/2,`${after.checks} vs ${before.checks}`);
});
