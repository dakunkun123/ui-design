import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { windAt, branchBend, createLeaf, stepLeaf, makeChain, stepChain, clamp } from './windPhysics.mjs';
gsap.registerPlugin(useGSAP);
const airborne = new Set();
const slots = [{x:9.5,y:93,angle:15},{x:34.6,y:79,angle:-24},{x:51.7,y:85.4,angle:32},{x:69.6,y:73,angle:-12},{x:1.6,y:90,angle:21},{x:96.7,y:60,angle:-30},{x:51.5,y:66.2,angle:8},{x:33.3,y:64,angle:24}];
export function SpatialScene({kind='hero', motion, suspended=false}) {
  const rootRef=useRef(null);
  const [ready,setReady]=useState(false), [failed,setFailed]=useState(false);
  const hasBranch=kind!=='sword';
  const fallback=kind==='journal'?'story-ink':kind==='sword'?'sword-ink':'hero-ink';
  useEffect(()=>{
    let cancelled=false;
    Promise.all([...rootRef.current.querySelectorAll('.scene-assets img')].map(img=>img.decode()))
      .then(()=>{if(!cancelled)setReady(true);}).catch(()=>{if(!cancelled)setFailed(true);});
    return()=>{cancelled=true;};
  },[]);
  useGSAP(()=>{
    if(!ready||failed) return;
    const root=rootRef.current, host=root.closest('section')||root;
    const camera=root.querySelector('.scene-camera'), planes=[...root.querySelectorAll('[data-depth]')];
    const inkCurrent=root.querySelector('.ink-current');
    const anchors=[...root.querySelectorAll('.leaf-anchor')];
    const branch=root.querySelector('.branch-art'), branchCanvas=root.querySelector('.branch-canvas');
    const bctx=branchCanvas?.getContext('2d');
    const tassel=root.querySelector('.tassel-texture'), tasselCanvas=root.querySelector('.tassel-canvas');
    const tctx=tasselCanvas?.getContext('2d');
    const waterCanvas=root.querySelector('.water-effects'), wctx=waterCanvas?.getContext('2d');
    const chain=makeChain(), leaves=[], ripples=[];
    let elapsed=0, next=1.8, cursor=0, visible=false, running=false, disposed=false, accumulator=0;
    let width=1,height=1;
    const pointer={x:0,y:0}, target={x:0,y:0};
    const mobile=window.matchMedia('(max-width:760px)'), fine=window.matchMedia('(hover:hover) and (pointer:fine)');
    const saved=planes.map(el=>[el,el.style.transform]);
    function drawBranch(t){
      if(!bctx) return;
      const w=branchCanvas.width,h=branchCanvas.height, sw=branch.naturalWidth,sh=branch.naturalHeight;
      bctx.clearRect(0,0,w,h);
      // Texture columns share a continuous bend curve, with the right-hand root fixed.
      const count=100,strip=w/count;
      for(let i=0;i<count;i++){
        const u=i/count,a=branchBend(u,t),b=branchBend((i+1)/count,t);
        bctx.save();bctx.setTransform(1,(b-a)/strip,0,1,i*strip,a);
        bctx.drawImage(branch,sw*u,0,sw/count+.4,sh,0,0,strip+.4,h);bctx.restore();
      }
      const scale=branchCanvas.clientWidth/w;
      anchors.forEach((a,i)=>{a.style.transform=`translateY(${branchBend(slots[i].x/100,t)*scale}px)`;});
      root.dataset.branchBend=branchBend(.1,t).toFixed(2);
    }
    function drawTassel(){
      if(!tctx)return;
      tctx.clearRect(0,0,600,330);
      tctx.save();tctx.translate(150,0);
      const sw=tassel.naturalWidth,sh=tassel.naturalHeight;
      for(let i=0;i<chain.length-1;i++){
        const a=chain[i],b=chain[i+1],angle=Math.atan2(b.y-a.y,b.x-a.x)-Math.PI/2;
        tctx.save();tctx.translate(a.x,a.y);tctx.rotate(angle);
        tctx.drawImage(tassel,0,sh*i/(chain.length-1),sw,sh/(chain.length-1),-65,0,130,Math.hypot(b.x-a.x,b.y-a.y)+.5);tctx.restore();
      }
      tctx.restore();
      root.dataset.tasselTip=chain.at(-1).x.toFixed(2);
    }
    function clear(reset=true){
      leaves.forEach(s=>{s.el.remove();airborne.delete(s.el);});leaves.length=0;ripples.length=0;
      wctx?.clearRect(0,0,width,height);root.dataset.airborne='0';root.dataset.ripples='0';
      if(reset){anchors.forEach(a=>{a.style.visibility='';a.dataset.used='';});cursor=0;next=elapsed+1.8;}
    }
    function measure(){
      clear(false);width=root.clientWidth;height=root.clientHeight;
      if(waterCanvas){const dpr=Math.min(window.devicePixelRatio||1,1.5);waterCanvas.width=Math.round(width*dpr);waterCanvas.height=Math.round(height*dpr);wctx?.setTransform(dpr,0,0,dpr,0,0);}
    }
    function emit(){
      if(!hasBranch||cursor>=anchors.length||airborne.size>=(mobile.matches?2:5))return;
      const index=cursor++,anchor=anchors[index],base=root.getBoundingClientRect(),point=anchor.getBoundingClientRect();
      const img=document.createElement('img');img.src='/assets/maple-leaf-v2.webp';img.alt='';img.className='falling-leaf';img.dataset.source=String(index);
      img.style.width=`${anchor.querySelector('img').offsetWidth}px`;root.querySelector('.leaf-flight-layer').appendChild(img);
      const s=createLeaf(point.left-base.left,point.top-base.top,index,windAt(elapsed));
      const u=slots[index].x/100;
      s.vy=(branchBend(u,elapsed+.01)-branchBend(u,elapsed-.01))/.02*(branchCanvas.clientWidth/branchCanvas.width)+2;
      s.el=img;s.rotation=slots[index].angle;
      s.water={left:width*(kind==='journal'?.59:.88),right:width*.995,y:height*(.935+(index%3)*.009)};
      anchor.style.visibility='hidden';anchor.dataset.used='true';leaves.push(s);airborne.add(img);
    }
    function drawWater(dt){
      if(!wctx)return;
      wctx.clearRect(0,0,width,height);
      for(let i=ripples.length-1;i>=0;i--){
        const r=ripples[i];r.age+=dt;if(r.age>4.5){ripples.splice(i,1);continue;}
        wctx.save();wctx.beginPath();wctx.rect(width*(kind==='journal'?.58:.86),height*.7,width,height*.3);wctx.clip();
        for(let ring=0;ring<3;ring++){
          const age=r.age-ring*.24;if(age<0)continue;
          const radius=3+age*20,alpha=Math.max(0,1-age/4.2)*.44;
          wctx.strokeStyle=`rgba(45,60,57,${alpha})`;wctx.lineWidth=.7;
          wctx.beginPath();wctx.ellipse(r.x,r.y,radius,radius*.22,0,0,Math.PI*2);wctx.stroke();
        }
        wctx.restore();
      }
      // Low-contrast ink-silver glints follow the water plane, not neon particles.
      for(let i=0;i<5;i++){
        const x=width*(.88+i*.018)+Math.sin(elapsed*.24+i)*width*.008,y=height*(.935+i*.009);
        wctx.strokeStyle=`rgba(71,87,80,${.045+.04*Math.sin(elapsed*.8+i)**2})`;wctx.lineWidth=.8;
        wctx.beginPath();wctx.moveTo(x,y);wctx.bezierCurveTo(x+12,y-2,x+32,y+2,x+50,y);wctx.stroke();
      }
      root.dataset.ripples=String(ripples.length);
    }
    function tick(_,delta){
      if(!running||disposed)return;
      const dt=Math.min(delta/1000,.05);elapsed+=dt;const wind=windAt(elapsed);
      pointer.x+=(target.x-pointer.x)*Math.min(1,dt*4);pointer.y+=(target.y-pointer.y)*Math.min(1,dt*4);
      const px=pointer.x+(mobile.matches?Math.sin(elapsed*.28)*.32:Math.sin(elapsed*.2)*.09),py=pointer.y;
      camera.style.transform=`rotateX(${-py*2.8}deg) rotateY(${px*5.5}deg)`;
      planes.forEach(el=>{const d=Number(el.dataset.depth);el.style.transform=`translate3d(${px*d}px,${py*d*.48}px,${el.dataset.z||0}px)`;});
      drawBranch(elapsed);accumulator+=dt;
      while(accumulator>=1/120){stepChain(chain,1/120,wind);accumulator-=1/120;}
      drawTassel();if(elapsed>=next){emit();next=elapsed+(mobile.matches?5.4:3.6);}
      inkCurrent.style.transform=`translateX(${Math.sin(elapsed*.23)*16}px) scaleX(${1+Math.sin(elapsed*.37)*.08})`;
      inkCurrent.style.opacity=String(.035+.018*(1+Math.sin(elapsed*.6)));
      for(let i=leaves.length-1;i>=0;i--){
        const s=leaves[i];
        if(stepLeaf(s,dt,wind,s.water)){ripples.push({x:s.x,y:s.y,age:0});root.dataset.splashes=String(Number(root.dataset.splashes||0)+1);}
        const afloat=s.phase==='water',ry=afloat?8:Math.sin(s.age*2.4+s.seed)*72,rx=afloat?76:Math.sin(s.age*1.7+s.seed)*48;
        s.el.dataset.phase=s.phase;
        const orientation=afloat?`rotateX(76deg) rotateZ(${s.rotation+s.roll}deg)`:`rotateZ(${s.rotation+s.roll}deg) rotateY(${ry}deg) rotateX(${rx}deg)`;
        s.el.style.transform=`translate3d(${s.x}px,${s.y}px,0) translate(-50%,-6%) ${orientation}`;
        s.el.style.opacity=afloat?String(clamp(1-s.waterAge/5,0,1)):'1';
        if(s.y>height+80||s.x>width+90||s.x < -90||s.waterAge>5||s.age>24){s.el.remove();airborne.delete(s.el);leaves.splice(i,1);}
      }
      root.dataset.airborne=String(leaves.length);drawWater(dt);
    }
    function sync(){
      const value=visible&&!document.hidden&&motion&&!suspended;
      if(value===running)return;running=value;root.dataset.running=String(value);
      if(value)gsap.ticker.add(tick);else gsap.ticker.remove(tick);
    }
    const observer=new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(!visible)clear();sync();});observer.observe(root);
    const move=e=>{if(!running||!fine.matches||e.pointerType==='touch')return;const r=host.getBoundingClientRect();target.x=clamp((e.clientX-r.left)/r.width*2-1,-1,1);target.y=clamp((e.clientY-r.top)/r.height*2-1,-1,1);};
    const leave=()=>{target.x=target.y=0;};
    measure();drawBranch(0);drawTassel();root.classList.add('textures-ready');
    host.addEventListener('pointermove',move);host.addEventListener('pointerleave',leave);window.addEventListener('resize',measure);document.addEventListener('visibilitychange',sync);
    return()=>{disposed=true;gsap.ticker.remove(tick);observer.disconnect();clear();host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',leave);window.removeEventListener('resize',measure);document.removeEventListener('visibilitychange',sync);saved.forEach(([el,t])=>{el.style.transform=t;});camera.style.transform='';root.dataset.running='false';root.classList.remove('textures-ready');};
  },{scope:rootRef,dependencies:[ready,failed,motion,suspended],revertOnUpdate:true});
  const error=()=>setFailed(true);
  return <div ref={rootRef} className={`spatial-scene scene-${kind} ${ready&&!failed?'is-ready':''}`} aria-hidden="true" data-scene={kind} data-running="false">
    <svg width="0" height="0" style={{position:'absolute'}} aria-hidden="true"><defs><filter id={`silk-coverage-${kind}`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -.23386 -.78672 -.07942 0 1.05"/><feComposite in2="SourceAlpha" operator="in"/></filter></defs></svg>
    <img className="scene-fallback" src={`/assets/${fallback}.webp`} alt=""/>
    {!failed&&<div className="scene-assets"><div className="scene-camera">
      <div className="landscape-depth" data-depth="-12" data-z="-90"><img className="landscape-art" src="/assets/landscape-v2.webp" alt="" onError={error}/></div>
      <div className="subject-depth" data-depth="22" data-z="55">
        {kind==='journal'?<img className="subject-art" src="/assets/wanderer-v3.webp" alt="" onError={error}/>:<>
          <div className="sword-rig"><img className="new-sword" src="/assets/sword-v14.webp" alt="" onError={error}/><div className="tassel-rig tassel-v14"><img className="tassel-texture" src="/assets/tassel-v14.webp" style={{filter:`url(#silk-coverage-${kind})`}} alt="" onError={error}/><canvas className="tassel-canvas" width="600" height="330"/></div></div>
          {kind==='hero'&&<img className="rock-art" src="/assets/rock-v3.webp" alt="" onError={error}/>}
        </>}
      </div>
      {hasBranch&&<div className="canopy-depth" data-depth="45" data-z="125"><div className="branch-wind">
        <img className="branch-art" src="/assets/maple-branch-v2.webp" alt="" onError={error}/><canvas className="branch-canvas" width="1000" height="500"/>
        {slots.map((s,i)=><span key={i} className="leaf-anchor" style={{left:`${s.x}%`,top:`${s.y}%`}}><img className="attached-leaf" src="/assets/maple-leaf-v2.webp" alt="" style={{transform:`translate(-50%,-6%) rotate(${s.angle}deg)`}} onError={error}/></span>)}
      </div></div>}
    </div><img className="ink-current" src="/assets/ink-brush.webp" alt="" onError={error}/><canvas className="water-effects"/></div>}
    <div className="leaf-flight-layer"/>
  </div>;
}
