import type { RewardReceipt } from '../core/rewards';
export type WorldReaction={kind:'LEVEL'|'RANK'|'TITLE'|'WORLD'|'BOSS'|'QUEST';headline:string;detail:string};
export function worldReactions(receipt:RewardReceipt):WorldReaction[]{
 const out:WorldReaction[]=[];
 if(receipt.bossDamage)out.push({kind:'BOSS',headline:'BOSS DAMAGED',detail:`-${receipt.bossDamage.dealt} HP`});
 if(receipt.afterLevel>receipt.beforeLevel)out.push({kind:'LEVEL',headline:'LEVEL UP',detail:`${receipt.beforeLevel} → ${receipt.afterLevel}`});
 if(receipt.afterRank!==receipt.beforeRank)out.push({kind:'RANK',headline:'RANK PROMOTION',detail:`${receipt.beforeRank} → ${receipt.afterRank}`});
 for(const title of receipt.newTitles)out.push({kind:'TITLE',headline:'TITLE UNLOCKED',detail:title});
 if(receipt.worldUnlocked)out.push({kind:'WORLD',headline:'WORLD UNLOCKED',detail:'Nowy obszar SYSTEMU jest dostępny.'});
 if(!out.length)out.push({kind:'QUEST',headline:'MISSION COMPLETE',detail:`+${receipt.realXp} XP`});
 return out;
}
