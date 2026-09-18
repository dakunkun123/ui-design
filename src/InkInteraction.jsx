import {useEffect,useRef} from 'react';
import {createAsh,updateAsh,drawAsh} from './inkTransfer.js';
import {createInkWash} from './inkWashGL.js';

const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const random=n=>{const v=Math.sin(n*127.1+31.7)*43758.5453;return v-Math.floor(v);};
export function InkInteraction({enabled}){
 const ref=useRef(null);
 useEffect(()=>{
  if(!enabled)return;const canvas=ref.current,ctx=canvas.getContext('2d');if(!ctx)return;
  let w=innerWidth,h=innerHeight,raf=0,last=performance.now(),route=null,drops=[],leaves=[],lastMove=null,cooldown=0;
  const leaf=new Image();leaf.src='/assets/maple-leaf-v2.webp';
  let wash=null;try{wash=createInkWash();}catch{/* Sharp particles remain available without WebGL2. */}

  const resize=()=>{w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio,2);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);wash?.resize(w,h);if(route){route=null;document.getElementById('sword-scroll')?.removeAttribute('data-accumulating');}};resize();
  function blot(x,y,r,alpha){if(r<.1||alpha<.002)return;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(26,34,28,${alpha})`);g.addColorStop(.6,`rgba(40,48,39,${alpha*.55})`);g.addColorStop(1,'rgba(46,53,43,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
  const gust=()=>{const now=performance.now();if(now<cooldown||w<760||document.hidden)return;cooldown=now+4000;for(let i=0;i<3;i++)leaves.push({age:-i*.28,seed:i*.73+.2});wake();};
  const move=e=>{if(document.hidden||route||e.pointerType==='touch'||e.target.closest('button,a,input,label,.hero-copy,.scene-controls,.sword-info,dialog,.masthead')||!e.target.closest('#prologue,#sword-scroll')){lastMove=null;return;}
   const now=performance.now();if(lastMove){const distance=Math.hypot(e.clientX-lastMove.x,e.clientY-lastMove.y),speed=distance/Math.max(10,now-lastMove.t);
    if(distance>9){drops.push({x:e.clientX,y:e.clientY,age:0,r:Math.min(14,3+speed*3)});if(drops.length>30)drops.shift();wake();}
    if(speed>1.8&&now>cooldown){e.target.closest('section')?.querySelector('.gpu-surface')?.dispatchEvent(new CustomEvent('ink-scene-control',{detail:{action:'pointer-wind',value:Math.min(speed,3)}}));gust();}
   }lastMove={x:e.clientX,y:e.clientY,t:now};};
  const transition=e=>{const {from,to,progress:p}=e.detail;if(p<0){route=null;document.getElementById('sword-scroll')?.removeAttribute('data-accumulating');document.getElementById('sword-scroll')?.style.removeProperty('--ink-condense');wake();return;}
   if(![from,to].every(r=>r==='prologue'||r==='sword-scroll'))return;
   if(!route){const source=document.querySelector('#prologue .gpu-surface'),rect=source?.getBoundingClientRect(),b=(source?.dataset.rockScreen||'.7,.8,.32,.26').split(',').map(Number);
    const section=document.getElementById('sword-scroll'),sr=section.getBoundingClientRect();
    const targets=[...section.querySelectorAll('.inspect-invite')].map(el=>{const r=el.getBoundingClientRect();return {x:r.left-sr.left+r.width/2,y:r.top+r.height/2,width:r.width,height:r.height};});
    route={reverse:to==='prologue',p,source:{x:b[0]*(rect?.width||w),y:(rect?.top||0)+b[1]*(rect?.height||h),w:b[2]*(rect?.width||w),h:b[3]*(rect?.height||h)},targets:targets.length?targets:[{x:w*.16,y:h*.8}]};
    route.fragments=createAsh(source?.inkRockSamples,route.source,route.targets[0],route.targets[0]);wash?.reset();canvas.dataset.inkPixels=String(route.fragments.particles.length);canvas.dataset.wash=wash?.available?'advected-pigment':'particle-fallback';drops=[];
   }route.p=p;const q=route.reverse?1-p:p;document.getElementById('sword-scroll')?.style.setProperty('--ink-condense',String(smooth((q-.46)/.50)));wake();};
  function frame(now){raf=0;const dt=Math.min(.04,(now-last)/1000);last=now;ctx.clearRect(0,0,w,h);if(document.hidden)return;
   if(route){const q=route.reverse?1-route.p:route.p,{source:s,targets}=route;canvas.dataset.transport=q.toFixed(3);
    const deposited=updateAsh(route.fragments,q);canvas.dataset.deposited=deposited.toFixed(3);
    if(wash?.available){wash.draw(route.fragments,q,now);ctx.drawImage(wash.canvas,0,0,w,h);}
    drawAsh(ctx,route.fragments,q);
    document.getElementById('sword-scroll')?.setAttribute('data-accumulating','true');
    document.getElementById('sword-scroll')?.style.setProperty('--ink-condense',String(smooth(deposited)));

   }
   drops=drops.filter(d=>(d.age+=dt)<1.1);drops.forEach(d=>blot(d.x+Math.sin(d.age*2)*5,d.y-d.age*8,d.r*(1+d.age*1.8),(1-d.age/1.1)*.10));
   leaves=leaves.filter(l=>(l.age+=dt)<2.6);for(const l of leaves){if(l.age<0||!leaf.complete||!leaf.naturalWidth)continue;const u=l.age/2.6,z=3.5-u*2.9,scale=1/z,size=90*scale;
    ctx.save();ctx.globalAlpha=Math.sin(Math.PI*u)*.8;ctx.translate(w*(.79-.23*u)+Math.sin(u*4+l.seed)*80,h*(.20+.65*u));ctx.rotate(u*3+l.seed);ctx.scale(Math.max(.15,Math.abs(Math.cos(u*5+l.seed))),1);ctx.drawImage(leaf,-size/2,-size/2,size,size);ctx.restore();}
   if(route||drops.length||leaves.length)raf=requestAnimationFrame(frame);
  }
  function wake(){if(!raf&&!document.hidden){last=performance.now();raf=requestAnimationFrame(frame);}}
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;drops=[];leaves=[];ctx.clearRect(0,0,w,h);}else wake();};

  window.addEventListener('resize',resize);window.addEventListener('pointermove',move,{passive:true});window.addEventListener('ink-route-frame',transition);window.addEventListener('ink-foreground-gust',gust);document.addEventListener('visibilitychange',visibility);
  return()=>{cancelAnimationFrame(raf);wash?.dispose();ctx.clearRect(0,0,w,h);window.removeEventListener('resize',resize);window.removeEventListener('pointermove',move);window.removeEventListener('ink-route-frame',transition);window.removeEventListener('ink-foreground-gust',gust);document.removeEventListener('visibilitychange',visibility);document.getElementById('sword-scroll')?.removeAttribute('data-accumulating');document.getElementById('sword-scroll')?.style.removeProperty('--ink-condense');};
 },[enabled]);
 return <canvas className="ink-interaction" ref={ref} aria-hidden="true"/>;
}
