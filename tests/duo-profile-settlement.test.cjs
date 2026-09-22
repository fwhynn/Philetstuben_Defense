const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),loadCore=require('../headless-core.cjs');
test('Duo receipts apply once across reload and save export/import, with visible storage failure',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},context={localStorage:storage};vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../classes/profile.js'),'utf8')+';globalThis.profile=HexProfile;',context);const p=context.profile,defs=loadCore().data.TOWERS,receipt={id:'a'.repeat(64),diamonds:17};p.settleDuo(p.load(defs),receipt,defs);assert.equal(p.load(defs).diamonds,17);p.settleDuo(p.load(defs),receipt,defs);assert.equal(p.load(defs).diamonds,17);assert.equal(p.load(defs).duoSettledRuns.length,1);
 p.importFile(p.exportFile(p.load(defs),defs),defs);p.settleDuo(p.load(defs),receipt,defs);assert.equal(p.load(defs).diamonds,17);
 storage.setItem=()=>{throw Error('storage full');};assert.throws(()=>p.settleDuo(p.load(defs),{id:'b'.repeat(64),diamonds:2},defs),/storage full/);
});
