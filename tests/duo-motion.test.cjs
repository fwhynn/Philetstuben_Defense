const {test}=require('node:test'),assert=require('node:assert/strict');
const {motionAlongRoad}=require('../classes/duo-game.js'),{motionPath}=require('../server/duo-room.cjs');
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
