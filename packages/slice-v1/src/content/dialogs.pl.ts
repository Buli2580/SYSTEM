/**
 * Original Polish SYSTEM copy for Slice V1 first 10 minutes.
 * World-ready: Lębork is the pilot city, not the only setting.
 */
export const SYSTEM_VOICE = {
  designation: 'SYSTEM',
  rankETitle: 'RANGA E — REKRUT',
  selected:
    'Zostałeś wybrany. Nie jako bohater z legendy — jako ktoś, kto jeszcze nie uciekł przed prawdą o sobie.',
  rankGranted:
    'Nadaję ci Rangę E. To nie jest upokorzenie. To jest punkt startu, z którego nikt nie kupił skrótu.',
  firstOrderHeadline: 'PIERWSZY ROZKAZ',
  firstOrderBody:
    'Wykonaj Pierwszy Ruch. Udowodnij ruch w świecie rzeczywistym. SYSTEM nie nagradza zamiaru — nagradza dowód.',
  progressTick: 'Ślad zarejestrowany. Kontynuuj.',
  verified: 'ROZKAZ WYKONANY. Dowód przyjęty przez Quest Engine.',
  rewardGranted: 'Nagroda zatwierdzona. REAL XP zapisane. Nie da się tego kupić.',
  baseUnlock: 'BAZA odblokowana. Tu wrócisz, gdy świat będzie głośny.',
  sessionEnd:
    'Koniec sesji. Jutro czeka kolejny rozkaz. SYSTEM nie znika, gdy zamkniesz aplikację — tylko czeka.',
  nextDayTeaser: 'JUTRO: nowy rozkaz w Bazie. Seria zaczyna się od powrotu.',
} as const;

export const FIRST_ORDER_COPY = {
  id: 'slice_first_order_v1',
  title: 'PIERWSZY RUCH',
  objectiveShort: 'Wykonaj pierwszy prawdziwy ruch pod nadzorem SYSTEMU.',
  instructionGps:
    'Wyjdź i przejdź około 500 metrów w bezpiecznym tempie. SYSTEM mierzy dystans GPS. Nie musisz iść do konkretnego zabytku — wystarczy ruch w Twojej okolicy.',
  instructionLeborkPilot:
    'Wariant pilotażowy Lębork: jeśli jesteś blisko wskazanego punktu, możesz zakończyć trasę przy markerze misji. To smak świata — nie warunek zaliczenia.',
  instructionTimerFlex:
    'Wariant elastyczny (gdy GPS niedostępny lub tryb bezpieczny): utrzymaj skupienie na rozkazie przez 5 minut na pierwszym planie. To nadal weryfikacja QE typu TIMER — nie wirtualny teleport.',
  instructionDev:
    'DEV: symuluj wyłącznie ścieżkę weryfikacji testowej. Nie generuj fałszywych dowodów GPS jako „prawdziwych”.',
} as const;

export const BASE_COPY = {
  title: 'BAZA',
  locked: 'Baza milczy. Najpierw wykonaj Pierwszy Rozkaz.',
  unlockedTitle: 'BAZA — WĘZEŁ REKRUTA',
  unlockedBody: 'Tu przeglądasz Rangę, ekwipunek i kolejny cel. Świat czeka na zewnątrz.',
  nextGoal: 'Jutro odbierz Daily Order. Dziś zapamiętaj, kim jesteś: Rangą E z pierwszym śladem.',
} as const;

export const DAILY_ORDER_TITLES = [
  'ŚWIT: 10 minut obecności',
  'KROK W STREFIE KOMFORTU',
  'ODDECH PRZED HAŁASEM',
  'MAPA WŁASNEGO PODWÓRKA',
  'CISZA BEZ UCIECZKI',
  'ŚLAD DLA JUTRA',
  'POWROTNY SYGNAŁ',
] as const;
