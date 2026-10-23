const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {assertDataSafe}=require('../scripts/release-data-safety.cjs');
test('ordinary release rejects destructive migrations, accepts additive ones',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'release-safety-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 fs.mkdirSync(path.join(dir,'database_structure'));const file=path.join(dir,'database_structure/change.sql');
 fs.writeFileSync(file,'CREATE TABLE IF NOT EXISTS leaderboard_runs (id INT);');assert.doesNotThrow(()=>assertDataSafe(dir));
 for(const sql of ['DROP TABLE leaderboard_runs','TRUNCATE TABLE player_stats','DELETE FROM saves','DROP DATABASE game']){
  fs.writeFileSync(file,sql);assert.throws(()=>assertDataSafe(dir),/Release blocked/);
 }
});
