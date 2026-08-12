#!/usr/bin/env python3
"""Translate English content CSV rows to Estonian with resumable checkpoints."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path
from typing import Dict, List, Sequence, Tuple

from torch import cuda
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

MODEL_CACHE_DIR = Path('.cache/translation')
CHECKPOINT_DIR = MODEL_CACHE_DIR / 'checkpoints'
TRANSLATE_FIELD_PAIRS = [
    ('category_name_en', 'category_name_et'),
    ('clue_en', 'clue_et'),
    ('response_en', 'response_et'),
    ('accepted_variants_en', 'accepted_variants_et'),
    ('explanation_en', 'explanation_et'),
]
DEFAULT_BATCH_SIZE = 16


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description='Translate English fields in a content CSV to Estonian.')
    parser.add_argument('--input', required=True, help='Input CSV path')
    parser.add_argument('--output', required=True, help='Output CSV path')
    parser.add_argument('--model', required=True, help='Hugging Face model identifier')
    parser.add_argument('--checkpoint', default=None, help='Checkpoint file path')
    parser.add_argument('--batch-size', type=int, default=DEFAULT_BATCH_SIZE, help='Max items translated per model batch')
    parser.add_argument('--cache-dir', default=str(MODEL_CACHE_DIR), help='Model cache directory')
    return parser.parse_args()


def default_checkpoint_path(output_path: str) -> Path:
    return CHECKPOINT_DIR / f'{Path(output_path).name}.checkpoint.json'


def parse_csv(path: Path) -> Tuple[List[str], List[Dict[str, str]]]:
    with path.open('r', encoding='utf-8', newline='') as handle:
        reader = csv.DictReader(handle)
        header = reader.fieldnames
        if header is None:
            raise ValueError('Input CSV is missing a header')
        rows = [dict(row) for row in reader]
    for column in {
        'clue_id', 'category_name_en', 'clue_en', 'response_en',
        'explanation_en', 'accepted_variants_en',
    }:
        if column not in header:
            raise ValueError(f'Input CSV is missing column: {column}')
    return header, rows


def encode_variants(values: Sequence[str]) -> str:
    return ';'.join(value.replace('\\', '\\\\').replace(';', '\\;') for value in values)


def decode_variants(value: str) -> Tuple[List[str], bool]:
    if value == '':
        return [], True
    values: List[str] = []
    current = ''
    escaped = False
    valid = True
    for character in value:
        if escaped:
            if character not in {'\\', ';'}:
                valid = False
            current += character
            escaped = False
        elif character == '\\':
            escaped = True
        elif character == ';':
            values.append(current)
            current = ''
        else:
            current += character
    values.append(current)
    if escaped:
        valid = False
    if any(item.strip() == '' for item in values):
        valid = False
    return values, valid


def row_signature(rows: Sequence[Dict[str, str]]) -> str:
    relevant = [
        {
            'clue_id': row.get('clue_id', ''),
            'category_name_en': row.get('category_name_en', ''),
            'clue_en': row.get('clue_en', ''),
            'response_en': row.get('response_en', ''),
            'explanation_en': row.get('explanation_en', ''),
            'accepted_variants_en': row.get('accepted_variants_en', ''),
        }
        for row in rows
    ]
    payload = json.dumps(relevant, ensure_ascii=False, sort_keys=True)
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()


def read_checkpoint(path: Path) -> Dict[str, object]:
    if not path.exists():
        return {'nextRow': 0, 'signature': None, 'totalRows': 0}
    try:
        with path.open('r', encoding='utf-8') as handle:
            state = json.load(handle)
    except Exception:
        return {'nextRow': 0, 'signature': None, 'totalRows': 0}
    if not isinstance(state, dict):
        return {'nextRow': 0, 'signature': None, 'totalRows': 0}
    next_row = state.get('nextRow')
    signature = state.get('signature')
    total_rows = state.get('totalRows')
    if not isinstance(next_row, int) or not isinstance(total_rows, int):
        return {'nextRow': 0, 'signature': None, 'totalRows': 0}
    return {'nextRow': next_row, 'signature': signature, 'totalRows': total_rows}


def write_checkpoint(path: Path, next_row: int, signature: str, total_rows: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open('w', encoding='utf-8') as handle:
        json.dump(
            {
                'version': 1,
                'nextRow': next_row,
                'signature': signature,
                'totalRows': total_rows,
            },
            handle,
        )


def clear_checkpoint(path: Path) -> None:
    try:
        path.unlink()
    except FileNotFoundError:
        pass


def translate_batch(tokenizer, model, values: Sequence[str], batch_size: int) -> List[str]:
    if len(values) == 0:
        return []
    outputs: List[str] = []
    for index in range(0, len(values), batch_size):
        chunk = list(values[index:index + batch_size])
        encoded = tokenizer(chunk, return_tensors='pt', padding=True, truncation=True, max_length=256)
        encoded = {key: value.to(model.device) for key, value in encoded.items()}
        generated = model.generate(
            **encoded,
            max_new_tokens=256,
            num_beams=4,
            early_stopping=True,
        )
        decoded = tokenizer.batch_decode(generated, skip_special_tokens=True)
        outputs.extend(item.strip() for item in decoded)
    return outputs


def read_previous_output(path: Path, expected_rows: int) -> List[Dict[str, str]]:
    if not path.exists():
        return []
    with path.open('r', encoding='utf-8', newline='') as handle:
        reader = csv.DictReader(handle)
        rows = [dict(row) for row in reader]
    if len(rows) < expected_rows:
        return rows
    return rows[:expected_rows]


def run() -> int:
    options = parse_args()
    input_path = Path(options.input)
    output_path = Path(options.output)
    cache_dir = Path(options.cache_dir)
    checkpoint_path = Path(options.checkpoint) if options.checkpoint is not None else default_checkpoint_path(options.output)

    header, source_rows = parse_csv(input_path)
    if 'translation_status' not in header:
        header = [*header, 'translation_status']

    total_rows = len(source_rows)
    signature = row_signature(source_rows)
    checkpoint = read_checkpoint(checkpoint_path)
    start_row = 0
    if checkpoint.get('signature') == signature and checkpoint.get('totalRows') == total_rows:
        start_row = max(0, min(int(checkpoint['nextRow']), total_rows))

    previous_rows = read_previous_output(output_path, total_rows)
    if start_row > len(previous_rows):
        start_row = 0

    row_translations: List[Dict[str, str]] = [dict(row) for row in source_rows]
    for index, row in enumerate(row_translations):
        if index < start_row and index < len(previous_rows):
            row_translations[index] = {**previous_rows[index]}

    direct_jobs: List[Tuple[int, str]] = []
    direct_values: List[str] = []
    variant_jobs: List[Tuple[int, int]] = []
    variant_values: List[str] = []

    for index in range(start_row, total_rows):
        row = source_rows[index]
        for source, _target in TRANSLATE_FIELD_PAIRS:
            english = row.get(source, '').strip()
            if english == '':
                row_translations[index][f'{source[:-3]}et'] = ''
                continue
            if source == 'accepted_variants_en':
                variants, valid = decode_variants(english)
                if not valid:
                    row_translations[index][f'{source[:-3]}et'] = ''
                    continue
                for variant_index, value in enumerate(variants):
                    if value == '':
                        continue
                    variant_jobs.append((index, variant_index))
                    variant_values.append(value)
            else:
                direct_jobs.append((index, source[:-3]))
                direct_values.append(english)

    device = 'cuda' if cuda.is_available() else 'cpu'
    tokenizer = AutoTokenizer.from_pretrained(options.model, cache_dir=str(cache_dir))
    model = AutoModelForSeq2SeqLM.from_pretrained(options.model, cache_dir=str(cache_dir)).to(device)
    model.eval()

    direct_translations = translate_batch(tokenizer, model, direct_values, max(1, options.batch_size))
    for (index, source_base), translated in zip(direct_jobs, direct_translations):
        row_translations[index][f'{source_base}_et'] = translated

    accepted_translations = translate_batch(tokenizer, model, variant_values, max(1, options.batch_size))
    variants_by_row: Dict[int, List[str]] = {}
    for (index, variant_index), translated in zip(variant_jobs, accepted_translations):
        bucket = variants_by_row.setdefault(index, [])
        while len(bucket) <= variant_index:
            bucket.append('')
        bucket[variant_index] = translated
    for index in range(start_row, total_rows):
        items = variants_by_row.get(index)
        if items is not None:
            row_translations[index]['accepted_variants_et'] = encode_variants(items)

    for row in row_translations:
        row['translation_status'] = 'machine'

    with output_path.open('w', encoding='utf-8', newline='') as handle:
        writer = csv.DictWriter(handle, fieldnames=header)
        writer.writeheader()
        for index, row in enumerate(row_translations):
            writer.writerow(row)
            if index >= start_row:
                write_checkpoint(checkpoint_path, index + 1, signature, total_rows)

    clear_checkpoint(checkpoint_path)
    return 0 if total_rows == 0 else 0


if __name__ == '__main__':
    raise SystemExit(run())
