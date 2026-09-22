import type { ScreenMood, ThreatLevel, WorldScene, WorldSceneContext, WorldSceneId, WorldTime } from './types';

export const WORLD_SCENES: Record<WorldSceneId, WorldScene> = {
  CITY:{id:'CITY',label:'URBAN SHADOW',accent:'#1ddcff',secondary:'#102833',particle:'rain',silhouettes:'city'},
  FOREST:{id:'FOREST',label:'FOREST VEIL',accent:'#60d6a7',secondary:'#10251c',particle:'mist',silhouettes:'trees'},
  INDUSTRIAL:{id:'INDUSTRIAL',label:'IRON DISTRICT',accent:'#ff9c5a',secondary:'#2e1b12',particle:'embers',silhouettes:'factory'},
  RUINS:{id:'RUINS',label:'FALLEN SECTOR',accent:'#9cb8d0',secondary:'#151c24',particle:'dust',silhouettes:'ruins'},
  BOSS_ZONE:{id:'BOSS_ZONE',label:'THREAT DOMAIN',accent:'#b96cff',secondary:'#27122f',particle:'shards',silhouettes:'boss'},
  PORTAL:{id:'PORTAL',label:'RIFT GATE',accent:'#6ceeff',secondary:'#171d3d',particle:'runes',silhouettes:'portal'},
  WORLD:{id:'WORLD',label:'SYSTEM WORLD',accent:'#00e5ff',secondary:'#071f2b',particle:'mist',silhouettes:'world'},
};

export function currentWorldTime(date = new Date()): WorldTime {
  const h=date.getHours();
  return h>=7&&h<17?'DAY':h>=17&&h<21?'DUSK':'NIGHT';
}

export function chooseScene(ctx: WorldSceneContext): WorldScene {
  if(ctx.scene) return WORLD_SCENES[ctx.scene];
  if(ctx.screen==='BOSS'||(ctx.threat??0)>=3) return WORLD_SCENES.BOSS_ZONE;
  if(ctx.screen==='WORLD') return WORLD_SCENES.WORLD;
  if(ctx.screen==='CHARACTER') return WORLD_SCENES.PORTAL;
  if(ctx.screen==='QUESTS') return (ctx.threat??0)>=2?WORLD_SCENES.RUINS:WORLD_SCENES.CITY;
  if(ctx.screen==='LAUNCH') return (ctx.level??1)>=25?WORLD_SCENES.PORTAL:WORLD_SCENES.RUINS;
  return WORLD_SCENES.CITY;
}

export function normalizedSceneContext(input: WorldSceneContext) {
  return {
    ...input,
    level:input.level??1,
    rank:input.rank??'E',
    time:input.time??currentWorldTime(),
    weather:input.weather??'CLEAR',
    threat:(input.threat??0) as ThreatLevel,
    scene:(input.scene??chooseScene(input).id),
    cityHint:input.cityHint??null,
  };
}

export function sceneForScreen(screen: ScreenMood, level=1, threat: ThreatLevel=0) {
  return chooseScene({screen,level,threat});
}
