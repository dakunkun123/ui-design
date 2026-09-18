import * as T from 'three';

// A camera-aligned, feathered water/ink field occupies the lower-left water only.
// It shares the scene clock and renderer; no additional WebGL context or timer.
export function createRiverAir(scene){
 const uniforms={time:{value:0},aspect:{value:1.5},wind:{value:1},pulse:{value:new T.Vector3(.28,.2,-100)},visibility:{value:1}};
 const material=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms,
 vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}',
 fragmentShader:`varying vec2 v;uniform float time,aspect,wind,visibility;uniform vec3 pulse;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 float fbm(vec2 p){float n=0.,a=.5;for(int i=0;i<4;i++){n+=noise(p)*a;p=mat2(.8,-.6,.6,.8)*p*2.07+4.;a*=.5;}return n;}
 void main(){
  float region=smoothstep(.025,.09,v.x)*(1.-smoothstep(.43,.64,v.x))*smoothstep(.06,.14,v.y)*(1.-smoothstep(.35,.46,v.y));
  vec2 flow=vec2(fbm(v*vec2(7.,13.)+vec2(-time*.055,0)),fbm(v*vec2(11.,5.)+vec2(0,time*.032)));
  float bank=.235+.027*sin(v.x*18.+flow.x*2.);
  float body=exp(-pow((v.y-bank)*27.,2.));
  float ink=fbm(v*vec2(16.,36.)+flow*2.-vec2(time*.12,0));
  float wash=smoothstep(.32,.73,ink)*body*.36;
  float wave=sin(v.y*510.+flow.y*5.+sin(v.x*16.-time*.45)*2.-time*(.65+wind*.08));
  float glimmer=pow(max(0.,wave),18.)*smoothstep(.3,.65,ink)*.12;
  float age=time-pulse.z,ring=0.;
  if(age>=0.&&age<5.){float d=length((v-pulse.xy)*vec2(aspect,3.9));
   for(int i=0;i<3;i++){float r=age*.075-float(i)*.036;if(r>0.)ring+=exp(-pow((d-r)*350.,2.))*(1.-age/5.)*.58;}}
  float ambientAge=mod(time,7.);vec2 center=vec2(.32+.035*sin(floor(time/7.)*2.),.23);
  float ambientD=length((v-center)*vec2(aspect,4.2));
  ring+=exp(-pow((ambientD-ambientAge*.032)*390.,2.))*sin(ambientAge/7.*3.14159)*.13;
  float wake=exp(-pow((v.y-bank-.025)*15.,2.))*smoothstep(.52,.8,fbm(v*vec2(9.,24.)+flow*2.+time*.025))*.13;
  float a=(wash+glimmer+ring+wake)*region*visibility;
  vec3 color=mix(vec3(.12,.16,.14),vec3(.64,.66,.59),glimmer/(wash+glimmer+.001));
  gl_FragColor=vec4(color,min(.7,a));
  #include <colorspace_fragment>
 }`});
 const mesh=new T.Mesh(new T.PlaneGeometry(2,2),material);mesh.frustumCulled=false;mesh.renderOrder=30;scene.add(mesh);
 return {update(time,wind,visibility){uniforms.time.value=time;uniforms.wind.value=wind;uniforms.visibility.value=visibility;},resize(w,h){uniforms.aspect.value=w/h;},pulse(x,y,time){uniforms.pulse.value.set(T.MathUtils.clamp(x,.09,.53),T.MathUtils.clamp(y,.14,.35),time);}};
}
