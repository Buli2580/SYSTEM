import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {Platform} from 'react-native';
import {cloudRequest} from '../cloud/http';
import {getValidSession,type CloudSession} from '../cloud/auth';

const KEY='system_ai_guest_session_v1';
let unavailableUntil=0;
let inFlight:Promise<CloudSession|null>|null=null;

type AuthPayload={
  access_token?:string;
  refresh_token?:string;
  expires_in?:number;
  expires_at?:number;
  user?:{id?:string};
};

function sessionFromPayload(payload:AuthPayload):CloudSession|null{
  if(!payload.access_token||!payload.refresh_token||!payload.user?.id)return null;
  const expiresAt=payload.expires_at
    ? payload.expires_at*1000
    : Date.now()+Math.max(60,payload.expires_in??3600)*1000;
  return{
    accessToken:payload.access_token,
    refreshToken:payload.refresh_token,
    expiresAt,
    user:{id:payload.user.id},
  };
}

async function readRaw(){
  if(Platform.OS==='web')return AsyncStorage.getItem(KEY);
  return SecureStore.getItemAsync(KEY);
}
async function write(session:CloudSession|null){
  const value=session?JSON.stringify(session):null;
  if(Platform.OS==='web'){
    if(value)await AsyncStorage.setItem(KEY,value);else await AsyncStorage.removeItem(KEY);
    return;
  }
  if(value)await SecureStore.setItemAsync(KEY,value);else await SecureStore.deleteItemAsync(KEY);
}
async function read():Promise<CloudSession|null>{
  const raw=await readRaw();
  if(!raw)return null;
  try{
    const s=JSON.parse(raw) as Partial<CloudSession>;
    if(typeof s.accessToken!=='string'||typeof s.refreshToken!=='string'||typeof s.expiresAt!=='number'||typeof s.user?.id!=='string'){
      await write(null);return null;
    }
    return s as CloudSession;
  }catch{
    await write(null);return null;
  }
}

async function refresh(session:CloudSession):Promise<CloudSession|null>{
  try{
    const payload=await cloudRequest<AuthPayload>('/auth/v1/token?grant_type=refresh_token',{
      method:'POST',
      body:JSON.stringify({refresh_token:session.refreshToken}),
    });
    const next=sessionFromPayload(payload);
    await write(next);
    return next;
  }catch{
    await write(null);
    return null;
  }
}

async function createAnonymous():Promise<CloudSession|null>{
  try{
    // Supabase Anonymous Sign-In uses the signup endpoint without email/phone.
    // This gives AI an authenticated, rate-limitable per-install identity without PII.
    const payload=await cloudRequest<AuthPayload>('/auth/v1/signup',{
      method:'POST',
      body:JSON.stringify({data:{system_purpose:'ai_game_master'}}),
    });
    const session=sessionFromPayload(payload);
    if(!session)throw new Error('ANONYMOUS_SESSION_MISSING');
    await write(session);
    unavailableUntil=0;
    return session;
  }catch{
    // Anonymous auth can be disabled in the Supabase project. Avoid hammering the
    // endpoint; local goal-aware fallback remains available.
    unavailableUntil=Date.now()+60*60*1000;
    return null;
  }
}

async function resolve():Promise<CloudSession|null>{
  const permanent=await getValidSession().catch(()=>null);
  if(permanent)return permanent;

  let guest=await read();
  if(guest&&guest.expiresAt-Date.now()<=120_000)guest=await refresh(guest);
  if(guest)return guest;
  if(Date.now()<unavailableUntil)return null;
  return createAnonymous();
}

export function getAICloudSession():Promise<CloudSession|null>{
  if(!inFlight){
    const operation=resolve();
    const tracked=operation.finally(()=>{if(inFlight===tracked)inFlight=null;});
    inFlight=tracked;
  }
  return inFlight;
}
