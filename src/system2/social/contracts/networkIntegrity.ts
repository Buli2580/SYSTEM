export type NetworkIntegrity={healthy:boolean;checkedAt:string};export const networkIntegrityOk=(v:NetworkIntegrity)=>v.healthy&&v.checkedAt.length>0;
