import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';

function Section({ title, children }: { title: string; children: string }) {
  return <View style={s.panel}>
    <Text style={s.label}>{title}</Text>
    <Text style={s.body}>{children}</Text>
  </View>;
}

export default function PrivacyScreen() {
  const router = useRouter();
  return <SystemPage title="PRYWATNOŚĆ" subtitle="SYSTEM // DANE UŻYTKOWNIKA">
    <Section title="LOKALIZACJA">
      SYSTEM używa lokalizacji podczas aktywnych misji ruchowych do mierzenia dystansu i weryfikacji aktywności. Jeżeli użytkownik włączy lokalizację w tle, pomiar może działać także przy wygaszonym ekranie lub gdy aplikacja nie jest używana. Lokalizacja nie jest używana do reklam. Pełna historia trasy GPS nie jest wysyłana do SYSTEM CLOUD; aplikacja przetwarza punkty lokalnie i synchronizuje zagregowane dane weryfikacyjne.
    </Section>
    <Section title="KONTO I PROFIL">
      Po utworzeniu konta SYSTEM CLOUD przetwarza adres e-mail, identyfikator konta oraz dane publicznego profilu podane przez użytkownika, takie jak nazwa, opis i dobrowolna lokalizacja rankingowa. Profil może pozostać prywatny.
    </Section>
    <Section title="PROGRES I AKTYWNOŚĆ">
      SYSTEM zapisuje progres gry, ukończone misje, XP, poziomy, cechy, streaki, historię weryfikacji oraz techniczne zdarzenia synchronizacji. Dane lokalne są przechowywane w SQLite na urządzeniu. Wybrane zagregowane zdarzenia mogą być synchronizowane z SYSTEM CLOUD.
    </Section>
    <Section title="USŁUGI ZEWNĘTRZNE">
      SYSTEM korzysta z Supabase do kont, bazy danych i synchronizacji oraz z Vercel do publikacji strony internetowej. Analityka produktu może korzystać z Amplitude w zakresie zdarzeń technicznych bez przesyłania haseł ani pełnych tras GPS.
    </Section>
    <Section title="USUNIĘCIE DANYCH">
      Dane lokalne można wyczyścić w Ustawieniach SYSTEMU. Zalogowany użytkownik może w ekranie SYSTEM ONLINE złożyć żądanie usunięcia konta chmurowego i powiązanych danych. Zewnętrzny kanał żądania usunięcia konta zostanie opublikowany na stronie SYSTEM przed pierwszym zgłoszeniem aplikacji do Google Play.
    </Section>
    <Action label="← WRÓĆ" onPress={() => router.back()} />
  </SystemPage>;
}
