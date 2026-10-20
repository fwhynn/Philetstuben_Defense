const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {load}=require('./helpers/game.cjs'),{stampClientFiles}=require('../deploy/build-public.cjs');
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
