import * as T from 'three';

// Erode actual subject surfaces, preserving authored NPR material hooks.
export function createSceneTravel(scene, subjects, mobile) {
 const amount={value:0},direction={value:1},materials=new Set(),meshes=[];
 subjects.forEach(subject=>subject.traverse(o=>{
  if(!o.isMesh)return;meshes.push(o);
  (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));
 }));
 materials.forEach(m=>{
  const previous=m.onBeforeCompile.bind(m),key=m.customProgramCacheKey();
  m.onBeforeCompile=shader=>{
   previous(shader);shader.uniforms.inkTravel=amount;
   shader.vertexShader='varying vec3 travelWorld;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntravelWorld=(modelMatrix*vec4(transformed,1.)).xyz;');
   shader.fragmentShader=`uniform float inkTravel;varying vec3 travelWorld;
    float travelHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
    float travelNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(travelHash(i),travelHash(i+vec3(1,0,0)),f.x),mix(travelHash(i+vec3(0,1,0)),travelHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(travelHash(i+vec3(0,0,1)),travelHash(i+vec3(1,0,1)),f.x),mix(travelHash(i+vec3(0,1,1)),travelHash(i+1.),f.x),f.y),f.z);}
   `+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
    if(inkTravel>.001){
     float boundary=travelNoise(travelWorld*2.6)*.55+travelNoise(travelWorld*11.)*.2+.15+.1*sin(travelWorld.y*.7);
     if(inkTravel>boundary)discard;
     outgoingLight*=1.-(1.-smoothstep(0.,.06,abs(boundary-inkTravel)))*.22;
    }
    #include <opaque_fragment>`);
  };
  m.customProgramCacheKey=()=>key+'-ink-travel-v12';m.needsUpdate=true;
 });
 scene.updateMatrixWorld(true);
 const count=mobile?700:1800,positions=new Float32Array(count*3),seeds=new Float32Array(count);
 const sources=meshes.filter(m=>m.geometry.attributes.position&&m.geometry.attributes.position.count>100);
 for(let i=0;i<count;i++){
  const mesh=sources[i%sources.length];if(!mesh)break;
  const p=mesh.geometry.attributes.position,index=(i*7919)%p.count;
  const v=new T.Vector3().fromBufferAttribute(p,index).applyMatrix4(mesh.matrixWorld);
  positions.set(v.toArray(),i*3);seeds[i]=(i*.61803398875)%1;
 }
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('seed',new T.BufferAttribute(seeds,1));
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{amount,direction},
  vertexShader:`uniform float amount,direction;attribute float seed;varying float alpha;
   void main(){float life=clamp((amount-seed*.3)*1.5,0.,1.);vec3 p=position;
    p.x+=direction*life*(1.+seed*2.);p.y+=sin(seed*46.+life*4.)*life*.9+life*.7;p.z+=life*(seed-.5)*2.;
    vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
    gl_PointSize=clamp((2.+seed*4.)*10./-mv.z,1.,8.);alpha=sin(life*3.14159)*.5*step(.03,amount);}`,
  fragmentShader:`varying float alpha;void main(){vec2 q=gl_PointCoord-.5;float d=length(q*vec2(1.,1.7));gl_FragColor=vec4(.06,.073,.065,(1.-smoothstep(.2,.5,d))*alpha);}`});
 // Render alpha-zero once during boot, so the first route does not compile this program.
 const points=new T.Points(geometry,material);points.frustumCulled=false;points.visible=true;scene.add(points);
 return {set(value,sign){amount.value=value;direction.value=sign;points.visible=value>.001;}};
}
