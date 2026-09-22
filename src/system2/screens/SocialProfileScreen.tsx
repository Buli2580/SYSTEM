import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Text, View } from 'react-native';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import { useSystem } from '../state/SystemProvider';
import { getCloudSocialCounts } from '../cloud/socialCore';
import { toPublicPlayerProfile, type SocialCounts } from '../social';
import SocialCounters from '../components/SocialCounters';
import Action from '../components/Action';
import { useMountedRef } from '../hooks/useMountedRef';

export default function SocialProfileScreen() {
  const router = useRouter();
  const mounted = useMountedRef();
  const { player } = useSystem();
  const profile = toPublicPlayerProfile(player);
  const [counts, setCounts] = useState<SocialCounts>({ followers: 0, following: 0, friends: 0 });

  useEffect(() => {
    void getCloudSocialCounts()
      .then(next => { if (mounted.current) setCounts(next); })
      .catch(() => undefined);
  }, []);

  return <SystemPage title="PROFIL SYSTEMU" subtitle="NETWORK // MY IDENTITY">
    <View style={s.panel}><Text style={s.label}>SYSTEM ID</Text><Text style={s.title}>{profile.displayName}</Text><Text style={s.body}>LV {profile.level} · {profile.rank} · {profile.title ?? 'NO TITLE'}</Text><Text style={s.body}>{profile.streak} DAY STREAK · {profile.verifiedQuestCount} QUESTS · {profile.discoveredSectors} SECTORS</Text></View>
    <SocialCounters {...counts} />
    <View style={s.panel}><Action label="ZNAJOMI I ZAPROSZENIA →" onPress={() => router.push('/friends')} /></View>
    <View style={s.panel}><Text style={s.label}>PRIVACY</Text><Text style={s.body}>E-mail, tokeny i dokładne GPS nie należą do profilu publicznego.</Text></View>
  </SystemPage>;
}
