type LocalizedText = { en: string; et: string };
export interface ReviewedCategory {
  id: string; name: LocalizedText;
  questions: Array<{ id: string; prompt: LocalizedText; response: LocalizedText; variants: LocalizedText; explanation: LocalizedText }>;
}
export interface AnswerDisclosure {
  categoryId: string; exposedClueId: string; revealingClueId: string | null;
  language: 'en' | 'et'; field: 'title' | 'prompt' | 'explanation' | 'response'; answer: string;
}

export function answerDisclosureId(flag: AnswerDisclosure): string {
  return [flag.categoryId, flag.exposedClueId, flag.revealingClueId ?? '', flag.language, flag.field].join('|');
}

function normalized(value: string): string {
  return value.normalize('NFC').toLocaleLowerCase('et').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function mentions(text: string, answer: string, language: 'en' | 'et'): boolean {
  let phrase = normalized(answer);
  if (language === 'en') phrase = phrase.replace(/^(?:a|an|the) /u, '');
  // Very short ordinary words and single letters create noise; short uppercase acronyms still matter.
  if (phrase.length < 3 && !/^[A-Z]{2}$/u.test(answer.trim()) && !/^\d{2,}$/u.test(phrase)) return false;
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const ending = language === 'et'
    ? '(?:a|e|i|u|s|st|l|le|lt|ga|na|ni|ks|ta|d|de|del|dele|des|dest|ud|ude|udega|udel|udest)?'
    : '(?:s)?';
  return new RegExp(`(?:^| )${escaped}${ending}(?: |$)`, 'u').test(normalized(text));
}

/** Findings require whole-set editorial review; a lexical match alone cannot establish a semantic giveaway. */
export function findAnswerDisclosures(category: ReviewedCategory): AnswerDisclosure[] {
  const flags: AnswerDisclosure[] = [];
  for (const language of ['en', 'et'] as const) {
    for (const target of category.questions) {
      const answers = [...new Set([target.response[language], ...target.variants[language].split(';')].map(value => value.trim()).filter(Boolean))];
      const add = (text: string, field: AnswerDisclosure['field'], revealingClueId: string | null) => {
        const answer = answers.find(value => mentions(text, value, language));
        if (answer) flags.push({ categoryId: category.id, exposedClueId: target.id, revealingClueId, language, field, answer });
      };
      add(category.name[language], 'title', null);
      for (const peer of category.questions) {
        add(peer.prompt[language], 'prompt', peer.id);
        if (peer.id !== target.id) {
          add(peer.explanation[language], 'explanation', peer.id);
          add(peer.response[language], 'response', peer.id);
        }
      }
    }
  }
  return flags;
}
