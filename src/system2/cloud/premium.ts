import {getValidSession} from './auth';
import {cloudRequest} from './http';
import type {Plan} from '../premium/entitlements';

export type CloudPremiumEntitlement={
 plan:Plan;
 provider:string|null;
 productId:string|null;
 entitlementKey:string;
 validUntil:string|null;
 active:boolean;
};

type Row={
 plan:string;provider:string|null;product_id:string|null;entitlement_key:string;
 valid_until:string|null;active:boolean;
};

export async function getMyPremiumEntitlement():Promise<CloudPremiumEntitlement>{
 const session=await getValidSession();
 if(!session)return{plan:'FREE',provider:null,productId:null,entitlementKey:'SYSTEM_PREMIUM',validUntil:null,active:false};
 const rows=await cloudRequest<Row[]>('/rest/v1/rpc/get_my_premium_entitlement',{method:'POST',body:'{}'},session.accessToken);
 const row=rows[0];
 if(!row)return{plan:'FREE',provider:null,productId:null,entitlementKey:'SYSTEM_PREMIUM',validUntil:null,active:false};
 const active=row.active===true&&row.plan==='PREMIUM';
 return{
  plan:active?'PREMIUM':'FREE',
  provider:typeof row.provider==='string'?row.provider:null,
  productId:typeof row.product_id==='string'?row.product_id:null,
  entitlementKey:typeof row.entitlement_key==='string'&&row.entitlement_key?row.entitlement_key:'SYSTEM_PREMIUM',
  validUntil:typeof row.valid_until==='string'?row.valid_until:null,
  active,
 };
}
