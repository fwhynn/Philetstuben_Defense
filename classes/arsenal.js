/* DOM-only research map. Profile mutations remain in the controller. */
const HexArsenal=(()=>{
  const icons={archer:'➶',catapult:'◈',chain:'ϟ',freeze:'❄',mine:'✹',ballista:'➳',flame:'♨',element:'✦',necromancer:'☽',house:'⌂',forge:'⚒',market:'◆'};
  function icon(type,color){return `<svg class="researchIcon" viewBox="0 0 48 48" aria-hidden="true"><path d="M10 42h28l-3-8H13zM16 34V18h16v16" fill="${color||'#a7bda4'}" stroke="#14261c" stroke-width="2"/><circle cx="24" cy="15" r="13" fill="#14261c" stroke="${color||'#a7bda4'}"/><text x="24" y="21" text-anchor="middle" font-size="20" fill="${color||'#a7bda4'}">${icons[type]}</text></svg>`;}
  function render(host,profile,onUnlock){
    host.innerHTML='';
    function node(parent,type,title,description,status,action){const article=document.createElement('article');article.className='researchNode '+(status.startsWith('✓')?'owned':'');article.innerHTML=`<div class="researchHeader">${icon(type,HexData.TOWERS[type]?.color)}<strong>${title}</strong></div><p>${description}</p><small>${status}</small>`;if(action){const button=document.createElement('button');button.className='secondary';button.textContent=action.kind==='activateUltimate'?'Für den nächsten Run aktivieren':'◆ '+action.cost+' freischalten';button.setAttribute('data-unlock',action.kind+':'+(action.id||type));button.disabled=action.blocked||profile.diamonds<(action.cost||0);button.addEventListener('click',()=>onUnlock(action.kind,action.id||type));article.appendChild(button);}parent.appendChild(article);return article;}
    for(const [type,tower] of Object.entries(HexData.TOWERS)){
      const tree=document.createElement('section');tree.className='researchTree';tree.id='research-'+type;tree.setAttribute('aria-label',tower.name+' Forschungsbaum');
      const owned=profile.unlockedTowers.includes(type),offer=HexProfile.TOWER_UNLOCKS[type];
      node(tree,type,tower.name,tower.desc+' Bau: '+tower.cost+' Gold.',owned?'✓ Turm verfügbar':'Turm gesperrt',!owned&&offer?{kind:'tower',cost:offer.cost}:null);
      const branches=document.createElement('div');branches.className='researchBranches';
      for(const [id,branch] of HexData.availableUpgrades({type})){
        const lane=document.createElement('div');lane.className='researchLane';
        node(lane,type,branch.name,branch.desc,owned?'✓ Im Run: '+branch.cost+' Gold':'Benötigt Turmfreischaltung');
        const final=HexData.availableUpgrades({type,branch:id})[0]?.[1];if(final)node(lane,type,final.name,final.desc,'Im Run: '+final.cost+' Gold nach '+branch.name);
        const ultimate=HexData.ultimateDefinition({type,branch:id}),unlocked=HexProfile.ownsUltimate(profile,type,id),active=HexProfile.activeUltimate(profile,type)===id;
        node(lane,type,ultimate.name,ultimate.desc+' Im Run: '+ultimate.cost+' Gold nach Stufe 3.',unlocked?(active?'✓ Aktiv für den nächsten Run':'✓ Freigeschaltet · inaktiv'):'Meta-Freischaltung · nur ein Pfad je Turmtyp aktiv',unlocked?(active?null:{kind:'activateUltimate',id:type+':'+id}):{kind:'ultimate',id:type+':'+id,cost:HexProfile.ULTIMATE_UNLOCKS[type].cost,blocked:!owned});
        branches.appendChild(lane);
      }tree.appendChild(branches);host.appendChild(tree);
    }
    for(const [type,def] of Object.entries(HexBuildings.definitions)){
      if(!HexBuildings.upgrades[type])continue;
      const tree=document.createElement('section');tree.className='researchTree buildingTree';tree.id='research-'+type;node(tree,type,def.name,def.desc,'✓ Im Run: '+def.cost+' Gold');
      const lane=document.createElement('div');lane.className='researchLane';for(let i=0;i<2;i++){const u=HexBuildings.upgrades[type][i];node(lane,type,def.name+' · Stufe '+(i+2),HexBuildings.definition({type,level:i+2}).desc,'Im Run: '+u.cost+' Gold');}
      const special=HexBuildings.specials[type],owned=profile.unlocks.includes('building:'+type);node(lane,type,special.name,special.desc+' Im Run: '+special.cost+' Gold nach Stufe 3.',owned?'✓ Dauerhaft freigeschaltet':'Meta-Freischaltung',owned?null:{kind:'building',cost:HexProfile.BUILDING_UNLOCKS[type].cost});tree.appendChild(lane);host.appendChild(tree);
    }
  }
  function enableDrag(view,content=view.firstElementChild,onZoom=()=>{}){
    let x=0,y=0,scale=.73;const pointers=new Map();
    function apply(){// Layout zoom rerasterizes glyphs instead of enlarging a composited bitmap.
      content.style.zoom=String(scale);content.style.left=(x/scale)+'px';content.style.top=(y/scale)+'px';onZoom(scale);}
    function zoom(factor,anchor={x:view.clientWidth/2,y:view.clientHeight/2}){const next=Math.max(.18,Math.min(1.8,scale*factor)),ratio=next/scale;x=anchor.x-(anchor.x-x)*ratio;y=anchor.y-(anchor.y-y)*ratio;scale=next;apply();}
    function local(e){const box=view.getBoundingClientRect();return {x:e.clientX-box.left,y:e.clientY-box.top};}
    function gesture(){const pts=[...pointers.values()];return pts.length>1?{x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2,d:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y)}:{...pts[0],d:0};}
    view.addEventListener('wheel',e=>{e.preventDefault();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?view.clientHeight:1);zoom(Math.exp(-Math.max(-200,Math.min(200,delta))*.002),local(e));},{passive:false});
    view.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest?.('button,select,a,input'))return;e.preventDefault();pointers.set(e.pointerId,local(e));view.setPointerCapture?.(e.pointerId);});
    view.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const before=gesture();pointers.set(e.pointerId,local(e));const after=gesture();x+=after.x-before.x;y+=after.y-before.y;if(before.d&&after.d)zoom(after.d/before.d,after);else apply();});
    const end=e=>pointers.delete(e.pointerId);for(const name of ['pointerup','pointercancel','lostpointercapture'])view.addEventListener(name,end);
    function fit(){if(!view.clientWidth||!content.offsetWidth||!content.offsetHeight)return;scale=Math.max(.18,Math.min(1,Math.min((view.clientWidth-32)/content.offsetWidth,(view.clientHeight-32)/content.offsetHeight)));x=(view.clientWidth-content.offsetWidth*scale)/2;y=(view.clientHeight-content.offsetHeight*scale)/2;apply();}
    view.addEventListener('keydown',e=>{if(e.target!==view)return;const directions={ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]};if(directions[e.key]){e.preventDefault();x+=directions[e.key][0];y+=directions[e.key][1];apply();}});
    function start(){pointers.clear();x=8;y=8;scale=.73;apply();}
    apply();return {zoom,fit,start};
  }
  return {render,enableDrag,icon};
})();
