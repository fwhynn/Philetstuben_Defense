/* DOM-only Arsenal workshop: one tree at a time, chosen from a side rail. Profile mutations remain in the controller. */
const HexArsenal=(()=>{
  const icons={archer:'➶',catapult:'◈',chain:'ϟ',freeze:'❄',mine:'✹',ballista:'➳',flame:'♨',element:'✦',necromancer:'☽',house:'⌂',forge:'⚒',market:'◆'};
  const BUILDING_COLOR='#d3b566';
  let current=null;// Selected tree survives re-renders after unlocks.
  function icon(type,color){return `<svg class="researchIcon" viewBox="0 0 48 48" aria-hidden="true"><path d="M10 42h28l-3-8H13zM16 34V18h16v16" fill="${color||'#a7bda4'}" stroke="#14261c" stroke-width="2"/><circle cx="24" cy="15" r="13" fill="#14261c" stroke="${color||'#a7bda4'}"/><text x="24" y="21" text-anchor="middle" font-size="20" fill="${color||'#a7bda4'}">${icons[type]}</text></svg>`;}
  function el(tag,className,html){const e=document.createElement(tag);if(className)e.className=className;if(html!==undefined)e.innerHTML=html;return e;}
  // Collects every tree as plain data so rail and detail view share one source.
  function trees(profile){
    const list=[];
    for(const [type,tower] of Object.entries(HexData.TOWERS)){
      const owned=profile.unlockedTowers.includes(type),offer=HexProfile.TOWER_UNLOCKS[type],activeId=HexProfile.activeUltimate(profile,type);
      const paths=HexData.availableUpgrades({type}).map(([id,branch])=>{
        const finalEntry=HexData.availableUpgrades({type,branch:id})[0],final=finalEntry?.[1],ultimate=HexData.ultimateDefinition({type,branch:id}),unlocked=HexProfile.ownsUltimate(profile,type,id),active=activeId===id;
        const baseDef=HexData.towerDefinition({type}),branchDef=HexData.towerDefinition({type,branch:id}),finalTower={type,branch:id,finalUpgrade:finalEntry?.[0]},finalDef=HexData.towerDefinition(finalTower);
        return {steps:[{tier:'Stufe 2',name:branch.name,desc:branch.desc,cost:branch.cost,changes:HexData.upgradeChanges(baseDef,branchDef)},final&&{tier:'Stufe 3',name:final.name,desc:final.desc,cost:final.cost,changes:HexData.upgradeChanges(branchDef,finalDef)}].filter(Boolean),
          meta:{tier:'Ultimate',name:ultimate.name,desc:ultimate.desc,changes:HexData.upgradeChanges(finalDef,HexData.towerDefinition({...finalTower,ultimate:type})),cost:ultimate.cost,state:unlocked?(active?'active':'owned'):'locked',status:unlocked?(active?'✓ Aktiv für den nächsten Run':'✓ Freigeschaltet · inaktiv'):(owned?'Meta-Freischaltung':'Benötigt Turmfreischaltung'),
            action:unlocked?(active?null:{kind:'activateUltimate',id:type+':'+id}):{kind:'ultimate',id:type+':'+id,cost:HexProfile.ULTIMATE_UNLOCKS[type].cost,blocked:!owned}}};
      });
      const activeName=activeId?HexData.ultimateDefinition({type,branch:activeId})?.name:'';
      list.push({type,kind:'tower',name:tower.name,desc:tower.desc,color:tower.color,cost:tower.cost,owned,paths,
        summary:owned?(activeName?'✓ '+activeName:'✓ Turm verfügbar'):'Turm gesperrt',
        action:!owned&&offer?{kind:'tower',cost:offer.cost}:null,
        hint:'Werte gelten ohne Biom-, Hex- und Gebäudeboni. Vergleich jeweils mit der vorherigen Stufe. Pro Turm ist höchstens ein Ultimate aktiv. Wechseln kostet keine Diamanten.'});
    }
    for(const [type,def] of Object.entries(HexBuildings.definitions)){
      if(!HexBuildings.upgrades[type])continue;
      const special=HexBuildings.specials[type],owned=profile.unlocks.includes('building:'+type);
      const buildingChanges=(a,b)=>{const before=HexBuildings.definition(a),after=HexBuildings.definition(b),f=n=>Number(n.toFixed(2)).toLocaleString('de-DE');return type==='house'?['Gold je Welle: '+before.income+' → '+after.income]:type==='forge'?['Turmschaden-Bonus: '+f((before.damage-1)*100)+' % → '+f((after.damage-1)*100)+' %']:['Turm-Rabatt: '+f((1-before.discount)*100)+' % → '+f((1-after.discount)*100)+' %'];};
      const steps=[0,1].map(i=>({changes:buildingChanges({type,level:i+1},{type,level:i+2}),tier:'Stufe '+(i+2),name:def.name+' · Stufe '+(i+2),desc:HexBuildings.definition({type,level:i+2}).desc,cost:HexBuildings.upgrades[type][i].cost}));
      list.push({type,kind:'building',name:def.name,desc:def.desc,color:BUILDING_COLOR,cost:def.cost,owned:true,
        paths:[{steps,meta:{tier:'Spezial',name:special.name,desc:special.desc,changes:type==='house'?buildingChanges({type,level:3},{type,level:3,special:true}):['Zusätzlich versorgbare Wunschhexe: 0 → 1'],cost:special.cost,state:owned?'active':'locked',status:owned?'✓ Dauerhaft freigeschaltet':'Meta-Freischaltung',action:owned?null:{kind:'building',cost:HexProfile.BUILDING_UNLOCKS[type].cost}}}],
        summary:owned?'✓ Spezial freigeschaltet':'Spezial gesperrt',action:null,hint:'Gebäude sind immer verfügbar. Der Spezialausbau wird dauerhaft freigeschaltet.'});
    }
    for(const tree of list)tree.affordable=[tree.action,...tree.paths.map(p=>p.meta.action)].some(a=>a&&a.kind!=='activateUltimate'&&!a.blocked&&profile.diamonds>=a.cost);
    return list;
  }
  const statIcons={'Schaden gegen Leben':'♥','Schaden gegen Rüstung':'⬟','Schaden gegen Magieresistenz':'✦','Reichweite':'◎','Aura-Reichweite':'◎','Nachladezeit':'◷','Zeit je Mine':'◷','Explosionsradius':'✹','Blitzziele':'ϟ','Blitz-Sprungweite':'ϟ↔','Durchschlagsziele':'➶','Aura-Verlangsamung':'❄','Treffer-Verlangsamung':'❄','Verlangsamungsdauer':'❄⌛','Maximale Geister':'☽','Geisterschaden pro Sekunde':'⚔','Geisterlebensdauer':'⌛','Bossschaden-Multiplikator':'♛'};
  const changes=rows=>rows?.length?'<div class="statChips arsenalChanges">'+rows.map(row=>{const i=row.indexOf(': '),label=row.slice(0,i),value=row.slice(i+2);return '<span class="statChip" title="'+label+'" aria-label="'+row+'"><span aria-hidden="true">'+(statIcons[label]||label)+'</span> '+value+'</span>';}).join('')+'</div>':'';
  function render(host,profile,onUnlock,rail=document.getElementById('arsenalTabs')){
    const list=trees(profile);
    if(!list.some(t=>t.type===current))current=(list.find(t=>t.affordable)||list[0]).type;
    host.innerHTML='';rail.innerHTML='';
    function unlockButton(action,fallbackId){
      const affordable=!action.blocked&&profile.diamonds>=(action.cost||0),button=el('button',affordable?'primary arsenalBuy':'secondary arsenalBuy');
      button.textContent=action.kind==='activateUltimate'?'Für den nächsten Run aktivieren':'◆ '+action.cost+' freischalten';
      button.setAttribute('data-unlock',action.kind+':'+(action.id||fallbackId));button.disabled=!affordable;button.addEventListener('click',()=>onUnlock(action.kind,action.id||fallbackId));return button;
    }
    function select(type){current=type;for(const [t,{tab,panel}] of views){const on=t===type;panel.hidden=!on;tab.classList.toggle('active',on);tab.setAttribute('aria-selected',String(on));tab.tabIndex=on?0:-1;}}
    const views=new Map();let group='';
    for(const tree of list){
      if(tree.kind!==group){group=tree.kind;rail.appendChild(el('h3','arsenalRailGroup',group==='tower'?'Türme':'Gebäude'));}
      const tab=el('button','arsenalTab'+(tree.owned?'':' locked')+(tree.affordable?' affordable':''),`${icon(tree.type,tree.color)}<span class="arsenalTabText"><strong>${tree.name}</strong><small>${tree.summary}</small></span>${tree.affordable?'<span class="arsenalTabDot" aria-label="Freischaltung bezahlbar">◆</span>':''}`);
      tab.style.cssText='--tree-color:'+tree.color;tab.setAttribute('role','tab');tab.setAttribute('aria-controls','research-'+tree.type);
      tab.addEventListener('click',()=>select(tree.type));
      tab.addEventListener('keydown',e=>{const step={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1}[e.key];if(!step)return;e.preventDefault?.();const i=(list.findIndex(t=>t.type===current)+step+list.length)%list.length;select(list[i].type);views.get(list[i].type).tab.focus?.();});
      rail.appendChild(tab);
      const panel=el('section','arsenalTree '+(tree.owned?'treeOwned':'treeLocked'));panel.id='research-'+tree.type;panel.style.cssText='--tree-color:'+tree.color;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-label',tree.name+' Forschungsbaum');
      const hero=el('header','arsenalHero',`<div class="arsenalHeroIcon">${icon(tree.type,tree.color)}</div><div class="arsenalHeroText"><span class="arsenalKicker">${tree.kind==='tower'?'Turm':'Gebäude'}</span><h3>${tree.name}</h3><p>${tree.desc}</p><div class="arsenalChips"><span class="arsenalChip">Bau: ${tree.cost} 🪙</span><span class="arsenalChip ${tree.owned?'good':'muted'}">${tree.owned?(tree.kind==='tower'?'✓ Turm verfügbar':'✓ Immer verfügbar'):'🔒 Turm gesperrt'}</span></div></div>`);
      if(tree.action){const box=el('div','arsenalHeroAction');box.appendChild(unlockButton(tree.action,tree.type));hero.appendChild(box);}
      panel.appendChild(hero);
      panel.appendChild(el('p','arsenalHint',(tree.owned?'':'<span>Schalte zuerst den Turm frei, um seine Ausbaupfade zu nutzen.</span> ')+`<span>${tree.hint}</span>`));
      const paths=el('div','arsenalPaths'+(tree.paths.length===1?' single':''));
      tree.paths.forEach((path,index)=>{
        const column=el('div','arsenalPath');if(tree.paths.length>1)column.appendChild(el('span','arsenalPathLabel','Pfad '+(index+1)));
        for(const step of path.steps)column.appendChild(el('article','arsenalStep',`<span class="arsenalTier">${step.tier}</span><strong>${step.name}</strong>${tree.kind==='tower'&&step.changes?.length?'':'<p>'+step.desc+'</p>'}${changes(step.changes)}<span class="arsenalCost">Im Run: ${step.cost} 🪙</span>`));
        const m=path.meta,card=el('article','arsenalStep arsenalMeta '+m.state,`<span class="arsenalTier">${m.tier}</span><strong>${m.name}</strong>${tree.kind==='tower'&&m.changes?.length?'':'<p>'+m.desc+'</p>'}${changes(m.changes)}<span class="arsenalCost">Im Run: ${m.cost} 🪙 nach Stufe 3</span><small class="arsenalStatus">${m.status}</small>`);
        if(m.action)card.appendChild(unlockButton(m.action,tree.type));
        column.appendChild(card);paths.appendChild(column);
      });
      panel.appendChild(paths);host.appendChild(panel);views.set(tree.type,{tab,panel});
    }
    select(current);
  }
  return {render,icon,trees};
})();
