const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs');

function options(a){
  const result=[];
  for(const direction of a.state.baseExits){const n=a.neighbor(0,0,direction);
    a.state.hand.forEach((id,index)=>{for(let rotation=0;rotation<6;rotation++)if(a.canPlace(n.q,n.r,a.CARD_LIBRARY[id],rotation))result.push({...n,index,rotation});});
  }
  return result;
}
function place(a,option){a.state.selectedCard=option.index;a.state.rotation=option.rotation;a.placeTile(option.q,option.r);}

test('all random exit pairs allow two mandatory opening placements without losing deck copies',()=>{
  const {a,elements}=load({initialProfile:{difficulty:'dual'}}),pairs=new Set();
  for(let seed=0;seed<100;seed++){
    elements.get('runSeed').value='dual-'+seed;a.newRun();
    const exits=Array.from(a.state.baseExits);assert.equal(new Set(exits).size,2);pairs.add(exits.join(','));
    assert.equal(a.state.hand.length,5);assert.equal(a.state.openingRemaining,2);
    const first=options(a);assert.ok(first.length>0);place(a,first[seed%first.length]);
    assert.equal(a.state.phase,'place');assert.equal(a.state.hand.length,4);assert.equal(a.state.openingRemaining,1);
    a.startWave();assert.equal(a.state.wave,0);
    const second=options(a);assert.ok(second.length>0);place(a,second[seed%second.length]);
    assert.equal(a.state.phase,'build');assert.equal(a.state.openingRemaining,0);assert.equal(a.state.map.size,3);
    assert.equal(a.state.hand.length,0);assert.equal(a.state.discard.length,5);assert.equal(a.state.drawPile.length,0);
    assert.ok(a.spawnSources().length>=1);a.startWave();assert.equal(a.state.wave,1);
    a.state.enemies=[];a.state.pendingSpawns=0;a.state.spawnQueue=[];a.endWave();assert.equal(a.state.hand.length,3);
  }
  assert.equal(pairs.size,15);
});

test('difficulty persists from preparation, retry retains it, and a seed repeats exits',()=>{
  const {a,elements,storage}=load();elements.get('newRunBtn').listeners.click();
  elements.get('difficultyChoices').children[1].listeners.click();elements.get('runSeed').value='same';
  elements.get('confirmLoadoutBtn').listeners.click();
  assert.equal(a.state.difficulty,'dual');assert.equal(JSON.parse(storage.get('hex-bastion-profile-v1')).difficulty,'dual');
  const exits=Array.from(a.state.baseExits);elements.get('retryLoadoutBtn').listeners.click();assert.deepEqual(Array.from(a.state.baseExits),exits);
  elements.get('newRunBtn').listeners.click();elements.get('difficultyChoices').children[0].listeners.click();elements.get('confirmLoadoutBtn').listeners.click();
  assert.equal(a.state.difficulty,'normal');assert.equal(a.state.hand.length,3);assert.equal(a.state.baseExits.length,1);
});
