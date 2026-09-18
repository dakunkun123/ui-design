import * as T from 'three';
// A local-space wet pigment response: bound to the object, never to a screen overlay.
export function createInkTouch(mesh){
 const point={value:new T.Vector3(0,-1,0)},strength={value:0};let target=0;
 for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
  const previous=material.onBeforeCompile.bind(material),key=material.customProgramCacheKey();
  material.onBeforeCompile=shader=>{previous(shader);shader.uniforms.touchPoint=point;shader.uniforms.touchStrength=strength;
   shader.vertexShader='varying vec3 touchLocal;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntouchLocal=position;');
   shader.fragmentShader='varying vec3 touchLocal;uniform vec3 touchPoint;uniform float touchStrength;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`float fibers=sin(touchLocal.y*43.+sin(touchLocal.x*51.)*2.)*.035+sin(touchLocal.x*89.+touchLocal.y*17.)*.02;
    float wet=1.-smoothstep(.06,.68+touchStrength*.3,distance(touchLocal.xy,touchPoint.xy)+fibers);
    outgoingLight=mix(outgoingLight,outgoingLight*.2+vec3(.008,.013,.011),wet*touchStrength*.8);
    #include <opaque_fragment>`);
  };material.customProgramCacheKey=()=>key+'-wet-touch-v13';material.needsUpdate=true;
 }
 return {hit(p){point.value.lerp(p,.32);target=1;},leave(){target=0;},update(dt){strength.value+=(target-strength.value)*(1-Math.exp(-dt*(target?4:1.1)));},focus(p){point.value.copy(p);target=1;},strength};
}
