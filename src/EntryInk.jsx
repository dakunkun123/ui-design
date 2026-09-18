import {useEffect,useRef,useState} from 'react';
import {createInkField} from './inkSurface.js';

export function EntryInk({count=4,loading=false,onExit}){
 const canvas=useRef(null),field=useRef(null),controller=useRef(null),exitRef=useRef(null);
 const [camera,setCamera]=useState(false),[status,setStatus]=useState('按住牵墨，松手归流。也可聚焦墨池后按方向键。');
 useEffect(()=>{field.current=createInkField(canvas.current);return()=>{field.current.stop();controller.current?.abort();};},[]);
 useEffect(()=>{if(!loading)exitRef.current?.focus();},[loading]);
 const stop=()=>{controller.current?.abort();controller.current=null;setCamera(false);field.current?.point({x:.5,y:.5,down:false});};
 useEffect(()=>{const hide=()=>{if(document.hidden){controller.current?.abort();setCamera(false);}};document.addEventListener('visibilitychange',hide);return()=>document.removeEventListener('visibilitychange',hide);},[]);
 async function start(){if(camera){stop();setStatus('摄像头已关闭，可继续用鼠标或触摸牵墨。');return;}const ac=new AbortController();controller.current=ac;setCamera(true);setStatus('准备手势识别，浏览器将询问摄像头权限…');
  try{const {startHandGesture}=await import('./handGesture.js');if(ac.signal.aborted)return;await startHandGesture({signal:ac.signal,onPoint:p=>field.current?.point(p),onStatus:s=>{if(ac.signal.aborted)return;const labels={'requesting-camera':'请在浏览器中允许摄像头；也可以关闭后用鼠标。',loading:'摄像头已开启，正在准备本地手势模型…',ready:'伸出一只手，捏合牵墨，张手释放。',tracking:'已识别手势 · 捏合牵墨，张手释放。',searching:'将一只手放到摄像头前，保持光线充足。',error:'手势暂不可用，请检查摄像头权限；鼠标与触摸不受影响。',stopped:'摄像头已关闭。'};setStatus(labels[s.state]||'手势已暂停。');if(s.state==='error'||s.state==='stopped')setCamera(false);}});}
  catch(e){if(!ac.signal.aborted){stop();setStatus('手势暂不可用，请检查摄像头权限；鼠标与触摸不受影响。');}}
 }
 const point=e=>{const r=canvas.current.getBoundingClientRect();field.current?.point({x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height,down:e.buttons===1});};
 return <div className="entry-ink-content">
  <span className="entry-seal" aria-hidden="true">试墨</span><h2>{loading?'候墨入境':'指间有山河'}</h2>
  <canvas ref={canvas} className="entry-ink-field" tabIndex={0} role="application" aria-label="互动墨池：按住拖拽牵墨，松开释放；方向键牵引，空格释放" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);point(e);}} onPointerMove={point} onPointerUp={e=>{point(e);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);}} onPointerCancel={()=>field.current?.point({x:.5,y:.5,down:false})} onLostPointerCapture={()=>field.current?.point({x:.5,y:.5,down:false})} onBlur={()=>field.current?.point({x:.5,y:.5,down:false})} onKeyDown={e=>{const dirs={ArrowLeft:[.2,.5],ArrowRight:[.8,.5],ArrowUp:[.5,.2],ArrowDown:[.5,.8],' ':[.5,.5]};if(dirs[e.key]){e.preventDefault();field.current?.nudge({x:dirs[e.key][0],y:dirs[e.key][1],down:e.key!==' '});}}}/>
  <p className="entry-ink-status" role="status">{status}</p>
  <button className="ink-demonstrate" onClick={()=>field.current?.demo()}>演示一次牵墨</button>
  {loading&&<p className="entry-progress">山河、剑影与题字正在就绪 · {count} / 4</p>}
  <div className="entry-ink-actions"><button disabled={document.documentElement.dataset.motion==='off'} onClick={start} aria-pressed={camera}>{camera?'关闭摄像头':'开启摄像头手势'}</button><button ref={exitRef} onClick={()=>{stop();onExit();}}>{loading?'先以静画入境':'收墨归山'}</button></div>
  <p className="entry-privacy">可选手势 · 捏合牵墨，张手释放 · 画面仅在本机处理，不录制、不上传</p>
 </div>;
}

export function InkPractice({onClose}){const dialog=useRef(null);useEffect(()=>{const d=dialog.current;d.showModal();return()=>d.close();},[]);return <dialog ref={dialog} className="ink-practice" aria-label="指间有山河，互动试墨" onCancel={onClose}><EntryInk onExit={onClose}/></dialog>;}
