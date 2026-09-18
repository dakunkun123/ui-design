import {useEffect,useRef} from 'react';
import * as THREE from 'three';

// Mesh deformation is deliberately local: cliff/steel stay rigid, cloth/tassel flex.
export function JournalObject({src,kind,input,motion}){
 const host=useRef(null),enabled=useRef(motion);enabled.current=motion;
 useEffect(()=>{
  const el=host.current;let renderer,texture,mesh,raf,dead=false,time=0,last=0,visible=false;
  const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-1,1,1,-1,0,10);camera.position.z=2;
  const uniforms={map:{value:null},time:{value:0},wind:{value:0},kind:{value:kind}};
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);el.appendChild(renderer.domElement);}catch{return;}
  const geometry=new THREE.PlaneGeometry(2,2,64,40);
  const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,vertexShader:`
   varying vec2 vUv;uniform float time;uniform float wind;uniform float kind;
   void main(){vUv=uv;vec3 p=position;float mask=0.;
    if(kind<.5){mask=smoothstep(.64,.77,uv.x)*(1.-smoothstep(.83,.95,uv.x))*smoothstep(.60,.71,uv.y)*(1.-smoothstep(.84,.95,uv.y));}
    else if(kind>1.5){mask=smoothstep(.80,.95,uv.x)*(1.-smoothstep(.54,.80,uv.y));}
    p.x+=sin(time*2.4+uv.y*15.)*.018*mask*(.25+wind);
    p.y+=cos(time*1.9+uv.x*18.)*.009*mask*(.2+wind);
    if(kind>.5&&kind<1.5){p.y+=sin(time*.85)*.007;p.x+=sin(time*.22)*.009;}
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`
   uniform sampler2D map;varying vec2 vUv;void main(){gl_FragColor=texture2D(map,vUv);}`});
  mesh=new THREE.Mesh(geometry,material);scene.add(mesh);
  const resize=()=>{renderer.setSize(el.clientWidth||1,el.clientHeight||1);if(texture)renderer.render(scene,camera);};
  const ro=new ResizeObserver(resize);ro.observe(el);const io=new IntersectionObserver(([e])=>visible=e.isIntersecting);io.observe(el);
  new THREE.TextureLoader().load(src,t=>{if(dead){t.dispose();return;}texture=t;uniforms.map.value=t;t.colorSpace=THREE.NoColorSpace;resize();el.dataset.painted='ready';},undefined,()=>{el.dataset.painted='fallback';});
  function tick(t){const dt=Math.min(.04,(t-last)/1000||0);last=t;if(enabled.current&&visible&&!document.hidden&&texture){time+=dt;uniforms.time.value=time;uniforms.wind.value=input.current.energy;renderer.render(scene,camera);el.dataset.objectTime=time.toFixed(2);}raf=requestAnimationFrame(tick);}
  resize();raf=requestAnimationFrame(tick);
  return()=>{dead=true;cancelAnimationFrame(raf);ro.disconnect();io.disconnect();texture?.dispose();geometry.dispose();material.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
 },[src,kind,input]);
 return <div ref={host} className="jw-object"><img src={src} alt="" draggable="false"/></div>;
}
