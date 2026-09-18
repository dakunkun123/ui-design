import {useEffect,useRef} from 'react';
export function StoryAtmosphere({kind,pulse,motion}){
 const canvas=useRef(null),input=useRef(pulse);
 useEffect(()=>{input.current=pulse;},[pulse]);
 useEffect(()=>{
  const c=canvas.current,ctx=c.getContext('2d');let raf=0,w=0,h=0,last=0,seen=0,age=99,px=.35,py=.7,windPhase=0;
  const leaf=new Image();leaf.src='/assets/maple-leaf-v2.webp';const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  function resize(){const r=c.getBoundingClientRect(),d=Math.min(1.5,devicePixelRatio||1);w=r.width;h=r.height;c.width=w*d;c.height=h*d;ctx.setTransform(d,0,0,d,0,0);}
  const ro=new ResizeObserver(resize);ro.observe(c);resize();
  function frame(t){const dt=Math.min(.05,(t-last)/1000||.016);last=t;const active=motion&&!reduce.matches;
   if(seen!==input.current.id){seen=input.current.id;age=0;px=input.current.x;py=input.current.y;}else age+=dt;
   ctx.clearRect(0,0,w,h);
   if(active){
    windPhase+=dt*(.035+Math.exp(-age)*.09);
    // Mountain leaves are emitted from actual branch anchors by LivingNature.
    if(kind===1&&age<4){for(let i=0;i<5;i++){const a=age-i*.18;if(a<0)continue;ctx.beginPath();ctx.ellipse(px*w,py*h,12+a*80,3+a*18,-.05,0,Math.PI*2);ctx.strokeStyle=`rgba(48,65,63,${Math.max(0,.45-a*.12)})`;ctx.lineWidth=.7;ctx.stroke();}}
    if(kind===2){ctx.strokeStyle='rgba(65,74,72,.13)';ctx.lineWidth=.6;for(let i=0;i<55;i++){const x=(i*.171%1)*w*.67,y=((i*.293+t*.00018)%1)*h;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-4,y+22);ctx.stroke();}if(age<1.4){ctx.save();ctx.globalAlpha=Math.sin(age/1.4*Math.PI)*.7;ctx.translate(w*(.12+age*.28),h*(.22+age*.34));ctx.rotate(-.7);const g=ctx.createLinearGradient(-60,0,60,0);g.addColorStop(0,'#fff0');g.addColorStop(.5,'#ffffed');g.addColorStop(1,'#fff0');ctx.fillStyle=g;ctx.fillRect(-60,-1,120,2);ctx.restore();}}
   }raf=requestAnimationFrame(frame);
  }raf=requestAnimationFrame(frame);return()=>{cancelAnimationFrame(raf);ro.disconnect();};
 },[kind,motion]);
 return <canvas className="voyage-atmosphere" ref={canvas} aria-hidden="true"/>;
}
