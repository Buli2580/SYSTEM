import {calculateAge} from '../identity/age';
import type {MoveAgeMode} from './types';
export function moveAgeMode(birthDate?:string,today=new Date(Date.now())):MoveAgeMode{
 const age=calculateAge(birthDate,today);
 if(age===null||age>=18)return'ADULT';
 if(age<=8)return'AGE_6_8';
 if(age<=12)return'AGE_9_12';
 return'AGE_13_17';
}
export function moveAgeLabel(mode:MoveAgeMode){return mode==='AGE_6_8'?'6–8 LAT':mode==='AGE_9_12'?'9–12 LAT':mode==='AGE_13_17'?'13–17 LAT':'18+'}
