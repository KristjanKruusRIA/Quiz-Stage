import { useEffect, useMemo, useState } from 'react';
import type { DesktopApi } from './api/desktopApi';
import type { HostGameView, PublicGameView } from '../shared/game/types';
import { getDesktopApi } from './api/desktopApi';
import { HomeScreen } from './features/home/HomeScreen';
import { SetupScreen } from './features/setup/SetupScreen';
import { GameSurface } from './features/game/GameSurface';

interface AppProps {
  api?: DesktopApi;
}

export default function App({ api }: AppProps) {
  const desktopApi = useMemo(() => api ?? getDesktopApi(), [api]);
  const [route, setRoute] = useState<'home' | 'setup' | 'match'>('home');
  const [hostView, setHostView] = useState<HostGameView | null>(null);
  const [publicView, setPublicView] = useState<PublicGameView | null>(null);

  useEffect(() => {
    if (desktopApi.surface === 'public') return desktopApi.subscribeToState(setPublicView);
    if (desktopApi.subscribeToState === undefined) return;
    return desktopApi.subscribeToState((view) => { setHostView(view); setRoute('match'); });
  }, [desktopApi]);

  if (desktopApi.surface === 'public') {
    return publicView === null
      ? <main className="waiting-screen" role="status">Waiting for the host</main>
      : <GameSurface surface="public" view={publicView} />;
  }
  if (route === 'setup') {
    return <SetupScreen api={desktopApi} onBack={() => setRoute('home')} onStarted={() => setRoute('match')} />;
  }
  if (route === 'match') {
    return hostView === null
      ? <main className="waiting-screen" role="status">Starting match</main>
      : <GameSurface surface="host" view={hostView} api={desktopApi} />;
  }
  return <HomeScreen onNewMatch={() => setRoute('setup')} />;
}
