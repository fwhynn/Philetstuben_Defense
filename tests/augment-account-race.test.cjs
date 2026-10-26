const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{randomUUID}=require('node:crypto');
const source=fs.readFileSync('classes/game.js','utf8'),transaction=source.slice(source.indexOf('  let augmentTransactionBusy=false;'),source.indexOf('  async function pushToServer() {'));
test('wave rewards earned during cloud flush and booster purchase both survive',async()=>{
 const store=new Map();let flushes=0;
 const context={profile:{diamonds:100,augmentCards:{bestWave:15,settledBestWave:15}},pendingServerProfile:null,cloudSaveTimer:null,cloudSaveError:null,CLOUD_DIRTY:'dirty',TOWERS:{},crypto:{randomUUID},clearTimeout(){},scheduleCloudSave(){},renderArsenal(){},renderLoadout(){},renderUI(){},cloudStore:{get:k=>store.get(k),set:(k,v)=>store.set(k,v)},HexProfile:{save:p=>p,exportFile:p=>JSON.stringify({profile:p})}};
 context.pushToServer=async()=>{flushes++;if(flushes===1){context.profile.diamonds+=50;store.set('dirty','1');}else store.delete('dirty');return true;};
 context.accountApi=()=>({isLoggedIn:()=>true,storedUserId:()=>1,putSave:async payload=>{
  assert.equal(payload.profile.diamonds,150);context.profile.diamonds+=25;context.profile.augmentCards.bestWave=20;context.profile.augmentCards.settledBestWave=20;
  return {data:{profile:{diamonds:100,augmentCards:{cards:{archer:[1,0,0,0,0]},bestWave:15,settledBestWave:15}}}};
 }});
 vm.createContext(context);vm.runInContext(transaction,context);await vm.runInContext("transactAugment({kind:'buy'},()=>{throw Error('local draw forbidden')})",context);
 assert.equal(flushes,2);assert.equal(context.profile.diamonds,125);assert.equal(context.profile.augmentCards.bestWave,20);assert.equal(context.profile.augmentCards.settledBestWave,20);assert.equal(context.profile.augmentCards.cards.archer[0],1);
});
