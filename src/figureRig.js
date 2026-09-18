import * as T from 'three';
export async function createFigureRig(canvas,src,kind,enabled){
 const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});renderer.setClearColor(0,0);
 let texture;try{texture=await new T.TextureLoader().loadAsync(src);}catch(e){renderer.dispose();throw e;}texture.colorSpace=T.SRGBColorSpace;
 const scale=Math.min(1,1500/texture.image.height);renderer.setSize(Math.round(texture.image.width*scale),Math.round(texture.image.height*scale),false);
 const uniforms={map:{value:texture},time:{value:0},kind:{value:kind}};
 const geo=new T.PlaneGeometry(2,2),mat=new T.ShaderMaterial({transparent:true,uniforms,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
 uniform sampler2D map;uniform float time,kind;varying vec2 vUv;
 void main(){vec2 p=vec2(vUv.x,1.-vUv.y),uv=vUv;
 float cloth=smoothstep(.43,.91,p.y)*(1.-smoothstep(.88,1.,p.y));
 float hair=(1.-smoothstep(.28,.57,p.x))*smoothstep(.12,.28,p.y)*(1.-smoothstep(.5,.72,p.y));
 float face=1.-smoothstep(.7,1.2,length((p-vec2(.63,.28))/vec2(.23,.2)));
 float blade=1.-smoothstep(.015,.09,abs(p.x-(.84-p.y*.58)));
 float protect=(1.-face)*(1.-blade*.92);
 float wave=sin(time*1.55-p.y*8.)*.68+sin(time*2.3-p.y*13.)*.32;
 uv.x-=protect*(cloth*.012+hair*.027*(1.-kind))*wave;
 uv.y+=hair*protect*sin(time*1.7-p.x*9.)*.008*(1.-kind);
 gl_FragColor=texture2D(map,uv);
 #include <colorspace_fragment>
 }`});
 const scene=new T.Scene();scene.add(new T.Mesh(geo,mat));const camera=new T.Camera();let raf,last=0,time=0,visible=true;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');const io=new IntersectionObserver(([e])=>visible=e.isIntersecting);io.observe(canvas);
 function draw(){uniforms.time.value=time;renderer.render(scene,camera);canvas.dataset.motionTime=time.toFixed(3);canvas.dataset.figureRig='hair-cloth';}
 function tick(t){const dt=Math.min(.04,(t-last)/1000||0);last=t;if(enabled()&&!reduced.matches&&!document.hidden&&visible){time+=dt;draw();}raf=requestAnimationFrame(tick);}draw();raf=requestAnimationFrame(tick);
 return {dispose(){cancelAnimationFrame(raf);io.disconnect();geo.dispose();mat.dispose();texture.dispose();renderer.dispose();}};
}
