export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
export const seed=i=>{const v=Math.sin(i*127.1+31.7)*43758.5453;return v-Math.floor(v);};
export function createStroke(id){return {id,points:[],length:0,nextBranch:28,branches:[]};}
// Spatial sampling only. Never add future time to input points.
export function appendPoint(stroke,x,y,time,w,h){
 const from=stroke.points.at(-1);if(!from){stroke.points.push({x,y,time,distance:0});return;}
 const dx=(x-from.x)*w,dy=(y-from.y)*h,dist=Math.hypot(dx,dy);if(dist<.25)return;
 const count=Math.max(1,Math.ceil(dist/5)),angle=Math.atan2(dy,dx);
 for(let i=1;i<=count;i++){
  const d=stroke.length+dist*i/count,p={x:from.x+(x-from.x)*i/count,y:from.y+(y-from.y)*i/count,time,distance:d};stroke.points.push(p);
  if(d>=stroke.nextBranch){const n=stroke.branches.length+stroke.id*31;stroke.branches.push({...p,angle,seed:seed(n),side:n%2?1:-1});stroke.nextBranch=d+38+seed(n+9)*24;}
 }
 stroke.length+=dist;
 // Decimate old trunk geometry, retaining newest input exactly; never freeze the tip.
 if(stroke.points.length>1800)stroke.points=stroke.points.filter((_,i)=>i%2===0||i===stroke.points.length-1);
 if(stroke.branches.length>100)stroke.branches.splice(0,stroke.branches.length-100);
}
export function branchPoint(b,u,w,h,time){
 const len=85+b.seed*85,dx=Math.cos(b.angle+b.side*.9),dy=Math.sin(b.angle+b.side*.9);
 const wind=Math.sin(time*1.2+b.seed*7-u*1.8)*6*u*u;
 return {x:b.x*w+dx*len*u+wind,y:b.y*h+dy*len*u*.55+len*.72*u*u};
}
export function growthAt(age,u){return {branch:smooth(age/.85),leaf:smooth((age-.18-u*.95)/.85)};}
