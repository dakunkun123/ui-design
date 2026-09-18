export function chapterStep(current,delta,length){return Math.max(0,Math.min(length-1,current+delta));}
export function scenePose(kind,step){const s=Math.max(0,Math.min(8,step));return [{x:-s*.6,y:0,scale:1},{x:s*1.1,y:0,scale:1},{x:0,y:0,scale:1}][kind]||{x:0,y:0,scale:1};}
export const sceneVerses=[['石阶坠入雾中','风起，路未尽','留书，不留此心','先渡身后的人','前山已有炊烟'],['一舟，候故人','十年旧事入江流','青玉归，旧人远','有些债，不必偿','风大，少载一人'],['胜负之外，尚有人间','七年，只为这一剑','不把来路交给仇人','收锋，天已明']];
