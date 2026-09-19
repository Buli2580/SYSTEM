import { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, Share, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as Location from 'expo-location';
import SystemPage, { pageStyles as s } from '../components/SystemPage';
import Action from '../components/Action';
import SystemError from '../components/SystemError';
import { useSystem } from '../state/SystemProvider';
import {
  cloudOutboxLatestFailure,
  cloudOutboxStats,
  getCloudUserBinding,
  loadBackgroundQuestSession,
  systemDiagnostics,
} from '../storage/database';
import { getValidSession } from '../cloud/auth';
import { getRemoteSyncStatus, type RemoteSyncStatus } from '../cloud/state';
import { SYSTEM_BACKGROUND_LOCATION_TASK } from '../background/locationService';
import { buildTesterReport } from '../diagnostics/report';
import { submitTesterFeedbackReport } from '../cloud/feedback';
import { awaitWithTimeout } from '../storage/awaitWithTimeout';

type Report = ReturnType<typeof buildTesterReport>;

function yesNo(value: boolean) { return value ? 'TAK' : 'NIE'; }

export default function TesterDiagnosticsScreen() {
  const router = useRouter();
  const { ready, activeQuestId, error: systemError, notificationError } = useSystem();
  const [report, setReport] = useState<Report | null>(null);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);

  const reportText = useMemo(
    () => report ? JSON.stringify(report, null, 2) : '',
    [report],
  );

  const refresh = useCallback(async () => {
    const [
      foreground,
      background,
      services,
      backgroundAvailable,
      nativeTask,
      database,
      backgroundSession,
      cloudBinding,
      outbox,
      latestFailure,
      session,
    ] = await Promise.all([
      Location.getForegroundPermissionsAsync(),
      Location.getBackgroundPermissionsAsync(),
      Location.hasServicesEnabledAsync(),
      Location.isBackgroundLocationAvailableAsync(),
      Location.hasStartedLocationUpdatesAsync(SYSTEM_BACKGROUND_LOCATION_TASK).catch(() => false),
      systemDiagnostics(),
      loadBackgroundQuestSession(),
      getCloudUserBinding(),
      cloudOutboxStats(),
      cloudOutboxLatestFailure(),
      getValidSession(),
    ]);

    let remoteSync: RemoteSyncStatus | null = null;
    if (session) {
      remoteSync = await getRemoteSyncStatus().catch(() => null);
    }

    setReport(buildTesterReport({
      generatedAt: new Date().toISOString(),
      appVersion: Constants.expoConfig?.version ?? 'unknown',
      versionCode: Constants.expoConfig?.android?.versionCode ?? null,
      platform: Platform.OS,
      osVersion: Platform.Version,
      ready,
      activeQuestId,
      systemError,
      notificationError,
      foregroundPermission: foreground.status,
      backgroundPermission: background.status,
      locationServicesEnabled: services,
      backgroundLocationAvailable: backgroundAvailable,
      nativeBackgroundTaskStarted: nativeTask,
      database,
      backgroundSession,
      cloudAuthenticated: Boolean(session),
      cloudBound: Boolean(cloudBinding),
      outbox,
      remoteSync,
      latestSyncFailure: latestFailure,
    }));
  }, [ready, activeQuestId, systemError, notificationError]);

  useFocusEffect(useCallback(() => {
    void refresh().catch(cause => setError(cause instanceof Error ? cause.message : 'Nie udało się zbudować diagnostyki.'));
  }, [refresh]));

  async function run(task: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    setStatus('');
    try {
      await awaitWithTimeout(task(), 20_000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Operacja diagnostyczna nie powiodła się.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function shareReport() {
    if (!report) await refresh();
    const current = report ?? null;
    const text = current ? JSON.stringify(current, null, 2) : reportText;
    if (!text) throw new Error('Najpierw odśwież diagnostykę.');
    await Share.share({
      title: 'SYSTEM — raport testera',
      message: 'SYSTEM TESTER REPORT\n\n' + text,
    });
  }

  async function sendReport() {
    const current = report ?? (() => { throw new Error('Najpierw odśwież diagnostykę.'); })();
    const id = await submitTesterFeedbackReport({
      message: description.trim() || 'Raport diagnostyczny testera bez dodatkowego opisu.',
      diagnostics: current as unknown as Record<string, unknown>,
    });
    setStatus('RAPORT WYSŁANY // ' + id.slice(0, 8).toUpperCase());
    setDescription('');
  }

  return <SystemPage title="TRYB TESTERA" subtitle="DIAGNOSTYKA // BETA">
    <Action label="← USTAWIENIA" onPress={() => router.back()} />

    <View style={s.panel}>
      <Text style={s.label}>STATUS SYSTEMU</Text>
      <Text style={s.title}>{report ? 'RAPORT GOTOWY' : 'ODCZYTYWANIE…'}</Text>
      {report && <>
        <Text style={s.body}>Aplikacja {report.app.version} · build {report.app.version_code ?? '?'}</Text>
        <Text style={s.body}>Baza v{report.storage.schema ?? '?'} · integralność {String(report.storage.integrity ?? '?').toUpperCase()}</Text>
        <Text style={s.body}>GPS przód {String(report.permissions.foreground_location).toUpperCase()} · tło {String(report.permissions.background_location).toUpperCase()}</Text>
        <Text style={s.body}>Usługi lokalizacji {yesNo(report.permissions.location_services_enabled)} · native background task {yesNo(report.background_tracking.native_task_started)}</Text>
        <Text style={s.body}>Cloud {report.cloud.authenticated ? 'ZALOGOWANY' : 'OFFLINE'} · kolejka {report.cloud.outbox.pending} · błędy sync {report.cloud.outbox.failed}</Text>
        <Text style={s.body}>Aktywna misja: {report.runtime.active_quest_id ?? 'brak'} · sesja tła: {report.background_tracking.session?.quest_id ?? 'brak'}</Text>
      </>}
      <Action label="ODŚWIEŻ DIAGNOSTYKĘ" disabled={busy} onPress={() => { void run(refresh); }} />
    </View>

    <View style={s.panel}>
      <Text style={s.label}>ZGŁOŚ PROBLEM</Text>
      <Text style={s.body}>Raport nie zawiera współrzędnych GPS, tokenów logowania, e-maila ani pełnego identyfikatora konta.</Text>
      <TextInput
        accessibilityLabel="Opis problemu testera"
        value={description}
        onChangeText={setDescription}
        maxLength={1000}
        multiline
        placeholder="Co się stało? Co robiłeś chwilę wcześniej?"
        placeholderTextColor="#8397a3"
        style={{ color: '#fff', minHeight: 96, borderWidth: 1, borderColor: '#24505c', borderRadius: 12, padding: 12, textAlignVertical: 'top' }}
      />
      <Action label="WYŚLIJ RAPORT DO SYSTEM CLOUD" disabled={busy || !report} onPress={() => { void run(sendReport); }} />
      <Action label="UDOSTĘPNIJ RAPORT" disabled={busy || !report} onPress={() => { void run(shareReport); }} />
      {!!status && <Text style={s.body}>{status}</Text>}
    </View>

    <View style={s.panel}>
      <Text style={s.label}>PODGLĄD RAPORTU</Text>
      <Text selectable style={s.body}>{reportText || 'Brak danych.'}</Text>
    </View>

    {error && <SystemError message={error} retry={() => { void run(refresh); }} />}
  </SystemPage>;
}
