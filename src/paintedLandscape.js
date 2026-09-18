import * as T from 'three';
export async function mountLandscape(host,src,kind,enabled){
 const renderer=new T.WebGLRenderer({alpha:true,antialias:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 let texture;try{texture=await new T.TextureLoader().loadAsync(src);}catch(e){renderer.dispose();throw e;}texture.colorSpace=T.SRGBColorSpace;
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,0,2);camera.position.z=1;
 const u={map:{value:texture},time:{value:0},aspect:{value:1},imageAspect:{value:texture.image.width/texture.image.height},water:{value:kind===1?1:.35}};
 const material=new T.ShaderMaterial({uniforms:u,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`uniform sampler2D map;uniform float time,aspect,imageAspect,water;varying vec2 vUv;
 float n(vec2 p){return sin(p.x*3.1+sin(p.y*2.7))*cos(p.y*2.3+sin(p.x*1.9));}
 void main(){vec2 uv=vUv;vec2 scale=vec2(min(1.,aspect/imageAspect),min(1.,imageAspect/aspect));uv=(uv-.5)*scale+.5;
 float wet=(1.-smoothstep(.12,.39,vUv.y))*water;uv.x+=sin(uv.y*120.-time*.75+sin(uv.x*14.))*wet*.0018;uv.y+=sin(uv.x*56.+time*.6)*wet*.0007;
 vec3 c=texture2D(map,uv).rgb;float fog=smoothstep(-.25,.8,n(vec2(vUv.x*4.-time*.035,vUv.y*5.+time*.018)))*.12;fog*=smoothstep(.04,.35,vUv.y)*(1.-smoothstep(.65,.95,vUv.y));
 c=mix(c,vec3(.887,.871,.815),fog);gl_FragColor=vec4(c,1.);
 #include <colorspace_fragment>
 }`});
 const geo=new T.PlaneGeometry(2,2);scene.add(new T.Mesh(geo,material));host.appendChild(renderer.domElement);host.dataset.living='ready';
 let raf,last=0,time=0,visible=true;const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function render(){u.time.value=time;renderer.render(scene,camera);host.dataset.sceneTime=time.toFixed(1);}
 const resize=()=>{const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);u.aspect.value=r.width/r.height;render();};
 const ro=new ResizeObserver(resize);ro.observe(host);const io=new IntersectionObserver(([e])=>visible=e.isIntersecting);io.observe(host);
 function tick(t){const dt=Math.min(.05,(t-last)/1000||0);last=t;if(visible&&!document.hidden&&enabled()&&!reduced.matches){time+=dt;render();}raf=requestAnimationFrame(tick);}resize();raf=requestAnimationFrame(tick);
 return {dispose(){cancelAnimationFrame(raf);ro.disconnect();io.disconnect();texture.dispose();geo.dispose();material.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}};
}
