import {loadInkSheet,drawInkSheet,releaseInkSheet} from './inkSheet.js';

export function createInkField(canvas){
 const ctx=canvas.getContext('2d');if(!ctx)return {point(){},stop(){},demo(){}};
 let w=1,h=1,raf=0,last=0,t=0,stopped=false,down=false,tx=.5,ty=.5,grab={x:.5,y:.5},visiblePointer=false,releaseAge=10,demoAge=-1;
 const nx=28,ny=10,nodes=Array.from({length:(nx+1)*(ny+1)},(_,i)=>({u:(i%(nx+1))/nx,v:Math.floor(i/(nx+1))/ny,x:0,y:0,vx:0,vy:0}));
 const reduced=()=>document.documentElement.dataset.motion==='off'||document.hidden;
 function rest(p){return {x:w*(.08+p.u*.84),y:h*(.06+p.v*.88)};}
 function resize(){const r=canvas.getBoundingClientRect();w=r.width;h=r.height;const d=Math.min(devicePixelRatio,1.5);canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);nodes.forEach(p=>Object.assign(p,rest(p),{vx:0,vy:0}));}
 function wake(){if(!raf&&!stopped){last=performance.now();raf=requestAnimationFrame(frame);}}
 const art=loadInkSheet(ok=>{if(stopped)return;canvas.dataset.inkAsset=ok?'ready':'failed';wake();});
 function input(p){if(reduced())return;if(p.down&&!down){grab={x:p.x,y:p.y};releaseAge=10;}if(!p.down&&down)releaseAge=0;tx=Math.max(0,Math.min(1,p.x));ty=Math.max(0,Math.min(1,p.y));down=!!p.down;visiblePointer=true;canvas.dataset.grab=String(down);}
 function frame(now){raf=0;if(stopped)return;const dt=Math.min(.025,(now-last)/1000||.016);last=now;const active=!reduced();if(active){t+=dt;releaseAge+=dt;
  if(demoAge>=0){demoAge+=dt;if(demoAge<1.2)input({x:.5+Math.sin(demoAge/1.2*Math.PI*.5)*.24,y:.5-Math.sin(demoAge/1.2*Math.PI*.5)*.22,down:true});else{input({x:tx,y:ty,down:false});demoAge=-1;}}
  for(const p of nodes){const r=rest(p),dx=(r.x/w-grab.x),dy=(r.y/h-grab.y),weight=Math.exp(-(dx*dx+dy*dy)/.07)*Math.sin(Math.PI*p.u)**.6*Math.sin(Math.PI*p.v)**.6;
   const desiredX=r.x+(down?(tx-grab.x)*w*weight:0),desiredY=r.y+(down?(ty-grab.y)*h*weight:0)+Math.sin(t*.8+p.u*7)*Math.sin(Math.PI*p.u)*3;
   p.vx+=(desiredX-p.x)*85*dt;p.vy+=(desiredY-p.y)*85*dt;const damp=Math.exp(-dt*9);p.vx*=damp;p.vy*=damp;p.x+=p.vx*dt;p.y+=p.vy*dt;
  }
 }
 ctx.clearRect(0,0,w,h);ctx.globalAlpha=.88;drawInkSheet(ctx,art,(u,v)=>nodes[Math.round(v*ny)*(nx+1)+Math.round(u*nx)],nx,ny);ctx.globalAlpha=1;
 if(canvas.dataset.inkAsset==='failed'){ctx.fillStyle='#384137';ctx.font='16px serif';ctx.textAlign='center';ctx.fillText('墨卷暂未载入，可继续入境',w/2,h/2);}
 if(visiblePointer&&!reduced()){
  ctx.strokeStyle='#9a4638';ctx.lineWidth=1;ctx.beginPath();ctx.arc(tx*w,ty*h,down?8:12,0,Math.PI*2);ctx.stroke();
  if(releaseAge<1){ctx.globalAlpha=1-releaseAge;ctx.beginPath();ctx.ellipse(tx*w,ty*h,14+releaseAge*45,7+releaseAge*18,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}
 }
 canvas.dataset.inkTime=t.toFixed(2);canvas.dataset.surface='connected';if(active)raf=requestAnimationFrame(frame);
 }
 const observer=new ResizeObserver(()=>{resize();wake();});observer.observe(canvas);resize();
 const visibility=()=>{if(document.hidden){down=false;demoAge=-1;canvas.dataset.grab='false';}wake();};
 document.addEventListener('visibilitychange',visibility);const preference=new MutationObserver(()=>{if(reduced()){down=false;demoAge=-1;}wake();});preference.observe(document.documentElement,{attributes:true,attributeFilter:['data-motion']});wake();
 return {point:input,nudge(p){if(p.down&&!down)input({x:.5,y:.5,down:true});input(p);},demo(){if(reduced())return;input({x:.5,y:.5,down:true});demoAge=0;},stop(){stopped=true;cancelAnimationFrame(raf);releaseInkSheet(ctx);art.onload=art.onerror=null;observer.disconnect();preference.disconnect();document.removeEventListener('visibilitychange',visibility);}};
}
