const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{buildPublic}=require('../../deploy/build-public.cjs');
const {createStore}=require('../duo-store.cjs'),{createTransport}=require('../duo-transport.cjs'),{createLobbies}=require('../duo-lobbies.cjs'),{check}=require('../../deploy/check-online.cjs');
test('deployment probe checks real HTTP assets, health and private result endpoint',async t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'duo-deploy-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const store=createStore(path.join(dir,'save.json')),server=createTransport(store,{browser:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{server.closeAllConnections();server.close(r);}));
 await check('http://127.0.0.1:'+server.address().port);
});
test('public artifact contains game dependencies but no private server or deployment files',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'autohex-public-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 buildPublic(dir);
 for(const file of ['index.html','duo-lobby.html','duo-client.js','classes/profile.js','node_modules/three/build/three.module.js'])assert.ok(fs.existsSync(path.join(dir,file)),file);
 for(const file of ['server','deploy','.git','.deploy-webhook-secret','webhook.php','server-data'])assert.equal(fs.existsSync(path.join(dir,file)),false,file);
 assert.throws(()=>buildPublic(dir));
});
test('invalid or duplicate durable settlements prevent restore',()=>{
 const snapshot={format:'autohex-lobbies',version:1,rooms:[],attempts:[],settlements:[['token',[{id:'a'.repeat(64),outcome:'victory',wave:35,diamonds:-1}]]]};
 assert.throws(()=>createLobbies({snapshot}),/settlement/);snapshot.settlements[0][1][0].diamonds=17;snapshot.settlements[0][1].push({...snapshot.settlements[0][1][0]});assert.throws(()=>createLobbies({snapshot}),/settlement/);
});
