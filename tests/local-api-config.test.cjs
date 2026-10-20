const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm'),http=require('node:http'),{spawn}=require('node:child_process'),{once}=require('node:events');
const root=path.resolve(__dirname,'..');
async function listen(server){server.listen(0,'127.0.0.1');await once(server,'listening');return server.address().port;}
async function devServer(t,api){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'autohex-local-api-'));
  fs.copyFileSync(path.join(root,'serve.cjs'),path.join(dir,'serve.cjs'));
  if(api)fs.writeFileSync(path.join(dir,'.env'),'API_BASE_URL='+api+'\nDB_PASS=TEST_SENTINEL_DO_NOT_SERVE\n');
  const reservation=http.createServer(),port=await listen(reservation);await new Promise(r=>reservation.close(r));
  const child=spawn(process.execPath,['serve.cjs'],{cwd:dir,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});
  t.after(async()=>{if(child.exitCode===null){const stopped=once(child,'exit');child.kill();await stopped;}fs.rmSync(dir,{recursive:true,force:true});});
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('dev server startup timed out')),5000);child.stdout.once('data',()=>{clearTimeout(timer);resolve();});child.once('exit',()=>{clearTimeout(timer);reject(Error('dev server exited'));});});
  return 'http://127.0.0.1:'+port;
}
test('default development and shipped runtime configurations retain the production API',async t=>{
  const base=await devServer(t),response=await fetch(base+'/runtime-config.js'),context=vm.createContext({});
  vm.runInContext(await response.text(),context);assert.equal(context.AUTOHEX_CONFIG.apiBaseUrl,undefined);
  vm.runInContext(fs.readFileSync(path.join(root,'runtime-config.js'),'utf8'),context);assert.equal(context.AUTOHEX_CONFIG.apiBaseUrl,undefined);
});
test('explicit local proxy forwards method, auth, body and query; hides env; never falls back to live',async t=>{
  let received;const upstream=http.createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;received={url:req.url,method:req.method,auth:req.headers.authorization,body};res.writeHead(201,{'Content-Type':'application/json'});res.end('{"local":true}');});
  const port=await listen(upstream);t.after(()=>upstream.close());
  const base=await devServer(t,'http://127.0.0.1:'+port);
  const config=await fetch(base+'/runtime-config.js');assert.match(await config.text(),/"apiBaseUrl":"\/api"/);assert.equal(config.headers.get('cache-control'),'no-store');
  const response=await fetch(base+'/api/saves?test=1',{method:'PUT',headers:{Authorization:'Bearer TEST_TOKEN'},body:'{"test":true}'});
  assert.equal(response.status,201);assert.deepEqual(received,{url:'/saves?test=1',method:'PUT',auth:'Bearer TEST_TOKEN',body:'{"test":true}'});
  const denied=await fetch(base+'/.env');assert.equal(denied.status,403);assert.ok(!(await denied.text()).includes('TEST_SENTINEL'));
  await new Promise(r=>upstream.close(r));
  const failed=await fetch(base+'/api/me');assert.equal(failed.status,502);assert.match(await failed.text(),/Lokale API/);
});
test('local and production API login tokens are isolated; the production key remains compatible',async()=>{
  const values=new Map([['hex-bastion-auth-token','PRODUCTION'],['hex-bastion-auth-token:/api','LOCAL']]);
  for(const [config,expected,url] of [[{},'PRODUCTION','https://api.autohextd.zlyfer.net/me'],[{apiBaseUrl:'/api'},'LOCAL','/api/me']]){
    let request;const context=vm.createContext({AUTOHEX_CONFIG:config,localStorage:{getItem:k=>values.get(k)},fetch:async(u,options)=>{request={u,options};return {ok:true,json:async()=>({user:{}})};}});
    vm.runInContext(fs.readFileSync(path.join(root,'classes/api.js'),'utf8'),context);
    await context.HexApi.currentUser();assert.equal(request.u,url);assert.equal(request.options.headers.Authorization,'Bearer '+expected);
  }
});
