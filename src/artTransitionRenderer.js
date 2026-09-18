import {loadSprite,drawCrane} from './paintedSprites.js';
import {seed} from './willowModel.js';
import {artWindow,artEdge} from './artTransitionTiming.js';
export async function createArtTransition(canvas){
 const g=canvas.getContext('2d'),files={branch:'maple-bough-v24',body:'crane-body-v24',near:'crane-wing-near-v24',far:'crane-wing-far-v24'};
 ['pass','river','valley'].forEach((f,i)=>files['land'+i]=f+'-v23');
 for(let i=0;i<3;i++){files['leaf'+i]=`maple-${i}-v29`;files['bamboo'+i]=`bamboo-${i}-v29`;files['wash'+i]=`wash-${i}-v29`;}
 const images=Object.fromEntries(await Promise.all(Object.entries(files).map(async([k,f])=>[k,await loadSprite(`/assets/${f}.webp`)])));
 let w=1,h=1,disposed=false;
 function resize(){w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio,2);canvas.width=w*d;canvas.height=h*d;g.setTransform(d,0,0,d,0,0);}
 function img(im,x,y,width,height,alpha=1){if(!im)return;g.save();g.globalAlpha*=alpha;g.drawImage(im,x,y,width,height);g.restore();}
 function clipWindow(t,kind){
  const {front,back}=artWindow(t);g.beginPath();
  const point=(p,u)=>kind===1?[u*w,(1-p)*h]:kind===2?[(p+(u-.5)*.34)*w,u*h]:[p*w,u*h];
  for(let i=0;i<=70;i++){const u=i/70,[x,y]=point(front+artEdge(u,t),u);i?g.lineTo(x,y):g.moveTo(x,y);}
  for(let i=70;i>=0;i--){const u=i/70,[x,y]=point(back+artEdge(u,t+.3),u);g.lineTo(x,y);}g.closePath();g.clip();
 }
 function draw(t,theme='autumn'){
  if(disposed)return;g.clearRect(0,0,w,h);const kind=theme==='autumn'?0:theme==='ferry'?1:2,life=artWindow(t).life;
  g.save();clipWindow(t,kind);
  // The scene replacement happens behind an opaque illustrated world, not an empty fade.
  g.fillStyle=['#372721','#243d42','#202c28'][kind];g.fillRect(0,0,w,h);
  const land=images['land'+kind];if(land){const scale=Math.max(w/land.width,h/land.height);img(land,(w-land.width*scale)/2,(h-land.height*scale)/2,land.width*scale,land.height*scale,.28);}
  const wash=images['wash'+kind];
  for(let i=0;i<3;i++){
   g.save();g.translate(w*(.45+Math.sin(t*.3+i)*.12),h*(.2+i*.32));g.rotate(kind===2?-.3:Math.sin(t*.25+i)*.07);
   img(wash,-w*.75,-h*.24,w*1.5,h*.48,.58-i*.08);g.restore();
  }
  if(kind===0){
   g.save();g.translate(-w*.2+life*w*.12,-h*.1);g.rotate(-.1+Math.sin(t*.8)*.035);img(images.branch,0,0,w*.97,h*.58,.85);g.restore();
   for(let i=0;i<62;i++){
    const s=seed(i),z=seed(i+90),size=30+z*z*155,travel=life*(.38+z*.55),x=((s+travel)*1.3-.15)%1.3*w,y=(seed(i+41)+Math.sin(t*1.2+s*6)*.08)*h;
    g.save();g.translate(x,y);g.rotate(s*6+t*(.35+z*.45));g.scale(1,.7+Math.sin(t*1.6+s*5)*.2);img(images['leaf'+i%3],-size/2,-size/2,size,size,.6+z*.4);g.restore();
   }
  }else if(kind===1){
   for(let i=2;i>=0;i--){drawCrane(g,images,w*(.38+life*.34-i*.18),h*(.43+i*.15),Math.min(w*.35,530)*(1-i*.22),t*4-i*.8,1-i*.22);}
   // Broken brush reflections, not concentric geometric rings.
   for(let i=0;i<11;i++){const yy=h*(.7+i*.025),x=w*(.12+seed(i)*.25)+Math.sin(t*.8+i)*20;g.strokeStyle=`rgba(185,211,204,${.07+seed(i+7)*.13})`;g.lineWidth=.6+seed(i)*1.6;g.beginPath();g.moveTo(x,yy);g.bezierCurveTo(x+w*.15,yy-2,x+w*.27,yy+3,x+w*(.32+seed(i+4)*.13),yy);g.stroke();}
  }else{
   for(let i=0;i<8;i++){
    const x=w*(.1+i*.14),y=h*(.12+seed(i)*.65),size=w*(.18+seed(i+11)*.11);
    g.save();g.translate(x,y);g.rotate(-.4+Math.sin(t*1.3-i*.4)*.18);img(images['bamboo'+i%3],-size*.13,-size*.86,size,size,.5+seed(i)*.45);g.restore();
   }
   const flash=Math.exp(-(((t-1.7)*3)**2));g.save();g.translate(w*.52,h*.49);g.rotate(-.38);const light=g.createLinearGradient(-w*.7,0,w*.7,0);light.addColorStop(0,'#eaf1d800');light.addColorStop(.5,`rgba(241,242,212,${flash})`);light.addColorStop(1,'#eaf1d800');g.fillStyle=light;g.fillRect(-w*.7,-1,w*1.4,2);g.restore();
  }
  g.restore();canvas.dataset.transitionTheme=theme;canvas.dataset.artTime=t.toFixed(3);canvas.dataset.artAssets=String(Object.values(images).filter(Boolean).length);canvas.dataset.artPhase=t<1.45?'arrive':'reveal';
 }
 resize();return {draw,resize,dispose(){disposed=true;g.clearRect(0,0,w,h);}};
}
