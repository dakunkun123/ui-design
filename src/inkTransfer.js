// Pigment transport and exact, persistent glyph deposition. No DOM clip reveal.
export const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const random=i=>{const x=Math.sin(i*127.1+41.7)*43758.5453;return x-Math.floor(x);};
export function createAsh(source,bounds,target,button){
 const label=document.querySelector('.inspect-invite>span');
 const rect=label.getBoundingClientRect(),parent=label.closest('button').getBoundingClientRect(),style=getComputedStyle(label);
 const d=Math.min(2,devicePixelRatio||1),w=Math.ceil(rect.width*d),h=Math.ceil(rect.height*d);
 const glyph=document.createElement('canvas');glyph.width=w;glyph.height=h;
 const g=glyph.getContext('2d',{willReadFrequently:true});g.scale(d,d);
 g.font=`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
 g.textBaseline='alphabetic';g.fillStyle=style.color;g.letterSpacing=style.letterSpacing;
 const metrics=g.measureText(label.textContent),size=parseFloat(style.fontSize);
 const ascent=metrics.fontBoundingBoxAscent||size*.88,descent=metrics.fontBoundingBoxDescent||size*.12;
 g.fillText(label.textContent,0,(rect.height-ascent-descent)/2+ascent);
 const pixels=g.getImageData(0,0,w,h),settled=document.createElement('canvas');settled.width=w;settled.height=h;
 const sg=settled.getContext('2d'),image=sg.createImageData(w,h),particles=[];
 const x=target.x-button.width/2+rect.left-parent.left,y=target.y-button.height/2+rect.top-parent.top;
 for(let py=0;py<h;py++)for(let px=0;px<w;px++){
  const off=(py*w+px)*4;if(!pixels.data[off+3])continue;
  const i=particles.length,seed=random(i+12),s=source?.[Math.floor(random(i+3)*source.length)];
  const sx=s?s.x*innerWidth:bounds.x+(random(i)-.5)*bounds.w,sy=s?s.y*innerHeight:bounds.y+(random(i+4)-.5)*bounds.h;
  const order=px/w*.68+py/h*.16+random(i+7)*.16;
  const arrival=.47+order*.45,start=.045+random(i+5)*.20+clamp((sx-bounds.x)/Math.max(1,bounds.w)+.5)*.12;
  particles.push({sx,sy,dx:x+px/d,dy:y+py/d,start,arrival,seed,off,size:.65+random(i+8)*1.45});
 }
 return {particles,pixels,image,settled,sg,glyph,x,y,d,w,h,lastQ:-1,arrived:0,positions:[],bounds,target};
}
export function positionAt(f,q){
 const u=clamp((q-f.start)/(f.arrival-f.start));
 // Fast take-off, long visible deceleration into the letter. Coherent stream with fine curl.
 const t=1-Math.pow(1-u,2),lift=Math.sin(Math.PI*t),phase=f.seed*Math.PI*2;
 return {x:f.sx+(f.dx-f.sx)*t+lift*(Math.sin(t*5+phase)*19),y:f.sy+(f.dy-f.sy)*t-lift*(60+f.seed*42)+Math.sin(t*8+phase)*lift*13,u};
}
export function updateAsh(state,q){
 if(q<state.lastQ){state.image.data.fill(0);state.arrived=0;}
 const last=q<state.lastQ?-1:state.lastQ;state.positions.length=0;
 let dirty=false;
 for(let i=0;i<state.particles.length;i++){
  const f=state.particles[i];
  if(q>=f.arrival){if(last<f.arrival){for(let j=0;j<4;j++)state.image.data[f.off+j]=state.pixels.data[f.off+j];state.arrived++;dirty=true;}continue;}
  if(q<=f.start)continue;
  const p=positionAt(f,q);state.positions.push({...p,f,index:i});
 }
 if(dirty||q<state.lastQ)state.sg.putImageData(state.image,0,0);
 state.lastQ=q;
 return state.particles.length?state.arrived/state.particles.length:1;
}
export function drawAsh(ctx,state,q){
 ctx.save();ctx.fillStyle='#171f1b';ctx.strokeStyle='#343b32';
 for(const {x,y,u,f,index} of state.positions){
  // Keep a sparse sharp front over the continuous dye, not thousands of opaque dots.
  if(index%3!==0)continue;
  const r=f.size*(1-u*.76),alpha=smooth(u/.09)*(.45+.4*u);
  ctx.globalAlpha=alpha;
  ctx.beginPath();ctx.ellipse(x,y,r*(1.4-u*.4),r*.7,f.seed*6.28,0,Math.PI*2);ctx.fill();
  if(u>.35&&u<.9&&index%15===0){const prev=positionAt(f,q-.008);ctx.lineWidth=.55;ctx.globalAlpha=.25;ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.lineTo(x,y);ctx.stroke();}
 }
 ctx.globalAlpha=1;ctx.drawImage(state.settled,state.x,state.y,state.w/state.d,state.h/state.d);ctx.restore();
}
