import { expect, it } from 'vitest';
import { findAnswerDisclosures, type ReviewedCategory } from '../../../scripts/content/answerDisclosures';

function category(): ReviewedCategory {
  return { id: 'space', name: { en: 'Spaceflight', et: 'Kosmoselennud' }, questions: [
    { id: 'first', prompt: { en: 'Who first walked on the Moon?', et: 'Kes astus esimesena Kuule?' }, response: { en: 'Neil Armstrong', et: 'Neil Armstrong' }, variants: { en: 'Armstrong', et: 'Armstrong' }, explanation: { en: 'Neil Armstrong did.', et: 'Neil Armstrong.' } },
    { id: 'apollo', prompt: { en: 'Which mission first landed people on the Moon?', et: 'Milline missioon viis inimesed esimest korda Kuule?' }, response: { en: 'Apollo 11', et: 'Apollo 11' }, variants: { en: '', et: '' }, explanation: { en: 'Apollo 11 carried Neil Armstrong to the Moon.', et: 'Apollo 11 viis Neil Armstrongi Kuule.' } },
  ] };
}

it('checks both languages and the public explanations of every ordered sibling pair', () => {
  const flags = findAnswerDisclosures(category());
  expect(flags).toEqual(expect.arrayContaining([
    expect.objectContaining({ exposedClueId: 'first', revealingClueId: 'apollo', field: 'explanation', language: 'en' }),
    expect.objectContaining({ exposedClueId: 'first', revealingClueId: 'apollo', field: 'explanation', language: 'et' }),
  ]));
  expect(flags.some(flag => flag.exposedClueId === flag.revealingClueId && flag.field === 'explanation')).toBe(false);
});

it('checks accepted variants in prompts and visible board titles', () => {
  const set = category();
  set.name.en = 'Armstrong and Spaceflight';
  set.questions[0].variants.en = 'Neil A.;Armstrong';
  set.questions[1].prompt.en = 'Armstrong flew on which mission?';
  expect(findAnswerDisclosures(set)).toEqual(expect.arrayContaining([
    expect.objectContaining({ exposedClueId: 'first', field: 'title', language: 'en' }),
    expect.objectContaining({ exposedClueId: 'first', revealingClueId: 'apollo', field: 'prompt', language: 'en' }),
  ]));
});

it('detects self-restatement with an English article and simple Estonian case endings', () => {
  const set = category();
  set.questions[0].response = { en: 'a cinnamon roll', et: 'Vikerkaarelipp' };
  set.questions[0].variants = { en: '', et: '' };
  set.questions[0].prompt = { en: 'What is a cinnamon roll called?', et: 'Vikerkaarelippudega marsil küsitakse selle sümboli nime.' };
  expect(findAnswerDisclosures(set)).toEqual(expect.arrayContaining([
    expect.objectContaining({ exposedClueId: 'first', revealingClueId: 'first', language: 'en' }),
    expect.objectContaining({ exposedClueId: 'first', revealingClueId: 'first', language: 'et' }),
  ]));
});

it('avoids incidental substrings and reports short capitalized rating aliases', () => {
  const set = category();
  set.questions[0].response = { en: 'Mars', et: 'Marss' };
  set.questions[0].variants = { en: 'PG', et: 'PG' };
  set.questions[1].prompt = { en: 'A marsh has wet soil; U, PG and 12A are film labels.', et: 'Millises klassifikatsioonis kasutatakse märgist PG?' };
  const flags = findAnswerDisclosures(set);
  expect(flags.some(flag => flag.answer.toLowerCase() === 'mars' && flag.field === 'prompt')).toBe(false);
  expect(flags).toEqual(expect.arrayContaining([expect.objectContaining({ answer: 'PG', field: 'prompt' })]));
});
