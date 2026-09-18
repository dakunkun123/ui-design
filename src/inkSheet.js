// Authored pigment, deformed as a connected surface instead of round sprites.
export function loadInkSheet(onReady=()=>{}){
 const image=new Image();image.onload=()=>onReady(true);image.onerror=()=>onReady(false);image.src='/assets/ink-sheet-v18.webp';return image;
}
const painters=new WeakMap();
function painter(ctx){
 if(painters.has(ctx))return painters.get(ctx);
 const surface=document.createElement('canvas'),gl=surface.getContext('webgl2',{alpha:true,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:true});
 if(!gl){painters.set(ctx,null);return null;}
 const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
 const vs=shader(gl.VERTEX_SHADER,'#version 300 es\nin vec2 position;in vec2 uv;out vec2 v;void main(){v=uv;gl_Position=vec4(position,0.,1.);}');
 const fs=shader(gl.FRAGMENT_SHADER,'#version 300 es\nprecision mediump float;uniform sampler2D art;in vec2 v;out vec4 color;void main(){color=texture(art,v);}');
 const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
 const buffer=gl.createBuffer(),texture=gl.createTexture();gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
 for(const [name,offset] of [['position',0],['uv',8]]){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,16,offset);}
 gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const p={surface,gl,buffer,texture,program,source:null};painters.set(ctx,p);return p;
}
export function releaseInkSheet(ctx){const p=painters.get(ctx);if(p){p.gl.deleteBuffer(p.buffer);p.gl.deleteTexture(p.texture);p.gl.deleteProgram(p.program);p.gl.getExtension('WEBGL_lose_context')?.loseContext();}painters.delete(ctx);}
export function drawInkSheet(ctx,image,point,cols=24,rows=6){
 if(!image.complete||!image.naturalWidth)return;
 const grid=[];
 for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++)grid.push(point(x/cols,y/rows));
 const left=Math.min(...grid.map(p=>p.x)),top=Math.min(...grid.map(p=>p.y)),w=Math.max(1,Math.max(...grid.map(p=>p.x))-left),h=Math.max(1,Math.max(...grid.map(p=>p.y))-top);
 let p;try{p=painter(ctx);}catch{painters.set(ctx,null);}
 if(!p||p.gl.isContextLost()){ctx.drawImage(image,left,top,w,h);return;}
 const {gl,surface}=p,sw=Math.min(1200,Math.ceil(w*1.5)),sh=Math.min(650,Math.ceil(h*1.5));if(surface.width!==sw)surface.width=sw;if(surface.height!==sh)surface.height=sh;
 gl.viewport(0,0,sw,sh);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(p.program);
 if(p.source!==image){gl.bindTexture(gl.TEXTURE_2D,p.texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);p.source=image;}
 const values=[];const vertex=(i,u,v)=>{const q=grid[i];values.push((q.x-left)/w*2-1,1-(q.y-top)/h*2,u,v);};
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=y*(cols+1)+x,u=x/cols,v=y/rows,du=1/cols,dv=1/rows;vertex(i,u,v);vertex(i+1,u+du,v);vertex(i+cols+1,u,v+dv);vertex(i+1,u+du,v);vertex(i+cols+2,u+du,v+dv);vertex(i+cols+1,u,v+dv);}
 gl.bindBuffer(gl.ARRAY_BUFFER,p.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.DYNAMIC_DRAW);gl.drawArrays(gl.TRIANGLES,0,values.length/4);ctx.drawImage(surface,left,top,w,h);
}
