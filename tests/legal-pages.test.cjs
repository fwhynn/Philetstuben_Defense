'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {initLegalPage}=require('../legal.js');
const root=path.join(__dirname,'..');

function page(search,{closes=true}={}){
 const link=href=>({href,listeners:{},getAttribute:()=>href,addEventListener(name,fn){this.listeners[name]=fn;}});
 const back=link('index.html'),privacy=link('datenschutz.html'),timers=[],calls=[];
 const win={closed:false,location:{search,href:'impressum.html'+search,replace:url=>calls.push(['replace',url])},
  document:{querySelectorAll:()=>[privacy],querySelector:selector=>selector==='[data-back-to-game]'?back:null},
  close(){calls.push(['close']);if(closes)this.closed=true;},setTimeout:fn=>timers.push(fn)};
 initLegalPage(win);
 const click=(target,extra={})=>{let prevented=false;target.listeners.click?.({button:0,preventDefault(){prevented=true;},...extra});return prevented;};
 return {win,back,privacy,timers,calls,click};
}

test('back to game closes the legal tab that the game opened',()=>{
 const p=page('?from=game');
 assert.equal(p.click(p.back),true);
 assert.deepEqual(p.calls,[['close']]);
 p.timers.forEach(fn=>fn());
 assert.equal(p.win.location.href,'impressum.html?from=game');
});

test('back to game falls back to the game page when the tab cannot be closed',()=>{
 const p=page('?from=game',{closes:false});
 p.click(p.back);p.timers.forEach(fn=>fn());
 assert.equal(p.win.location.href,'index.html');
});

test('links between legal pages keep the tab closable',()=>{
 const p=page('?from=game');
 assert.equal(p.click(p.privacy),true);
 assert.deepEqual(p.calls,[['replace','datenschutz.html?from=game']]);
 assert.equal(p.click(p.privacy,{ctrlKey:true}),false);
});

test('legal pages opened directly behave like normal links',()=>{
 const p=page('');
 assert.equal(p.click(p.back),false);
 assert.equal(p.click(p.privacy),false);
 assert.deepEqual(p.calls,[]);
});

test('game menu links and legal pages are wired up',()=>{
 const menu=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.equal((menu.match(/href="(impressum|datenschutz)\.html\?from=game" target="_blank"/g)||[]).length,2);
 for(const name of ['impressum.html','datenschutz.html']){
  const html=fs.readFileSync(path.join(root,name),'utf8');
  assert.match(html,/<script src="legal\.js" defer><\/script>/);
  assert.match(html,/<a href="index\.html" data-back-to-game>/);
 }
});
