import test from 'node:test';
import assert from 'node:assert/strict';
import {leafSeed,leafState,LEAF_COVER,LEAF_END} from '../src/leafWind.js';
const w=1920,h=1080;
const particles=Array.from({length:300},(_,i)=>({x:leafSeed(i)*w,y:leafSeed(i+300)*h,z:i*.035,layer:i%2,seed:leafSeed(i+70),angle:leafSeed(i+90)}));
test('all in-frame leaves settle before scene changes',()=>{
 for(const p of particles){const a=leafState(LEAF_COVER,p,w,h);assert.equal(a.x,p.x);assert.equal(a.y,p.y);assert.equal(a.flight,0);}
});
test('gust releases individual leaves, never a shared curtain progress',()=>{
 const flying=particles.map(p=>leafState(2.7,p,w,h).flight);assert(flying.some(x=>x===0));assert(flying.some(x=>x>.5));assert(new Set(flying).size>30);
});
test('entry has independent rotations and curved depth travel',()=>{
 const states=particles.map(p=>leafState(.6,p,w,h));
 assert(new Set(states.map(a=>a.ry.toFixed(2))).size>50);
 assert(states.every((a,i)=>a.z<particles[i].z));
 assert(states.some((a,i)=>a.x>particles[i].x));assert(states.some((a,i)=>a.x<particles[i].x));
});
test('all visible leaves depart beyond right edge before transition finishes',()=>{
 for(const p of particles){const a=leafState(LEAF_END,p,w,h);assert(a.x>w+500);}
});
test('leaf trajectories are continuous and finite',()=>{
 for(const p of particles.slice(0,20)){let prev=leafState(0,p,w,h);for(let t=.01;t<LEAF_END;t+=.01){const a=leafState(t,p,w,h);assert(Object.values(a).every(Number.isFinite));assert(Math.abs(a.x-prev.x)<160);prev=a;}}
});
