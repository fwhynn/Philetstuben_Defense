const {test}=require('node:test'),assert=require('node:assert/strict');
const core=require('../headless-core.cjs');
const directions=[[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]];
test('finite biome components contain 9–25 cells, including clipped start borders',()=>{
 const b=core().biomes;
 for(let seed=0;seed<12;seed++){
  const seen=new Set();for(let q=-18;q<=18;q++)for(let r=-18;r<=18;r++){
   const id=q+','+r,type=b.at('bounded'+seed,q,r);if(type==='grass'||seen.has(id))continue;
   const cells=[[q,r]];seen.add(id);for(let i=0;i<cells.length;i++){assert.ok(cells.length<=25,'unbounded or merged biome');for(const [dq,dr] of directions){const [x,y]=cells[i],nx=x+dq,ny=y+dr,key=nx+','+ny;if(!seen.has(key)&&b.at('bounded'+seed,nx,ny)===type){seen.add(key);cells.push([nx,ny]);}}}
   assert.ok(cells.length>=9,'tiny biome at '+id+' seed '+seed);
  }
 }
});
test('every expansion ray changes biomes and generation is independent of discovery order',()=>{
 const b=core().biomes;for(const seed of ['rivers','islands','curves'])for(const [dq,dr] of directions){const values=[];for(let n=4;n<120;n++)values.push(b.at(seed,n*dq,n*dr));assert.ok(new Set(values).size>=2);let streak=1;for(let i=1;i<values.length;i++){streak=values[i]===values[i-1]?streak+1:1;assert.ok(streak<=12);}for(let n=119;n>=4;n--)assert.equal(b.at(seed,n*dq,n*dr),values[n-4]);}
});
test('old checkpoints keep sector geography and new checkpoints keep bounded geography',()=>{
 const c=core(),run=c.runtime.create({seed:'version',runId:'test',loadout:['archer','catapult','chain','freeze','mine']});run.state.phase='build';assert.equal(run.state.biomeLayoutVersion,2);
 let snap=c.snapshot.capture(run.state,run.random);assert.equal(c.snapshot.restore(snap).state.biomeLayoutVersion,2);
 delete run.state.biomeLayoutVersion;snap=c.snapshot.capture(run.state,run.random);assert.equal(c.snapshot.restore(snap).state.biomeLayoutVersion,1);
});
