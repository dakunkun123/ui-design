import test from 'node:test';
import assert from 'node:assert/strict';
import {easeSpeed,leafTransport} from '../src/natureDynamics.js';
test('all leaves cover before scene commit and leave at completion',()=>{
 for(let i=0;i<=120;i++){
  assert.deepEqual(leafTransport(1.15,i/1000),{arrival:1,exit:0});
  assert.deepEqual(leafTransport(2.5,i/1000),{arrival:1,exit:1});
 }
});
test('flight release decelerates without snapping or reversing',()=>{
 let speed=3.8;for(let i=0;i<180;i++){const next=easeSpeed(speed,false,1/60);assert(next<speed&&next>1);speed=next;}assert(speed<1.02);
});
test('flight easing is frame-rate independent',()=>{
 let a=1,b=1;for(let i=0;i<60;i++)a=easeSpeed(a,true,1/60);for(let i=0;i<30;i++)b=easeSpeed(b,true,1/30);assert(Math.abs(a-b)<1e-12);
});
