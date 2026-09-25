const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('../headless-core.cjs'),{load}=require('./helpers/game.cjs');
function combat(){const c=vm.createContext({});for(const name of ['data','waves','combat'])vm.runInContext(fs.readFileSync('classes/'+name+'.js','utf8'),c);return vm.runInContext('({data:HexData,combat:HexCombat})',c);}
const enemy=(id,hp=100)=>({id,type:'normal',x:30,y:0,hp,alive:true,index:0,t:0,speed:0,points:[{x:30,y:0},{x:300,y:0}]});
test('every newly built tower gets its strongest damage-pool priority; manual choices survive upgrades and checkpoints',()=>{
 const c=core(),run=c.runtime.create({seed:'focus',runId:'focus-test',loadout:Object.keys(c.data.TOWERS).slice(0,5)}),s=run.state;s.phase='build';s.gold=10000;s.towerLoadout=Object.keys(c.data.TOWERS);
 const expected={archer:'mostHealth',catapult:'mostArmor',chain:'mostMagic',freeze:'closestBase',mine:'mostArmor',ballista:'mostHealth',flame:'mostHealth',element:'mostMagic',necromancer:'mostMagic'};
 let q=1;for(const [type,priority] of Object.entries(expected)){const slot={q:q++,r:0,index:0};s.map.set(slot.q+',0',{q:slot.q,r:0,type:'straight',slots:1,towers:[null]});assert.ok(c.towers.buy(s,type,[slot]).ok);const tower=s.map.get(slot.q+',0').towers[0];assert.equal(tower.targetPriority[0],priority,type);tower.targetPriority=['healer','boss','closestBase'];const upgrade=c.data.availableUpgrades(tower)[0][0];assert.ok(c.towers.upgrade(s,slot,upgrade));assert.equal(tower.targetPriority[0],'healer');}
 const restored=c.snapshot.restore(c.snapshot.capture(s,run.random)).state;assert.equal(restored.map.get('1,0').towers[0].targetPriority[0],'healer');
});
test('targeting uses remaining road distance, respects range and breaks ties with subsequent priorities',()=>{
 const {combat:c,data}=combat(),near={...enemy(1),x:5,points:[{x:5,y:0},{x:200,y:0},{x:0,y:0}]},far={...enemy(2),x:50,points:[{x:50,y:0},{x:0,y:0}]},tower={type:'archer',lastShot:0,targetPriority:['closestBase','mostArmor','boss']};
 assert.equal(c.targetByPriority([near,far],tower,{x:0,y:0}),far,'road distance beats straight-line distance');
 const tied={...far,id:3,armorHp:10};assert.equal(c.targetByPriority([far,tied],tower,{x:0,y:0}),tied);
 const boss={...tied,id:4,type:'boss'};assert.equal(c.targetByPriority([tied,boss],tower,{x:0,y:0}),boss);
 const outside={...enemy(5),x:500,points:[{x:500,y:0},{x:501,y:0}]},s={hp:20,gold:0,goldEarned:{kills:0},enemies:[near,far,outside],projectiles:[]};
 c.step(s,[{tw:tower,pos:{x:0,y:0}}],data.TOWERS,0,2000);assert.equal(s.projectiles[0].hits[0],far.id,'only reachable enemies compete');
 assert.equal(c.targetByPriority([far,near],{targetPriority:['mostArmor','closestBase']},{x:0,y:0}),far,'missing armor falls back');
});
test('kills count the fatal hit once, including mines and spirits, and keep individual tower totals',()=>{
 const {combat:c,data}=combat(),state=()=>({hp:20,gold:0,goldEarned:{kills:0},waveKills:0,enemies:[enemy(1,1)],projectiles:[],runTowerDetails:{1:{type:'archer'},2:{type:'mine'},3:{type:'necromancer'}}});
 const s=state();c.step(s,[1,4].map(statId=>({tw:{type:'archer',statId,lastShot:0},pos:{x:0,y:0}})),data.TOWERS,0,2000);assert.equal(s.runTowerStats.archer.kills,1);assert.equal(s.runTowerDetails[1].kills,1);c.step(s,[],data.TOWERS,0,3000);assert.equal(s.runTowerStats.archer.kills,1);
 const m=state();m.mines=[{id:1,x:30,y:0,damage:50,splash:45,source:{type:'mine',statId:2}}];c.step(m,[],data.TOWERS,0,2000);assert.equal(m.runTowerDetails[2].kills,1);
 const n=state();c.step(n,[{tw:{type:'necromancer',statId:3,lastShot:2000,souls:[{until:9000,lastShot:0}]},pos:{x:0,y:0}}],data.TOWERS,0,2000);assert.equal(n.runTowerDetails[3].kills,1);
 const ui=load();ui.a.state.runTowerStats=s.runTowerStats;ui.a.state.runTowerDetails=s.runTowerDetails;ui.a.renderRunStatistics();assert.match(ui.elements.get('runStatistics').innerHTML,/<th>Kills<\/th>/);
});
test('one persistent switch hides tutorial, biome and hotkey onboarding immediately and across new runs',()=>{
 const ui=load({initialStorage:{'tutorial-v1':'','onboardingHints':'true'}}),get=id=>ui.elements.get(id),s=ui.a.state;
 get('mainMenu').classList.add('hidden');get('restartTutorialBtn').listeners.click();s.lastCompletedWave=11;s.biomeIntro=['desert'];ui.a.renderAll();assert.equal(get('tutorialPanel').classList.contains('hidden'),false);
 get('onboardingHints').checked=false;get('onboardingHints').listeners.change();assert.equal(ui.storage.get('onboardingHints'),'false');assert.equal(get('tutorialPanel').classList.contains('hidden'),true);assert.equal(get('biomeIntro').classList.contains('hidden'),true);assert.equal(get('hotkeyTip').classList.contains('hidden'),true);assert.equal(get('restartTutorialBtn').disabled,true);
 ui.a.newRun();assert.equal(get('tutorialPanel').classList.contains('hidden'),true);
 const restored=load({initialStorage:{'tutorial-v1':'','onboardingHints':'false'}});assert.equal(restored.elements.get('onboardingHints').checked,false);assert.equal(restored.elements.get('tutorialPanel').classList.contains('hidden'),true);
});
test('Arsenal has actual before/after values for every tower branch and ultimate, including nerfs',()=>{
 const c=vm.createContext({});for(const name of ['biomes','data','heroes','profile','buildings','arsenal'])vm.runInContext(fs.readFileSync('classes/'+name+'.js','utf8'),c);
 const trees=vm.runInContext('HexArsenal.trees(HexProfile.normalize({},HexData.TOWERS))',c);
 for(const tree of trees)for(const path of tree.paths){for(const step of [...path.steps,path.meta])assert.ok(step.changes?.length,tree.type+' '+step.name);}
 const frost=trees.find(t=>t.type==='freeze');assert.ok(frost.paths[0].steps[0].changes.includes('Aura-Reichweite: 138 → 119'));assert.ok(frost.paths[1].steps[1].changes.includes('Aura-Reichweite: 190 → 238'));
 const volley=trees.find(t=>t.type==='archer').paths[0].steps[0];assert.ok(volley.changes.some(s=>s.startsWith('Schaden gegen Leben: 11,25 → 8,75')),'downgrades are explicit too');
});
