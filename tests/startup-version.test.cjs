const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {load}=require('./helpers/game.cjs'),{stampClientFiles}=require('../deploy/build-public.cjs');
test('startup script errors stay visible even when the script load event follows; no save deletion',()=>{
 const vm=require('node:vm'),events={},nodes=[],body={appendChild:n=>nodes.push(n)},document={body,createElement:()=>({style:{},setAttribute(){},append(...children){this.children=children;},addEventListener(){}})};
 vm.runInNewContext(fs.readFileSync('classes/boot-guard.js','utf8'),{document,window:{addEventListener:(id,fn)=>events[id]=fn}});
 events.error({error:new Error('stale script')});events['autohex-ready']();events.error({error:new Error('second')});assert.equal(nodes.length,1);assert.equal(nodes[0].id,'bootFailure');assert.match(nodes[0].children[1].textContent,/nicht gelöscht/);
});
test('direct-checkout release refreshes cache keys idempotently and leaves private files alone',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'autohex-direct-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));fs.mkdirSync(path.join(dir,'classes'));fs.mkdirSync(path.join(dir,'.local'));
 fs.writeFileSync(path.join(dir,'index.html'),'<script src="classes/a.js"></script>');fs.writeFileSync(path.join(dir,'classes/a.js'),'// one');fs.writeFileSync(path.join(dir,'.local/private.js'),'PRIVATE');
 const first=stampClientFiles(dir,{sourceTree:true});assert.equal(stampClientFiles(dir,{sourceTree:true}),first);assert.equal(fs.readFileSync(path.join(dir,'.local/private.js'),'utf8'),'PRIVATE');
 fs.writeFileSync(path.join(dir,'classes/a.js'),'// two');const changed=[];const next=stampClientFiles(dir,{sourceTree:true,onChanged:f=>changed.push(f)});assert.notEqual(first,next);assert.ok(changed.includes('index.html'));assert.ok(fs.readFileSync(path.join(dir,'index.html'),'utf8').includes('?v='+next));
 assert.match(fs.readFileSync('tag-and-push.cjs','utf8'),/stampClientFiles\(repo,\{sourceTree:true/);
});
test('reported v1.0.4 script with removed biome button reproduces startup crash; current script boots',()=>{
 const old=execFileSync('git',['show','v1.0.4:classes/game.js'],{encoding:'utf8'});
 assert.match(old.split('\n')[1398],/towerBiomeInfo.*addEventListener/);
 assert.throws(()=>load({sourceOverride:old,missingIds:['towerBiomeInfo']}),/addEventListener/);
 const current=load({missingIds:['towerBiomeInfo'],bootToMenu:true});
 assert.ok(current.a.state.map.size>0);
 assert.equal(current.elements.get('mainMenu').classList.contains('hidden'),false);
});
test('release stamps static scripts, dynamic game loader and relative module imports together',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'autohex-cache-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 fs.mkdirSync(path.join(dir,'classes'));
 fs.writeFileSync(path.join(dir,'index.html'),'<script src="classes/api.js"></script><script>import("./classes/renderer.js");s.src="classes/game.js";s.src="/socket.io/socket.io.js";</script>');
 fs.writeFileSync(path.join(dir,'classes/api.js'),'');
 fs.writeFileSync(path.join(dir,'classes/game.js'),'// first');
 fs.writeFileSync(path.join(dir,'classes/renderer.js'),'import {value} from "./detail.mjs";');
 fs.writeFileSync(path.join(dir,'classes/detail.mjs'),'export const value=1;');
 const token=stampClientFiles(dir),html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
 for(const file of ['api.js','game.js','renderer.js'])assert.ok(html.includes(file+'?v='+token));
 assert.ok(html.includes('"/socket.io/socket.io.js"'));
 assert.ok(fs.readFileSync(path.join(dir,'classes/renderer.js'),'utf8').includes('detail.mjs?v='+token));
});
