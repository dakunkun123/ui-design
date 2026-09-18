export const LEAF_COVER=1.2, LEAF_END=3;
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function transitionVeil(t){return t<=LEAF_COVER?smooth((t-.25)/(LEAF_COVER-.4)):1-smooth((t-LEAF_COVER-.12)/(LEAF_END-LEAF_COVER-.12));}
