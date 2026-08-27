export interface BroadCategoryRow {
  clue_id: string;
  category_set_id: string;
  pack_id: string;
  difficulty: string;
  round: string;
  tier: string;
  macro_topic: string;
  category_name_en: string;
  category_name_et: string;
  clue_en: string;
  clue_et: string;
  [column: string]: string;
}

export interface BroadCategoryNames {
  topicNameEn: string;
  topicNameEt: string;
}

const TITLE_ADJECTIVES = [
  ['Quick', 'kiire'],
  ['Curious', 'uudishimulik'],
  ['Classic', 'klassikaline'],
  ['Unexpected', 'ootamatu'],
  ['Worldwide', 'maailma'],
  ['Everyday', 'igapäevane'],
  ['Colorful', 'värvikas'],
  ['Clever', 'nutikas'],
  ['Playful', 'mänguline'],
  ['Mixed', 'kirju'],
] as const;

const TITLE_FORMATS = [
  ['Mix', 'segu'],
  ['Medley', 'valik'],
  ['Tour', 'ringkäik'],
  ['Grab Bag', 'üllatuskott'],
  ['Roundup', 'ülevaade'],
  ['Sampler', 'proovivalik'],
  ['Potpourri', 'popurrii'],
  ['Challenge', 'väljakutse'],
  ['Quiz', 'viktoriin'],
  ['Odds & Ends', 'üht-teist'],
] as const;

function titleFor(index: number, names: BroadCategoryNames): { en: string; et: string } {
  const adjective = TITLE_ADJECTIVES[Math.floor(index / TITLE_FORMATS.length)];
  const format = TITLE_FORMATS[index % TITLE_FORMATS.length];
  if (adjective === undefined || format === undefined) throw new Error('A topic cannot contain more than 100 category sets');
  return {
    en: `${names.topicNameEn}: ${adjective[0]} ${format[0]}`,
    et: `${names.topicNameEt}: ${adjective[1]} ${format[1]}`,
  };
}

function subjectLabel(row: BroadCategoryRow): string {
  const label = row.source_title.split(' — ', 1)[0].trim();
  if (label === '') throw new Error(`Clue ${row.clue_id} has no source-backed subject label`);
  return label;
}

export function regroupBroadCategories(
  rows: readonly BroadCategoryRow[],
  names: BroadCategoryNames,
): { rows: BroadCategoryRow[]; subjectKeyByClueId: ReadonlyMap<string, string> } {
  const sets = new Map<string, BroadCategoryRow[]>();
  for (const row of rows) {
    const set = sets.get(row.category_set_id) ?? [];
    set.push(row);
    sets.set(row.category_set_id, set);
  }

  const orderedSets = [...sets.entries()];
  const titleIndex = new Map(orderedSets.map(([categoryId], index) => [categoryId, index]));
  const cells = new Map<string, Array<[string, BroadCategoryRow[]]>>();
  for (const entry of orderedSets) {
    const first = entry[1][0];
    const key = `${first.pack_id}\0${first.difficulty}\0${first.round}`;
    const cell = cells.get(key) ?? [];
    cell.push(entry);
    cells.set(key, cell);
  }

  const regrouped: BroadCategoryRow[] = [];
  const subjectKeyByClueId = new Map<string, string>();
  for (const cell of cells.values()) {
    if (cell.length < 5) throw new Error(`A category cell requires at least five source subjects; found ${cell.length}`);
    for (const [destinationIndex, [destinationId, destinationRows]] of cell.entries()) {
      const destination = destinationRows[0];
      const title = titleFor(titleIndex.get(destinationId)!, names);
      for (let tier = 1; tier <= 5; tier += 1) {
        const [sourceId, sourceRows] = cell[(destinationIndex + tier - 1) % cell.length];
        const source = sourceRows.find((row) => row.tier === String(tier));
        if (source === undefined) throw new Error(`Source category ${sourceId} is missing tier ${tier}`);
        const subject = subjectLabel(source);
        regrouped.push({
          ...source,
          category_set_id: destinationId,
          macro_topic: destination.macro_topic,
          category_name_en: title.en,
          category_name_et: title.et,
          clue_en: `${subject} — ${source.clue_en}`,
          clue_et: source.clue_et === '' ? '' : `${subject} — ${source.clue_et}`,
        });
        subjectKeyByClueId.set(source.clue_id, sourceId);
      }
    }
  }

  return { rows: regrouped, subjectKeyByClueId };
}
