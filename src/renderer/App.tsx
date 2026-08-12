import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DesktopApi } from './api/desktopApi';
import type { HostGameView, PublicGameView } from '../shared/game/types';
import { getDesktopApi } from './api/desktopApi';
import { HomeScreen } from './features/home/HomeScreen';
import { SetupScreen } from './features/setup/SetupScreen';
import { GameSurface } from './features/game/GameSurface';
import { HistoryScreen } from './features/history/HistoryScreen';
import { ContentLibraryScreen } from './features/content/ContentLibraryScreen';
import { I18nProvider, translate } from './i18n';
import type { Language } from '../shared/game/types';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { defaultAudioSettings, type AudioSettings } from '../shared/media/contracts';

interface AppProps {
  api?: DesktopApi;
}

export default function App({ api }: AppProps) {
  const desktopApi = useMemo(() => api ?? getDesktopApi(), [api]);
  const [route, setRoute] = useState<'home' | 'setup' | 'match' | 'history' | 'content' | 'settings'>('home');
  const [hostView, setHostView] = useState<HostGameView | null>(null);
  const [publicView, setPublicView] = useState<PublicGameView | null>(null);
  const [locale, setLocale] = useState<Language>('en');
  const [resumableAvailability, setResumableAvailability] = useState<{
    api: DesktopApi;
    available: boolean;
  } | null>(null);
  const [resumePending, setResumePending] = useState(false);
  const [resumeError, setResumeError] = useState(false);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(defaultAudioSettings);
  const [playOpening, setPlayOpening] = useState(false);
  const [mediaWarning, setMediaWarning] = useState(false);
  const navigationGeneration = useRef(0);
  const hasResumableMatch = resumableAvailability?.api === desktopApi
    && resumableAvailability.available;
  const navigate = useCallback((next: 'home' | 'setup' | 'match' | 'history' | 'content' | 'settings') => {
    navigationGeneration.current += 1;
    setResumePending(false);
    setResumeError(false);
    setRoute(next);
  }, []);

  useEffect(() => {
    if (desktopApi.surface === 'public') return desktopApi.subscribeToState(setPublicView);
    if (desktopApi.subscribeToState === undefined) return;
    return desktopApi.subscribeToState((view) => { setHostView(view); navigate('match'); });
  }, [desktopApi, navigate]);

  useEffect(() => {
    if (desktopApi.surface !== 'host' || route !== 'home') return;
    let active = true;
    void desktopApi.hasResumableMatch().then((available) => {
      if (active) setResumableAvailability({ api: desktopApi, available });
    }, () => {
      if (active) setResumableAvailability({ api: desktopApi, available: false });
    });
    return () => { active = false; };
  }, [desktopApi, route]);

  useEffect(() => {
    if (desktopApi.surface !== 'host' || desktopApi.getAudioSettings === undefined) return;
    let active = true;
    void desktopApi.getAudioSettings().then((settings) => { if (active) setAudioSettings(settings); }, () => undefined);
    return () => { active = false; };
  }, [desktopApi]);

  useEffect(() => {
    if (desktopApi.surface !== 'host' || desktopApi.subscribeToMediaWarnings === undefined) return;
    return desktopApi.subscribeToMediaWarnings(() => setMediaWarning(true));
  }, [desktopApi]);

  if (desktopApi.surface === 'public') {
    const publicLocale = publicView?.language ?? 'en';
    return <I18nProvider locale={publicLocale}>{publicView === null
      ? <main className="waiting-screen" role="status">{translate(publicLocale, 'app.waitingHost')}</main>
      : <GameSurface surface="public" view={publicView} />}</I18nProvider>;
  }
  let content: React.ReactNode;
  if (route === 'setup') {
    content = <SetupScreen api={desktopApi} initialLanguage={locale} onLanguageChange={setLocale}
      onBack={() => navigate('home')} onStarted={() => { setPlayOpening(true); navigate('match'); }} />;
  } else if (route === 'history') {
    content = <HistoryRoute api={desktopApi} onBack={() => navigate('home')} />;
  } else if (route === 'content') {
    content = <ContentLibraryScreen api={desktopApi} onBack={() => navigate('home')} />;
  } else if (route === 'settings') {
    content = <SettingsScreen settings={audioSettings} onBack={() => navigate('home')} onSave={async (settings) => {
      if (desktopApi.updateAudioSettings === undefined) return;
      const saved = await desktopApi.updateAudioSettings(settings);
      setAudioSettings(saved);
    }} />;
  } else if (route === 'match') {
    const matchLocale = hostView?.state.config.language ?? locale;
    content = hostView === null
      ? <main className="waiting-screen" role="status">{translate(matchLocale, 'app.startingMatch')}</main>
      : <GameSurface
        surface="host"
        view={hostView}
        api={desktopApi}
        audioSettings={audioSettings}
        playOpening={playOpening}
        onAudioWarning={() => setMediaWarning(true)}
        onMute={() => {
          const next = { ...audioSettings, muted: !audioSettings.muted };
          setAudioSettings(next);
          void desktopApi.updateAudioSettings?.(next).then(setAudioSettings, () => setAudioSettings(audioSettings));
        }}
        onHome={hostView.state.phase === 'complete' ? () => navigate('home') : undefined}
      />;
  } else {
    const resume = async () => {
    if (resumePending || !hasResumableMatch) return;
    const generation = navigationGeneration.current;
    setResumePending(true);
    setResumeError(false);
    try {
      const view = await desktopApi.resumeMatch();
      if (generation !== navigationGeneration.current) return;
      if (view === null) {
        setResumableAvailability({ api: desktopApi, available: false });
        return;
      }
      setHostView(view);
      setPlayOpening(false);
      setLocale(view.state.config.language);
      navigate('match');
    } catch {
      if (generation === navigationGeneration.current) setResumeError(true);
    } finally {
      if (generation === navigationGeneration.current) setResumePending(false);
    }
    };
    content = <HomeScreen
      onNewMatch={() => navigate('setup')}
      onResume={() => void resume()}
      onHistory={() => navigate('history')}
      onContent={() => navigate('content')}
      onSettings={desktopApi.getAudioSettings === undefined ? undefined : () => navigate('settings')}
      hasResumableMatch={hasResumableMatch}
      resumePending={resumePending}
      resumeError={resumeError}
    />;
  }
  const activeLocale = hostView !== null && route === 'match' ? hostView.state.config.language : locale;
  return <I18nProvider locale={activeLocale}>
    {mediaWarning ? <p role="alert">{translate(activeLocale, 'settings.mediaWarning')}</p> : null}
    {content}
  </I18nProvider>;
}

function HistoryRoute({ api, onBack }: { api: Extract<DesktopApi, { surface: 'host' }>; onBack: () => void }) {
  const [result, setResult] = useState<{
    entries: Awaited<ReturnType<typeof api.listHistory>>;
    error: boolean;
  } | null>(null);

  useEffect(() => {
    let active = true;
    void api.listHistory().then((entries) => {
      if (active) setResult({ entries, error: false });
    }, () => {
      if (active) setResult({ entries: [], error: true });
    });
    return () => { active = false; };
  }, [api]);

  return <HistoryScreen
    entries={result?.entries ?? []}
    loading={result === null}
    error={result?.error ?? false}
    onBack={onBack}
  />;
}
