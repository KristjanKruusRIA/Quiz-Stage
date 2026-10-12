import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import { loadContentRepairReview } from '../../../scripts/content/contentRepairReview';
import { readPreRepairContent } from './preRepairContent';

it.each(['relative', 'absolute'])('restores the frozen reviewed bytes from %s content paths', (kind) => {
  const file = 'content/generated/01-history.en-et.csv';
  const artifact = loadContentRepairReview()!.artifacts.find((item) => item.path === file)!;
  expect(artifact.afterSha256).not.toBe(artifact.beforeSha256);
  const historical = readPreRepairContent(kind === 'absolute' ? resolve(file) : file);
  expect(createHash('sha256').update(historical).digest('hex')).toBe(artifact.beforeSha256);
});
