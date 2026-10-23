const fs=require('node:fs'),path=require('node:path');
const required=['test_database_integration','automatic_rollout'];
// These are local test prerequisites. Live backup/schema/worker readiness is enforced
// by Composer and the API gate on every release, then checked over /deployment-health.
function assertReleaseReady(root){
 let report;try{report=JSON.parse(fs.readFileSync(path.join(root,'release-readiness.json'),'utf8'));}catch{throw Error('Release blocked: release readiness evidence is missing or invalid.');}
 if(report.change!=='save-safety-v2')throw Error('Release blocked: wrong readiness report.');
 const pending=required.filter(key=>report.checks?.[key]?.status!=='passed'||typeof report.checks[key].evidence!=='string'||!report.checks[key].evidence.trim());
 if(pending.length)throw Error('Release blocked: '+pending.join(', ')+'. See release-readiness.json and docs/RELEASE_SAVE_SAFETY.md. Do not mark checks passed without verification.');
}
module.exports={assertReleaseReady};
if(require.main===module){try{assertReleaseReady(path.resolve(__dirname,'..'));console.log('Release readiness checks passed.');}catch(e){console.error(e.message);process.exitCode=1;}}
