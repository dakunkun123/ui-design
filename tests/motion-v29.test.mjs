import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {fileURLToPath} from 'node:url';
import {createStroke,appendPoint,branchPoint,growthAt} from '../src/willowModel.js';
import {artWindow,artEdge,ART_COVER,ART_END} from '../src/artTransitionTiming.js';

test('fast pointer input reaches its exact destination without future-dated growth',()=>{
 const p=createStroke(1);appendPoint(p,.1,.2,4,1920,1080);appendPoint(p,.92,.78,4.016,1920,1080);
 assert.equal(p.points.at(-1).x,.92);assert.equal(p.points.at(-1).y,.78);
 assert.ok(p.points.every(v=>v.time<=4.016));assert.ok(p.branches.length>20);
});
test('long gestures retain latest input after geometry decimation',()=>{
 const p=createStroke(2);for(let i=0;i<5000;i++)appendPoint(p,(i%160)/160,.3+Math.sin(i*.1)*.2,i/60,1920,1080);
 assert.equal(p.points.at(-1).x,4999%160/160);assert.ok(p.points.length<=1800);assert.ok(p.branches.length<=100);
});
test('branch roots remain fixed while flexible tips move',()=>{
 const b={x:.4,y:.2,angle:.4,seed:.5,side:1};assert.deepEqual(branchPoint(b,0,1000,800,0),branchPoint(b,0,1000,800,4));
 assert.notDeepEqual(branchPoint(b,1,1000,800,0),branchPoint(b,1,1000,800,4));
});
test('branch growth precedes leaf unfolding and proximal leaves precede distal leaves',()=>{
 assert.equal(growthAt(0,0).branch,0);assert.equal(growthAt(.2,.8).leaf,0);
 assert.ok(growthAt(.8,.2).leaf>growthAt(.8,.8).leaf);assert.equal(growthAt(3,1).leaf,1);
});
test('all three transition masks fully cover before scene commit and clear after',()=>{
 for(let i=0;i<=100;i++)for(const skew of [0,-.17,.17]){
  const u=i/100,e=artEdge(u,ART_COVER),mid=artWindow(ART_COVER);
  assert.ok(mid.front+e+skew>1);assert.ok(mid.back+artEdge(u,ART_COVER+.3)+skew<0);
  assert.ok(artWindow(0).front+artEdge(u,0)+skew<0);
  assert.ok(artWindow(ART_END).back+artEdge(u,ART_END+.3)+skew>1);
 }
});
test('18 new render assets exist with real transparency and usable resolution',async()=>{
 for(const [name,count] of [['willow',6],['maple',3],['bamboo',3],['wash',3],['fish',3]])for(let i=0;i<count;i++){
  const im=sharp(fileURLToPath(new URL(`../public/assets/${name}-${i}-v29.webp`,import.meta.url)));
  const meta=await im.metadata(),stats=await im.stats();assert.equal(meta.hasAlpha,true);assert.ok(Math.max(meta.width,meta.height)>=270);
  const a=stats.channels.at(-1);assert.ok(a.min===0&&a.max>200&&a.mean<245);
 }
});
