const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('../headless-core.cjs');
function profileApi(){const c={localStorage:{setItem(){},getItem(){return null;}}};vm.runInNewContext(fs.readFileSync('classes/profile.js','utf8')+';globalThis.api=HexProfile',c);return c.api;}
test('specializations can both be owned but exactly one is captured per tower and survives export',()=>{
 const p=profileApi(),d=core().data.TOWERS;let profile={...p.defaults(),diamonds:100};
 profile=p.unlockUltimate(profile,'archer:volley',d);profile=p.unlockUltimate(profile,'archer:marksman',d);
 assert.equal(profile.diamonds,60);assert.equal(p.activeUltimate(profile,'archer'),'volley');assert.equal(p.unlockUltimate(profile,'archer:volley',d),null);
 const before=p.runUnlocks(profile);assert.deepEqual(Array.from(before),['ultimate:archer:volley']);
 profile=p.activateUltimate(profile,'archer:marksman',d);assert.equal(profile.diamonds,60);assert.equal(p.activateUltimate(profile,'chain:storm',d),null);
 profile=p.readFile(p.exportFile(profile,d),d);assert.deepEqual(Array.from(p.runUnlocks(profile)),['ultimate:archer:marksman']);assert.deepEqual(Array.from(before),['ultimate:archer:volley']);assert.equal(p.resetValue(profile),40);
 assert.equal(p.runUnlocks(p.resetUnlocks(profile,d).profile).length,0);
});
test('legacy ultimate ownership preserves both paths without doubling refunds',()=>{
 const p=profileApi(),d=core().data.TOWERS;let profile=p.normalize({...p.defaults(),unlocks:['ultimate:archer']},d);
 assert.ok(p.ownsUltimate(profile,'archer','volley'));assert.ok(p.ownsUltimate(profile,'archer','marksman'));assert.equal(p.resetValue(profile),20);
 profile=p.activateUltimate(profile,'archer:marksman',d);assert.deepEqual(Array.from(p.runUnlocks(profile)),['ultimate:archer:marksman']);assert.equal(p.resetValue(profile),20);
});
test('every branch has a distinct specialization and commands reject an inactive owned path',()=>{
 const c=core();for(const type of Object.keys(c.data.TOWERS)){const branches=c.data.availableUpgrades({type}),names=new Set();for(const [branch] of branches){const finalUpgrade=c.data.availableUpgrades({type,branch})[0][0],t={type,branch,finalUpgrade};names.add(c.data.ultimateDefinition(t).name);assert.notDeepEqual(c.data.towerDefinition(t),c.data.towerDefinition({...t,ultimate:type}));}assert.equal(names.size,branches.length);}
 const state=c.runtime.create({runId:'test',loadout:['archer','catapult','chain','freeze','mine'],seed:'specializations',unlocks:['ultimate:archer:volley']}).state;state.phase='build';state.gold=1000;
 const t={type:'archer',branch:'marksman',finalUpgrade:'eagleEye',level:3,paid:100};state.map.set('1,0',{q:1,r:0,towers:[t],slots:1});const slot={q:1,r:0,index:0};
 assert.equal(c.towers.upgrade(state,slot,'ultimate:archer'),false);assert.equal(state.gold,1000);assert.equal(c.data.runUpgrades(state,t).length,0);
 t.branch='volley';t.finalUpgrade='arrowRain';assert.equal(c.towers.upgrade(state,slot,'ultimate:archer'),true);assert.equal(state.gold,900);assert.equal(c.towers.upgrade(state,slot,'ultimate:archer'),false);
});
test('patrician income scales with other maxed houses and remains stable across refresh, snapshot and sale',()=>{
 const c=core(),run=c.runtime.create({runId:'test',loadout:['archer','catapult','chain','freeze','mine'],seed:'houses',unlocks:['building:house']}),s=run.state;s.phase='build';s.gold=10000;s.income=0;
 for(let q=1;q<=3;q++){s.map.set(q+',0',{q,r:0,buildingSlots:1,buildings:[null],towers:[]});const slot={q,r:0,index:0};assert.ok(c.buildings.buy(s,slot,'house'));assert.ok(c.buildings.upgrade(s,slot));assert.ok(c.buildings.upgrade(s,slot));}
 assert.equal(s.income,24);
 for(let q=1;q<=3;q++){c.buildings.upgrade(s,{q,r:0,index:0});assert.equal(s.income,[0,32,44,60][q]);}
 assert.equal(c.buildings.definition(s.map.get('1,0').buildings[0],s).income,20);c.buildings.refresh(s);assert.equal(s.income,60);
 const restored=c.snapshot.restore(c.snapshot.capture(s,run.random)).state;c.buildings.refresh(restored);assert.equal(restored.income,60);
 c.buildings.sell(restored,{q:1,r:0,index:0});assert.equal(restored.income,36);c.buildings.sell(restored,{q:2,r:0,index:0});assert.equal(restored.income,16);c.buildings.sell(restored,{q:3,r:0,index:0});assert.equal(restored.income,0);
});
