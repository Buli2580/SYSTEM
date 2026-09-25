import {Text,View} from 'react-native';
import {journeyPlan,stageRequirement,type Journey} from '../journeys/model';
import {GOAL_LABELS} from '../goals/model';
import {pageStyles as s} from './SystemPage';
export default function JourneyProgress({journey:j}:{journey:Journey}){const plan=journeyPlan(j.category);return <View style={s.panel}>
 <Text style={s.label}>JOURNEY · {GOAL_LABELS[j.category]} · {j.status}</Text>
 <Text style={s.body}>Plan rozwoju przez zweryfikowane sesje. TIMER potwierdza czas, nie jakość nauki ani rezultat osobisty.</Text>
 {plan.map((p,i)=><View key={p.name}><Text style={s.title}>{j.completedStages.includes(i)?'✓':i===j.currentStage?'→':'○'} {i+1}. {p.name}</Text><Text style={s.body}>{p.actions} sesji · {p.days} różnych dni · {p.normal} NORMAL/HARD</Text><Text style={s.label}>{p.milestone} · +{p.xp} REAL XP jednorazowo</Text>{i===j.currentStage&&j.status!=='COMPLETED'&&<Text style={s.body}>POSTĘP: {stageRequirement(j)}</Text>}</View>)}
 {j.status==='COMPLETED'&&<Text style={s.body}>Plan ukończony. Oceń, czy Twój osobisty cel został osiągnięty; jego oznaczenie nie przyznaje dodatkowego XP.</Text>}
 </View>;}
