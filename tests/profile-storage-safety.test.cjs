const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
for(const raw of ['{broken',JSON.stringify({version:99,diamonds:800}),JSON.stringify(['invalid'])])test('unreadable local profile is preserved: '+raw,()=>{
 const storage=new Map([['hex-bastion-profile-v1',raw]]),c=vm.createContext({localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)}});
 for(const f of ['data','profile'])vm.runInContext(fs.readFileSync('classes/'+f+'.js','utf8'),c);
 const {p,d}=vm.runInContext('({p:HexProfile,d:HexData.TOWERS})',c);
 const fallback=p.load(d);assert.equal(p.storageProblem,true);p.save(fallback,d);
 assert.equal(storage.get(p.STORAGE_KEY),raw);
 assert.throws(()=>p.settleDuo(fallback,{id:'a'.repeat(64),diamonds:5},d));assert.equal(storage.get(p.STORAGE_KEY),raw);
 p.importFile(p.exportFile({...fallback,diamonds:75},d),d);
 assert.equal(p.storageProblem,false);assert.equal(storage.get(p.STORAGE_KEY+'-before-import'),raw);
 assert.equal(p.load(d).diamonds,75);
});
