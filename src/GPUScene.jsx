import {useEffect,useRef,useState} from 'react';
import {SpatialScene as StaticScene} from './SpatialSceneV3.jsx';
export function SpatialScene({kind='hero',motion,suspended=false,onSettled,forceStatic=false}){
 const ref=useRef(null),state=useRef(false),engine=useRef(null);const [ready,setReady]=useState(false);
 state.current=motion&&!suspended;
 useEffect(()=>{if(forceStatic){setReady(false);return;}let cancelled=false;const failed=()=>{engine.current?.dispose();engine.current=null;setReady(false);onSettled?.(kind,'fallback');};ref.current.addEventListener('gpu-failed',failed);
  import('./gpuScene.js').then(m=>cancelled?null:m.mountGPU(ref.current,kind,()=>state.current)).then(value=>{if(!value)return;if(cancelled)value.dispose();else{engine.current=value;setReady(true);value.wake();onSettled?.(kind,'ready');}}).catch(error=>{if(!cancelled){ref.current.dataset.gpu='unavailable';ref.current.dataset.failure=error.message;setReady(false);onSettled?.(kind,'fallback');}});
  const element=ref.current;return()=>{cancelled=true;element.removeEventListener('gpu-failed',failed);engine.current?.dispose();engine.current=null;};
 },[kind,forceStatic,onSettled]);
 useEffect(()=>{engine.current?.wake();},[motion,suspended]);
 useEffect(()=>{if(!ready&&kind==='sword'&&ref.current)ref.current.closest('section').dataset.inspect='whole';},[ready,kind]);
 return <div className={`gpu-scene gpu-${kind} ${ready&&!forceStatic?'gpu-ready':''}`}>
  {(!ready||forceStatic)&&<StaticScene kind={kind} motion={false} suspended/>}
  <div className="gpu-surface" ref={ref} aria-hidden="true" data-kind={kind}/>
 </div>;
}
