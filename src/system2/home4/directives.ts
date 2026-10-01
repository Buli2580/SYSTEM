import type {WorldDirectives,BossDirectives} from '../gameMaster/types';
// Pure adapter: HOME controls effect budgets, GM owns all world meaning.
export function directivePresentation(world:WorldDirectives,boss:BossDirectives,reduced:boolean,lowPower:boolean){
 const animate=!reduced&&!lowPower;
 return {night:world.lighting==='NIGHT',tier:world.tier,boss:boss.reaction==='DEFEATED'?'CLEARED':boss.presence?'THREAT':'DORMANT',weather:world.weather,
 animate,particles:animate&&world.weather!=='CLEAR'?6:0,parallax:animate?6:0,warm:world.lighting==='WARM',calm:world.reaction==='RECOVERY'||world.reaction==='COMEBACK',bossOpacity:boss.threat===3?.65:.25} as const;
}
