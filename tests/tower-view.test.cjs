const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {load}=require('./helpers/game.cjs');
const context={};vm.runInNewContext(fs.readFileSync(require.resolve('../classes/tower-view.js'),'utf8')+';globalThis.view=HexTowerView;',context);const view=context.view;
const walk=node=>[node,...node.children.flatMap(walk)];
function fixture(type='archer'){
 const env=load(),{a}=env; const tower={type,level:1,paid:25,builtOnWave:0,biome:'grass'};
 a.state.map.set('1,0',{q:1,r:0,type:'straight',roads:[0,3],slots:1,towers:[tower]});a.state.selectedTower={q:1,r:0,index:0};a.state.selectedTowers=[];a.state.phase='build';a.state.gold=200;env.elements.get('arsenalOverlay').classList.add('hidden');a.renderAll();return {...env,tower};
}
const cards=env=>env.elements.get('towerUpgrades').children.filter(n=>n.className==='towerUpgradeCard');
const button=(node,match)=>walk(node).find(n=>match(n));
test('current damage has exact labelled values; comparisons retain unchanged and special metrics',()=>{
 const {data}=load(),archer=data.towerDefinition({type:'archer'}),volley=data.towerDefinition({type:'archer',branch:'volley'});
 const summary=view.summary(archer);for(const s of ['Leben','Rüstung','Magieresistenz','11,25','5,85'])assert.ok(summary.includes(s));
 const comparison=view.comparison(archer,volley);for(const s of ['8,75','4,55','Reichweite','150','Flächenradius','55'])assert.ok(comparison.includes(s));
 const defs=[...Object.keys(data.TOWERS).map(type=>data.towerDefinition({type})),...Object.entries(data.UPGRADES).map(([id,u])=>data.towerDefinition({type:u.tower,branch:u.requires||id,...(u.requires?{finalUpgrade:id}:{})}))];
 for(const def of defs){const rows=view.rows(def);assert.ok(rows.every(r=>Number.isFinite(r.value)),def.name);for(const key of ['splash','chain','jumpRange','pierceTargets','hitSlow','slowDuration','soulLimit','soulDamage','soulDuration','bossMultiplier'])if(def[key])assert.ok(rows.some(r=>r.id===key),def.name+': '+key);}
 assert.match(view.summary(data.towerDefinition({type:'freeze'})),/Aura · kein Schaden/);assert.doesNotMatch(view.summary(data.towerDefinition({type:'freeze'})),/Magieresistenz/);
 assert.match(view.summary(data.towerDefinition({type:'mine'})),/Zeit zwischen Minen/);
});
test('compare never purchases, Escape returns to choices, purchase charges exactly once',()=>{
 const e=fixture(),{a,tower,documentListeners}=e;assert.equal(cards(e).length,2);
 button(cards(e)[0],n=>n.id==='compare-volley').listeners.click();assert.equal(a.state.gold,200);assert.equal(tower.branch,undefined);assert.equal(cards(e).length,1);assert.ok(a.state.previewUpgrade);
 documentListeners.keydown({key:'Escape',preventDefault(){}});assert.equal(cards(e).length,2);assert.ok(a.state.selectedTower);assert.equal(a.state.previewUpgrade,null);
 button(cards(e)[0],n=>n.className?.includes('towerBuy')).listeners.click();assert.equal(a.state.gold,165);assert.equal(tower.branch,'volley');
});
test('gold changes preserve controls and update missing amount and live market price',()=>{
 const e=fixture(),{a}=e,buy=button(cards(e)[0],n=>n.className?.includes('towerBuy'));
 // The first render normalizes priorities; the next render settles that cache key.
 a.renderAll();const stable=button(cards(e)[0],n=>n.className?.includes('towerBuy'));
 a.state.gold=0;a.renderAll();assert.equal(button(cards(e)[0],n=>n.className?.includes('towerBuy')),stable);assert.equal(stable.disabled,true);assert.match(stable.textContent,/35 fehlen/);
 assert.equal(button(cards(e)[0],n=>n.id==='compare-volley').disabled,undefined);
 a.state.map.get('1,0').buildings=[{type:'market',level:1}];a.state.buildingVersion=(a.state.buildingVersion||0)+1;a.state.gold=30;a.renderAll();const discounted=button(cards(e)[0],n=>n.className?.includes('towerBuy'));assert.equal(discounted.disabled,false);assert.match(discounted.textContent,/30 Gold/);
 discounted.listeners.click();assert.equal(a.state.gold,0);assert.equal(e.tower.paid,55);
});
test('locked ultimates remain comparable without purchase, all three element branches remain available',()=>{
 const e=fixture();Object.assign(e.tower,{branch:'volley',finalUpgrade:'arrowRain',level:3});e.a.renderAll();assert.equal(cards(e).length,1);assert.equal(button(cards(e)[0],n=>n.className?.includes('towerBuy')),undefined);
 button(cards(e)[0],n=>n.id==='compare-ultimate:archer').listeners.click();assert.match(cards(e)[0].children.find(n=>n.innerHTML.includes('towerValueTable')).innerHTML,/Flächenradius/);
 const element=fixture('element');assert.equal(cards(element).length,3);
});
test('changing selection clears comparison; support effects use effective values',()=>{
 const e=fixture();button(cards(e)[0],n=>n.id==='compare-volley').listeners.click();
 e.a.state.map.set('2,0',{q:2,r:0,type:'straight',roads:[0,3],slots:1,towers:[{type:'ballista',level:1,paid:55,supportDamage:1.3,supportRange:1.15}]});e.a.state.selectedTower={q:2,r:0,index:0};e.a.renderAll();assert.equal(cards(e).length,2);assert.equal(e.elements.get('selectedTowerInfo').classList.contains('hidden'),false);assert.match(e.elements.get('towerExtraValues').innerHTML,/Boss-Schadensfaktor/);assert.match(e.elements.get('towerInfluences').innerHTML,/Unterstützung/);
});
test('temporary overload updates current and compared attack intervals, then expires cleanly',()=>{
 const e=fixture();e.a.state.elapsedMs=100;e.tower.overloadUntil=1000;e.a.renderAll();assert.match(e.elements.get('selectedTowerInfo').innerHTML,/0,37 s/);assert.match(e.elements.get('towerInfluences').innerHTML,/Überladung aktiv/);
 button(cards(e)[0],n=>n.id==='compare-volley').listeners.click();const buy=button(cards(e)[0],n=>n.className?.includes('towerBuy'));buy.listeners.pointerenter();buy.listeners.pointerleave();assert.ok(e.a.state.previewUpgrade);assert.match(cards(e)[0].children.find(n=>n.innerHTML.includes('towerValueTable')).innerHTML,/0,43 s/);
 e.a.state.elapsedMs=1001;e.a.renderAll();assert.match(cards(e)[0].children.find(n=>n.innerHTML.includes('towerValueTable')).innerHTML,/0,65 s/);assert.doesNotMatch(e.elements.get('towerInfluences').innerHTML,/Überladung aktiv/);
});
