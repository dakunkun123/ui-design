export function loadSprite(url){return new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=url;});}
export function loadBotanicals(){return Promise.all(Array.from({length:6},(_,i)=>loadSprite(`/assets/willow-${i}-v29.webp`)));}
// Leaf base is fixed at the petiole. Length grows first; lamina unfolds later.
export function paintedLeaf(g,im,x,y,angle,length,bloom,time,phase=0){
 if(!im?.naturalWidth||bloom<=0)return;
 const dw=length*im.width/im.height*(.12+.88*bloom),dh=length*bloom;
 g.save();g.translate(x,y);g.rotate(angle+Math.PI/2);const n=12;
 for(let j=0;j<n;j++){const u=j/n,sw=im.height/n,flex=Math.sin(time*1.7+phase-u*2.2)*length*.065*(1-u)**2*bloom;g.drawImage(im,0,j*sw,im.width,Math.min(sw+.4,im.height-j*sw),-dw*.5+flex,-dh+u*dh,dw,dh/n+.4);}
 g.restore();
}
export function drawCrane(g,images,x,y,size,phase,alpha=1){
 const {body,near,far}=images;if(!body||!near||!far)return;
 g.save();g.translate(x,y+Math.sin(phase)*size*.022);g.rotate(-.09+Math.sin(phase*.45)*.04);g.scale(size/890,size/890);g.globalAlpha*=alpha;
 const wing=(im,nearSide)=>{g.save();g.rotate(nearSide?.18:-.2);g.scale(1,Math.cos(phase+(nearSide?0:.3))*(nearSide?.85:.65));
 // Feather tips lag the shoulder, instead of scaling an entirely rigid wing.
 const n=18,iw=nearSide?459:510,ix=nearSide?-35:-390;
 for(let j=0;j<n;j++){const u=j/n,sh=im.height/n,flex=Math.sin(phase-.5+u)*22*(1-u)**2;g.drawImage(im,0,j*sh,im.width,Math.min(sh+.5,im.height-j*sh),ix+flex,-555+u*645,iw,645/n+.5);}g.restore();};
 wing(far,false);g.drawImage(body,-480,-75,890,365);wing(near,true);g.restore();
}
