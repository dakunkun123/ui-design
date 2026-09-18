import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leafPosition } from '../src/leafMotion.mjs';
const start={x:650,y:120}, end={x:500,y:780};
test('leaf path starts at the twig and ends beyond the stage',()=>{
 for(let variant=0;variant<8;variant++) {
  assert.deepEqual(leafPosition(start,end,0,variant),start);
  const last=leafPosition(start,end,1,variant);
  assert.ok(Math.abs(last.x-end.x)<1e-8); assert.equal(last.y,end.y);
 }
});
test('all paths descend continuously with bounded lateral motion',()=>{
 for(let variant=0;variant<8;variant++) {
  let previous=start;
  for(let i=1;i<=1000;i++) {
   const current=leafPosition(start,end,i/1000,variant);
   assert.ok(current.y>previous.y);
   assert.ok(Math.abs(current.x-previous.x)<2);
   assert.ok(current.x>=474 && current.x<=676);
   previous=current;
  }
 }
});
test('out of range progress is clamped',()=>{
 assert.deepEqual(leafPosition(start,end,-3),start);
 assert.deepEqual(leafPosition(start,end,3),end);
});
