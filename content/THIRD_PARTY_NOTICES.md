# Third Party Notices

## Open Trivia Database (OpenTDB)

- Source: https://opentdb.com/
- License: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
- Local license text: `content/LICENSE-CC-BY-SA-4.0.txt`
- Attribution requirement: OpenTDB data is retained in `content/imports/opentdb-candidates.jsonl`
  as draft inspiration only and requires separate factual sourcing before content is authored.
- Attribution/ingest update placeholder: none yet.

## Wikidata (CC0 facts)

- Source: https://www.wikidata.org/wiki/Wikidata:Main_Page
- License: Creative Commons Zero v1.0 Universal (CC0-1.0)
- Retrieval method: SPARQL query cache via `npm run content:fetch-wikidata`
- Source IDs and facts are retained in `content/imports/wikidata-candidates.jsonl` as reusable factual sources
  for draft authoring.

## Helsinki-NLP Opus-MT English→Estonian translation model

- Source: https://huggingface.co/Helsinki-NLP/opus-mt-en-et
- License: Apache License 2.0
- Build-time dependency only (not packaged with the application).
- Retrieval method: `pip install -r scripts/content/requirements-translate.txt`
- Model artifacts are cached locally under `.cache/translation/` when running
  `python scripts/content/translate_en_et.py`.
- Wikidata fetch: 2 draft candidates on 2026-08-12T12:00:00.000Z from Wikidata CC0-1.0 (SPARQL, source CC0)
- Wikidata fetch: 4 draft candidates on 2026-08-12T12:00:00.000Z from Wikidata CC0-1.0 (SPARQL, source CC0)
- Wikidata fetch: 3 draft candidates on 2026-08-12T12:00:00.000Z from Wikidata CC0-1.0 (SPARQL, source CC0)
- Wikidata fetch: 10 draft candidates on 2026-08-12T12:06:19.582Z from Wikidata CC0-1.0 (SPARQL, source CC0)
- Wikidata fetch: 500 draft candidates on 2026-08-12T12:42:13.946Z from Wikidata CC0-1.0 (SPARQL, source CC0)
- Wikidata fetch: 500 draft candidates on 2026-08-12T12:43:34.281Z from Wikidata CC0-1.0 (SPARQL, source CC0)
- Wikidata fetch: 8 draft candidates on 2026-08-12T12:43:35.949Z from Wikidata CC0-1.0 (SPARQL, source CC0)
- Wikidata fetch: 0 draft candidates on 2026-08-12T12:43:37.925Z from Wikidata CC0-1.0 (SPARQL, source CC0)
- Wikidata fetch: 113 draft candidates on 2026-08-12T12:43:39.915Z from Wikidata CC0-1.0 (SPARQL, source CC0)
- Wikidata fetch: 0 draft candidates on 2026-08-12T12:43:41.787Z from Wikidata CC0-1.0 (SPARQL, source CC0)
- Wikidata fetch: 0 draft candidates on 2026-08-12T12:43:43.679Z from Wikidata CC0-1.0 (SPARQL, source CC0)
- Wikidata fetch: 1 draft candidates on 2026-08-12T12:00:00.000Z from Wikidata CC0-1.0 (SPARQL, source CC0)
- OpenTDB fetch: 2500 draft candidates on 2026-08-13T18:38:39.136Z from OpenTDB (retrieved 2026-08-13T18:38:39.136Z)
- Wikidata fetch: 100 draft candidates on 2026-08-13T18:39:08.899Z from Wikidata CC0-1.0 (SPARQL, source CC0)
- Wikidata fetch: 500 draft candidates on 2026-08-13T18:39:57.909Z from Wikidata CC0-1.0 (SPARQL, source CC0)
