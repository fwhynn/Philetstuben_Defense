const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../classes/settings-window.js'),'utf8');

function setup({paused=false,wave='12',account='Autophil'}={}){
 const observers=[];
 const el=(attrs={})=>({listeners:{},dataset:{},attrs:{},hidden:false,open:false,textContent:'',classes:new Set(),...attrs,
  classList:{toggle(name,on){on?this.owner.classes.add(name):this.owner.classes.delete(name);},contains(name){return this.owner.classes.has(name);},add(name){this.owner.classes.add(name);},remove(name){this.owner.classes.delete(name);}},
  addEventListener(type,fn){this.listeners[type]=fn;},setAttribute(key,value){this.attrs[key]=String(value);},closest(){return null;},focus(){}});
 const make=attrs=>{const node=el(attrs);node.classList.owner=node;return node;};
 const tabs=['game','audio','controls','help'].map(name=>make({dataset:{settingsTab:name}})),panes=['game','audio','controls','help'].map(name=>make({dataset:{settingsPane:name}}));
 const goto=make({dataset:{settingsGoto:'controls'}}),help=make(),summary=make(),runstate=make(),accountLine=make(),tablist=make();
 const win=make();win.classes.add('hidden');
 win.querySelectorAll=selector=>selector==='[data-settings-tab]'?tabs:selector==='[data-settings-pane]'?panes:selector==='[data-settings-goto]'?[goto]:[];
 win.querySelector=selector=>({'#hotkeyHelp':help,'#hotkeyHelpSummary':summary,'[data-settings-tab=controls]':tabs[2],'[data-settings-runstate]':runstate,'[data-settings-account]':accountLine,'[role=tablist]':tablist})[selector]||null;
 const app=make();if(paused)app.classes.add('paused');
 const document={readyState:'complete',activeElement:null,querySelectorAll:selector=>selector==='[data-settings-window]'?[win]:[],
  getElementById:id=>({wave:{textContent:wave},app,menuAccountLabel:{textContent:account}})[id]||null};
 class MutationObserver{constructor(fn){this.fn=fn;observers.push(this);}observe(target){this.target=target;}}
 vm.runInNewContext(source,{document,MutationObserver});
 const notify=target=>{for(const o of observers)if(o.target===target)o.fn();};
 return {tabs,panes,goto,help,summary,runstate,accountLine,win,notify,document,tablist};
}

test('settings tabs show one section at a time and the controls tab opens the hotkey list',()=>{
 const view=setup();
 view.tabs[1].listeners.click();
 assert.deepEqual(view.tabs.map(t=>t.attrs['aria-selected']),['false','true','false','false']);
 assert.deepEqual(view.panes.map(p=>p.hidden),[true,false,true,true]);
 assert.equal(view.help.open,false);
 view.goto.listeners.click();
 assert.equal(view.panes[2].hidden,false);assert.equal(view.help.open,true,'Tastenübersicht gilt als geöffnet');
});

test('arrow keys move between sections',()=>{
 const view=setup();view.document.activeElement=view.tabs[3];let prevented=false;
 view.tablist.listeners.keydown({key:'ArrowDown',preventDefault(){prevented=true;}});
 assert.equal(prevented,true);assert.equal(view.panes[0].hidden,false);assert.equal(view.tabs[0].attrs['aria-selected'],'true');
});

test('the hotkey hint highlights the controls tab and the footer shows wave, pause and account',()=>{
 const view=setup({paused:true});
 view.summary.classes.add('hotkeyGuide');view.notify(view.summary);assert.equal(view.tabs[2].classes.has('hotkeyGuide'),true);
 view.summary.classes.delete('hotkeyGuide');view.notify(view.summary);assert.equal(view.tabs[2].classes.has('hotkeyGuide'),false);
 view.win.classes.delete('hidden');view.notify(view.win);
 assert.equal(view.runstate.textContent,'Pausiert · Welle 12');assert.equal(view.accountLine.textContent,'Angemeldet als Autophil');
 const guest=setup({account:'Anmelden'});assert.equal(guest.accountLine.textContent,'');assert.equal(guest.runstate.textContent,'Welle 12');
});

test('in-game settings keep every control the game and tests rely on',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),drawer=html.slice(html.indexOf('<aside id="settingsDrawer"'),html.indexOf('</aside>',html.indexOf('<aside id="settingsDrawer"')));
 for(const id of ['slotHints','upgradeStatus','hexGrid','onboardingHints','autoStart','runSeed','activeSeed','dailyRunStatus','newRunBtn','soundEnabled','soundVolume','musicEnabled','musicVolume','hotkeyHelp','hotkeyHelpSummary','towerHotkeyHint','restartTutorialBtn','openMainMenuBtn','settingsDeveloperTools','exitFirstPlayerTestSettings','skipIntroductionSettings'])
  assert.match(drawer,new RegExp('id="'+id+'"'),id);
 assert.match(drawer,/data-language-picker/);assert.match(drawer,/data-asset-edition/);assert.match(drawer,/data-drawer="rulesDrawer"/);
});

test('Twitch and Google sign-in are shown but locked until they exist',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),social=html.match(/<div class="accountSocial"[\s\S]*?<\/div>/)[0];
 assert.match(social,/class="socialTwitch" disabled/);assert.match(social,/class="socialGoogle" disabled/);
 assert.match(html,/id="accountSocialSoon" class="accountSoon">Bald verfügbar</);
});

test('outside clicks close dropdowns but keep window sections marked data-keep-open',()=>{
 const keep={id:'runEnd',open:true,matches:s=>s==='[data-keep-open]',contains:()=>false},drop={id:'deckDropdown',open:true,matches:()=>false,contains:()=>false},handlers={};
 const document={querySelectorAll:s=>s==='details[open]'?[keep,drop]:[],addEventListener:(type,fn)=>{handlers[type]=fn;}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../classes/menu-controls.js'),'utf8'),{document});
 handlers.pointerdown({button:0,target:{closest:()=>null}});
 assert.equal(keep.open,true);assert.equal(drop.open,false);
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 for(const marker of ['class="runEndDetails" open data-keep-open','class="biomeRules hxGroup" open data-keep-open','id="hotkeyHelp" class="hotkeyHelp hxGroup" data-keep-open'])assert.ok(html.includes(marker),marker);
});
