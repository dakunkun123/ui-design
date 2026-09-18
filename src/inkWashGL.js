// Semi-Lagrangian pigment concentration advection; not a full pressure fluid solver.
// RGBA8 ping-pong targets work without float texture extensions.
export function createInkWash(){
 const canvas=document.createElement('canvas'),gl=canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:false,antialias:false});
 if(!gl)return null;
 let dead=false,width=1,height=1,sw=1,sh=1,targets=[],front=0,last=0;
 const emit=document.createElement('canvas'),brush=emit.getContext('2d');
 const vertex=`#version 300 es
 in vec2 a;out vec2 uv;void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}`;
 function program(fragment){const shaders=[gl.VERTEX_SHADER,gl.FRAGMENT_SHADER].map((type,i)=>{const s=gl.createShader(type);gl.shaderSource(s,i?fragment:vertex);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;});const p=gl.createProgram();shaders.forEach(s=>gl.attachShader(p,s));gl.linkProgram(p);shaders.forEach(s=>gl.deleteShader(s));if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
 const advect=program(`#version 300 es
 precision highp float;in vec2 uv;out vec4 frag;uniform sampler2D previous,emission;uniform float dt,time,fade;uniform vec2 texel;
 void main(){vec2 velocity=vec2(sin(uv.y*21.+time*.9)+cos(uv.x*13.-time),cos(uv.x*19.+time*.7)-sin(uv.y*17.-time))*.007;
 vec2 back=clamp(uv-velocity*dt,texel,1.-texel);float d=texture(previous,back).r;
 float diffuse=(texture(previous,back+vec2(texel.x,0)).r+texture(previous,back-vec2(texel.x,0)).r+texture(previous,back+vec2(0,texel.y)).r+texture(previous,back-vec2(0,texel.y)).r)*.25;
 d=mix(d,diffuse,.075)*exp(-dt*(3.4+fade*12.));float inputD=texture(emission,uv).r;
 frag=vec4(min(.72,d+inputD*dt*4.),0.,0.,1.);}`);
 const compose=program(`#version 300 es
 precision highp float;in vec2 uv;out vec4 frag;uniform sampler2D density;uniform vec2 resolution;uniform float time,fade;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
 void main(){vec2 grainUV=uv*resolution;float fiber=noise(grainUV*.48),fine=hash(floor(grainUV));
 vec2 warp=vec2(noise(uv*120.+time*.12),noise(uv*130.-time*.09))-.5;
 float d=texture(density,uv+warp*.0025).r;float body=smoothstep(.026,.48,d);
 float edge=smoothstep(.012,.06,d)*(1.-smoothstep(.06,.15,d));
 float pigment=clamp(body*(.82+fiber*.18)+edge*.16,0.,.94);
 float alpha=pigment*(.50+fine*.08)*(1.-fade);vec3 col=mix(vec3(.19,.23,.20),vec3(.035,.055,.043),smoothstep(.05,.35,d));
 frag=vec4(col,alpha);}`);
 const quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 function texture(w,h){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);return t;}
 const emission=texture(1,1);
 function freeTargets(){targets.forEach(t=>{gl.deleteTexture(t.tex);gl.deleteFramebuffer(t.fbo);});targets=[];}
 function resize(w,h){width=w;height=h;canvas.width=Math.round(w*Math.min(devicePixelRatio,1.5));canvas.height=Math.round(h*Math.min(devicePixelRatio,1.5));sw=Math.min(640,Math.round(w*.55));sh=Math.max(120,Math.round(sw*h/w));emit.width=sw;emit.height=sh;freeTargets();for(let i=0;i<2;i++){const tex=texture(sw,sh),fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);targets.push({tex,fbo});}reset();}
 function reset(){last=0;for(const t of targets){gl.bindFramebuffer(gl.FRAMEBUFFER,t.fbo);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);}}
 function use(p){gl.useProgram(p);gl.bindBuffer(gl.ARRAY_BUFFER,quad);const a=gl.getAttribLocation(p,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);}
 function tex(p,name,t,unit){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);gl.uniform1i(gl.getUniformLocation(p,name),unit);}
 function draw(state,q,now){if(dead||!targets.length)return;const dt=Math.min(.045,last?(now-last)/1000:1/60);last=now;
 brush.clearRect(0,0,sw,sh);brush.globalCompositeOperation='lighter';const scale=sw/width;
 for(const p of state.positions){if(p.index%14||p.u>.64)continue;const radius=(1.8+Math.sin(Math.PI*p.u)*5)*scale;
 const x=p.x*scale,y=p.y*sh/height,g=brush.createRadialGradient(x,y,0,x,y,radius);g.addColorStop(0,'rgba(255,255,255,.22)');g.addColorStop(.45,'rgba(255,255,255,.09)');g.addColorStop(1,'rgba(255,255,255,0)');brush.fillStyle=g;brush.fillRect(x-radius,y-radius,radius*2,radius*2);}
 gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,emission);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,emit);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
 const back=1-front;gl.bindFramebuffer(gl.FRAMEBUFFER,targets[back].fbo);gl.viewport(0,0,sw,sh);use(advect);tex(advect,'previous',targets[front].tex,0);tex(advect,'emission',emission,1);gl.uniform2f(gl.getUniformLocation(advect,'texel'),1/sw,1/sh);gl.uniform1f(gl.getUniformLocation(advect,'dt'),dt);gl.uniform1f(gl.getUniformLocation(advect,'time'),q*5);gl.uniform1f(gl.getUniformLocation(advect,'fade'),Math.max(0,(q-.65)/.35));gl.drawArrays(gl.TRIANGLES,0,6);front=back;
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);use(compose);tex(compose,'density',targets[front].tex,0);gl.uniform2f(gl.getUniformLocation(compose,'resolution'),canvas.width,canvas.height);gl.uniform1f(gl.getUniformLocation(compose,'time'),q*5);gl.uniform1f(gl.getUniformLocation(compose,'fade'),Math.max(0,Math.min(1,(q-.78)/.18)));gl.drawArrays(gl.TRIANGLES,0,6);
 }
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();dead=true;});
 return {canvas,resize,reset,draw,get available(){return !dead;},dispose(){dead=true;freeTargets();gl.deleteTexture(emission);gl.deleteBuffer(quad);gl.deleteProgram(advect);gl.deleteProgram(compose);gl.getExtension('WEBGL_lose_context')?.loseContext();}};
}
