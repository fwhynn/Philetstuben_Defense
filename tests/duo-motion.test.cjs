const {test}=require('node:test'),assert=require('node:assert/strict');
const {motionAlongRoad}=require('../classes/duo-game.js'),{motionPath}=require('../server/duo-room.cjs');
test('mine hits, damage and deaths share the enemy presentation timeline at 1x and 8x',()=>{
 const {createMotionBuffer}=require('../classes/duo-game.js');
 for(const speed of [1,8]){
  const b=createMotionBuffer(150),state={},enemy=(x,hp)=>({id:1,x,y:0,hp,maxHp:100,alive:true,motionPath:[{x:0,y:0},{x,y:0}]}),mine={x:10,y:0};
  const before={elapsedMs:0,enemies:[enemy(0,100)],mines:[mine],projectiles:[]};
  const hit={elapsedMs:100*speed,enemies:[enemy(10,70)],mines:[],projectiles:[{kind:'blast',x:10,y:0,r:20,ttl:.3,max:.3}]};
  b.push(before.enemies,0,0,false,before);b.push(hit.enemies,100,100,false,hit);
  b.drawState(state,200);assert.equal(state.enemies[0].x,5);assert.equal(state.enemies[0].hp,100);assert.equal(state.mines.length,1);assert.equal(state.projectiles.length,0);
  b.drawState(state,250);assert.equal(state.enemies[0].x,10);assert.equal(state.enemies[0].hp,70);assert.equal(state.mines.length,0);assert.equal(state.projectiles.length,1);
  const dead={elapsedMs:200*speed,enemies:[],mines:[],projectiles:[]};b.push([],200,200,false,dead);
  b.drawState(state,300);assert.equal(state.enemies.length,1,'death waits for the same clock, rather than removing the latest enemy early');
  b.drawState(state,350);assert.equal(state.enemies.length,0);assert.equal(state.projectiles.length,0);
  assert.equal(hit.enemies[0].x,10);assert.equal(hit.projectiles[0].ttl,.3);assert.equal(before.enemies[0].x,0,'presentation cannot mutate server snapshots');
 }
});

test('teleports commit at their snapshot, never before damage and effects',()=>{
 const {createMotionBuffer}=require('../classes/duo-game.js'),b=createMotionBuffer(),state={};
 const start={elapsedMs:0,enemies:[{id:1,x:20,y:0,motionRevision:0}]},end={elapsedMs:100,enemies:[{id:1,x:0,y:0,motionRevision:1}]};
 b.push(start.enemies,0,0,false,start);b.push(end.enemies,100,100,false,end);
 b.drawState(state,200);assert.equal(state.enemies[0].x,20);
 b.drawState(state,250);assert.equal(state.enemies[0].x,0);
});

test('switching maps or pausing shows existing units immediately without treating them as new spawns',()=>{
 const {createMotionBuffer}=require('../classes/duo-game.js'),b=createMotionBuffer(),state={};
 const snapshot={elapsedMs:5000,enemies:[{id:1,x:10,y:0}],mines:[],projectiles:[]};
 b.push(snapshot.enemies,10000,10000,true,snapshot);b.drawState(state,10000);assert.equal(state.enemies[0].remoteSpawnPending,false);assert.equal(state.enemies[0].x,10);
});

test('a purchase between combat ticks updates consumables without rewriting the movement history',()=>{
 const {createMotionBuffer}=require('../classes/duo-game.js'),b=createMotionBuffer(),state={};
 const snapshot={elapsedMs:0,enemies:[],mines:[],projectiles:[],consumables:[]};
 b.push([],1000,1000,true,snapshot);b.drawState(state,1000);assert.equal(state.consumables.length,0);
 const purchased={...snapshot,consumables:[{kind:'spikes',q:1,r:0,charges:20}]};b.push([],1000,1100,false,purchased);b.drawState(state,1100);assert.equal(state.consumables.length,1);assert.equal(snapshot.consumables.length,0);
});
test('Duo interpolation follows a bend instead of the direct chord',()=>{
 const end={x:10,y:10,motionPath:[{x:0,y:0},{x:10,y:0},{x:10,y:10}]};
 assert.deepEqual(motionAlongRoad({x:0,y:0},end,.5),{x:10,y:0});
 assert.deepEqual(motionAlongRoad({x:5,y:0},end,1/3),{x:10,y:0});
 assert.deepEqual(motionAlongRoad({x:5,y:0},end,1),{x:10,y:10});
});
test('missing old paths, changed routes and leaps snap instead of crossing unrelated roads',()=>{
 for(const end of [{x:20,y:20},{x:20,y:20,leaping:true,motionPath:[{x:0,y:0},{x:20,y:20}]},{x:20,y:20,motionPath:[{x:20,y:0},{x:20,y:20}]}])assert.deepEqual(motionAlongRoad({x:0,y:0},end,.5),{x:20,y:20});
});
test('server publishes bounded travelled points only and never interpolates through tunnels',()=>{
 const points=Array.from({length:300},(_,i)=>({x:i*10,y:0}));const e={points,index:200,t:.5,x:2005,y:0};const trail=motionPath(e);
 assert.ok(trail.length<=64);assert.deepEqual(trail.at(-1),{x:2005,y:0});assert.ok(trail.every(p=>p.x<=e.x));
 points[200].tunnel=true;assert.deepEqual(motionPath(e),[{x:2000,y:0},{x:2005,y:0}]);
});

test('buffer follows steady server time despite packet jitter, duplicate snapshots and uneven render rates',()=>{
 const {createMotionBuffer}=require('../classes/duo-game.js'),buffer=createMotionBuffer(150),enemy=x=>({id:1,x,y:0,motionPath:[{x:0,y:0},{x,y:0}]});const rendered=[enemy(0)];
 buffer.push([enemy(0)],1000,1000);buffer.push([enemy(10)],1100,1130);buffer.push([enemy(20)],1200,1200);
 buffer.draw(rendered,1250);assert.equal(rendered[0].x,10);
 buffer.push([enemy(30)],1300,1340);buffer.draw(rendered,1350);assert.equal(rendered[0].x,20);
 buffer.push([enemy(40)],1400,1400);buffer.draw(rendered,1400);assert.equal(rendered[0].x,25);
 buffer.push([enemy(40)],1400,1420);buffer.draw(rendered,1420);assert.equal(rendered[0].x,27);
 buffer.draw(rendered,1550);assert.equal(rendered[0].x,40);assert.equal(buffer.draw(rendered,1600),false);
 buffer.push([enemy(500)],3000,3000,true);buffer.draw(rendered,3000);assert.equal(rendered[0].x,500,'board changes reset old interpolation');
});

test('late packets resume at bounded pace instead of a forward jump',()=>{
 const {createMotionBuffer}=require('../classes/duo-game.js'),b=createMotionBuffer(),enemy=x=>({id:1,x,y:0,motionPath:[{x:0,y:0},{x,y:0}]}),shown=[enemy(0)];
 for(let t=0;t<=400;t+=100)b.push([enemy(t)],t,t);
 for(let t=400;t<=700;t+=10)b.draw(shown,t);
 assert.equal(shown[0].x,400);b.push([enemy(700)],700,710);const before=shown[0].x;b.draw(shown,710);assert.ok(shown[0].x-before<=11.001);assert.ok(shown[0].x>before);
});

test('a newly spawned unit never jumps ahead of its buffered history then backwards',()=>{
 const {createMotionBuffer}=require('../classes/duo-game.js'),b=createMotionBuffer(),enemy=x=>({id:1,x,y:0,motionPath:[{x:0,y:0},{x,y:0}]});
 b.push([],0,0);b.push([enemy(10)],100,100);const shown=[enemy(20)];
 b.draw(shown,100);assert.equal(shown[0].x,10);
 b.push([enemy(20)],200,200);Object.assign(shown[0],enemy(20));b.draw(shown,200);assert.equal(shown[0].x,10);
 b.draw(shown,275);assert.equal(shown[0].x,12.5);
});

test('repeating an already rendered frame does not corrupt its original position',()=>{
 const {createMotionBuffer}=require('../classes/duo-game.js'),b=createMotionBuffer(),enemy=x=>({id:1,x,y:0,motionPath:[{x:0,y:0},{x,y:0}]});
 b.push([enemy(0)],0,0);b.push([enemy(10)],100,100);b.push([enemy(20)],200,200);
 const shown=[enemy(20)];b.draw(shown,250);assert.equal(shown[0].x,10);
 b.push(shown,200,260);b.draw(shown,300);assert.equal(shown[0].x,15);
});

test('fast units retain enough traversed road for late packets without large straight-road payloads',()=>{
 const points=Array.from({length:200},(_,i)=>({x:i*5,y:0})),end={id:1,x:905,y:0,index:181,points};
 end.motionPath=motionPath(end);assert.ok(end.motionPath[0].x<=393);assert.ok(end.motionPath.length<=3);
 assert.deepEqual(motionAlongRoad({x:505,y:0},end,.5),{x:705,y:0});
});

test('adaptive buffering reduces recurring stalls without reversing, speeding up excessively or leaving the road',()=>{
 const {createMotionBuffer}=require('../classes/duo-game.js');
 function measure(adaptive){
   const b=createMotionBuffer(150,{adaptive}),enemy=x=>({id:1,x,y:0,motionPath:[{x:0,y:0},{x,y:0}]}),shown=[enemy(0)];
   const arrivals=Array.from({length:100},(_,i)=>({stamp:i*100,at:i*100+(i%5===4?200:i%5===0&&i>0?100:0)}));
   let next=0,stalls=0,last=0;
   for(let t=0;t<9800;t+=10){while(next<arrivals.length&&arrivals[next].at<=t){const p=arrivals[next++];b.push([enemy(p.stamp)],p.stamp,t);}b.draw(shown,t);if(t>2000){assert.ok(shown[0].x>=last-1e-7);assert.ok(shown[0].x-last<=11.001);if(shown[0].x===last)stalls++;}last=shown[0].x;assert.equal(shown[0].y,0);}
   return stalls;
 }
 const fixed=measure(false),adaptive=measure(true);assert.ok(fixed>0);assert.ok(adaptive<fixed/2,JSON.stringify({fixed,adaptive}));
});

test('a stale wave-start frame cannot make the playhead catch up through the entire build break',()=>{
 const {createMotionBuffer}=require('../classes/duo-game.js'),b=createMotionBuffer(150,{adaptive:true});
 const enemy=x=>({id:1,x,y:0,motionPath:[{x:0,y:0},{x,y:0}]}),shown=[enemy(0)];
 b.push([],1000,61000,true);b.draw(shown,61000);
 let last=null,stalls=0;
 for(let t=61050;t<=64050;t+=10){
   if((t-61050)%100===0){b.push([enemy(t-61000)],t,t);Object.assign(shown[0],enemy(t-61000));}
   b.draw(shown,t);
   if(t>61550){if(shown[0].x===last)stalls++;assert.ok(shown[0].x>=last);assert.ok(shown[0].x-last<=11.001);}
   last=shown[0].x;
 }
 assert.equal(stalls,0);assert.ok(shown[0].x>2700,'tracks this wave, not the old timestamp');
});

test('spawns enter the delayed timeline instead of visibly waiting for it at the entrance',()=>{
 const {createMotionBuffer}=require('../classes/duo-game.js'),b=createMotionBuffer(150),enemy=x=>({id:3,x,y:0,motionPath:[{x:0,y:0},{x,y:0}]}),shown=[enemy(10)];
 b.push([],0,0);b.push([enemy(10)],100,100);b.draw(shown,100);assert.equal(shown[0].remoteSpawnPending,true);
 b.push([enemy(20)],200,200);b.draw(shown,200);assert.equal(shown[0].remoteSpawnPending,true);
 b.draw(shown,250);assert.equal(shown[0].remoteSpawnPending,false);assert.equal(shown[0].x,10);
 for(let t=260;t<=300;t+=10){const old=shown[0].x;b.draw(shown,t);assert.ok(shown[0].x>old);assert.equal(shown[0].remoteSpawnPending,false);}
});

test('each wave starts smoothly on the own map after long planning, at 1x and 8x without switching maps',()=>{
 const {load}=require('./helpers/game.cjs'),{createRoom}=require('../server/duo-room.cjs');
 for(const speed of [1,8]){
   let clock=1000;const duo={real:true,calls:[]};load({duo,now:()=>clock});
   const room=createRoom({seed:'repeat-motion-'+speed,loadouts:Array(2).fill(['archer','catapult','chain','freeze','mine'])}),a=room.connect(0);room.connect(1);
   const view=room.view(a.token);view.frameTime=clock;duo.receive(structuredClone(view));
   for(let wave=1;wave<=3;wave++){
     view.phase='prepare';for(const b of view.boards){b.phase='build';b.enemies=[];}view.revision++;duo.receive(structuredClone(view));
     clock+=30000+wave*17000;
     view.wave=wave;view.phase='combat';view.speed=speed;for(const b of view.boards){b.phase='wave';b.wave=wave;}view.revision++;
     // Include the old timestamp from an in-flight wave-start acknowledgment.
     duo.receive(structuredClone(view));
     const start=clock;let last=null,stalls=0;
     for(let dt=50;dt<=2050;dt+=10){
       clock=start+dt;
       if((dt-50)%100===0){
         view.frameTime=clock;view.revision++;
         for(const [i,b]of view.boards.entries()){const x=(dt-50)*speed;b.enemies=[{id:wave,type:'grunt',x,y:i*10,motionPath:[{x:0,y:i*10},{x,y:i*10}],hp:100,maxHp:100,armorHp:0,magicHp:0,alive:true}];}
         const raw=structuredClone(view),expected=JSON.stringify(raw);duo.receive(raw);assert.equal(JSON.stringify(raw),expected,'rendering cannot modify network positions');
       }
       duo.bridge.animate(clock);const e=duo.api.getState().enemies[0];
       if(dt>550){assert.equal(e.remoteSpawnPending,false);assert.ok(e.x>=last);assert.ok(e.x-last<=speed*11.01);if(e.x===last)stalls++;}
       last=e?.x??null;
     }
     assert.equal(stalls,0,'no repeated stalls in wave '+wave+' at '+speed+'x');assert.ok(last>1600*speed);
   }
 }
});
