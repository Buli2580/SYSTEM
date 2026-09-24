import {cloudRequest} from '../cloud/http';
import {getAICloudSession} from './guestAuth';
import type {PlayerProfile} from '../core/types';
import {directStory,type StoryDirective} from '../story/director2';
import {loadActiveCompanion} from '../companions/storage';

export type AIStoryDirective=StoryDirective&{source:'ai'|'fallback';model?:string};

export async function requestAIStoryDirector(player:PlayerProfile,input:{bossHp?:number|null;worldUnlocked:boolean;failed:number;streak:number}):Promise<AIStoryDirective>{
 const fallback={...directStory(player,input),source:'fallback' as const};
 const session=await getAICloudSession();
 if(!session)return fallback;
 try{
  const companion=await loadActiveCompanion().catch(()=>null);
  const response=await cloudRequest<any>('/functions/v1/ai-game-master',{
   method:'POST',
   body:JSON.stringify({action:'story_director',context:{player:{level:player.realLevel,rank:player.rank,streak:player.streak},story:input,companion}}),
  },session.accessToken);
  if(!response||response.source!=='ai'||typeof response.headline!=='string'||!['QUEST','WORLD','BOSS','RECOVERY'].includes(response.next))return fallback;
  return{
   chapter:String(response.chapter||fallback.chapter).slice(0,40),
   headline:String(response.headline).slice(0,80),
   message:String(response.message||fallback.message).slice(0,240),
   threat:[1,2,3].includes(Number(response.threat))?Number(response.threat) as 1|2|3:fallback.threat,
   next:response.next,
   source:'ai',
   ...(typeof response.model==='string'?{model:response.model}:{}),
  };
 }catch{return fallback;}
}
