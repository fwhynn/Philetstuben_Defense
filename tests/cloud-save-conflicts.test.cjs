const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../classes/api.js'),'utf8');

test('account augment transactions fail closed on legacy API without charging or PUT',async()=>{
 const s=cloud(),api=client(s.fetch);await api.getSave();
 await assert.rejects(api.putSave({_augmentAction:{kind:'buy',requestId:'test'}}),e=>e.status===428);assert.equal(s.puts,0);
});
test('confirmed augment request recovery returns the server inventory without another PUT',async()=>{
 let committed=false,puts=0;const id='11111111-1111-4111-8111-111111111111',api=client(async(u,o)=>{
  if(o.method==='PUT'){puts++;throw Error('must not PUT');}
  return {ok:true,status:200,json:async()=>({augmentProtocol:1,revision:(committed?'b':'a').repeat(64),data:committed?{_augmentReceipt:{id},profile:{diamonds:50,augmentCards:{packs:1}}}:{} })};
 });
 await api.getSave();committed=true;const result=await api.putSave({_augmentAction:{kind:'buy',requestId:id}});assert.equal(result.data.profile.diamonds,50);assert.equal(puts,0);
});
function client(server, storage=new Map([['hex-bastion-auth-token','TEST']])) {
  const context=vm.createContext({localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},fetch:server});
  vm.runInContext(source,context);return context.HexApi;
}
function cloud() {
  let revision='a'.repeat(64), data={progress:10}, puts=0, race=false;
  const response=(status,payload)=>({status,ok:status<400,json:async()=>payload});
  return {get puts(){return puts},get data(){return data},advance(){revision='b'.repeat(64);data={progress:20}},race(){race=true},fetch:async(url,o)=>{
    if(o.method!=='PUT') return response(200,{data,revision});
    puts++;if(race) revision='c'.repeat(64);
    const payload=JSON.parse(o.body);
    if(payload._baseRevision!==revision)return response(409,{error:{message:'conflict'}});
    data=payload;revision='d'.repeat(64);return response(200,{revision});
  }};
}
test('stale second device cannot overwrite a newer cloud save',async()=>{
  const s=cloud(),a=client(s.fetch),b=client(s.fetch);await a.getSave();await b.getSave();
  await a.putSave({progress:20});await assert.rejects(b.putSave({progress:11}),e=>e.status===409);
  assert.equal(s.puts,1);assert.equal(s.data.progress,20);
});
test('server conflict between probe and PUT is surfaced, never automatically retried',async()=>{
  const s=cloud(),a=client(s.fetch);await a.getSave();s.race();
  await assert.rejects(a.putSave({progress:11}),e=>e.status===409);assert.equal(s.puts,1);assert.equal(s.data.progress,10);
});
test('missing baseline and legacy API fail closed',async()=>{
  const s=cloud(),a=client(s.fetch);await assert.rejects(a.putSave({progress:0}),e=>e.status===409);assert.equal(s.puts,0);
  const old=client(async()=>({ok:true,status:200,json:async()=>({data:{}})}));await old.getSave();await assert.rejects(old.putSave({}),e=>e.status===409);
});
test('offline dirty baseline survives reload, without adopting a newer cloud revision',async()=>{
  const s=cloud(),storage=new Map([['hex-bastion-auth-token','TEST']]);await client(s.fetch,storage).getSave();s.advance();
  await assert.rejects(client(s.fetch,storage).putSave({progress:11}),e=>e.status===409);assert.equal(s.puts,0);
});
test('old open tab retains its own baseline when another tab updates storage',async()=>{
  const s=cloud(),storage=new Map([['hex-bastion-auth-token','TEST']]),a=client(s.fetch,storage),b=client(s.fetch,storage);
  await a.getSave();await b.getSave();await a.putSave({progress:30});await assert.rejects(b.putSave({progress:12}),e=>e.status===409);
});
test('a loaded empty account can receive its first save',async()=>{
  let body;const a=client(async(u,o)=>o.method==='PUT'?(body=JSON.parse(o.body),{ok:true,status:200,json:async()=>({revision:'e'.repeat(64)})}):({ok:true,status:200,json:async()=>({data:null,revision:'empty'})}));
  assert.equal(await a.getSave(),null);await a.putSave({progress:1});assert.equal(body._baseRevision,'empty');
});

test('downloaded but unapplied profile never authorizes an old local profile after reload',async()=>{
  const s=cloud(),storage=new Map([['hex-bastion-auth-token','TEST']]),a=client(s.fetch,storage);
  const data=await a.getSave({deferCommit:true});
  await assert.rejects(client(s.fetch,storage).putSave({progress:0}),e=>e.status===409);
  // Settings may be uploaded with the deferred cloud profile, but the disk profile is still old.
  await a.putSave({...data,settings:true});
  await assert.rejects(client(s.fetch,storage).putSave({progress:0}),e=>e.status===409);
  a.commitLoadedSave(data);
  await client(s.fetch,storage).putSave({progress:12});
  assert.equal(s.data.progress,12);
});

test('only the latest downloaded profile can commit its synchronization baseline',async()=>{
  const s=cloud(),a=client(s.fetch),old=await a.getSave({deferCommit:true});s.advance();
  const latest=await a.getSave({deferCommit:true});
  assert.throws(()=>a.commitLoadedSave(old),e=>e.status===409);
  a.commitLoadedSave(latest);await a.putSave(latest);assert.equal(s.data.progress,20);
});

test('changing account in another tab blocks both download and upload in the old tab',async()=>{
 const s=cloud(),storage=new Map([['hex-bastion-auth-token','TEST']]),a=client(s.fetch,storage);await a.getSave();
 storage.set('hex-bastion-auth-token','OTHER');await assert.rejects(a.getSave(),e=>e.status===409);await assert.rejects(a.putSave({progress:0}),e=>e.status===409);assert.equal(s.puts,0);
});
test('late identity response cannot relabel or log out an account from another tab',async()=>{
 for(const status of [200,401]){
  let finish;const storage=new Map([['hex-bastion-auth-token','TEST']]),a=client(()=>new Promise(resolve=>finish=resolve),storage);
  const pending=a.currentUser();storage.set('hex-bastion-auth-token','OTHER');finish({status,ok:status===200,json:async()=>({user:{id:1}})});
  await assert.rejects(pending,e=>e.status===409);assert.equal(storage.get('hex-bastion-auth-token'),'OTHER');assert.equal(a.storedUserId(),null);
  await assert.rejects(a.logout(),e=>e.status===409);assert.equal(storage.get('hex-bastion-auth-token'),'OTHER');
 }
});
