const WAITLIST_ENDPOINT='https://pbxkciwuepldyjamwdyc.supabase.co/functions/v1/system-waitlist';

function getDeviceId(){
  const key='system_landing_device_id';
  let id=localStorage.getItem(key);
  if(!id){
    id=(globalThis.crypto?.randomUUID?.()||('web-'+Date.now()+'-'+Math.random().toString(36).slice(2)));
    localStorage.setItem(key,id);
  }
  return id;
}

const deviceId=getDeviceId();
const locale=(navigator.language||'pl').slice(0,5);
const basePayload={source:'landing',locale,deviceId};

async function post(payload){
  const response=await fetch(WAITLIST_ENDPOINT,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({...basePayload,...payload})
  });
  let data={};
  try{data=await response.json();}catch{}
  if(!response.ok||data.ok!==true){
    const err=new Error(data.error||'request_failed');
    err.status=response.status;
    throw err;
  }
  return data;
}

if(!sessionStorage.getItem('system_landing_view_sent')){
  sessionStorage.setItem('system_landing_view_sent','1');
  post({action:'analytics',eventName:'landing_view'}).catch(()=>{});
}

const form=document.getElementById('waitlist');
const status=document.getElementById('form-status');
const button=document.getElementById('waitlist-submit');

form?.addEventListener('submit',async(e)=>{
  e.preventDefault();
  const email=document.getElementById('email').value.trim();
  const consent=document.getElementById('waitlist-consent').checked;
  const website=document.getElementById('website').value;

  if(!email||!consent)return;

  status.classList.remove('error');
  status.textContent='Łączenie z SYSTEM...';
  button.disabled=true;

  post({action:'analytics',eventName:'waitlist_submit_started'}).catch(()=>{});

  try{
    const result=await post({
      email,
      website,
      waitlistConsent:true
    });
    status.textContent=result.alreadyRegistered
      ? 'Jesteś już na liście. SYSTEM pamięta.'
      : 'Gotowe. Jesteś na liście oczekujących SYSTEM.';
    form.reset();
  }catch(error){
    status.classList.add('error');
    status.textContent='Nie udało się zapisać. Spróbuj ponownie za chwilę.';
    post({action:'analytics',eventName:'waitlist_error'}).catch(()=>{});
  }finally{
    button.disabled=false;
  }
});