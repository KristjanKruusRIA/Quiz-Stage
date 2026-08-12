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
