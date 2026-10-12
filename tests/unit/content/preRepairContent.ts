import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { loadContentRepairReview } from '../../../scripts/content/contentRepairReview';

type Delta = { file: string; beforeRaw: string; afterRaw: string };
let deltas: Delta[] | undefined;
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

/** Historical expansion fixtures keep their original reviewed bytes; current-bank tests use the repaired bank. */
export function readPreRepairContent(file: string): string {
  const current = readFileSync(file, 'utf8');
  const repositoryPath = relative(process.cwd(), resolve(file)).replaceAll('\\', '/');
  const artifact = loadContentRepairReview()?.artifacts.find(item => item.path === repositoryPath);
  if (!artifact) return current;
  if (hash(current) !== artifact.afterSha256) throw new Error(`Unreviewed current content: ${file}`);
  deltas ??= JSON.parse(readFileSync('docs/content-review/2026-10-11/repair-deltas.json', 'utf8')) as Delta[];
  const fileDeltas = deltas.filter(item => item.file === repositoryPath);
  const replacements = new Map(fileDeltas.map(delta => [delta.afterRaw, delta.beforeRaw]));
  const restored = new Set<string>();
  const historical = current.replace(/[^\n]*\n|[^\n]+$/gu, (line) => {
    const before = replacements.get(line);
    if (before === undefined) return line;
    if (restored.has(line)) throw new Error(`Repair delta does not match current bytes: ${file}`);
    restored.add(line);
    return before;
  });
  if (restored.size !== fileDeltas.length) throw new Error(`Repair delta does not match current bytes: ${file}`);
  if (hash(historical) !== artifact.beforeSha256) throw new Error(`Repair deltas do not restore the original review: ${file}`);
  return historical;
}
