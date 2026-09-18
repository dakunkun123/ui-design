import {useState} from 'react';
const sizes={prologue:[377,246],jianlu:[437,213],journal:[507,224],enter:[569,198],explore:[650,200],read:[538,202],motto:[2057,233]};
export function ArtLabel({name,children}){
 const [failed,setFailed]=useState(false);
 return <span className={`art-label art-${name}`}><span className={failed?'':'sr-only'}>{children}</span>{!failed&&<img src={`/assets/letter-${name}-v16.webp`} width={sizes[name]?.[0]} height={sizes[name]?.[1]} alt="" aria-hidden="true" draggable="false" onError={()=>setFailed(true)}/>}</span>;
}
