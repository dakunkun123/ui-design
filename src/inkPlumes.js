import * as T from 'three';
// World-space washes sit behind subjects and participate in ordinary scene depth testing.
export function createInkPlumes(scene,kind){
 const clocks=[];
 const vertexShader='varying vec2 p;void main(){p=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
 const fragmentShader=`varying vec2 p;uniform float time,seed,strength;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 a=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(a),hash(a+vec2(1,0)),f.x),mix(hash(a+vec2(0,1)),hash(a+1.),f.x),f.y);}
 float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.03+7.;a*=.5;}return v;}
 void main(){vec2 flow=vec2(fbm(p*4.+vec2(time*.035,seed)),fbm(p*5.-vec2(time*.02,seed)));
 float cloud=fbm(p*vec2(8.,5.)+flow*3.+vec2(-time*.075,seed));
 float spine=.42+.12*sin(p.x*8.+seed+time*.15)+flow.y*.19;
 float body=exp(-pow((p.y-spine)*9.,2.));
 float fringe=smoothstep(0.,.17,p.x)*smoothstep(0.,.2,1.-p.x)*smoothstep(0.,.2,p.y)*smoothstep(0.,.2,1.-p.y);
 float alpha=smoothstep(.32,.72,cloud)*body*fringe*strength;
 gl_FragColor=vec4(.10,.125,.11,alpha);
 }`;
 for(let i=0;i<3;i++){
  const uniforms={time:{value:0},seed:{value:i*3.71},strength:{value:kind==='journal'?.20:.34}};clocks.push(uniforms.time);
  const mat=new T.ShaderMaterial({uniforms,vertexShader,fragmentShader,transparent:true,depthWrite:false,depthTest:true});
  const mesh=new T.Mesh(new T.PlaneGeometry(16-i*2,5),mat);mesh.position.set(kind==='hero'?3.5:0,-1.1+i*1.4,-3.6+i*.7);mesh.rotation.z=(i-1)*.14;mesh.renderOrder=4+i;scene.add(mesh);
 }
 return {update(time){clocks.forEach(clock=>clock.value=time);}};
}
