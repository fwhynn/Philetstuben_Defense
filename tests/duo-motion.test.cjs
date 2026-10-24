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
