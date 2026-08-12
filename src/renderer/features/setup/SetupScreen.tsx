import { useEffect, useMemo, useRef, useState } from 'react';
import type { HostDesktopApi } from '../../api/desktopApi';
import type { DisplayMode, GameConfig, Team } from '../../../shared/game/types';
import { gameConfigSchema, type ContentAvailabilityResponse, type SetupOptions } from '../../../shared/ipc/contracts';
import { TEAM_COLORS, TeamEditor } from './TeamEditor';
import { createTranslator, pluralKey, translate, useI18n } from '../../i18n';
import type { Language } from '../../../shared/game/types';
import { normalizeTeamName } from '../../../shared/game/teamNames';

interface SetupScreenProps {
  api: HostDesktopApi;
  onBack: () => void;
  onStarted?: () => void;
  initialLanguage?: Language;
  onLanguageChange?: (language: Language) => void;
}

type DisplayChoice = DisplayMode | 'automatic';

function defaultTeamName(language: Language, number: number): string {
  return translate(language, 'team.defaultName', { number });
}

function defaultTeamNumber(name: string): number | null {
  for (let number = 1; number <= 8; number += 1) {
    if (name === defaultTeamName('en', number) || name === defaultTeamName('et', number)) return number;
  }
  return null;
}

function createTeam(currentTeams: readonly Team[], language: Language): Team {
  const usedColors = new Set(currentTeams.map((team) => team.color.toLowerCase()));
  const color = TEAM_COLORS.find((candidate) => !usedColors.has(candidate.toLowerCase())) ?? TEAM_COLORS[0];
  const usedNames = new Set(currentTeams.map((team) => normalizeTeamName(team.name)));
  const preferred = currentTeams.length + 1;
  const candidateNumbers = [
    ...Array.from({ length: 8 - currentTeams.length }, (_, index) => preferred + index),
    ...Array.from({ length: currentTeams.length }, (_, index) => index + 1),
  ];
  const number = candidateNumbers
    .find((candidate) => !(['en', 'et'] as const).some((locale) =>
      usedNames.has(normalizeTeamName(defaultTeamName(locale, candidate))))) ?? currentTeams.length + 1;
  return {
    id: crypto.randomUUID(),
    name: defaultTeamName(language, number),
    color,
  };
}

function initialTeams(language: Language): Team[] {
  const first = createTeam([], language);
  return [first, createTeam([first], language)];
}

function localValidationMessage(teams: Team[], packIds: string[], language: 'en' | 'et'): string | null {
  const normalizedNames = teams.map((team) => normalizeTeamName(team.name));
  if (normalizedNames.some((name) => name.length === 0)) return translate(language, 'setup.emptyNames');
  if (new Set(normalizedNames).size !== normalizedNames.length) return translate(language, 'setup.duplicateNames');
  if (new Set(teams.map((team) => team.color.toLowerCase())).size !== teams.length) return translate(language, 'setup.duplicateColors');
  if (packIds.length === 0) return translate(language, 'setup.choosePack');
  return null;
}

function shortageMessage(shortage: Exclude<ContentAvailabilityResponse, { ok: true }>, language: 'en' | 'et') {
  const roundOneKey = pluralKey(shortage.roundOneMissing, {
    one: 'setup.shortageRoundOne.one', other: 'setup.shortageRoundOne.other',
  });
  const roundTwoKey = pluralKey(shortage.roundTwoMissing, {
    one: 'setup.shortageRoundTwo.one', other: 'setup.shortageRoundTwo.other',
  });
  return `${translate(language, roundOneKey, { count: shortage.roundOneMissing })} ${translate(language, roundTwoKey, { count: shortage.roundTwoMissing })} ${translate(language, shortage.finalMissing === 1 ? 'setup.finalUnavailable' : 'setup.finalAvailable')}`;
}

export function SetupScreen({ api, onBack, onStarted, initialLanguage, onLanguageChange }: SetupScreenProps) {
  const { locale } = useI18n();
  const initialLocale = initialLanguage ?? locale;
  const [teams, setTeams] = useState<Team[]>(() => initialTeams(initialLocale));
  const generatedTeamIds = useRef(new Set(teams.map((team) => team.id)));
  const [language, setLanguage] = useState<Language>(initialLocale);
  const [difficulty, setDifficulty] = useState<GameConfig['difficulty']>('medium');
  const [clueSeconds, setClueSeconds] = useState(15);
  const [packIds, setPackIds] = useState<string[]>([]);
  const [displayChoice, setDisplayChoice] = useState<DisplayChoice>('automatic');
  const [options, setOptions] = useState<SetupOptions | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [availability, setAvailability] = useState<{
    key: string;
    generation: number;
    result: ContentAvailabilityResponse | 'checking' | 'error';
  } | null>(null);
  const [availabilityGeneration, setAvailabilityGeneration] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [startErrorKey, setStartErrorKey] = useState<string | null>(null);
  const startInFlight = useRef(false);
  const t = createTranslator(language);
  const changeLanguage = (next: Language) => {
    setTeams((current) => current.map((team) => {
      if (!generatedTeamIds.current.has(team.id)) return team;
      const number = defaultTeamNumber(team.name);
      return number === null ? team : { ...team, name: defaultTeamName(next, number) };
    }));
    setLanguage(next);
    onLanguageChange?.(next);
  };

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
  const configKey = JSON.stringify(candidate);
  const availabilityKey = parsed.success ? JSON.stringify(parsed.data) : null;
  const currentConfigKey = useRef(configKey);
  const availabilityOwner = useRef<{ key: string | null; generation: number }>({
    key: availabilityKey,
    generation: availabilityGeneration,
  });
  const currentAvailability = availability?.key === availabilityKey
    && availability.generation === availabilityGeneration
    ? availability.result
    : null;
  const hasCurrentAvailabilityResult = currentAvailability === 'error'
    || (currentAvailability !== null && currentAvailability !== 'checking' && currentAvailability.ok);
  const showStartError = startErrorKey !== null
    && startErrorKey === configKey
    && hasCurrentAvailabilityResult;

  useEffect(() => {
    currentConfigKey.current = configKey;
  }, [configKey]);

  useEffect(() => {
    availabilityOwner.current = { key: availabilityKey, generation: availabilityGeneration };
    if (options === null || localMessage !== null || !parsed.success) {
      return;
    }
    let active = true;
    const key = JSON.stringify(parsed.data);
    const generation = availabilityGeneration;
    const ownsRequest = () => active
      && availabilityOwner.current.key === key
      && availabilityOwner.current.generation === generation;
    queueMicrotask(() => {
      if (ownsRequest()) setAvailability({ key, generation, result: 'checking' });
    });
    void api.checkContentAvailability(parsed.data).then((value) => {
      if (ownsRequest()) setAvailability({ key, generation, result: value });
    }).catch(() => {
      if (ownsRequest()) setAvailability({ key, generation, result: 'error' });
    });
    return () => { active = false; };
  }, [api, options, localMessage, parsed, availabilityKey, availabilityGeneration]);

  const updateTeam = (index: number, team: Team) => {
    if (team.name !== teams[index]?.name) generatedTeamIds.current.delete(team.id);
    setTeams((current) => current.map((value, teamIndex) => teamIndex === index ? team : value));
  };
  const removeTeam = (index: number) => {
    if (teams.length <= 2) return;
    generatedTeamIds.current.delete(teams[index].id);
    setTeams((current) => current.filter((_, teamIndex) => teamIndex !== index));
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
    if (startInFlight.current || !canStart || !validated.success) return;
    startInFlight.current = true;
    setSubmitting(true);
    setStartErrorKey(null);
    try {
      await api.startMatch(validated.data);
      onStarted?.();
    } catch {
      setStartErrorKey(currentConfigKey.current);
      setAvailabilityGeneration((current) => current + 1);
    } finally {
      startInFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <main className="page-shell setup-screen">
      <header className="setup-header">
        <button type="button" onClick={onBack}>{t('common.back')}</button>
        <h1>{t('setup.title')}</h1>
      </header>
      <form onSubmit={(event) => void submit(event)}>
        <section aria-labelledby="teams-heading">
          <div className="section-heading">
            <h2 id="teams-heading">{t('setup.teams')}</h2>
            <button
              type="button"
              disabled={teams.length >= 8}
              onClick={() => {
                const team = createTeam(teams, language);
                generatedTeamIds.current.add(team.id);
                setTeams((current) => [...current, team]);
              }}
            >
              {t('setup.addTeam')}
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
            <legend>{t('setup.language')}</legend>
            <label><input type="radio" name="language" checked={language === 'en'} onChange={() => changeLanguage('en')} /> {t('common.english')}</label>
            <label><input type="radio" name="language" checked={language === 'et'} onChange={() => changeLanguage('et')} /> {t('common.estonian')}</label>
          </fieldset>
          <fieldset>
            <legend>{t('setup.difficulty')}</legend>
            {(['easy', 'medium', 'hard'] as const).map((value) => (
              <label key={value}>
                <input type="radio" name="difficulty" checked={difficulty === value} onChange={() => setDifficulty(value)} /> {t(`common.${value}`)}
              </label>
            ))}
          </fieldset>
          <label>
            <span>{t('setup.clueTime')}</span>
            <select value={clueSeconds} onChange={(event) => setClueSeconds(Number(event.target.value))}>
              {Array.from({ length: 12 }, (_, index) => (index + 1) * 5).map((seconds) => (
                <option key={seconds} value={seconds}>{seconds} {t('setup.seconds')}</option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend>{t('setup.packs')}</legend>
            {options?.packs.filter((pack) => pack.enabled).map((pack) => (
              <label key={pack.id}>
                <input type="checkbox" checked={packIds.includes(pack.id)} onChange={() => togglePack(pack.id)} /> {pack.name}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>{t('setup.display')}</legend>
            {(['automatic', 'single', 'dual'] as const).map((value) => (
              <label key={value}>
                <input type="radio" name="display" checked={displayChoice === value} onChange={() => setDisplayChoice(value)} /> {t(`setup.${value}`)}
              </label>
            ))}
          </fieldset>
        </div>

        {loadFailed ? <p role="alert">{t('setup.loadError')}</p> : null}
        {localMessage !== null ? <p role="alert">{localMessage}</p> : null}
        {currentAvailability === 'checking' ? <p role="status">{t('setup.checking')}</p> : null}
        {currentAvailability === 'error' && !showStartError ? <p role="alert">{t('setup.availabilityError')}</p> : null}
        {showStartError ? <p role="alert">{t('setup.startFailed')}</p> : null}
        {currentAvailability !== null && currentAvailability !== 'checking' && currentAvailability !== 'error' && !currentAvailability.ok
          ? <p role="alert">{shortageMessage(currentAvailability, language)}</p>
          : null}
        <button className="primary-action" type="submit" disabled={!canStart}>{t('setup.start')}</button>
      </form>
    </main>
  );
}
