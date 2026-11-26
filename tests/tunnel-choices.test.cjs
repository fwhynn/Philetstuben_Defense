const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const loadCore=require('../headless-core.cjs'),{load}=require('./helpers/game.cjs');
const json=v=>JSON.parse(JSON.stringify(v)),pick=p=>({q:p.q,r:p.r,source:p.source});
function narrow(c,s,rotation=0){
 s.map.clear();s.landmarks.clear();s.openingRemaining=0;s.phase='build';s.hand=[];s.tunnelOffer=null;s.tunnelChoice=null;s.drawResult='tunnel';
 const rotate=(q,r)=>{for(let i=0;i<rotation;i++)[q,r]=[q+r,-q];return {q,r};};
 const tile=(q,r,roads,type='buildingPlot')=>{const p=rotate(q,r);s.map.set(c.map.key(p.q,p.r),{...p,type,roads:roads.map(d=>(d+rotation)%6),slots:0,towers:[],buildingSlots:0,buildings:[],income:0});};
 tile(0,0,[0],'base');tile(1,0,[0,3],'straight');for(const d of [1,2,4,5]){const n=c.map.neighbor(2,0,d);tile(n.q,n.r,[]);}
 s.tunnelOffer=c.map.tunnelPlan(s.map,s.landmarks,true,s.difficulty==='dual'?2:1);
}
function run(difficulty='dual',rotation=0){const c=loadCore(),r=c.runtime.create({seed:'tunnel-choices',runId:'tunnel-test',difficulty,loadout:['archer','catapult','chain','freeze','mine']});narrow(c,r.state,rotation);return {c,...r};}

for(const difficulty of ['normal','dual'])for(let rotation=0;rotation<6;rotation++)test(`${difficulty}: nearby choices stay expandable and preserve all old routes (rotation ${rotation})`,()=>{
 const {c,state:s,random}=run(difficulty,rotation),before=json([...s.map]),gold=s.gold,choices=s.tunnelOffer.choices;
 assert.equal(choices.length,3);assert.equal(new Set(choices.map(p=>p.q+','+p.r)).size,3);assert.equal(new Set(choices.map(p=>p.source)).size,1);
 assert.equal(choices[0].distance,1,'best exit can touch the existing map');assert.deepEqual(json(c.map.tunnelPlans(s.map,s.landmarks,true,difficulty==='dual'?2:1)),json(choices));
 const routes=c.map.routeGraph(s.map),checkpoint=c.snapshot.capture(s,random);
 for(const p of choices){
  const restored=c.snapshot.restore(checkpoint).state;assert.equal(c.runtime.rescueTunnel(restored,pick(p)),true);assert.equal(restored.gold,gold);assert.equal(restored.map.size,before.length+1);
  const id=c.map.key(p.q,p.r),tile=restored.map.get(id),after=c.map.routeGraph(restored.map);
  assert.equal(tile.slots,0);assert.equal(tile.buildingSlots,0);assert.equal(tile.roads.length,difficulty==='dual'?2:1);
  assert.deepEqual(json(c.map.buildGraph(restored.map).get(id)),[p.source],'only the original road is connected');
  for(const [key,old] of before){assert.deepEqual(json({...restored.map.get(key),tunnels:undefined,tunnelLabel:undefined}),json(old));assert.equal(after.distances.get(key),routes.distances.get(key),'no shorter route for old tiles');}
  for(const d of tile.roads){
   const n=c.map.neighbor(p.q,p.r,d),incoming=[];
   for(let e=0;e<6;e++){const a=c.map.neighbor(n.q,n.r,e);if(restored.map.get(c.map.key(a.q,a.r))?.roads?.includes(c.map.OPP(e)))incoming.push(e);}
   assert.ok(Array.from({length:6},(_,e)=>e).some(e=>!incoming.includes(e)&&c.map.canPlace(restored.map,n.q,n.r,{id:'rescue',roads:[...incoming,e],rescue:true,minExits:1},0,restored.landmarks)),'each opening admits an actual continuation');
  }
  assert.equal(c.runtime.rescueTunnel(restored,pick(p)),false,'cannot build twice');
 }
});

test('landmarks, closed pockets and road side collisions are excluded',()=>{
 const {c,state:s}=run(),blocked=s.tunnelOffer.choices[0];s.landmarks.set(c.map.key(blocked.q,blocked.r),{q:blocked.q,r:blocked.r,type:'boss',claimed:false});
 const choices=c.map.tunnelPlans(s.map,s.landmarks,true,2);assert.ok(choices.length);assert.ok(choices.every(p=>p.q!==blocked.q||p.r!==blocked.r));
 for(const p of choices)for(let d=0;d<6;d++){const n=c.map.neighbor(p.q,p.r,d),other=s.map.get(c.map.key(n.q,n.r));if(other){assert.equal(p.roads.includes(d),false);assert.equal(other.roads.includes(c.map.OPP(d)),false);}}
 const pocket={q:15,r:15};for(let d=0;d<6;d++){const n=c.map.neighbor(pocket.q,pocket.r,d);s.map.set(c.map.key(n.q,n.r),{...n,type:'buildingPlot',roads:[]});}
 assert.equal(c.map.exterior(s.map,s.landmarks).has('15,15'),false);assert.ok(c.map.tunnelPlans(s.map,s.landmarks,true,2).every(p=>p.q!==15||p.r!==15));
});

test('forged, stale and malformed selections do not mutate a run',()=>{
 const {c,state:s}=run(),before=json(s.tunnelOffer),map=json([...s.map]),selected=pick(s.tunnelOffer.choices[1]);
 for(const payload of [null,[],{q:999,r:999,source:selected.source},{...selected,source:'0,0'},{...selected,q:1.5},{...selected,roads:[0]}]){assert.equal(c.runtime.rescueTunnel(s,payload),false);assert.deepEqual(json([...s.map]),map);}
 s.map.set(c.map.key(selected.q,selected.r),{q:selected.q,r:selected.r,type:'buildingPlot',roads:[],towers:[]});assert.equal(c.runtime.rescueTunnel(s,selected),false);assert.deepEqual(json(s.tunnelOffer),before);
});

test('a saved choice survives restoration and old offers acquire nearby alternatives',()=>{
 const {c,state:s,random}=run();s.tunnelChoice=pick(s.tunnelOffer.choices[2]);s.tunnelConfirmed=true;
 const restored=c.snapshot.restore(json(c.snapshot.capture(s,random))).state;assert.deepEqual(json(restored.tunnelChoice),json(s.tunnelChoice));assert.equal(c.map.tunnelPreview(restored).index,2);
 delete s.tunnelOffer.choices;delete s.tunnelOffer.roads;s.tunnelChoice={q:100,r:100,source:'1,0'};
 const legacy=c.snapshot.restore(json(c.snapshot.capture(s,random))).state;assert.equal(legacy.tunnelOffer.choices.length,3);assert.equal(legacy.tunnelChoice,null);
});

test('Solo previews and selects on the map or buttons before building the chosen exit',()=>{
 const {a,elements}=load(),c=loadCore(),s=a.state;narrow(c,s);a.renderAll();const size=s.map.size;
 elements.get('tunnelRescueBtn').listeners.click();assert.equal(s.tunnelConfirmed,true);assert.equal(s.map.size,size);
 const buttons=elements.get('tunnelRescueChoices').children;assert.equal(buttons.length,3);assert.equal(buttons[0].attributes['aria-pressed'],'true');
 const board=elements.get('board'),hits=()=>board.children.flatMap(layer=>layer.children||[]).filter(n=>n.dataset?.tunnelChoice!==undefined);
 assert.equal(hits().length,3);hits()[1].listeners.click({stopPropagation(){}});assert.equal(c.map.tunnelPreview(s).index,1);assert.equal(s.map.size,size);
 buttons[2].listeners.click();const selected=c.map.tunnelPreview(s).selected;assert.equal(c.map.tunnelPreview(s).index,2);assert.equal(elements.get('tunnelRescueChoices').children[2],buttons[2],'choice buttons keep keyboard focus');
 elements.get('tunnelRescueBtn').listeners.click();assert.equal(s.map.get(selected.q+','+selected.r).type,'rescueTunnel');assert.equal(hits().length,0);assert.equal(elements.get('tunnelRescuePanel').classList.contains('hidden'),true);
});

test('3D preview has selectable exits, road arrows, a dashed link and cached disposable geometry',async()=>{
 const THREE=await import('three'),{c,state}=run();state.tunnelConfirmed=true;
 const ctx={THREE,state,HexMap:c.map,axialToWorld:c.map.axialToWorld,scene:new THREE.Scene(),flatHex:new THREE.CylinderGeometry(50,50,1,6),outline:new THREE.RingGeometry(46,50,6).rotateX(-Math.PI/2),basic:(color,opacity)=>new THREE.MeshBasicMaterial({color,opacity,transparent:true}),pickDirty:false};
 const source=fs.readFileSync(require.resolve('../classes/three-renderer.js'),'utf8'),start=source.indexOf('  const tunnelVisuals='),end=source.indexOf('  // ---- Auswahl,',start);
 vm.runInNewContext(source.slice(start,end)+';globalThis.sync=syncTunnelVisuals;globalThis.visuals=tunnelVisuals;',ctx);ctx.sync();
 const children=[...ctx.visuals.children],hits=children.filter(o=>o.userData.pick);assert.equal(hits.length,3);assert.equal(children.filter(o=>o.isLine&&o.material.isLineDashedMaterial).length,1);
 assert.equal(children.filter(o=>o.geometry.type==='CylinderGeometry'&&o.geometry!==ctx.flatHex).length,3*2*3,'shaft and two arrowhead segments for each dual opening');
 ctx.visuals.updateMatrixWorld(true);const p=c.map.axialToWorld(state.tunnelOffer.choices[1].q,state.tunnelOffer.choices[1].r),ray=new THREE.Raycaster(new THREE.Vector3(p.x,100,p.y),new THREE.Vector3(0,-1,0));assert.equal(ray.intersectObjects(hits)[0].object.userData.pick.index,1);
 let disposed=0;children.forEach(o=>{if(o.geometry!==ctx.flatHex&&o.geometry!==ctx.outline)o.geometry.addEventListener('dispose',()=>disposed++);});ctx.sync();assert.deepEqual(ctx.visuals.children,children);assert.equal(disposed,0);
 state.tunnelChoice=pick(state.tunnelOffer.choices[2]);ctx.sync();assert.ok(disposed>0);state.tunnelOffer=null;ctx.sync();assert.equal(ctx.visuals.children.length,0);
});

function duoFixture(difficulty='dual'){
 const c=loadCore(),{createRoom}=require('../server/duo-room.cjs');let room=createRoom({seed:'tunnel-room',loadouts:Array(2).fill(['archer','catapult','chain','freeze','mine']),now:()=>1000});const a=room.connect(0),b=room.connect(1),saved=room.checkpoint(),match=c.duo.restore(saved.match);
 match.boards[0].state.difficulty=difficulty;narrow(c,match.boards[0].state);saved.match=c.duo.capture(match);room=createRoom({snapshot:saved,now:()=>1000});room.touch(a.token);room.touch(b.token);
 const packet=(action,payload)=>{const v=room.view(a.token);return {epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[0].phase,action,payload};};
 return {c,room,a,b,packet,createRoom};
}

for(const difficulty of ['normal','dual'])for(let index=0;index<3;index++)test(`Duo server validates, builds and restores ${difficulty} choice ${index+1} idempotently`,()=>{
 const {room,a,b,packet,createRoom}=duoFixture(difficulty),view=room.view(a.token),own=view.boards[0],partner=json(view.boards[1]),plan=own.tunnelOffer.choices[index];assert.equal(own.tunnelOffer.choices.length,3);
 assert.equal(room.view(b.token).boards[0].tunnelOffer,undefined,'choices only belong to the acting player');
 const command=packet('tunnel',pick(plan));assert.equal(room.receive(a.token,command).ok,true);assert.equal(room.receive(a.token,command).duplicate,true);
 const built=room.view(a.token).boards[0],tile=built.map.find(t=>t.q===plan.q&&t.r===plan.r);assert.equal(tile.type,'rescueTunnel');assert.equal(tile.roads.length,difficulty==='dual'?2:1);assert.equal(built.gold,own.gold);assert.equal(built.tunnelOffer,null);assert.deepEqual(json(room.view(a.token).boards[1]),partner);
 const restored=createRoom({snapshot:json(room.checkpoint()),now:()=>2000});restored.touch(a.token);restored.touch(b.token);assert.equal(restored.receive(a.token,command).duplicate,true);assert.deepEqual(json(restored.view(a.token).boards[0].map),json(built.map));
});

test('Duo rejects tampered coordinates and entrances without spending gold or altering either board',()=>{
 const {room,a,packet}=duoFixture(),before=json(room.view(a.token).boards),p=before[0].tunnelOffer.choices[0];
 for(const payload of [{q:999,r:999,source:p.source},{...pick(p),source:'0,0'},{...pick(p),q:'1'},{...pick(p),roads:[0,1]},{index:1}])assert.equal(room.receive(a.token,packet('tunnel',payload)).ok,false);
 assert.deepEqual(json(room.view(a.token).boards),before);
 // Old clients with an empty payload still use the first validated choice.
 assert.equal(room.receive(a.token,packet('tunnel',{})).ok,true);
});

test('Duo preview stays local, survives snapshots and sends the chosen exit only after confirmation',async()=>{
 const {c,room,a,packet}=duoFixture(),duo={real:true,calls:[]},ui=load({duo}),refresh=()=>duo.receive(room.view(a.token));refresh();
 const s=duo.api.getState(),size=s.map.size,button=ui.elements.get('tunnelRescueBtn');button.listeners.click();assert.equal(duo.calls.length,0);assert.equal(s.tunnelConfirmed,true);
 ui.elements.get('tunnelRescueChoices').children[2].listeners.click();const selected=pick(c.map.tunnelPreview(s).selected);refresh();assert.equal(c.map.tunnelPreview(s).index,2);assert.equal(s.tunnelConfirmed,true);
 button.listeners.click();await Promise.resolve();assert.deepEqual(json(duo.calls.at(-1)),{action:'tunnel',payload:selected});assert.equal(s.map.size,size,'no speculative local construction');
 assert.equal(room.receive(a.token,packet('tunnel',duo.calls.at(-1).payload)).ok,true);refresh();assert.equal(s.map.size,size+1);assert.equal(s.tunnelConfirmed,false);
 ui.elements.get('duoQuickMap').listeners.click();const count=duo.calls.length;ui.rendererCommands.selectTunnel(0);button.listeners.click();assert.equal(duo.calls.length,count,'partner board is read-only');
});
