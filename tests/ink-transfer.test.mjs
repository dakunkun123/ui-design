import {test} from 'node:test';
import assert from 'node:assert/strict';
import {updateAsh,positionAt} from '../src/inkTransfer.js';
function sample(){return {particles:[{sx:500,sy:200,dx:20,dy:60,start:.1,arrival:.5,seed:.2,off:0},{sx:520,sy:250,dx:22,dy:60,start:.2,arrival:.9,seed:.7,off:4}],pixels:{data:new Uint8ClampedArray([20,30,25,255,20,30,25,73])},image:{data:new Uint8ClampedArray(8)},sg:{putImageData(){}},lastQ:-1,arrived:0,positions:[]};}
test('glyph is completely empty before first arrival',()=>{const s=sample();assert.equal(updateAsh(s,.3),0);assert.ok(s.image.data.every(x=>x===0));});
test('arrivals persist and preserve original alpha',()=>{const s=sample();assert.equal(updateAsh(s,.6),.5);assert.deepEqual([...s.image.data],[20,30,25,255,0,0,0,0]);assert.equal(updateAsh(s,.7),.5);});
test('completion reproduces every source glyph byte',()=>{const s=sample();updateAsh(s,1);assert.deepEqual(s.image.data,s.pixels.data);assert.equal(s.positions.length,0);});
test('reverse rebuild removes future deposits',()=>{const s=sample();updateAsh(s,1);assert.equal(updateAsh(s,.6),.5);assert.equal(s.image.data[7],0);assert.equal(updateAsh(s,0),0);});
test('repeated frame cannot double-count arrivals',()=>{const s=sample();updateAsh(s,.6);updateAsh(s,.6);assert.equal(s.arrived,1);});
test('transport starts and ends at exact endpoints with finite interior',()=>{const f=sample().particles[0];const a=positionAt(f,0),b=positionAt(f,1);assert.equal(a.x,f.sx);assert.equal(a.y,f.sy);assert.ok(Math.abs(b.x-f.dx)<1e-8&&Math.abs(b.y-f.dy)<1e-8);for(let q=0;q<=1;q+=.01){const p=positionAt(f,q);assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));}});
