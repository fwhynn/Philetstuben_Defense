const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {fixture}=require('./helpers/mine-trigger.cjs');
function load(reference=false){
 let checks=0;const math=Object.create(Math);math.hypot=(...args)=>{checks++;return Math.hypot(...args);};
 const ctx=vm.createContext({Math:math});
 for(const name of ['augment-cards','data','waves'])vm.runInContext(fs.readFileSync('classes/'+name+'.js','utf8'),ctx);
 let src=fs.readFileSync('classes/combat.js','utf8').replace('return {step,durability','return {augmentTicks,step,durability');
 if(reference)src=src.replace('candidates=echoCandidates(state.enemies,due)','candidates=()=>state.enemies');
 vm.runInContext(src,ctx);return {run:vm.runInContext('HexCombat.augmentTicks',ctx),get checks(){return checks;}};
}
function setup(kind){const s=fixture(kind);s.elapsedMs=1000;s.augmentEchoes=s.mines.map((m,i)=>({...m,r:m.splash,at:i%7===0?2000:1000,source:{type:'mine'}}));delete s.mines;return s;}
function compare(s){const copy=structuredClone(s),a=load(),b=load(true),events=[],oldEvents=[];
 a.run(s,[],0,1000,e=>events.push(e));b.run(copy,[],0,1000,e=>oldEvents.push(e));
 assert.deepEqual(JSON.parse(JSON.stringify(s)),JSON.parse(JSON.stringify(copy)));assert.deepEqual(events,oldEvents);return {a,b};
}
test('echo spatial lookup preserves full damage, rewards, pending echoes and effects',()=>{
 for(const kind of ['small','spread','mixed','dense']){const s=setup(kind);s.enemies.forEach((e,i)=>{if(i%5===0)e.shieldHits=3;if(i%7===0)e.resistances={physical:.5};if(i%11===0)e.type='mushroomColossus';});compare(s);}
});
test('echo boundaries, fallback radii and cell edges preserve exact hits',()=>{
 for(const x of [-256,-128,0,128])for(const r of [0,45,512,513]){const s=setup('spread');s.enemies[0].x=x+r;s.enemies[0].y=0;s.augmentEchoes[1]={x,y:0,r,damage:20,at:1000};compare(s);}
});
test('large echo batches reduce exact distance checks without reducing explosions',()=>{
 const s=setup('spread');s.enemies.forEach(e=>e.hp=1000000);const {a,b}=compare(s);
 assert.ok(a.checks<b.checks/10,a.checks+' vs '+b.checks);
});
