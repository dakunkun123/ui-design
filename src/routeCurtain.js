import * as T from 'three';

export function createCurtain(){
 const host=document.createElement('div');host.className='route-curtain';host.setAttribute('aria-hidden','true');
 let renderer;try{renderer=new T.WebGLRenderer({alpha:true,antialias:false,powerPreference:'high-performance'});}catch{return {play:cb=>cb(),cancel(){},dispose(){}};}
 renderer.setClearColor(0,0);host.append(renderer.domElement);document.body.append(host);
 const uniforms={mode:{value:0},shared:{value:0},progress:{value:0},aspect:{value:1},direction:{value:1},landscape:{value:null},landscapeAspect:{value:1.5},landscapeReady:{value:0}},geometry=new T.PlaneGeometry(2,2);
 let disposed=false;
 const landscape=new T.TextureLoader().load('/assets/landscape-v2.webp',texture=>{if(disposed){texture.dispose();return;}uniforms.landscapeAspect.value=texture.image.width/texture.image.height;uniforms.landscapeReady.value=1;},undefined,()=>{});
 landscape.colorSpace=T.SRGBColorSpace;uniforms.landscape.value=landscape;
 const material=new T.ShaderMaterial({transparent:true,depthTest:false,depthWrite:false,uniforms,
 vertexShader:'varying vec2 uvp;void main(){uvp=uv;gl_Position=vec4(position.xy,0.,1.);}',
 fragmentShader:`uniform float mode,shared,progress,aspect,direction,landscapeAspect,landscapeReady;uniform sampler2D landscape;varying vec2 uvp;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 a=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(a),hash(a+vec2(1,0)),f.x),mix(hash(a+vec2(0,1)),hash(a+1.),f.x),f.y);}
 float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.03+5.;a*=.5;}return v;}
 void main(){
  vec2 uv=uvp;if(direction<0.)uv.x=1.-uv.x;
  vec2 p=uv*vec2(aspect,1.);float t=progress*3.8;
  vec2 flow=vec2(fbm(p*2.8-vec2(t*.3,0)),fbm(p*3.4+vec2(0,t*.22)));
  float cloud=fbm(p*vec2(4.,7.)+flow*3.-vec2(t*.5,0));
  float weave=fbm(p*vec2(55.,100.));
  float cover=progress<.5?smoothstep(.03,.49,progress):1.-smoothstep(.51,.99,progress);
  float field=uv.x*.35+cloud*.43+.07*sin(uv.y*7.+flow.x*4.);
  if(mode>1.5){field=uv.y*.38+cloud*.36+.06*sin(uv.x*12.+flow.y*5.);}
  else if(mode>.5){
   float poolsField=min(length((uv-vec2(.28,.64))*vec2(aspect,1.)),length((uv-vec2(.72,.3))*vec2(aspect,1.)));
   field=min(.72,poolsField*.47+cloud*.28);
  }
  float front=cover*1.18-.18-field;
  float alpha=smoothstep(-.13,.06,front);
  float rim=exp(-pow((front+.01)*9.5,2.));
  float halo=exp(-pow((front+.12)*6.5,2.));
  float pools=smoothstep(.29,.69,cloud)*rim;
  vec3 paper=vec3(.905,.88,.818);
  vec2 landscapeUV=uvp-.5;
  if(aspect>landscapeAspect)landscapeUV.y*=landscapeAspect/aspect;else landscapeUV.x*=aspect/landscapeAspect;
  landscapeUV+=.5+(flow-.5)*.024*cover;
  vec3 mountains=texture2D(landscape,landscapeUV).rgb;
  paper=mix(paper,mountains,landscapeReady*cover*.40);
  paper=mix(paper,vec3(.60,.64,.58),smoothstep(.36,.78,cloud)*cover*.08);
  vec3 ink=mix(vec3(.012,.019,.017),vec3(.12,.145,.124),weave);
  float cloudSpine=.48+.17*sin(p.x*2.1+flow.x*4.-t*.4);
  float cloudBody=exp(-pow((uv.y-cloudSpine)*5.,2.));
  float cloudInk=smoothstep(.39,.67,cloud)*cloudBody*cover*.40;
  paper=mix(paper,ink,cloudInk);
  vec3 color=mix(paper,ink,clamp(pools*1.25+rim*.24+halo*.09,0.,.96));
  // Pigment remains inside the wet front, rather than vanishing into a flat paper wipe.
  float suspendedInk=smoothstep(.28,.67,cloud+weave*.12)*cover;
  if(mode>.5&&mode<1.5)color=mix(color,ink,suspendedInk*.78);
  else if(mode>1.5)color=mix(color,ink,suspendedInk*cloudBody*.60);
  vec2 cell=fract(p*430.)-.5;
  float grains=step(.98,hash(floor(p*430.)))*(1.-smoothstep(.06,.42,length(cell*vec2(1.,1.4))))*exp(-pow((front+.1)*10.,2.))*.42;
  alpha=max(alpha,grains);color=mix(color,ink,grains*1.8);
  if(progress>.49&&progress<.51){alpha=1.;}
  if(shared>.5){
   float arc=uv.y-(.18+uv.x*.57+.09*sin(uv.x*4.+progress*2.));
   float stroke=exp(-pow((arc+(flow.x-.5)*.035)*95.,2.))*exp(-pow((uv.x-progress)*4.,2.))*.5;
   float wake=exp(-pow((arc+.03)*19.,2.))*cloud;
   float life=sin(progress*3.14159);
   alpha=(rim*.13+cloudBody*cover*.12+stroke*.34+wake*.23)*life;
   color=mix(paper,ink,clamp(stroke*.85+wake*.6,0.,1.));
  }
  if(mode>.5&&mode<1.5){
   // Staggered diagonal tears, fibrous edges and dark turned-over paper rims.
   float band=uv.y*7.+noise(p*8.)*.3;
   float strip=floor(band);
   float delay=mix(hash(vec2(strip,7.)),hash(vec2(strip+1.,7.)),smoothstep(.03,.97,fract(band)))*.15;
   float phase=progress<.5?smoothstep(delay,.49,progress):1.-smoothstep(.51+delay*.4,1.,progress);
   float ridge=uv.x+uv.y*.25+fbm(p*12.)*.09+noise(p*95.)*.016;
   float tear=phase*1.6-.19-ridge;
   float fiber=fbm(p*vec2(170.,95.));
   float edge=exp(-abs(tear)*95.);
   float fold=exp(-abs(tear-.026)*30.);
   alpha=smoothstep(-.006,.012,tear+(fiber-.5)*.014);
   color=mix(paper,ink,clamp(edge*.92+fold*.23,0.,.94));
   color+=vec3(.06)*exp(-abs(tear-.009)*200.);
   if(progress>.485&&progress<.53)alpha=1.;
  }
  gl_FragColor=vec4(color,alpha);
  #include <colorspace_fragment>
 }`});
 const scene=new T.Scene(),camera=new T.Camera();scene.add(new T.Mesh(geometry,material));
 let raf=0,callback=null,committed=false,failed=false,warmed=false,options=null;
 renderer.setSize(2,2,false);
 renderer.compileAsync(scene,camera).then(()=>{if(!disposed){renderer.render(scene,camera);warmed=true;}}).catch(()=>{failed=true;});
 const send=p=>window.dispatchEvent(new CustomEvent('ink-route-frame',{detail:{...options,progress:p}}));
 function clearCopies(){document.querySelectorAll('main>section').forEach(s=>s.style.removeProperty('--route-copy'));}
 function cancel(){cancelAnimationFrame(raf);raf=0;callback=null;send(-1);options=null;clearCopies();host.dataset.active='false';document.documentElement.dataset.routing='false';}
 function finish(){if(!committed){committed=true;callback?.();}cancel();}
 function play(cb,config={}){
  cancel();if(failed||!warmed||document.hidden){cb();return;}callback=cb;committed=false;options=config;
  uniforms.direction.value=config.direction||1;host.dataset.active='true';document.documentElement.dataset.routing='true';
  uniforms.shared.value=[config.from,config.to].every(r=>r==='prologue'||r==='sword-scroll')&&innerWidth>760?1:0;
  uniforms.mode.value=config.to==='journal'?1:config.to==='prologue'?2:0;
  host.dataset.style=uniforms.shared.value?'sword-travel':uniforms.mode.value===1?'fibrous-ink-tear':uniforms.mode.value===2?'cloud-return':'ink-crossing';
  const h=host.clientHeight,w=Math.min(innerWidth*(devicePixelRatio>1?1.25:1),1600);renderer.setSize(w,Math.round(w*h/innerWidth),false);uniforms.aspect.value=innerWidth/h;
  const start=performance.now(),duration=uniforms.shared.value?4800:2800;
  function frame(now){
   const p=Math.min(1,Math.max(0,(now-start)/duration));uniforms.progress.value=p;
   renderer.render(scene,camera);host.dataset.progress=p.toFixed(3);
   const source=document.getElementById(config.from),dest=document.getElementById(config.to);
   source?.style.setProperty('--route-copy',String(1-T.MathUtils.smoothstep(p,.08,.32)));
   dest?.style.setProperty('--route-copy',String(T.MathUtils.smoothstep(p,.57,.83)));
   if(p>=.5&&!committed){committed=true;callback?.();}
   send(p);
   if(p<1)raf=requestAnimationFrame(frame);else cancel();
  }
  raf=requestAnimationFrame(frame);
 }
 const visibility=()=>{if(document.hidden&&callback)finish();};document.addEventListener('visibilitychange',visibility);
 const lost=e=>{e.preventDefault();failed=true;finish();};renderer.domElement.addEventListener('webglcontextlost',lost);
 return {play,cancel,dispose(){disposed=true;cancel();document.removeEventListener('visibilitychange',visibility);renderer.domElement.removeEventListener('webglcontextlost',lost);landscape.dispose();geometry.dispose();material.dispose();renderer.dispose();host.remove();}};
}
