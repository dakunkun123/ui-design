import * as T from 'three';

// Many fine ribbons follow a small set of physical guides. Width is anti-aliased
// in screen space; these are render fibers, not 160 independent simulations.
export function createSilkFibers(scene, count=160){
 const steps=32, size=count*(steps+1)*2;
 const positions=new Float32Array(size*3), next=new Float32Array(size*3), sides=new Float32Array(size), seeds=new Float32Array(size), along=new Float32Array(size),indices=[];
 for(let f=0;f<count;f++)for(let s=0;s<=steps;s++)for(let side=0;side<2;side++){
  const i=(f*(steps+1)+s)*2+side;sides[i]=side?1:-1;seeds[i]=(f*.61803398875)%1;along[i]=s/steps;
  if(s<steps&&side===0)indices.push(i,i+1,i+2,i+1,i+3,i+2);
 }
 const geometry=new T.BufferGeometry();
 for(const [name,array,n] of [['position',positions,3],['neighbor',next,3],['side',sides,1],['seed',seeds,1],['along',along,1]])geometry.setAttribute(name,new T.BufferAttribute(array,n));
 geometry.setIndex(indices);
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{resolution:{value:new T.Vector2(1440,1000)},opacity:{value:1}},
 vertexShader:`attribute vec3 neighbor;attribute float side,seed,along;uniform vec2 resolution;varying float edge,vSeed,vAlong;
 void main(){vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);vec4 q=projectionMatrix*modelViewMatrix*vec4(neighbor,1.);
 vec2 d=(q.xy/q.w-p.xy/p.w)*resolution;d=normalize(d+vec2(.00001));
 float width=mix(.52,.85,seed);p.xy+=vec2(-d.y,d.x)*side*width*2./resolution*p.w;
 gl_Position=p;edge=side;vSeed=seed;vAlong=along;}`,
 fragmentShader:`uniform float opacity;varying float edge,vSeed,vAlong;void main(){
 float a=(1.-smoothstep(.2,1.,abs(edge)))*(1.-smoothstep(.83,1.,vAlong));
 float glint=pow(.5+.5*sin(vAlong*10.+vSeed*17.),8.)*.18;
 vec3 ink=mix(vec3(.055,.067,.06),vec3(.31,.32,.27),vSeed*.5+glint);
 if(vSeed>.972)ink=vec3(.29,.07,.045);
 gl_FragColor=vec4(ink,a*.68*opacity);
 #include <colorspace_fragment>
 }`});
 const mesh=new T.Mesh(geometry,material);mesh.frustumCulled=false;scene.add(mesh);
 const a=new T.Vector3(),b=new T.Vector3(),normal=new T.Vector3(),tangent=new T.Vector3(),z=new T.Vector3(0,0,1);
 function point(f,u,guides,time,out){
  const seed=(f*.61803398875)%1, t=.18+u*(.72+seed*.1),v=Math.min(18.999,t*19),k=Math.floor(v);
  const guide=guides[f%guides.length].pts,local=v-k,p0=guide[Math.max(0,k-1)],p1=guide[k],p2=guide[k+1],p3=guide[Math.min(19,k+2)];
  for(const axis of ['x','y','z'])out[axis]=.5*((2*p1[axis])+(-p0[axis]+p2[axis])*local+(2*p0[axis]-5*p1[axis]+4*p2[axis]-p3[axis])*local*local+(-p0[axis]+3*p1[axis]-3*p2[axis]+p3[axis])*local*local*local);
  tangent.copy(guide[k+1]).sub(guide[k]).normalize();normal.copy(tangent).cross(z).normalize();
  const spread=Math.sin(Math.PI*u*.85)*(.025+u*.055);
  out.addScaledVector(normal,(seed-.5)*spread*2+Math.sin(time*1.4+u*9+seed*15)*u*u*.014+Math.sin(time*.9+u*5+seed*23)*u*u*u*.062);
  out.z+=(Math.sin(seed*61)*.022+Math.sin(time+u*8+seed*9)*.009)*u;
 }
 return {count,update(guides,time,fade=1){
  material.uniforms.opacity.value=fade;
  for(let f=0;f<count;f++)for(let s=0;s<=steps;s++){
   point(f,s/steps,guides,time,a);point(f,(s+.1)/steps,guides,time,b);
   for(let side=0;side<2;side++){const i=((f*(steps+1)+s)*2+side)*3;a.toArray(positions,i);b.toArray(next,i);}
  }
  geometry.attributes.position.needsUpdate=true;geometry.attributes.neighbor.needsUpdate=true;
 },resize(w,h){material.uniforms.resolution.value.set(w,h);}};
}
