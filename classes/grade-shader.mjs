/* Farbkorrektur für Hauptmenü (menu-look.mjs) und Spiel (game-look.mjs): Sättigung, Kontrast, Teiltonung, Vignette.
   Läuft vor dem Tonemapping (OutputPass) auf HDR-Werten. gradeShader(werte) liefert ein eigenes Shader-Objekt je Aufruf. */
import * as THREE from 'three';

export function gradeShader({saturation=1.2,contrast=1.07,vignette=.38,shadowTint=[.9,.97,1.1],lightTint=[1.07,1,.9]}={}){
  return {
    uniforms:{tDiffuse:{value:null},saturation:{value:saturation},contrast:{value:contrast},vignette:{value:vignette},
      shadowTint:{value:new THREE.Vector3(...shadowTint)},lightTint:{value:new THREE.Vector3(...lightTint)}},
    vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:`uniform sampler2D tDiffuse;uniform float saturation,contrast,vignette;uniform vec3 shadowTint,lightTint;varying vec2 vUv;
    void main(){vec4 c=texture2D(tDiffuse,vUv);vec3 col=max(c.rgb,0.);float l=dot(col,vec3(.2126,.7152,.0722));
      // Sättigung kann einzelne Kanäle unter 0 drücken (sattes Grün hat kaum Blau); pow() darauf ergibt NaN = schwarze Flächen.
      col=max(mix(vec3(l),col,saturation),0.);
      col=.18*pow(col/.18+1e-5,vec3(contrast));
      col*=mix(shadowTint,lightTint,smoothstep(.02,.6,l));
      float d=distance(vUv,vec2(.5));col*=1.-vignette*smoothstep(.38,.9,d);
      gl_FragColor=vec4(col,c.a);}`
  };
}
