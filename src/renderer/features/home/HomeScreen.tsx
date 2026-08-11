interface HomeScreenProps {
  onNewMatch: () => void;
  onResume: () => void;
  onHistory: () => void;
  onContent?: () => void;
  hasResumableMatch: boolean;
  resumePending?: boolean;
  resumeError?: boolean;
}

export function HomeScreen({
  onNewMatch,
  onResume,
  onHistory,
  onContent,
  hasResumableMatch,
  resumePending = false,
  resumeError = false,
}: HomeScreenProps) {
  return (
    <main className="page-shell home-screen">
      <header>
        <p className="eyebrow">Quiz Stage</p>
        <h1>Home</h1>
      </header>
      <nav className="home-actions" aria-label="Main menu">
        <button className="primary-action" type="button" onClick={onNewMatch}>New Match</button>
        <button type="button" disabled={!hasResumableMatch || resumePending} onClick={onResume}>Resume Match</button>
        <button type="button" disabled={onContent === undefined} onClick={onContent}>Content Library</button>
        <button type="button" onClick={onHistory}>Match History</button>
        <button type="button" disabled>Settings</button>
      </nav>
      {resumeError ? <p role="alert">The saved match could not be resumed.</p> : null}
      <p className="muted">Additional areas will become available in later releases.</p>
    </main>
  );
}
