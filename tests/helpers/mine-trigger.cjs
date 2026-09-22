const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const reference=require('./mine-trigger-reference.cjs');
function load(referenceMode=false){
  let checks=0;const math=Object.create(Math);math.hypot=(...args)=>{checks++;return Math.hypot(...args);};
  const context=vm.createContext({Math:math});
  for(const name of ['data','waves'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../../classes',name+'.js'),'utf8'),context);
  let source=fs.readFileSync(path.join(__dirname,'../../classes/combat.js'),'utf8');
  if(referenceMode){const start=source.indexOf('  function triggerMines('),end=source.indexOf('  // Nur für die Darstellung:',start);source=source.slice(0,start)+reference+'\n'+source.slice(end);}
  source=source.replace('return {step,durability','return {triggerMines,step,durability');vm.runInContext(source,context);
  return {trigger:vm.runInContext('HexCombat.triggerMines',context),get checks(){return checks;}};
}
function fixture(kind='spread'){
  const enemies=Array.from({length:kind==='small'?8:125},(_,id)=>({id,x:kind==='dense'?id%3:(id%25)*90-1080,y:kind==='dense'?id%2:Math.floor(id/25)*90-180,alive:true,hp:100,armorHp:20,magicHp:10,killGold:3}));
  const mines=Array.from({length:kind==='small'?4:500},(_,id)=>({id,x:kind==='dense'?id%3:(id%50)*45-1100,y:kind==='dense'?id%2:Math.floor(id/50)*45-200,damage:26,splash:45,color:'#fff'}));
  if(kind==='mixed')mines.forEach((m,i)=>{if(i%10===0){m.x=enemies[i%enemies.length].x;m.y=enemies[i%enemies.length].y;}});
  return {hp:20,gold:0,goldEarned:{kills:0},waveKills:0,enemies,mines,projectiles:[]};
}
module.exports={load,fixture};
