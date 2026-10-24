const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../classes/public-leaderboard.js'),'utf8');
function element(tag='div'){return {tag,children:[],attrs:{},dataset:{},textContent:'',className:'',events:{},
 classList:{hidden:true,extra:new Set(),add(name){if(name==='hidden')this.hidden=true;else this.extra.add(name);},remove(name){if(name==='hidden')this.hidden=false;},contains(name){return name==='hidden'?this.hidden:this.extra.has(name);}},
 addEventListener(name,fn){this.events[name]=fn;},appendChild(node){this.children.push(node);return node;},replaceChildren(){this.children=[];},setAttribute(key,value){this.attrs[key]=String(value);},focus(){}};}
function setup({players=async()=>({players:[]}),loggedIn=false,username='Ich',deleteResult=async()=>{}}={}){
 const nodes=new Map(),listeners={},requests=[],sorts=['single','dual','daily','duo','legacy'].map(sort=>{const button=element('button');button.dataset.leaderboardMode=sort;return button;});
 const HexApi={isLoggedIn:()=>loggedIn,currentUser:async()=>({username}),deleteRunRanking:deleteResult,getRunLeaderboard:async mode=>{requests.push(mode);const data=await players(mode);return {mode,entries:data.players.map(p=>({...p,wave:p.highestWave,kills:p.runsPlayed}))};},getPublicLeaderboard:sort=>{requests.push(sort);return players(sort);}};
 const document={getElementById:id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},createElement:element,querySelectorAll:()=>sorts,addEventListener:(name,fn)=>listeners[name]=fn};
 vm.runInNewContext(source,{document,HexApi,Intl,Number,Array,String,Error});
 const rows=()=>nodes.get('leaderboardContent').children[0]?.children[1].children||[];
 return {nodes,listeners,requests,sorts,rows,open:()=>nodes.get('menuLeaderboardBtn').events.click()};
}

const headers=view=>view.nodes.get('leaderboardContent').children[0].children[0].children[0].children;

const tick=()=>new Promise(resolve=>setImmediate(resolve));
const sample=[{rank:1,username:'A',highestWave:25,runsPlayed:2},{rank:2,username:'B',highestWave:20,runsPlayed:5}];
test('unavailable run tables fall back to explicitly labelled account totals',async()=>{
 const view=setup({players:async mode=>{if(mode==='single')throw Error('unavailable');return {players:sample};}});
 view.open();await tick();
 assert.deepEqual(view.requests,['single','highest_wave']);
 assert.equal(view.rows().length,2);
 assert.equal(view.sorts[4].attrs['aria-pressed'],'true');
 assert.match(view.nodes.get('leaderboardStatus').textContent,/bisherigen Gesamtwerte/);
 view.sorts[3].events.click();await tick();
 assert.equal(view.requests.at(-1),'duo');
});
test('separate modes query their own board, legacy remains available, reopening defaults to solo',async()=>{
 const view=setup({players:async()=>({players:sample})});view.open();await tick();assert.equal(view.rows().length,2);
 view.sorts[3].events.click();await tick();assert.equal(view.requests.at(-1),'duo');assert.equal(view.rows().length,2);
 view.sorts[4].events.click();await tick();assert.equal(view.requests.at(-1),'highest_wave');
 view.open();await tick();assert.equal(view.requests.at(-1),'single');
});
test('late solo response cannot replace duo rows',async()=>{
 const pending={},view=setup({players:mode=>new Promise(r=>pending[mode]=r)});view.open();view.sorts[3].events.click();pending.duo({players:[sample[1]]});await tick();pending.single({players:sample});await tick();assert.equal(view.rows().length,1);assert.equal(view.rows()[0].children[1].textContent,'B');
});
test('run columns sort locally without loading or a second request',async()=>{
 const view=setup({players:async()=>({players:sample})});view.open();await tick();headers(view)[3].children[0].events.click();assert.equal(view.rows()[0].children[1].textContent,'B');headers(view)[3].children[0].events.click();assert.equal(view.rows()[0].children[1].textContent,'A');assert.deepEqual(view.requests,['single']);
});
test('Escape closes the mode leaderboard',()=>{
 const view=setup();view.open();let stopped=false;view.listeners.keydown({key:'Escape',preventDefault(){},stopImmediatePropagation(){stopped=true;}});assert.equal(view.nodes.get('leaderboardOverlay').classList.hidden,true);assert.equal(stopped,true);
});
test('admin deletion requires confirmation, includes revision and refreshes ranks',async()=>{
 let removed=false,calls=[];
 const view=setup({players:async()=>({players:removed?[]:[{...sample[0],id:'12',revision:4}]}),
  deleteResult:async(...args)=>{calls.push(args);removed=true;}});
 view.open();await tick();const button=view.rows()[0].children.at(-1).children[0];
 await button.events.click();assert.equal(calls.length,0);assert.equal(button.textContent,'Löschen bestätigen');
 await button.events.click();assert.deepEqual(calls,[['12',4]]);assert.equal(view.rows().length,0);
});
test('deletion failures remain visible and never remove a row optimistically',async()=>{
 const view=setup({players:async()=>({players:[{...sample[0],id:'12',revision:4}]}),
  deleteResult:async()=>{throw Error('Bitte neu laden.');}});
 view.open();await tick();const button=view.rows()[0].children.at(-1).children[0];
 await button.events.click();await button.events.click();
 assert.equal(view.rows().length,1);assert.equal(button.disabled,false);
 assert.equal(view.nodes.get('leaderboardStatus').textContent,'Bitte neu laden.');
});
test('ordinary public entries have no deletion control',async()=>{
 const view=setup({players:async()=>({players:sample})});view.open();await tick();
 assert.equal(view.rows()[0].children.length,4);
});
