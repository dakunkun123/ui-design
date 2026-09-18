import {useEffect,useRef,useState} from 'react';
import './scene-controls.css';

const details={whole:'一器一生，近观方知其骨。',pommel:'朱环系细绳，云纹收于一握之间。',edge:'银刃留一线朱痕，锋芒不必厚重。',tassel:'细丝分束，风过有先后，风歇留余韵。'};
export function SceneControls({kind,motion,available}){
 const [wind,setWind]=useState(1),[focus,setFocus]=useState('whole'),[angle,setAngle]=useState(0),[status,setStatus]=useState(''),[fine,setFine]=useState(false);
 const [open,setOpen]=useState(false),[magnify,setMagnify]=useState(1);
 const ref=useRef(null),angleRef=useRef(angle);angleRef.current=angle;
 useEffect(()=>{if(kind!=='sword'||!available)return;const figure=ref.current.closest('section').querySelector('.sword-art');
  const wheel=e=>{if(e.ctrlKey||e.metaKey||document.documentElement.dataset.routing==='true')return;e.preventDefault();setMagnify(v=>Math.max(1,Math.min(1.35,v-e.deltaY*(e.deltaMode===1?.018:.0008))));};
  figure.addEventListener('wheel',wheel,{passive:false});return()=>figure.removeEventListener('wheel',wheel);
 },[kind,available]);
 const send=(action,value)=>ref.current?.closest('section')?.querySelector('.gpu-surface')?.dispatchEvent(new CustomEvent('ink-scene-control',{detail:{action,value}}));
 useEffect(()=>{if(kind!=='sword')return;const section=ref.current?.closest('section');section.dataset.interacting=String(open);send('magnify',magnify);},[open,magnify,kind]);
 useEffect(()=>{if(kind!=='sword')return;const section=ref.current.closest('section'),figure=section.querySelector('.sword-art');
  const activate=()=>{setOpen(true);setMagnify(v=>v>1?1:1.25);};
  const key=e=>{if(e.target.closest('input'))return;if(e.key==='Escape'){setOpen(false);setMagnify(1);setFocus('whole');setAngle(0);ref.current.querySelector('.inspect-invite')?.focus();}if(e.target===figure&&e.key==='Home'){setMagnify(1);setFocus('whole');}if(e.target===figure&&(e.key==='+'||e.key==='='||e.key==='-')){e.preventDefault();setOpen(true);setMagnify(v=>Math.max(1,Math.min(1.35,v+(e.key==='-'?-.05:.05))));}};
  const inspect=e=>{if(e.detail.action==='inspect'&&e.detail.value!=='whole')setOpen(true);};
  const route=()=>{setOpen(false);setMagnify(1);setFine(false);setFocus('whole');setAngle(0);};
  const routeFrame=e=>{if(e.detail.progress>=0&&e.detail.progress<.04)route();};
  window.addEventListener('ink-route-frame',routeFrame);
  figure.addEventListener('dblclick',activate);section.addEventListener('keydown',key);section.querySelector('.gpu-surface')?.addEventListener('ink-scene-control',inspect);window.addEventListener('hashchange',route);
  return()=>{figure.removeEventListener('dblclick',activate);section.removeEventListener('keydown',key);section.querySelector('.gpu-surface')?.removeEventListener('ink-scene-control',inspect);window.removeEventListener('hashchange',route);window.removeEventListener('ink-route-frame',routeFrame);};
 },[kind]);
 useEffect(()=>{if(available){send('wind',wind);send('inspect',focus);send('angle',angle*Math.PI/180);}},[available,wind,focus,angle]);
 useEffect(()=>{
  if(kind!=='sword'||!available)return;
  const figure=ref.current?.closest('section')?.querySelector('.sword-art');if(!figure)return;
  let drag=null;
  const down=e=>{if(e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,angle:angleRef.current,captured:false};};
  const move=e=>{if(!drag||drag.id!==e.pointerId)return;if(!(e.buttons&1)){drag=null;return;}const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
   if(!drag.captured){if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>7){drag=null;return;}if(Math.abs(dx)<7)return;figure.setPointerCapture(e.pointerId);drag.captured=true;}
   setAngle(Math.round(Math.max(-28,Math.min(28,drag.angle+dx*.10))));
  };
  const end=e=>{if(drag?.id===e.pointerId){if(figure.hasPointerCapture(e.pointerId))figure.releasePointerCapture(e.pointerId);drag=null;}};
  const key=e=>{if(e.target!==figure)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setAngle(v=>Math.max(-28,Math.min(28,v+(e.key==='ArrowLeft'?-1:1))));}else if(e.key==='Home'){e.preventDefault();setAngle(0);}};
  figure.addEventListener('pointerdown',down);figure.addEventListener('pointermove',move);figure.addEventListener('pointerup',end);figure.addEventListener('pointercancel',end);figure.addEventListener('lostpointercapture',end);figure.addEventListener('keydown',key);
  return()=>{if(drag&&figure.hasPointerCapture(drag.id))figure.releasePointerCapture(drag.id);figure.removeEventListener('pointerdown',down);figure.removeEventListener('pointermove',move);figure.removeEventListener('pointerup',end);figure.removeEventListener('pointercancel',end);figure.removeEventListener('lostpointercapture',end);figure.removeEventListener('keydown',key);};
 },[kind,available]);
 const blocked=!motion||!available;
 useEffect(()=>{const surface=ref.current?.closest('section')?.querySelector('.gpu-surface');const sync=e=>{if(e.detail.action==='inspect')setFocus(e.detail.value);};const reset=()=>{setFocus('whole');setAngle(0);};surface?.addEventListener('ink-scene-control',sync);surface?.addEventListener('ink-inspection-reset',reset);return()=>{surface?.removeEventListener('ink-scene-control',sync);surface?.removeEventListener('ink-inspection-reset',reset);};},[]);
 return <div ref={ref} className={`scene-controls controls-${kind}`}>
  {kind==='hero'?<>
   <div className="wind-controls"><span className="control-seal" aria-hidden="true">借风</span><div className="wind-options" role="group" aria-label="山间风力">{[[0,'风歇'],[1,'微风'],[2.2,'长风']].map(([value,label])=><button key={label} disabled={blocked} aria-pressed={wind===value} onClick={()=>{setWind(value);setStatus(`${label}已入山间`);}}>{label}</button>)}</div><button disabled={blocked} className="scene-action" onClick={()=>{send('gust');setStatus('一阵风过，枝叶与墨穗同动');}}>起一阵风</button><button disabled={blocked} className="scene-action" onClick={()=>{send('water');setStatus('一滴入水，涟漪渐远');}}>点水</button></div>
   <p className="scene-hint" role="status">{!available?'静画模式 · 可继续阅剑与读文':!motion?'已静观山河 · 开启动效后可借风点水':status||'借风动枝叶 · 轻点画中水面，见一圈涟漪'}</p>
  </>:<>
   <button className="inspect-invite" aria-expanded={open} aria-controls="contextual-sword-tools" onClick={()=>{setOpen(!open);if(open){setMagnify(1);setFocus('whole');setAngle(0);}}}><span>{open?'收剑归景':'执剑近观'}</span><small>{open?'ESC 归景':'滚轮近观 · 拖动转剑'}</small></button>
   <div id="contextual-sword-tools" hidden={!open}>
   <div className="inspect-heading"><span className="inspect-stamp" aria-hidden="true">观器</span><span>一寸锋芒 · 一缕风</span><button aria-expanded={fine} aria-controls="sword-fine-controls" onClick={()=>setFine(!fine)}>微调 {fine?'−':'＋'}</button></div>
   <div className="inspect-options" role="group" aria-label="观览剑器部位">{[['whole','全貌'],['pommel','环首'],['edge','锋刃'],['tassel','墨穗']].map(([value,label])=><button key={value} aria-pressed={focus===value} onClick={()=>setFocus(value)}>{label}</button>)}</div>
   <p className="inspect-caption" aria-live="polite">{details[focus]}<button className="silk-action" disabled={blocked} onClick={()=>{send('gust');setStatus('风起细丝，渐次归静');}}>拂穗</button><span className="sr-only" role="status">{status}</span></p>
   <div className="inspect-angle" id="sword-fine-controls" hidden={!fine}><label htmlFor="sword-angle">转器</label><input id="sword-angle" type="range" min="-28" max="28" step="1" value={angle} disabled={!available} onChange={e=>setAngle(Number(e.target.value))} aria-valuetext={`${angle} 度`} /><output htmlFor="sword-angle">{angle}°</output><button onClick={()=>{setAngle(0);setFocus('whole');}}>复位</button></div>
   <p className="scene-hint" id="sword-drag-help">{available?'左右拖剑 · 方向键微调 · 移近墨穗借风':'静画模式 · 局部说明仍可阅读'}</p>
   <div className="inspect-zoom"><button disabled={!available||magnify>=1.35} onClick={()=>setMagnify(v=>Math.min(1.35,v+.1))} aria-label="放大剑">＋</button><span aria-live="polite">{magnify.toFixed(2)}×</span><button disabled={magnify<=1} onClick={()=>setMagnify(v=>Math.max(1,v-.1))} aria-label="缩小剑">−</button></div>
   </div>
  </>}
 </div>;
}
