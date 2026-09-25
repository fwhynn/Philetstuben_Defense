/* DOM-free progression shared by Solo and the forthcoming two-board session. */
const HexRunSession=(()=>{
  function preparation(state,random){
    if(state.duoDeliveryPending){state.phase='duoDelivery';return;}
    state.phase='place';state.drawResult=HexRunFlow.drawHand(state,random);promoteCelebration(state);
  }
  function promoteCelebration(state){
    if(!state.pendingCelebration||!['place','build'].includes(state.phase)||state.bossRewards.length)return;
    state.activeCelebration=state.pendingCelebration;state.pendingCelebration=null;state.celebrationActive=true;
  }
  function acknowledge(state){if(!state.celebrationActive)return false;state.celebrationActive=false;state.activeCelebration=null;return true;}
  function celebrate(state,best=0){
    state.celebratedWaves??=[];if(state.celebratedWaves.includes(state.wave))return;
    state.celebratedWaves.push(state.wave);const messages=[];
    if(state.bossRewards.length)messages.push(state.bossRewards.length===1?'Wächter besiegt!':state.bossRewards.length+' Wächter besiegt!');
    if(state.wave>0&&(state.wave%10===0||state.wave===15))messages.push('Wave '+state.wave+' geschafft!');
    if(best>0&&state.wave>best&&!state.recordCelebrated){state.recordCelebrated=true;messages.push('Neuer persönlicher Rekord – Wave '+state.wave+' überlebt!');}
    if(messages.length)state.pendingCelebration={messages,wave:state.wave,bosses:state.bossRewards.length};
  }
  function waveRewards(state,random){
    if(state.challengeKind==='garrison'){state.bossRewards=[];preparation(state,random);return;}
    if(state.bossRewards.length){state.phase='bossReward';HexRewards.offer(state,'boss',random);}
    else if(state.wave%2===0){state.phase='reward';HexRewards.offer(state,'normal',random);}
    else preparation(state,random);
  }
  function shrine(state,random){
    state.removalSource='shrine';const effect=HexExploration.shrineEffect(state.landmarks,state.pendingShrine);
    state.phase=effect==='remove'?'removal':'shrineReward';HexRewards.offer(state,effect==='remove'?'removal':'shrine',random);
  }
  function choose(state,random,id,index){
    const offer=state.rewardOffer;if(!HexRewards.choose(state,id,index))return false;
    if(offer.kind==='boss'){state.bossRewards.shift();waveRewards(state,random);}
    else if(offer.kind==='normal'&&state.wave>0&&state.wave%6===0){state.removalSource='reward';state.phase='removal';HexRewards.offer(state,'removal',random);}
    else if(offer.kind==='shrine'||offer.kind==='removal'&&state.removalSource==='shrine'){
      state.pendingShrine=state.shrineQueue?.shift()||null;state.removalSource=null;
      if(state.pendingShrine)shrine(state,random);else state.phase='build';
    }else preparation(state,random);
    return true;
  }
  function finish(state,random,best=0){
    const result=HexRunFlow.finish(state);if(!result)return null;
    if(!result.victory&&!state.challengeDay&&!state.duoMode&&state.wave===35&&!state.campaignWon){state.campaignWon=true;state.phase='victory';return {...result,campaignVictory:true};}
    if(!result.victory){celebrate(state,best);waveRewards(state,random);}return result;
  }
  function place(state,random,command){
    const result=HexPlacementCommands.place(state,command);if(result&&!result.opening&&state.pendingShrine)shrine(state,random);return result;
  }
  function create(options){const run=HexRunRuntime.create(options);run.state.drawPile=HexRunFlow.shuffle(run.state.deck,run.random);preparation(run.state,run.random);return run;}
  function advance(state,random,dt,best=0,emit=()=>{}){
    const result=HexRunRuntime.advance(state,random,dt,emit);
    if(result==='complete')finish(state,random,best);
    else if(result==='defeat'){HexCombat.clearConsumables(state);state.hp=0;state.waveRunning=false;state.phase='gameover';state.enemies=[];state.projectiles=[];state.spawnQueue=[];state.pendingSpawns=0;}
    return result;
  }
  function endless(state,random){if(state.phase!=='victory'||!(state.campaignWon||state.challengeDay&&state.challengeWon))return false;state.endless=true;waveRewards(state,random);return true;}
  return {endless,create,place,choose,finish,advance,preparation,waveRewards,shrine,promoteCelebration,acknowledge};
})();
