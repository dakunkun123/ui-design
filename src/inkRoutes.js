import {useEffect,useRef,useState} from 'react';
import './ink-routes.css';
const routes={'/':'prologue','/jianlu':'sword-scroll','/jianghu':'journal',prologue:'prologue','sword-scroll':'sword-scroll','sword-detail':'sword-scroll',journal:'journal'};
const urls={prologue:'#/', 'sword-scroll':'#/jianlu',journal:'#/jianghu'};
export function useInkRoutes(motion,entered){
 const [route,setRoute]=useState(()=>routes[location.hash.slice(1)]||'prologue');
 const current=useRef(route),latest=useRef(route),settings=useRef({motion,entered}),curtain=useRef(null);
 settings.current={motion,entered};
 useEffect(()=>{let cancelled=false;import('./routeCurtain.js').then(m=>{if(!cancelled)curtain.current=m.createCurtain();}).catch(()=>{});return()=>{cancelled=true;curtain.current?.dispose();curtain.current=null;};},[]);
 useEffect(()=>{
  let focusFrame;
  function navigate(next){
   latest.current=next;
   const commit=()=>{current.current=next;setRoute(next);window.scrollTo({top:0,behavior:'instant'});cancelAnimationFrame(focusFrame);focusFrame=requestAnimationFrame(()=>{const h=document.querySelector(`#${next} h1,#${next} h2`);h?.setAttribute('tabindex','-1');h?.focus({preventScroll:true});});};
   if(!settings.current.motion||!settings.current.entered){curtain.current?.cancel();commit();return;}
   if(next===current.current){curtain.current?.cancel();return;}
   const order=['prologue','sword-scroll','journal'];
   if(curtain.current)curtain.current.play(commit,{from:current.current,to:next,direction:order.indexOf(next)>order.indexOf(current.current)?1:-1});else commit();
  }
  function click(e){
   if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
   const link=e.target.closest('a[href]');if(!link||link.target==='_blank')return;
   const href=link.getAttribute('href');if(!href.startsWith('#'))return;
   const next=routes[href.slice(1)];if(!next)return;e.preventDefault();
   if(location.hash!==urls[next])history.pushState(null,'',urls[next]);navigate(next);
  }
  const historyChange=()=>navigate(routes[location.hash.slice(1)]||'prologue');
  document.addEventListener('click',click);window.addEventListener('popstate',historyChange);window.addEventListener('hashchange',historyChange);
  return()=>{cancelAnimationFrame(focusFrame);document.removeEventListener('click',click);window.removeEventListener('popstate',historyChange);window.removeEventListener('hashchange',historyChange);};
 },[]);
 useEffect(()=>{if(!motion){curtain.current?.cancel();if(current.current!==latest.current)window.scrollTo({top:0,behavior:'instant'});current.current=latest.current;setRoute(latest.current);}},[motion]);
 useEffect(()=>{document.title=`${route==='prologue'?'序章':route==='sword-scroll'?'剑录':'江湖志'} · 枫落见锋`;},[route]);
 return route;
}
