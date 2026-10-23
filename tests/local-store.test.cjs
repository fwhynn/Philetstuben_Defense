const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('classes/local-store.js','utf8');
function fixture(){const data=new Map(),held=new Set();return {data,held,storage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},locks:{async request(key,o,fn){if(held.has(key))return fn(null);held.add(key);try{return await fn({name:key});}finally{held.delete(key);}}}};}
async function tab(f,{user=null,environment='https://api.autohextd.zlyfer.net',locks=true}={}){
 const c=vm.createContext({localStorage:f.storage,navigator:locks?{locks:f.locks}:{},HexApi:{baseUrl:environment,storedUserId:()=>user}});vm.runInContext(source,c);await c.HexLocalStore.ready;return c.HexLocalStore;
}
test('second tab cannot overwrite profile, checkpoint, dirty marker or cloud backup',async()=>{
 const f=fixture(),a=await tab(f),b=await tab(f);
 for(const key of ['hex-bastion-profile-v1','autohex-solo-autosave-v1','hex-cloud-dirty','hex-bastion-profile-backup']){a.setItem(key,'new');assert.throws(()=>b.setItem(key,'old'));assert.equal(a.getItem(key),'new');}
 assert.equal(b.blocked,true);
});
test('accounts, guests and test API have separate persistent namespaces',async()=>{
 const f=fixture(),a=await tab(f);a.setItem('profile','guest');await a.prepare(1);a.activate(1);a.setItem('profile','one');await a.prepare(2);a.activate(2);assert.equal(a.getItem('profile'),null);a.setItem('profile','two');a.activate(1);assert.equal(a.getItem('profile'),'one');a.activate();assert.equal(a.getItem('profile'),'guest');
 const testApi=await tab(f,{user:1,environment:'http://localhost:8081'});assert.equal(testApi.getItem('profile'),null);testApi.setItem('profile','test');a.activate(1);assert.equal(a.getItem('profile'),'one');
});
test('legacy data is copied only to production guest namespace and never removed',async()=>{
 const f=fixture();f.data.set('hex-bastion-profile-v1','legacy');f.data.set('autohex-solo-autosave-v1','checkpoint');const a=await tab(f);assert.equal(a.getItem('hex-bastion-profile-v1'),'legacy');a.setItem('other','x');assert.equal(f.data.get('hex-bastion-profile-v1'),'legacy');await a.prepare(1);a.activate(1);assert.equal(a.getItem('hex-bastion-profile-v1'),null);
 const b=await tab(f,{environment:'http://localhost:8081'});assert.equal(b.getItem('hex-bastion-profile-v1'),null);
});
test('unexpected external storage changes cannot be silently overwritten',async()=>{
 const f=fixture(),a=await tab(f);a.setItem('profile','first');const key=[...f.data.keys()][0];f.data.set(key,JSON.stringify({version:1,values:{profile:'newer'}}));assert.throws(()=>a.setItem('profile','stale'));assert.match(f.data.get(key),/newer/);
});
test('unsupported locking and storage failures fail closed',async()=>{
 const f=fixture(),a=await tab(f,{locks:false});assert.equal(a.blocked,true);assert.throws(()=>a.setItem('profile','x'));
 const g=fixture();g.storage.getItem=()=>{throw Error('denied')};const b=await tab(g);assert.equal(b.blocked,true);
});
test('quota failure preserves the complete previous profile and checkpoint envelope',async()=>{
 const f=fixture(),a=await tab(f);a.setItem('profile','saved');a.setItem('checkpoint','saved-run');const before=[...f.data.values()][0];f.storage.setItem=()=>{throw Error('quota')};assert.throws(()=>a.setItem('profile','new'));assert.equal([...f.data.values()][0],before);assert.equal(a.getItem('profile'),'saved');assert.equal(a.getItem('checkpoint'),'saved-run');
});
test('existing account data survives reload and is never replaced by legacy data',async()=>{
 const f=fixture(),a=await tab(f,{user:3});a.setItem('profile','account');f.held.clear();f.data.set('hex-bastion-profile-v1','legacy');const b=await tab(f,{user:3});assert.equal(b.getItem('profile'),'account');
});
test('real game registration, logout and second account login preserve each profile',async()=>{
 const f=fixture(),store=await tab(f);store.setItem('hex-bastion-profile-v1',JSON.stringify({version:1,diamonds:17,introduction:{version:1,bestWave:35,skipped:true,legacy:false}}));
 const api={logged:false,user:1,server:null,puts:[],isLoggedIn(){return this.logged},async register(){this.logged=true;return {id:this.user,username:'test'}},async login(){this.logged=true;return {id:this.user,username:'test'}},async currentUser(){return this.logged?{id:this.user,username:'test'}:null},async logout(){this.logged=false},async pulsePresence(){},async getSave(){return this.server},async putSave(text){this.server=JSON.parse(text);this.puts.push(this.server)}};
 const r=require('./helpers/game.cjs').load({localStore:store,accountApi:api,bootToMenu:true});
 async function login(mode){r.elements.get(mode==='register'?'accountTabRegister':'accountTabLogin').listeners.click();r.document.getElementById('accountUsername').value='test';r.document.getElementById('accountPassword').value='test-password';await r.elements.get('accountForm').listeners.submit({preventDefault(){}});}
 await login('register');assert.equal(store.scope,'user-1');assert.equal(api.server.profile.diamonds,17);
 await r.elements.get('accountLogoutBtn').listeners.click();assert.equal(store.scope,'guest');assert.equal(JSON.parse(store.getItem('hex-bastion-profile-v1')).diamonds,17);
 api.user=2;api.server.profile.diamonds=99;await login('login');assert.equal(store.scope,'user-2');assert.equal(JSON.parse(store.getItem('hex-bastion-profile-v1')).diamonds,99);
 store.activate(1);assert.equal(JSON.parse(store.getItem('hex-bastion-profile-v1')).diamonds,17);store.activate();assert.equal(JSON.parse(store.getItem('hex-bastion-profile-v1')).diamonds,17);
});
