import {useRef,useImperativeHandle,useEffect} from 'react';
import {flushSync} from 'react-dom';
import gsap from 'gsap';
import {useGSAP} from '@gsap/react';
import {ART_COVER as LEAF_COVER,ART_END as LEAF_END} from './artTransitionTiming.js';
export function LeafCurtain({controller,motion}){
 const root=useRef(null),canvas=useRef(null),job=useRef(null),timeline=useRef(null),engine=useRef(null),loading=useRef(null);
 const {contextSafe}=useGSAP({scope:root});
 useEffect(()=>{let alive=true;loading.current=import('./artTransitionRenderer.js').then(m=>alive?m.createArtTransition(canvas.current):null).then(e=>{if(!alive){e?.dispose();return null;}engine.current=e;return e;}).catch(()=>null);return()=>{alive=false;engine.current?.dispose();engine.current=null;};},[]);
 function cover(){const j=job.current;if(!j||j.covered)return;j.covered=true;flushSync(j.commit);root.current.close();root.current.showModal();}
 function finish(){if(!job.current)return;cover();timeline.current?.kill();root.current.close();job.current=null;document.querySelector('.reader[open] .icon-button')?.focus({preventScroll:true});}
 const play=contextSafe(()=>{if(!job.current)return;if(!engine.current){const commit=job.current.commit;job.current=null;commit();return;}
  const state={t:0},theme=job.current.theme;root.current.showModal();engine.current.resize();engine.current.draw(0,theme);
  timeline.current=gsap.timeline({defaults:{ease:'none'},onComplete:finish}).addLabel('gather').to(state,{t:LEAF_COVER,duration:LEAF_COVER,onUpdate:()=>engine.current?.draw(state.t,theme)},'gather').call(cover).addLabel('individual-wind').to(state,{t:LEAF_END,duration:LEAF_END-LEAF_COVER,onUpdate:()=>engine.current?.draw(state.t,theme)},'individual-wind');
 });
 function enter(commit,theme='autumn'){if(job.current)return;if(!motion||matchMedia('(prefers-reduced-motion: reduce)').matches){commit();return;}job.current={commit,theme,covered:false};if(engine.current)play();else loading.current?.then(play);}
 useImperativeHandle(controller,()=>({enter}),[motion]);
 useGSAP(()=>()=>{timeline.current?.kill();job.current=null;if(root.current?.open)root.current.close();},{scope:root});
 return <dialog ref={root} className="leaf-curtain" aria-label="正在入境" onCancel={e=>{e.preventDefault();finish();}}><canvas ref={canvas} aria-hidden="true"/><button onClick={finish}>略过转场</button></dialog>;
}
