const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {assertReleaseReady}=require('../scripts/release-readiness.cjs');
test('release stops until integration and automatic rollout tests are explicitly verified',t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'autohex-ready-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const file=path.join(dir,'release-readiness.json');assert.throws(()=>assertReleaseReady(dir),/Release blocked/);
 const report={change:'save-safety-v2',checks:{}};for(const key of ['test_database_integration','automatic_rollout'])report.checks[key]={status:'passed',evidence:'verified fixture'};
 fs.writeFileSync(file,JSON.stringify(report));assert.doesNotThrow(()=>assertReleaseReady(dir));
 for(const key of Object.keys(report.checks)){report.checks[key].status='pending';fs.writeFileSync(file,JSON.stringify(report));assert.throws(()=>assertReleaseReady(dir),new RegExp(key));report.checks[key].status='passed';}
 report.checks.automatic_rollout.evidence='';fs.writeFileSync(file,JSON.stringify(report));assert.throws(()=>assertReleaseReady(dir),/automatic_rollout/);
});
