export type PlayerPresence='ONLINE'|'RECENT'|'OFFLINE';
export function playerPresence(lastSeen:number,now=Date.now()):PlayerPresence{const age=Math.max(0,now-lastSeen);return age<120000?'ONLINE':age<86400000?'RECENT':'OFFLINE';}
