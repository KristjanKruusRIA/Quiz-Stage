import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DesktopApi } from './api/desktopApi';
import type { HostGameView, PublicGameView } from '../shared/game/types';
import { getDesktopApi } from './api/desktopApi';
import { HomeScreen } from './features/home/HomeScreen';
import { SetupScreen } from './features/setup/SetupScreen';
import { GameSurface } from './features/game/GameSurface';
import { HistoryScreen } from './features/history/HistoryScreen';
import { ContentLibraryScreen } from './features/content/ContentLibraryScreen';

interface AppProps {
  api?: DesktopApi;
}

export default function App({ api }: AppProps) {
  const desktopApi = useMemo(() => api ?? getDesktopApi(), [api]);
  const [route, setRoute] = useState<'home' | 'setup' | 'match' | 'history' | 'content'>('home');
  const [hostView, setHostView] = useState<HostGameView | null>(null);
  const [publicView, setPublicView] = useState<PublicGameView | null>(null);
  const [resumableAvailability, setResumableAvailability] = useState<{
    api: DesktopApi;
    available: boolean;
  } | null>(null);
  const [resumePending, setResumePending] = useState(false);
  const [resumeError, setResumeError] = useState(false);
  const navigationGeneration = useRef(0);
  const hasResumableMatch = resumableAvailability?.api === desktopApi
    && resumableAvailability.available;
  const navigate = useCallback((next: 'home' | 'setup' | 'match' | 'history' | 'content') => {
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

  if (desktopApi.surface === 'public') {
    return publicView === null
      ? <main className="waiting-screen" role="status">Waiting for the host</main>
      : <GameSurface surface="public" view={publicView} />;
  }
  if (route === 'setup') {
    return <SetupScreen api={desktopApi} onBack={() => navigate('home')} onStarted={() => navigate('match')} />;
  }
  if (route === 'history') {
    return <HistoryRoute api={desktopApi} onBack={() => navigate('home')} />;
  }
  if (route === 'content') {
    return <ContentLibraryScreen api={desktopApi} onBack={() => navigate('home')} />;
  }
  if (route === 'match') {
    return hostView === null
      ? <main className="waiting-screen" role="status">Starting match</main>
      : <GameSurface
        surface="host"
        view={hostView}
        api={desktopApi}
        onHome={hostView.state.phase === 'complete' ? () => navigate('home') : undefined}
      />;
  }
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
      navigate('match');
    } catch {
      if (generation === navigationGeneration.current) setResumeError(true);
    } finally {
      if (generation === navigationGeneration.current) setResumePending(false);
    }
  };
  return <HomeScreen
    onNewMatch={() => navigate('setup')}
    onResume={() => void resume()}
    onHistory={() => navigate('history')}
    onContent={() => navigate('content')}
    hasResumableMatch={hasResumableMatch}
    resumePending={resumePending}
    resumeError={resumeError}
  />;
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
