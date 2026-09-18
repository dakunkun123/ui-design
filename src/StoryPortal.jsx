import {useRef} from 'react';
import gsap from 'gsap';
import {useGSAP} from '@gsap/react';
import {LivingNature} from './LivingNature.jsx';
import {LivingBackdrop} from './LivingBackdrop.jsx';
import {LivingPlant} from './LivingPlant.jsx';
import {LivingFigure} from './LivingFigure.jsx';
import {SceneLife} from './SceneLife.jsx';
export function StoryPortal({story,index,onOpen,motion}){
 const ref=useRef(null);
 useGSAP(()=>{if(motion&&!matchMedia('(prefers-reduced-motion: reduce)').matches)gsap.fromTo('.portal-caption',{opacity:0,y:16},{opacity:1,y:0,duration:.8});},{scope:ref});
 const enter=()=>onOpen(story);
 function move(e){if(!motion||e.pointerType==='touch')return;const r=e.currentTarget.getBoundingClientRect();ref.current.style.setProperty('--look-x',((e.clientX-r.left)/r.width-.5).toFixed(3));ref.current.style.setProperty('--look-y',((e.clientY-r.top)/r.height-.5).toFixed(3));}
 const reset=()=>{ref.current?.style.setProperty('--look-x','0');ref.current?.style.setProperty('--look-y','0');};
 return <button ref={ref} className={`story-portal portal-${index}`} onClick={enter} onPointerMove={move} onPointerLeave={reset} onBlur={reset} aria-label={`进入${story.title}`}>
  <span className="portal-space" aria-hidden="true">
   <LivingBackdrop className="portal-mountains" src={`/assets/${['pass','river','valley'][index]}-v23.webp`} motion={motion} kind={index}/>
   <span className="portal-halo"/>
   {index===0?<img className="portal-setting" src="/assets/pine-crag-v22.webp" alt="" loading="lazy"/>:<LivingPlant className="portal-setting" src={index===1?'/assets/reeds-mooring-v22.webp':'/assets/bamboo-arc-v22.webp'} motion={motion} kind={index}/>}
   {index<2?<LivingFigure className="portal-subject" src={['/assets/warrior-v20.webp','/assets/ferry-v20.webp'][index]} kind={index} motion={motion}/>:<img className="portal-subject" src="/assets/sword-v14.webp" alt="" loading="lazy"/>}
   <span className="portal-fog"/><span className="portal-edge-ink"/>
   {index<2&&<LivingNature kind={index} motion={motion} compact/>}
   <SceneLife kind={index} motion={motion} compact/>
   <span className="portal-glint"/>
   <span className="portal-word">{['行','渡','锋'][index]}</span>
  </span>
  <span className="portal-veil" aria-hidden="true"/>
  <span className="portal-caption"><span className="portal-index">0{index+1} / {story.kind}</span><span className="portal-art-title" aria-hidden="true">{[...['踏山行','渡旧尘','问剑心'][index]].map((char,i)=><span key={i} style={{'--glyph':i}}>{char}</span>)}</span><strong>{story.title}</strong><span className="portal-enter">入此境 <span aria-hidden="true">↗</span></span></span>
 </button>;
}
