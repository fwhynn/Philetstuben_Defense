'use strict';
async function check(origin='http://127.0.0.1:8090',expected=require('../package.json').version,{attempts=30,delay=500}={}){
 for(let attempt=0;attempt<attempts;attempt++){
  try{const r=await fetch(new URL('/healthz',origin),{signal:AbortSignal.timeout(1000)}),body=await r.json();if(r.ok&&body.ok&&body.ruleset===expected){console.log('Duo ready: '+expected);return;}}catch{}
  if(attempt+1<attempts)await new Promise(resolve=>setTimeout(resolve,delay));
 }
 throw Error('Duo did not become healthy with expected ruleset '+expected+'; the old process may still be running.');
}
if(require.main===module)check().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={check};
