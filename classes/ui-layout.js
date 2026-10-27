const HexUiLayout=(()=>{
  // Reserve full-width strips occupied by essential controls. Menus may scroll
  // within the remaining band, but must never extend behind those controls.
  function safeArea(width,height,controls,gap=12){
    let top=gap,bottom=height-gap;
    for(const r of controls){if(r.width<=0||r.height<=0)continue;
      if((r.top+r.bottom)/2<height/2)top=Math.max(top,r.bottom+gap);
      else bottom=Math.min(bottom,r.top-gap);
    }
    return {left:gap,top,right:width-gap,bottom:Math.max(top,bottom)};
  }
  // Side panels only reserve controls that actually overlap their column.
  function columnArea(width,height,controls,left=12,panelWidth=440,gap=12){
    const right=Math.min(width-gap,left+panelWidth);
    return {...safeArea(width,height,controls.filter(r=>r.right>left&&r.left<right),gap),left,right};
  }
  function fit(area,width,height,x=area.left,y=area.top){
    width=Math.min(width,Math.max(0,area.right-area.left));height=Math.min(height,Math.max(0,area.bottom-area.top));
    return {x:Math.max(area.left,Math.min(x,area.right-width)),y:Math.max(area.top,Math.min(y,area.bottom-height)),width,height};
  }
  // Short landscape screens need a free rectangle beside the hand, not a
  // full-width band that disappears as soon as top/bottom controls meet.
  function freeArea(width,height,controls,gap=12){
    let areas=[{left:gap,top:gap,right:width-gap,bottom:height-gap}];
    for(const box of controls){if(box.width<=0||box.height<=0)continue;
      const b={left:box.left-gap,right:box.right+gap,top:box.top-gap,bottom:box.bottom+gap};
      areas=areas.flatMap(a=>{
        if(b.right<=a.left||b.left>=a.right||b.bottom<=a.top||b.top>=a.bottom)return [a];
        return [{...a,right:Math.min(a.right,b.left)},{...a,left:Math.max(a.left,b.right)},{...a,bottom:Math.min(a.bottom,b.top)},{...a,top:Math.max(a.top,b.bottom)}].filter(r=>r.right-r.left>=120&&r.bottom-r.top>=44);
      });
    }
    return areas.sort((a,b)=>(b.right-b.left)*(b.bottom-b.top)-(a.right-a.left)*(a.bottom-a.top))[0]||safeArea(width,height,controls,gap);
  }
  const dropRadius=20;
  function pickScreenSlot(slots,x,y,width,height){
    if(x<0||y<0||x>width||y>height)return null;
    let best=null,distance=Infinity;
    for(const slot of slots){const d=Math.hypot(slot.x-x,slot.y-y);if(d<=dropRadius&&d<distance){best=slot;distance=d;}}
    return best?{q:best.q,r:best.r,index:best.index}:null;
  }
  return {safeArea,columnArea,freeArea,fit,dropRadius,pickScreenSlot};
})();
// Einheitliche Oberflächengröße am Desktop: 0,95 × (Bildschirm / 1920 × 1080), begrenzt auf 0,775–1,9, als --hx-k.
// hexwerk.css skaliert damit HUD, Turmfenster und Fenster gleichmäßig (zoom); kompakte Ansichten bleiben bei 1.
(function applyUiScale(){
  const root=globalThis.document?.documentElement;
  if(!root?.style?.setProperty||typeof globalThis.matchMedia!=='function')return;
  const desktop=globalThis.matchMedia('(min-width:1101px) and (min-height:601px)');
  const apply=()=>{const k=desktop.matches?Math.max(.775,Math.min(1.9,.95*Math.min(globalThis.innerWidth/1920,globalThis.innerHeight/1080))):1;root.style.setProperty('--hx-k',String(Math.round(k*1000)/1000));};
  apply();globalThis.addEventListener?.('resize',apply);desktop.addEventListener?.('change',apply);
})();
