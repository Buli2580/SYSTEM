export type WorldLayer='SECTORS'|'SIGNALS'|'EVENTS'|'BOSSES'|'MOVE';
export type WorldMap2State={layers:Record<WorldLayer,boolean>;zoomMode:'LOCAL'|'REGION'|'WORLD';fog:boolean};
export const DEFAULT_WORLD_MAP_2:WorldMap2State={layers:{SECTORS:true,SIGNALS:true,EVENTS:true,BOSSES:true,MOVE:false},zoomMode:'LOCAL',fog:true};
export function toggleWorldLayer(state:WorldMap2State,layer:WorldLayer):WorldMap2State{return{...state,layers:{...state.layers,[layer]:!state.layers[layer]}};}