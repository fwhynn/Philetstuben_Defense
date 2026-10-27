/* Nachbearbeitung im Spiel (nur Grafik „hoch“), angelehnt an den Hauptmenü-Look, aber zurückhaltender:
   etwas mehr Sättigung und Kontrast, warme Lichter, kühle Schatten, leichte Vignette. Modelle und Kacheln bleiben unverändert.
   Beide Szenen des Spiel-Renderers (Hintergrund mit Nebel/Leerfeldern, dann Spielfeld) landen in einem Zwischenbild ohne MSAA
   (three.js verwirft MSAA-Puffer nach jedem Rendern, ein zweiter Durchgang würde sonst auf verworfenem Inhalt zeichnen);
   geglättet wird am Ende mit SMAA. Ohne Nachbearbeitung (Grafik „niedrig“, Fehler) zeichnet der Renderer wie bisher. */
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {Pass} from 'three/addons/postprocessing/Pass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {SMAAPass} from 'three/addons/postprocessing/SMAAPass.js';
import {gradeShader} from './grade-shader.mjs?v=dc5b5c8da17c8458';

export const GAME_GRADE={saturation:.9,contrast:1.07,vignette:.26,shadowTint:[.93,.98,1.07],lightTint:[1.05,1,.93]};

// Hintergrund und Spielfeld nacheinander in dasselbe Zwischenbild; dazwischen nur die Tiefe löschen (wie bisher auf dem Bildschirm).
class SceneStackPass extends Pass{
  constructor(scenes,camera){super();this.scenes=scenes;this.camera=camera;this.needsSwap=false;}
  render(renderer,writeBuffer,readBuffer){
    const autoClear=renderer.autoClear;renderer.autoClear=false;
    renderer.setRenderTarget(readBuffer);renderer.clear();
    this.scenes.forEach((scene,i)=>{if(i)renderer.clearDepth();renderer.render(scene,this.camera);});
    renderer.autoClear=autoClear;
  }
}

export function createGameLook({renderer,scenes,camera}){
  let composer=null;
  try{
    composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType}));
    composer.addPass(new SceneStackPass(scenes,camera));
    composer.addPass(new ShaderPass(gradeShader(GAME_GRADE)));
    composer.addPass(new OutputPass());composer.addPass(new SMAAPass());
  }catch{composer=null;}
  return {
    get active(){return !!composer;},
    resize(width,height,pixelRatio){if(!composer)return;composer.setPixelRatio(pixelRatio);composer.setSize(width,height);},
    // Die Nachbearbeitung löscht ihre Zwischenbilder selbst; der Spiel-Renderer arbeitet sonst mit autoClear=false.
    render(){if(!composer)return false;const autoClear=renderer.autoClear;renderer.autoClear=true;composer.render();renderer.autoClear=autoClear;return true;},
    dispose(){composer?.dispose?.();composer=null;}
  };
}
