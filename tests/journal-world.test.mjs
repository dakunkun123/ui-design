import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {journalWorlds,updateWind,pointerPosition,approach} from '../src/journalWorldModel.js';
test('three stories have distinct art and stable semantic ids',()=>{
 assert.deepEqual(journalWorlds.map(w=>w.id),['autumn','ferry','sword']);
 assert.equal(new Set(journalWorlds.map(w=>w.object)).size,3);
 for(const w of journalWorlds)for(const key of ['object','backdrop'])assert.ok(existsSync(`public/assets/${w[key]}.webp`));
});
test('wind responds promptly, releases smoothly, then settles',()=>{
 let s={held:true,energy:0,pulse:0,x:.5,y:.5,tx:1,ty:0};
 for(let i=0;i<10;i++)s=updateWind(s,1/60);
 assert.ok(s.energy>.75&&s.energy<1);assert.ok(s.x>.7);
 s.held=false;const prev=s.energy;s=updateWind(s,1/60);assert.ok(s.energy<prev&&s.energy>prev*.95);
 for(let i=0;i<300;i++)s=updateWind(s,1/60);assert.ok(s.energy<.001);
});
test('button impulse is finite and drag coordinates are bounded',()=>{
 let s={held:false,energy:0,pulse:2.5,x:.5,y:.5,tx:.5,ty:.5};for(let i=0;i<600;i++)s=updateWind(s,1/60);assert.equal(s.pulse,0);assert.ok(s.energy<.001);
 assert.deepEqual(pointerPosition(-5,200,{left:0,top:0,width:100,height:100}),{x:0,y:1});
 assert.equal(approach(0,1,5,0),0);
});
