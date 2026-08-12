import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  createProductBuildStamp,
  productBuildInputs,
  PRODUCT_BUILD_STAMP_PATH,
  PRODUCT_BUILD_STAMP_TOKEN,
} from '../tests/e2e/productHarness';

interface JsonSuite { suites?: JsonSuite[]; specs?: JsonSpec[] }
interface JsonSpec { tests?: Array<{ status?: string; results?: Array<{ status?: string }> }> }
interface JsonReport { suites?: JsonSuite[] }

const resultDirectory = path.join(process.cwd(), 'test-results');
const reportPath = path.join(resultDirectory, 'product-playwright-report.json');
mkdirSync(resultDirectory, { recursive: true });
if (existsSync(reportPath)) rmSync(reportPath);

const stampDirectory = mkdtempSync(path.join(tmpdir(), 'quiz-stage-product-gate-'));
const stampPath = path.join(stampDirectory, 'build-stamp.json');
const token = randomBytes(32).toString('hex');
const removeStamp = () => rmSync(stampDirectory, { recursive: true, force: true });
process.once('exit', removeStamp);
createProductBuildStamp({ stampPath, token, ...productBuildInputs() });

const playwright = path.join(process.cwd(), 'node_modules', '@playwright', 'test', 'cli.js');
let run: ReturnType<typeof spawnSync>;
try {
  run = spawnSync(process.execPath, [
    playwright,
    'test',
    'tests/e2e',
    'tests/visual',
    '--workers=1',
    '--reporter=line,json',
    '--forbid-only',
  ], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      [PRODUCT_BUILD_STAMP_PATH]: stampPath,
      [PRODUCT_BUILD_STAMP_TOKEN]: token,
      PLAYWRIGHT_JSON_OUTPUT_NAME: reportPath,
    },
    stdio: 'inherit',
  });
} finally {
  removeStamp();
}

if (run.error !== undefined) throw run.error;
if (run.status !== 0) process.exit(run.status ?? 1);
if (!existsSync(reportPath)) throw new Error('PLAYWRIGHT_PRODUCT_REPORT_MISSING');

const report = JSON.parse(readFileSync(reportPath, 'utf8')) as JsonReport;
const tests: NonNullable<JsonSpec['tests']> = [];
const visit = (suite: JsonSuite) => {
  for (const spec of suite.specs ?? []) tests.push(...(spec.tests ?? []));
  for (const child of suite.suites ?? []) visit(child);
};
for (const suite of report.suites ?? []) visit(suite);
const skipped = tests.filter((item) => item.status === 'skipped'
  || item.results?.some((result) => result.status === 'skipped')).length;
console.log(`Product Playwright gate: ${tests.length} tests, ${skipped} skipped.`);
if (tests.length === 0) throw new Error('PLAYWRIGHT_PRODUCT_TESTS_MISSING');
if (skipped !== 0) throw new Error(`PLAYWRIGHT_PRODUCT_TESTS_SKIPPED:${skipped}`);
