import * as T from 'three';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
import {createBackdrop} from './atmosphere.js';
import {createVolumeFog} from './volumeFog.js';
import {createRockFormation} from './rockFormation.js';
import {createInkPlumes} from './inkPlumes.js';
import {createSceneTravel} from './sceneTravel.js';
import {createInkTouch} from './inkTouch.js';
import {createSilkFibers} from './silkFibers.js';
import {createRiverAir} from './riverAir.js';

const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
let sharedSilk=null;
export const wind3=(t,p)=>V(.42+.5*Math.sin(t*.63-p.x*.15)+.16*Math.sin(t*1.71+p.z),.045*Math.sin(t*1.2+p.x),.22*Math.sin(t*.83+p.y*.2));

// Closed, textured relief volume. Alpha is geometry occupancy, not a moving image rectangle.
function volume(texture,w,h,thickness,type,sideTexture){
 const c=document.createElement('canvas');c.width=type==='sword'?640:320;c.height=Math.round(c.width*h/w);
 const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(texture.image,0,0,c.width,c.height);
 const W=c.width,H=c.height,data=ctx.getImageData(0,0,W,H).data,positions=[],uvs=[],indices=[],groups=[];
 const solid=(x,y)=>x>=0&&x<W&&y>=0&&y<H&&data[(y*W+x)*4+3]>95;
 const spans=Array.from({length:H},(_,y)=>{let lo=W,hi=0;for(let x=0;x<W;x++)if(solid(x,y)){lo=Math.min(lo,x);hi=Math.max(hi,x);}return [lo,hi];});
 const rim=new Float32Array((W+1)*(H+1));
 for(let y=0;y<=H;y++)for(let x=0;x<=W;x++){let d=12;for(let r=1;r<=12;r++){if(!solid(x-r,y)||!solid(x+r,y)||!solid(x,y-r)||!solid(x,y+r)){d=r;break;}}rim[y*(W+1)+x]=Math.min(1,d/10);}
 const point=(x,y,back=false)=>{const u=x/W,v=y/H;const edge=rim[y*(W+1)+x];let d=thickness*(.25+.75*Math.sin(u*Math.PI))*Math.sin(edge*Math.PI/2);
  if(type==='sword'){const [lo,hi]=spans[Math.min(H-1,y)],cross=T.MathUtils.clamp(Math.abs(x-(lo+hi)/2)/Math.max(1,(hi-lo)/2),0,1);
   const blade=.003+.038*(1-cross),grip=.12*Math.sin(edge*Math.PI/2);
   d=T.MathUtils.lerp(grip,blade,T.MathUtils.smoothstep(v,.25,.34));
  }return [(u-.5)*w,(.5-v)*h,(back?-1:1)*d];};
 function quad(a,b,c,d,uv,side=false){const start=positions.length/3;positions.push(...a,...b,...c,...d);
  if(side&&sideTexture){const horizontal=Math.abs(a[0]-d[0])>Math.abs(a[1]-d[1]);uv=[a,b,c,d].flatMap(p=>[p[2]*.9,(horizontal?p[0]:p[1])*.65]);}
  uvs.push(...uv);const offset=indices.length;indices.push(start,start+1,start+2,start+2,start+3,start);groups.push({start:offset,count:6,materialIndex:side?1:0});}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(solid(x,y)){
  const a=point(x,y),b=point(x+1,y),c=point(x+1,y+1),d=point(x,y+1),A=point(x,y,true),B=point(x+1,y,true),C=point(x+1,y+1,true),D=point(x,y+1,true);
  const uv=[x/W,1-y/H,(x+1)/W,1-y/H,(x+1)/W,1-(y+1)/H,x/W,1-(y+1)/H];
  quad(d,c,b,a,[uv[6],uv[7],uv[4],uv[5],uv[2],uv[3],uv[0],uv[1]]);
  quad(A,B,C,D,uv);
  if(!solid(x-1,y))quad(a,A,D,d,uv,true);if(!solid(x+1,y))quad(c,C,B,b,uv,true);
  if(!solid(x,y-1))quad(b,B,A,a,uv,true);if(!solid(x,y+1))quad(d,D,C,c,uv,true);
 }
 // Merge consecutive material ranges; avoid one draw call per cell.
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));
 const front=[],side=[];groups.forEach(g=>(g.materialIndex?side:front).push(...indices.slice(g.start,g.start+g.count)));
 geo.setIndex([...front,...side]);geo.addGroup(0,front.length,0);geo.addGroup(front.length,side.length,1);
 const smooth=mergeVertices(geo);geo.dispose();smooth.computeVertexNormals();
 const mat=new T.MeshStandardMaterial({map:texture,roughness:type==='sword'?.78:.95,metalness:type==='sword'?.32:0,side:T.DoubleSide,alphaTest:.35});
 if(type==='rock'&&sideTexture){mat.onBeforeCompile=sh=>{
  sh.uniforms.strata={value:sideTexture};
  sh.vertexShader='varying vec3 stoneP;varying vec3 stoneN;\n'+sh.vertexShader;
  sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nstoneP=position;stoneN=normal;');
  sh.fragmentShader='uniform sampler2D strata;varying vec3 stoneP;varying vec3 stoneN;\n'+sh.fragmentShader;
  sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec3 n=normalize(stoneN);vec3 weights=pow(abs(n),vec3(5.));weights/=max(.001,weights.x+weights.y+weights.z);
   vec3 rockDetail=texture2D(strata,stoneP.yz*.65).rgb*weights.x+texture2D(strata,stoneP.xz*.65).rgb*weights.y+texture2D(strata,stoneP.xy*.65).rgb*weights.z;
   float slope=smoothstep(.22,.82,1.-abs(n.z));diffuseColor.rgb=mix(diffuseColor.rgb,rockDetail*.82,slope*.7);`);
 };}
 const edge=new T.MeshStandardMaterial({color:type==='sword'?0x9fa399:0xb8b6a9,map:sideTexture||null,roughness:type==='sword'?.65:.96,metalness:type==='sword'?.5:0});
 const mesh=new T.Mesh(smooth,[mat,edge]);mesh.castShadow=true;mesh.receiveShadow=true;
 mesh.userData.topAt=(px,pz)=>{const x=Math.floor((px/w+.5)*W);if(x<0||x>=W||Math.abs(pz)>thickness)return null;for(let y=0;y<H;y++)if(solid(x,y)&&Math.abs(pz)<Math.abs(point(x,y)[2]))return (.5-y/H)*h;return null;};
 return mesh;
}

export async function mountGPU(root,kind,getState){
 let stopped=false,visible=false,raf=0,time=0,last=0,acc=0;
 let windLevel=1,gust=0,travelAmount=0,travelSign=1,travelling=false,inspect='whole',angle=0;
 let composition=kind==='sword'?1:0,sharedTravel=false;
 const gaze=V(0,-.1,0),goal=V(0,-.1,0);let zoom=13,magnify=1;
 const sceneWind=(t,p)=>wind3(t,p).multiplyScalar(windLevel).add(V(gust*Math.cos(p.x*.12),gust*.04,gust*.16));
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
 renderer.setClearColor(0xf4f1e9,0);root.appendChild(renderer.domElement);
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.1,100);camera.position.set(0,0,13);
 const loader=new T.TextureLoader(),textures=[];
 const names=['landscape-v2','sword-v14','rock-v3','maple-leaf-v2','wanderer-v3','bark-v5','ink-stone-v13','tassel-v14'];
 try {const results=await Promise.allSettled(names.map(name=>loader.loadAsync(`/assets/${name}.webp`)));for(const result of results){if(result.status==='fulfilled'){result.value.colorSpace=T.SRGBColorSpace;textures.push(result.value);}}const failure=results.find(result=>result.status==='rejected');if(failure)throw failure.reason;}
 catch(e){textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();throw e;}
 const [land,swordTex,rockTex,leafTex,portrait,barkTex,stoneTex,tasselTex]=textures;
 // V14 retains the approved white-ground silk; its ink coverage is resolved in the material.
 root.dataset.swordAsset='sword-v14';root.dataset.tasselAsset='tassel-v14';
 swordTex.anisotropy=tasselTex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 for(const t of [barkTex,stoneTex]){t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
 const barkBump=barkTex.clone(),stoneBump=stoneTex.clone();barkBump.colorSpace=stoneBump.colorSpace=T.NoColorSpace;textures.push(barkBump,stoneBump);
 const light=new T.DirectionalLight(0xfff8e7,2.4);light.position.set(-3,8,8);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-10;light.shadow.camera.right=10;light.shadow.camera.top=10;light.shadow.camera.bottom=-10;light.shadow.bias=-.002;scene.add(light,new T.HemisphereLight(0xf5f3ec,0x818779,2.1));
 const back=createBackdrop(scene,camera,land);
 const objects=new T.Group();scene.add(objects);
 let sword=null,rock=null,rockBounds=null,lastRouteTime=0;
 if(kind!=='journal'){
  sword=volume(swordTex,4.6,6.9,.065,'sword');sword.position.set(kind==='hero'?2.4:0,.15,.25);sword.rotation.z=kind==='hero'?-.23:-1.16;objects.add(sword);
  rock=createRockFormation(stoneTex);rock.scale.set(1.4,.57,1);rock.position.set(2,-3.55,.7);objects.add(rock);sword.position.y-=.75;
 }else{
  // A single supplied view cannot establish a true head/body backside. Keep a masked relief.
  const geo=new T.PlaneGeometry(10,6.67,90,60),p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,.28*Math.exp(-(x*x+y*y)*.15));}
  geo.computeVertexNormals();const mat=new T.MeshBasicMaterial({map:portrait,transparent:true,depthWrite:true,alphaTest:.005});
  mat.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\n float edgeWave=.018*sin(vMapUv.x*43.)+.01*sin(vMapUv.x*97.);diffuseColor.a *= smoothstep(0.0,0.1,vMapUv.x)*smoothstep(0.0,0.16,1.0-vMapUv.x)*smoothstep(0.0,0.17,1.0-vMapUv.y+edgeWave)*smoothstep(0.0,0.1,vMapUv.y);');};
  const actor=new T.Mesh(geo,mat);actor.position.set(-2.3,-.8,1.4);actor.scale.setScalar(.9);objects.add(actor);
 }
 // A real water plane, with GPU vertex waves and ring disturbances in world space.
 const hits=Array.from({length:8},()=>new T.Vector4(0,0,-100,0));let hitIndex=0;
 const waterMat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},hits:{value:hits}},vertexShader:`varying vec2 p;uniform float time;void main(){vec3 q=position;p=q.xy;q.z+=sin(q.x*2.3+time*.7)*.012+sin(q.y*3.1-time)*.009;gl_Position=projectionMatrix*modelViewMatrix*vec4(q,1.);}`,fragmentShader:`varying vec2 p;uniform float time;uniform vec4 hits[8];void main(){float a=.035+.03*sin(p.y*42.+sin(p.x*2.+time*.3)*1.4-time*.8);for(int i=0;i<8;i++){float age=time-hits[i].z;float d=distance(p,hits[i].xy);if(age>0.&&age<4.)a+=exp(-pow((d-age*.34)*28.,2.))*.45*(1.-age/4.);}float fade=smoothstep(-7.,-3.,p.y)*(1.-smoothstep(6.,10.,abs(p.x)));gl_FragColor=vec4(.25,.31,.28,a*fade);}`});
 const water=new T.Mesh(new T.PlaneGeometry(24,18,90,60),waterMat);water.rotation.x=-Math.PI/2;water.position.set(0,-3.05,-2);scene.add(water);
 // Low-opacity GPU advected dust/mist. Positions evolve in the vertex shader.
 const count=innerWidth<760?220:640,buf=new Float32Array(count*3);for(let i=0;i<count;i++){buf[i*3]=Math.sin(i*127.1)*10;buf[i*3+1]=Math.sin(i*43.7)*3;buf[i*3+2]=-5+Math.sin(i*19.3)*3;}
 const dustGeo=new T.BufferGeometry();dustGeo.setAttribute('position',new T.BufferAttribute(buf,3));
 const dustMat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0}},vertexShader:`uniform float time;varying float opacity;void main(){vec3 p=position;p.x+=sin(time*.12+position.y)*.8;p.y+=sin(time*.2+position.x)*.15;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(mod(abs(position.x)*10.,4.)+1.)*12./-mv.z;opacity=.12;}`,fragmentShader:`varying float opacity;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(.24,.28,.25,(1.-smoothstep(.1,.5,d))*opacity);}`});scene.add(new T.Points(dustGeo,dustMat));
 const atmosphere=createVolumeFog(scene,camera,renderer,innerWidth<760);const plumes=createInkPlumes(scene,kind==='sword'?'hero':kind);root.dataset.fogMode='depth-aware-volume';root.dataset.fogSteps=String(atmosphere.steps);root.dataset.inkPlumes='3';root.dataset.inkParticles=String(count);
 const river=kind==='hero'?createRiverAir(scene):null;if(river)root.dataset.riverAir='shore-ink';

 const branches=[],leafSlots=[],falling=[],subjects=[objects];
 const bark=new T.MeshStandardMaterial({color:0xd9d3c4,map:barkTex,bumpMap:barkBump,bumpScale:.075,roughness:1});
 const leafGeo=new T.PlaneGeometry(.65,.74,7,8);const lp=leafGeo.attributes.position;
 for(let i=0;i<lp.count;i++)lp.setZ(i,Math.pow(lp.getX(i),2)*1.2+.025*Math.sin(lp.getY(i)*10));leafGeo.computeVertexNormals();
 const leafMat=new T.MeshStandardMaterial({map:leafTex,transparent:true,alphaTest:.16,side:T.DoubleSide,roughness:1,depthWrite:true});
 {
  const trunk=new T.Group();trunk.position.set(9.85,3.1,1.5);trunk.rotation.z=.09;scene.add(trunk);
  subjects.push(trunk);
  function branch(parent,length,radius,angle,depth,seed){
   const pivot=new T.Group();pivot.rotation.z=angle;parent.add(pivot);
   const points=[V(),V(-length*.22,-length*.075,.06),V(-length*.46,-length*.12,.08*Math.sin(seed)),V(-length*.73,-length*.065,.18),V(-length,-length*.19,.02)];
   const path=new T.CatmullRomCurve3(points),tube=new T.TubeGeometry(path,56,radius,12,false),tp=tube.attributes.position,uv=tube.attributes.uv;
   for(let i=0;i<tp.count;i++){const u=Math.floor(i/13)/56,a=i%13/12*Math.PI*2,center=path.getPointAt(Math.min(1,u));
    const irregular=1+.17*Math.sin(u*47+seed)*Math.sin(a*3)+.2*Math.sin(a*5+u*11)+.3*Math.exp(-Math.pow((u-.38)*19,2));
    const v=V(tp.getX(i),tp.getY(i),tp.getZ(i)).sub(center).multiplyScalar((1-u*.91)*irregular).add(center);tp.setXYZ(i,v.x,v.y,v.z);uv.setXY(i,i%13/12,u*length*1.1+seed*.21);
   }tube.computeVertexNormals();
   const wood=new T.Mesh(tube,bark);wood.castShadow=true;wood.receiveShadow=true;pivot.add(wood);
   if(depth<2){const knot=new T.Mesh(new T.SphereGeometry(radius*.95,12,8),bark);knot.position.copy(path.getPoint(.38));knot.scale.set(1.65,.8,1);pivot.add(knot);}
   branches.push({pivot,rest:angle,angle:0,velocity:0,seed,depth});
   const leafCount=depth===0?4:depth===1?6:8;
   for(let i=1;i<=leafCount;i++){
    const cluster=i<=leafCount*.5?.56:.9;const anchor=new T.Group();anchor.position.copy(path.getPoint(cluster+.055*Math.sin(seed+i*3)));anchor.position.z+=.16*Math.sin(i*2);pivot.add(anchor);
    const leaf=new T.Mesh(leafGeo,leafMat);leaf.position.set(Math.sin(i*2+seed)*.3,-.16-.11*(i%3),Math.cos(i)*.1);leaf.rotation.set(.2,Math.sin(seed+i)*.65,Math.sin(seed+i)*1.35);leaf.scale.setScalar((depth===1?1.1:.8)+.4*Math.abs(Math.sin(seed*3+i)));anchor.add(leaf);
    leafSlots.push({anchor,leaf,seed:seed+i,rest:leaf.rotation.clone(),used:false,old:null,velocity:V(),angle:0,angularVelocity:0});
   }
   if(depth<2){const tip=new T.Group();tip.position.copy(path.getPoint(.82));pivot.add(tip);branch(tip,length*.65,radius*.49,-.23-.09*Math.sin(seed),depth+1,seed+2);const fork=new T.Group();fork.position.copy(path.getPoint(.46));pivot.add(fork);branch(fork,length*.48,radius*.39,.43+.12*Math.sin(seed*2),depth+1,seed+5);}
  }
  branch(trunk,4.35,.135,-.1,0,1);
 }
 // Multiple 3D inextensible strands. Their anchor follows the sword's world transform.
 const strands=[];let attach=V(),silk=null,fibers=null;
 const mountPoint=()=>sword.localToWorld(V(0,3.24,.065));
 function writeSilk(){if(!silk||!strands.length)return;const p=silk.geometry.attributes.position,uv=silk.geometry.attributes.uv;
  for(let i=0;i<p.count;i++){const t=(1-uv.getY(i))*19,k=Math.min(18,Math.floor(t)),f=t-k;
   // Five independently simulated guides, smoothly blended across UVs: no cut seams.
   const band=uv.getX(i)*4,j=Math.min(3,Math.floor(band)),blend=band-j;
   const at=n=>strands[n].pts[k].clone().lerp(strands[n].pts[k+1],f);
   const center=at(j).lerp(at(j+1),blend);
   const tangent=strands[j].pts[k+1].clone().sub(strands[j].pts[k]).normalize();
   const across=tangent.clone().cross(V(0,0,1)).normalize(),x=(uv.getX(i)-.479)*.66;
   center.addScaledVector(across,x).addScaledVector(V(0,0,1),.012);p.setXYZ(i,center.x,center.y,center.z);
  }p.needsUpdate=true;silk.geometry.computeVertexNormals();silk.geometry.computeBoundingSphere();
  root.dataset.tasselTip=strands[2].pts[19].toArray().map(n=>n.toFixed(3)).join(',');
  fibers?.update(strands,time,1-travelAmount);
 }
 function writeStrand(s){
  const p=s.line.geometry.attributes.position;
  s.pts.forEach((v,i)=>{const tangent=s.pts[Math.min(19,i+1)].clone().sub(s.pts[Math.max(0,i-1)]).normalize(),normal=tangent.clone().cross(V(0,0,1)).normalize(),binormal=tangent.clone().cross(normal).normalize();
   for(let j=0;j<5;j++){const angle=j/5*Math.PI*2,radius=.0008*(1-.8*i/19),q=v.clone().addScaledVector(normal,Math.cos(angle)*radius).addScaledVector(binormal,Math.sin(angle)*radius);p.setXYZ(i*5+j,q.x,q.y,q.z);}
  });p.needsUpdate=true;s.line.geometry.computeVertexNormals();s.line.geometry.computeBoundingSphere();
 }
 if(sword){for(let j=0;j<5;j++){
  const n=20,length=1.85+[.05,-.04,.12,.02,-.08][j],pts=Array.from({length:n},(_,i)=>V(0,-length*i/(n-1),0));
  const old=pts.map(p=>p.clone()),geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(n*5*3),3));const idx=[];for(let i=0;i<n-1;i++)for(let k=0;k<5;k++){const a=i*5+k,b=i*5+(k+1)%5;idx.push(a,b,a+5,b,b+5,a+5);}geometry.setIndex(idx);
  const line=new T.Mesh(geometry,new T.MeshStandardMaterial({color:j%3?0x252c28:0x52594d,roughness:.95}));line.visible=false;scene.add(line);strands.push({pts,old,line,length,j});
 }
  const silkMaterial=new T.MeshBasicMaterial({map:tasselTex,transparent:true,alphaTest:.018,side:T.DoubleSide,depthWrite:false});
  silkMaterial.onBeforeCompile=sh=>{sh.fragmentShader=sh.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   float inkDensity=1.-max(sampledDiffuseColor.r,max(sampledDiffuseColor.g,sampledDiffuseColor.b));
   float coverage=smoothstep(.025,.83,inkDensity);
   float redThread=clamp((sampledDiffuseColor.r-sampledDiffuseColor.g)*3.,0.,1.);
    diffuseColor.rgb=mix(clamp(sampledDiffuseColor.rgb*.62,vec3(.045),vec3(.38)),vec3(.22,.025,.019),redThread);
    // Preserve the knot, but let individual render fibers carry the loose silk.
    float knot=smoothstep(.77,.85,vMapUv.y);
    diffuseColor.a*=coverage*mix(.06,1.,knot);
  `);};
  silkMaterial.customProgramCacheKey=()=> 'v15-silk-detail';
  silk=new T.Mesh(new T.PlaneGeometry(1,1,40,72),silkMaterial);scene.add(silk);
  subjects.push(silk,...strands.map(s=>s.line));root.dataset.tasselGuides='5';
  fibers=createSilkFibers(scene,innerWidth<760?96:160);root.dataset.tasselFibers=String(fibers.count);
 }
 function initStrands(){if(!sword)return;scene.updateMatrixWorld(true);attach.copy(mountPoint());strands.forEach(s=>{s.pts.forEach((p,i)=>{p.copy(attach).add(V((s.j-2)*.008*(i/19)**2,-i*s.length*Math.sqrt(sword.scale.y)/19,Math.sin(s.j)*.005*i/19));s.old[i].copy(p);});writeStrand(s);});writeSilk();}
 initStrands();
 const travel=createSceneTravel(scene,subjects,innerWidth<760);
 const inkTouch=sword?createInkTouch(sword):null;
 function physics(dt){
  branches.forEach(b=>{const w=sceneWind(time,b.pivot.getWorldPosition(V()));const stiffness=18/(b.depth+1),force=w.x*.09*(b.depth+1)+Math.sin(time*2+b.seed)*.012;b.velocity+=(force-stiffness*b.angle-b.velocity*2.8)*dt;b.angle+=b.velocity*dt;b.pivot.rotation.z=b.rest+b.angle;b.pivot.rotation.y=b.angle*.35;});
  leafSlots.forEach(s=>{const pos=s.anchor.getWorldPosition(V()),w=sceneWind(time,pos),torque=w.x*.7*Math.cos(s.angle)+w.z*.3;s.angularVelocity+=(torque-s.angle*(6+s.seed%3)-s.angularVelocity*1.6)*dt;s.angle+=s.angularVelocity*dt;s.leaf.rotation.z=s.rest.z+s.angle;s.leaf.rotation.x=s.rest.x+s.angle*.6;if(s.old)s.velocity.copy(pos).sub(s.old).divideScalar(dt);else s.old=pos.clone();s.old.copy(pos);});
  scene.updateMatrixWorld(true);
  if(sword){const nextAttach=mountPoint(),anchorDelta=nextAttach.clone().sub(attach);attach.copy(nextAttach);strands.forEach(s=>{
   // Carry the guide with its moving anchor; don't inject a teleport into Verlet velocity.
   const teleport=anchorDelta.length()>.4;
   for(let i=0;i<s.pts.length;i++){const carry=teleport?1:Math.exp(-i*.14);s.pts[i].addScaledVector(anchorDelta,carry);s.old[i].addScaledVector(anchorDelta,carry);}
   const seg=s.length*Math.sqrt(sword.scale.y)/19;
   for(let i=1;i<s.pts.length;i++){const p=s.pts[i],before=p.clone(),u=i/19,vel=p.clone().sub(s.old[i]).multiplyScalar(Math.exp(-dt*(.75+u*.32))),w=sceneWind(time-u*.32-s.j*.045,p);
    w.x+=Math.sin(time*1.3-u*4.2+s.j*.73)*.24*u*u*windLevel;
    w.z+=Math.sin(time*1.1-u*5+s.j*1.6)*.23*u*windLevel;
    const tangent=p.clone().sub(s.pts[i-1]).normalize();w.addScaledVector(tangent,-w.dot(tangent)*.7);
    p.add(vel).addScaledVector(w,dt*dt*(3.2+u*1.8)).addScaledVector(V(0,-4.5,0),dt*dt);s.old[i].copy(before);}
   for(let k=0;k<8;k++){s.pts[0].copy(attach);for(let i=1;i<s.pts.length;i++){const a=s.pts[i-1],b=s.pts[i],delta=b.clone().sub(a),d=delta.length()||1;delta.multiplyScalar((d-seg)/d);if(i===1)b.sub(delta);else{a.addScaledVector(delta,.5);b.addScaledVector(delta,-.5);}}}
  });}
  falling.forEach(f=>{
   if(f.water||f.rest){f.age+=dt;f.mesh.material.opacity=1-T.MathUtils.smoothstep(f.age,4.5,6);if(f.water)f.mesh.position.x+=sceneWind(time,f.mesh.position).x*.015*dt;return;}
   const w=sceneWind(time,f.mesh.position);f.velocity.addScaledVector(w.clone().multiplyScalar(.45).sub(f.velocity.clone().multiplyScalar(.65)),dt);f.velocity.y-=.36*dt;
   f.mesh.position.addScaledVector(f.velocity,dt);f.mesh.rotation.x+=dt*(1.1+Math.sin(time+f.seed));f.mesh.rotation.z+=dt*.8;
   if(rock?.visible){const local=rock.worldToLocal(f.mesh.position.clone()),top=rock.userData.topAt(local.x,local.z);if(top!==null&&local.y<=top){local.y=top+.03;f.mesh.position.copy(rock.localToWorld(local));f.rest=true;return;}}
   if(f.mesh.position.y<=-3.03){f.mesh.position.y=-3.02;f.mesh.rotation.set(-Math.PI/2,0,f.seed);f.water=true;hits[hitIndex++%8].set(f.mesh.position.x,-(f.mesh.position.z+2),time,1);root.dataset.splashes=String(Number(root.dataset.splashes||0)+1);}
  });
 }
 let next=2,cursor=0;const pointer={x:0,y:0},target={x:0,y:0};
 function pose(dt=1){
  const ease=1-Math.exp(-dt*5);goal.set(0,-.1,0);
  if(sword){const q=composition,mobile=root.clientWidth<760;
   sword.rotation.z=T.MathUtils.lerp(-.23,-1.16,q);sword.position.set(T.MathUtils.lerp(2.4,mobile?0:-.45,q),T.MathUtils.lerp(-.6,-.25,q),.25);
   sword.scale.setScalar(T.MathUtils.lerp(1,mobile?1.08:1.5,q));
   // Grounded rock: dissolve in place before the canvas handover, never slide it.
   rock.position.set(2,-3.55,.7);const rockFade=T.MathUtils.smoothstep(q,.035,.65);rock.userData.setDissolve(rockFade);
   root.dataset.rockAnchor=rock.position.toArray().join(',');root.dataset.rockDissolve=rockFade.toFixed(3);
   if(subjects[1]){subjects[1].position.y=mobile?3:1.8;subjects[1].position.x=(mobile?9.2:root.clientWidth<1100?8.1:11)+q*1.2;subjects[1].visible=inspect==='whole';}
  }
  if(kind==='sword'&&sword){
   sword.rotation.y+=(angle-sword.rotation.y)*ease;sword.updateWorldMatrix(true,false);
   if(inspect==='tassel'&&strands.length)goal.copy(strands[2].pts[10]);
   else if(inspect!=='whole')goal.copy(sword.localToWorld(V(0,inspect==='pommel'?3.2:-1,.08)));
  }
  gaze.lerp(goal,ease);zoom+=((inspect==='whole'?13:inspect==='tassel'?10:8.7)/magnify-zoom)*ease;
  root.dataset.magnify=magnify.toFixed(2);
  camera.position.set(gaze.x+pointer.x*.35+travelAmount*travelSign*2.2,gaze.y+pointer.y*.16+travelAmount*.38,zoom+travelAmount*3.);
  camera.lookAt(gaze.x-travelAmount*travelSign*.6,gaze.y,0);camera.updateMatrixWorld();
   if(rock){if(!rockBounds){rock.updateWorldMatrix(true,true);rockBounds=new T.Box3().setFromObject(rock);}const center=rockBounds.getCenter(V()).project(camera),lo=rockBounds.min.clone().project(camera),hi=rockBounds.max.clone().project(camera);root.dataset.rockScreen=[center.x*.5+.5,.5-center.y*.5,Math.abs(hi.x-lo.x)*.5,Math.abs(hi.y-lo.y)*.5].join(',');
    if(kind==='hero'&&!sharedTravel&&performance.now()-(root.inkSampleTime||0)>180){root.inkSampleTime=performance.now();const rect=root.getBoundingClientRect(),samples=[];rock.updateWorldMatrix(true,true);rock.children.forEach(mesh=>{const a=mesh.geometry.attributes.position;for(let i=0;i<a.count;i+=3){const p=V().fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld).project(camera);samples.push({x:(rect.left+(p.x*.5+.5)*rect.width)/innerWidth,y:(rect.top+(.5-p.y*.5)*rect.height)/innerHeight});}});root.inkRockSamples=samples;}
   }
  root.dataset.inspect=inspect;root.dataset.inspectAngle=angle.toFixed(3);root.dataset.travel=travelAmount.toFixed(3);
  if(kind==='sword')root.closest('section').dataset.inspect=inspect;
  if(kind==='sword'&&sword){for(const el of root.closest('section').querySelectorAll('[data-sword-focus]')){const local=V(0,el.dataset.swordFocus==='pommel'?3.2:-.8,.08);sword.localToWorld(local).project(camera);el.style.left=`${(local.x*.5+.5)*100}%`;el.style.top=`${(-local.y*.5+.5)*100}%`;el.hidden=travelling||inspect!=='whole'||root.clientWidth<760;}}
 }
 const ownRoute=kind==='hero'?'prologue':kind==='sword'?'sword-scroll':'journal';
 function routeFrame(e){
  const {progress:p,from,to,direction=1}=e.detail;
  if(p<0){if(!travelling)return;travelling=false;sharedTravel=false;composition=kind==='sword'?1:0;travelAmount=0;travel.set(0,1);pose();if(visible&&!document.hidden)atmosphere.render();return;}
  if(ownRoute!==from&&ownRoute!==to)return;
  const starting=!travelling;travelling=true;travelSign=ownRoute===from?direction:-direction;
  sharedTravel=[from,to].every(r=>r==='prologue'||r==='sword-scroll')&&innerWidth>760;
  if(sharedTravel){if(starting)root.dispatchEvent(new Event('ink-inspection-reset'));inspect='whole';angle=0;pointer.x=pointer.y=target.x=target.y=0;gaze.set(0,-.1,0);zoom=13;
   const q=T.MathUtils.smootherstep(p,0,1);composition=to==='sword-scroll'?q:1-q;travelAmount=0;travel.set(0,1);pose(1);
   const now=performance.now(),dt=starting?1/90:Math.min(.04,(now-lastRouteTime)/1000);lastRouteTime=now;
   if(ownRoute===from){time+=dt;acc+=dt;while(acc>=1/90){physics(1/90);acc-=1/90;}sharedSilk={attach:attach.clone(),guides:strands.map(s=>({pts:s.pts.map(p=>p.clone()),old:s.old.map(p=>p.clone())}))};}
   else if(sharedSilk){attach.copy(sharedSilk.attach);strands.forEach((s,j)=>s.pts.forEach((p,i)=>{p.copy(sharedSilk.guides[j].pts[i]);s.old[i].copy(sharedSilk.guides[j].old[i]);}));}
   writeSilk();
   root.dataset.sharedTravel='true';if((ownRoute===from&&p<.5)||(ownRoute===to&&p>=.5))atmosphere.render();return;
  }
  root.dataset.sharedTravel='false';
  travelAmount=ownRoute===from?T.MathUtils.smoothstep(p,0,.49):1-T.MathUtils.smoothstep(p,.51,1);
  travel.set(travelAmount,travelSign);pose(.04);
  if((ownRoute===from&&p<.5)||(ownRoute===to&&p>=.5))atmosphere.render();
 }
 const ray=new T.Raycaster(),screen=new T.Vector2();
 function splash(x,z){hits[hitIndex++%8].set(x,z,time-.01,1);river?.pulse(.28,.22,time);root.dataset.userSplashes=String(Number(root.dataset.userSplashes||0)+1);}
 function control(e){
  const {action,value}=e.detail;
  if(action==='magnify')magnify=T.MathUtils.clamp(Number(value)||1,1,1.35);
  if(action==='inspect'){inspect=['whole','pommel','edge','tassel'].includes(value)?value:'whole';if(inkTouch){if(inspect==='whole'||inspect==='tassel')inkTouch.leave();else inkTouch.focus(V(0,inspect==='pommel'?3.2:-1,.08));}}
  if(action==='angle')angle=T.MathUtils.clamp(Number(value)||0,-Math.PI*28/180,Math.PI*28/180);
  if(action==='wind')windLevel=T.MathUtils.clamp(Number(value)||0,0,2.4);
  if(action==='gust'&&getState()){gust=2.4;window.dispatchEvent(new Event('ink-foreground-gust'));}
  if(action==='pointer-wind'&&getState())gust=Math.max(gust,Math.min(1.3,Number(value)*.35));
  if(action==='water'&&getState())splash(kind==='hero'?-2:0,1.2);
  root.dataset.wind=String(windLevel);root.dataset.gust=gust.toFixed(2);
  if(!getState()){pose(10);initStrands();if(visible)atmosphere.render();}else wake();
 }
 function waterClick(e){
  const focus=e.target.closest('[data-sword-focus]');if(focus){root.dispatchEvent(new CustomEvent('ink-scene-control',{detail:{action:'inspect',value:focus.dataset.swordFocus}}));return;}
  if(kind==='sword'||!getState()||e.target.closest('a,button,input,label,.hero-copy,.featured-copy'))return;
  const r=root.getBoundingClientRect();screen.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);
  if(Math.abs(screen.x)>1||Math.abs(screen.y)>1)return;
  if(river&&screen.x<.15&&screen.y<-.05){river.pulse(screen.x*.5+.5,screen.y*.5+.5,time);root.dataset.userSplashes=String(Number(root.dataset.userSplashes||0)+1);}
  scene.updateMatrixWorld(true);ray.setFromCamera(screen,camera);
  const hit=ray.intersectObjects([water,...subjects],true)[0];
  if(hit?.object===water){const local=water.worldToLocal(hit.point.clone());splash(local.x,local.y);}
 }
 function frame(now){
  if(stopped)return;
  const dt=Math.min((now-last)/1000||0,.04);last=now;const active=getState()&&visible&&!document.hidden;
  root.dataset.running=String(active);
  if(active&&!travelling){time+=dt;gust*=Math.exp(-dt*.85);root.dataset.gust=gust.toFixed(2);acc+=dt;while(acc>=1/90){physics(1/90);acc-=1/90;}strands.forEach(writeStrand);writeSilk();
   if(time>next&&leafSlots.length&&falling.length<8){let slot=leafSlots[cursor++%leafSlots.length];if(!slot.used){slot.used=true;const mesh=new T.Mesh(leafGeo,leafMat.clone());slot.leaf.getWorldPosition(mesh.position);slot.leaf.getWorldQuaternion(mesh.quaternion);slot.leaf.getWorldScale(mesh.scale);slot.leaf.visible=false;scene.add(mesh);falling.push({mesh,velocity:slot.velocity.clone().addScaledVector(sceneWind(time,mesh.position),.03),water:false,age:0,seed:cursor});}next=time+2.8;}
   for(let i=falling.length-1;i>=0;i--)if(falling[i].age>6||Math.abs(falling[i].mesh.position.x)>15){scene.remove(falling[i].mesh);falling[i].mesh.material.dispose();falling.splice(i,1);}
   waterMat.uniforms.time.value=dustMat.uniforms.time.value=time;atmosphere.update(time);plumes.update(time);river?.update(time,windLevel+gust,1-T.MathUtils.smoothstep(composition,0,.5));
   pointer.x+=(target.x-pointer.x)*dt*3;pointer.y+=(target.y-pointer.y)*dt*3;
   pose(dt);inkTouch?.update(dt);
   if(!travelling)atmosphere.render();root.dataset.leaves=String(falling.length);root.dataset.triangles=String(renderer.info.render.triangles);root.dataset.drawCalls=String(renderer.info.render.calls);root.dataset.time=time.toFixed(2);
  }
  if(active)raf=requestAnimationFrame(frame);else raf=0;
 }
 function wake(){if(!stopped&&!raf&&getState()&&visible&&!document.hidden){last=performance.now();raf=requestAnimationFrame(frame);}else if(!getState()||!visible||document.hidden){cancelAnimationFrame(raf);raf=0;root.dataset.running='false';}}
 function resize(){const w=root.clientWidth,h=root.clientHeight;if(!w||!h)return;renderer.setSize(w,h);fibers?.resize(w,h);river?.resize(w,h);camera.aspect=w/h;camera.fov=kind==='sword'&&w<760?27:w<760?47:36;camera.updateProjectionMatrix();back.resize();atmosphere.resize();root.dataset.backgroundCover=back.coverage().toFixed(4);objects.position.x=w<760&&kind==='hero'?-1.7:0;pose(10);initStrands();atmosphere.render();}
 const host=root.closest('section')||root;
 root.addEventListener('ink-scene-control',control);host.addEventListener('click',waterClick);window.addEventListener('ink-route-frame',routeFrame);
 let lastTouch=0;
 const move=e=>{if(e.pointerType==='touch'||!getState()||travelling)return;const r=host.getBoundingClientRect();target.x=T.MathUtils.clamp((e.clientX-r.left)/r.width*2-1,-1,1);target.y=T.MathUtils.clamp(1-(e.clientY-r.top)/r.height*2,-1,1);
   if(sword&&performance.now()-lastTouch>70){lastTouch=performance.now();const b=root.getBoundingClientRect();screen.set((e.clientX-b.left)/b.width*2-1,1-(e.clientY-b.top)/b.height*2);ray.setFromCamera(screen,camera);const hit=ray.intersectObject(sword,false)[0];if(hit){inkTouch.hit(sword.worldToLocal(hit.point.clone()));root.dataset.inkTouch='true';}else{inkTouch.leave();root.dataset.inkTouch='false';}
    if(silk&&!e.target.closest('button,a,input')&&ray.intersectObject(silk,false).length){gust=Math.max(gust,.65);root.dataset.silkTouch='true';}else root.dataset.silkTouch='false';
   }
 };
 const leave=()=>{target.x=target.y=0;inkTouch?.leave();};
 const observer=new IntersectionObserver(([e])=>{visible=e.isIntersecting;wake();});observer.observe(root);
 const ro=new ResizeObserver(resize);ro.observe(root);host.addEventListener('pointermove',move);host.addEventListener('pointerleave',leave);document.addEventListener('visibilitychange',wake);
 const lost=e=>{e.preventDefault();root.dataset.gpu='lost';cancelAnimationFrame(raf);raf=0;root.dispatchEvent(new Event('gpu-failed'));};renderer.domElement.addEventListener('webglcontextlost',lost);
 resize();travel.set(0,1);root.dataset.gpu='webgl2';root.dataset.geometry=kind==='journal'?'single-view-relief':kind==='hero'?'volumetric-rocks-relief-sword':'closed-volume';root.dataset.ready='true';
 const gl=renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');root.dataset.renderer=debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
 return {wake,dispose(){root.removeEventListener('ink-scene-control',control);host.removeEventListener('click',waterClick);window.removeEventListener('ink-route-frame',routeFrame);stopped=true;cancelAnimationFrame(raf);observer.disconnect();ro.disconnect();host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',leave);document.removeEventListener('visibilitychange',wake);renderer.domElement.removeEventListener('webglcontextlost',lost);const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());atmosphere.dispose();light.shadow.map?.dispose();renderer.renderLists.dispose();renderer.dispose();renderer.domElement.remove();}};
}
