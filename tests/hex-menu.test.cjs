const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {load}=require('./helpers/game.cjs');
function completed(wave=1,options={}){
 const view=load(options);Object.assign(view.a.state,{wave,waveRunning:true,phase:'wave',enemies:[],pendingSpawns:0,spawnQueue:[]});view.a.endWave();return view;
}

test('a resumable run takes the centre hex and offers New run below the flower',()=>{
 const fresh=load({bootToMenu:true});
 assert.equal(fresh.elements.get('mainMenu').classList.contains('canContinue'),false);
 assert.equal(fresh.elements.get('menuPlayLabel').textContent,'Spielen');
 const original=completed(3),next=load({bootToMenu:true,initialStorage:Object.fromEntries(original.storage)});
 assert.equal(next.elements.get('menuContinueBtn').classList.contains('hidden'),false);
 assert.equal(next.elements.get('mainMenu').classList.contains('canContinue'),true);
 assert.equal(next.elements.get('menuContinueDetail').textContent,'Welle 4');
 assert.equal(next.elements.get('menuPlayLabel').textContent,'Spielen');assert.equal(next.elements.get('menuPlayDetail').textContent,'Fortsetzen · Welle 4');
 next.elements.get('menuPlayBtn').listeners.click();assert.equal(next.elements.get('playModeOverlay').classList.contains('hidden'),false,'Spielen öffnet die Spielauswahl');
 next.elements.get('menuContinueBtn').listeners.click();assert.equal(next.elements.get('playModeOverlay').classList.contains('hidden'),true);assert.equal(next.elements.get('mainMenu').classList.contains('hidden'),true);
});

test('daily and duo hexes stay visible but locked until the modes unlock',()=>{
 const {elements}=load({bootToMenu:true,initialStorage:{'tutorial-v1':''}});
 for(const id of ['menuDailyBtn','menuDuoBtn']){assert.equal(elements.get(id).classList.contains('locked'),true);assert.equal(elements.get(id).classList.contains('hidden'),false);assert.equal(elements.get(id).disabled,true);}
 elements.get('menuDailyBtn').listeners.click();
 assert.equal(elements.get('mainMenu').classList.contains('hidden'),false);
 assert.equal(elements.get('playModeOverlay')?.classList.contains('hidden')??true,true);
});

test('the daily hex opens the daily challenge details directly once unlocked',()=>{
 const {elements}=load({bootToMenu:true,initialProfile:{milestones:['standard35']}});
 assert.equal(elements.get('menuDailyBtn').classList.contains('locked'),false);assert.equal(elements.get('menuDailyBtn').disabled,false);
 elements.get('menuDailyBtn').listeners.click();
 assert.equal(elements.get('mainMenu').classList.contains('hidden'),true);
 assert.equal(elements.get('playModeOverlay').classList.contains('hidden'),false);
 assert.equal(elements.get('dailyModeDetails').classList.contains('hidden'),false);
 assert.equal(elements.get('playModeChoices').classList.contains('hidden'),true);
});

test('hex flower layouts in style.css never overlap and keep the 44 px touch minimum',()=>{
 const css=fs.readFileSync(path.join(__dirname,'../hexwerk.css'),'utf8');
 const layouts=[...css.matchAll(/--d:([\d.]+);--hc:([\d.]+)/g)].map(m=>[Number(m[1]),Number(m[2])]);
 const slots=[...css.matchAll(/\[data-slot=(\w+)\]\{--x:([-\d.]+);--y:([-\d.]+)\}/g)].map(m=>[Number(m[2]),Number(m[3])]);
 assert.ok(layouts.length>=1);assert.equal(slots.length,6);
 // Gleichmäßiger Kreis: alle Ring-Hexe gleich weit von der Mitte, im Abstand von 60°.
 const angles=slots.map(([x,y])=>Math.atan2(y,x)*180/Math.PI).sort((a,b)=>a-b);
 for(const [x,y] of slots)assert.ok(Math.abs(Math.hypot(x,y)-1)<.01);
 for(let i=1;i<6;i++)assert.ok(Math.abs(angles[i]-angles[i-1]-60)<.5);
 const hex=(cx,cy,h)=>{const w=Math.sqrt(3)/2*h;return[[cx,cy-h/2],[cx+w/2,cy-h/4],[cx+w/2,cy+h/4],[cx,cy+h/2],[cx-w/2,cy+h/4],[cx-w/2,cy-h/4]];};
 const axes=p=>p.map((a,i)=>{const b=p[(i+1)%p.length],n=[a[1]-b[1],b[0]-a[0]],l=Math.hypot(...n);return[n[0]/l,n[1]/l];});
 const gap=(A,B)=>Math.max(...[...axes(A),...axes(B)].map(ax=>{const pa=A.map(p=>p[0]*ax[0]+p[1]*ax[1]),pb=B.map(p=>p[0]*ax[0]+p[1]*ax[1]);return Math.max(Math.min(...pb)-Math.max(...pa),Math.min(...pa)-Math.max(...pb));}));
 for(const [d,hc] of layouts){
  const ordered=[...slots].sort((a,b)=>Math.atan2(a[1],a[0])-Math.atan2(b[1],b[0]));
  const ring=ordered.map(([x,y])=>hex(x*d,y*d,1)),centre=hex(0,0,hc),gaps=[];
  for(const [i,cell] of ring.entries()){const c=gap(centre,cell),n=gap(cell,ring[(i+1)%6]);assert.ok(c>0,`centre overlaps ring ${i} at d=${d}`);assert.ok(n>0,`ring ${i} overlaps its neighbour at d=${d}`);gaps.push(c,n);}
  const centreGaps=gaps.filter((g,i)=>i%2===0),ringGaps=gaps.filter((g,i)=>i%2===1);assert.ok(Math.max(...centreGaps)-Math.min(...centreGaps)<.001&&Math.max(...ringGaps)-Math.min(...ringGaps)<.001,'Fugen rundum gleich');assert.ok(hc>=1.25,'Mittel-Hex deutlich größer');assert.ok(Math.min(...centreGaps)>=.12&&Math.min(...centreGaps)<=.2,'Hexe mit deutlichem, aber zusammenhängendem Abstand');
 }
 // Kleinste Einheit 52 px: Ring-Hex ist dann 45 px breit.
 assert.ok(Math.min(...[...css.matchAll(/--u:max\((\d+)px/g)].map(m=>Number(m[1])))*Math.sqrt(3)/2>=44);
});

test('arrow keys move focus to the nearest enabled hex in that direction',()=>{
 const rects={centre:[0,0],top:[0,-120],ur:[104,-60],lr:[104,60],ll:[-104,60]};
 const hexes=Object.entries(rects).map(([name,[x,y]])=>({name,disabled:name==='ll',focus(){focused=this;},getClientRects:()=>[1],getBoundingClientRect:()=>({left:x-40,top:y-40,width:80,height:80}),closest(){return this;}}));
 let focused=null,handler=null;
 const cluster={addEventListener:(type,fn)=>{if(type==='keydown')handler=fn;},querySelectorAll:()=>hexes};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../classes/hex-menu.js'),'utf8'),{document:{getElementById:id=>id==='hexCluster'?cluster:null},Math});
 const press=(key,from)=>{let prevented=false;handler({key,target:hexes.find(h=>h.name===from),preventDefault(){prevented=true;}});return prevented;};
 assert.equal(press('ArrowUp','centre'),true);assert.equal(focused.name,'top');
 press('ArrowRight','top');assert.equal(focused.name,'ur');
 press('ArrowDown','ur');assert.equal(focused.name,'lr');
 focused=null;assert.equal(press('ArrowLeft','centre'),false,'disabled hex is skipped');assert.equal(focused,null);
});

test('main-menu settings mirror the game settings and close with Escape',()=>{
 const listeners={},nodes=new Map(),classes=new Set(['hidden']);let docKey=null,focused=null;
 const node=id=>{if(!nodes.has(id))nodes.set(id,{id,checked:false,value:'0',events:[],listeners:{},addEventListener(type,fn){this.listeners[type]=fn;},dispatchEvent(e){this.events.push(e.type);},focus(){focused=id;}});return nodes.get(id);};
 const overlay={classList:{add:n=>classes.add(n),remove:n=>classes.delete(n),contains:n=>classes.has(n)}};
 const document={getElementById:id=>id==='hexCluster'?{addEventListener(){}}:id==='menuSettingsOverlay'?overlay:node(id),addEventListener:(type,fn)=>{if(type==='keydown')docKey=fn;}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../classes/hex-menu.js'),'utf8'),{document,Event:class{constructor(type){this.type=type;}},Math});
 node('soundEnabled').checked=true;node('soundVolume').value='70';node('onboardingHints').checked=false;
 node('menuSettingsBtn').listeners.click();
 assert.equal(classes.has('hidden'),false);assert.equal(node('menuSoundEnabled').checked,true);assert.equal(node('menuSoundVolume').value,'70');assert.equal(node('menuOnboardingHints').checked,false);
 node('menuSoundVolume').value='20';node('menuSoundVolume').listeners.input();
 assert.equal(node('soundVolume').value,'20');assert.deepEqual(node('soundVolume').events,['input']);
 node('menuOnboardingHints').checked=true;node('menuOnboardingHints').listeners.change();assert.equal(node('onboardingHints').checked,true);
 let stopped=false;docKey({key:'Escape',preventDefault(){},stopImmediatePropagation(){stopped=true;}});
 assert.equal(classes.has('hidden'),true);assert.equal(stopped,true);assert.equal(focused,'menuSettingsBtn');
});

test('the client release refuses legal pages with placeholders',()=>{
 const {unfinishedLegalPages}=require('../legal-placeholders.cjs'),os=require('node:os');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'legal-'));
 fs.writeFileSync(path.join(dir,'impressum.html'),'<p>[[Name]]</p>');fs.writeFileSync(path.join(dir,'datenschutz.html'),'<p>fertig</p>');
 assert.deepEqual(unfinishedLegalPages(dir),['impressum.html']);
 fs.rmSync(dir,{recursive:true,force:true});
});

test('menu maps follow the in-game placement rules and use only original models',async()=>{
 const {MENU_MAPS}=await import('../classes/menu-maps.mjs');
 const context={};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../classes/data.js'),'utf8')+';globalThis.D=HexData;',context);
 const LIB=context.D.CARD_LIBRARY,DIRS=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]],key=(q,r)=>q+','+r;
 const inventory=new Set(JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/index.json'),'utf8')));
 for(const [name,map] of Object.entries(MENU_MAPS)){
  const tiles=new Map(map.tiles.map(t=>[key(t.q,t.r),{...t,roads:t.type==='base'?null:LIB[t.type].roads.map(d=>(d+t.rotation)%6)}]));
  const base=tiles.get('0,0');assert.equal(base?.type,'base',name+': Festung in der Mitte');
  // Die Festung hat genau eine Straße: die Kante, die zum Nachbarn mit Gegenstraße zeigt.
  base.roads=DIRS.map((_,d)=>d).filter(d=>{const n=tiles.get(key(DIRS[d][0],DIRS[d][1]));return n&&n.roads.includes((d+3)%6);});
  assert.equal(base.roads.length,1,name+': Festung mit genau einem Ausgang');assert.equal(base.roads[0],base.rotation,name+': Festung zeigt mit ihrer Straße zum Ausgang');
  for(const tile of tiles.values()){
   if(tile.type!=='base'){assert.ok(LIB[tile.type]&&!LIB[tile.type].procedural,name+': '+tile.type+' hat ein eigenes Modell');assert.ok(inventory.has('tiles/tile_'+tile.type+'.glb'),tile.type+' Modell fehlt');}
   for(let d=0;d<6;d++){
    const n=tiles.get(key(tile.q+DIRS[d][0],tile.r+DIRS[d][1])),road=tile.roads.includes(d);
    if(!n)assert.equal(road,false,`${name}: Straße von ${tile.q},${tile.r} endet am Inselrand`);
    else assert.equal(road,n.roads.includes((d+3)%6),`${name}: Kante ${tile.q},${tile.r} → ${n.q},${n.r} passt nicht`);
   }
  }
  const reach=new Set(['0,0']),open=[base];
  while(open.length){const t=open.pop();for(const d of t.roads){const id=key(t.q+DIRS[d][0],t.r+DIRS[d][1]);if(!reach.has(id)){reach.add(id);open.push(tiles.get(id));}}}
  assert.equal(reach.size,tiles.size,name+': alles hängt an der Festung');
  const used=new Set();
  for(const t of map.towers){const tile=tiles.get(key(t.q,t.r)),id=key(t.q,t.r)+':'+t.index;assert.ok(tile&&tile.type!=='base'&&t.index<(LIB[tile.type].slots||0),name+': Turm nur auf Bauplatz');assert.ok(!used.has(id));used.add(id);assert.ok(inventory.has('towers/tower_'+t.model+'.glb'),t.model+' Modell fehlt');}
  for(const b of map.buildings){const tile=tiles.get(key(b.q,b.r));assert.ok(tile&&b.index<(LIB[tile.type].buildingSlots||0),name+': Gebäude nur auf Gebäudeplatz');assert.ok(inventory.has('buildings/building_'+b.model+'.glb'));}
  for(const f of map.fog)assert.ok(!tiles.has(key(f.q,f.r)),name+': Nebel nur außerhalb der Karte');
  assert.equal(map.towers.length,5,name+': genau fünf Türme');assert.equal(new Set(map.towers.map(t=>t.model)).size,5,name+': fünf verschiedene Türme');
  for(const e of map.enemies)assert.ok(inventory.has('enemies/enemy_'+e+'.glb'),e+' Gegnermodell fehlt');
 }
});

test('menu backdrop and tower portraits reach the const game modules by name, not via globalThis',()=>{
 // HexMap, HexData, HexModelMap und HexAssetEdition sind „const“ in klassischen Skripten und hängen nicht an globalThis.
 for(const file of ['classes/menu-backdrop.js','classes/tower-portraits.mjs']){
  const source=fs.readFileSync(path.join(__dirname,'..',file),'utf8');
  assert.doesNotMatch(source,/globalThis\.Hex(Map|Data|ModelMap|AssetEdition)\b/,file);
 }
 for(const file of ['classes/map.js','classes/data.js','classes/model-map.js'])assert.match(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),/^(\/\*.*\*\/\s*)?const Hex/m,file);
});
