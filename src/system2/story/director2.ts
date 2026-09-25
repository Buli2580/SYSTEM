import type {PlayerProfile} from '../core/types';
export type StoryDirective={chapter:string;headline:string;message:string;threat:1|2|3;next:'QUEST'|'WORLD'|'BOSS'|'RECOVERY'};
export function directStory(player:PlayerProfile,input:{bossHp?:number|null;worldUnlocked:boolean;failed:number;streak:number}):StoryDirective{
 if(input.failed>=2)return{chapter:'RECOVERY',headline:'THE SYSTEM BENDS',message:'Nie cofamy historii. Zmniejszamy opór i odbudowujemy tempo.',threat:1,next:'RECOVERY'};
 if(typeof input.bossHp==='number'&&input.bossHp>0)return{chapter:'BOSS',headline:input.bossHp<=15?'FINAL STRIKE':'THE WALL REMAINS',message:'Twoje zweryfikowane działania wpływają na kolejną fazę starcia.',threat:3,next:'BOSS'};
 if(input.worldUnlocked)return{chapter:'WORLD',headline:'THE WORLD RESPONDS',message:'Nowe sektory i sygnały mogą otworzyć kolejny wątek.',threat:2,next:'WORLD'};
 return{chapter:'AWAKENING',headline:'FIRST SIGNAL',message:'Ukończ pierwsze misje i zbuduj tożsamość gracza.',threat:1,next:'QUEST'};
}