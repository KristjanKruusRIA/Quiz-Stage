export interface WikidataRecipeDefinition {
  name: string;
  classId: string;
  propertyId: string;
}

export const WIKIDATA_RECIPE_FAMILIES: readonly WikidataRecipeDefinition[] = [
  { name: 'historical-events', classId: 'Q1190554', propertyId: 'P585' },
  { name: 'places-and-features', classId: 'Q2221906', propertyId: 'P36' },
  { name: 'scientists-and-discoveries', classId: 'Q901', propertyId: 'P166' },
  { name: 'authors-and-works', classId: 'Q482994', propertyId: 'P50' },
  { name: 'artists-and-works', classId: 'Q338581', propertyId: 'P170' },
  { name: 'composers-and-works', classId: 'Q753110', propertyId: 'P86' },
  { name: 'films-and-directors', classId: 'Q11424', propertyId: 'P57' },
  { name: 'athletes-and-teams', classId: 'Q2066131', propertyId: 'P54' },
  { name: 'foods-and-origins', classId: 'Q746549', propertyId: 'P1813' },
  { name: 'inventions-and-inventors', classId: 'Q17334923', propertyId: 'P61' },
  { name: 'institutions-and-foundings', classId: 'Q15936437', propertyId: 'P571' },
  { name: 'mythology-philosophy', classId: 'Q12518', propertyId: 'P31' },
] as const;

export const WIKIDATA_RECIPE_NAMES = WIKIDATA_RECIPE_FAMILIES.map((recipe) => recipe.name) as readonly string[];
export const WIKIDATA_MAX_ROWS = 500;
export const WIKIDATA_MAX_URL_LENGTH = 1900;

export function getWikidataRecipe(name: string): WikidataRecipeDefinition {
  const recipe = WIKIDATA_RECIPE_FAMILIES.find((candidate) => candidate.name === name);
  if (recipe === undefined) throw new Error(`Unknown Wikidata recipe: ${name}`);
  return recipe;
}

function escapeAfterCursor(value: string): string {
  return value.replace(/(["\\])/g, '\\$1');
}

function buildAfterFilter(after: string | undefined): string {
  if (after === undefined || after === '') return '';
  return `
    BIND(IRI(CONCAT("http://www.wikidata.org/entity/", "${escapeAfterCursor(after)}")) AS ?afterItem)
    FILTER(?item > ?afterItem)
    `;
}

export function buildWikidataRecipeQuery(
  name: string,
  options: { after?: string; limit?: number; } = {},
): string {
  const recipe = getWikidataRecipe(name);
  const limit = Math.min(Math.max(options.limit ?? WIKIDATA_MAX_ROWS, 1), WIKIDATA_MAX_ROWS);
  const after = buildAfterFilter(options.after);
  return `
PREFIX wikibase: <http://wikiba.se/ontology#>
PREFIX wd: <http://www.wikidata.org/entity/>
PREFIX wdt: <http://www.wikidata.org/prop/direct/>

SELECT ?item ?itemLabel ?property ?propertyLabel ?value ?valueLabel
WHERE {
  ?item wdt:P31 wd:${recipe.classId} .
  ?item wdt:${recipe.propertyId} ?value .
  BIND(wd:${recipe.propertyId} AS ?property)
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "en" .
  }
  ${after}
}
ORDER BY ?item
LIMIT ${limit}
`;
}
