import {useEffect,useRef} from 'react';
import {easeSpeed} from './natureDynamics.js';
import {drawCrane} from './paintedSprites.js';

// A root-pinned elastic bough, separately attached leaves, and an articulated crane.
// This is a lightweight painted rig, not a claim of full anatomical/cloth simulation.
const anchors=[[.23,.31],[.39,.15],[.49,.07],[.48,.2],[.43,.35],[.58,.2],[.64,.16],[.65,.33],[.76,.3],[.82,.23],[.87,.27],[.79,.43],[.94,.56],[.98,.73],[.93,.66],[.83,.82],[.76,.82],[.7,.72],[.66,.67]];
export function LivingNature({kind=0,motion=true,impulse=0,compact=false,input}){
 const ref=useRef(null),signal=useRef(impulse),enabled=useRef(motion);enabled.current=motion;
 useEffect(()=>{signal.current=impulse;},[impulse]);
 useEffect(()=>{
  const c=ref.current,ctx=c.getContext('2d');let w=1,h=1,raf,last=0,time=0,seen=signal.current,energy=0,bend=0,velocity=0,visible=true,speed=1;
  const images={};for(const [key,file] of Object.entries({branch:'maple-bough-v24',leaf:'maple-0-v29',body:'crane-body-v24',near:'crane-wing-near-v24',far:'crane-wing-far-v24'})){const im=new Image();im.src=`/assets/${file}.webp`;images[key]=im;im.onload=()=>draw(0);}
  const fallen=[];const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function resize(){const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.5);w=r.width;h=r.height;c.width=w*d;c.height=h*d;ctx.setTransform(d,0,0,d,0,0);draw(0);}
  const ro=new ResizeObserver(resize);ro.observe(c);
  const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;});io.observe(c);
  const ready=im=>im.complete&&im.naturalWidth>0;
  function leaf(x,y,size,angle,roll=1,alpha=1){if(!ready(images.leaf))return;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(.65+Math.abs(roll)*.35,1);ctx.globalAlpha=alpha;ctx.drawImage(images.leaf,-size/2,-size/2,size,size);ctx.restore();}
  function draw(dt){
   ctx.clearRect(0,0,w,h);if(!w||!h)return;
   if(kind===0){const bw=Math.min(w*.69,980),bh=bw/3,ox=-bw*.055,oy=-bh*.13;
    const offset=u=>bend*u*u+Math.sin(time*1.6-u*3)*u*u*4;
    if(ready(images.branch)){const im=images.branch,n=72;for(let i=0;i<n;i++){const u=i/n,sw=im.width/n;ctx.drawImage(im,i*sw,0,sw+1,im.height,ox+u*bw,oy+offset(u),bw/n+1,bh);}}
    anchors.forEach(([u,v],i)=>{if(fallen.some(p=>p.origin===i&&p.life<8))return;const x=ox+u*bw,y=oy+v*bh+offset(u);leaf(x,y,compact?22+i%3*5:28+i%4*7,.4+Math.sin(time*2-i*.8)*(.08+u*.1)+bend*.008,Math.cos(time*.8+i)*.15+.85);});
    if(dt&&fallen.length<28&&Math.random()<dt*(energy>1?10:1.3)){const i=Math.floor(Math.random()*anchors.length),[u,v]=anchors[i];if(!fallen.some(p=>p.origin===i&&p.life<8))fallen.push({origin:i,x:ox+u*bw,y:oy+v*bh+offset(u),vx:25+energy*20,vy:8,a:i,size:compact?22+i%3*5:28+i%4*7,life:0});}
    for(let i=fallen.length-1;i>=0;i--){const p=fallen[i];p.life+=dt;p.vx+=(30+energy*25-p.vx)*dt*.6;p.vy+=dt*10;p.x+=p.vx*dt;p.y+=p.vy*dt;p.a+=dt*(.5+Math.sin(p.life));leaf(p.x,p.y,p.size,p.a,Math.cos(p.life*2),Math.max(0,1-p.life/13));if(p.life>13||p.y>h+40)fallen.splice(i,1);}
   }else if(kind===1&&ready(images.body)&&ready(images.near)&&ready(images.far)){
     for(let i=1;i>=0;i--){const s=(compact?.12:.15)*w*(i?.55:1)/890,phase=time*(1.9+i*.15)+i*1.7;const x=w*(.52-i*.23+Math.sin(time*.12+i)*.15),y=h*(.145+i*.025)+Math.sin(phase)*5;
     drawCrane(ctx,images,x,y,s*890,phase,i?.62:1);
    }
   }
  }
  function tick(t){const dt=Math.min(.035,(t-last)/1000||.016);last=t;const active=enabled.current&&!reduced.matches&&visible&&!document.hidden;
   if(active){speed=easeSpeed(speed,input?.current.held,dt);time+=dt*speed*(1+energy*.15);if(seen!==signal.current){seen=signal.current;energy=4;velocity+=50;}energy*=Math.exp(-dt*.8);const target=Math.sin(time*.85)*9+Math.sin(time*1.43)*4+energy*8;velocity+=((target-bend)*18-velocity*5)*dt;bend+=velocity*dt;draw(dt);
    if(kind===1&&speed>1.1){ctx.strokeStyle=`rgba(89,103,97,${(speed-1)*.07})`;ctx.lineWidth=.8;for(let i=0;i<18;i++){const x=((i*157-time*180)%(w+180)+w+180)%(w+180)-90,y=(i*89)%h;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+speed*19,y-4);ctx.stroke();}}
   }c.dataset.flightSpeed=speed.toFixed(3);c.dataset.natureTime=time.toFixed(3);raf=requestAnimationFrame(tick);
  }
  resize();raf=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(raf);ro.disconnect();io.disconnect();Object.values(images).forEach(im=>im.onload=null);};
 },[kind,compact,input]);
 return <canvas ref={ref} className="living-nature" aria-hidden="true"/>;
}
