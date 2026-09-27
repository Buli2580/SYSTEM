import type {HealthAdapter,HealthMetric} from '../health/contract';

let adapter:HealthAdapter|null=null;

export function registerMoveHealthAdapter(next:HealthAdapter|null){adapter=next}
export async function moveHealthAvailable(){return adapter?adapter.available():false}
export async function readMoveHealth(metric:HealthMetric,startAt:string,endAt:string){
  if(!adapter||!await adapter.available())throw new Error('HEALTH_PROVIDER_UNAVAILABLE');
  const rows=await adapter.read(metric,startAt,endAt);
  return rows.filter(row=>row.metric===metric&&Number.isFinite(row.value)&&row.value>=0&&Number.isFinite(Date.parse(row.startAt))&&Number.isFinite(Date.parse(row.endAt)));
}
