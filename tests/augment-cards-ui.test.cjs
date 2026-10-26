const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){
 class Node {
  constructor(tag='div'){this.tag=tag;this.children=[];this.listeners={};this.dataset={};this.className='';this.classList={toggle:()=>{}};}
  appendChild(n){n.parentNode=this;this.children.push(n);return n;}
  replaceChildren(...nodes){this.children=nodes;}
  setAttribute(k,v){this[k]=v;}
  addEventListener(k,fn){this.listeners[k]=fn;}
  querySelectorAll(s){return this.children.flatMap(n=>[(s[0]==='#'?n.id===s.slice(1):s[0]==='.'?n.className===s.slice(1):n.tag===s)?n:null,...n.querySelectorAll(s)]).filter(Boolean);}
  querySelector(s){return this.querySelectorAll(s)[0];}
 }
 const root=new Node(),box=root.appendChild(new Node());box.className='loadoutBox';const toolbar=box.appendChild(new Node());toolbar.className='arsenalToolbar';
 const context=vm.createContext({document:{getElementById:id=>root.querySelector('#'+id),createElement:tag=>new Node(tag)}});
 for(const name of ['augment-cards','augment-cards-ui'])vm.runInContext(fs.readFileSync('classes/'+name+'.js','utf8'),context);
 return {root,ui:vm.runInContext('HexAugmentCardsUI',context),p:{diamonds:100,augmentCards:{version:1,cards:{},unlocked:true},records:{highestWave:16}}};
}
test('collection opens from Arsenal; account purchase waits for server and suppresses double-clicks',async()=>{
 const {root,ui,p}=setup();let calls=0,release;
 ui.render(root,p,()=>{throw Error('local mutation forbidden');},(op)=>{assert.equal(op.kind,'buy');calls++;return new Promise(resolve=>release=resolve);});
 assert.equal(root.querySelector('#augmentCardCollection').hidden,true);root.querySelector('#augmentCollectionToggle').onclick();
 const host=root.querySelector('#augmentCardCollection'),buy=host.querySelector('button');assert.equal(host.hidden,false);
 buy.listeners.click();buy.listeners.click();assert.equal(calls,1);assert.equal(buy.disabled,true);assert.equal(p.diamonds,100);
 release();await new Promise(resolve=>setImmediate(resolve));assert.equal(buy.disabled,false);
});
test('failed server mutation leaves collection untouched and reports the error',async()=>{
 const {root,ui,p}=setup();root._augmentsOpen=true;ui.render(root,p,()=>{},async()=>{throw Error('Keine Verbindung');});
 const host=root.querySelector('#augmentCardCollection'),buy=host.querySelector('button');buy.listeners.click();await new Promise(resolve=>setImmediate(resolve));
 assert.equal(host.children.at(-1).textContent,'Keine Verbindung');assert.equal(p.diamonds,100);assert.equal(buy.disabled,false);
});

test('pack reveal shows exactly the two saved cards and only animates the new purchase once',()=>{
 const {root,ui,p}=setup();root._augmentsOpen=true;root._augmentRevealPacks=2;
 p.augmentCards={...p.augmentCards,packs:2,lastPack:[{id:'mine',tier:3},{id:'house',tier:1}]};
 ui.render(root,p,()=>{});const result=root.querySelector('#augmentCardCollection').children.find(n=>n.className.startsWith('augmentPackResult'));
 assert.match(result.className,/augmentReveal/);const cards=result.querySelectorAll('article');assert.equal(cards.length,2);assert.equal(cards[0].dataset.tier,'3');assert.equal(cards[1].dataset.tier,'1');assert.equal(cards[0].querySelector('h3').textContent,'Nachbeben');
 ui.render(root,p,()=>{});assert.equal(root.querySelector('#augmentCardCollection').children.find(n=>n.className.startsWith('augmentPackResult')).className,'augmentPackResult');
});
test('intro acknowledgement is persisted in the profile, then stays hidden after reopening',()=>{
 const {root,ui,p}=setup();root._augmentsOpen=true;let saved;
 ui.render(root,p,next=>saved=next);const welcome=root.querySelector('.augmentWelcome');assert.ok(welcome);welcome.querySelector('button').listeners.click();assert.equal(saved.augmentCards.introSeen,true);
 ui.render(root,JSON.parse(JSON.stringify(saved)),()=>{});assert.equal(root.querySelector('.augmentWelcome'),undefined);
});
