export function sectorDiscoveryCopy(sectorId:string){return {eyebrow:'WORLD DISCOVERY',title:'SECTOR DISCOVERED',detail:sectorId};}
export function worldSignalStrength(distanceMeters:number){return distanceMeters<100?'STRONG':distanceMeters<500?'MEDIUM':'WEAK';}
