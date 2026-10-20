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
test('cached mine index handles repeated ticks, appends, removals and restored arrays identically',()=>{
  const current=load(),reference=load(true),a=fixture(),b=JSON.parse(JSON.stringify(a));
  for(const s of [a,b])s.enemies.forEach(e=>{e.x+=10000;});
  for(let tick=0;tick<6;tick++){
    for(const s of [a,b]){
      if(tick===1)s.mines.push({...s.mines[0],id:900,x:s.enemies[0].x,y:s.enemies[0].y});
      if(tick===2)s.mines=s.mines.filter((_,i)=>i%2);
      if(tick===3)s.mines=JSON.parse(JSON.stringify(s.mines));
      if(tick===4)s.enemies[0].x=s.mines[0].x,s.enemies[0].y=s.mines[0].y;
    }
    const events=[],expected=[];current.trigger(a,e=>events.push(e));reference.trigger(b,e=>expected.push(e));
    assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));assert.deepEqual(events,expected);
  }
});
test('repeated explosions preserve ordered damage and new mine triggers across retained index buckets',()=>{
  const current=load(),reference=load(true),a=fixture('mixed');
  a.enemies.forEach(e=>e.hp=100000);
  const b=JSON.parse(JSON.stringify(a));
  for(let tick=0;tick<15;tick++){
    for(const s of [a,b]){
      s.enemies.forEach(e=>e.x+=9);
      s.mines.push({...s.mines[0],id:1000+tick,x:s.enemies[0].x,y:s.enemies[0].y});
    }
    const events=[],expected=[];current.trigger(a,e=>events.push(e));reference.trigger(b,e=>expected.push(e));
    assert.deepEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)));assert.deepEqual(events,expected);
  }
});
