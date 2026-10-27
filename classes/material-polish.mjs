/* Farbpflege der geladenen Modelle (Spiel und Hauptmenü): Wiese, Laub, Wege und Blumen etwas satter, die Wiese etwas dunkler.
   Nur relative Änderungen an Sättigung und Helligkeit, kein Farbton: so passt es auch zu Sakura- und Halloween-Materialien.
   Nebelkacheln (fog_*) und alle übrigen Materialien bleiben unverändert. Jedes Material wird höchstens einmal angepasst. */
import * as THREE from 'three';

export const POLISH=[
  [/^grass_meadow$/,{saturation:1.4,lightness:-.1}],
  [/^foliage_/,{saturation:1.15,lightness:-.02}],
  [/^road(_verge)?$/,{saturation:1.12,lightness:0}],
  [/^flower_/,{saturation:1.1,lightness:0}]
];
// Im Spiel ruhiger als im Hauptmenü: Wiese und Laub leicht entsättigt, damit die Kacheln nicht grell wirken.
export const GAME_POLISH=[
  [/^grass_meadow$/,{saturation:.82,lightness:-.05}],
  [/^foliage_/,{saturation:.9,lightness:-.02}]
];
const hsl={h:0,s:0,l:0};
export function polishMaterial(material,rules=POLISH){
  if(!material?.color||material.userData?.polished)return false;
  const rule=rules.find(([pattern])=>pattern.test(material.name||''));if(!rule)return false;
  const {saturation,lightness}=rule[1];
  material.color.getHSL(hsl,THREE.SRGBColorSpace);
  material.color.setHSL(hsl.h,Math.min(1,hsl.s*saturation),Math.max(0,Math.min(1,hsl.l+lightness)),THREE.SRGBColorSpace);
  material.userData.polished=true;return true;
}
export function polishMaterials(root,rules=POLISH){
  let count=0;
  root?.traverse?.(node=>{if(!node.isMesh)return;for(const material of Array.isArray(node.material)?node.material:[node.material])if(polishMaterial(material,rules))count++;});
  return count;
}
