// Test-only pre-optimization targeting predicate for repeatable A/B comparisons.
'use strict';
module.exports=function reference(source){
 source=source.replace('poolMax(0,poolNumber(e[name])||0)','Math.max(0,Number(e[name])||0)');
 for(const def of ['def','ref.def']){
  const next=`e.alive&&withinMineRadius(e,ref.pos,${def}.range)&&durability(e)>0&&!hiddenBySpores(state,e)&&(!e.immunity||e.immunity!==${def}.damageType)`;
  const old=`e.alive&&durability(e)>0&&!hiddenBySpores(state,e)&&(!e.immunity||e.immunity!==${def}.damageType)&&Math.hypot(e.x-ref.pos.x,e.y-ref.pos.y)<=${def}.range`;
  if(!source.includes(next))throw Error('Reference predicate no longer matches combat implementation');
  source=source.replace(next,old);
 }
 return source;
};
