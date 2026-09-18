import {useEffect,useRef} from 'react';
import {appendPoint,createStroke,branchPoint,growthAt,smooth} from './willowModel.js';
import {loadBotanicals,paintedLeaf} from './paintedSprites.js';
export function WillowGrowth({input,motion}){
 const ref=useRef(null),enabled=useRef(motion);enabled.current=motion;
 useEffect(()=>{
  const c=ref.current,g=c.getContext('2d'),paths=[];let sprites=[],dead=false;
  loadBotanicals().then(a=>{if(!dead)sprites=a;});
  let raf,last=0,w=1,h=1,stroke=null,time=0,serial=0,seen=input.current.demo||0,demo=null;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function resize(){const r=c.getBoundingClientRect(),d=Math.min(devicePixelRatio,2);w=r.width;h=r.height;c.width=w*d;c.height=h*d;g.setTransform(d,0,0,d,0,0);}
  const ro=new ResizeObserver(resize);ro.observe(c);resize();
  function add(){const p=createStroke(++serial);paths.push(p);if(paths.length>3)paths.shift();return p;}
  function segment(a,b,width,color){g.lineWidth=width;g.strokeStyle=color;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();}
  function frame(t){
   const dt=Math.min(.04,(t-last)/1000||0);last=t;const a=input.current,active=enabled.current&&!reduced.matches&&!document.hidden;if(active)time+=dt;
   if((a.demo||0)!==seen){seen=a.demo;demo={path:add(),start:time,progress:0};}
   if(demo){const u=active?Math.min(1,(time-demo.start)/1.5):1;for(let v=demo.progress;v<=u;v+=.01)appendPoint(demo.path,.28+v*.48,.7-Math.sin(v*2.6)*.19,time,w,h);demo.progress=u;if(u>=1){demo=null;if(!active)time+=4;}}
   const samples=a.samples?.splice(0)||[];
   for(const p of samples){if(p.start||!stroke)stroke=add();appendPoint(stroke,p.x,p.y,time,w,h);if(p.end)stroke=null;}
   if(samples.length&&reduced.matches)time+=4;
   if(a.held&&active){if(!stroke)stroke=add();appendPoint(stroke,a.x,a.y,time,w,h);}else if(!samples.length)stroke=null;
   g.clearRect(0,0,w,h);g.lineCap='round';g.lineJoin='round';let leaves=0;
   for(const path of paths){
    const pts=path.points;
    for(let i=1;i<pts.length;i++){
     const p=pts[i],q=pts[i-1],width=1.25+2.1*(1-p.distance/Math.max(1,path.length));
     const from={x:q.x*w,y:q.y*h},to={x:p.x*w,y:p.y*h};segment(from,to,width,'#554c38');segment({x:from.x-.5,y:from.y-.5},{x:to.x-.5,y:to.y-.5},width*.25,'#a79d73b0');
    }
    for(const [i,b] of path.branches.entries()){
     const age=time-b.time-.08,progress=growthAt(age,0).branch;if(progress<=0)continue;
     let prev=branchPoint(b,0,w,h,time);
     for(let j=1;j<=32;j++){const u=Math.min(j/32,progress),at=branchPoint(b,u,w,h,time);segment(prev,at,2.15*(1-u)+.3,'#62654adc');prev=at;if(j/32>progress)break;}
     for(let j=1;j<=9;j++){
      const u=.14+j*.082,{leaf:bloom}=growthAt(age,u);if(bloom<=0)continue;
      const p=branchPoint(b,u,w,h,time),q=branchPoint(b,u+.015,w,h,time),tangent=Math.atan2(q.y-p.y,q.x-p.x),side=j%2?1:-1;
      const twig=smooth((age-u*.8-.12)/.3),length=10+b.seed*12,dir=tangent+side*.65;
      const tip={x:p.x+Math.cos(dir)*length*twig,y:p.y+Math.sin(dir)*length*twig};segment(p,tip,.55,'#787c57');
      const leafAngle=dir+side*.3+.35;paintedLeaf(g,sprites[(i+j)%6],tip.x,tip.y,leafAngle,34+b.seed*25,bloom,time,i+j);leaves++;
      if(j%3===0)paintedLeaf(g,sprites[(i+j+2)%6],p.x,p.y,tangent-side*.9,27+b.seed*10,bloom,time,i-j);
     }
    }
   }
   const tip=paths.at(-1)?.points.at(-1);c.dataset.tip=tip?`${tip.x.toFixed(4)},${tip.y.toFixed(4)}`:'';c.dataset.input=`${a.x.toFixed(4)},${a.y.toFixed(4)}`;c.dataset.growthPaths=String(paths.length);c.dataset.grownLeaves=String(leaves);c.dataset.artReady=String(sprites.filter(Boolean).length);raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);return()=>{dead=true;cancelAnimationFrame(raf);ro.disconnect();};
 },[input]);
 return <canvas ref={ref} className="ink-growth willow-growth" aria-hidden="true"/>;
}
