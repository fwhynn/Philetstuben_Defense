/* World-space camera model, independent of DOM and SVG. */
const HexCamera=(()=>{
  function create({initial={x:-545,y:-375,w:1100,h:760},minWidth=330,maxWidth=11000}={}){
    let view={...initial};
    return {getView(){return {...view};},reset(){view={...initial};return {...view};},pan(dx,dy){view={...view,x:view.x+dx,y:view.y+dy};return {...view};},zoom(factor,anchor={x:view.x+view.w/2,y:view.y+view.h/2}){
      if(!Number.isFinite(factor)||factor<=0) return {...view};
      const width=Math.max(minWidth,Math.min(maxWidth,view.w*factor)),ratio=width/view.w;
      view={x:anchor.x+(view.x-anchor.x)*ratio,y:anchor.y+(view.y-anchor.y)*ratio,w:width,h:view.h*ratio};return {...view};
    }};
  }
  return {create};
})();
/* SVG input/projection adapter. A future 3D camera replaces this adapter. */
const HexSvgCamera=(()=>{
  function create(board,onChange=()=>{},rotatePlacement=()=>false){
    const model=HexCamera.create(),listeners=[];let drag=null;
    function apply(notify=true){const view=model.getView();board.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`);if(notify) onChange();}
    function listen(name,callback,options){board.addEventListener(name,callback,options);listeners.push([name,callback,options]);}
    function point(event){const matrix=board.getScreenCTM?.();if(!matrix||!board.createSVGPoint) return null;const p=board.createSVGPoint();p.x=event.clientX;p.y=event.clientY;return p.matrixTransform(matrix.inverse());}
    function zoom(factor,anchor){model.zoom(factor,anchor);apply();}
    function stop(){drag=null;board.style.cursor='';}
    listen('wheel',event=>{event.preventDefault();const anchor=point(event);if(anchor) zoom(Math.exp(Math.max(-200,Math.min(200,event.deltaY))*.0015),anchor);},{passive:false});
    listen('contextmenu',event=>event.preventDefault());
    listen('auxclick',event=>{if(event.button===1)event.preventDefault();});
    listen('pointerdown',event=>{if(event.button===1&&rotatePlacement()){event.preventDefault();return;}if(event.button!==2&&event.button!==1) return;const position=point(event);if(!position) return;event.preventDefault();drag={id:event.pointerId,point:position};board.setPointerCapture(event.pointerId);board.style.cursor='grabbing';});
    listen('pointermove',event=>{if(!drag||drag.id!==event.pointerId) return;const position=point(event);if(!position) return;model.pan(drag.point.x-position.x,drag.point.y-position.y);apply();});
    for(const name of ['pointerup','pointercancel','lostpointercapture']) listen(name,stop);
    function project(position){const matrix=board.getScreenCTM?.();if(!matrix||!board.createSVGPoint) return null;const point=board.createSVGPoint();point.x=position.x;point.y=position.y;const screen=point.matrixTransform(matrix),wrap=board.parentElement.getBoundingClientRect();return {x:screen.x-wrap.left,y:screen.y-wrap.top,width:wrap.width,height:wrap.height};}
    apply(false);
    return {zoom,project,panView(x,y){const view=model.getView();model.pan(x*view.w*.65,y*view.h*.65);apply();},getView:model.getView,reset(notify=true){stop();model.reset();apply(notify);},destroy(){stop();for(const [name,callback,options] of listeners) board.removeEventListener(name,callback,options);}};
  }
  return {create};
})();
