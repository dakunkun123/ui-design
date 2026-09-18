const clamp=x=>Math.max(0,Math.min(1,x));
export const LEAF_COVER=1.5, LEAF_END=5.3;
export function leafSeed(i){const x=Math.sin(i*127.1+91.7)*43758.5453;return x-Math.floor(x);}
export function leafState(t,p,w,h){
 const arrival=clamp((t-p.seed*.36)/1.1);
 const incoming=1-arrival*arrival*(3-2*arrival);
 const theta=p.seed*Math.PI*2;
 const curl=Math.sin(arrival*Math.PI)*incoming;
 const release=1.8+p.x/w*.55+p.seed*1.2+p.layer*.08;
 const age=Math.max(0,t-release),travel=age*age*(.7+p.seed*.4);
 return {x:p.x+incoming*Math.cos(theta)*(w*.8+260)+curl*Math.sin(theta)*240+travel*(w*.7+200),y:p.y+incoming*Math.sin(theta)*(h*.9+220)+curl*Math.cos(theta)*180-travel*(h*.19+80)+Math.sin(age*5+p.seed*6)*age*17,z:p.z-incoming*420+Math.sin(age*2)*70,flight:Math.max(incoming,clamp(age*1.8)),rx:incoming*(p.seed-.5)*5+age*(1.1+p.seed*2),ry:incoming*(2+p.seed*4)+age*(2.4+p.seed),rz:p.angle+incoming*(p.seed-.5)*8+age*(p.seed-.35)*2.2,scale:1-incoming*.55+Math.min(.18,age*.09)};
}
