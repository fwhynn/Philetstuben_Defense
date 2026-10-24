const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function setup(api){
 const storage=new Map(),doc={createElement(tag){return {tag,ownerDocument:doc,textContent:'',children:[],events:{},appendChild(n){this.children.push(n);},replaceChildren(...n){this.children=n;},addEventListener(n,f){this.events[n]=f;}};}};
 const c={HexApi:api,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},document:doc};vm.runInNewContext(fs.readFileSync('classes/run-ranking.js','utf8'),c);
 return {ui:c.HexRunRanking,host:doc.createElement('section'),storage,text:h=>h.children.map(n=>n.textContent).join(' ')};
}
const run={runId:'r1',mode:'single',wave:35,kills:400,ruleset:'1.0.7'};
test('guest sees provisional rank and registration CTA; same run survives login and is submitted pending',async()=>{
 let logged=false,claims=[],mode;const api={isLoggedIn:()=>logged,previewRunRanking:async()=>({mode:'single',rank:6}),submitRunRanking:async r=>{claims.push(r);return {status:'pending'};}};
 const t=setup(api);await t.ui.show(t.host,run,{api,onAccount:m=>mode=m});assert.match(t.text(t.host),/Platz 6/);assert.equal(claims.length,0);t.host.children.find(n=>n.tag==='button').events.click();assert.equal(mode,'register');
 logged=true;await t.ui.refresh();assert.ok(claims.every(r=>r.runId==='r1'&&r.kills===400));assert.match(t.text(t.host),/überprüft/);assert.equal(JSON.parse([...t.storage.values()][0]).length,0);
});
test('incorrect mode or API outage never fabricates a rank',async()=>{
 const api={isLoggedIn:()=>false,previewRunRanking:async()=>({mode:'duo',rank:1})},t=setup(api);await t.ui.show(t.host,run,{api});assert.match(t.text(t.host),/nicht verfügbar/);assert.doesNotMatch(t.text(t.host),/Platz 1/);
});
test('late preview cannot replace another run',async()=>{
 let resolve;const api={isLoggedIn:()=>false,previewRunRanking:r=>r.runId==='r1'?new Promise(r=>resolve=r):Promise.resolve({mode:'duo',rank:9})},t=setup(api);
 const old=t.ui.show(t.host,run,{api});await t.ui.show(t.host,{...run,mode:'duo',runId:'r2'},{api});resolve({mode:'single',rank:1});await old;assert.match(t.text(t.host),/Platz 9/);
});
test('score uses completed waves and kills of this run, not account lifetime totals',()=>{
 const {ui}=setup({});const s=ui.score({runId:'x',wave:36,lastCompletedWave:35,earnedMeta:{normalKills:100,periodicBosses:3,explorationBosses:2}},'dual');assert.equal(s.wave,35);assert.equal(s.kills,105);assert.equal(s.mode,'dual');
});

test('greed keeps wave-35 gold separate from endless and normal account records',()=>{
 const {ui}=setup({});const state={challengeKind:'greed',challengeDay:'2026-10-25',runId:'gold-run',greedGold35:1250,lastCompletedWave:35,gold:1};
 const score=ui.score(state);assert.equal(score.mode,'greed35');assert.equal(score.gold,1250);assert.equal(score.wave,35);assert.equal(score.runId,'gold-run:35');assert.equal(score.day,state.challengeDay);
});
test('greed guest score survives login with its day, mode and earned gold intact',async()=>{
 let logged=false,claimed;const run={runId:'gold-run:35',mode:'greed35',day:'2026-10-25',gold:1250,wave:35,ruleset:'test'};const api={isLoggedIn:()=>logged,previewRunRanking:async()=>({mode:'greed35',rank:4}),submitRunRanking:async r=>{claimed=r;return {status:'pending'};}};
 const t=setup(api);await t.ui.show(t.host,run,{api});assert.match(t.text(t.host),/1250 Gold/);logged=true;await t.ui.refresh();assert.equal(claimed.gold,1250);assert.equal(claimed.day,run.day);assert.equal(claimed.mode,'greed35');
});
