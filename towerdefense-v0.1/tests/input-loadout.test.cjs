const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs');
function unlock(elements,key){const walk=e=>[e,...(e.children||[]).flatMap(walk)];walk(elements.get('arsenalChoices')).find(e=>e.attributes?.['data-unlock']===key).listeners.click();}
test('Q and E rotate the camera in opposite directions without changing hex rotation',()=>{
  const turns=[],{a,documentListeners}=load({rotateView:direction=>turns.push(direction)});
  const key=key=>documentListeners.keydown({key,preventDefault(){}});
  key('q');a.advanceCamera(16);documentListeners.visibilitychange();key('E');a.advanceCamera(16);documentListeners.keyup({key:'E'});assert.ok(turns[0]<0&&turns[1]>0);assert.ok(Math.abs(turns[0]+turns[1])<1e-9);assert.equal(a.state.rotation,0);
  documentListeners.keydown({key:'q',target:{tagName:'INPUT'}});assert.equal(turns.length,2);
});
test('G toggles and saves the grid, ignores held repeats and text input',()=>{
  const {a,elements,storage,documentListeners}=load(),key=documentListeners.keydown;
  key({key:'g',preventDefault(){}});assert.equal(a.state.showHexGrid,true);assert.equal(elements.get('hexGrid').checked,true);assert.equal(storage.get('hexGrid'),'true');
  key({key:'g',repeat:true});assert.equal(a.state.showHexGrid,true);
  key({key:'g',target:{tagName:'INPUT'}});assert.equal(a.state.showHexGrid,true);
  key({key:'g',ctrlKey:true});assert.equal(a.state.showHexGrid,true);
  key({key:'G',preventDefault(){}});assert.equal(a.state.showHexGrid,false);assert.equal(storage.get('hexGrid'),'false');
});
test('grid setting persists and diamond HUD forecasts only unpaid run rewards',()=>{
  const {a,elements,storage}=load({initialStorage:{hexGrid:'true'}});
  assert.equal(a.state.showHexGrid,true);assert.equal(elements.get('hexGrid').checked,true);
  elements.get('hexGrid').checked=false;elements.get('hexGrid').listeners.change();
  assert.equal(a.state.showHexGrid,false);assert.equal(storage.get('hexGrid'),'false');
  a.newRun();assert.equal(a.state.showHexGrid,false);
  a.state.wave=10;a.state.earnedMeta.periodicBosses=1;a.state.earnedMeta.explorationBosses=1;
  a.renderAll();assert.equal(elements.get('runDiamonds').textContent,'(+15)');
  a.state.metaSettled=true;a.renderAll();assert.equal(elements.get('runDiamonds').textContent,'(+0)');
});

test('middle click rotates clockwise, R remains available, and building phase does not rotate',()=>{
  const {a,elements,documentListeners}=load();let prevented=0;
  const middle=()=>elements.get('board').listeners.pointerdown({button:1,preventDefault(){prevented++;}});
  assert.equal(a.state.rotation,0);middle();assert.equal(a.state.rotation,5);assert.equal(prevented,1);
  documentListeners.keydown({key:'r'});assert.equal(a.state.rotation,0);
  for(let i=0;i<6;i++)middle();assert.equal(a.state.rotation,0);
  a.state.phase='build';middle();assert.equal(a.state.rotation,0);
});

test('arsenal unlocks refresh an open loadout and both new towers can be taken into a run',()=>{
  const {a,elements,storage,selectSlot,buyTower}=load({initialProfile:{diamonds:100}});
  elements.get('newRunBtn').listeners.click();
  elements.get('menuArsenalBtn').listeners.click();
  for(const id of ['ballista','flame'])unlock(elements,'tower:'+id);
  assert.equal(elements.get('loadoutChoices').children.length,7);
  elements.get('closeArsenalBtn').listeners.click();
  const choices=()=>elements.get('loadoutChoices').children;
  choices()[5].listeners.click();assert.match(elements.get('loadoutWarning').textContent,/fünf Plätze/);
  choices()[0].listeners.click();choices()[5].listeners.click();
  choices()[1].listeners.click();choices()[6].listeners.click();
  elements.get('confirmLoadoutBtn').listeners.click();
  assert.ok(a.state.towerLoadout.includes('ballista'));assert.ok(a.state.towerLoadout.includes('flame'));
  const saved=JSON.parse(storage.get('hex-bastion-profile-v1'));
  assert.deepEqual(Array.from(a.state.towerLoadout),saved.activeLoadout);assert.equal(saved.diamonds,45);
  a.state.phase='build';a.state.gold=1000;
  a.state.map.set('1,0',{q:1,r:0,type:'cross',roads:[0,1,3,4],slots:2,towers:[null,null]});
  selectSlot(1,0,0);buyTower('ballista');selectSlot(1,0,1);buyTower('flame');
  assert.equal(a.state.map.get('1,0').towers[0].type,'ballista');
  assert.equal(a.state.map.get('1,0').towers[1].type,'flame');
  const reloaded=load({initialProfile:saved});assert.deepEqual(Array.from(reloaded.a.state.towerLoadout),saved.activeLoadout);
});


test('element and necromancer unlock, enter a five-slot loadout and build with upgrade choices',()=>{
  const {a,elements,storage,selectSlot,buyTower,data}=load({initialProfile:{diamonds:100}});
  elements.get('newRunBtn').listeners.click();elements.get('menuArsenalBtn').listeners.click();
  for(const id of ['element','necromancer'])unlock(elements,'tower:'+id);
  elements.get('closeArsenalBtn').listeners.click();const choices=()=>elements.get('loadoutChoices').children;
  choices()[0].listeners.click();choices()[5].listeners.click();choices()[1].listeners.click();choices()[6].listeners.click();
  elements.get('confirmLoadoutBtn').listeners.click();assert.equal(a.state.towerLoadout.length,5);
  assert.ok(a.state.towerLoadout.includes('element'));assert.ok(a.state.towerLoadout.includes('necromancer'));
  assert.equal(JSON.parse(storage.get('hex-bastion-profile-v1')).diamonds,0);
  a.state.phase='build';a.state.gold=1000;a.state.map.set('1,0',{q:1,r:0,type:'cross',roads:[0,1,3,4],slots:2,towers:[null,null]});
  selectSlot(1,0,0);buyTower('element');selectSlot(1,0,1);buyTower('necromancer');
  const [element,necro]=a.state.map.get('1,0').towers;
  assert.equal(data.availableUpgrades(element).length,3);assert.equal(data.availableUpgrades(necro).length,2);
  necro.souls=[{until:10000,lastShot:0}];a.endWave();assert.equal(necro.souls.length,0);
});

test('camera acceleration is frame independent and focus loss stops its inertia',()=>{
  function run(step){const turns=[],{a,documentListeners}=load({rotateView:v=>turns.push(v)});documentListeners.keydown({key:'q',preventDefault(){}});for(let t=step;t<=100;t+=step)a.advanceCamera(t);const total=turns.reduce((a,b)=>a+b,0);documentListeners.visibilitychange();const count=turns.length;a.advanceCamera(150);assert.equal(turns.length,count);return total;}
  assert.ok(Math.abs(run(10)-run(50))<1e-9);assert.ok(run(10)<0&&run(10)>-.6);
});

test('arsenal menu highlights affordable unlocks and the ingame arsenal action is absent',()=>{
  const rich=load({initialProfile:{diamonds:40}});assert.ok(rich.elements.get('menuArsenalBtn').classList.contains('upgradeAvailable'));assert.equal(rich.elements.has('openArsenalBtn'),false);
  const poor=load();assert.equal(poor.elements.get('menuArsenalBtn').classList.contains('upgradeAvailable'),false);
});

test('element ultimate names follow the chosen branch and keep their bonuses',()=>{
  const {data}=load();for(const [branch,name] of [['elementFire','Weltenbrand'],['elementWater','Ozeanherz'],['elementWind','Himmelssturm']]){const before=data.towerDefinition({type:'element',branch}),after=data.towerDefinition({type:'element',branch,ultimate:'element'});assert.equal(after.name,name);assert.equal(after.damage,Number((before.damage*1.3).toFixed(2)));}
});

test('WASD pans continuously and U distinguishes locked, available and maxed upgrades without gold',()=>{
  const {a,data,elements,documentListeners}=load();const before=elements.get('board').attributes.viewBox;
  documentListeners.keydown({key:'w',preventDefault(){}});a.advanceCamera(16);assert.notEqual(elements.get('board').attributes.viewBox,before);documentListeners.keyup({key:'w'});const stopped=elements.get('board').attributes.viewBox;documentListeners.visibilitychange();a.advanceCamera(32);assert.equal(elements.get('board').attributes.viewBox,stopped);
  a.state.gold=0;documentListeners.keydown({key:'u',preventDefault(){}});assert.equal(a.state.showUpgradeStatus,true);assert.equal(data.upgradeStatus(a.state,{type:'archer'}),'↑');assert.equal(data.upgradeStatus(a.state,{type:'archer',branch:'marksman',finalUpgrade:'eagleEye'}),'');a.state.ultimateUnlocks=['ultimate:archer'];assert.equal(data.upgradeStatus(a.state,{type:'archer',branch:'marksman',finalUpgrade:'eagleEye'}),'↑');assert.equal(data.upgradeStatus(a.state,{type:'archer',ultimate:'archer'}),'');
  documentListeners.keydown({key:'u',preventDefault(){}});assert.equal(a.state.showUpgradeStatus,false);
});

test('defeat leads to main menu and loadout cancellation no longer offers a dead run',()=>{
  const {a,elements}=load();a.state.hp=0;a.state.waveRunning=true;a.state.pendingSpawns=1;a.update(.01,1);assert.equal(a.state.phase,'gameover');elements.get('changeLoadoutBtn').listeners.click();assert.equal(elements.get('cancelLoadoutBtn').textContent,'Zurück zum Hauptmenü');elements.get('cancelLoadoutBtn').listeners.click();assert.equal(elements.get('menuContinueBtn').classList.contains('hidden'),true);elements.get('gameOverMenuBtn').listeners.click();assert.equal(elements.get('gameOverOverlay').classList.contains('hidden'),true);
});

test('research map exposes all towers and buildings and reset needs confirmation before refund',()=>{
  const {elements,storage}=load({initialProfile:{diamonds:100}});elements.get('menuArsenalBtn').listeners.click();assert.equal(elements.get('arsenalChoices').children.length,12);unlock(elements,'tower:ballista');assert.equal(JSON.parse(storage.get('hex-bastion-profile-v1')).diamonds,80);
  elements.get('resetDiamondsBtn').listeners.click();assert.equal(JSON.parse(storage.get('hex-bastion-profile-v1')).diamonds,80);elements.get('resetDiamondsBtn').listeners.click();const p=JSON.parse(storage.get('hex-bastion-profile-v1'));assert.equal(p.diamonds,100);assert.equal(p.unlockedTowers.includes('ballista'),false);assert.equal(elements.get('resetDiamondsBtn').disabled,true);
});

test('research map pans without scrolling, zooms around the pointer and fits the viewport',()=>{
  const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');assert.ok(html.indexOf('src="arsenal.js"')<html.indexOf("s.src='game.js'"));
  const context={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../arsenal.js'),'utf8')+';globalThis.drag=HexArsenal.enableDrag;',context);
  const handlers={},content={style:{},offsetWidth:1600,offsetHeight:1200},view={clientWidth:800,clientHeight:600,scrollLeft:0,scrollTop:0,getBoundingClientRect(){return {left:0,top:0};},addEventListener(k,v){handlers[k]=v;},setPointerCapture(){}};const camera=context.drag(view,content);
  handlers.pointerdown({button:0,pointerId:1,clientX:100,clientY:100,target:{},preventDefault(){}});handlers.pointermove({pointerId:1,clientX:70,clientY:90});assert.equal(Number(content.style.zoom),.73);assert.ok(Math.abs(parseFloat(content.style.left)*.73+30)<1e-8);assert.ok(Math.abs(parseFloat(content.style.top)*.73+10)<1e-8);handlers.pointercancel({pointerId:1});handlers.pointermove({pointerId:1,clientX:0,clientY:0});assert.equal(view.scrollLeft,0);
  let prevented=false;handlers.wheel({deltaY:100,deltaMode:0,clientX:200,clientY:150,preventDefault(){prevented=true;}});assert.ok(prevented);const scale=Number(content.style.zoom),x=parseFloat(content.style.left)*scale,y=parseFloat(content.style.top)*scale;assert.ok(scale<.73);assert.ok(Math.abs((200-x)/scale-230/.73)<1e-8);assert.ok(Math.abs((150-y)/scale-160/.73)<1e-8);assert.equal(view.scrollTop,0);
  camera.fit();assert.equal(Number(content.style.zoom),.47333333333333333);camera.start();assert.equal(Number(content.style.zoom),.73);assert.ok(Math.abs(parseFloat(content.style.left)*.73-8)<1e-8);
});
