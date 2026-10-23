'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const HEALTH_URL='https://api.autohextd.zlyfer.net/deployment-health';
function apiFingerprint(root){
 const files=['bootstrap.php','composer.json','composer.lock','public/index.php','public/webhook.php','scripts/prepare-release.php'];
 for(const dir of ['classes','routes','database_structure'])for(const file of fs.readdirSync(path.join(root,dir)))if(/\.(php|sql)$/.test(file)&&fs.statSync(path.join(root,dir,file)).isFile())files.push(`${dir}/${file}`);
 const hash=crypto.createHash('sha256');
 for(const file of files.sort())hash.update(file+'\0'+crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n')).digest('hex')+'\n');
 return hash.digest('hex');
}
async function waitForApi({fingerprint,fetchImpl=fetch,url=HEALTH_URL,timeoutMs=300000,intervalMs=3000,now=Date.now,sleep=ms=>new Promise(r=>setTimeout(r,ms))}){
 const deadline=now()+timeoutMs;
 do {
  try {
   const response=await fetchImpl(url,{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(5000),headers:{Accept:'application/json'}});
   if(response.ok){const state=await response.json();if(state.ready===true&&state.protocol===1&&state.fingerprint===fingerprint)return state;}
  }catch{/* A failed health request never authorizes a client deployment. */}
  if(now()>=deadline)break;
  await sleep(Math.min(intervalMs,Math.max(0,deadline-now())));
 }while(now()<=deadline);
 throw Error('API rollout not verified for this exact version. Client release stopped; no client tag or version change. Inspect private API deployment logs and retry preparation.');
}
async function prepareClientRelease({apiRoot,publishApi,wait=waitForApi}){
 const fingerprint=apiFingerprint(apiRoot);
 if(publishApi)await publishApi();
 return wait({fingerprint});
}
module.exports={apiFingerprint,waitForApi,prepareClientRelease};
