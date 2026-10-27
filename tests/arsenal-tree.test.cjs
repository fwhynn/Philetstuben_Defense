const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
function arsenal(){
 const context={localStorage:{getItem(){return null;},setItem(){}}};vm.createContext(context);
 for(const file of ['data.js','biomes.js','heroes.js','profile.js','buildings.js','arsenal.js','arsenal-tree.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../classes',file),'utf8'),context,{filename:file});
 return vm.runInContext('({trees:HexArsenal.trees,tree:HexArsenalTree,profile:HexProfile.defaults()})',context);
}
const hit=(a,b)=>a.x0<b.x1&&b.x0<a.x1&&a.y0<b.y1&&b.y0<a.y1;

test('tower and building tabs split the arsenal into two complete trees',()=>{
 const {trees,tree,profile}=arsenal(),all=trees(profile);
 assert.deepEqual([...tree.GROUPS].map(g=>g.id),['tower','building']);
 const groups=tree.GROUPS.map(g=>all.filter(t=>t.kind===g.id));
 assert.equal(groups.reduce((n,g)=>n+g.length,0),all.length,'jeder Baum gehört zu genau einem Reiter');
 assert.ok(groups.every(g=>g.length>0));
});

for(const group of ['tower','building'])test(group+' tree is connected and neither nodes nor labels overlap',()=>{
 const {trees,tree,profile}=arsenal(),list=trees(profile).filter(t=>t.kind===group),{nodes,edges,byId,box}=tree.layout(list,profile,tree.RADII[group]);
 const expected=1+list.reduce((sum,t)=>sum+1+t.paths.reduce((n,p)=>n+p.steps.length+1,0),0);
 assert.equal(nodes.length,expected);assert.equal(byId.size,nodes.length,'eindeutige Knoten');assert.equal(edges.length,nodes.length-1,'Baum ohne Kreise');
 assert.ok(nodes.every(n=>n.kind==='hub'||n.tree.kind===group),'nur Bäume des Reiters');
 const reached=new Set(['hub']);let grew=true;while(grew){grew=false;for(const e of edges)if(reached.has(e.from)&&!reached.has(e.to)){reached.add(e.to);grew=true;}}
 assert.equal(reached.size,nodes.length,'alles hängt am Arsenal');
 const size=n=>tree.SIZE[n.kind];
 for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j];assert.ok(Math.hypot(a.x-b.x,a.y-b.y)-size(a)-size(b)>=20,a.id+' / '+b.id);}
 // Beschriftungen (geschätzte Breite) berühren weder einander noch fremde Knoten und liegen in der viewBox.
 const labels=nodes.map(n=>[n,tree.labelBox(n)]).filter(x=>x[1]);
 assert.ok(labels.length>=list.length*2);
 for(const [n,b] of labels){
  assert.ok(b.x0>=box.x&&b.x1<=box.x+box.w&&b.y0>=box.y&&b.y1<=box.y+box.h,n.id+' in der viewBox');
  for(const [m,c] of labels)if(m!==n)assert.ok(!hit(b,c),n.id+' / '+m.id);
  for(const m of nodes)if(m!==n){const s=size(m);assert.ok(!hit(b,{x0:m.x-s,x1:m.x+s,y0:m.y-s,y1:m.y+s}),'Beschriftung '+n.id+' auf '+m.id);}
 }
});

test('long names wrap into two balanced lines',()=>{
 const {tree}=arsenal();
 assert.deepEqual([...tree.labelLines('Eis')],['Eis']);
 assert.deepEqual([...tree.labelLines('Ewige Frostfestung der Tiefe')],['Ewige Frostfestung','der Tiefe']);
});

test('tree nodes show ownership and affordable unlocks with the same actions as the workshop',()=>{
 const {trees,tree,profile}=arsenal(),rich={...profile,diamonds:1e6},list=trees(rich),{nodes}=tree.layout(list,rich);
 for(const node of nodes.filter(n=>n.kind==='root')){assert.equal(node.lit,node.tree.owned);if(!node.tree.owned&&node.action)assert.equal(node.affordable,true,node.id);}
 const metas=nodes.filter(n=>n.kind==='meta');assert.ok(metas.length>=list.length);
 for(const meta of metas)if(meta.action&&!meta.action.blocked&&meta.action.kind!=='activateUltimate')assert.equal(meta.affordable,true,meta.id);
 const poor=tree.layout(trees(profile),{...profile,diamonds:0}).nodes;assert.ok(poor.every(n=>!n.affordable));
});
