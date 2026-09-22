'use strict';
// Read-only release probe. Does not create rooms or touch player sessions.
async function check(origin){
 const base=new URL(origin);if(!['http:','https:'].includes(base.protocol))throw Error('HTTP(S) origin required');
 for(const route of ['/', '/duo-lobby.html','/duo-prototype.html','/classes/profile.js','/healthz']){
  const response=await fetch(new URL(route,base),{signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error(route+' returned '+response.status);
  if(route==='/healthz'&&(await response.json()).ok!==true)throw Error('Server unhealthy');
 }
 const response=await fetch(new URL('/results',base),{signal:AbortSignal.timeout(10000)});
 if(response.status!==401)throw Error('Private endpoint must require authentication');
 console.log('Public assets, server health and authentication boundary: OK');
}
if(require.main===module)check(process.argv[2]||'http://127.0.0.1:8090').catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={check};
