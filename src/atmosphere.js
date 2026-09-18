import * as T from 'three';

// World-space density slices: inexpensive volume approximation, not a fluid solver.
export function createAtmosphere(scene, mobile) {
 const layers=[];
 const noise=`
 float hash(vec3 p){p=fract(p*.3183099+vec3(.13,.27,.41));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
 float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
 float fbm(vec3 p){float v=0.,a=.55;for(int i=0;i<4;i++){v+=a*noise3(p);p=p*2.03+vec3(4.7,1.2,8.3);a*=.48;}return v;}`;
 for(let i=0;i<(mobile?4:6);i++){
  const material=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0},seed:{value:i*7.3},strength:{value:mobile?.34:.28}},
   vertexShader:`varying vec3 world;varying vec2 v;void main(){v=uv;world=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,
   fragmentShader:`varying vec3 world;varying vec2 v;uniform float time,seed,strength;${noise}
   void main(){vec3 q=world*vec3(.24,.72,.35)+vec3(-time*.055,0.,seed+time*.018);
    float warp=fbm(q*.7+vec3(0.,0.,time*.035));float density=fbm(q+vec3(warp*1.8,warp*.45,0.));
    float tendril=fbm(q*vec3(1.4,2.2,1.)+vec3(0.,warp,time*.01));
    float edge=smoothstep(0.,.17,v.x)*smoothstep(0.,.17,1.-v.x)*pow(sin(v.y*3.1415926),1.5);
    float a=(1.-exp(-max(0.,density-.24)*3.2))*edge*strength;
    vec3 tint=mix(vec3(.31,.36,.33),vec3(.96,.955,.92),smoothstep(.22,.6,tendril));
    gl_FragColor=vec4(tint,a);
    #include <colorspace_fragment>
   }`});
  const mesh=new T.Mesh(new T.PlaneGeometry(30,i<3?4.8:2.4),material);
  mesh.position.set((i%2-.5)*2,i<3?-.2-i*.5:-2.6,-6.5+i*1.45);
  scene.add(mesh);layers.push(material);
 }
 return {update(time){layers.forEach(m=>m.uniforms.time.value=time);},count:layers.length};
}

// A distant matte painting is fixed to the camera; foreground geometry retains perspective.
export function createBackdrop(scene,camera,texture){
 const mesh=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:texture,depthWrite:false}));
 mesh.position.z=-35;mesh.renderOrder=-100;camera.add(mesh);scene.add(camera);
 return {resize(){const height=2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*35,width=height*camera.aspect;
  const ratio=texture.image.width/texture.image.height,cover=Math.max(width/ratio,height)*1.025;
  mesh.scale.set(cover*ratio,cover,1);
 },coverage(){return Math.min(mesh.scale.y/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*35),mesh.scale.x/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2))*35*camera.aspect));}};
}
