import { useEffect, useMemo, useState } from 'react';
import type { DesktopApi } from './api/desktopApi';
import { getDesktopApi } from './api/desktopApi';
import { HomeScreen } from './features/home/HomeScreen';
import { SetupScreen } from './features/setup/SetupScreen';

interface AppProps {
  api?: DesktopApi;
}

export default function App({ api }: AppProps) {
  const desktopApi = useMemo(() => api ?? getDesktopApi(), [api]);
  const [route, setRoute] = useState<'home' | 'setup' | 'match'>('home');

  useEffect(() => {
    if (desktopApi.surface === 'public' || desktopApi.subscribeToState === undefined) return;
    return desktopApi.subscribeToState(() => setRoute('match'));
  }, [desktopApi]);

  if (desktopApi.surface === 'public') {
    return <main className="waiting-screen" role="status">Waiting for the host</main>;
  }
  if (route === 'setup') {
    return <SetupScreen api={desktopApi} onBack={() => setRoute('home')} onStarted={() => setRoute('match')} />;
  }
  if (route === 'match') {
    return <main className="waiting-screen" role="status">Match started</main>;
  }
  return <HomeScreen onNewMatch={() => setRoute('setup')} />;
}
