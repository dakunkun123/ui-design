export const easeSpeed=(speed,held,dt)=>speed+((held?3.8:1)-speed)*(1-Math.exp(-Math.max(0,dt)*1.7));
export function leafTransport(t,lag=0){
 const a=Math.max(0,Math.min(1,(t-lag)/1.03));
 const b=Math.max(0,Math.min(1,(t-1.25-lag)/1.05));
 return {arrival:1-(1-a)**3,exit:b*b};
}
