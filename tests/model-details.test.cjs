const {test}=require('node:test'),assert=require('node:assert/strict');
test('flame finals and ultimate have distinct visible geometry in either asset edition',async()=>{
 const {flameDetails}=await import('../classes/model-details.mjs');
 assert.equal(flameDetails({branch:'inferno'}).children.length,0);
 const a=flameDetails({finalUpgrade:'sunfire'}),b=flameDetails({finalUpgrade:'firestorm'}),u=flameDetails({finalUpgrade:'sunfire',ultimate:'flame'});
 assert.notEqual(a.children.length,b.children.length);assert.ok(u.children.length>a.children.length);assert.ok(u.getObjectByName('phoenix-core'));
});
test('each boss retains its identity geometry across all biome variants',async()=>{
 const {bossDetails}=await import('../classes/model-details.mjs');
 for(const [kind,marker] of [['iron','iron-shoulder'],['hunter','hunter-horn'],['summoner','soul-mantle']])for(const biome of ['grass','storm','ash','desert']){
 const g=bossDetails(kind,biome,.6);assert.ok(g.getObjectByName(marker));if(biome!=='grass')assert.ok(g.getObjectByName('biome-'+biome));
 }
});
