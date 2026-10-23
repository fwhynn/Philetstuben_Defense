const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game.cjs');
test('wave completion cancels remote building targeting before placement, rewards and victory',()=>{
  for(const type of ['forge','market'])for(const wave of [1,2,35]){
    const {a,elements}=load();const slot={q:1,r:0,index:0};
    // This fixture tests menu targeting, not randomly generated landmark occupancy.
    a.state.landmarks.clear();
    a.state.map.set('1,0',{q:1,r:0,type:'village',roads:[0,3],slots:1,towers:[],buildings:[{type,special:true,target:'0,0'}]});
    Object.assign(a.state,{wave,phase:'wave',waveRunning:true,pendingSpawns:0,enemies:[],buildingTarget:slot,selectedBuilding:slot,previewBuilding:slot,hoverBuilding:slot});
    elements.get('message').textContent='Zusatzwirkung: ein erkundetes Hex anklicken';elements.get('message').classList.add('show');
    a.endWave();
    for(const key of ['buildingTarget','selectedBuilding','previewBuilding','hoverBuilding'])assert.equal(a.state[key],null,type+' '+wave+' '+key);
    assert.equal(a.state.map.get('1,0').buildings[0].target,'0,0','already assigned target remains');
    assert.equal(elements.get('buildingPanel').classList.contains('hidden'),true);
    if(wave===1){a.state.hand=['straight'];a.state.selectedCard=0;a.state.rotation=0;const before=a.state.map.size;a.placeTile(2,0);assert.equal(a.state.map.size,before+1,'click places a card, not a remote target');}
  }
});
