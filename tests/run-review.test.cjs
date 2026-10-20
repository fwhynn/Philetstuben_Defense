const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('classes/run-review.js','utf8');
function setup(isAdmin=true){
 const nodes=new Map(),reviews=[],deletes=[];
 function element(tag){return {tag,textContent:'',value:'',children:[],events:{},hidden:false,open:true,disabled:false,
  appendChild(node){this.children.push(node);},replaceChildren(...children){this.children=children;},
  setAttribute(){},addEventListener(name,fn){this.events[name]=fn;},focus(){this.focused=true;}};}
 const document={createElement:element,getElementById(id){if(!nodes.has(id))nodes.set(id,element('div'));return nodes.get(id);}};
 let requests=0;
 const HexApi={isLoggedIn:()=>true,currentUser:async()=>({isAdmin}),
  getPendingRunRankings:async()=>{requests++;return {entries:[{id:42,revision:3,username:'Tester',mode:'single',wave:101,kills:400,ruleset:'1.0.8',suspicion:'<img src=x onerror=bad()> Widersprüchliche Meldung.'}]};},
  deleteRunRanking:async(...args)=>deletes.push(args),
  reviewRunRanking:async(...args)=>reviews.push(args)};
 vm.runInNewContext(source,{document,HexApi});
 return {nodes,reviews,deletes,requests:()=>requests,open:()=>nodes.get('menuLeaderboardBtn').events.click()};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('review displays suspicion as text and sends decision with revision and reason',async()=>{
 const t=setup();await t.open();await tick();
 const item=t.nodes.get('runReviewEntries').children[0];
 assert.match(item.children[1].textContent,/<img.*Widersprüchliche/);
 assert.equal(item.children[1].children.length,0);
 const reason=item.children[2],approve=item.children[3];
 await approve.events.click();assert.equal(t.reviews.length,0);assert.equal(reason.focused,true);
 reason.value='Legitimer Run';await approve.events.click();
 assert.deepEqual(t.reviews[0],[42,3,'accepted','Legitimer Run']);
});
test('non-admin does not see or fetch review queue',async()=>{
 const t=setup(false);await t.open();
 assert.equal(t.nodes.get('runReview').hidden,true);assert.equal(t.requests(),0);
});
test('admin can remove a pending report after confirmation without review text',async()=>{
 const t=setup();await t.open();await tick();
 const button=t.nodes.get('runReviewEntries').children[0].children.at(-1);
 await button.events.click();assert.equal(t.deletes.length,0);
 await button.events.click();assert.deepEqual(t.deletes,[[42,3]]);assert.equal(t.requests(),2);
});
