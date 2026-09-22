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
  function fit(area,width,height,x,y){
    width=Math.min(width,Math.max(0,area.right-area.left));height=Math.min(height,Math.max(0,area.bottom-area.top));
    return {x:Math.max(area.left,Math.min(x,area.right-width)),y:Math.max(area.top,Math.min(y,area.bottom-height)),width,height};
  }
  const dropRadius=20;
  function pickScreenSlot(slots,x,y,width,height){
    if(x<0||y<0||x>width||y>height)return null;
    let best=null,distance=Infinity;
    for(const slot of slots){const d=Math.hypot(slot.x-x,slot.y-y);if(d<=dropRadius&&d<distance){best=slot;distance=d;}}
    return best?{q:best.q,r:best.r,index:best.index}:null;
  }
  return {safeArea,fit,dropRadius,pickScreenSlot};
})();
