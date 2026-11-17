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
  a.advanceClock(5000);assert.ok(Math.abs(a.state.elapsedMs-10000)<51);
  a.advanceClock(35000);const partial=a.state.elapsedMs;assert.ok(partial<70000);
  for(let i=0;i<6;i++)a.advanceClock(35000);assert.ok(Math.abs(a.state.elapsedMs-70000)<51);
  elements.get('pauseBtn').listeners.click();const paused=a.state.elapsedMs;a.advanceClock(40000);assert.equal(a.state.elapsedMs,paused);
});

test('displayed 1× through 8× scale from two simulation seconds per real second',()=>{
  for(let speed=1;speed<=8;speed++){
    const {a,elements}=load();const slider=elements.get('doubleSpeed');slider.value=String(speed);slider.listeners.input();
    a.state.waveRunning=true;a.state.pendingSpawns=1;a.advanceClock(500);
    assert.ok(Math.abs(a.state.elapsedMs-1000*speed)<51,`speed ${speed}: ${a.state.elapsedMs}`);
    assert.equal(elements.get('speedValue').textContent,speed+'×');
  }
});


test('hidden Solo tabs pause and resume without accumulating catch-up time at every speed',()=>{
 for(const speed of [1,4,8]){
  let now=0;const {a,elements,document,documentListeners}=load({now:()=>now});elements.get('doubleSpeed').value=String(speed);elements.get('doubleSpeed').listeners.input();a.state.waveRunning=true;a.state.pendingSpawns=1;
  now=100;a.advanceClock(now);const before=a.state.elapsedMs;
  document.hidden=true;documentListeners.visibilitychange();now=60000;a.advanceClock(now);assert.equal(a.state.elapsedMs,before);
  document.hidden=false;documentListeners.visibilitychange();a.advanceClock(now);assert.equal(a.state.elapsedMs,before);
  now+=100;a.advanceClock(now);assert.ok(Math.abs(a.state.elapsedMs-before-200*speed)<51);
 }
});
