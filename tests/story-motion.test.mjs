import test from 'node:test';
import assert from 'node:assert/strict';
import {scenePose,chapterStep,sceneVerses} from '../src/storyMotion.js';
test('chapter destinations persist without whole-scene zoom',()=>{for(let k=0;k<3;k++){const p=scenePose(k,3);assert.deepEqual(p,scenePose(k,3));assert.equal(p.scale,1);}assert.notDeepEqual(scenePose(0,3),scenePose(0,0));});
test('chapter movement is bounded and reversible',()=>{assert.equal(chapterStep(0,-1,5),0);assert.equal(chapterStep(4,1,5),4);assert.equal(chapterStep(chapterStep(2,1,5),-1,5),2);});
test('three stories use distinct camera paths',()=>{assert.notDeepEqual(scenePose(0,2),scenePose(1,2));assert.notDeepEqual(scenePose(1,2),scenePose(2,2));});
test('every chapter has its own short scene verse',()=>{assert.deepEqual(sceneVerses.map(v=>v.length),[5,5,4]);assert.equal(new Set(sceneVerses.flat()).size,14);for(const verse of sceneVerses.flat())assert.ok(verse.length>0&&verse.length<=14);});
