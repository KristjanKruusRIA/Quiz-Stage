import type { ContentEvidence } from '../evidence';

type RetainedAccessibleEasyClueId = `${string}-accessible-easy-${string}`;

type ClueCorrection = Readonly<{
  en: string;
  et: string;
  responseEn?: string;
  responseEt?: string;
  variantsEn?: string;
  variantsEt?: string;
  explanationEn?: string;
  explanationEt?: string;
  evidenceAssertion?: string;
}>;

const RETAINED_EASY_CLUE_CORRECTIONS: Readonly<Record<
  RetainedAccessibleEasyClueId,
  ClueCorrection
>> = {
  'built-in-film-television-accessible-easy-009': {
    en: 'Name the James Cameron film that sends a cyborg back in time to kill Sarah Connor.',
    et: 'Nimeta James Cameroni film, kus küborg saadetakse ajas tagasi Sarah Connorit tapma.',
    explanationEn: 'The Terminator sends a cyborg from the future back in time to kill Sarah Connor.',
    explanationEt: 'Terminaatoris saadetakse tulevikust pärit küborg ajas tagasi Sarah Connorit tapma.',
    evidenceAssertion: 'The Terminator — The Terminator sends a cyborg from the future back in time to kill Sarah Connor.',
  },
  'built-in-geography-accessible-easy-031': {
    en: 'Which Himalayan mountain rises farther above sea level than any other?',
    et: 'Milline Himaalaja mägi kõrgub merepinnast kõrgemal kui ükski teine mägi?',
    explanationEn: 'No other mountain summit stands farther above sea level than Mount Everest.',
    explanationEt: 'Ühegi teise mäe tipp ei ulatu merepinnast kõrgemale kui Mount Everest.',
    evidenceAssertion: 'Mount Everest — No other mountain summit stands farther above sea level than Mount Everest.',
  },
  'built-in-science-nature-accessible-easy-031': {
    en: 'Which ocean animal outweighs every other animal known from Earth’s history?',
    et: 'Milline ookeaniloom kaalub rohkem kui ükski teine Maa ajaloost teadaolev loom?',
    explanationEn: 'No other animal known to science matches the blue whale’s mass.',
    explanationEt: 'Ükski teine teadusele teadaolev loom ei küündi sinivaala massini.',
    evidenceAssertion: 'the blue whale — No other animal known to science matches the blue whale’s mass.',
  },
  'built-in-food-drink-accessible-easy-008': {
    en: 'Horiatiki combines tomatoes, cucumber, olives, and feta. Which country is this salad associated with?',
    et: 'Horiatiki sisaldab tomateid, kurki, oliive ja fetat. Millise riigiga seda salatit seostatakse?',
  },
  'built-in-food-drink-accessible-easy-019': {
    en: 'Which starchy vegetable is boiled and crushed with milk or butter to make a common side dish?',
    et: 'Millist tärkliserikast köögivilja keedetakse ja tambitakse piima või võiga tavaliseks lisandiks?',
  },
  'built-in-food-drink-accessible-easy-030': {
    en: 'Which tangy fermented milk drink is cultured with grains containing bacteria and yeast?',
    et: 'Millist hapukat hapendatud piimajooki valmistatakse baktereid ja pärmi sisaldavate teradega?',
  },
  'built-in-politics-economics-society-accessible-easy-033': {
    en: 'Which language, closely related to Finnish, is the sole official language of Estonia?',
    et: 'Milline soome keelega lähedalt suguluses olev keel on Eestis ainus riigikeel?',
  },
  'built-in-politics-economics-society-accessible-easy-034': {
    en: 'Tanel Padar, Dave Benton, and 2XL won the 2001 Eurovision Song Contest representing which country?',
    et: 'Millist riiki esindasid Tanel Padar, Dave Benton ja 2XL, kui nad võitsid 2001. aasta Eurovisiooni lauluvõistluse?',
  },
  'built-in-politics-economics-society-accessible-easy-006': {
    en: 'Name the organisation: the humanitarian movement symbolised by a red cross or crescent.',
    et: 'Nimeta organisatsioon: punase risti või poolkuuga tähistatud humanitaarliikumine.',
    responseEn: 'the Red Cross',
    responseEt: 'Punane Rist',
    variantsEn: 'the Red Cross and Red Crescent Movement',
    variantsEt: 'Punase Risti ja Punase Poolkuu liikumine',
    explanationEn: 'The Red Cross is the humanitarian movement symbolised by a red cross or crescent.',
    explanationEt: 'Punane Rist on punase risti või poolkuuga tähistatud humanitaarliikumine.',
    evidenceAssertion: 'the Red Cross — The Red Cross is the humanitarian movement symbolised by a red cross or crescent.',
  },
};

export function applyRetainedEasyClueCorrection(
  row: Readonly<Record<string, string>>,
  retainedClueIds: ReadonlySet<string>,
): Readonly<Record<string, string>> {
  if (!retainedClueIds.has(row.clue_id)) return row;
  if (row.content_kind !== 'board' || row.difficulty !== 'easy') return row;
  if (!row.clue_id.includes('-accessible-easy-')) return row;
  const correction = RETAINED_EASY_CLUE_CORRECTIONS[
    row.clue_id as RetainedAccessibleEasyClueId
  ];
  if (correction === undefined) return row;
  return {
    ...row,
    clue_en: correction.en,
    clue_et: correction.et,
    ...(correction.responseEn === undefined ? {} : {
      response_en: correction.responseEn,
      response_et: correction.responseEt!,
      accepted_variants_en: correction.variantsEn!,
      accepted_variants_et: correction.variantsEt!,
    }),
    ...(correction.explanationEn === undefined ? {} : {
      explanation_en: correction.explanationEn,
      explanation_et: correction.explanationEt!,
    }),
  };
}

export function applyRetainedEasyEvidenceCorrection(
  evidence: ContentEvidence,
  retainedClueIds: ReadonlySet<string>,
): ContentEvidence {
  if (!retainedClueIds.has(evidence.clueId)) return evidence;
  const correction = RETAINED_EASY_CLUE_CORRECTIONS[
    evidence.clueId as RetainedAccessibleEasyClueId
  ];
  if (correction?.evidenceAssertion === undefined) return evidence;
  return {
    ...evidence,
    assertion: correction.evidenceAssertion,
  };
}
