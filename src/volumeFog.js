import * as T from 'three';

// Ray integration through a 3D density field, terminated by the opaque scene depth.
export function createVolumeFog(scene,camera,renderer,mobile){
 const size=64,values=new Uint8Array(size**3);let seed=72631;
 for(let i=0;i<values.length;i++){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;values[i]=(seed>>>0)%256;}
 const noiseTexture=new T.Data3DTexture(values,size,size,size);noiseTexture.format=T.RedFormat;noiseTexture.minFilter=noiseTexture.magFilter=T.LinearFilter;noiseTexture.wrapS=noiseTexture.wrapT=noiseTexture.wrapR=T.RepeatWrapping;noiseTexture.unpackAlignment=1;noiseTexture.needsUpdate=true;
 const target=new T.WebGLRenderTarget(1,1,{depthBuffer:true});target.depthTexture=new T.DepthTexture(1,1,T.UnsignedIntType);
 const uniforms={time:{value:0},noiseVolume:{value:noiseTexture},depthMap:{value:target.depthTexture},resolution:{value:new T.Vector2(1,1)},nearPlane:{value:camera.near},farPlane:{value:camera.far},eye:{value:new T.Vector3()}};
 const steps=mobile?24:40;
 const material=new T.ShaderMaterial({uniforms,side:T.BackSide,transparent:true,depthWrite:false,depthTest:false,
 vertexShader:`varying vec3 exitPoint;void main(){exitPoint=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`varying vec3 exitPoint;uniform vec3 eye;uniform float time,nearPlane,farPlane;uniform vec2 resolution;uniform sampler2D depthMap;uniform highp sampler3D noiseVolume;
 float n3(vec3 p){vec3 f=fract(p);f=f*f*(3.-2.*f);return texture(noiseVolume,(floor(p)+f+.5)/64.).r;}
 float fbm(vec3 p){return n3(p)*.57+n3(p*2.03+7.1)*.28+n3(p*4.09+13.7)*.15;}
 float density(vec3 p){vec3 q=p*vec3(.38,.8,.43)+vec3(-time*.13,time*.022,time*.04);float warp=n3(q*.8+vec3(0,0,time*.07));
  float f=fbm(q+vec3(warp*1.8,warp*.6,-warp));
  float envelope=exp(-pow((p.y+.6+sin(p.x*.3)*.35)/1.5,2.))*smoothstep(0.,2.,14.-abs(p.x))*smoothstep(0.,1.,4.-abs(p.z));
  return smoothstep(.34,.72,f)*envelope*.65;
 }
 void main(){vec3 rd=normalize(exitPoint-eye),inv=1./rd;vec3 ta=(-vec3(14,3,4)-eye)*inv,tb=(vec3(14,3,4)-eye)*inv;
  vec3 lo=min(ta,tb),hi=max(ta,tb);float start=max(0.,max(lo.x,max(lo.y,lo.z))),end=min(hi.x,min(hi.y,hi.z));
  float depth=texture2D(depthMap,gl_FragCoord.xy/resolution).x;float viewZ=(nearPlane*farPlane)/((farPlane-nearPlane)*depth-farPlane);
  float opaqueDistance=-viewZ/max(.001,-(mat3(viewMatrix)*rd).z);end=min(end,opaqueDistance);
  if(end<=start)discard;
  float stepSize=(end-start)/float(${steps}),transmittance=1.;vec3 color=vec3(0.);
  for(int i=0;i<${steps};i++){vec3 p=eye+rd*(start+(float(i)+.5)*stepSize);float d=density(p);
   float lightDensity=density(p+vec3(-.35,.5,.15));float lighting=clamp(.78+(d-lightDensity)*1.7,.28,1.);
   vec3 tint=mix(vec3(.23,.29,.27),vec3(.94,.94,.89),lighting);
   float a=1.-exp(-d*stepSize*1.1);color+=transmittance*a*tint;transmittance*=1.-a;if(transmittance<.035)break;
  }
  float alpha=1.-transmittance;gl_FragColor=vec4(color/max(alpha,.001),alpha);
  #include <colorspace_fragment>
 }`});
 const mesh=new T.Mesh(new T.BoxGeometry(28,6,8),material);mesh.position.set(0,-.8,-3.3);mesh.renderOrder=20;scene.add(mesh);
 return {steps,update(t){uniforms.time.value=t;},resize(){const size=renderer.getDrawingBufferSize(new T.Vector2());uniforms.resolution.value.copy(size);target.setSize(Math.max(1,Math.round(size.x*.6)),Math.max(1,Math.round(size.y*.6)));},render(){
  uniforms.eye.value.copy(camera.position).sub(mesh.position);mesh.visible=false;renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.setRenderTarget(null);mesh.visible=true;renderer.render(scene,camera);
 },dispose(){noiseTexture.dispose();target.depthTexture.dispose();target.dispose();}};
}
