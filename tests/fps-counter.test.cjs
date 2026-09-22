const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs');
test('Ctrl+F toggles FPS without changing speed, opening browser search or repeating',()=>{
  const {elements,documentListeners,a}=load();const label=elements.get('fpsCounter');let prevented=0;
  const event={key:'f',ctrlKey:true,preventDefault(){prevented++;},target:{id:'doubleSpeed',tagName:'INPUT'}};
  const speed=elements.get('doubleSpeed').value;
  documentListeners.keydown(event);assert.equal(label.classList.contains('hidden'),false);assert.equal(prevented,1);
  documentListeners.keydown({...event,repeat:true});assert.equal(label.classList.contains('hidden'),false);
  a.state.phase='victory';documentListeners.keydown(event);assert.equal(label.classList.contains('hidden'),true);
  assert.equal(elements.get('doubleSpeed').value,speed);
});
test('FPS uses rendered frames, refreshes every half second and resets across hidden tabs',()=>{
  let frames=10;const {a,elements,documentListeners,document}=load({getRenderedFrameCount:()=>frames});
  const label=elements.get('fpsCounter');documentListeners.keydown({key:'F',ctrlKey:true,preventDefault(){}});
  a.updateFps(1000);frames=25;a.updateFps(1250);assert.equal(label.textContent,'FPS: —');
  a.updateFps(1500);assert.equal(label.textContent,'FPS: 30');
  frames=55;a.updateFps(2000);assert.equal(label.textContent,'FPS: 60');
  document.hidden=true;documentListeners.visibilitychange();assert.equal(label.textContent,'FPS: —');
  document.hidden=false;documentListeners.visibilitychange();a.updateFps(12000);frames=70;a.updateFps(12500);assert.equal(label.textContent,'FPS: 30');
  documentListeners.keydown({key:'f',ctrlKey:true,preventDefault(){}});frames=100;a.updateFps(13000);assert.equal(label.classList.contains('hidden'),true);assert.equal(label.textContent,'FPS: —');
});
