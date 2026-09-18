import {useEffect,useRef,useState} from 'react';
import gsap from 'gsap';
import {useGSAP} from '@gsap/react';
import {StoryAtmosphere} from './StoryAtmosphere.jsx';
import {LivingNature} from './LivingNature.jsx';
import {WillowGrowth} from './WillowGrowth.jsx';
import {LivingBackdrop} from './LivingBackdrop.jsx';
import {LivingPlant} from './LivingPlant.jsx';
import {LivingFigure} from './LivingFigure.jsx';
import {SceneLife} from './SceneLife.jsx';
import {scenePose,chapterStep,sceneVerses} from './storyMotion.js';
gsap.registerPlugin(useGSAP);
// V28 uses a local cloth rig for painted figures, separate from camera motion.
const worlds=[
 {name:'踏山行',act:'引风生枝',hint:'在景中拖曳 · 松手叶舒',reply:'山风已起，落叶随行',land:'pass',detail:'maple',subject:'warrior-v20',setting:'pine-crag-v22',beats:['断阶','问路','取舍','涉险','向前']},
 {name:'渡旧尘',act:'与鹤乘风',hint:'按住景物疾飞 · 松手滑翔',reply:'一圈水纹，渡向远山',land:'river',detail:'cranes',subject:'ferry-v20',setting:'reeds-mooring-v22',beats:['候渡','旧账','过江','回望','归岸']},
 {name:'问剑心',act:'拂刃见锋',hint:'左右拖动 · 改变剑锋角度',reply:'锋光已过，剑势留驻',land:'valley',detail:'ribbon',subject:'sword-v14',setting:'bamboo-arc-v22',beats:['藏锋','问心','试刃','收剑','余音']}
];
export function StoryExperience({story,collected,onBookmark,motion=true,onToggleMotion}){
 const ref=useRef(null),drag=useRef(null),[step,setStep]=useState(0),[full,setFull]=useState(false),[action,setAction]=useState(0),[angle,setAngle]=useState(0),[pulse,setPulse]=useState({id:0,x:.35,y:.7});
 const index=story.id==='autumn'?0:story.id==='ferry'?1:2,w=worlds[index],pose=scenePose(index,step);
 const input=useRef({held:false,x:.5,y:.5,samples:[]});
 const verseTimeline=useRef(null);
 useEffect(()=>{if(!motion)verseTimeline.current?.progress(1).pause();},[motion]);
 useEffect(()=>{const release=()=>{input.current.held=false;drag.current=null;};window.addEventListener('blur',release);document.addEventListener('visibilitychange',release);if(!motion)release();return()=>{release();window.removeEventListener('blur',release);document.removeEventListener('visibilitychange',release);};},[motion]);
 // Persistent chapter state is separate from transient reveals; cleanup cannot rewind the scene.
 useGSAP(()=>{if(!motion||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  verseTimeline.current=gsap.timeline().fromTo('.scene-verse span',{opacity:0,y:18,rotation:2},{opacity:1,y:0,rotation:0,duration:.9,stagger:.06,ease:'power2.out'},.35).fromTo('.voyage-beat',{opacity:0},{opacity:1,duration:.7},.6);
 },{scope:ref,dependencies:[step,full],revertOnUpdate:true});
 function changeStep(next){if(next===step)return;setStep(next);setAction(v=>v+1);setPulse(v=>({id:v.id+1,x:.62,y:.71}));if(index===2)setAngle([-12,8,-20,3][next]||0);}
 function activate(x=index===1?.72:.35,y=.72){if(index===0)input.current.demo=(input.current.demo||0)+1;setAction(v=>v+1);setPulse(v=>({id:v.id+1,x,y}));if(index===2)setAngle(v=>v>=12?-12:v+12);}
 function locate(e,r=drag.current?.rect||e.currentTarget.getBoundingClientRect()){input.current.x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));input.current.y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));}
 function sample(flags={}){const a=input.current;a.samples.push({x:a.x,y:a.y,...flags});if(a.samples.length>512)a.samples.splice(1,a.samples.length-512);}
 function down(e){if(e.button!==0||e.target.closest('button')||!motion)return;const rect=e.currentTarget.getBoundingClientRect();locate(e,rect);input.current.held=true;drag.current={x:e.clientX,angle,rect,windAt:0};if(index===0)sample({start:true});e.currentTarget.setPointerCapture(e.pointerId);if(index===1)activate(input.current.x,input.current.y);}
 function move(e){locate(e);if(!drag.current)return;const dx=e.clientX-drag.current.x;if(index===2)setAngle(Math.max(-28,Math.min(28,drag.current.angle+dx*.12)));if(index===0){const points=e.nativeEvent.getCoalescedEvents?.()||[];for(const p of points){locate(p,drag.current.rect);sample();}locate(e);sample();if(Math.abs(dx)>60&&performance.now()-drag.current.windAt>160){setAction(v=>v+1);drag.current.windAt=performance.now();drag.current.x=e.clientX;}}}
 function up(e){if(input.current.held&&index===0){locate(e);sample({end:true});}input.current.held=false;if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);drag.current=null;}
 function gaze(e){if(!motion||e.pointerType==='touch'||matchMedia('(prefers-reduced-motion: reduce)').matches)return;const r=e.currentTarget.getBoundingClientRect();ref.current.style.setProperty('--gaze',`${((e.clientX-r.left)/r.width-.5)*18}px`);}
 return <section ref={ref} className={`voyage voyage-${index}`} data-step={step} data-full={full} data-action={action} data-motion={motion?'on':'off'} style={{'--camera-x':`${pose.x}%`,'--camera-y':`${pose.y}%`,'--camera-scale':pose.scale,'--blade-angle':`${angle}deg`,'--wind':`${action%2?5:-2}deg`}} onPointerMove={gaze} onPointerLeave={()=>ref.current.style.setProperty('--gaze','0px')}>
  <div className="voyage-stage" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up}>
   <div className="voyage-camera" data-camera={JSON.stringify(pose)}>
    <LivingBackdrop className="voyage-land" src={`/assets/${w.land}-v23.webp`} motion={motion} kind={index}/>
    {index===0?<img className="voyage-setting" src={`/assets/${w.setting}.webp`} alt="" draggable="false"/>:<LivingPlant className="voyage-setting" src={`/assets/${w.setting}.webp`} motion={motion} kind={index}/>}
    <div className="voyage-actor">{index<2?<LivingFigure src={`/assets/${w.subject}.webp`} motion={motion} kind={index}/>:<img src={`/assets/${w.subject}.webp`} alt="" draggable="false"/>}</div>
    {index===2&&<LivingPlant className="voyage-detail" src={`/assets/${w.detail}-v23.webp`} motion={motion} kind={3}/>}
   </div><StoryAtmosphere kind={index} pulse={pulse} motion={motion}/>
   {index<2&&<LivingNature kind={index} motion={motion} impulse={action} input={input}/>}
   <SceneLife kind={index} motion={motion} input={input}/>
   {index===0&&<WillowGrowth input={input} motion={motion}/>}
  </div>
  <div className="voyage-curtain" aria-hidden="true"/>
  <span className="voyage-title-art" aria-hidden="true">{w.name}</span>
  <button className="voyage-motion" onClick={onToggleMotion} aria-pressed={!motion}>{motion?'静观此境':'风起此境'}</button>
  <div className="voyage-content"><p className="voyage-kicker">{story.kind} / {String(step+1).padStart(2,'0')} · {w.beats[step]||'归途'}</p><h2 id="reader-title" className="sr-only">{story.title}</h2>
   <p className="scene-verse" aria-label={sceneVerses[index][step]}>{[...sceneVerses[index][step]].map((char,i)=><span key={`${step}-${i}`} aria-hidden="true">{char}</span>)}</p>
   <div className="voyage-beat" aria-live="polite">{full?story.body.map((text,i)=><p key={i}>{text}</p>):<p>{story.body[step].split('。')[0]}。</p>}</div>
   <div className="voyage-actions"><button onClick={()=>setFull(v=>!v)} aria-expanded={full}>{full?'收起长卷':'展开原文'}</button><button aria-pressed={collected} onClick={onBookmark}>{collected?'已收书签':'收于书签'}</button></div>
  </div>
  <button className="voyage-gesture" onClick={()=>activate()}><span>{w.act}</span><small>{w.hint}</small></button>
  <span className="sr-only" role="status">{action?w.reply:'可探索场景，也可直接切换章节'}</span>
  <nav className="voyage-path" aria-label="场景章节"><button aria-label="上一境" disabled={step===0} onClick={()=>changeStep(chapterStep(step,-1,story.body.length))}>←</button><div>{story.body.map((_,i)=><button key={i} aria-label={`第${i+1}境：${w.beats[i]||'归途'}`} aria-current={i===step?'step':undefined} onClick={()=>changeStep(i)}><small>{String(i+1).padStart(2,'0')}</small><span>{w.beats[i]||'归途'}</span></button>)}</div><button aria-label="下一境" disabled={step===story.body.length-1} onClick={()=>changeStep(chapterStep(step,1,story.body.length))}>→</button></nav>
 </section>;
}
