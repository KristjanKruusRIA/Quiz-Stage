import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import log from 'electron-log/main';

export interface LocalLogger {
  exportDiagnostics: (outputPath?: string) => string;
}

export interface LocalLoggerOptions {
  fileName?: string;
  maxSize?: number;
  maxArchiveLogs?: number;
  redactKeys?: string[];
}

const DEFAULT_FILE_NAME = 'quiz-stage-main.log';
const DEFAULT_MAX_SIZE = 2 * 1024 * 1024;
const DEFAULT_MAX_ARCHIVE_LOGS = 3;
const LOG_MESSAGE_REDIRECT = '[REDACTED]';

function redactSecrets(value: unknown, redactKeys: Set<string>, visited = new Set<object>()): unknown {
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return value;
  if (typeof value === 'bigint' || typeof value === 'symbol' || typeof value === 'function') return value;
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => redactSecrets(entry, redactKeys, visited));
  }
  if (typeof value === 'object') {
    if (visited.has(value as object)) return '[Circular]';
    visited.add(value as object);
    const next: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      next[key] = redactKeys.has(key) ? LOG_MESSAGE_REDIRECT : redactSecrets(nested, redactKeys, visited);
    }
    return next;
  }
  return value;
}

function redactLine(value: string): string {
  return value
    .replace(/"prompt"\s*:\s*"[^"]*"/gi, '"prompt":"[REDACTED]"')
    .replace(/"response"\s*:\s*"[^"]*"/gi, '"response":"[REDACTED]"')
    .replace(/"explanation"\s*:\s*"[^"]*"/gi, '"explanation":"[REDACTED]"');
}

function pruneArchivedLogs(root: string, maxArchiveLogs: number): void {
  const existing = readdirSync(root)
    .filter((file) => file.startsWith('quiz-stage-main.') && file.endsWith('.log'))
    .sort((left, right) => right.localeCompare(left));
  while (existing.length > maxArchiveLogs) {
    const candidate = existing.pop();
    if (candidate !== undefined) {
      try {
        if (existsSync(join(root, candidate))) {
          rmSync(join(root, candidate), { force: true });
        }
      } catch {
        // best-effort cleanup of stale archive logs
      }
    }
  }
}

function buildDefaultExportPath(): string {
  const current = log.transports.file.getFile();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return join(dirname(current.path), `quiz-stage-diagnostics-${timestamp}.json`);
}

export function initializeLocalLogger(options: LocalLoggerOptions = {}): LocalLogger {
  const maxArchiveLogs = options.maxArchiveLogs ?? DEFAULT_MAX_ARCHIVE_LOGS;
  const maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
  const redactKeys = new Set(options.redactKeys ?? ['prompt', 'response', 'explanation']);
  log.initialize();
  log.transports.file.level = 'info';
  log.transports.file.fileName = options.fileName ?? DEFAULT_FILE_NAME;
  log.transports.file.maxSize = maxSize;
  log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}] {scope} {text}';
  log.transports.file.writeOptions = { ...log.transports.file.writeOptions, flag: 'a' };
  log.transports.file.archiveLogFn = (oldLogFile) => {
    const outputDirectory = dirname(oldLogFile.path);
    mkdirSync(outputDirectory, { recursive: true });
    pruneArchivedLogs(outputDirectory, maxArchiveLogs);
  };
  log.hooks.push((message) => ({
    ...message,
    data: message.data.map((value) => redactSecrets(value, redactKeys)),
  }));

  return {
    exportDiagnostics: (outputPath = buildDefaultExportPath()) => {
      mkdirSync(dirname(outputPath), { recursive: true });
      const logSnapshot = log.transports.file.readAllLogs().map((entry) => ({
        path: entry.path,
        lines: entry.lines.map(redactLine),
      }));
      const payload = {
        generatedAt: new Date().toISOString(),
        fileName: basename(log.transports.file.getFile().path),
        filePath: log.transports.file.getFile().path,
        logs: logSnapshot,
      };
      writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8');
      return outputPath;
    },
  };
}
