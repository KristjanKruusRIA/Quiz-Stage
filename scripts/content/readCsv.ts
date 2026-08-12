import { lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TextDecoder } from 'node:util';
import { glob } from 'glob';
import { CsvValidationError } from '../../src/shared/content/csvColumns';
import { parsePackCsv, type ParsedPack } from '../../src/main/content/csvPacks';

export interface CsvInputFile {
  file: string;
  pack: ParsedPack;
}

export async function resolveCsvInputFiles(patterns: readonly string[]): Promise<string[]> {
  if (patterns.length === 0) throw new Error('At least one --input glob is required');
  const matches = new Map<string, string>();
  for (const pattern of patterns) {
    const found = await glob(pattern, {
      absolute: true,
      cwd: process.cwd(),
      nodir: true,
      follow: false,
      windowsPathsNoEscape: true,
    });
    for (const path of found) {
      const absolute = resolve(path);
      const stat = lstatSync(absolute);
      if (stat.isSymbolicLink()) throw new Error(`CSV input must not be a symlink: ${absolute}`);
      if (!stat.isFile()) throw new Error(`CSV input is not a regular file: ${absolute}`);
      matches.set(process.platform === 'win32' ? absolute.toLowerCase() : absolute, absolute);
    }
  }
  const files = [...matches.values()].sort((left, right) => left.localeCompare(right, 'en'));
  if (files.length === 0) throw new Error(`Input glob matched no files: ${patterns.join(', ')}`);
  return files;
}

export async function readCsvInputs(patterns: readonly string[]): Promise<CsvInputFile[]> {
  const files = await resolveCsvInputFiles(patterns);
  return files.map((file) => {
    const before = lstatSync(file);
    if (!before.isFile() || before.isSymbolicLink()) throw new Error(`CSV input is not a safe regular file: ${file}`);
    const bytes = readFileSync(file);
    const after = lstatSync(file);
    if (!after.isFile() || after.isSymbolicLink()
      || before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size) {
      throw new Error(`CSV input changed while reading: ${file}`);
    }
    let text: string;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      throw new CsvValidationError('invalid-utf8');
    }
    return { file, pack: parsePackCsv(text) };
  });
}
