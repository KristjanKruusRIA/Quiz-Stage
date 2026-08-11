import type { Clue, Language } from '../game/types';

export function hasLocalizedText(value: { en: string; et?: string }, language: Language): boolean {
  return ((language === 'en' ? value.en : value.et)?.trim().length ?? 0) > 0;
}

export function isLocalizedClueComplete(
  clue: Pick<Clue, 'prompt' | 'response' | 'explanation' | 'acceptedResponses'>,
  language: Language,
): boolean {
  return hasLocalizedText(clue.prompt, language)
    && hasLocalizedText(clue.response, language)
    && hasLocalizedText(clue.explanation, language)
    && (clue.acceptedResponses === undefined || hasLocalizedText(clue.acceptedResponses, language));
}
