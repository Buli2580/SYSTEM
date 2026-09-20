export function normalizePlayerSearch(value:string){return value.trim().toLocaleLowerCase().replace(/[^a-z0-9_ąćęłńóśźż -]/g,'').slice(0,40);}
export function validatePlayerSearch(value:string){const q=normalizePlayerSearch(value);return{query:q,valid:q.length>=2&&q.length<=40};}
export function normalizeCity(value?:string){const x=value?.trim().replace(/\s+/g,' ');return x?x.slice(0,80):undefined;}
export function normalizeCountryCode(value?:string){const x=value?.trim().toUpperCase();return x&&/^[A-Z]{2}$/.test(x)?x:undefined;}
