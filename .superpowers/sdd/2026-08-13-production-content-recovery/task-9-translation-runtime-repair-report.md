# Task 9 translation runtime repair

Status: complete and verified. This report covers only the CSV target-key crash in the machine-translation runtime. The full 500-row Helsinki translation was not rerun.

## Root cause

`TRANSLATE_FIELD_PAIRS` already declares the correct `accepted_variants_et` target. In the empty and invalid source-value branches, `translate_en_et.py` ignored that target and instead evaluated `f'{source[:-3]}et'`. For `accepted_variants_en`, this produced the undeclared key `accepted_variantset`. After model generation, `csv.DictWriter` rejected the first row because that key was absent from the CSV header.

The repair uses the declared target in those two branches. No translation behavior, model configuration, batching, or checkpoint behavior changed.

## RED

Command:

```powershell
content/work/01-history/.venv-translate/Scripts/python.exe -m unittest tests.unit.content.test_translate_en_et.TranslateEnEtTest.test_empty_accepted_variants_serializes_to_declared_estonian_column -v
```

Result: exit 1; one test failed in 0.020 seconds with the production exception:

```text
AssertionError: Production CSV serialization raised ValueError: dict contains fields not in fieldnames: 'accepted_variantset'

Ran 1 test in 0.020s
FAILED (failures=1)
```

The test executes the real `run()` CSV parsing and serialization path with a one-row production-shaped CSV. Only the external tokenizer/model generation boundary is replaced with a deterministic in-process result.

## GREEN

Focused command:

```powershell
content/work/01-history/.venv-translate/Scripts/python.exe -m unittest tests.unit.content.test_translate_en_et.TranslateEnEtTest.test_empty_accepted_variants_serializes_to_declared_estonian_column -v
```

Result: exit 0; one test passed in 0.022 seconds.

Existing translation diagnostic check:

```powershell
npm run test:run -- tests/unit/content/translationDiagnostics.test.ts
```

Result: exit 0; one test file and all five tests passed.

Fresh regression-file run:

```powershell
content/work/01-history/.venv-translate/Scripts/python.exe -m unittest tests.unit.content.test_translate_en_et -v
```

Result: exit 0; one test passed in 0.011 seconds.

The isolated CPU environment emits its existing warning that CUDA was not found; no test or runtime error remained.

## Scope and preservation

- Production change: `scripts/content/translate_en_et.py`
- Regression: `tests/unit/content/test_translate_en_et.py`
- Evidence: this report
- The header-only failed work artifact remains at `content/work/01-history/generated.en-et.csv`; it was neither staged nor regenerated.
- No accepted content, evidence approvals, model choice, or translation review state changed.
