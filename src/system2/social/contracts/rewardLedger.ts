export type RewardLedgerContract={actorId:string;enabled:boolean};export const validateRewardLedger=(v:RewardLedgerContract)=>v.actorId.trim().length>0&&v.enabled;
