import type { MatchHistoryEntry } from '../../../shared/ipc/contracts';

interface HistoryScreenProps {
  entries: MatchHistoryEntry[];
  onBack: () => void;
  loading?: boolean;
  error?: boolean;
}

const languageName = { en: 'English', et: 'Estonian' } as const;
const difficultyName = { easy: 'Easy', medium: 'Medium', hard: 'Hard' } as const;

function duration(minutes: number) {
  return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
}

export function HistoryScreen({ entries, onBack, loading = false, error = false }: HistoryScreenProps) {
  return <main className="page-shell history-screen">
    <header className="setup-header">
      <button type="button" onClick={onBack}>Back</button>
      <h1>Match History</h1>
    </header>
    {loading ? <p role="status">Loading match history…</p> : null}
    {error ? <p role="alert">Match history could not be loaded.</p> : null}
    {!loading && !error && entries.length === 0 ? <p role="status">No matches have been saved yet.</p> : null}
    {!loading && !error ? <ol className="history-list">
      {entries.map((entry) => <li key={entry.id}>
        <article aria-labelledby={`history-${entry.id}`}>
          <h2 id={`history-${entry.id}`}>
            <time dateTime={new Date(entry.completedAt).toISOString()}>
              {new Date(entry.completedAt).toLocaleString()}
            </time>
          </h2>
          <dl>
            <div><dt>Status</dt><dd>{entry.completionState === 'complete' ? 'Complete' : 'Incomplete'}</dd></div>
            <div><dt>Language</dt><dd>{languageName[entry.language]}</dd></div>
            <div><dt>Difficulty</dt><dd>{difficultyName[entry.difficulty]}</dd></div>
            <div><dt>Duration</dt><dd>{duration(Math.floor(entry.durationMs / 60_000))}</dd></div>
            <div><dt>Content packs</dt><dd>{entry.packIds.join(', ')}</dd></div>
            <div><dt>Seed</dt><dd>{entry.seed}</dd></div>
          </dl>
          <h3>Standings</h3>
          <ol aria-label={`Standings for ${entry.id}`}>
            {entry.standings.map((standing) => <li key={standing.teamId}>
              {standing.rank}. {standing.name} — {standing.score}
            </li>)}
          </ol>
        </article>
      </li>)}
    </ol> : null}
  </main>;
}
