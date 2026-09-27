import {Directory,File,Paths} from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

// Private, temporary camera preview for consenting adults only.
// It is NOT a verified quest proof and must never award XP or enter cloud
// evidence, analytics, or social posting without separate explicit consent.
const directory=()=>new Directory(Paths.cache,'system2-private-quest-photos');

export function isPrivateQuestPhoto(uri:string|undefined,dirUri:string):uri is string{
  if(!uri)return false;
  const prefix=dirUri.replace(/\/$/,'')+'/';
  return uri.startsWith(prefix)&&/^preview-[0-9]+-[a-z0-9]+\.jpg$/i.test(uri.slice(prefix.length));
}

export function removePrivateQuestPhoto(uri?:string){
  const dir=directory();
  if(!isPrivateQuestPhoto(uri,dir.uri))return;
  const owned=new File(uri);
  if(owned.exists)owned.delete();
}

// Remove any app-owned orphaned previews left by an interrupted session
// when the user next opens a quest. Never touch the gallery or avatar files.
export function purgeStalePrivateQuestPhotos(){
  const dir=directory();
  if(dir.exists)dir.delete();
}

export async function capturePrivateQuestPhoto():Promise<string|null>{
  const permission=await ImagePicker.requestCameraPermissionsAsync();
  if(!permission.granted)throw new Error('Aparat wymaga zgody w ustawieniach telefonu.');
  const result=await ImagePicker.launchCameraAsync({
    mediaTypes:['images'],quality:0.7,exif:false,base64:false,allowsEditing:false,
  });
  if(result.canceled)return null;
  const uri=result.assets?.[0]?.uri;
  if(!uri||! /^(file|content):\/\//i.test(uri))throw new Error('Aparat nie zwrócił poprawnego zdjęcia.');
  let owned:File|undefined;
  try{
    const dir=directory();
    dir.create({idempotent:true,intermediates:true});
    owned=new File(dir,'preview-'+Date.now()+'-'+Math.random().toString(36).slice(2,10)+'.jpg');
    await new File(uri).copy(owned);
    if(!owned.exists)throw new Error('Nie udało się zapisać lokalnego podglądu.');
    return owned.uri;
  }catch(e){
    if(owned){try{removePrivateQuestPhoto(owned.uri)}catch{/* best-effort cleanup */}}
    throw e;
  }
}
