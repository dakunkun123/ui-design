import {smooth,clamp} from './willowModel.js';
export const ART_COVER=1.45,ART_END=3.8;
export function artWindow(t){return {front:-.28+1.56*smooth(t/1.3),back:-.28+1.56*smooth((t-1.65)/(ART_END-1.65)),life:clamp(t/ART_END)};}
export function artEdge(u,t){return Math.sin(u*11+t*.8)*.025+Math.sin(u*29-t*.6)*.011+Math.sin(u*63+t)*.004;}
