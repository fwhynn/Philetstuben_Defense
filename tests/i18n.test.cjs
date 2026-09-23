const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function languageContext(storage=new Map(),document){let observer;const context={localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},document,MutationObserver:class{constructor(fn){observer=fn;}observe(){}disconnect(){}}};vm.createContext(context);for(const name of ['translations','i18n'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../classes/'+name+'.js'),'utf8'),context);return {i:context.HexI18n,catalog:context.HexTranslations,context,notify:change=>observer([change])};}
test('German terminology, English content and interpolated stats translate without changing IDs',()=>{
 const {i}=languageContext();assert.equal(i.text('Archer · Common · Wave 15'),'Bogenschütze · Gewöhnlich · Welle 15');assert.equal(i.text('Archer · Common · Wave 15','en'),'Archer · Common · Wave 15');assert.equal(i.text('archer,freeze,elementFire','en'),'archer,freeze,elementFire');
 assert.equal(i.text('Schaden gegen: 11 Leben / 9 Rüstung / 6 Magieresistenz · Reichweite 150','en'),'Damage against: 11 Health / 9 Armor / 6 Magic resistance · Range 150');
 assert.equal(i.text('Wähle 1 von 3 Hexkarten. Common ist häufiger als Uncommon und Rare.','en'),'Choose 1 of 3 hex cards. Common cards appear more often than Uncommon and Rare cards.');
 assert.equal(i.text('WAVE 35 ÜBERLEBT'),'WELLE 35 ÜBERLEBT');
});
test('every card, tower, upgrade, biome and building description has a catalog entry',()=>{
 const {i,catalog}=languageContext(),core=require('../headless-core.cjs')(),seen=new Set(),known=new Set(Object.keys(catalog.en).map(s=>i.text(s,'de')));
 function walk(value){if(!value||typeof value!=='object'||seen.has(value))return;seen.add(value);for(const [key,item]of Object.entries(value)){if(['name','desc','description'].includes(key)&&typeof item==='string')assert.ok(known.has(i.text(item,'de')),item);else walk(item);}}walk(core);
});
class Element{
 constructor(tag='div',attrs={},children=[]){this.nodeType=1;this.tag=tag;this.attrs=attrs;this.childNodes=children;for(const n of children)n.parentElement=this;}
 matches(selectors){return selectors.split(',').some(s=>s===this.tag||(s.startsWith('[')&&Object.hasOwn(this.attrs,s.slice(1,-1))));}
 closest(s){return this.matches(s)?this:this.parentElement?.closest(s);}
 hasAttribute(k){return Object.hasOwn(this.attrs,k);}getAttribute(k){return this.attrs[k];}setAttribute(k,v){this.attrs[k]=v;}
 cloneNode(){return new Element(this.tag,{...this.attrs},this.childNodes.map(n=>n.nodeType===3?textNode(n.nodeValue):n.cloneNode()));}
 get outerHTML(){return '<'+this.tag+'>'+this.childNodes.map(n=>n.nodeType===3?n.nodeValue:n.outerHTML).join('')+'</'+this.tag+'>';}
}
function textNode(value){return {nodeType:3,nodeValue:value,childNodes:[]};}
test('switching locale updates existing and newly rendered text and tooltips, preserves user input and reload preference',()=>{
 const label=textNode('Archer'),node=new Element('button',{title:'Schaden gegen Leben'},[label]),input=new Element('input',{placeholder:'Leer = zufälliger Run'});input.value='Archer eigene Map';
 const picker=new Element('select',{'data-language-picker':'','aria-label':'Sprache'},[new Element('option',{},[textNode('Deutsch')])]);
 const body=new Element('body',{},[node,input,picker]),listeners={},doc={body,documentElement:{},readyState:'complete',querySelectorAll:()=>[picker],addEventListener:(name,fn)=>listeners[name]=fn},storage=new Map();
 const {i,notify}=languageContext(storage,doc);assert.equal(label.nodeValue,'Bogenschütze');i.setLanguage('en');assert.equal(label.nodeValue,'Archer');assert.equal(node.attrs.title,'Damage against health');assert.equal(input.value,'Archer eigene Map');assert.equal(picker.childNodes[0].childNodes[0].nodeValue,'Deutsch');assert.equal(picker.attrs['aria-label'],'Language');
 assert.equal(i.sourceHTML(node),'<button>Archer</button>');
 label.nodeValue='Minenleger';notify({type:'characterData',target:label});assert.equal(label.nodeValue,'Mine Layer');i.setLanguage('de');assert.equal(label.nodeValue,'Minenleger');assert.equal(node.attrs.title,'Schaden gegen Leben');i.setLanguage('en');assert.equal(label.nodeValue,'Mine Layer');assert.equal(languageContext(storage).i.getLanguage(),'en');
});
test('HUD disclosures close their sibling when opened by click or programmatically',()=>{
 const panels=Array.from({length:5},()=>({open:false,attrs:{},events:{},summary:{events:{},addEventListener(k,fn){this.events[k]=fn;}},setAttribute(k,v){this.attrs[k]=v;},querySelector(){return this.summary;},addEventListener(k,fn){this.events[k]=fn;}}));
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../classes/menu-controls.js'),'utf8'),{document:{querySelectorAll:()=>panels,addEventListener(){}}});
 panels[0].open=true;panels[1].summary.events.click();assert.equal(panels[0].open,false);panels[1].open=true;panels[4].open=true;panels[4].events.toggle();assert.equal(panels.filter(p=>p.open).length,1);assert.equal(panels[4].open,true);assert.ok(panels.every(p=>p.attrs.name==='hud-information'));
});

test('outside presses dismiss HUD popups and drawers while inside controls remain usable',()=>{
 let down;const panel={open:true,contains:node=>node.inside==='hud',setAttribute(){},querySelector:()=>null,addEventListener(){}};let hidden=false;const drawer={id:'rulesDrawer',contains:node=>node.inside==='drawer',classList:{add:()=>hidden=true}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../classes/menu-controls.js'),'utf8'),{document:{querySelectorAll:selector=>selector.includes('hud')?[panel]:[drawer],addEventListener:(type,fn)=>down=fn}});
 down({button:0,target:{inside:'hud'}});assert.equal(panel.open,true);assert.equal(hidden,true);hidden=false;
 down({button:0,target:{inside:'drawer'}});assert.equal(panel.open,false);assert.equal(hidden,false);
 down({button:0,target:{closest:()=>({dataset:{drawer:'rulesDrawer'}})}});assert.equal(hidden,false);
 down({button:0,target:{}});assert.equal(hidden,true);
});

test('regular click dismisses rules and settings even without a pointer event; nested opener and content do not dismiss',()=>{
 const handlers={},drawers=['rulesDrawer','settingsDrawer'].map(id=>({id,hidden:false,contains:node=>node.inside===id,classList:{add(){drawers.find(d=>d.id===id).hidden=true;}}}));
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../classes/menu-controls.js'),'utf8'),{document:{querySelectorAll:s=>s.includes('hud')?[]:drawers.filter(d=>!d.hidden),addEventListener:(type,fn)=>handlers[type]=fn}});
 handlers.click({target:{inside:'rulesDrawer'}});assert.equal(drawers[0].hidden,false);assert.equal(drawers[1].hidden,true);
 handlers.click({target:{closest:()=>({dataset:{drawer:'rulesDrawer'}})}});assert.equal(drawers[0].hidden,false);
 handlers.click({target:{}});assert.equal(drawers[0].hidden,true);
 drawers[1].hidden=false;handlers.click({target:{}});assert.equal(drawers[1].hidden,true);
});

test('a drawer opened on pointerup is not closed by the click completing that same gesture',()=>{
 const handlers={};let hidden=true;const drawer={id:'towerDrawer',open:false,contains:()=>false,classList:{add(){hidden=true;}}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../classes/menu-controls.js'),'utf8'),{document:{querySelectorAll:s=>s.includes('drawer')&&!hidden?[drawer]:[],addEventListener:(type,fn)=>handlers[type]=fn}});
 handlers.pointerdown({button:0,target:{}});hidden=false;handlers.click({button:0,detail:1,target:{}});assert.equal(hidden,false);
 handlers.pointerdown({button:0,target:{}});assert.equal(hidden,true);
 hidden=false;handlers.click({button:0,detail:0,target:{}});assert.equal(hidden,true);
});

test('German full phrases preserve gender and case after terminology replacement',()=>{
 const {i}=languageContext();assert.equal(i.text('Noch einmal mit diesem Loadout'),'Noch einmal mit dieser Turmauswahl');assert.equal(i.text('75 % Slow in der Killzone.'),'75 % Verlangsamung im Kampfbereich.');assert.equal(i.text('Beenden des Runs'),'Beenden des Durchlaufs');assert.equal(i.text('Ausgewogenes Loadout'),'Ausgewogene Turmauswahl');assert.equal(i.text('pro Kill'),'pro besiegten Gegner');
 assert.equal(i.text('Noch einmal mit dieser Turmauswahl','en'),'Try again with this loadout');assert.equal(i.text('75 % Verlangsamung im Kampfbereich.','en'),'75% slow in the combat zone.');
});
