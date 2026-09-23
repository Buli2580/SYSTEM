import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import { buildStarterCampaign, type GoalCampaign } from '../gameMaster/planner';
import { validateCampaign } from '../gameMaster/guardrails';
import { requestGoalAIGameMaster, type AIGameMasterResponse } from '../ai';
import { useSystem } from '../state/SystemProvider';
import { campaignGoalAlreadyExists, campaignGoalToInput } from '../gameMaster/goalBridge';

const input={color:'#fff',minHeight:56,borderWidth:1,borderColor:'#24505c',borderRadius:12,paddingHorizontal:14,marginTop:12} as const;

export default function GameMasterScreen(){
  const system=useSystem();
  const [goal,setGoal]=useState('');
  const [campaign,setCampaign]=useState<GoalCampaign|null>(null);
  const [preview,setPreview]=useState<AIGameMasterResponse|null>(null);
  const [loading,setLoading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [error,setError]=useState<string|null>(null);

  async function generate(){
    if(loading)return;
    try{
      const local=buildStarterCampaign(goal);
      const checked=validateCampaign(local);
      if(!checked.ok)throw new Error('CAMPAIGN_REJECTED');
      setCampaign(local);
      setSaved(false);
      setLoading(true);
      setError(null);
      setPreview(await requestGoalAIGameMaster(system,local.goal));
    }catch(cause){
      setPreview(null);
      setError(cause instanceof Error&&cause.message.includes('200')
        ? cause.message
        : 'Opisz cel konkretnie w kilku słowach. SYSTEM nie tworzy ryzykownych ani niebezpiecznych zadań.');
    }finally{
      setLoading(false);
    }
  }

  async function saveGoal(){
    if(!campaign||saving||saved||campaignGoalAlreadyExists(campaign,system.goals))return;
    setSaving(true);
    setError(null);
    try{
      await system.createPlayerGoal(campaignGoalToInput(campaign));
      setSaved(true);
    }catch(cause){
      setError(cause instanceof Error?cause.message:'Nie udało się zapisać celu.');
    }finally{
      setSaving(false);
    }
  }

  const goalExists=campaign?campaignGoalAlreadyExists(campaign,system.goals):false;

  return <SystemPage title="GAME MASTER" subtitle="AI CORE // CAMPAIGN PREVIEW">
    <View style={s.panel}>
      <Text style={s.label}>TWÓJ CEL</Text>
      <Text style={s.title}>CO CHCESZ ZMIENIĆ?</Text>
      <Text style={s.body}>SYSTEM tworzy bezpieczny podgląd kampanii. AI proponuje treść, ale nie ustala XP, rang ani nagród — te pozostają pod kontrolą canonical reward engine.</Text>
      <TextInput accessibilityLabel="Cel kampanii" value={goal} onChangeText={setGoal} placeholder="np. chcę przebiec 10 km" placeholderTextColor="#8397a3" style={input}/>
      <Action label={loading?'AI ANALIZUJE...':'GENERUJ PODGLĄD KAMPANII'} onPress={()=>{void generate();}}/>
    </View>
    {error&&<SystemError message={error} retry={()=>setError(null)} actionLabel="ZAMKNIJ"/>}
    {campaign&&<View style={s.panel}>
      <Text style={s.label}>{campaign.category} · {campaign.weeks} WEEKS · PREVIEW</Text>
      <Text style={s.title}>{campaign.title}</Text>
      <Text style={s.body}>{campaign.goal}</Text>
    </View>}
    {preview&&<View style={s.panel}>
      <Text style={s.label}>AI DIRECTOR // {preview.source==='ai'?'ONLINE':'SAFE FALLBACK'}</Text>
      <Text style={s.title}>{preview.director.headline}</Text>
      <Text style={s.body}>{preview.director.message}</Text>
      <Text style={s.body}>{preview.briefing}</Text>
    </View>}
    {preview?.quests.map(q=><View key={q.key} style={s.panel}>
      <Text style={s.label}>{q.estimatedMinutes} MIN · {q.difficulty.toUpperCase()} · {q.verification.toUpperCase()}</Text>
      <Text style={s.title}>{q.title}</Text>
      <Text style={s.body}>{q.description}</Text>
      <Text style={s.body}>WHY // {q.reason}</Text>
    </View>)}
    {campaign&&<View style={s.panel}>
      <Text style={s.label}>MILESTONES</Text>
      {campaign.milestones.map(x=><Text key={x} style={s.body}>• {x}</Text>)}
      <Text style={s.body}>Podgląd nie przyznaje XP ani nie zapisuje ukończeń. Nagrody powstają dopiero w zweryfikowanym canonical quest flow.</Text>
      <Action
        label={saved||goalExists?'CEL JEST JUŻ W SYSTEMIE':saving?'ZAPISYWANIE...':'DODAJ CEL DO SYSTEMU →'}
        disabled={saving||saved||goalExists}
        onPress={()=>{void saveGoal();}}
      />
    </View>}
  </SystemPage>;
}
