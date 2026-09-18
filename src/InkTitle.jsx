import {useEffect,useRef} from 'react';
import './ink-title.css';

export function InkTitle({motion,suspended,started=true,onSettled,forceStatic=false}){
 const host=useRef(null),engine=useRef(null),enabled=useRef(false),start=useRef(started);
 start.current=started;
 enabled.current=motion&&!suspended;
 useEffect(()=>{
  const element=host.current;if(forceStatic){element.dataset.ink='fallback';return;}let cancelled=false,instance;
  import('./inkTitleGL.js').then(m=>cancelled?null:m.mountInkTitle(element,()=>enabled.current,()=>start.current)).then(value=>{
   if(!value)return;
   if(cancelled)value.dispose();else{instance=value;engine.current=value;value.wake();onSettled?.('title','ready');}
  }).catch(()=>{if(!cancelled){element.dataset.ink='fallback';onSettled?.('title','fallback');}});
  return()=>{cancelled=true;instance?.dispose();engine.current=null;};
 },[forceStatic,onSettled]);
 useEffect(()=>{engine.current?.wake();},[motion,suspended,started]);
 return <span className="ink-title" ref={host} data-ink="loading">
  <img src="/assets/title-v10.webp" alt="" width="1536" height="1024" fetchPriority="high" />
  <span className="ink-title-surface" aria-hidden="true" />
 </span>;
}
