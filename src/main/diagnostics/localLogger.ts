import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import log from 'electron-log/main';
import type { ValidatedGameCommand } from '../../shared/ipc/contracts';

export interface DiagnosticMetadata {
  appVersion: string;
  schemaVersion: number;
}

export interface LocalLogger {
  recordGameCommand(command: ValidatedGameCommand): void;
  exportDiagnostics(outputPath: string, metadata: DiagnosticMetadata): string;
}

export interface LocalLoggerOptions {
  fileName?: string;
  logDirectory?: string;
  maxSize?: number;
  maxFiles?: number;
  redactKeys?: string[];
}

const DEFAULT_FILE_NAME = 'quiz-stage-main.log';
const DEFAULT_MAX_SIZE = 1 * 1024 * 1024;
const DEFAULT_MAX_FILES = 3;
const LOG_MESSAGE_REDIRECT = '[REDACTED]';

function redactSecrets(value: unknown, redactKeys: Set<string>, visited = new Set<object>()): unknown {
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'string') return value;
  if (typeof value === 'bigint' || typeof value === 'symbol' || typeof value === 'function') return value;
  if (value instanceof Error) return value.name;
  if (Array.isArray(value)) return value.map((entry) => redactSecrets(entry, redactKeys, visited));
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
  return value.replace(
    /"(?:prompt|clue|clueText|response|explanation|reason)"\s*:\s*"[^"]*"/gi,
    (match) => `${match.slice(0, match.indexOf(':') + 1)}"${LOG_MESSAGE_REDIRECT}"`,
  );
}

function archivePath(activePath: string, index: number): string {
  const extension = extname(activePath);
  return join(dirname(activePath), `${basename(activePath, extension)}.${index}${extension}`);
}

function rotateLogFiles(activePath: string, maxFiles: number): void {
  for (let index = maxFiles - 1; index >= 1; index -= 1) {
    const destination = archivePath(activePath, index);
    const source = index === 1 ? activePath : archivePath(activePath, index - 1);
    try {
      rmSync(destination, { force: true });
      if (existsSync(source)) renameSync(source, destination);
    } catch {
      // Rotation is best effort; electron-log will still reset the active file.
    }
  }
}

export function initializeLocalLogger(options: LocalLoggerOptions = {}): LocalLogger {
  const fileName = options.fileName ?? DEFAULT_FILE_NAME;
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
  const redactKeys = new Set(options.redactKeys ?? [
    'prompt', 'clue', 'clueText', 'response', 'explanation', 'reason',
  ]);
  log.initialize();
  log.transports.console.level = false;
  log.transports.file.level = 'info';
  log.transports.file.fileName = fileName;
  log.transports.file.maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
  log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s}.{ms} [{level}] {scope} {text}';
  log.transports.file.writeOptions = { ...log.transports.file.writeOptions, flag: 'a' };
  if (options.logDirectory !== undefined) {
    mkdirSync(options.logDirectory, { recursive: true });
    log.transports.file.resolvePathFn = () => join(options.logDirectory!, fileName);
  }
  log.transports.file.archiveLogFn = (oldLogFile) => rotateLogFiles(oldLogFile.path, maxFiles);
  log.hooks.push((message) => ({
    ...message,
    data: message.data.map((value) => redactSecrets(value, redactKeys)),
  }));
  const runtimeLog = log.scope('runtime');

  return {
    recordGameCommand: (command) => {
      runtimeLog.info('game-command', {
        type: command.type,
        ...('clueId' in command && typeof command.clueId === 'string' ? { clueId: command.clueId } : {}),
      });
    },
    exportDiagnostics: (outputPath, metadata) => {
      mkdirSync(dirname(outputPath), { recursive: true });
      const archivePattern = new RegExp(`^${fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\\\.log$/, '')}(?:\\.\\d+)?\\.log$`);
      const logDirectory = dirname(log.transports.file.getFile().path);
      const logs = readdirSync(logDirectory)
        .filter((candidate) => archivePattern.test(candidate))
        .sort()
        .map((candidate) => ({
          fileName: candidate,
          lines: readFileSync(join(logDirectory, candidate), 'utf8').split(/\r?\n/).map(redactLine),
        }));
      writeFileSync(outputPath, JSON.stringify({
        appVersion: metadata.appVersion,
        schemaVersion: metadata.schemaVersion,
        logs,
      }, null, 2), 'utf8');
      return outputPath;
    },
  };
}

export async function exportDiagnosticsAfterUserChoice(
  chooseDestination: () => Promise<string | null>,
  logger: LocalLogger,
  metadata: DiagnosticMetadata,
): Promise<string | null> {
  const destination = await chooseDestination();
  return destination === null ? null : logger.exportDiagnostics(destination, metadata);
}
