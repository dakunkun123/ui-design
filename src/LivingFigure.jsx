import {useEffect,useRef} from 'react';
// Local hair/cloth deformation with explicit face and blade protection masks.
export function LivingFigure({src,className='',motion,kind=0}){
 const ref=useRef(null),enabled=useRef(motion);enabled.current=motion;
 useEffect(()=>{let dead=false,rig;
  import('./figureRig.js').then(m=>dead?null:m.createFigureRig(ref.current,src,kind,()=>enabled.current)).then(r=>{if(dead)r?.dispose();else rig=r;}).catch(()=>{if(ref.current)ref.current.dataset.failed='true';});
  return()=>{dead=true;rig?.dispose();};
 },[src,kind]);
 return <canvas ref={ref} className={`${className} living-figure`} style={{backgroundImage:`url('${src}')`,backgroundSize:'contain',backgroundRepeat:'no-repeat',backgroundPosition:'center bottom'}} aria-hidden="true"/>;
}
