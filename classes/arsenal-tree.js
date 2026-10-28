/* Arsenal als Fertigkeitenbaum (Test-Ansicht, angelehnt an den Passivbaum in Path of Exile).
   Reiter: Türme und Gebäude (je ein eigener Baum), nach Freischaltung zusätzlich Augment-Karten (Sammlung aus augment-cards-ui.js). Mitte: Arsenal. Ring: die Türme bzw. Gebäude.
   Nach außen je Zweig Stufe 2 → Stufe 3 → Ultimate bzw. Spezial. Der Baum liegt auf einer Ellipse, damit breite
   Beschriftungen im Querformat Platz haben; die viewBox passt sich dem Inhalt an.
   Daten kommen unverändert aus HexArsenal.trees(profile); Freischaltungen laufen über denselben Callback wie die Werkstatt.
   Ziehen verschiebt, Mausrad/Pinch/Knöpfe zoomen, Knoten sind per Tab erreichbar und öffnen rechts die Details. */
const HexArsenalTree=(()=>{
  const GROUPS=[{id:'tower',label:'Türme',icon:'tower_archer'},{id:'building',label:'Gebäude',icon:'building_house'}];
  // Radien in Baum-Einheiten; ex streckt waagerecht, turn dreht den Start (in Sektoren). Werte so gewählt, dass sich
  // weder Knoten noch Beschriftungen überlappen (siehe tests/arsenal-tree.test.cjs).
  const RADII={tower:{root:290,step:[430,530],meta:660,ex:1.25,turn:0},building:{root:170,step:[310,410],meta:510,ex:1.2,turn:.5}};
  const SIZE={hub:80,root:58,meta:46,step:26},FONT={root:34,meta:27},LINE=1.15,PAD=70;
  const HEX=a=>[0,1,2,3,4,5].map(i=>{const t=Math.PI/180*(60*i-90);return (Math.cos(t)*a).toFixed(1)+','+(Math.sin(t)*a).toFixed(1);}).join(' ');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ICON={archer:'tower_archer',catapult:'tower_catapult',chain:'tower_chain',freeze:'tower_freeze',mine:'tower_mine',ballista:'tower_ballista',flame:'tower_flame',element:'tower_element',necromancer:'tower_necromancer',house:'building_house',forge:'building_forge',market:'building_market'};
  const view={x:0,y:0,scale:1},state={selected:'hub',group:'tower'};

  // Lange Namen an einem Leerzeichen in zwei Zeilen teilen.
  function labelLines(name,max=12){
    const text=String(name??'');if(text.length<=max||!text.includes(' '))return [text];
    let best=[text],worst=Infinity;
    for(let i=text.indexOf(' ');i>0;i=text.indexOf(' ',i+1)){const a=text.slice(0,i),b=text.slice(i+1),w=Math.max(a.length,b.length);if(w<worst){worst=w;best=[a,b];}}
    return best;
  }
  // Geschätzter Rahmen der Beschriftung (obere Hälfte: über dem Knoten, sonst darunter) (für den Layout-Test und die viewBox).
  function labelBox(n){
    if(n.kind!=='root'&&n.kind!=='meta')return null;
    const font=FONT[n.kind],lines=labelLines(n.name),w=Math.max(...lines.map(l=>l.length))*font*.56;
    const h=font*LINE*lines.length,top=n.y<-1?n.y-SIZE[n.kind]-6-h:n.y+SIZE[n.kind]+6;
    return {x0:n.x-w/2,x1:n.x+w/2,y0:top,y1:top+h};
  }

  // Knoten und Kanten aus den Baumdaten: Polarkoordinaten auf einer Ellipse, je Baum ein Sektor, je Zweig ein Strahl.
  function layout(list,profile,radii=RADII.tower){
    const nodes=[{id:'hub',kind:'hub',x:0,y:0,lit:true,name:'Arsenal'}],edges=[];
    const sector=Math.PI*2/Math.max(1,list.length),at=(r,a)=>({x:Math.cos(a)*r*radii.ex,y:Math.sin(a)*r});
    list.forEach((tree,i)=>{
      const angle=-Math.PI/2+(i+(radii.turn||0))*sector;
      const rootId='root:'+tree.type,rootAction=tree.action,affordable=!!rootAction&&profile.diamonds>=rootAction.cost;
      nodes.push({id:rootId,kind:'root',tree,...at(radii.root,angle),lit:tree.owned,affordable,action:rootAction,name:tree.name});
      edges.push({from:'hub',to:rootId,lit:tree.owned});
      const spread=Math.min(sector*.62,sector*.29*tree.paths.length);
      tree.paths.forEach((path,j)=>{
        const a=tree.paths.length===1?angle:angle-spread/2+spread*j/(tree.paths.length-1);let prev=rootId;
        path.steps.forEach((step,k)=>{const id='step:'+tree.type+':'+j+':'+k;nodes.push({id,kind:'step',tree,step,...at(radii.step[k],a),lit:tree.owned,name:step.name});edges.push({from:prev,to:id,lit:tree.owned});prev=id;});
        const meta=path.meta,action=meta.action,metaAffordable=!!action&&!action.blocked&&action.kind!=='activateUltimate'&&profile.diamonds>=(action.cost||0);
        const id='meta:'+tree.type+':'+j;nodes.push({id,kind:'meta',tree,meta,...at(radii.meta,a),lit:meta.state!=='locked',active:meta.state==='active',affordable:metaAffordable,action,name:meta.name});
        edges.push({from:prev,to:id,lit:meta.state!=='locked'});
      });
    });
    // viewBox: alle Knoten samt Beschriftung plus Rand.
    let x0=0,y0=0,x1=0,y1=0;
    for(const n of nodes){const s=SIZE[n.kind],b=labelBox(n);x0=Math.min(x0,n.x-s,b?b.x0:Infinity);x1=Math.max(x1,n.x+s,b?b.x1:-Infinity);y0=Math.min(y0,n.y-s,b?b.y0:Infinity);y1=Math.max(y1,n.y+s,b?b.y1:-Infinity);}
    const box={x:x0-PAD,y:y0-PAD,w:x1-x0+PAD*2,h:y1-y0+PAD*2};
    return {nodes,edges,byId:new Map(nodes.map(n=>[n.id,n])),box};
  }
  function nodeMarkup(n){
    const cls='skillNode '+n.kind+(n.lit?' lit':'')+(n.affordable?' affordable':'')+(n.active?' active':'')+(state.selected===n.id?' selected':'');
    const label=n.kind==='hub'?'Arsenal':n.kind==='step'?n.step.tier+': '+n.name:n.name;
    const size=SIZE[n.kind];
    const shape=n.kind==='step'?'<circle r="'+size+'"/>':'<polygon points="'+HEX(size)+'"/>';
    const icon=n.kind==='hub'?'arsenal':n.kind==='meta'?'upgradeBadge':ICON[n.tree.type]||'arsenal',k=n.kind==='hub'?.62:.6;
    const inner=n.kind==='step'?'<text class="skillTier" y="8">'+(n.step.tier.endsWith('3')?'III':'II')+'</text>'
      :'<foreignObject x="-'+(size*k)+'" y="-'+(size*k)+'" width="'+(size*k*2)+'" height="'+(size*k*2)+'"><span class="hxi hxi-'+icon+'" style="color:'+(n.kind==='root'?n.tree.color:'')+'"></span></foreignObject>';
    const lines=n.kind==='root'||n.kind==='meta'?labelLines(n.name):[];
    const above=n.y<-1,first=above?-(size+6+FONT[n.kind]*LINE*(lines.length-1)+FONT[n.kind]*.3):size+6+FONT[n.kind]*.85;
    const caption=lines.length?'<text class="skillLabel" y="'+first.toFixed(1)+'" font-size="'+FONT[n.kind]+'">'+lines.map((l,i)=>'<tspan x="0"'+(i?' dy="'+LINE+'em"':'')+'>'+esc(l)+'</tspan>').join('')+'</text>':'';
    return '<g class="'+cls+'" data-node="'+esc(n.id)+'" transform="translate('+n.x.toFixed(1)+' '+n.y.toFixed(1)+')" tabindex="0" role="button" aria-label="'+esc(label)+'"><title>'+esc(label)+'</title>'+shape+inner+caption+'</g>';
  }
  // Detailspalte: Kopf mit Symbol, Beschreibung, Statuszeile, Werteänderungen als Tabelle, Hinweise als Infokasten.
  function details(n,profile,list){
    const head=(icon,kicker,title,color='')=>'<header class="skillHead"><span class="skillHeadIcon"><span class="hxi hxi-'+icon+'"'+(color?' style="color:'+color+'"':'')+'></span></span><div><p class="skillKicker">'+esc(kicker)+'</p><h3>'+esc(title)+'</h3></div></header>';
    const changes=rows=>(rows||[]).length?'<section class="skillBlock"><h4>Änderungen</h4><dl class="skillChanges">'+rows.map(r=>{const at=String(r).lastIndexOf(': ');return at>0?'<div><dt>'+esc(r.slice(0,at))+'</dt><dd>'+esc(r.slice(at+2)).replace('→','<span class="skillArrow">→</span>')+'</dd></div>':'<div><dt>'+esc(r)+'</dt><dd></dd></div>';}).join('')+'</dl></section>':'';
    const status=(text,tone)=>'<p class="skillStatus '+tone+'">'+esc(String(text).replace(/^✓\s*/,''))+'</p>';
    const note=text=>'<p class="skillHint"><span aria-hidden="true">ⓘ</span>'+esc(text)+'</p>';
    if(n.kind==='hub'){
      const group=GROUPS.find(g=>g.id===state.group),owned=list.filter(t=>t.owned).length;
      return head(group.icon,'Arsenal',group.label)+'<p class="skillDesc">'+(state.group==='tower'
        ?'Diamanten schalten Türme und ihre Ultimates dauerhaft frei. Stufe 2 und 3 baust du im Run mit Gold aus.'
        :'Diamanten schalten Gebäude und ihre Spezialausbauten dauerhaft frei. Stufe 2 und 3 baust du im Run mit Gold aus.')
        +'</p><section class="skillBlock"><h4>Fortschritt</h4><p class="skillProgress"><span style="width:'+Math.round(owned/Math.max(1,list.length)*100)+'%"></span></p><p class="skillProgressText">Freigeschaltet: '+owned+'/'+list.length+'</p></section><p class="skillBalance">◆ '+profile.diamonds+' verfügbar</p>'+note('Wähle einen Knoten im Baum, um Details und Freischaltungen zu sehen.');
    }
    if(n.kind==='root'){
      const paths=n.tree.paths.map(path=>'<li><span class="skillPathSteps">'+path.steps.map(step=>esc(step.name)).join(' › ')+'</span><span class="skillPathMeta '+(path.meta.state||'locked')+'">'+esc(path.meta.tier)+': '+esc(path.meta.name)+'</span></li>').join('');
      return head(ICON[n.tree.type]||'arsenal',n.tree.kind==='tower'?'Turm':'Gebäude',n.name,n.tree.color)+'<p class="skillDesc">'+esc(n.tree.desc)+'</p>'+status(n.tree.summary,n.tree.owned?'ok':'locked')
        +(n.action?button(n.action,n.tree.type,profile):'')+'<section class="skillBlock"><h4>Ausbaupfade</h4><ul class="skillPaths">'+paths+'</ul></section>'+note(n.tree.hint);
    }
    if(n.kind==='step')return head(ICON[n.tree.type]||'arsenal',n.step.tier+' · '+n.tree.name,n.name,n.tree.color)+'<p class="skillDesc">'+esc(n.step.desc)+'</p>'+status('Im Run mit Gold: '+n.step.cost+' Gold','gold')+changes(n.step.changes);
    return head('upgradeBadge',n.meta.tier+' · '+n.tree.name,n.name)+'<p class="skillDesc">'+esc(n.meta.desc)+'</p>'+status(n.meta.status,n.meta.state==='locked'?'locked':'ok')+(n.action?button(n.action,n.tree.type,profile):'')+changes(n.meta.changes);
  }
  function button(action,fallback,profile){
    const ok=!action.blocked&&profile.diamonds>=(action.cost||0);
    const text=action.kind==='activateUltimate'?'Für den nächsten Run aktivieren':'◆ '+action.cost+' freischalten';
    return '<button type="button" class="'+(ok?'primary':'secondary')+' skillBuy" data-unlock-kind="'+esc(action.kind)+'" data-unlock-id="'+esc(action.id||fallback)+'"'+(ok?'':' disabled')+'>'+esc(text)+'</button>';
  }
  // augments (optional, aus game.js): dritter Reiter „Augment-Karten“; die Sammlung selbst zeichnet HexAugmentCardsUI.
  function groupTabs(all,augments){
    return '<div class="skillGroups" role="tablist" aria-label="Arsenal-Bereiche">'+GROUPS.map(g=>{
      const trees=all.filter(t=>t.kind===g.id),owned=trees.filter(t=>t.owned).length,open=trees.some(t=>t.affordable);
      return '<button type="button" role="tab" class="skillGroup'+(open?' hasOffer':'')+'" data-group="'+g.id+'" aria-selected="'+(!augments?.open&&state.group===g.id)+'"><span class="hxi hxi-'+g.icon+'"></span><span>'+esc(g.label)+'</span><small>'+owned+'/'+trees.length+'</small></button>';
    }).join('')+(augments?'<button type="button" role="tab" class="skillGroup'+(augments.fresh?' hasOffer':'')+'" data-augments aria-selected="'+!!augments.open+'"><span class="hxi hxi-deck"></span><span>Augment-Karten</span><small>'+esc(augments.count)+'</small></button>':'')+'</div>';
  }
  function render(host,all,profile,onUnlock,augments=null){
    if(!host)return;
    const list=all.filter(t=>t.kind===state.group);
    const {nodes,edges,byId,box}=layout(list,profile,RADII[state.group]);
    if(!byId.has(state.selected))state.selected='hub';
    const lines=edges.map(e=>{const a=byId.get(e.from),b=byId.get(e.to);return '<line class="skillEdge'+(e.lit?' lit':'')+'" x1="'+a.x.toFixed(1)+'" y1="'+a.y.toFixed(1)+'" x2="'+b.x.toFixed(1)+'" y2="'+b.y.toFixed(1)+'"/>';}).join('');
    const r=RADII[state.group],rings=[r.root,r.step[0],r.step[1],r.meta].map(v=>'<ellipse class="skillRing" rx="'+(v*r.ex).toFixed(1)+'" ry="'+v+'"/>').join('');
    host.innerHTML='<div class="skillMain">'+groupTabs(all,augments)
      +'<div class="skillCanvas"><svg class="skillSvg" viewBox="'+[box.x,box.y,box.w,box.h].map(v=>v.toFixed(0)).join(' ')+'" aria-label="Arsenal als Baum"><g class="skillWorld">'+rings+lines+nodes.map(nodeMarkup).join('')+'</g></svg>'
      +'<ul class="skillLegend"><li class="isOwned">freigeschaltet</li><li class="isOffer">jetzt freischaltbar</li><li class="isLocked">gesperrt</li><li class="isRun">II · III im Run mit Gold</li></ul>'
      +'<div class="skillZoom"><button type="button" class="secondary" data-zoom="1.25" aria-label="Vergrößern">+</button><button type="button" class="secondary" data-zoom="0.8" aria-label="Verkleinern">−</button><button type="button" class="secondary" data-zoom="0" aria-label="Ganzen Baum zeigen">⌂</button></div></div></div>'
      +'<aside class="skillDetail" aria-live="polite">'+details(byId.get(state.selected),profile,list)+'</aside>';
    const svg=host.querySelector('.skillSvg'),world=host.querySelector('.skillWorld'),detail=host.querySelector('.skillDetail');
    const cx=box.x+box.w/2,cy=box.y+box.h/2;
    const apply=()=>world.setAttribute('transform','translate('+view.x.toFixed(1)+' '+view.y.toFixed(1)+') scale('+view.scale.toFixed(3)+')');
    const zoom=(factor,px=cx,py=cy)=>{const next=Math.max(.5,Math.min(3,view.scale*factor)),k=next/view.scale;view.x=px-(px-view.x)*k;view.y=py-(py-view.y)*k;view.scale=next;apply();};
    // Bildschirm → viewBox-Koordinaten (preserveAspectRatio: xMidYMid meet).
    const toView=event=>{const rect=svg.getBoundingClientRect(),s=Math.max(box.w/rect.width,box.h/rect.height);return {x:cx+(event.clientX-rect.left-rect.width/2)*s,y:cy+(event.clientY-rect.top-rect.height/2)*s,s};};
    apply();
    host.querySelector('[data-augments]')?.addEventListener('click',()=>{if(!augments.open)augments.select(true);});
    for(const b of host.querySelectorAll('[data-group]'))b.addEventListener('click',()=>{if(augments?.open){state.group=b.dataset.group;state.selected='hub';augments.select(false);return;}if(state.group===b.dataset.group)return;state.group=b.dataset.group;state.selected='hub';view.x=0;view.y=0;view.scale=1;render(host,all,profile,onUnlock);host.querySelector('[data-group][aria-selected=true]')?.focus();});
    const choose=id=>{state.selected=id;for(const g of host.querySelectorAll('.skillNode'))g.classList.toggle('selected',g.dataset.node===id);detail.innerHTML=details(byId.get(id),profile,list);bindButtons();};
    function bindButtons(){for(const b of detail.querySelectorAll('[data-unlock-kind]'))b.addEventListener('click',()=>onUnlock(b.dataset.unlockKind,b.dataset.unlockId));}
    bindButtons();
    for(const g of host.querySelectorAll('.skillNode')){g.addEventListener('click',()=>choose(g.dataset.node));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(g.dataset.node);}});}
    for(const b of host.querySelectorAll('[data-zoom]'))b.addEventListener('click',()=>{const f=Number(b.dataset.zoom);if(f)zoom(f);else{view.x=0;view.y=0;view.scale=1;apply();}});
    svg.addEventListener('wheel',e=>{e.preventDefault();const p=toView(e);zoom(e.deltaY<0?1.12:1/1.12,p.x,p.y);},{passive:false});
    // Ziehen zum Verschieben; zwei Finger zoomen. Kleine Bewegungen zählen als Klick auf den Knoten.
    const pointers=new Map();let pinch=0,moved=0;
    svg.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;if(pointers.size===2){const [a,b]=[...pointers.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y);}});
    svg.addEventListener('pointermove',e=>{const last=pointers.get(e.pointerId);if(!last)return;const {s}=toView(e);
      if(pointers.size===2){pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch)zoom(d/pinch);pinch=d;return;}
      const dx=(e.clientX-last.x)*s,dy=(e.clientY-last.y)*s;moved+=Math.abs(dx)+Math.abs(dy);if(moved>6){view.x+=dx;view.y+=dy;apply();svg.setPointerCapture?.(e.pointerId);}
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});});
    const end=e=>{pointers.delete(e.pointerId);if(pointers.size<2)pinch=0;};
    svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
    svg.addEventListener('click',e=>{if(moved>6){e.stopPropagation();e.preventDefault();}},true);
  }
  return {render,layout,labelLines,labelBox,GROUPS,RADII,SIZE,FONT};
})();
if(typeof module!=='undefined')module.exports=HexArsenalTree;
