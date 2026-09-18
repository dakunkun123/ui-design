import {useEffect,useRef} from 'react';
import {loadSprite,drawCrane} from './paintedSprites.js';

export function JournalWind({kind,input,motion}){
 const ref=useRef(null),enabled=useRef(motion);enabled.current=motion;
 useEffect(()=>{
  const c=ref.current,g=c.getContext('2d');let w=1,h=1,raf,last=0,time=0,visible=false,dead=false;
  let leaves=[],cranes={};
  Promise.all([0,1,2].map(i=>loadSprite(`/assets/${kind===2?'bamboo':'maple'}-${i}-v29.webp`))).then(r=>{if(!dead){leaves=r;draw(0);}});
  Promise.all(['body','wing-near','wing-far'].map(p=>loadSprite(`/assets/crane-${p}-v24.webp`))).then(([body,near,far])=>{if(!dead){cranes={body,near,far};draw(0);}});
  const particles=Array.from({length:24},(_,i)=>({x:(i*.618)%1,y:(i*.381)%1,z:.25+(i%5)/6,a:i*1.9}));
  function resize(){const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio,2);w=r.width;h=r.height;c.width=w*d;c.height=h*d;g.setTransform(d,0,0,d,0,0);draw(0);}
  function draw(dt){g.clearRect(0,0,w,h);const wind=input.current.energy;
   if(kind===1){
    if(cranes.body&&cranes.near&&cranes.far){for(let i=0;i<3;i++){const phase=time*(2.1+wind*2)+i*1.7;drawCrane(g,cranes,w*(.64+i*.115+Math.sin(time*.11+i)*.065),h*(.28-i*.055)+Math.sin(time*.8+i)*8,w*(.074-i*.013),phase,.9-i*.14);}}
    for(let i=0;i<8;i++){const life=(time*.15+i/8)%1;g.strokeStyle=`rgba(74,102,103,${(1-life)*.11})`;g.lineWidth=.7;g.beginPath();g.ellipse(w*.42,h*.75,35+life*w*.22,2+life*18,0,0,Math.PI*2);g.stroke();}return;
   }
   particles.forEach((p,i)=>{p.x+=dt*(.013+wind*.12)*p.z;p.y+=dt*(.014+wind*.026);if(p.x>1.1){p.x=-.1;p.y=(i*.37)%1;}if(p.y>1.05)p.y=-.08;const im=leaves[i%3];if(!im)return;const size=(kind===2?24:28)*(.6+p.z);g.save();g.translate(p.x*w+Math.sin(time*.8+i)*14,p.y*h);g.rotate(p.a+time*(.25+wind*.8));g.scale(.65+Math.sin(time*1.8+i)*.25,1);g.globalAlpha=.36+p.z*.5;g.drawImage(im,-size*.5,-size*.5,size,size*im.height/im.width);g.restore();});
   // A moving glint belongs to the sword edge, not to a full-screen diagonal stripe.
   if(kind===2&&wind>.08){g.save();const p=(time*.25)%1;g.globalAlpha=wind*Math.sin(p*Math.PI);g.fillStyle='#fff8e4';g.beginPath();g.ellipse(w*(.42+p*.32),h*(.68-p*.24),13,1.1,-.65,0,Math.PI*2);g.fill();g.restore();}
  }
  const ro=new ResizeObserver(resize);ro.observe(c);const io=new IntersectionObserver(([e])=>visible=e.isIntersecting);io.observe(c);
  function tick(t){const dt=Math.min(.04,(t-last)/1000||0);last=t;if(enabled.current&&visible&&!document.hidden){time+=dt;draw(dt);c.dataset.windTime=time.toFixed(2);c.dataset.energy=input.current.energy.toFixed(2);}raf=requestAnimationFrame(tick);}
  resize();raf=requestAnimationFrame(tick);return()=>{dead=true;cancelAnimationFrame(raf);ro.disconnect();io.disconnect();};
 },[kind,input]);
 return <canvas className="jw-wind" ref={ref} aria-hidden="true"/>;
}
