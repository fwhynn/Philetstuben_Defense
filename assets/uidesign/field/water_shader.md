# Wasser als Shader (Vorschlag für three.js)

Ruhige, stilisierte Fläche passend zu den Low-Poly-Kacheln. `water_tile_1024.png` ist die kachelbare Textur dafür.

- Grundfarbe `#3f97cf`, zur Inselmitte heller (`#8fd3f4`), zum Rand dunkler (`#2f78ad`).
- Textur zweimal überlagern: einmal mit UV `* 3.0 + vec2(t * 0.010, t * 0.006)`, einmal mit `* 5.0 - vec2(t * 0.007, t * 0.012)`; beide multiplizieren und mit 0,35 mischen.
- Uferschaum: unter jeder Kachel eine weiße Kante, deren Deckkraft mit `sin(t * 1.5 + dist * 8.0)` zwischen 0,25 und 0,5 schwankt.
- „Bewegung reduzieren“: `t` konstant halten; die Fläche bleibt dann eine ruhige Textur.

```glsl
uniform sampler2D map; uniform float t;
varying vec2 vUv; varying float vDist; // vDist: 0 Mitte … 1 Rand
void main() {
  vec3 base = mix(vec3(0.561, 0.827, 0.957), vec3(0.184, 0.471, 0.678), smoothstep(0.0, 1.0, vDist));
  vec3 a = texture2D(map, vUv * 3.0 + vec2(t * 0.010, t * 0.006)).rgb;
  vec3 b = texture2D(map, vUv * 5.0 - vec2(t * 0.007, t * 0.012)).rgb;
  gl_FragColor = vec4(mix(base, base * a * b * 1.9, 0.35), 1.0);
}
```
