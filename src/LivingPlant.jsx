import {useEffect,useRef} from 'react';
export function LivingPlant({src,className,motion,kind}){
 const ref=useRef(null),enabled=useRef(motion);enabled.current=motion;
 useEffect(()=>{const canvas=ref.current,ctx=canvas.getContext('2d'),im=new Image();let raf,w=1,h=1,time=0,last=0,visible=true;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  function draw(){if(!im.naturalWidth)return;ctx.clearRect(0,0,w,h);const s=Math.min(w/im.width,h/im.height),dw=im.width*s,dh=im.height*s,ox=(w-dw)/2,oy=h-dh,n=64;
   for(let i=0;i<n;i++){const v=i/n,u=kind===3?v:1-v,sy=i*im.height/n,sh=im.height/n;const bend=u*u*(Math.sin(time*.73+kind)*.7+Math.sin(time*1.57-u*2.8)*.3)*dw*(kind===3?.12:.04);ctx.drawImage(im,0,sy,im.width,Math.min(sh+.5,im.height-sy),ox+bend,oy+v*dh,dw,dh/n+.5);}
  }
  const resize=()=>{const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio,2);w=r.width;h=r.height;canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);draw();};
  im.onload=draw;im.src=src;const ro=new ResizeObserver(resize);ro.observe(canvas);const io=new IntersectionObserver(([e])=>visible=e.isIntersecting);io.observe(canvas);
  function tick(t){const dt=Math.min(.05,(t-last)/1000||0);last=t;if(enabled.current&&!reduce.matches&&visible&&!document.hidden){time+=dt;draw();}raf=requestAnimationFrame(tick);}resize();raf=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(raf);im.onload=null;ro.disconnect();io.disconnect();};
 },[src,kind]);
 return <canvas className={`${className} living-plant`} ref={ref} aria-hidden="true"/>;
}
