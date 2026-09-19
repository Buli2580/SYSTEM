import type {SocialActivityEvent} from './types';
const PRIVATE_KEYS=new Set(['latitude','longitude','email','deviceId','authId','privateNotes','accessToken','refreshToken']);
export function sanitizeActivityForPublic(event:SocialActivityEvent):SocialActivityEvent{const metadata:Record<string,unknown>={};for(const [k,v] of Object.entries(event.metadata)){if(!PRIVATE_KEYS.has(k))metadata[k]=v;}return {...event,metadata};}
