const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../classes/public-leaderboard.js'),'utf8');
function element(tag='div'){return {tag,children:[],attrs:{},dataset:{},textContent:'',className:'',events:{},
 classList:{hidden:true,extra:new Set(),add(name){if(name==='hidden')this.hidden=true;else this.extra.add(name);},remove(name){if(name==='hidden')this.hidden=false;},contains(name){return name==='hidden'?this.hidden:this.extra.has(name);}},
 addEventListener(name,fn){this.events[name]=fn;},appendChild(node){this.children.push(node);return node;},replaceChildren(){this.children=[];},setAttribute(key,value){this.attrs[key]=String(value);},focus(){}};}
function setup({players=async()=>({players:[]}),loggedIn=false,username='Ich'}={}){
 const nodes=new Map(),listeners={},requests=[],sorts=['single','dual','daily','duo'].map(sort=>{const button=element('button');button.dataset.leaderboardMode=sort;return button;});
 const HexApi={isLoggedIn:()=>loggedIn,currentUser:async()=>({username}),getPublicLeaderboard:sort=>{requests.push(sort);return players(sort);}};
 const document={getElementById:id=>{if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},createElement:element,querySelectorAll:()=>sorts,addEventListener:(name,fn)=>listeners[name]=fn};
 vm.runInNewContext(source,{document,HexApi,Intl,Number,Array,String,Error});
 const rows=()=>nodes.get('leaderboardContent').children[0]?.children[1].children||[];
 return {nodes,listeners,requests,sorts,rows,open:()=>nodes.get('menuLeaderboardBtn').events.click()};
}

const headers=view=>view.nodes.get('leaderboardContent').children[0].children[0].children[0].children;

const tick=()=>new Promise(resolve=>setImmediate(resolve));
const sample=[{rank:1,username:'A',highestWave:25,runsPlayed:2},{rank:2,username:'B',highestWave:20,runsPlayed:5}];
test('one front loads data by default, other modes stay empty and reopen resets to one front',async()=>{
 const view=setup({players:async()=>({players:sample})});view.open();await tick();assert.equal(view.rows().length,2);assert.equal(view.sorts[0].attrs['aria-pressed'],'true');
 for(const button of view.sorts.slice(1)){button.events.click();assert.equal(view.rows().length,0);assert.equal(button.attrs['aria-pressed'],'true');}
 assert.deepEqual(view.requests,['highest_wave']);view.open();await tick();assert.equal(view.rows().length,2);assert.equal(view.sorts[0].attrs['aria-pressed'],'true');
});
test('late one-front results cannot appear in another mode',async()=>{
 let resolve;const view=setup({players:()=>new Promise(r=>resolve=r)});view.open();view.sorts[3].events.click();resolve({players:sample});await tick();assert.equal(view.rows().length,0);assert.match(view.nodes.get('leaderboardStatus').textContent,/noch keine/);
});
test('category sorting retains table and status until fresh data arrives, direction toggles locally',async()=>{
 const pending={},view=setup({players:sort=>new Promise(r=>pending[sort]=r)});view.open();pending.highest_wave({players:sample});await tick();
 headers(view)[2].children[0].events.click();assert.equal(view.rows()[0].children[1].textContent,'B');
 const table=view.nodes.get('leaderboardContent').children[0];headers(view)[3].children[0].events.click();assert.equal(view.nodes.get('leaderboardContent').children[0],table);assert.equal(view.nodes.get('leaderboardStatus').textContent,'');
 pending.runs_played({players:sample});await tick();assert.equal(view.rows()[0].children[1].textContent,'B');headers(view)[3].children[0].events.click();assert.equal(view.rows()[0].children[1].textContent,'A');
});
test('Escape closes the mode leaderboard',()=>{
 const view=setup();view.open();let stopped=false;view.listeners.keydown({key:'Escape',preventDefault(){},stopImmediatePropagation(){stopped=true;}});assert.equal(view.nodes.get('leaderboardOverlay').classList.hidden,true);assert.equal(stopped,true);
});
