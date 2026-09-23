import type {MoveWorldEvent,MoveEventKind,MovementSkillKey} from './types';
const ROTATION:{kind:MoveEventKind;title:string;minutes:number;skill:MovementSkillKey}[]=[
{kind:'RUN_SIGNAL',title:'RUN SIGNAL',minutes:10,skill:'SPEED'},
{kind:'JUMP_ANOMALY',title:'JUMP ANOMALY',minutes:5,skill:'JUMP'},
{kind:'OUTDOOR_PORTAL',title:'OUTDOOR PORTAL',minutes:15,skill:'ENDURANCE'},
{kind:'BIKE_EVENT',title:'BIKE EVENT',minutes:20,skill:'COORDINATION'},
{kind:'BALL_CHALLENGE',title:'BALL CHALLENGE',minutes:10,skill:'CATCH'},
];
function hash(t:string){let h=7;for(let i=0;i<t.length;i++)h=(h*31+t.charCodeAt(i))>>>0;return h}
export function activeMoveEvent(playerId:string,now=Date.now()):MoveWorldEvent{
 const d=new Date(now),day=d.toISOString().slice(0,10),window=Math.floor(d.getUTCHours()/3),base=ROTATION[hash(playerId+day+window)%ROTATION.length];
 const start=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),window*3);
 return{id:`move-event:${day}:${window}`,...base,endsAt:new Date(start+3*3600000).toISOString()};
}
