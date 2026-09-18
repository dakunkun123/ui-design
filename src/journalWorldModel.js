export const journalWorlds = [
 {id:'autumn',title:'踏山行',label:'山行',place:'秋山 · 断崖',action:'唤起山风',hint:'按住拖曳，让山风穿过字与叶',backdrop:'pass-v23',object:'journal-crag-v30',direction:1},
 {id:'ferry',title:'渡旧尘',label:'渡水',place:'江上 · 归渡',action:'唤起江风',hint:'按住借风，白鹤振翅，轻舟逐水',backdrop:'river-v23',object:'journal-boat-v30',direction:-1},
 {id:'sword',title:'问剑心',label:'藏锋',place:'竹隐 · 听雨',action:'拂过剑穗',hint:'拖曳引风，竹叶与剑穗相应',backdrop:'valley-v23',object:'journal-blade-v30',direction:1},
];
export const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
export function approach(value,target,rate,dt){return value+(target-value)*(1-Math.exp(-rate*clamp(dt,0,.05)));}
export function updateWind(state,dt){
 const energy=approach(state.energy,state.held?1:state.pulse>0?.85:0,state.held?9:1.8,dt);
 return {...state,energy,pulse:Math.max(0,state.pulse-dt),x:approach(state.x,state.tx,5,dt),y:approach(state.y,state.ty,5,dt)};
}
export function pointerPosition(clientX,clientY,rect){return {x:clamp((clientX-rect.left)/Math.max(1,rect.width),0,1),y:clamp((clientY-rect.top)/Math.max(1,rect.height),0,1)};}
