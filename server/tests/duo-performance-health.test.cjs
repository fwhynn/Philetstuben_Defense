const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http');
const {createRoom}=require('../duo-room.cjs'),{check}=require('../../deploy/check-duo-health.cjs');
test('idle and paused rooms keep their push revision; commands still invalidate it',()=>{
 const room=createRoom({seed:'idle',loadouts:Array(2).fill(['archer','catapult','chain','freeze','mine']),now:()=>0});const a=room.connect(0);room.connect(1);const key=room.pushKey(a.token);for(let i=0;i<100;i++)room.tick();assert.equal(room.pushKey(a.token),key);assert.equal(room.hasSeat(a.token),true);assert.equal(room.hasSeat('bad'),false);
 const v=room.view(a.token);assert.ok(room.receive(a.token,{epoch:v.epoch,sequence:v.next,wave:v.wave,phase:v.boards[0].phase,action:'pause',payload:{value:true}}).ok);assert.notEqual(room.pushKey(a.token),key);const paused=room.pushKey(a.token);room.tick();assert.equal(room.pushKey(a.token),paused);
});
test('health probe rejects a healthy old process and accepts only the expected version',async t=>{
 let body={ok:true};const server=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(body));});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{server.closeAllConnections();server.close(r);}));const origin='http://127.0.0.1:'+server.address().port;
 await assert.rejects(check(origin,'1.2.1',{attempts:1}),/expected ruleset/);body={ok:true,ruleset:'1.2.0'};await assert.rejects(check(origin,'1.2.1',{attempts:1}),/expected ruleset/);body.ruleset='1.2.1';await check(origin,'1.2.1',{attempts:1});
});
