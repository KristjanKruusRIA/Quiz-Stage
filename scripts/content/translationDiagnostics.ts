import { type ParsedCsvRow, type ParsedPack } from '../../src/main/content/csvPacks';
import { publishValidationReport } from './validate';
import { readCsvInputs } from './readCsv';

export interface TranslationDiagnosticIssue {
  file: string;
  row: number;
  clueId: string;
  field: string;
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface TranslationDiagnosticException {
  id: string;
  clueId: string;
  code: string;
  status: 'pending' | 'reviewed' | 'resolved';
  reviewerReason: string;
  correctedText: string;
}

export interface TranslationDiagnosticReport {
  blocking: boolean;
  checkedRows: number;
  issues: TranslationDiagnosticIssue[];
  exceptions: TranslationDiagnosticException[];
}

export interface TranslationDiagnosticInput {
  file: string;
  pack: ParsedPack;
}

interface CliOptions {
  input: string[];
  report: string;
}

interface TranslationPair {
  clueId: string;
  row: number;
  en: string;
  et: string;
  field: string;
}

const FIELD_PAIRS = [
  { en: 'category_name_en', et: 'category_name_et' },
  { en: 'clue_en', et: 'clue_et' },
  { en: 'response_en', et: 'response_et' },
  { en: 'accepted_variants_en', et: 'accepted_variants_et' },
  { en: 'explanation_en', et: 'explanation_et' },
] as const;

const QUALIFIER_OPPOSITES = [
  { en: ['north'], et: ['põhi', 'põhjas'], oppositeEn: ['south'], oppositeEt: ['lõuna', 'lõunas'] },
  { en: ['east'], et: ['ida', 'idas'], oppositeEn: ['west'], oppositeEt: ['lääs', 'läänes'] },
  { en: ['before'], et: ['enne'], oppositeEn: ['after'], oppositeEt: ['pärast'] },
  { en: ['first'], et: ['esimene'], oppositeEn: ['last'], oppositeEt: ['viimane'] },
  { en: ['more'], et: ['rohkem'], oppositeEn: ['less'], oppositeEt: ['vähem'] },
  { en: ['largest'], et: ['suurim'], oppositeEn: ['smallest'], oppositeEt: ['väikseim'] },
] as const;

function parseCli(argv: readonly string[]): CliOptions {
  const input: string[] = [];
  let report: string | undefined;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index] ?? '';
    if (argument === '--input') {
      const value = argv[index + 1];
      if (value === undefined || value === '') throw new Error('--input requires a value');
      input.push(value);
      index += 1;
    } else if (argument === '--report') {
      const value = argv[index + 1];
      if (value === undefined || value === '') throw new Error('--report requires a value');
      report = value;
      index += 1;
    } else if (argument.startsWith('--')) {
      throw new Error(`Unknown argument: ${argument}`);
    } else {
      input.push(argument);
    }
  }

  if (input.length === 0) throw new Error('--input is required');
  if (report === undefined || report === '') throw new Error('--report is required');
  return { input, report };
}

function normalizeText(value: string): string {
  return value.normalize('NFKC').trim().toLocaleLowerCase('en').replace(/\s+/g, ' ');
}

function compareCodeUnits(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function canonicalNumbers(value: string): string[] {
  const matches = value.match(/[-+]?(?:\d{1,3}(?:[ ,.\u00A0]\d{3})+|\d+)(?:[.,]\d+)?(?:\s?(?:%|°[CF]?|km\/h|km|cm|mm|kg|mg|mph|m|g|l|ml))?/giu) ?? [];
  return matches.map((raw) => {
    const unit = raw.match(/(?:%|°[CF]?|km\/h|km|cm|mm|kg|mg|mph|m|g|l|ml)$/iu)?.[0]?.toLowerCase() ?? '';
    let number = raw.slice(0, raw.length - unit.length).trim().replace(/\s+/g, '');
    const comma = number.lastIndexOf(',');
    const dot = number.lastIndexOf('.');
    if (comma >= 0 && dot >= 0) {
      const decimal = comma > dot ? ',' : '.';
      number = number.replace(decimal === ',' ? /\./g : /,/g, '').replace(decimal, '.');
    } else if (comma >= 0) {
      const decimals = number.length - comma - 1;
      number = decimals === 3 ? number.replace(/,/g, '') : number.replace(',', '.');
    } else if (dot >= 0 && number.length - dot - 1 === 3) {
      number = number.replace(/\./g, '');
    }
    return `${number}${unit}`;
  }).sort();
}

function differsNumerically(left: string, right: string): boolean {
  return canonicalNumbers(left).join('|') !== canonicalNumbers(right).join('|');
}

function splitEscapedItems(value: string): string[] {
  if (value === '') return [''];
  const items: string[] = [];
  let current = '';
  let escaping = false;
  for (const character of value) {
    if (escaping) {
      current += character;
      escaping = false;
    } else if (character === '\\') {
      escaping = true;
    } else if (character === ';') {
      items.push(current);
      current = '';
    } else {
      current += character;
    }
  }
  items.push(current);
  return items;
}

function isStableIdentifier(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === '') return false;
  return /^https?:\/\//.test(trimmed)
    || /^[QqPp]\d+$/.test(trimmed)
    || /^[A-Z]{2,}$/.test(trimmed)
    || /\d/.test(trimmed);
}

function isSameStableIdentifier(left: string, right: string): boolean {
  return isStableIdentifier(left)
    && isStableIdentifier(right)
    && normalizeText(left) === normalizeText(right);
}

function extractProperNouns(value: string): string[] {
  const acronyms = value.match(/\b[A-Z]{2,}\b/g) ?? [];
  const phrases = value.match(/\b(?:[A-Z][\p{L}'’-]+\s+){1,}[A-Z][\p{L}'’-]+\b/gu) ?? [];
  return [...new Set([...acronyms, ...phrases])];
}

function isUnchangedCandidate(english: string, et: string): boolean {
  const normalizedEnglish = normalizeText(english);
  const normalizedEstonian = normalizeText(et);
  if (normalizedEnglish === '' || normalizedEnglish !== normalizedEstonian) return false;
  if (normalizedEnglish.split(' ').length <= 1) return false;
  return !isStableIdentifier(english);
}

function containsAnyToken(value: string, candidates: readonly string[]): boolean {
  const tokens = new Set(value.normalize('NFKC').toLocaleLowerCase('en').match(/\p{L}+/gu) ?? []);
  return candidates.some((candidate) => tokens.has(candidate));
}

function hasQualifierDrift(english: string, estonian: string): boolean {
  return QUALIFIER_OPPOSITES.some(({ en, et, oppositeEn, oppositeEt }) => {
    const englishFirst = containsAnyToken(english, en);
    const englishSecond = containsAnyToken(english, oppositeEn);
    const estonianFirst = containsAnyToken(estonian, et);
    const estonianSecond = containsAnyToken(estonian, oppositeEt);
    return (englishFirst && !englishSecond && estonianSecond && !estonianFirst)
      || (englishSecond && !englishFirst && estonianFirst && !estonianSecond);
  });
}

function buildIssue(base: {
  file: string;
  row: number;
  clueId: string;
  field: string;
}, code: string, message: string, severity: 'error' | 'warning'): TranslationDiagnosticIssue {
  return { file: base.file, row: base.row, clueId: base.clueId, field: base.field, code, message, severity };
}

function diagnosePair(item: TranslationPair, file: string, issues: TranslationDiagnosticIssue[]): void {
  if (item.et.trim() === '') {
    issues.push(buildIssue({ file, row: item.row, clueId: item.clueId, field: item.field }, 'BLANK_TRANSLATION', `${item.field.replace('_en', '')} is blank in Estonian`, 'error'));
    return;
  }

  if (item.field !== 'accepted_variants_en' && differsNumerically(item.en, item.et)) {
    issues.push(buildIssue(
      { file, row: item.row, clueId: item.clueId, field: item.field },
      'NUMBER_DRIFT', `Numeric values differ for ${item.field}`, 'error',
    ));
  }

  if (item.field === 'response_en'
    && (differsNumerically(item.en, item.et)
      || (isStableIdentifier(item.en)
        && isStableIdentifier(item.et)
        && normalizeText(item.en) !== normalizeText(item.et)))) {
    issues.push(buildIssue(
      { file, row: item.row, clueId: item.clueId, field: item.field },
      'ANSWER_DRIFT', 'Canonical answers differ between English and Estonian', 'error',
    ));
  }

  if (['clue_en', 'response_en', 'accepted_variants_en', 'explanation_en'].includes(item.field)
    && hasQualifierDrift(item.en, item.et)) {
    issues.push(buildIssue(
      { file, row: item.row, clueId: item.clueId, field: item.field },
      'QUALIFIER_DRIFT', `Opposite qualifier detected for ${item.field}`, 'error',
    ));
  }

  if (item.field === 'accepted_variants_en') {
    const enItems = splitEscapedItems(item.en);
    const etItems = splitEscapedItems(item.et);
    const unchangedAll = enItems.every((value, index) => {
      const translated = etItems[index] ?? '';
      return isUnchangedCandidate(value, translated);
    });
    if (unchangedAll && enItems.some((value) => value.trim().split(/\s+/).length > 1)) {
      issues.push(buildIssue(
        { file, row: item.row, clueId: item.clueId, field: item.field },
        'UNCHANGED_TRANSLATION', 'Accepted variants were unchanged across multiple words', 'warning',
      ));
    }
    for (const value of enItems) {
      for (const noun of extractProperNouns(value)) {
        if (!isStableIdentifier(noun) && !normalizeText(item.et).includes(normalizeText(noun))) {
          issues.push(buildIssue(
            { file, row: item.row, clueId: item.clueId, field: item.field },
            'SUSPICIOUS_PROPER_NOUN_CHANGE', `Proper noun "${noun}" is missing from accepted variant translation`, 'warning',
          ));
        }
      }
    }
    return;
  }

  if (isUnchangedCandidate(item.en, item.et)) {
    issues.push(buildIssue({ file, row: item.row, clueId: item.clueId, field: item.field }, 'UNCHANGED_TRANSLATION', `${item.field} appears unchanged from English`, 'warning'));
  }

  for (const noun of extractProperNouns(item.en)) {
    if (!isStableIdentifier(noun) && !normalizeText(item.et).includes(normalizeText(noun))) {
      issues.push(buildIssue({ file, row: item.row, clueId: item.clueId, field: item.field }, 'SUSPICIOUS_PROPER_NOUN_CHANGE', `Proper noun "${noun}" is missing from ${item.field} translation`, 'warning'));
    }
  }
}

function diagnoseVariantDrift(row: ParsedCsvRow, file: string, issues: TranslationDiagnosticIssue[]): void {
  const enItems = splitEscapedItems(row.accepted_variants_en);
  const etItems = splitEscapedItems(row.accepted_variants_et);
  const mismatched = enItems.length !== etItems.length
    || enItems.some((english, index) => {
      const estonian = etItems[index] ?? '';
      return normalizeText(english) !== normalizeText(estonian)
        && !isSameStableIdentifier(english, estonian);
    });
  if (!mismatched) return;
  issues.push(buildIssue(
    { file, row: row.rowNumber, clueId: row.clue_id, field: 'accepted_variants_en' },
    'VARIANT_DRIFT', 'Accepted variants differ between English and Estonian', 'error',
  ));
}

function extractPairs(row: ParsedCsvRow): TranslationPair[] {
  const items: TranslationPair[] = [];
  for (const field of FIELD_PAIRS) {
    const english = row[field.en];
    const estonian = row[field.et];
    if (field.en === 'accepted_variants_en') {
      const enItems = splitEscapedItems(english);
      const etItems = splitEscapedItems(estonian);
      const count = Math.max(enItems.length, etItems.length, 1);
      for (let index = 0; index < count; index += 1) {
        items.push({
          clueId: row.clue_id,
          row: row.rowNumber,
          field: field.en,
          en: enItems[index] ?? '',
          et: etItems[index] ?? '',
        });
      }
      continue;
    }
    items.push({
      clueId: row.clue_id,
      row: row.rowNumber,
      field: field.en,
      en: english,
      et: estonian,
    });
  }
  return items;
}

function buildExceptions(issues: TranslationDiagnosticIssue[]): TranslationDiagnosticException[] {
  const exceptions = new Map<string, TranslationDiagnosticException>();
  for (const issue of issues) {
    const id = `${issue.code}:${issue.clueId}:${issue.field}`;
    if (exceptions.has(id)) continue;
    exceptions.set(id, {
      id,
      clueId: issue.clueId,
      code: issue.code,
      status: 'pending',
      reviewerReason: 'pending-review',
      correctedText: '',
    });
  }
  return [...exceptions.values()].sort((left, right) => left.id.localeCompare(right.id, 'en'));
}

function stableIssueSort(left: TranslationDiagnosticIssue, right: TranslationDiagnosticIssue): number {
  return left.file.localeCompare(right.file, 'en')
    || left.row - right.row
    || left.field.localeCompare(right.field, 'en')
    || left.code.localeCompare(right.code, 'en')
    || compareCodeUnits(left.clueId, right.clueId);
}

export function diagnoseTranslations(inputs: readonly TranslationDiagnosticInput[]): TranslationDiagnosticReport {
  const issues: TranslationDiagnosticIssue[] = [];

  for (const { file, pack } of inputs) {
    for (const row of pack.rows) {
      for (const pair of extractPairs(row)) {
        diagnosePair(pair, file, issues);
      }
      diagnoseVariantDrift(row, file, issues);
    }
  }

  return {
    blocking: issues.some((issue) => issue.severity === 'error'),
    checkedRows: inputs.reduce((count, input) => count + input.pack.rows.length, 0),
    issues: issues.sort(stableIssueSort),
    exceptions: buildExceptions(issues),
  };
}

export async function runTranslationDiagnostics(
  argv: readonly string[] = process.argv.slice(2),
): Promise<number> {
  const options = parseCli(argv);
  const inputs = await readCsvInputs(options.input);
  const report = diagnoseTranslations(inputs);

  publishValidationReport(options.report, { translation: report });
  return report.blocking ? 1 : 0;
}

if (process.argv[1] !== undefined && process.argv[1] === __filename) {
  runTranslationDiagnostics().then((code) => {
    process.exitCode = code;
  }).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  });
}
