// Original expression, retained for exact combat comparison.
module.exports="state.enemies.filter(e=>e.alive&&durability(e)>0&&!hit.includes(e)&&Math.hypot(e.x-last.x,e.y-last.y)<=def.jumpRange).sort((a,b)=>Math.hypot(a.x-last.x,a.y-last.y)-Math.hypot(b.x-last.x,b.y-last.y))[0]";
