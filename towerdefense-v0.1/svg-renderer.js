/* SVG adapter. Reads gameplay state; sends logical actions back to the controller. */
const HexSvgRenderer=(()=>{
function create(svg,commands){
  const camera=HexSvgCamera.create(svg,()=>commands.viewChanged?.());
  const NS='http://www.w3.org/2000/svg';
  const {HEX,key,axialToWorld,hexPoints,neighbor,rotatedRoads,slotPositions,buildingPosition}=HexMap;
  const {CARD_LIBRARY,TOWERS}=HexData;
  let state;
  const fogLayer=document.createElementNS('http://www.w3.org/2000/svg','g');fogLayer.style.pointerEvents='none';svg.appendChild(fogLayer);let fogRun,fogSize=-1;
  const worldLayer=document.createElementNS('http://www.w3.org/2000/svg','g');
  const objectLayer=document.createElementNS('http://www.w3.org/2000/svg','g');
  svg.appendChild(worldLayer);svg.appendChild(objectLayer);
  const hintLayer=document.createElementNS('http://www.w3.org/2000/svg','g');hintLayer.style.pointerEvents='none';svg.appendChild(hintLayer);
  let scene=worldLayer,objectKey='';
  function render(nextState,placementTargets=[]){
    state=nextState;
    scene=worldLayer;worldLayer.innerHTML='';
    if(fogRun!==state||fogSize!==state.map.size){
      fogRun=state;fogSize=state.map.size;fogLayer.innerHTML='';scene=fogLayer;
      // Original sparse board design: show only empty neighbors of placed tiles.
      const adjacent=new Map();
      for(const tile of state.map.values()) for(let d=0;d<6;d++){
        const n=neighbor(tile.q,tile.r,d);if(!state.map.has(key(n.q,n.r))) adjacent.set(key(n.q,n.r),n);
      }
      for(const position of adjacent.values()){
        const c=axialToWorld(position.q,position.r);drawPoly(c.x,c.y,HEX-2,'#202c25','#34453b',.72);
      }
      scene=worldLayer;
    }
    // Landmarks are independent of placed tiles; they reveal through map expansion.
    for(const landmark of state.landmarks?.values()||[]){
      if(landmark.claimed) continue;const visibility=HexExploration.visibility(state.map,landmark);if(visibility==='hidden') continue;
      const c=axialToWorld(landmark.q,landmark.r);
      drawPoly(c.x,c.y,HEX-2,'#303735','#68716c',.8);
      if(visibility==='clear'&&landmark.prefab){
        const p=landmark.prefab,geometry=HexMap.roadGeometry({q:landmark.q,r:landmark.r,type:p.type,roads:p.roads});
        for(const points of geometry.legs.values()) roadPolyline(points,'#69756b',9);
        for(const slot of slotPositions({q:landmark.q,r:landmark.r,slots:p.slots,rotation:p.rotation})){
          const marker=document.createElementNS(NS,'circle');marker.setAttribute('cx',slot.x);marker.setAttribute('cy',slot.y);marker.setAttribute('r',6);marker.setAttribute('fill','#303735');marker.setAttribute('stroke','#929e91');scene.appendChild(marker);
        }
      }
      const label=text(c.x,c.y+5,visibility==='clear'?(landmark.type==='shrine'?'✦':landmark.type==='boss'?'☠':'◆'):'?',24,'#b7bfba','700');label.style.pointerEvents='none';scene.appendChild(label);
      if(visibility==='clear'){const note=text(c.x,c.y+27,landmark.type==='shrine'?'Shrine · Bonus unbekannt':landmark.type==='boss'?'Wächter · inaktiv':'Schatz +20 · ungesammelt',8,'#b7bfba');note.style.pointerEvents='none';scene.appendChild(note);}
    }

    // Global passes keep all roads below every tower, regardless of tile age.
    for(const tile of state.map.values()) drawTile(tile,'terrain');
    for(const tile of state.map.values()) drawTile(tile,'roads');
    for(const landmark of state.landmarks.values()) if(landmark.status){const c=axialToWorld(landmark.q,landmark.r),label=text(c.x,c.y+35,{ready:'☠ bereit',fighting:'☠ Kampf',defeated:'☠ besiegt',escaped:'☠ entkommen'}[landmark.status],9,'#e8b7b0','700');label.style.pointerEvents='none';scene.appendChild(label);}

    if(state.phase==='place'&&!state.waveRunning&&state.hand.length){
      const id=state.hand[state.selectedCard],card=CARD_LIBRARY[id];
      for(const s of placementTargets){
        const legal=s.legal; const c=axialToWorld(s.q,s.r);
        const placementKey=key(s.q,s.r);
        const preview=document.createElementNS(NS,'g');
        preview.style.pointerEvents='none';
        preview.style.display=state.hoveredPlacement===placementKey?'':'none';
        const outline=drawPoly(c.x,c.y,HEX-4,legal?'rgba(116,180,104,.32)':'rgba(170,80,70,.20)',legal?'#a9dc93':'#ba6b60',1);
        preview.appendChild(outline);
        drawRoadPreview({q:s.q,r:s.r,type:id,roads:rotatedRoads(card,state.rotation)},preview);
        for(const p of slotPositions({q:s.q,r:s.r,slots:card.slots,rotation:state.rotation})){
          const slot=document.createElementNS(NS,'circle');
          slot.setAttribute('cx',p.x);slot.setAttribute('cy',p.y);slot.setAttribute('r',12);
          slot.setAttribute('fill','#314d39');slot.setAttribute('stroke','#f1ddb1');slot.setAttribute('stroke-width',2);
          preview.appendChild(slot);preview.appendChild(text(p.x,p.y+4,'+',14,'#fff','700'));
        }
        if(card.buildingSlots){const p=buildingPosition({q:s.q,r:s.r,rotation:state.rotation}),slot=document.createElementNS(NS,'rect');slot.setAttribute('x',p.x-9);slot.setAttribute('y',p.y-9);slot.setAttribute('width',18);slot.setAttribute('height',18);slot.setAttribute('rx',3);slot.setAttribute('fill','#344c3b');slot.setAttribute('stroke','#f0d795');preview.appendChild(slot);preview.appendChild(text(p.x,p.y+4,'⌂',11,'#fff4c3','700'));}
        const rotateHint=document.createElementNS(NS,'rect');rotateHint.setAttribute('x',c.x-32);rotateHint.setAttribute('y',c.y+HEX+2);rotateHint.setAttribute('width',64);rotateHint.setAttribute('height',20);rotateHint.setAttribute('rx',6);rotateHint.setAttribute('fill','#17271e');rotateHint.setAttribute('stroke','#718a6c');rotateHint.setAttribute('fill-opacity','.95');preview.appendChild(rotateHint);
        preview.appendChild(text(c.x,c.y+HEX+16,'R · Drehen',10,'#eee1c2','600'));
        scene.appendChild(preview);
        // Invisible full-hex hit area; only the hovered position shows a preview.
        const hit=document.createElementNS(NS,'polygon');
        hit.setAttribute('points',hexPoints(c.x,c.y,HEX-2));
        hit.setAttribute('fill','transparent');
        hit.style.cursor=legal?'pointer':'not-allowed';
        hit.addEventListener('pointerenter',()=>{commands.hoverPlacement(placementKey);preview.style.display='';});
        hit.addEventListener('pointerleave',()=>{commands.leavePlacement(placementKey);preview.style.display='none';});
        hit.addEventListener('click',()=>commands.placeTile(s.q,s.r));
        scene.appendChild(hit);
      }
    }

    drawFreezeAuras();drawSelectedRange();
    hintLayer.innerHTML='';scene=hintLayer;drawUpgradeHints();scene=worldLayer;
    for(const e of state.enemies) drawEnemy(e);
    for(const p of state.projectiles) drawProjectile(p);
    const nextObjectKey=JSON.stringify([[...state.map.values()].map(t=>[t.q,t.r,t.rotation,t.slots,t.income,t.buildings,t.towers.map(tw=>[tw?.type,tw?.branch,tw?.finalUpgrade])]),state.selectedSlot,state.selectedBuilding]);
    if(nextObjectKey!==objectKey){
      objectKey=nextObjectKey;objectLayer.innerHTML='';scene=objectLayer;
      for(const tile of state.map.values()) drawTile(tile,'objects');
      scene=worldLayer;
    }
  }

  function roadPolyline(points,color,width,parent=scene,dashed=false){
    const path=document.createElementNS(NS,'polyline');
    path.setAttribute('points',points.map(p=>p.x+','+p.y).join(' '));path.setAttribute('fill','none');
    path.setAttribute('stroke',color);path.setAttribute('stroke-width',width);path.setAttribute('stroke-linejoin','round');
    if(dashed) path.setAttribute('stroke-dasharray','6 5');path.style.pointerEvents='none';parent.appendChild(path);
  }
  function drawRoadPreview(tile,parent){
    for(const points of HexMap.roadGeometry(tile).legs.values()) roadPolyline(points,'rgba(238,209,154,.88)',12,parent,true);
  }

  function drawFreezeAuras(){
    for(const tile of state.map.values()) (tile.towers||[]).forEach((tower,index)=>{
      if(!tower) return;const def=HexData.towerDefinition(tower);if(!def.aura) return;
      const p=slotPositions(tile)[index],circle=document.createElementNS(NS,'circle');
      circle.setAttribute('cx',p.x);circle.setAttribute('cy',p.y);circle.setAttribute('r',def.range);
      circle.setAttribute('fill',def.color);circle.setAttribute('fill-opacity','.045');circle.setAttribute('stroke',def.color);circle.setAttribute('stroke-opacity','.18');circle.setAttribute('stroke-width',1);
      circle.style.pointerEvents='none';scene.appendChild(circle);
    });
  }
  function drawUpgradeHints(){
    if(!['build','wave'].includes(state.phase)||state.hp<=0) return;
    for(const tile of state.map.values()) (tile.towers||[]).forEach((tower,index)=>{
      if(!tower||!HexData.availableUpgrades(tower).some(([,upgrade])=>state.gold>=HexBuildings.cost(state,tile,upgrade.cost))) return;
      const p=slotPositions(tile)[index],hint=text(p.x+12,p.y-8,'↑',13,'#ffe39a','800');hint.setAttribute('stroke','#172019');hint.setAttribute('stroke-width',1.5);hint.setAttribute('paint-order','stroke');hint.style.pointerEvents='none';scene.appendChild(hint);
    });
  }
  function drawSelectedRange(){
    const selected=state.selectedTower||(state.previewTower?state.selectedSlot:null);if(!selected) return;
    const tile=state.map.get(key(selected.q,selected.r)),tw=tile?.towers[selected.index];
    const type=tw?.type||state.previewTower;if(!tile||!type) return;
    const p=slotPositions(tile)[selected.index],def=HexData.towerDefinition(tw||{type,tileType:tile.type});
    const circle=document.createElementNS(NS,'circle');
    circle.setAttribute('cx',p.x);circle.setAttribute('cy',p.y);circle.setAttribute('r',def.range);
    circle.setAttribute('fill',def.color);circle.setAttribute('fill-opacity','.13');
    circle.setAttribute('stroke',def.color);circle.setAttribute('stroke-opacity','.65');circle.setAttribute('stroke-width',2);
    circle.style.pointerEvents='none';scene.appendChild(circle);
  }

  function drawTile(tile,layer){
    const c=axialToWorld(tile.q,tile.r);
    if(layer==='terrain'){drawPoly(c.x,c.y,HEX-2,({base:'#657264',highGround:'#8d8472',grove:'#3f754e',treasury:'#998454',battlefield:'#7b6556',watchtower:'#667c81',citadel:'#8d8058',royalVillage:'#977b52',warCross:'#855f58'})[tile.type]||'#688653','#2e4334',1);return;}
    if(layer==='roads'){
      const geometry=HexMap.roadGeometry(tile);
      for(const points of geometry.legs.values()) roadPolyline(points,'#d0aa6d',18);
      for(const points of geometry.legs.values()) roadPolyline(points,'#ead19a',3,scene,true);
      return;
    }
    if(tile.type==='base'){
      const g=document.createElementNS(NS,'g');
      const base=document.createElementNS(NS,'rect');base.setAttribute('x',c.x-25);base.setAttribute('y',c.y-27);base.setAttribute('width',50);base.setAttribute('height',54);base.setAttribute('rx',8);base.setAttribute('fill','#d8d2c1');base.setAttribute('stroke','#514d44');base.setAttribute('stroke-width',4);g.appendChild(base);
      const txt=text(c.x,c.y+5,'BASE',13,'#282723','700');g.appendChild(txt);scene.appendChild(g);
    }
    if(tile.income){const t=text(c.x,c.y+44,'+'+tile.income+' Gold',10,'#fff4c3','700');t.style.pointerEvents='none';scene.appendChild(t);}
    const terrain=CARD_LIBRARY[tile.type],bonus=terrain?.towerRange?'+'+Math.round((terrain.towerRange-1)*100)+' % Reichweite':terrain?.towerDamage?'+'+Math.round((terrain.towerDamage-1)*100)+' % Schaden':terrain?.archerDamage?'+25 % Archer':null;
    if(bonus){const label=text(c.x,c.y+35,bonus,9,'#fff4c3','700');label.style.pointerEvents='none';scene.appendChild(label);}
    const slots=slotPositions(tile);
    for(let i=0;i<(tile.buildingSlots||0);i++){
      const p=buildingPosition(tile),building=tile.buildings?.[i],slot=document.createElementNS(NS,'rect');
      slot.setAttribute('x',p.x-9);slot.setAttribute('y',p.y-9);slot.setAttribute('width',18);slot.setAttribute('height',18);slot.setAttribute('rx',3);slot.setAttribute('fill',building?'#bc914d':'#344c3b');slot.setAttribute('stroke','#f0d795');slot.style.cursor='pointer';
      slot.addEventListener('click',e=>{e.stopPropagation();commands.selectBuilding(tile.q,tile.r,i);});scene.appendChild(slot);
      const label=text(p.x,p.y+4,building?HexBuildings.definitions[building.type].icon:'⌂',11,'#fff4c3','700');label.style.pointerEvents='none';scene.appendChild(label);
    }
    slots.forEach((p,i)=>{
      const tw=tile.towers[i];
      if(tw){drawTower(p,tw,tile,i);} else {
        const selected=state.selectedSlot&&state.selectedSlot.q===tile.q&&state.selectedSlot.r===tile.r&&state.selectedSlot.index===i;
        const circ=document.createElementNS(NS,'circle');circ.setAttribute('cx',p.x);circ.setAttribute('cy',p.y);circ.setAttribute('r',12);circ.setAttribute('fill',selected?'#f4d36d':'#314d39');circ.setAttribute('stroke','#f1ddb1');circ.setAttribute('stroke-width',2);circ.style.cursor='pointer';circ.addEventListener('click',()=>commands.selectSlot(tile.q,tile.r,i));scene.appendChild(circ);
        const plus=text(p.x,p.y+4,'+',14,'#fff','700');plus.style.pointerEvents='none';scene.appendChild(plus);
      }
    });
  }

  function drawTower(p,tw,tile,index){
    const def=HexData.towerDefinition(tw); const g=document.createElementNS(NS,'g');
    g.style.cursor='pointer';
    g.addEventListener('click',e=>{
      e.stopPropagation();
      commands.selectTower(tile.q,tile.r,index);
    });
    const base=document.createElementNS(NS,'circle');base.setAttribute('cx',p.x);base.setAttribute('cy',p.y);base.setAttribute('r',14);base.setAttribute('fill','#202821');base.setAttribute('stroke',def.color);base.setAttribute('stroke-width',3);g.appendChild(base);
    const visual=HexData.BRANCH_VISUALS[tw.branch],icon=visual?.icon||(tw.type==='archer'?'A':tw.type==='catapult'?'K':tw.type==='freeze'?'❄':'⚡');
    if(visual){base.setAttribute('stroke',visual.color);const ring=document.createElementNS(NS,'circle');ring.setAttribute('cx',p.x);ring.setAttribute('cy',p.y);ring.setAttribute('r',17);ring.setAttribute('fill','none');ring.setAttribute('stroke',tw.finalUpgrade?'#ffe39a':visual.color);ring.setAttribute('stroke-width',1.5);g.appendChild(ring);}
    const tx=text(p.x,p.y+5,icon,14,visual?.color||def.color,'800');g.appendChild(tx);
    if(tw.branch){const badge=document.createElementNS(NS,'circle');badge.setAttribute('cx',p.x+11);badge.setAttribute('cy',p.y+12);badge.setAttribute('r',6);badge.setAttribute('fill','#172019');badge.setAttribute('stroke',visual.color);g.appendChild(badge);g.appendChild(text(p.x+11,p.y+15,String(tw.level),8,'#fff','700'));}
    const title=document.createElementNS(NS,'title');title.textContent=`${def.name} · Stufe ${tw.level}${tw.branch?' · '+HexData.UPGRADES[tw.branch].name:''}`;g.appendChild(title);scene.appendChild(g);
  }

  function drawEnemy(e){
    const g=document.createElementNS(NS,'g');
    const c=document.createElementNS(NS,'circle');c.setAttribute('cx',e.x);c.setAttribute('cy',e.y);c.setAttribute('r',e.type==='boss'?15:9);c.setAttribute('fill',e.slowFactor<1?'#79cdd9':e.type==='boss'?'#934f9e':e.type==='armored'?'#78818c':e.type==='swarm'?'#b87832':'#8d3c34');c.setAttribute('stroke','#26120f');c.setAttribute('stroke-width',2);g.appendChild(c);
    const w=24,h=4; const bg=document.createElementNS(NS,'rect');bg.setAttribute('x',e.x-w/2);bg.setAttribute('y',e.y-17);bg.setAttribute('width',w);bg.setAttribute('height',h);bg.setAttribute('fill','#321a18');g.appendChild(bg);
    const hp=document.createElementNS(NS,'rect');hp.setAttribute('x',e.x-w/2);hp.setAttribute('y',e.y-17);hp.setAttribute('width',w*Math.max(0,e.hp/e.maxHp));hp.setAttribute('height',h);hp.setAttribute('fill','#78b95f');g.appendChild(hp);scene.appendChild(g);
  }

  function drawProjectile(p){
    if(p.kind==='chain'){
      for(let i=0;i<p.pts.length-1;i++){const l=line(p.pts[i].x,p.pts[i].y,p.pts[i+1].x,p.pts[i+1].y,p.color,3);scene.appendChild(l);}
    }else scene.appendChild(line(p.x1,p.y1,p.x2,p.y2,p.color,3));
  }
  function line(x1,y1,x2,y2,stroke,w){const l=document.createElementNS(NS,'line');l.setAttribute('x1',x1);l.setAttribute('y1',y1);l.setAttribute('x2',x2);l.setAttribute('y2',y2);l.setAttribute('stroke',stroke);l.setAttribute('stroke-width',w);l.setAttribute('stroke-linecap','round');return l;}
  function drawPoly(cx,cy,size,fill,stroke,opacity=1){const p=document.createElementNS(NS,'polygon');p.setAttribute('points',hexPoints(cx,cy,size));p.setAttribute('fill',fill);p.setAttribute('stroke',stroke);p.setAttribute('stroke-width',2);p.setAttribute('opacity',opacity);scene.appendChild(p);return p;}
  function text(x,y,str,size,fill,weight='400'){const t=document.createElementNS(NS,'text');t.setAttribute('x',x);t.setAttribute('y',y);t.setAttribute('text-anchor','middle');t.setAttribute('font-size',size);t.setAttribute('font-family','Inter,system-ui,sans-serif');t.setAttribute('font-weight',weight);t.setAttribute('fill',fill);t.textContent=str;return t;}

  function reset(){objectKey='';fogRun=null;fogSize=-1;camera.reset(false);}
  function project(position){return camera.project(position);}
  function clearSelection(){commands.clearSelection();}
  svg.addEventListener('click',clearSelection);
  return {render,reset,project,zoom:camera.zoom,resetView:camera.reset,getView:camera.getView,destroy(){camera.destroy();svg.removeEventListener('click',clearSelection);for(const layer of [fogLayer,worldLayer,objectLayer,hintLayer]) layer.remove();}};
}
return {create};
})();

