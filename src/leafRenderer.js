import {leafSeed} from './leafWind.js';
import {LEAF_END,transitionVeil} from './transitionTiming.js';
const clamp=x=>Math.max(0,Math.min(1,x));
export async function createLeafRenderer(canvas){
 const g=canvas.getContext('2d');let w=1,h=1;
 const images=await Promise.all([0,1].map(i=>new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=`/assets/maple-v27-${i}.webp`;})));
 function resize(){w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio,2);canvas.width=w*d;canvas.height=h*d;g.setTransform(d,0,0,d,0,0);}
 function draw(t,theme='autumn'){
  g.clearRect(0,0,w,h);
  const veil=transitionVeil(t);
  g.fillStyle=`rgba(240,237,226,${veil})`;g.fillRect(0,0,w,h);
  const envelope=Math.sin(Math.PI*clamp(t/LEAF_END));
  if(theme==='autumn'){
   for(let i=0;i<46;i++){
    const s=leafSeed(i),depth=leafSeed(i+71),travel=t/LEAF_END;
    const x=(-.35+travel*1.9+s*.45)*w,y=(leafSeed(i+39)*1.2-.1)*h-Math.sin(travel*3+s*5)*h*.12;
    const size=24+depth*65,im=images[i%2];if(!im)continue;
    g.save();g.globalAlpha=envelope*(.48+depth*.5);g.translate(x,y);g.rotate(s*5+Math.sin(t*2+s*6)*.38+t*.28);g.scale(1,.82+.15*Math.sin(t*2+s*9));g.drawImage(im,-size/2,-size/2,size,size);g.restore();
   }
  }else if(theme==='ferry'){
   for(let i=0;i<12;i++){
    const r=(t*.36+i*.07)*w;
    g.strokeStyle=`rgba(74,108,109,${envelope*.18*(1-i/15)})`;g.lineWidth=i%3?1:2.5;g.beginPath();g.ellipse(w*.58,h*.6,r,r*.28,-.12,0,Math.PI*2);g.stroke();
   }
  }else{
   g.save();g.translate(w*.5,h*.5);g.rotate(-.38);
   const grad=g.createLinearGradient(-w,0,w,0);grad.addColorStop(0,'#33473e00');grad.addColorStop(.48,`rgba(41,61,52,${envelope*.7})`);grad.addColorStop(.5,`rgba(169,184,163,${envelope})`);grad.addColorStop(1,'#33473e00');g.fillStyle=grad;
   for(let i=0;i<7;i++){g.globalAlpha=1-i*.12;g.fillRect(-w+(t/LEAF_END-.5)*w,i*9-26,w*2,i===0?3:1);}g.restore();
  }
  canvas.dataset.transitionTheme=theme;canvas.dataset.leafTime=t.toFixed(2);canvas.dataset.leafCount=theme==='autumn'?'46':'0';
 }
 resize();return {draw,resize,dispose(){g.clearRect(0,0,w,h);}};
}
