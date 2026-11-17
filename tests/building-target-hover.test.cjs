const {test}=require('node:test'),assert=require('node:assert/strict'),{load}=require('./helpers/game.cjs');
const {createRoom}=require('../server/duo-room.cjs');
function setup(s,type){
 s.phase='build';s.hp=20;
 s.map.set('0,0',{q:0,r:0,type:'straight',roads:[0,3],slots:1,towers:[{type:'archer',level:1}],buildingSlots:1,buildings:[{type,level:4,special:true,target:'1,0'}]});
 for(const q of [1,4])s.map.set(q+',0',{q,r:0,type:'straight',roads:[0,3],slots:0,towers:[],buildings:[]});
 // A market may relocate its bonus only when another market now covers the old tile.
 if(type==='market'){s.map.get('1,0').buildings=[{type:'market',level:3}];s.map.get('1,0').buildingSlots=1;}
 s.buildingTarget={q:0,r:0,index:0};
}
function descendants(node){return [node,...(node.children||[]).flatMap(descendants)];}
test('extra-hex hover visibly distinguishes valid and blocked tiles for every support building',()=>{
 for(const type of ['forge','market','bastion']){
  const ui=load(),s=ui.a.state;setup(s,type);ui.a.renderAll();
  const targets=()=>[...ui.elements.values()].flatMap(descendants).filter(n=>n.dataset?.buildingTarget);
  const valid=targets().find(n=>n.dataset.buildingTarget==='4,0'),blocked=targets().find(n=>n.dataset.buildingTarget==='1,0');
  assert.ok(valid);assert.ok(blocked);assert.equal(blocked.style.cursor,'not-allowed');const idle=valid.attributes.fill;
  valid.listeners.pointerenter({pointerType:'mouse'});assert.equal(s.hoveredPlacement,'4,0');assert.notEqual(valid.attributes.fill,idle);assert.equal(valid.attributes['stroke-width'],4);
  valid.listeners.pointerleave({pointerType:'mouse'});assert.equal(s.hoveredPlacement,null);assert.equal(valid.attributes.fill,idle);
  blocked.listeners.pointerenter({pointerType:'mouse'});assert.equal(blocked.attributes.stroke,'#ff7d70');blocked.listeners.click({stopPropagation(){}});assert.ok(s.buildingTarget,'blocked click keeps targeting active');
  ui.a.placeTile(4,0);assert.equal(s.buildingTarget,null);assert.equal(s.hoveredPlacement,null);assert.equal(s.map.get('0,0').buildings[0].target,'4,0');
 }
});
test('Duo extra-hex selection ignores blocked clicks without sending a command',()=>{
 const duo={real:true,calls:[]},ui=load({duo}),room=createRoom({seed:'target-hover',loadouts:Array(2).fill(['archer','catapult','chain','freeze','mine'])}),seat=room.connect(0);room.connect(1);duo.receive(room.view(seat.token));
 const s=duo.api.getState();setup(s,'bastion');ui.rendererCommands.placeTile(1,0);assert.equal(duo.calls.length,0);assert.ok(s.buildingTarget);
 ui.rendererCommands.placeTile(4,0);assert.equal(duo.calls.at(-1).action,'buildingTarget');assert.equal(duo.calls.at(-1).payload.target,'4,0');assert.equal(s.buildingTarget,null);
});
