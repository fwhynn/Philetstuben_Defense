const {test}=require('node:test'),assert=require('node:assert/strict'),share=require('../classes/run-share.js');
test('result card counts completed waves and earned gold without start capital, holdings or refunds',()=>{
 const s={phase:'gameover',wave:21,lastCompletedWave:20,gold:999,goldEarned:{kills:100,completion:50,income:70,treasure:25,partner:20},baseKills:3,runTowerStats:{archer:{kills:12,refundGold:50},freeze:{kills:0}}};
 assert.deepEqual(share.summary(s),{wave:20,gold:265,kills:15,mode:'Standard'});assert.match(share.markup(s),/Welle 20/);assert.match(share.markup(s),/data-run-share="copy"/);
 assert.equal(share.summary({...s,duoMode:true}).mode,'Duo');assert.equal(share.summary({...s,challengeDay:'2026-09-25'}).mode,'Tägliche Herausforderung');
});
test('Sakura grass color matches the placed GLB ground material in sRGB',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),c=vm.createContext({});vm.runInContext(fs.readFileSync('classes/biomes.js','utf8'),c);const b=fs.readFileSync('assets/sakura/tiles/tile_straight.glb'),json=JSON.parse(b.subarray(20,20+b.readUInt32LE(12))),rgb=json.materials.find(m=>m.name==='grass_meadow').pbrMetallicRoughness.baseColorFactor.slice(0,3);const color='#'+rgb.map(x=>Math.round((x<=.0031308?12.92*x:1.055*x**(1/2.4)-.055)*255).toString(16).padStart(2,'0')).join('');assert.equal(vm.runInContext("HexBiomes.groundColor('grass',true)",c),color);assert.equal(vm.runInContext("HexBiomes.groundColor('desert',true)",c),vm.runInContext("HexBiomes.definitions.desert.color",c));
});
