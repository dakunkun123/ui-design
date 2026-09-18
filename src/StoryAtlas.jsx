import {useState} from 'react';
import {StoryPortal} from './StoryPortal.jsx';
export function StoryAtlas({stories,allStories,onOpen,motion}){
 const [chosen,setChosen]=useState(null),active=stories.find(s=>s.id===chosen)||stories[0];
 if(!active)return null;
 return <div className="story-atlas"><div className="atlas-scene" key={active.id}><StoryPortal story={active} index={allStories.indexOf(active)} onOpen={onOpen} motion={motion}/></div><nav className="atlas-compass" aria-label="选择探索场景">{stories.map(s=>{const i=allStories.indexOf(s);return <button key={s.id} aria-pressed={active.id===s.id} onClick={()=>setChosen(s.id)}><small>0{i+1}</small><span>{['踏山行','渡旧尘','问剑心'][i]}</span><em>{['引风 · 落叶','点水 · 鹤行','拂刃 · 听雨'][i]}</em></button>;})}</nav></div>;
}
