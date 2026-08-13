import csv
import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SCRIPT = Path(__file__).parents[3] / 'scripts' / 'content' / 'translate_en_et.py'
SPEC = importlib.util.spec_from_file_location('translate_en_et', SCRIPT)
assert SPEC is not None and SPEC.loader is not None
translator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(translator)


class TranslateEnEtTest(unittest.TestCase):
    def test_empty_accepted_variants_serializes_to_declared_estonian_column(self):
        headers = [
            'clue_id', 'pack_id', 'pack_name', 'category_set_id', 'content_kind', 'round', 'tier',
            'difficulty', 'macro_topic', 'category_name_en', 'category_name_et', 'clue_en', 'clue_et',
            'response_en', 'response_et', 'accepted_variants_en', 'accepted_variants_et',
            'explanation_en', 'explanation_et', 'source_title', 'source_url', 'source_license',
            'source_retrieved_at', 'translation_status', 'enabled',
        ]
        row = dict.fromkeys(headers, '')
        row.update({
            'clue_id': 'clue-empty-variants',
            'category_name_en': 'A Category',
            'clue_en': 'Who did this?',
            'response_en': 'A Person',
            'accepted_variants_en': '',
            'explanation_en': 'Useful context.',
        })

        with tempfile.TemporaryDirectory() as temporary:
            input_path = Path(temporary) / 'input.csv'
            output_path = Path(temporary) / 'output.csv'
            checkpoint_path = Path(temporary) / 'checkpoint.json'
            with input_path.open('w', encoding='utf-8', newline='') as handle:
                writer = csv.DictWriter(handle, fieldnames=headers)
                writer.writeheader()
                writer.writerow(row)

            fake_model = mock.Mock()
            fake_model.to.return_value = fake_model
            with (
                mock.patch.object(sys, 'argv', [
                    str(SCRIPT), '--input', str(input_path), '--output', str(output_path),
                    '--model', 'fixture-model', '--checkpoint', str(checkpoint_path),
                ]),
                mock.patch.object(translator.AutoTokenizer, 'from_pretrained', return_value=object()),
                mock.patch.object(translator.AutoModelForSeq2SeqLM, 'from_pretrained', return_value=fake_model),
                mock.patch.object(
                    translator,
                    'translate_batch',
                    side_effect=lambda _tokenizer, _model, values, _batch_size: ['tõlge'] * len(values),
                ),
            ):
                try:
                    exit_code = translator.run()
                except ValueError as error:
                    self.fail(f'Production CSV serialization raised ValueError: {error}')

            self.assertEqual(exit_code, 0)
            with output_path.open('r', encoding='utf-8', newline='') as handle:
                output_rows = list(csv.DictReader(handle))
            self.assertEqual(output_rows[0]['accepted_variants_et'], '')
            self.assertNotIn('accepted_variantset', output_rows[0])
            self.assertEqual(output_rows[0]['translation_status'], 'machine')


if __name__ == '__main__':
    unittest.main()
