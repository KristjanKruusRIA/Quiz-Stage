import { describe, expect, it } from 'vitest';
import { selectLocalizedClue } from '../../../src/shared/content/localization';
import { isLocalizedClueComplete } from '../../../src/shared/content/localizedCompleteness';
import type { Clue } from '../../../src/shared/game/types';
import { toPublicGameView } from '../../../src/shared/game/views';
import { gameState } from '../renderer/game/fixtures';

const bilingualClue: Clue = {
  id: 'bilingual-clue',
  categoryId: 'bilingual-category',
  round: 'round-one',
  tier: 1,
  value: 200,
  prompt: { en: 'English prompt', et: 'Eesti vihje' },
  response: { en: 'English response', et: 'Eesti vastus' },
  explanation: { en: 'English explanation', et: 'Eesti selgitus' },
  acceptedResponses: { en: 'English variant', et: 'Eesti variant' },
  categoryName: { en: 'English category', et: 'Eesti kategooria' },
  source: 'Proper Source Name',
};

describe('localized content eligibility and projection', () => {
  it('requires every present accepted-response field in the selected language', () => {
    expect(isLocalizedClueComplete(bilingualClue, 'et')).toBe(true);
    expect(isLocalizedClueComplete({
      ...bilingualClue,
      acceptedResponses: { en: 'English variant' },
    }, 'et')).toBe(false);
  });

  it('selects one language and adds an English comparison only to the Estonian host result', () => {
    expect(selectLocalizedClue(bilingualClue, 'et', 'public')).toEqual({
      prompt: 'Eesti vihje',
      response: 'Eesti vastus',
      explanation: 'Eesti selgitus',
      acceptedResponses: 'Eesti variant',
      categoryName: 'Eesti kategooria',
      source: 'Proper Source Name',
    });
    expect(selectLocalizedClue(bilingualClue, 'et', 'host')).toMatchObject({
      prompt: 'Eesti vihje',
      englishOriginal: {
        prompt: 'English prompt',
        response: 'English response',
        explanation: 'English explanation',
        acceptedResponses: 'English variant',
        categoryName: 'English category',
      },
    });
    expect(selectLocalizedClue(bilingualClue, 'en', 'host')).not.toHaveProperty('englishOriginal');
  });

  it('fails closed instead of falling back to English for incomplete Estonian content', () => {
    expect(() => selectLocalizedClue({ ...bilingualClue, response: { en: 'English response' } }, 'et', 'public'))
      .toThrowError('LOCALIZED_CONTENT_MISSING');
  });

  it('projects only selected Estonian fields and keeps responses hidden before reveal', () => {
    const state = gameState({
      config: { ...gameState().config, language: 'et' },
      phase: 'round-one-board',
      activeClue: null,
    });
    const category = state.boards[0].categories[0];
    for (const boardCategory of state.boards[0].categories) {
      boardCategory.name.et = `Eesti ${boardCategory.name.en}`;
    }
    category.name = { en: 'English category private', et: 'Eesti kategooria avalik' };
    category.clues[0] = { ...bilingualClue, id: 'round-one-clue-1-1', categoryId: category.id };

    const board = toPublicGameView(state);
    expect(board.language).toBe('et');
    expect(board.board?.categories[0].name).toBe('Eesti kategooria avalik');

    state.phase = 'ordinary-clue';
    state.activeClue = {
      clueId: 'round-one-clue-1-1', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false,
    };
    const hidden = toPublicGameView(state);
    const hiddenJson = JSON.stringify(hidden);
    expect(hidden.language).toBe('et');
    expect(hidden.activeClue).toEqual({ id: 'active-clue', prompt: 'Eesti vihje', responseRevealed: false });
    expect(hiddenJson).not.toContain('English prompt');
    expect(hiddenJson).not.toContain('English response');
    expect(hiddenJson).not.toContain('Eesti vastus');
    expect(hiddenJson).not.toContain('englishOriginal');

    state.phase = 'clue-reveal';
    state.activeClue!.responseRevealed = true;
    const revealedJson = JSON.stringify(toPublicGameView(state));
    expect(revealedJson).toContain('Eesti vihje');
    expect(revealedJson).toContain('Eesti vastus');
    expect(revealedJson).toContain('Eesti selgitus');
    expect(revealedJson).toContain('Proper Source Name');
    expect(revealedJson).not.toContain('English prompt');
    expect(revealedJson).not.toContain('English response');
    expect(revealedJson).not.toContain('English explanation');
  });
});
