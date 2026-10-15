const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../classes/public-leaderboard.js'),'utf8');
function element(tag='div'){return {tag,children:[],attrs:{},dataset:{},textContent:'',className:'',events:{},
 classList:{hidden:true,extra:new Set(),add(name){if(name==='hidden')this.hidden=true;else this.extra.add(name);},remove(name){if(name==='hidden')this.hidden=false;},contains(name){return name==='hidden'?this.hidden:this.extra.has(name);}},
 addEventListener(name,fn){this.events[name]=fn;},appendChild(node){this.children.push(node);return node;},replaceChildren(){this.children=[];},setAttribute(key,value){this.attrs[key]=String(value);},focus(){}};}
function setup({players=()=>[],loggedIn=false,username='Ich'}={}){
 const nodes=new Map(),listeners={},requests=[],sorts=['highest_wave','runs_played','normal_kills'].map(sort=>{const button=element('button');button.dataset.leaderboardSort=sort;return button;});
 const HexApi={isLoggedIn:()=>loggedIn,currentUser:async()=>({username}),getPublicLeaderboard:sort=>{requests.push(sort);return players(sort);}};
 const document={getElementById:id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},createElement:element,querySelectorAll:()=>sorts,addEventListener:(name,fn)=>listeners[name]=fn};
 vm.runInNewContext(source,{document,HexApi,Intl,Number,Array,String,Error});
 const rows=()=>nodes.get('leaderboardContent').children[0]?.children[1].children||[];
 return {nodes,listeners,requests,sorts,rows,open:()=>nodes.get('menuLeaderboardBtn').events.click()};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const sample=[{rank:1,username:'<b>Archer</b>',highestWave:68,runsPlayed:18,normalKills:56945,bossesKilled:73,diamondsEarned:833},{rank:2,username:'Ich',highestWave:66,runsPlayed:14,normalKills:44719,bossesKilled:69,diamondsEarned:723}];
test('main menu leaderboard loads the public list, renders names as untranslated text and marks the own row',async()=>{
 const view=setup({players:async()=>({players:sample}),loggedIn:true});view.open();await tick();await tick();
 assert.equal(view.nodes.get('leaderboardOverlay').classList.hidden,false);assert.deepEqual(view.requests,['highest_wave']);
 const [first,second]=view.rows();assert.equal(first.children[1].textContent,'<b>Archer</b>');assert.equal(first.children[1].attrs['data-no-translate'],'');
 assert.equal(first.className,'top1');assert.equal(first.children[4].textContent,'56.945');assert.equal(first.children[2].className,'sorted');
 assert.ok(second.classList.contains('own'));assert.ok(!first.classList.contains('own'));assert.equal(view.nodes.get('leaderboardStatus').textContent,'');
});
test('switching category requests the new sort and ignores a slower stale response',async()=>{
 const pending={};const view=setup({players:sort=>new Promise(resolve=>pending[sort]=resolve)});view.open();
 view.sorts[1].events.click();assert.deepEqual(view.requests,['highest_wave','runs_played']);assert.equal(view.sorts[1].attrs['aria-pressed'],'true');assert.equal(view.sorts[0].attrs['aria-pressed'],'false');
 pending.runs_played({players:[sample[1]]});await tick();pending.highest_wave({players:sample});await tick();
 assert.equal(view.rows().length,1);assert.equal(view.rows()[0].children[1].textContent,'Ich');assert.equal(view.rows()[0].children[3].className,'sorted');
 view.sorts[1].events.click();assert.equal(view.requests.length,2);
});
test('errors and empty categories show a status, and Escape closes the overlay before the game sees it',async()=>{
 const failing=setup({players:async()=>{throw Error('offline');}});failing.open();await tick();
 assert.equal(failing.nodes.get('leaderboardStatus').textContent,'Bestenliste konnte nicht geladen werden. Bitte später erneut öffnen.');
 const empty=setup({players:async()=>({players:[]})});empty.open();await tick();assert.equal(empty.nodes.get('leaderboardStatus').textContent,'Noch keine Einträge in dieser Kategorie.');
 let stopped=false;empty.listeners.keydown({key:'Escape',preventDefault(){},stopImmediatePropagation(){stopped=true;}});
 assert.equal(empty.nodes.get('leaderboardOverlay').classList.hidden,true);assert.ok(stopped);
});
