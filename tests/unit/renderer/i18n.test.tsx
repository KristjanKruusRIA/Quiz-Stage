import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider, translate } from '../../../src/renderer/i18n';
import { en } from '../../../src/renderer/i18n/en';
import { et } from '../../../src/renderer/i18n/et';
import { HomeScreen } from '../../../src/renderer/features/home/HomeScreen';
import { SetupScreen } from '../../../src/renderer/features/setup/SetupScreen';
import { PublicBoard } from '../../../src/renderer/features/game/PublicBoard';
import { PublicClue } from '../../../src/renderer/features/game/PublicClue';
import { PublicFinal } from '../../../src/renderer/features/game/PublicFinal';
import { HostConsole } from '../../../src/renderer/features/game/HostConsole';
import { HistoryScreen } from '../../../src/renderer/features/history/HistoryScreen';
import { ImportPreview } from '../../../src/renderer/features/content/ImportPreview';
import { ContentLibraryScreen } from '../../../src/renderer/features/content/ContentLibraryScreen';
import { GameSurface } from '../../../src/renderer/features/game/GameSurface';
import type { GamePhase, GameState } from '../../../src/shared/game/types';
import type { HostDesktopApi } from '../../../src/renderer/api/desktopApi';
import { hostView, publicView } from './game/fixtures';

function withLocale(locale: 'en' | 'et', node: React.ReactNode) {
  return <I18nProvider locale={locale}>{node}</I18nProvider>;
}

function api(): HostDesktopApi {
  return {
    surface: 'host',
    getSetupOptions: vi.fn(async () => ({
      packs: [{ id: 'pack', name: 'Pärisnimi', enabled: true }],
      automaticDisplayMode: 'single' as const,
    })),
    checkContentAvailability: vi.fn(async () => ({ ok: true as const })),
    startMatch: vi.fn(), hasResumableMatch: vi.fn(), resumeMatch: vi.fn(), listHistory: vi.fn(), dispatch: vi.fn(),
  };
}

function estonianState() {
  const state = hostView().state;
  state.config = { ...state.config, language: 'et' };
  for (const board of state.boards) for (const category of board.categories) {
    category.name.et = `Kategooria ${category.id}`;
    for (const clue of category.clues) {
      clue.prompt.et = `Eesti ${clue.prompt.en}`;
      clue.response.et = `Eesti ${clue.response.en}`;
      clue.explanation.et = `Eesti ${clue.explanation.en}`;
    }
  }
  state.finalClue!.categoryName!.et = 'Eesti finaalkategooria';
  state.finalClue!.prompt.et = 'Eesti finaalivihje';
  state.finalClue!.response.et = 'Eesti finaalivastus';
  state.finalClue!.explanation.et = 'Eesti finaaliselgitus';
  return state;
}

describe('English and Estonian interface localization', () => {
  if (false) {
    // @ts-expect-error Interpolated keys require their exact params.
    translate('en', 'host.inControl');
    // @ts-expect-error Non-interpolated keys reject params.
    translate('en', 'home.title', { extra: 1 });
    // @ts-expect-error Interpolation accepts string and number values only.
    translate('et', 'host.inControl', { team: true });
  }

  it('keeps exact dictionary parity and rejects unsafe interpolation at runtime', () => {
    expect(Object.keys(et).sort()).toEqual(Object.keys(en).sort());
    expect(translate('et', 'host.inControl', { team: 'Sinine' })).toBe('Vastamisõigus: Sinine');
    expect(() => translate('et', 'host.inControl', {} as never)).toThrowError('I18N_PARAMS_MISMATCH');
    expect(() => translate('et', 'host.inControl', { team: 'Sinine', extra: 1 } as never)).toThrowError('I18N_PARAMS_MISMATCH');
  });

  it('renders escaped interpolation as text rather than HTML', () => {
    const hostile = '<img src=x onerror=alert(1)>';
    render(<p>{translate('en', 'host.inControl', { team: hostile })}</p>);
    expect(screen.getByText(`In control: ${hostile}`)).toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });

  it('owns and restores the document language across switches and unmounts', () => {
    document.documentElement.lang = 'en';
    const rendered = render(withLocale('et', <p>ET</p>));
    expect(document.documentElement.lang).toBe('et');
    rendered.rerender(withLocale('en', <p>EN</p>));
    expect(document.documentElement.lang).toBe('en');
    rendered.unmount();
    expect(document.documentElement.lang).toBe('en');
  });

  it('does not let an older provider cleanup overwrite the current provider language', () => {
    document.documentElement.lang = 'en';
    const older = render(withLocale('et', <p>older</p>));
    const current = render(withLocale('et', <p>current</p>));
    expect(document.documentElement.lang).toBe('et');
    older.unmount();
    expect(document.documentElement.lang).toBe('et');
    current.unmount();
    expect(document.documentElement.lang).toBe('en');
  });

  it('localizes the reachable Home and Settings placeholder without changing the product name', () => {
    render(withLocale('et', <HomeScreen onNewMatch={vi.fn()} onResume={vi.fn()} onHistory={vi.fn()}
      hasResumableMatch={false} />));
    expect(screen.getByRole('heading', { name: 'Avaleht' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Peamenüü' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Seaded' })).toBeDisabled();
    expect(screen.getByText('Quiz Stage')).toBeInTheDocument();
  });

  it('switches the complete Setup chrome to Estonian while preserving pack names', async () => {
    render(withLocale('en', <SetupScreen api={api()} onBack={vi.fn()} />));
    await userEvent.click(await screen.findByRole('radio', { name: 'Estonian' }));
    expect(screen.getByRole('heading', { name: 'Uus mäng' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alusta mängu' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Pärisnimi' })).toBeInTheDocument();
    expect(screen.queryByText('New Match')).not.toBeInTheDocument();
  });

  it('renders structured Estonian setup shortages with explicit plurals', async () => {
    const bridge = api();
    bridge.checkContentAvailability = vi.fn(async () => ({
      ok: false as const, roundOneMissing: 1, roundTwoMissing: 2, finalMissing: 1 as const,
    }));
    render(withLocale('et', <SetupScreen api={bridge} initialLanguage="et" onBack={vi.fn()} />));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Esimene voor: puudu 1 kategooriakomplekt. Teine voor: puudu 2 kategooriakomplekti. Finaal: pole saadaval.',
    );
  });

  it('localizes board, clue, timer, Final, status, and accessible names from match language', () => {
    const state = estonianState();
    let view = publicView(state);
    const { rerender } = render(withLocale('et', <PublicBoard view={view} onSelect={vi.fn()} />));
    expect(screen.getByRole('grid', { name: 'Esimese vooru mängulaud' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /200 punkti/ })).toHaveLength(6);

    state.phase = 'ordinary-clue';
    state.activeClue = { clueId: 'round-one-clue-1-1', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false };
    view = publicView(state);
    rerender(withLocale('et', <PublicClue view={view} />));
    expect(screen.getByRole('region', { name: 'Aktiivne vihje' })).toBeInTheDocument();
    expect(screen.getByRole('timer', { name: 'Aega jäänud' })).toBeInTheDocument();

    state.phase = 'final-category';
    state.finalEligibleTeamIds = ['team-1', 'team-2'];
    view = publicView(state);
    rerender(withLocale('et', <PublicFinal view={view} />));
    expect(screen.getByRole('heading', { name: 'Finaalkategooria' })).toBeInTheDocument();
  });

  it('shows an English original only in the private Estonian host console', () => {
    const state = estonianState();
    state.phase = 'ordinary-clue';
    state.activeClue = { clueId: 'round-one-clue-1-1', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false };
    const view = { ...hostView(), state };
    render(withLocale('et', <HostConsole view={view} api={api()} />));
    expect(screen.getByRole('region', { name: 'Ingliskeelne originaal' })).toHaveTextContent('Prompt 1-1');
    expect(screen.getByRole('complementary', { name: 'Saatejuhi juhtpaneel' })).toHaveTextContent('Eesti Response 1-1');
  });

  it('formats Estonian history dates, counts, and scores deterministically', () => {
    render(withLocale('et', <HistoryScreen onBack={vi.fn()} entries={[{
      id: 'match', startedAt: 0, completedAt: Date.UTC(2026, 7, 12, 9, 5), durationMs: 60_000,
      completionState: 'complete', language: 'et', difficulty: 'hard', packIds: ['Pärisnimi'], seed: 'seed',
      teams: [{ id: 'team', name: 'Õun', color: '#E3B341' }],
      winnerTeamId: 'team', standings: [{ teamId: 'team', name: 'Õun', color: '#E3B341', score: 12345, rank: 1 }],
    }]} />));
    expect(screen.getByRole('heading', { name: 'Mängude ajalugu' })).toBeInTheDocument();
    expect(screen.getByText(/12\. aug 2026/)).toBeInTheDocument();
    expect(screen.getByText('1 minut')).toBeInTheDocument();
    expect(screen.getByText(/12[\s\u00a0]345/)).toBeInTheDocument();
  });

  it('localizes structured import validation without rendering a raw process message', () => {
    render(withLocale('et', <ImportPreview preview={{
      cancelled: false, valid: false, packId: null, packName: null, rowCount: 1, conflict: false,
      issues: [{ code: 'empty-pack', message: 'RAW INTERNAL CSV MESSAGE', row: 1 }],
    }} onCommit={vi.fn()} onCancel={vi.fn()} />));
    expect(screen.getByRole('heading', { name: 'Impordi eelvaade: vigane pakett' })).toBeInTheDocument();
    expect(screen.getByText(/Rida 1/)).toHaveTextContent('CSV-pakett peab sisaldama vähemalt üht vihjerida');
    expect(screen.queryByText(/RAW INTERNAL/)).not.toBeInTheDocument();
  });

  it('localizes the Content Library route and keeps explicit bilingual editor labels', async () => {
    const bridge = api();
    bridge.listContent = vi.fn(async () => ({ reports: [], packs: [{
      id: 'custom', name: 'Pärisnimi', ownership: 'custom' as const, enabled: true, revision: 'revision',
      categorySets: [], finalClues: [],
    }] }));
    bridge.saveCategorySet = vi.fn(); bridge.saveFinalClue = vi.fn(); bridge.createContentPack = vi.fn();
    bridge.deleteContentPack = vi.fn(); bridge.reportContentClue = vi.fn(); bridge.resolveContentReport = vi.fn();
    bridge.previewContentImport = vi.fn(); bridge.commitContentImport = vi.fn(); bridge.exportContentPack = vi.fn();
    render(withLocale('et', <ContentLibraryScreen api={bridge} onBack={vi.fn()} />));
    expect(await screen.findByRole('heading', { name: 'Sisukogu' })).toBeInTheDocument();
    expect(screen.getByText('Pärisnimi')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Lisa finaalivihje' }));
    expect(screen.getByLabelText('Finaalkategooria — inglise')).toBeInTheDocument();
    expect(screen.getByLabelText('Finaalkategooria — eesti')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvesta finaalivihje' })).toBeDisabled();
  });

  it.each(['en', 'et'] as const)('renders every gameplay phase in %s without raw translation keys', async (locale) => {
    const phaseStates = gameplayPhases(locale);
    for (const state of phaseStates) {
      const view = publicView(state);
      const rendered = render(withLocale(locale, <GameSurface surface="public" view={view} />));
      const renderedText = document.body.textContent ?? '';
      for (const key of Object.keys(en)) expect(renderedText).not.toContain(key);
      expect(document.querySelector('[aria-label=""]')).toBeNull();
      rendered.unmount();
      cleanup();
      await waitFor(() => expect(document.body).toBeEmptyDOMElement());
    }
  });
});

function gameplayPhases(locale: 'en' | 'et'): GameState[] {
  const base = locale === 'et' ? estonianState() : hostView().state;
  const state = (phase: GamePhase, changes: Partial<GameState> = {}) => ({
    ...structuredClone(base), phase, ...changes,
  });
  const boardClue = 'round-one-clue-1-1';
  const hidden = { clueId: boardClue, lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false };
  const revealed = { ...hidden, responseRevealed: true };
  const finalHidden = { ...hidden, clueId: 'final-clue' };
  const finalRevealed = { ...finalHidden, responseRevealed: true };
  const finalFacts = { finalEligibleTeamIds: ['team-1', 'team-2'], finalWagers: { 'team-1': 200, 'team-2': 100 } };
  const tiebreaker = structuredClone(base.finalClue!);
  tiebreaker.id = 'tiebreaker-clue'; tiebreaker.round = 'tiebreaker';
  return [
    state('round-one-board'),
    state('ordinary-clue', { activeClue: hidden }),
    state('round-two-board'),
    state('daily-double-wager', { activeClue: hidden }),
    state('daily-double-clue', { activeClue: hidden }),
    state('clue-reveal', { activeClue: revealed }),
    state('final-category', finalFacts),
    state('final-wagers', finalFacts),
    state('final-clue', { ...finalFacts, activeClue: finalHidden }),
    state('final-reveal', { ...finalFacts, activeClue: finalRevealed, finalRevealOrder: ['team-2', 'team-1'], finalRevealedTeamIds: ['team-2'], finalJudgments: { 'team-2': false } }),
    state('tiebreaker', { activeClue: { ...hidden, clueId: tiebreaker.id }, tiebreakerClues: [tiebreaker], tiebreakerTeamIds: ['team-1', 'team-2'] }),
    state('complete', { winnerTeamId: 'team-1', activeClue: null }),
  ];
}
