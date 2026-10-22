/* Local synthesized effects; no downloads or server required.
   Background music: one looping track (assets/audio/music), started on the first input because browsers block autoplay. */
const HexAudio=(()=>{
  let context,master,voices=0;
  const recent=new Map();
  const toggle=document.getElementById('soundEnabled');
  const volume=document.getElementById('soundVolume');
  const storage=globalThis.HexFirstPlayerTest?.active?HexFirstPlayerTest.storage:localStorage;
  const musicToggle=document.getElementById('musicEnabled');
  const musicVolume=document.getElementById('musicVolume');
  const settings=()=>({enabled:toggle.checked,volume:Number(volume.value),musicEnabled:musicToggle.checked,musicVolume:Number(musicVolume.value)});
  function persist(){try{storage.setItem('autohex-audio-v1',JSON.stringify(settings()));}catch{}}
  function applySettings(value){
    if(typeof value?.enabled==='boolean')toggle.checked=value.enabled;
    if(typeof value?.volume==='number'&&Number.isFinite(value.volume))volume.value=String(Math.max(0,Math.min(100,value.volume)));
    if(typeof value?.musicEnabled==='boolean')musicToggle.checked=value.musicEnabled;
    if(typeof value?.musicVolume==='number'&&Number.isFinite(value.musicVolume))musicVolume.value=String(Math.max(0,Math.min(100,value.musicVolume)));
    if(master)master.gain.value=toggle.checked?Number(volume.value)/100:0;
    updateMusic();
    persist();
  }
  // Musik "Inspirational Calm Romantic Story Piano" von Nikita Kondrashev (Pixabay); Nachweis in den Einstellungen.
  const MUSIC_SRC='assets/audio/music/leberch-calm-romantic-story-piano.mp3',MUSIC_GAIN=.6;
  let music=null,musicWanted=false;
  function updateMusic(){
    if(!music) return;
    music.volume=Math.max(0,Math.min(1,Number(musicVolume.value)/100*MUSIC_GAIN));
    const play=musicToggle.checked&&musicWanted&&!document.hidden&&Number(musicVolume.value)>0;
    if(play&&music.paused) music.play()?.catch?.(()=>{});
    else if(!play&&!music.paused) music.pause();
  }
  function startMusic(){
    musicWanted=true;
    if(!music&&musicToggle.checked&&typeof globalThis.Audio==='function'){
      try{music=new globalThis.Audio(MUSIC_SRC);music.loop=true;music.preload='auto';}catch{music=null;}
    }
    updateMusic();
  }
  try{const saved=JSON.parse(storage.getItem('autohex-audio-v1')||'null');if(saved)applySettings(saved);}catch{}
  function unlock(){
    startMusic();
    if(!toggle.checked) return;
    try{
      const AudioContextClass=window.AudioContext||window.webkitAudioContext;
      if(!AudioContextClass) return;
      if(!context){context=new AudioContextClass();master=context.createGain();master.connect(context.destination);}
      master.gain.value=Number(volume.value)/100;
      if(context.state==='suspended') context.resume().catch(()=>{});
    }catch{/* Audio unavailable: gameplay continues. */}
  }
  document.addEventListener('pointerdown',unlock);
  document.addEventListener('keydown',unlock);
  toggle.addEventListener('change',()=>{persist();if(master) master.gain.value=toggle.checked?Number(volume.value)/100:0;if(toggle.checked) unlock();});
  volume.addEventListener('input',()=>{persist();if(master) master.gain.value=toggle.checked?Number(volume.value)/100:0;});
  musicToggle.addEventListener('change',()=>{persist();startMusic();});
  musicVolume.addEventListener('input',()=>{persist();startMusic();});
  // Im Hintergrund-Tab pausieren, beim Zurückkehren weiterspielen.
  document.addEventListener('visibilitychange',updateMusic);
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
  return {play,settings,applySettings};
})();
