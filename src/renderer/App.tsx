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
import { SettingsScreen, SettingsStatusScreen } from './features/settings/SettingsScreen';
import { brandingAssetUrl, type AudioAssetKey, type AudioSettings, type MediaWarning } from '../shared/media/contracts';
import type { AppearanceSettings } from '../shared/settings/appearance';
import type { PublicPresentation } from '../shared/ipc/contracts';

const audioAssetLabelKeys = {
  opening: 'settings.asset.opening',
  'round-transition': 'settings.asset.round-transition',
  'daily-double': 'settings.asset.daily-double',
  'final-tension': 'settings.asset.final-tension',
  'correct-applause': 'settings.asset.correct-applause',
  'incorrect-crowd': 'settings.asset.incorrect-crowd',
  'countdown-tick': 'settings.asset.countdown-tick',
  'time-expired': 'settings.asset.time-expired',
  winner: 'settings.asset.winner',
} as const;

const AUDIO_SETTINGS_LOAD_TIMEOUT_MS = 3_000;

function loadAudioSettingsWithTimeout(request: Promise<AudioSettings>): Promise<AudioSettings> {
  return new Promise((resolve, reject) => {
    const timeout = globalThis.setTimeout(
      () => reject(new Error('AUDIO_SETTINGS_LOAD_TIMEOUT')),
      AUDIO_SETTINGS_LOAD_TIMEOUT_MS,
    );
    void request.then(
      (settings) => { globalThis.clearTimeout(timeout); resolve(settings); },
      (error: unknown) => { globalThis.clearTimeout(timeout); reject(error); },
    );
  });
}

interface AppProps {
  api?: DesktopApi;
}

export default function App({ api }: AppProps) {
  const desktopApi = useMemo(() => api ?? getDesktopApi(), [api]);
  const [route, setRoute] = useState<'home' | 'setup' | 'match' | 'history' | 'content' | 'settings'>('home');
  const [hostView, setHostView] = useState<HostGameView | null>(null);
  const [publicState, setPublicState] = useState<{
    view: PublicGameView;
    presentation: PublicPresentation;
  } | null>(null);
  const [locale, setLocale] = useState<Language>('en');
  const [resumableAvailability, setResumableAvailability] = useState<{
    api: DesktopApi;
    available: boolean;
  } | null>(null);
  const [resumePending, setResumePending] = useState(false);
  const [resumeError, setResumeError] = useState(false);
  const [audioState, setAudioState] = useState<
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'ready'; settings: AudioSettings; revision: number }
  >({ status: 'loading' });
  const [appearanceState, setAppearanceState] = useState<
    | { status: 'loading' }
    | { status: 'error' }
    | { status: 'ready'; settings: AppearanceSettings }
  >({ status: 'loading' });
  const [mediaWarnings, setMediaWarnings] = useState<Map<AudioAssetKey, MediaWarning>>(new Map());
  const navigationGeneration = useRef(0);
  const audioLoadSequence = useRef(0);
  const audioSaveSequence = useRef(0);
  const appearanceLoadSequence = useRef(0);
  const appearanceSaveSequence = useRef(0);
  const appearance = appearanceState.status === 'ready' ? appearanceState.settings : { version: 1 as const, reducedMotion: false, revision: 0 };
  const effectiveReducedMotion = appearanceState.status === 'ready' && appearance.reducedMotion;
  const hasResumableMatch = resumableAvailability?.api === desktopApi
    && resumableAvailability.available;
  const navigate = useCallback((next: 'home' | 'setup' | 'match' | 'history' | 'content' | 'settings') => {
    navigationGeneration.current += 1;
    setResumePending(false);
    setResumeError(false);
    setRoute(next);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--stage-background-image', `url("${brandingAssetUrl('stage-background')}")`);
    return () => { document.documentElement.style.removeProperty('--stage-background-image'); };
  }, []);

  useEffect(() => {
    if (desktopApi.surface !== 'host') return;
    if (desktopApi.subscribeToState === undefined) return;
    return desktopApi.subscribeToState((view) => { setHostView(view); navigate('match'); });
  }, [desktopApi, navigate]);

  useEffect(() => {
    if (desktopApi.surface !== 'public' || appearanceState.status === 'loading') return;
    return desktopApi.subscribeToState((view, presentation) => setPublicState({ view, presentation }));
  }, [appearanceState.status, desktopApi]);

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

  const loadAudioSettings = useCallback(() => {
    if (desktopApi.surface !== 'host' || desktopApi.getAudioSettings === undefined) return;
    const sequence = ++audioLoadSequence.current;
    setAudioState({ status: 'loading' });
    void loadAudioSettingsWithTimeout(desktopApi.getAudioSettings()).then(
      (settings) => { if (sequence === audioLoadSequence.current) setAudioState((state) => ({ status: 'ready', settings, revision: state.status === 'ready' ? state.revision + 1 : 1 })); },
      () => { if (sequence === audioLoadSequence.current) setAudioState({ status: 'error' }); },
    );
  }, [desktopApi]);

  const applyAppearanceSettings = useCallback((settings: AppearanceSettings) => {
    setAppearanceState((state) => state.status === 'ready' && state.settings.revision > settings.revision
      ? state
      : { status: 'ready', settings });
  }, []);

  useEffect(() => {
    if (desktopApi.subscribeToAppearance === undefined) return;
    return desktopApi.subscribeToAppearance(
      (settings) => {
        appearanceLoadSequence.current += 1;
        applyAppearanceSettings(settings);
      },
      () => setAppearanceState((state) => state.status === 'ready' ? state : { status: 'error' }),
    );
  }, [applyAppearanceSettings, desktopApi]);

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(effectiveReducedMotion);
    return () => { delete document.documentElement.dataset.reducedMotion; };
  }, [effectiveReducedMotion]);

  const loadAppearanceSettings = useCallback(() => {
    if (desktopApi.surface !== 'host' || desktopApi.getAppearanceSettings === undefined) return;
    const sequence = ++appearanceLoadSequence.current;
    setAppearanceState({ status: 'loading' });
    void desktopApi.getAppearanceSettings().then(
      (settings) => { if (sequence === appearanceLoadSequence.current) applyAppearanceSettings(settings); },
      () => { if (sequence === appearanceLoadSequence.current) setAppearanceState({ status: 'error' }); },
    );
  }, [applyAppearanceSettings, desktopApi]);

  const saveAppearanceSettings = useCallback(async (settings: AppearanceSettings) => {
    if (desktopApi.surface !== 'host' || desktopApi.updateAppearanceSettings === undefined) return;
    const sequence = ++appearanceSaveSequence.current;
    const saved = await desktopApi.updateAppearanceSettings(settings);
    if (sequence === appearanceSaveSequence.current) applyAppearanceSettings(saved);
  }, [applyAppearanceSettings, desktopApi]);

  useEffect(() => {
    if (desktopApi.surface !== 'host' || desktopApi.getAudioSettings === undefined) return;
    const sequence = ++audioLoadSequence.current;
    let active = true;
    void loadAudioSettingsWithTimeout(desktopApi.getAudioSettings()).then(
      (settings) => {
        if (active && sequence === audioLoadSequence.current) {
          setAudioState({ status: 'ready', settings, revision: 1 });
        }
      },
      () => { if (active && sequence === audioLoadSequence.current) setAudioState({ status: 'error' }); },
    );
    return () => { active = false; };
  }, [desktopApi]);

  useEffect(() => {
    if (desktopApi.surface !== 'host' || desktopApi.subscribeToMediaWarnings === undefined) return;
    return desktopApi.subscribeToMediaWarnings((event) => setMediaWarnings((warnings) => {
      const next = new Map(warnings);
      if (event.status === 'warning') next.set(event.assetKey, event);
      else next.delete(event.assetKey);
      return next;
    }));
  }, [desktopApi]);

  const saveAudioSettings = useCallback(async (settings: AudioSettings) => {
    if (desktopApi.surface !== 'host' || desktopApi.updateAudioSettings === undefined) return;
    const sequence = ++audioSaveSequence.current;
    setAudioState((state) => ({ status: 'ready', settings, revision: state.status === 'ready' ? state.revision + 1 : 1 }));
    try {
      const saved = await desktopApi.updateAudioSettings(settings);
      if (sequence === audioSaveSequence.current) setAudioState((state) => ({ status: 'ready', settings: saved, revision: state.status === 'ready' ? state.revision + 1 : 1 }));
    } catch (error) {
      if (sequence === audioSaveSequence.current) loadAudioSettings();
      throw error;
    }
  }, [desktopApi, loadAudioSettings]);

  if (desktopApi.surface === 'public') {
    const publicLocale = publicState?.view.language ?? 'en';
    return <I18nProvider locale={publicLocale}><div data-reduced-motion={effectiveReducedMotion}>{publicState === null
      ? <main className="waiting-screen" role="status">{translate(publicLocale, 'app.waitingHost')}</main>
      : <GameSurface surface="public" view={publicState.view} presentation={publicState.presentation} />}</div></I18nProvider>;
  }
  let content: React.ReactNode;
  if (route === 'setup') {
    content = audioState.status === 'loading' && desktopApi.getAudioSettings !== undefined
      ? <SettingsStatusScreen status="loading" onRetry={loadAudioSettings} onBack={() => navigate('home')} />
      : <SetupScreen api={desktopApi} initialLanguage={locale} onLanguageChange={setLocale}
        speechEnabled={audioState.status === 'ready' && audioState.settings.speechEnabled}
        onBack={() => navigate('home')} onStarted={() => navigate('match')} />;
  } else if (route === 'history') {
    content = <HistoryRoute api={desktopApi} onBack={() => navigate('home')} />;
  } else if (route === 'content') {
    content = <ContentLibraryScreen api={desktopApi} onBack={() => navigate('home')} />;
  } else if (route === 'settings') {
    content = audioState.status === 'ready' && appearanceState.status === 'ready'
      ? <SettingsScreen settings={audioState.settings} settingsRevision={audioState.revision}
        appearance={appearance} onSaveAppearance={async (value) => {
          await saveAppearanceSettings(value);
        }}
        onBack={() => navigate('home')} onSave={saveAudioSettings} />
      : <SettingsStatusScreen status={audioState.status === 'error' || appearanceState.status === 'error' ? 'error' : 'loading'} onRetry={() => { loadAudioSettings(); loadAppearanceSettings(); }} onBack={() => navigate('home')} />;
  } else if (route === 'match') {
    const matchLocale = hostView?.state.config.language ?? locale;
    const waitingForSpeechSettings = hostView?.state.config.speechEnabled === true
      && audioState.status === 'loading'
      && desktopApi.getAudioSettings !== undefined;
    content = hostView === null || waitingForSpeechSettings
      ? <main className="waiting-screen" role="status">{translate(matchLocale, 'app.startingMatch')}</main>
      : <GameSurface
        surface="host"
        view={hostView}
        api={desktopApi}
        audioSettings={audioState.status === 'ready' ? audioState.settings : undefined}
        onAudioWarning={(assetKey) => setMediaWarnings((warnings) => new Map(warnings).set(assetKey, { assetKey, reason: 'unreadable' }))}
        onMute={() => {
          if (audioState.status !== 'ready') return;
          void saveAudioSettings({ ...audioState.settings, muted: !audioState.settings.muted }).catch(() => undefined);
        }}
        onSaveAndQuit={desktopApi.saveAndQuit === undefined ? undefined : () => desktopApi.saveAndQuit!()}
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
  return <I18nProvider locale={activeLocale}><div className={route === 'match' ? 'app-shell app-shell--match' : 'app-shell'} data-reduced-motion={effectiveReducedMotion}>
    <div className="media-warnings">{[...mediaWarnings.values()].map((warning) => {
      const asset = translate(activeLocale, audioAssetLabelKeys[warning.assetKey]);
      return <p role="alert" key={warning.assetKey} aria-label={asset}>{translate(activeLocale, 'settings.mediaWarning', { asset })}</p>;
    })}</div>
    {content}
  </div></I18nProvider>;
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
