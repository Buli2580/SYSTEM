export function bossDamageLabel(damage:number){return '-'+Math.max(0,damage).toLocaleString()+' HP';}
export function bossDamageIntensity(damage:number,maxHp:number){const r=damage/Math.max(1,maxHp);return r>=.1?'CRITICAL':r>=.03?'HEAVY':'NORMAL';}
