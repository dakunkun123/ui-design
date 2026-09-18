import {useEffect,useRef,useState} from 'react';
import gsap from 'gsap';
import {useGSAP} from '@gsap/react';
import {LivingBackdrop} from './LivingBackdrop.jsx';
import {JournalObject} from './JournalObject.jsx';
import {JournalWind} from './JournalWind.jsx';
import {journalWorlds,updateWind,pointerPosition} from './journalWorldModel.js';
gsap.registerPlugin(useGSAP);

export function JournalWorld({stories,onOpen,motion,suspended,onSettled,forceStatic}){
 const root=useRef(null),layers=useRef([]),timeline=useRef(null),previous=useRef(0),presented=useRef(false);
 const [index,setIndex]=useState(0),[status,setStatus]=useState(''),[visible,setVisible]=useState(true);
 const input=useRef({held:false,energy:0,pulse:0,x:.5,y:.5,tx:.5,ty:.5});
 const running=motion&&!suspended&&!forceStatic&&visible;
 const world=journalWorlds[index];
 useEffect(()=>{let dead=false;const ims=journalWorlds.map(w=>{const im=new Image();im.src=`/assets/${w.object}.webp`;return im;});Promise.all(ims.map(im=>im.decode().catch(()=>null))).then(()=>{if(!dead)onSettled('journal',ims.every(im=>im.naturalWidth)?'ready':'fallback');});return()=>{dead=true;};},[onSettled]);
 useEffect(()=>{const io=new IntersectionObserver(([e])=>setVisible(e.isIntersecting),{threshold:.03});io.observe(root.current);return()=>io.disconnect();},[]);
 useEffect(()=>{const release=()=>{input.current.held=false;};window.addEventListener('blur',release);document.addEventListener('visibilitychange',release);return()=>{window.removeEventListener('blur',release);document.removeEventListener('visibilitychange',release);};},[]);
 useEffect(()=>{
  if(!running){input.current={...input.current,held:false,pulse:0,energy:0};root.current.style.setProperty('--jx','0px');root.current.style.setProperty('--jy','0px');return;}
  let raf,last=0;function tick(t){const dt=Math.min(.04,(t-last)/1000||0);last=t;if(!document.hidden){input.current=updateWind(input.current,dt);const q=input.current;root.current.style.setProperty('--jx',`${(q.x-.5)*17}px`);root.current.style.setProperty('--jy',`${(q.y-.5)*10}px`);root.current.style.setProperty('--wind',q.energy.toFixed(3));root.current.dataset.energy=q.energy.toFixed(2);layers.current[index]?.querySelectorAll('.jw-glyph-inner').forEach((el,i)=>{const near=Math.max(0,1-Math.abs(q.x-(.27+i*.14))*3);el.style.transform=`translate(${(q.x-.5)*q.energy*near*9}px,${Math.sin(t*.0018+i)*q.energy*near*3}px) rotate(${(q.x-.5)*q.energy*near*1.4}deg)`;});}raf=requestAnimationFrame(tick);}raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
 },[running,index]);
 useGSAP(()=>{
  timeline.current?.kill();const old=previous.current,next=layers.current[index];previous.current=index;
  gsap.set(layers.current,{autoAlpha:0,zIndex:0});gsap.set(next,{autoAlpha:1,zIndex:2});
  const shouldEnter=motion&&!forceStatic&&!suspended&&(!presented.current||old!==index);
  if(!shouldEnter){gsap.set(next,{xPercent:0});gsap.set(next.querySelectorAll('.jw-glyph,.jw-caption,.jw-object'),{clearProps:'all'});return;}
  presented.current=true;
  const tl=gsap.timeline({defaults:{ease:'power3.inOut'}});timeline.current=tl;
  if(old!==index){const from=layers.current[old];gsap.set(from,{autoAlpha:1,zIndex:1});tl.to(from,{autoAlpha:0,xPercent:-journalWorlds[index].direction*2,duration:.72},0);}
  tl.fromTo(next,{autoAlpha:0,xPercent:journalWorlds[index].direction*2},{autoAlpha:1,xPercent:0,duration:1.05},0)
   .fromTo(next.querySelector('.jw-object'),{y:24,opacity:0},{y:0,opacity:1,duration:1.15},.16)
   .fromTo(next.querySelectorAll('.jw-glyph'),{clipPath:'inset(0 100% 0 0)',y:12},{clipPath:'inset(0 0% 0 0)',y:0,duration:.9,stagger:.10},.18)
   .fromTo(next.querySelector('.jw-caption'),{opacity:0,y:8},{opacity:1,y:0,duration:.5},.65);
  return()=>tl.kill();
 },{scope:root,dependencies:[index,motion,forceStatic,suspended],revertOnUpdate:true});
 function move(e){if(!running)return;const p=pointerPosition(e.clientX,e.clientY,root.current.getBoundingClientRect());input.current.tx=p.x;input.current.ty=p.y;}
 function down(e){if(!running||e.button!==0||e.target.closest('button,a'))return;move(e);input.current.held=true;root.current.setPointerCapture(e.pointerId);}
 function release(e){input.current.held=false;if(root.current.hasPointerCapture(e.pointerId))root.current.releasePointerCapture(e.pointerId);}
 function stir(){if(!running)return;input.current.pulse=2.5;setStatus(`${world.place.split(' · ')[0]}风起，字与景相应`);}
 return <article className="journal-world" ref={root} data-world={world.id} data-running={running} aria-label="山河故卷互动山水" onPointerMove={move} onPointerDown={down} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={()=>{input.current.held=false;}} onPointerLeave={()=>{if(!input.current.held){input.current.tx=.5;input.current.ty=.5;}}}>
  <header className="jw-heading"><p>卷二 / 江湖志</p><h2 id="journal-title">山河故卷<span>三境 · 一程江湖</span></h2></header>
  {journalWorlds.map((w,i)=><div key={w.id} className={`jw-scene jw-${w.id}`} ref={el=>layers.current[i]=el} aria-hidden={i!==index} inert={i!==index}>
   {forceStatic?<span className="jw-landscape" style={{backgroundImage:`url('/assets/${w.backdrop}.webp')`}} aria-hidden="true"/>:<LivingBackdrop src={`/assets/${w.backdrop}.webp`} className="jw-landscape" kind={i} motion={running&&i===index}/>}
   <div className="jw-atmosphere" aria-hidden="true"/>
   <p className="jw-place">{w.place}</p>
   <h3 className="jw-title" aria-label={w.title}>{[...w.title].map((char,j)=><span className="jw-glyph" key={j} aria-hidden="true"><span className="jw-glyph-inner">{char}</span></span>)}</h3>
   <div className="jw-object-depth" aria-hidden="true">{forceStatic?<div className="jw-object"><img src={`/assets/${w.object}.webp`} alt=""/></div>:<JournalObject src={`/assets/${w.object}.webp`} kind={i} input={input} motion={running&&i===index}/>}</div>
   <JournalWind kind={i} input={input} motion={running&&i===index}/>
   <div className="jw-caption"><p className="jw-story-title">{stories[i].title}</p><p>{stories[i].intro}</p><button onClick={()=>onOpen(stories[i])} className="jw-enter">入此境 <span aria-hidden="true">↗</span></button></div>
  </div>)}
  <div className="jw-sidenote" aria-hidden="true">山河不语<br/>行者有声</div>
  <footer className="jw-controls"><div className="jw-choices" role="group" aria-label="选择江湖篇章">{journalWorlds.map((w,i)=><button key={w.id} aria-pressed={i===index} onClick={()=>{setIndex(i);setStatus('');input.current.pulse=0;}}><small>0{i+1}</small><span>{w.label}</span><i aria-hidden="true"/></button>)}</div><div className="jw-gesture"><button disabled={!running} onClick={stir}>{world.action}<span aria-hidden="true"> ⤳</span></button><span>{running?world.hint:'静观山河 · 可自由切换篇章'}</span></div></footer>
  <p className="sr-only" role="status">{status||`${world.title} · ${stories[index].title}`}</p>
 </article>;
}
