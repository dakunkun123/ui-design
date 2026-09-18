import * as T from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

// Closed volumetric rocks, not silhouette extrusion. All faces share the same material.
export function createRockFormation(texture){
 const group=new T.Group();group.name='volumetric-rock-formation';
 // Ink illustration shading deliberately does not use metallic/roughness lighting.
 const material=new T.MeshBasicMaterial({map:texture,color:0xffffff,transparent:true});
 const dissolve={value:0};group.userData.setDissolve=value=>{dissolve.value=T.MathUtils.clamp(value,0,1);material.depthWrite=value<.01;group.visible=value<.999;};
 material.onBeforeCompile=sh=>{
  sh.uniforms.rockDissolve=dissolve;
  sh.vertexShader='varying vec3 rockPosition;varying vec3 rockNormal;\n'+sh.vertexShader;
  sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nrockPosition=position;rockNormal=normal;');
  sh.fragmentShader=`varying vec3 rockPosition;varying vec3 rockNormal;uniform float rockDissolve;
   float rockHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
   float rockNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(rockHash(i),rockHash(i+vec3(1,0,0)),f.x),mix(rockHash(i+vec3(0,1,0)),rockHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(rockHash(i+vec3(0,0,1)),rockHash(i+vec3(1,0,1)),f.x),mix(rockHash(i+vec3(0,1,1)),rockHash(i+1.),f.x),f.y),f.z);}
  `+sh.fragmentShader;
  sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`vec3 n=normalize(rockNormal);vec3 weights=pow(abs(n),vec3(7.));weights/=dot(weights,vec3(1.));
   vec3 grain=texture2D(map,rockPosition.yz*.34).rgb*weights.x+texture2D(map,rockPosition.xz*.34).rgb*weights.y+texture2D(map,rockPosition.xy*.34).rgb*weights.z;
   float shade=1.-smoothstep(-.2,.85,dot(n,normalize(vec3(-.6,.85,1.))));
   // Preserve the authored dark ink / flying-white range instead of compressing it to gray.
   diffuseColor.rgb=grain*(.93-shade*.22)+vec3(.003,.004,.003);
  `);
  sh.fragmentShader=sh.fragmentShader.replace('#include <opaque_fragment>',`
   if(rockDissolve>.001){float field=rockNoise(rockPosition*7.)*.40+rockNoise(rockPosition*38.)*.25+clamp(rockPosition.x*.12+.28,0.,.35);
    // Wet the stone into pigment before releasing it; feather erosion instead of hard holes.
    float wet=smoothstep(.015,.23,rockDissolve);
    outgoingLight=mix(outgoingLight,vec3(.045,.06,.047),wet*.48);
    diffuseColor.a*=smoothstep(rockDissolve-.026,rockDissolve+.026,field);
   }
   #include <opaque_fragment>`);
 };
 const specs=[
  [[.2,.65,-.3],[1.25,1.75,1.12],.25],
  [[1.45,.05,-.05],[1.02,1.45,1.05],-.2],
  [[-.95,-.1,.1],[1.18,1.2,1.04],.4],
  [[.05,-.75,1],[1.65,.85,1.1],.18],
  [[-2,-1.05,.55],[1.05,.75,.95],-.15],
  [[2,-1,.65],[.92,.83,1.1],.32],
  [[0,-2.15,0],[3.4,1.7,2],0]
 ];
 for(let s=0;s<specs.length;s++){
  const [position,scale,angle]=specs[s];let geo=new T.IcosahedronGeometry(1,3);const p=geo.attributes.position;
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
   const r=1+.1*Math.sin(x*6+y*3+s)*Math.cos(z*5-y*4)+.045*Math.sin(y*19+x*7+z*4);
   // Broad angular masses with smaller weathered ridges, rather than smooth spheres.
   const shape=v=>Math.sign(v)*Math.pow(Math.abs(v),.82);
   p.setXYZ(i,shape(x)*r,shape(y)*r,shape(z)*r);
  }
  // Share normals across the tessellation: avoid unrelated triangular ink patches.
  geo.deleteAttribute('normal');const welded=mergeVertices(geo,1e-4);geo.dispose();geo=welded;
  geo.computeVertexNormals();const mesh=new T.Mesh(geo,material);mesh.position.fromArray(position);mesh.scale.fromArray(scale);mesh.rotation.z=angle;mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
 }
 const ray=new T.Raycaster(),origin=new T.Vector3();
 group.userData.topAt=(x,z)=>{origin.set(x,8,z);group.localToWorld(origin);ray.set(origin,new T.Vector3(0,-1,0));const hit=ray.intersectObjects(group.children,false)[0];return hit?group.worldToLocal(hit.point.clone()).y:null;};
 return group;
}
