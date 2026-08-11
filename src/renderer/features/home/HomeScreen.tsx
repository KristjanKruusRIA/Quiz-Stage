interface HomeScreenProps {
  onNewMatch: () => void;
}

export function HomeScreen({ onNewMatch }: HomeScreenProps) {
  return (
    <main className="page-shell home-screen">
      <header>
        <p className="eyebrow">Quiz Stage</p>
        <h1>Home</h1>
      </header>
      <nav className="home-actions" aria-label="Main menu">
        <button className="primary-action" type="button" onClick={onNewMatch}>New Match</button>
        <button type="button" disabled>Resume Match</button>
        <button type="button" disabled>Content Library</button>
        <button type="button" disabled>Match History</button>
        <button type="button" disabled>Settings</button>
      </nav>
      <p className="muted">Additional areas will become available in later releases.</p>
    </main>
  );
}
