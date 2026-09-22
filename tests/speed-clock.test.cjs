const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs');
test('eightfold speed is saved, clamped and F cycles through every speed and wraps to normal',()=>{
  const {a,elements,storage,documentListeners}=load();const slider=elements.get('doubleSpeed');
  slider.value='8';slider.listeners.input();assert.equal(storage.get('gameSpeed'),'8');
  a.state.waveRunning=true;a.state.pendingSpawns=1;a.update(.05,0);assert.equal(a.state.elapsedMs,400);
  documentListeners.keydown({key:'f'});assert.equal(slider.value,'1');
  for(let n=2;n<=8;n++){documentListeners.keydown({key:'f',target:{id:'doubleSpeed',tagName:'INPUT'},preventDefault(){}});assert.equal(slider.value,String(n));}
  documentListeners.keydown({key:'f',repeat:true});assert.equal(slider.value,'8');
  documentListeners.keydown({key:'f'});assert.equal(slider.value,'1');
  slider.value='99';slider.listeners.input();assert.equal(slider.value,'8');
});
test('elapsed time survives delayed callbacks and is processed in bounded steps; manual pause stops it',()=>{
  const {a,elements}=load();a.state.waveRunning=true;a.state.pendingSpawns=1;
  a.advanceClock(5000);assert.ok(Math.abs(a.state.elapsedMs-5000)<51);
  a.advanceClock(35000);const partial=a.state.elapsedMs;assert.ok(partial<35000);
  for(let i=0;i<4;i++)a.advanceClock(35000);assert.ok(Math.abs(a.state.elapsedMs-35000)<51);
  elements.get('pauseBtn').listeners.click();const paused=a.state.elapsedMs;a.advanceClock(40000);assert.equal(a.state.elapsedMs,paused);
});
