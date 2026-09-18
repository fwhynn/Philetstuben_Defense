/* Local synthesized effects; no downloads or server required. */
const HexAudio=(()=>{
  let context,master,voices=0;
  const recent=new Map();
  const toggle=document.getElementById('soundEnabled');
  const volume=document.getElementById('soundVolume');
  function unlock(){
    if(!toggle.checked) return;
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio) return;
      if(!context){context=new Audio();master=context.createGain();master.connect(context.destination);}
      master.gain.value=Number(volume.value)/100;
      if(context.state==='suspended') context.resume().catch(()=>{});
    }catch{/* Audio unavailable: gameplay continues. */}
  }
  document.addEventListener('pointerdown',unlock);
  document.addEventListener('keydown',unlock);
  toggle.addEventListener('change',()=>{if(master) master.gain.value=toggle.checked?Number(volume.value)/100:0;if(toggle.checked) unlock();});
  volume.addEventListener('input',()=>{if(master) master.gain.value=toggle.checked?Number(volume.value)/100:0;});
  const effects={
    archer:[900,230,.09,'triangle',.13],catapult:[150,45,.20,'triangle',.28],
    freeze:[1800,850,.16,'sine',.09],
    chain:[1400,180,.13,'sawtooth',.07],kill:[520,150,.09,'sine',.15],
    hit:[120,55,.18,'square',.10],place:[300,500,.08,'sine',.14],
    build:[420,840,.12,'triangle',.13],wave:[220,440,.25,'triangle',.14],
    complete:[440,880,.35,'sine',.18],collect:[660,1760,.30,'triangle',.14],gameover:[280,55,.65,'triangle',.19]
  };
  function play(name){
    if(!toggle.checked||!context||context.state!=='running'||voices>=16) return;
    const now=context.currentTime;
    if(now-(recent.get(name)??-1)<.035) return;
    recent.set(name,now);
    const [start,end,duration,type,level]=effects[name]||effects.place;
    const oscillator=context.createOscillator(),gain=context.createGain();
    oscillator.type=type;oscillator.frequency.setValueAtTime(start,now);
    oscillator.frequency.exponentialRampToValueAtTime(end,now+duration);
    gain.gain.setValueAtTime(.001,now);gain.gain.linearRampToValueAtTime(level,now+.008);
    gain.gain.exponentialRampToValueAtTime(.001,now+duration);
    oscillator.connect(gain);gain.connect(master);voices++;
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();voices--;};
    oscillator.start(now);oscillator.stop(now+duration+.01);
  }
  return {play};
})();
