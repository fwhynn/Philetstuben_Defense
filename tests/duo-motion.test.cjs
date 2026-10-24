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
