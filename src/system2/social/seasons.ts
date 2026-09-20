export type SocialSeason={id:string;name:string;startsAt:string;endsAt:string};export function seasonActive(s:SocialSeason,now=new Date().toISOString()){return s.startsAt<=now&&now<s.endsAt;}
