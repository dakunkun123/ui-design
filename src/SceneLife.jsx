import {useEffect,useRef} from 'react';
import {loadSprite,loadBotanicals,paintedLeaf} from './paintedSprites.js';
export function SceneLife({kind,motion,input,compact=false}){
 const ref=useRef(null),enabled=useRef(motion);enabled.current=motion;
 useEffect(()=>{
  const c=ref.current,g=c.getContext('2d');let raf,time=0,last=0,w=1,h=1,visible=true,dead=false,art=[],energy=0;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const loading=kind===0?loadBotanicals():Promise.all([0,1,2].map(i=>loadSprite(`/assets/${kind===1?'fish':'bamboo'}-${i}-v29.webp`)));
  loading.then(a=>{if(!dead){art=a;draw();}});
  function resize(){const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio,2);w=r.width;h=r.height;c.width=w*d;c.height=h*d;g.setTransform(d,0,0,d,0,0);draw();}
  function fish(x,y,size,phase,rotation){
   if(art.length!==3||!art.every(Boolean))return;g.save();g.translate(x,y);g.rotate(rotation);g.scale(size/160,size/160*.76);g.globalAlpha=.46;
   for(const side of [-1,1]){g.save();g.translate(-20,side*14);g.scale(1,side);g.rotate(.55+Math.sin(phase+.5)*.2);g.drawImage(art[2],0,0,36,22);g.restore();}
   g.save();g.translate(54,Math.sin(phase)*1.5);g.rotate(Math.sin(phase)*.26);g.drawImage(art[1],-3,-26,53,52);g.restore();
   g.drawImage(art[0],-65,-19,125,38);g.restore();
  }
  function draw(){
   if(w<=1)return;g.clearRect(0,0,w,h);g.lineCap='round';
   if(kind===0){
    // Long pendulous shoots, individually attached leaves, at the edge of the world.
    for(let b=0;b<4;b++){
     const baseX=w*(.015+b*.019),baseY=h*(.38+b*.028),len=h*(.23+b*.027),bend=Math.sin(time*.8-b*.6)*18+energy*12;
     const point=u=>({x:baseX+u*55+Math.sin(u*2.4)*bend,y:baseY+u*len});let prev=point(0);
     for(let j=1;j<=32;j++){const p=point(j/32);g.strokeStyle='#6b6b4b9c';g.lineWidth=1.5*(1-j/34);g.beginPath();g.moveTo(prev.x,prev.y);g.lineTo(p.x,p.y);g.stroke();prev=p;}
     for(let j=1;j<12;j++){const u=j/12,p=point(u),side=j%2?1:-1;paintedLeaf(g,art[(b+j)%6],p.x,p.y,Math.PI/2+side*.62,35+(b+j)%3*9,1,time,b+j);}
    }
   }else if(kind===1){
    for(let i=0;i<2;i++){
     const phase=time*.22+i*2.4,x=w*(.81+Math.sin(phase)*.10),y=h*(.75+Math.cos(phase)*.04+i*.035),dx=Math.cos(phase)*w*.10,dy=-Math.sin(phase)*h*.04;
     fish(x,y,(compact?90:112)*(1-i*.24),time*(3+energy)+i,Math.atan2(dy,dx)+Math.PI);
    }
   }else{
    for(let b=0;b<3;b++){
     const baseX=w*(1.02-b*.045),baseY=h*1.05,len=h*(.6+b*.12),sway=Math.sin(time*.9-b*.55)*.045+energy*.025;
     const point=u=>({x:baseX-len*u*(.21+b*.06)+Math.sin(u*2)*sway*len*u,y:baseY-len*u});let prev=point(0);
     for(let j=1;j<=30;j++){const u=j/30,p=point(u);g.strokeStyle='#415747b0';g.lineWidth=5-b-u*2;g.beginPath();g.moveTo(prev.x,prev.y);g.lineTo(p.x,p.y);g.stroke();if(j%6===0){g.strokeStyle='#a3b09a';g.lineWidth=1;g.beginPath();g.moveTo(p.x-3,p.y);g.lineTo(p.x+3,p.y-1);g.stroke();}prev=p;}
     for(let j=1;j<=4;j++){const p=point(.3+j*.15),im=art[(b+j)%3];if(!im)continue;const size=Math.min(220,w*.17)*(1-j*.08);g.save();g.translate(p.x,p.y);g.rotate(-.55+Math.sin(time*1.3-j*.7-b)*.12+sway);g.scale(j%2?-1:1,1);g.drawImage(im,-size*.08,-size*.9,size,size);g.restore();}
    }
   }
   c.dataset.lifeTime=time.toFixed(3);c.dataset.lifeAssets=String(art.filter(Boolean).length);
  }
  const ro=new ResizeObserver(resize);ro.observe(c);const io=new IntersectionObserver(([e])=>visible=e.isIntersecting);io.observe(c);resize();
  function tick(t){const dt=Math.min(.04,(t-last)/1000||0);last=t;if(enabled.current&&!reduced.matches&&!document.hidden&&visible){energy+=((input?.current.held?1:0)-energy)*Math.min(1,dt*3);time+=dt;draw();}raf=requestAnimationFrame(tick);}raf=requestAnimationFrame(tick);
  return()=>{dead=true;cancelAnimationFrame(raf);ro.disconnect();io.disconnect();};
 },[kind,input,compact]);
 return <canvas ref={ref} className={`scene-life scene-life-${kind}`} aria-hidden="true"/>;
}
