import { Text, View } from 'react-native';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import HeroCardTile from '../components/HeroCardTile';
import { useHeroCards } from '../heroes/store';
import { SYSTEM_COLORS as C } from '../core';

export default function HeroCardsScreen() {
  const { cards, unlockedIds, activeHeroId, activeHero, equipHero } = useHeroCards();
  const unlocked = cards.filter(card => unlockedIds.includes(card.id));

  return (
    <SystemPage title="HERO CARDS" subtitle="COLLECTION // FORMS" intensity="hero">
      <View style={s.panel}>
        <Text style={s.label}>AKTYWNA FORMA</Text>
        <Text style={s.title}>{activeHero.name}</Text>
        <Text style={s.body}>{activeHero.codename} // {activeHero.rarity}</Text>
        <Text style={s.body}>{activeHero.lore}</Text>
        <View style={{ marginTop: 16, height: 1, backgroundColor: C.line }} />
        <Text style={[s.body, { marginTop: 14 }]}>KOLEKCJA {unlocked.length}/{cards.length} · Karty zmieniają wygląd i animacje postaci. Nie zwiększają XP ani siły gracza.</Text>
      </View>

      {cards.map((card, index) => (
        <HeroCardTile
          key={card.id}
          card={card}
          unlocked={unlockedIds.includes(card.id)}
          active={activeHeroId === card.id}
          index={index}
          onEquip={() => { void equipHero(card.id); }}
        />
      ))}
    </SystemPage>
  );
}
