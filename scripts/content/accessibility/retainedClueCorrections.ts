type RetainedAccessibleEasyClueId = `${string}-accessible-easy-${string}`;

type ClueCorrection = Readonly<{
  en: string;
  et: string;
}>;

const RETAINED_EASY_CLUE_CORRECTIONS: Readonly<Record<
  RetainedAccessibleEasyClueId,
  ClueCorrection
>> = {
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
  };
}
