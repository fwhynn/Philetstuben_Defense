const HexRandom=(()=>{
  function create(seed){
    let value=2166136261;
    for(const character of String(seed)){
      value^=character.charCodeAt(0);value=Math.imul(value,16777619);
    }
    return fromState(value>>>0);
  }
  function fromState(initial){
    let value=initial;
    const next=()=>{
      value=(value+0x6D2B79F5)|0;
      let result=Math.imul(value^(value>>>15),1|value);
      result^=result+Math.imul(result^(result>>>7),61|result);
      return ((result^(result>>>14))>>>0)/4294967296;
    };
    next.snapshot=()=>({version:1,value:value>>>0});
    return next;
  }
  function restore(snapshot){
    if(snapshot?.version!==1||!Number.isInteger(snapshot.value)||snapshot.value<0||snapshot.value>0xffffffff)throw new Error('Invalid random state');
    return fromState(snapshot.value);
  }
  function freshSeed(){
    if(typeof crypto!=='undefined'&&crypto.getRandomValues){
      return crypto.getRandomValues(new Uint32Array(2)).join('-');
    }
    return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
  }
  return {create,restore,freshSeed};
})();
