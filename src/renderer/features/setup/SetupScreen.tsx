import { useEffect, useMemo, useState } from 'react';
import type { HostDesktopApi } from '../../api/desktopApi';
import type { DisplayMode, GameConfig, Team } from '../../../shared/game/types';
import { gameConfigSchema, type ContentAvailabilityResponse, type SetupOptions } from '../../../shared/ipc/contracts';
import { TEAM_COLORS, TeamEditor } from './TeamEditor';

interface SetupScreenProps {
  api: HostDesktopApi;
  onBack: () => void;
  onStarted?: () => void;
}

type DisplayChoice = DisplayMode | 'automatic';

const copy = {
  en: {
    title: 'New Match', back: 'Back', teams: 'Teams', addTeam: 'Add team',
    language: 'Language', english: 'English', estonian: 'Estonian',
    difficulty: 'Difficulty', easy: 'Easy', medium: 'Medium', hard: 'Hard',
    clueTime: 'Clue time', seconds: 'seconds', packs: 'Content packs',
    display: 'Display mode', automatic: 'Automatic', single: 'Single screen', dual: 'Dual screen',
    start: 'Start match', checking: 'Checking content availability…',
    emptyNames: 'Enter a name for every team.', duplicateNames: 'Team names must be unique.',
    duplicateColors: 'Team colors must be unique.', choosePack: 'Select at least one content pack.',
    loadError: 'Setup options could not be loaded.', availabilityError: 'Content availability could not be checked.',
  },
  et: {
    title: 'Uus mäng', back: 'Tagasi', teams: 'Võistkonnad', addTeam: 'Lisa võistkond',
    language: 'Keel', english: 'Inglise', estonian: 'Eesti',
    difficulty: 'Raskus', easy: 'Lihtne', medium: 'Keskmine', hard: 'Raske',
    clueTime: 'Vihje aeg', seconds: 'sekundit', packs: 'Sisupaketid',
    display: 'Kuvarežiim', automatic: 'Automaatne', single: 'Üks ekraan', dual: 'Kaks ekraani',
    start: 'Alusta mängu', checking: 'Kontrollin sisu saadavust…',
    emptyNames: 'Sisesta igale võistkonnale nimi.', duplicateNames: 'Võistkondade nimed peavad olema erinevad.',
    duplicateColors: 'Võistkondade värvid peavad olema erinevad.', choosePack: 'Vali vähemalt üks sisupakett.',
    loadError: 'Seadistusvalikuid ei saanud laadida.', availabilityError: 'Sisu saadavust ei saanud kontrollida.',
  },
} as const;

function createTeam(index: number): Team {
  return {
    id: crypto.randomUUID(),
    name: `Team ${index + 1}`,
    color: TEAM_COLORS[index],
  };
}

function localValidationMessage(teams: Team[], packIds: string[], language: 'en' | 'et'): string | null {
  const text = copy[language];
  const normalizedNames = teams.map((team) => team.name.trim().toLocaleLowerCase());
  if (normalizedNames.some((name) => name.length === 0)) return text.emptyNames;
  if (new Set(normalizedNames).size !== normalizedNames.length) return text.duplicateNames;
  if (new Set(teams.map((team) => team.color.toLowerCase())).size !== teams.length) return text.duplicateColors;
  if (packIds.length === 0) return text.choosePack;
  return null;
}

function shortageMessage(shortage: Exclude<ContentAvailabilityResponse, { ok: true }>, language: 'en' | 'et') {
  if (language === 'et') {
    return `Esimene voor: puudu ${shortage.roundOneMissing} kategooriakomplekti. Teine voor: puudu ${shortage.roundTwoMissing} kategooriakomplekti. Finaal: ${shortage.finalMissing === 1 ? 'pole saadaval' : 'saadaval'}.`;
  }
  const sets = (count: number) => count === 1 ? 'category set' : 'category sets';
  return `Round One: ${shortage.roundOneMissing} ${sets(shortage.roundOneMissing)} missing. Round Two: ${shortage.roundTwoMissing} ${sets(shortage.roundTwoMissing)} missing. Final: ${shortage.finalMissing === 1 ? 'unavailable' : 'available'}.`;
}

export function SetupScreen({ api, onBack, onStarted }: SetupScreenProps) {
  const [teams, setTeams] = useState<Team[]>(() => [createTeam(0), createTeam(1)]);
  const [language, setLanguage] = useState<'en' | 'et'>('en');
  const [difficulty, setDifficulty] = useState<GameConfig['difficulty']>('medium');
  const [clueSeconds, setClueSeconds] = useState(15);
  const [packIds, setPackIds] = useState<string[]>([]);
  const [displayChoice, setDisplayChoice] = useState<DisplayChoice>('automatic');
  const [options, setOptions] = useState<SetupOptions | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [availability, setAvailability] = useState<{
    key: string;
    result: ContentAvailabilityResponse | 'checking' | 'error';
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const text = copy[language];

  useEffect(() => {
    let active = true;
    void api.getSetupOptions().then((value) => {
      if (!active) return;
      setOptions(value);
      setPackIds(value.packs.filter((pack) => pack.enabled).map((pack) => pack.id));
    }).catch(() => {
      if (active) setLoadFailed(true);
    });
    return () => { active = false; };
  }, [api]);

  const displayMode = displayChoice === 'automatic'
    ? options?.automaticDisplayMode ?? 'single'
    : displayChoice;
  const candidate = useMemo(() => ({
    language,
    difficulty,
    clueSeconds,
    teams,
    packIds,
    displayMode,
  }), [clueSeconds, difficulty, displayMode, language, packIds, teams]);
  const localMessage = options === null ? null : localValidationMessage(teams, packIds, language);
  const parsed = useMemo(() => gameConfigSchema.safeParse(candidate), [candidate]);
  const availabilityKey = parsed.success ? JSON.stringify(parsed.data) : null;
  const currentAvailability = availability?.key === availabilityKey ? availability.result : null;

  useEffect(() => {
    if (options === null || localMessage !== null || !parsed.success) {
      return;
    }
    let active = true;
    const key = JSON.stringify(parsed.data);
    queueMicrotask(() => {
      if (active) setAvailability({ key, result: 'checking' });
    });
    void api.checkContentAvailability(parsed.data).then((value) => {
      if (active) setAvailability({ key, result: value });
    }).catch(() => {
      if (active) setAvailability({ key, result: 'error' });
    });
    return () => { active = false; };
  }, [api, options, localMessage, parsed]);

  const updateTeam = (index: number, team: Team) => {
    setTeams((current) => current.map((value, teamIndex) => teamIndex === index ? team : value));
  };
  const removeTeam = (index: number) => {
    setTeams((current) => current.length <= 2 ? current : current.filter((_, teamIndex) => teamIndex !== index));
  };
  const togglePack = (packId: string) => {
    setPackIds((current) => current.includes(packId)
      ? current.filter((id) => id !== packId)
      : [...current, packId]);
  };
  const canStart = parsed.success && currentAvailability !== null && currentAvailability !== 'checking'
    && currentAvailability !== 'error' && currentAvailability.ok && !submitting;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validated = gameConfigSchema.safeParse(candidate);
    if (!canStart || !validated.success) return;
    setSubmitting(true);
    try {
      await api.startMatch(validated.data);
      onStarted?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="page-shell setup-screen">
      <header className="setup-header">
        <button type="button" onClick={onBack}>{text.back}</button>
        <h1>{text.title}</h1>
      </header>
      <form onSubmit={(event) => void submit(event)}>
        <section aria-labelledby="teams-heading">
          <div className="section-heading">
            <h2 id="teams-heading">{text.teams}</h2>
            <button
              type="button"
              disabled={teams.length >= 8}
              onClick={() => setTeams((current) => [...current, createTeam(current.length)])}
            >
              {text.addTeam}
            </button>
          </div>
          <div className="team-grid">
            {teams.map((team, index) => (
              <TeamEditor
                key={team.id}
                index={index}
                team={team}
                language={language}
                canRemove={teams.length > 2}
                onChange={(value) => updateTeam(index, value)}
                onRemove={() => removeTeam(index)}
              />
            ))}
          </div>
        </section>

        <div className="settings-grid">
          <fieldset>
            <legend>{text.language}</legend>
            <label><input type="radio" name="language" checked={language === 'en'} onChange={() => setLanguage('en')} /> {text.english}</label>
            <label><input type="radio" name="language" checked={language === 'et'} onChange={() => setLanguage('et')} /> {text.estonian}</label>
          </fieldset>
          <fieldset>
            <legend>{text.difficulty}</legend>
            {(['easy', 'medium', 'hard'] as const).map((value) => (
              <label key={value}>
                <input type="radio" name="difficulty" checked={difficulty === value} onChange={() => setDifficulty(value)} /> {text[value]}
              </label>
            ))}
          </fieldset>
          <label>
            <span>{text.clueTime}</span>
            <select value={clueSeconds} onChange={(event) => setClueSeconds(Number(event.target.value))}>
              {Array.from({ length: 12 }, (_, index) => (index + 1) * 5).map((seconds) => (
                <option key={seconds} value={seconds}>{seconds} {text.seconds}</option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend>{text.packs}</legend>
            {options?.packs.filter((pack) => pack.enabled).map((pack) => (
              <label key={pack.id}>
                <input type="checkbox" checked={packIds.includes(pack.id)} onChange={() => togglePack(pack.id)} /> {pack.name}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>{text.display}</legend>
            {(['automatic', 'single', 'dual'] as const).map((value) => (
              <label key={value}>
                <input type="radio" name="display" checked={displayChoice === value} onChange={() => setDisplayChoice(value)} /> {text[value]}
              </label>
            ))}
          </fieldset>
        </div>

        {loadFailed ? <p role="alert">{text.loadError}</p> : null}
        {localMessage !== null ? <p role="alert">{localMessage}</p> : null}
        {currentAvailability === 'checking' ? <p role="status">{text.checking}</p> : null}
        {currentAvailability === 'error' ? <p role="alert">{text.availabilityError}</p> : null}
        {currentAvailability !== null && currentAvailability !== 'checking' && currentAvailability !== 'error' && !currentAvailability.ok
          ? <p role="alert">{shortageMessage(currentAvailability, language)}</p>
          : null}
        <button className="primary-action" type="submit" disabled={!canStart}>{text.start}</button>
      </form>
    </main>
  );
}
