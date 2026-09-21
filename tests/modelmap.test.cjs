const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function load(){const context={};for(const file of ['data.js','map.js','model-map.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../classes',file),'utf8'),context);vm.runInNewContext('globalThis.data=HexData;globalThis.map=HexMap;globalThis.models=HexModelMap;',context);return context;}
test('every card type has a model and its road edges match the shape table',()=>{
  const {data,models}=load();
  for(const [id,card] of Object.entries(data.CARD_LIBRARY)){
    const m=models.modelFor({type:id,rotation:0,roads:card.roads});assert.equal(m.name,(card.procedural?'straight':card.model)||({supplyRoad:'straight',signalCross:'cross'})[id]||id);assert.equal(m.rotation,0);
  }
});
test('tiles keep their stored rotation and base uses the base model',()=>{
  const {models}=load();
  assert.deepEqual({...models.modelFor({type:'tee',rotation:4,roads:[4,0,2]})},{name:'tee',rotation:4});
  assert.equal(models.modelFor({type:'base',roads:[0]}).name,'base');
});
test('rescue hexes pick a model by road shape and rotation, with a procedural fallback',()=>{
  const {models}=load();
  const straight=models.modelFor({type:'rescue',roads:[1,4]});assert.equal(straight.name,'rescue');assert.equal(straight.rotation,1);
  const curve=models.modelFor({type:'rescue',roads:[3,4]});assert.equal(curve.name,'smallCurve');assert.equal(curve.rotation,3);
  const odd=models.modelFor({type:'rescue',roads:[0,1,2]});assert.equal(odd.name,'rescue');assert.equal(odd.proceduralRoads,true);
});
test('claimed landmark prefabs resolve to a tile model with their rotation',()=>{
  const {models,map}=load(),prefab={type:'tJunction',rotation:2,roads:[2,4,5]};
  const m=models.modelFor({type:prefab.type,rotation:prefab.rotation,roads:prefab.roads});assert.equal(m.name,'tJunction');assert.equal(m.rotation,2);
  assert.deepEqual([...map.rotatedRoads({roads:models.SHAPES.tJunction},2)].sort(),[...prefab.roads].sort());
});
test('landmark props avoid roads and the tower slot',()=>{
  const {models,map}=load();
  for(const shape of ['straight','smallCurve','bigCurve','tee','tJunction']){
    const slots=map.slotOffsets(shape,1),angle=models.propAngle(shape,slots),slotAngle=Math.atan2(-slots[0].y,slots[0].x)*180/Math.PI,gap=Math.abs(angle-slotAngle)%360;assert.ok(Math.min(gap,360-gap)>=40,shape+' prop must not sit at the slot');
    const gaps=models.SHAPES[shape].map(d=>Math.min(Math.abs(angle-d*60)%360,360-Math.abs(angle-d*60)%360));assert.ok(Math.min(...gaps)>=30,shape+' prop must not sit on a road');
  }
});
test('tower slots never overlap the road, stay inside the hex and keep their distance, for every rotation',()=>{
  const {data,map}=load();
  const dist=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l2));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);};
  for(const [id,card] of Object.entries(data.CARD_LIBRARY)) for(let rotation=0;rotation<6;rotation++){
    const tile={q:0,r:0,type:id,rotation,roads:map.rotatedRoads(card,rotation),slots:card.slots||0,buildingSlots:card.buildingSlots||0};
    const legs=[...map.roadGeometry(tile).legs.values()],slots=map.slotPositions(tile);assert.equal(slots.length,tile.slots,id);
    slots.forEach((p,i)=>{
      let nearest=Infinity;for(const points of legs) for(let k=0;k<points.length-1;k++) nearest=Math.min(nearest,dist(p,points[k],points[k+1]));
      assert.ok(nearest-9-11>=0,`${id} rot ${rotation} slot ${i}: tower touches the road (${(nearest-20).toFixed(1)})`);
      assert.ok(Math.hypot(p.x,p.y)<=54,`${id} slot ${i} outside hex`);
      if(i) assert.ok(Math.hypot(p.x-slots[0].x,p.y-slots[0].y)>=22,`${id} slots too close`);
    });
  }
});
