const {test}=require('node:test'),assert=require('node:assert/strict'),load=require('../../headless-core.cjs'),{createRoom}=require('../duo-room.cjs');
const types=['gravity','wind','poison','meteor','laser','gamble','portal'],plain=x=>JSON.parse(JSON.stringify(x));
test('mixed new towers simulate identically after a Duo restart and their live effects reach both views',()=>{
 const c=load(),room=createRoom({seed:'seven-tower-duo',now:()=>0,loadouts:[types.slice(0,5),types.slice(2,7)]}),a=room.connect(0),b=room.connect(1),saved=room.checkpoint(),m=c.duo.restore(saved.match);
 m.phase='combat';m.wave=12;
 for(const [p,{state:s}] of m.boards.entries()){
  Object.assign(s,{phase:'wave',wave:12,waveRunning:true,pendingSpawns:0,spawnQueue:[]});const coords=[[0,1],[0,-1],[1,-1],[1,0],[-1,1],[-1,0],[0,0]];
  const towers=types.map((type,i)=>{const branch=c.data.availableUpgrades({type})[i%2][0],finalUpgrade=c.data.availableUpgrades({type,branch})[0][0];return {type,branch,finalUpgrade,ultimate:type,level:4,statId:i+1,lastShot:-Infinity};});
  towers.forEach((tw,i)=>{const [q,r]=coords[i];s.map.set(q+','+r,{q,r,type:i===6?'base':'straight',roads:[0,3],slots:1,towers:[tw]});});
  s.enemies=Array.from({length:12},(_,i)=>({id:i+1,type:i===0?'boss':'normal',alive:true,hp:100000,maxHp:100000,armorHp:0,magicHp:0,speed:0,points:[{x:-400,y:0},{x:400,y:0}],index:0,t:.55+i*.002,x:40+i*1.6,y:0}));
 }
 const seen=new Set();let projected;
 for(let i=0;i<35;i++){c.duo.tick(m);saved.match=c.duo.capture(m);projected=createRoom({snapshot:saved,now:()=>0});projected.touch(a.token);projected.touch(b.token);for(const p of projected.view(a.token).boards[0].projectiles)seen.add(p.kind);}
 for(const kind of ['gravityWell','tornado','meteorFall','crater','laserBeam','portalGate'])assert.ok(seen.has(kind),kind);
 assert.ok(projected.view(b.token).boards[0].enemies.some(e=>e.poisonStacks));
 const other=load(),copy=other.duo.restore(plain(c.duo.capture(m)));
 for(let i=0;i<100;i++){c.duo.tick(m);other.duo.tick(copy);}
 assert.deepEqual(plain(c.duo.capture(m)),plain(other.duo.capture(copy)));
 assert.notEqual(m.boards[0].state.weaponRandom,m.boards[1].state.weaponRandom);
});
