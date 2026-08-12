import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { prepareE2eApplication, PRODUCT_BUILD_READY } from '../tests/e2e/productHarness';

interface JsonSuite { suites?: JsonSuite[]; specs?: JsonSpec[] }
interface JsonSpec { tests?: Array<{ status?: string; results?: Array<{ status?: string }> }> }
interface JsonReport { suites?: JsonSuite[] }

const resultDirectory = path.join(process.cwd(), 'test-results');
const reportPath = path.join(resultDirectory, 'product-playwright-report.json');
mkdirSync(resultDirectory, { recursive: true });
if (existsSync(reportPath)) rmSync(reportPath);

process.env[PRODUCT_BUILD_READY] = '1';
prepareE2eApplication();

const playwright = path.join(process.cwd(), 'node_modules', '@playwright', 'test', 'cli.js');
const run = spawnSync(process.execPath, [
  playwright,
  'test',
  'tests/e2e',
  'tests/visual',
  '--workers=1',
  '--reporter=line,json',
  '--forbid-only',
], {
  cwd: process.cwd(),
  env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: reportPath },
  stdio: 'inherit',
});

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
