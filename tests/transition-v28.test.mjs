import test from 'node:test';
import assert from 'node:assert/strict';
import {transitionVeil,LEAF_COVER,LEAF_END} from '../src/transitionTiming.js';
import {createLeafRenderer} from '../src/leafRenderer.js';
test('scene commit is fully occluded, with clear endpoints',()=>{
 assert.equal(transitionVeil(0),0);assert.equal(transitionVeil(LEAF_COVER),1);assert.equal(transitionVeil(LEAF_COVER+.1),1);assert.equal(transitionVeil(LEAF_END),0);
 for(let t=0;t<=LEAF_END;t+=.01){assert(transitionVeil(t)>=0&&transitionVeil(t)<=1);assert(Math.abs(transitionVeil(t+.01)-transitionVeil(t))<.025);}
});
test('three themes draw distinct motifs; maple density stays bounded',async()=>{
 const old={Image:globalThis.Image,innerWidth:globalThis.innerWidth,innerHeight:globalThis.innerHeight,devicePixelRatio:globalThis.devicePixelRatio};
 try{
 globalThis.Image=class{set src(v){queueMicrotask(()=>this.onload());}};globalThis.innerWidth=1920;globalThis.innerHeight=1080;globalThis.devicePixelRatio=2;
 let leaves=0,rings=0;const ctx=new Proxy({drawImage(){leaves++;},ellipse(){rings++;},createLinearGradient(){return {addColorStop(){}};}},{get(o,k){return o[k]||(()=>{});}});
 const canvas={dataset:{},getContext:()=>ctx},r=await createLeafRenderer(canvas);
 r.draw(1,'autumn');assert.equal(leaves,46);assert.equal(canvas.dataset.transitionTheme,'autumn');
 r.draw(1,'ferry');assert.equal(leaves,46);assert.equal(rings,12);
 r.draw(1,'sword');assert.equal(leaves,46);assert.equal(rings,12);assert.equal(canvas.dataset.leafCount,'0');r.dispose();
 }finally{for(const [k,v] of Object.entries(old))if(v===undefined)delete globalThis[k];else globalThis[k]=v;}
});
