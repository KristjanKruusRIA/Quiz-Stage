import type { Clue, Language, LocalizedText } from '../game/types';

export interface LocalizedClueContent {
  prompt: string;
  response: string;
  explanation: string;
  acceptedResponses?: string;
  categoryName?: string;
  source: string;
}

export interface HostLocalizedClueContent extends LocalizedClueContent {
  englishOriginal?: Omit<LocalizedClueContent, 'source'>;
}

function selected(value: LocalizedText, language: Language): string {
  const result = value[language];
  if (result === undefined || result.trim() === '') throw new Error('LOCALIZED_CONTENT_MISSING');
  return result;
}

function selectedOptional(value: LocalizedText | undefined, language: Language): string | undefined {
  return value === undefined ? undefined : selected(value, language);
}

function content(clue: Clue, language: Language): LocalizedClueContent {
  return {
    prompt: selected(clue.prompt, language),
    response: selected(clue.response, language),
    explanation: selected(clue.explanation, language),
    ...(clue.acceptedResponses === undefined ? {} : { acceptedResponses: selected(clue.acceptedResponses, language) }),
    ...(clue.categoryName === undefined ? {} : { categoryName: selected(clue.categoryName, language) }),
    source: clue.source,
  };
}

export function selectLocalizedClue(clue: Clue, language: Language, surface: 'public'): LocalizedClueContent;
export function selectLocalizedClue(clue: Clue, language: Language, surface: 'host'): HostLocalizedClueContent;
export function selectLocalizedClue(
  clue: Clue,
  language: Language,
  surface: 'public' | 'host',
): LocalizedClueContent | HostLocalizedClueContent {
  const localized = content(clue, language);
  if (surface === 'public' || language === 'en') return localized;
  return {
    ...localized,
    englishOriginal: {
      prompt: selected(clue.prompt, 'en'),
      response: selected(clue.response, 'en'),
      explanation: selected(clue.explanation, 'en'),
      ...(clue.acceptedResponses === undefined ? {} : { acceptedResponses: selectedOptional(clue.acceptedResponses, 'en')! }),
      ...(clue.categoryName === undefined ? {} : { categoryName: selectedOptional(clue.categoryName, 'en')! }),
    },
  };
}

export function selectLocalizedText(value: LocalizedText, language: Language): string {
  return selected(value, language);
}
