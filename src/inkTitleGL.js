import * as T from 'three';

const fragmentShader=`
uniform sampler2D art;
uniform float time, reveal, aspect;
uniform vec3 wakes[6];
varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float n=0.,a=.5;for(int i=0;i<4;i++){n+=a*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.03+3.7;a*=.5;}return n;}
void main(){
 vec2 uv=vUv, p=vec2(uv.x*aspect,uv.y);
 vec2 warp=vec2(fbm(p*3.+vec2(time*.035,0)),fbm(p*3.+vec2(8.,-time*.045)));
 float density=fbm(p*5.+warp*2.4-vec2(time*.055,time*.012));
 float wisps=smoothstep(.38,.7,density);
 float edge=smoothstep(0.,.13,uv.x)*smoothstep(0.,.13,1.-uv.x)*smoothstep(0.,.15,uv.y)*smoothstep(0.,.15,1.-uv.y);
 // A low wash under the title and a second drifting shoulder above it, not a rectangular fog panel.
 float ribbon=exp(-pow((uv.y-.24-.10*sin(uv.x*7.+time*.16)-.13*warp.x)*7.,2.));
 float shoulder=exp(-pow((uv.y-.79-.07*sin(uv.x*9.-time*.12))*11.,2.));
 float ambient=(ribbon*.075+shoulder*.035)*wisps*edge;
 for(int i=0;i<6;i++){
  float age=time-wakes[i].z;
  if(age>=0.&&age<3.2){
   vec2 delta=(uv-wakes[i].xy-vec2(age*.017,age*.011))*vec2(aspect,1.);
   float radius=.04+age*.038;
   ambient+=exp(-dot(delta,delta)/(radius*radius))*smoothstep(0.,.15,age)*(1.-age/3.2)*(.035+.07*density)*edge;
  }
 }
 vec2 q=(uv-vec2(1./7.))*1.4;
 // Only the existing corner bamboo accents flex; the central character skeletons remain stable.
 float bamboo=(1.-smoothstep(.05,.13,q.x))*smoothstep(.45,.65,q.y);
 q+=vec2(sin(time*.85+q.y*5.),cos(time*.61+q.x*8.)*.45)*bamboo*.0035;
 vec4 ink=texture2D(art,clamp(q,0.,1.));
 ink.a*=step(0.,q.x)*step(q.x,1.)*step(0.,q.y)*step(q.y,1.);
 float rowDelay=1.-smoothstep(.30,.62,q.y);
 float threshold=.09+q.x*.65+rowDelay*.28+fbm(q*22.)*.16;
 float progress=reveal*1.35;
 float arrival=smoothstep(threshold,threshold+.022,progress)*step(.001,reveal);
 float front=(1.-smoothstep(0.,.08,progress-threshold))*step(threshold,progress)*step(.001,reveal)*(1.-smoothstep(.90,1.,reveal));
 float spread=max(max(texture2D(art,q+vec2(.004,0)).a,texture2D(art,q-vec2(.004,0)).a),max(texture2D(art,q+vec2(0,.006)).a,texture2D(art,q-vec2(0,.006)).a));
 float wet=spread*front*arrival*(.25+.35*noise(q*180.));
 ink.a=ink.a*arrival;
 ambient+=wet*(1.-ink.a);
 // Small nonuniform splash droplets ride the advancing ink front and dry away.
 for(int i=0;i<24;i++){
  float id=float(i);vec2 center=vec2(.04+hash(vec2(id,2.))*.92,.08+hash(vec2(id,9.))*.85);
  float birth=.15+center.x*1.55+step(center.y,.49)*.7;
  float age=time-birth;
  if(age>0.&&age<1.15&&reveal<1.){
   vec2 drift=vec2(hash(vec2(id,4.))-.5,.25)*age*.045;
   vec2 d=(q-center-drift)*vec2(aspect,1.);
   float size=.0015+hash(vec2(id,7.))*.003;
   ambient+=(1.-smoothstep(size*.3,size,length(d)))*sin(age/1.15*3.14159)*.65*edge;
  }
 }
 ambient*=smoothstep(0.,.03,reveal);
 // Black multiplied by another dark value was invisible. Mix a moving wet edge
 // into the authored alpha instead, preserving silhouettes and flying-white holes.
 float phase=fract(time*.115);
 float stream=abs(q.x-phase+.045*sin(q.y*15.+time*.8)+.035*(density-.5));
 float wetRim=exp(-stream*stream/ .0015);
 float pigment=fbm(q*18.+vec2(-time*.28,time*.09));
 ink.rgb=mix(ink.rgb,vec3(.37,.40,.35),wetRim*(.38+.42*pigment));
 float alpha=ink.a+ambient*(1.-ink.a);
 vec3 color=(ink.rgb*ink.a+vec3(.14,.16,.15)*ambient*(1.-ink.a))/max(alpha,.0001);
 gl_FragColor=vec4(color,alpha);
 #include <colorspace_fragment>
}`;

export async function mountInkTitle(host,getEnabled,getStarted=()=>true){
 const surface=host.querySelector('.ink-title-surface');
 let renderer,texture;
 try{
  renderer=new T.WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power'});
  renderer.setClearColor(0,0);renderer.setPixelRatio(1);
  texture=await new T.TextureLoader().loadAsync('/assets/title-v10.webp');texture.colorSpace=T.SRGBColorSpace;
 }catch(error){texture?.dispose();renderer?.dispose();throw error;}
 const wakes=Array.from({length:6},()=>new T.Vector3(-1,-1,-100));
 const uniforms={art:{value:texture},time:{value:0},reveal:{value:0},aspect:{value:1.5},wakes:{value:wakes}};
 const material=new T.ShaderMaterial({uniforms,transparent:true,depthTest:false,depthWrite:false,
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader});
 const geometry=new T.PlaneGeometry(2,2),scene=new T.Scene();scene.add(new T.Mesh(geometry,material));const camera=new T.Camera();
 let disposed=false,failed=false,visible=true,raf=0,last=0,time=0,index=0,lastWake=-1,rect;
 const render=()=>{renderer.render(scene,camera);host.dataset.time=time.toFixed(3);host.dataset.reveal=uniforms.reveal.value.toFixed(3);};
 function resize(){
  rect=surface.getBoundingClientRect();if(!rect.width||!rect.height)return;
  const dpr=Math.min(devicePixelRatio||1,2),width=Math.min(1440,Math.round(rect.width*dpr));
  renderer.setSize(width,Math.round(width*rect.height/rect.width),false);uniforms.aspect.value=rect.width/rect.height;render();
 }
 function frame(now){
  raf=0;if(disposed||failed||!getEnabled()||!visible||document.hidden)return;
  const dt=Math.max(0,Math.min((now-last)/1000,.05));last=now;time+=dt;
  uniforms.time.value=time;uniforms.reveal.value=Math.min(1,uniforms.reveal.value+dt/2.8);
  render();raf=requestAnimationFrame(frame);
 }
 function wake(){
  if(disposed||failed)return;
  const active=getStarted()&&getEnabled()&&visible&&!document.hidden;host.dataset.running=String(active);
  if(active&&!raf){last=performance.now();raf=requestAnimationFrame(frame);}
  if(!active){cancelAnimationFrame(raf);raf=0;if(getStarted())uniforms.reveal.value=1;render();}
 }
 function move(event){
  if(!getEnabled()||!visible||document.hidden||event.pointerType==='touch'||time-lastWake<.10)return;
  const r=surface.getBoundingClientRect(),x=(event.clientX-r.left)/r.width,y=1-(event.clientY-r.top)/r.height;
  if(x<0||x>1||y<0||y>1)return;
  wakes[index++%6].set(x,y,time);lastWake=time;host.dataset.wakes=String(index);
 }
 function lost(event){event.preventDefault();failed=true;cancelAnimationFrame(raf);raf=0;host.dataset.ink='fallback';host.dataset.running='false';}
 renderer.domElement.addEventListener('webglcontextlost',lost);
 surface.appendChild(renderer.domElement);resize();host.dataset.ink='ready';
 const ro=new ResizeObserver(resize);ro.observe(host);
 const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;wake();});observer.observe(host);
 host.addEventListener('pointermove',move);document.addEventListener('visibilitychange',wake);
 return {wake,dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);ro.disconnect();observer.disconnect();host.removeEventListener('pointermove',move);document.removeEventListener('visibilitychange',wake);renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.remove();geometry.dispose();material.dispose();texture.dispose();renderer.dispose();if(!surface.querySelector('canvas'))host.dataset.ink='fallback';}};
}
