import { HISTORY_EASY_EXPANSION_CATEGORIES } from "./banks/01-history";
import { GEOGRAPHY_EASY_EXPANSION_CATEGORIES } from "./banks/02-geography";
import { SCIENCE_NATURE_EASY_EXPANSION_CATEGORIES } from "./banks/03-science-nature";
import { LITERATURE_LANGUAGE_EASY_EXPANSION_CATEGORIES } from "./banks/04-literature-language";
import { ART_ARCHITECTURE_EASY_EXPANSION_CATEGORIES } from "./banks/05-art-architecture";
import { MUSIC_EASY_EXPANSION_CATEGORIES } from "./banks/06-music";
import { FILM_TELEVISION_EASY_EXPANSION_CATEGORIES } from "./banks/07-film-television";
import type { EasyExpansionCategory } from "./types";

export type EasyExpansionBankRegistration = Readonly<{
  batchId: string;
  categories: readonly EasyExpansionCategory[];
}>;

type PreparedBankRegistration = Readonly<{
  batchId: string;
  categories: readonly EasyExpansionCategory[];
}>;

const REGISTERED_EASY_EXPANSION_BANKS: readonly EasyExpansionBankRegistration[] =
  Object.freeze([
    {
      batchId: "01-history",
      categories: HISTORY_EASY_EXPANSION_CATEGORIES,
    },
    {
      batchId: "02-geography",
      categories: GEOGRAPHY_EASY_EXPANSION_CATEGORIES,
    },
    {
      batchId: "03-science-nature",
      categories: SCIENCE_NATURE_EASY_EXPANSION_CATEGORIES,
    },
    {
      batchId: "04-literature-language",
      categories: LITERATURE_LANGUAGE_EASY_EXPANSION_CATEGORIES,
    },
    {
      batchId: "05-art-architecture",
      categories: ART_ARCHITECTURE_EASY_EXPANSION_CATEGORIES,
    },
    {
      batchId: "06-music",
      categories: MUSIC_EASY_EXPANSION_CATEGORIES,
    },
    {
      batchId: "07-film-television",
      categories: FILM_TELEVISION_EASY_EXPANSION_CATEGORIES,
    },
  ]);

function compareIds(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function prepareBanks(
  registrations: readonly EasyExpansionBankRegistration[],
): readonly PreparedBankRegistration[] {
  const seenBatchIds = new Set<string>();
  for (const registration of registrations) {
    if (seenBatchIds.has(registration.batchId)) {
      throw new Error(
        `Duplicate Easy expansion batch registration: "${registration.batchId}".`,
      );
    }
    seenBatchIds.add(registration.batchId);
  }

  const seenCategorySetIds = new Map<string, string>();
  const seenClueIds = new Map<string, string>();
  const ordered = [...registrations]
    .sort((left, right) => compareIds(left.batchId, right.batchId))
    .map((registration): PreparedBankRegistration => {
      if (registration.categories.length !== 20) {
        throw new Error(
          `Easy expansion bank "${registration.batchId}" must contain exactly 20 categories; ` +
            `found ${registration.categories.length}.`,
        );
      }

      const categories = [...registration.categories].sort((left, right) =>
        compareIds(left.categorySetId, right.categorySetId),
      );

      for (const category of categories) {
        if (category.batchId !== registration.batchId) {
          throw new Error(
            `Easy expansion category "${category.categorySetId}" declares batch ` +
              `"${category.batchId}" but is registered under batch "${registration.batchId}".`,
          );
        }

        const priorCategoryBatch = seenCategorySetIds.get(
          category.categorySetId,
        );
        if (priorCategoryBatch !== undefined) {
          throw new Error(
            `Duplicate Easy expansion category set registration: "${category.categorySetId}" ` +
              `in batches "${priorCategoryBatch}" and "${registration.batchId}".`,
          );
        }
        seenCategorySetIds.set(category.categorySetId, registration.batchId);

        for (const question of category.questions) {
          const priorClueLocation = seenClueIds.get(question.clueId);
          if (priorClueLocation !== undefined) {
            throw new Error(
              `Duplicate Easy expansion clue registration: "${question.clueId}" ` +
                `in ${priorClueLocation} and ` +
                `${registration.batchId}/${category.categorySetId}.`,
            );
          }
          seenClueIds.set(
            question.clueId,
            `${registration.batchId}/${category.categorySetId}`,
          );
        }
      }

      return Object.freeze({
        batchId: registration.batchId,
        categories: Object.freeze(categories),
      });
    });

  return Object.freeze(ordered);
}

function flattenBanks(
  registrations: readonly PreparedBankRegistration[],
): readonly EasyExpansionCategory[] {
  return Object.freeze(registrations.flatMap(({ categories }) => categories));
}

export function combineEasyExpansionBanks(
  registrations: readonly EasyExpansionBankRegistration[],
): readonly EasyExpansionCategory[] {
  return flattenBanks(prepareBanks(registrations));
}

const PREPARED_EASY_EXPANSION_BANKS = prepareBanks(
  REGISTERED_EASY_EXPANSION_BANKS,
);
const EASY_EXPANSION_CORPUS = flattenBanks(PREPARED_EASY_EXPANSION_BANKS);

export function buildEasyExpansionCorpus(): readonly EasyExpansionCategory[] {
  return EASY_EXPANSION_CORPUS;
}

export function getEasyExpansionBank(
  batchId: string,
): readonly EasyExpansionCategory[] {
  const registration = PREPARED_EASY_EXPANSION_BANKS.find(
    (candidate) => candidate.batchId === batchId,
  );
  if (registration === undefined) {
    throw new Error(
      `No Easy expansion bank registered for batch "${batchId}".`,
    );
  }
  return registration.categories;
}
