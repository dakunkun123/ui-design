import {useEffect,useRef} from 'react';

// One spatial field: rock stays fixed, low water refracts, fog crosses the valley.
export function LivingBackdrop({src,className,motion,kind=0}){
 const ref=useRef(null),state=useRef(motion);state.current=motion;
 useEffect(()=>{let dead=false,engine;
  import('./paintedLandscape.js').then(m=>dead?null:m.mountLandscape(ref.current,src,kind,()=>state.current)).then(e=>{if(dead)e?.dispose();else engine=e;}).catch(()=>{if(ref.current)ref.current.dataset.failed='true';});
  return()=>{dead=true;engine?.dispose();};
 },[src,kind]);
 return <span ref={ref} className={`${className} living-backdrop`} style={{backgroundImage:`url('${src}')`}} aria-hidden="true"/>;
}
