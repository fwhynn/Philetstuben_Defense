// Offline geometry preview: no browser or game server required.
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {flameDetails,bossDetails} from '../classes/model-details.mjs';
const MODEL_ENEMIES=['iron','hunter','summoner','iron-storm','sunfire','firestorm','sunfire-ultimate','firestorm-ultimate'];
const W=1600,H=880,pixels=Buffer.alloc(W*H*4),depth=new Float64Array(W*H).fill(Infinity);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const o=(y*W+x)*4,edge=x%400<8||y%440<8;pixels[o]=edge?26:42;pixels[o+1]=edge?36:55;pixels[o+2]=edge?35:54;pixels[o+3]=255;}
const camera=new T.OrthographicCamera(-1,1,1,-1,.01,10);camera.position.set(3,2.3,4);camera.lookAt(0,0,0);camera.updateMatrixWorld();
const light=new T.Vector3(2,5,3).normalize();
function triangle(v,color){
  const minX=Math.max(0,Math.floor(Math.min(...v.map(p=>p.x)))),maxX=Math.min(W-1,Math.ceil(Math.max(...v.map(p=>p.x)))),minY=Math.max(0,Math.floor(Math.min(...v.map(p=>p.y)))),maxY=Math.min(H-1,Math.ceil(Math.max(...v.map(p=>p.y))));
  const [a,b,c]=v,den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(den)<.00001)return;
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
    const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/den,vv=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/den,w=1-u-vv;if(u<0||vv<0||w<0)continue;
    const z=u*a.z+vv*b.z+w*c.z,idx=y*W+x;if(z>=depth[idx])continue;depth[idx]=z;const o=idx*4;pixels[o]=color[0];pixels[o+1]=color[1];pixels[o+2]=color[2];
  }
}
for(let i=0;i<MODEL_ENEMIES.length;i++){
  const type=MODEL_ENEMIES[i],boss=i<4,buf=readFileSync(new URL(boss?'../assets/enemies/enemy_boss.glb':'../assets/towers/tower_flame_'+type.split('-')[0]+'.glb',import.meta.url));
  const gltf=await new GLTFLoader().parseAsync(buf.buffer.slice(buf.byteOffset,buf.byteOffset+buf.byteLength),'');
  // Preview a real exported animation pose, rather than the authoring geometry.
  const height=new T.Box3().setFromObject(gltf.scene).max.y;gltf.scene.add(boss?bossDetails(type.split('-')[0],type.includes('-')?'storm':'grass',height):flameDetails({finalUpgrade:type.split('-')[0],ultimate:type.includes('ultimate')?'flame':null},height));gltf.scene.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(gltf.scene),center=bounds.getCenter(new T.Vector3());
  const all=[];gltf.scene.traverse(n=>{if(n.isMesh){const geo=n.geometry.index?n.geometry.toNonIndexed():n.geometry;const p=geo.attributes.position;for(let k=0;k<p.count;k+=3){const vs=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(p,k+j).applyMatrix4(n.matrixWorld));all.push({vs,mat:n.material});}}});
  const projected=all.flatMap(t=>t.vs.map(v=>v.clone().sub(center).applyMatrix4(camera.matrixWorldInverse))),minX=Math.min(...projected.map(v=>v.x)),maxX=Math.max(...projected.map(v=>v.x)),minY=Math.min(...projected.map(v=>v.y)),maxY=Math.max(...projected.map(v=>v.y)),scale=Math.min(330/(maxX-minX),350/(maxY-minY)),cx=(i%4)*400+200,cy=Math.floor(i/4)*440+220;
  for(const {vs,mat} of all){const normal=new T.Vector3().crossVectors(vs[1].clone().sub(vs[0]),vs[2].clone().sub(vs[0])).normalize(),brightness=.50+.50*Math.max(0,normal.dot(light));const color=mat.color.clone().convertLinearToSRGB().multiplyScalar(brightness);triangle(vs.map(v=>{const p=v.clone().sub(center).applyMatrix4(camera.matrixWorldInverse);return{x:cx+(p.x-(minX+maxX)/2)*scale,y:cy-(p.y-(minY+maxY)/2)*scale,z:-p.z};}),[color.r*255,color.g*255,color.b*255]);}
}
function crc32(buf){let c=0xffffffff;for(const b of buf){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type),len=Buffer.alloc(4),crc=Buffer.alloc(4);len.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([len,t,data,crc]);}
const header=Buffer.alloc(13);header.writeUInt32BE(W,0);header.writeUInt32BE(H,4);header[8]=8;header[9]=6;
const rows=[];for(let y=0;y<H;y++)rows.push(Buffer.from([0]),pixels.subarray(y*W*4,(y+1)*W*4));
const out=new URL('../artifacts/enemies/',import.meta.url);mkdirSync(out,{recursive:true});writeFileSync(new URL('upgrade-models-preview.png',out),Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(Buffer.concat(rows))),chunk('IEND',Buffer.alloc(0))]));
console.log('artifacts/enemies/upgrade-models-preview.png');
