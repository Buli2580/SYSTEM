import { Text, View } from 'react-native';
import type { RewardReceipt } from '../core/rewards';
import { pageStyles as s } from './SystemPage';
export default function RewardSummary({ receipt }: { receipt: RewardReceipt }) {
  return <View style={s.panel} accessibilityLabel="Podsumowanie zapisanej nagrody">
    <Text style={s.label}>REWARD SUMMARY</Text>
    <Text style={s.title}>+{receipt.realXp} REAL XP</Text>
    <Text style={s.body}>{Object.entries(receipt.skillXp).map(([skill, xp]) => `+${xp} ${skill} XP`).join(' · ')}</Text>
    <Text style={s.body}>+{receipt.energy} ENERGY</Text>
    {receipt.distanceMeters > 0 && <Text style={s.body}>{Math.round(receipt.distanceMeters)} M VERIFIED</Text>}
    {receipt.afterLevel > receipt.beforeLevel && <Text style={s.label}>REAL LEVEL {receipt.beforeLevel} → {receipt.afterLevel}</Text>}
    {receipt.skillLevels.map(skill => <Text key={skill.key} style={s.body}>{skill.key} LV.{skill.before} → LV.{skill.after}</Text>)}
    {receipt.newTitles.length > 0 && <Text style={s.body}>TITLE UNLOCKED · {receipt.newTitles.join(' · ')}</Text>}
    {receipt.worldUnlocked && <Text style={s.label}>WORLD UNLOCKED</Text>}
  </View>;
}
