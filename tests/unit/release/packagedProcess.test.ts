import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  packagedProcessIsRunning,
  stopPackagedProcess,
  waitForPackagedConnection,
} from '../../../scripts/release/packagedProcess';

const children: ChildProcess[] = [];
const temporaryDirectories: string[] = [];

function spawnSleeper(
  script = 'setInterval(() => undefined, 1000)',
  args: string[] = [],
): ChildProcess {
  const child = spawn(process.execPath, ['-e', script, ...args], {
    detached: process.platform !== 'win32',
    stdio: 'ignore',
    windowsHide: true,
  });
  children.push(child);
  return child;
}

async function waitFor(condition: () => boolean, timeoutMs = 3_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() >= deadline) throw new Error('PROCESS_FIXTURE_TIMEOUT');
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

function processExists(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

afterEach(async () => {
  for (const child of children.splice(0)) {
    if (packagedProcessIsRunning(child)) {
      child.kill('SIGKILL');
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('packaged process cleanup', () => {
  it('waits for a graceful process exit', async () => {
    const child = spawnSleeper();

    await stopPackagedProcess(child, {
      timeoutMs: 1_000,
      terminate: (process) => { process.kill(); },
    });

    expect(packagedProcessIsRunning(child)).toBe(false);
  });

  it('forces termination after a graceful stop does not exit', async () => {
    const child = spawnSleeper();

    await stopPackagedProcess(child, {
      timeoutMs: 1_000,
      terminate: (_process, force) => {
        if (force) child.kill('SIGKILL');
      },
    });

    expect(packagedProcessIsRunning(child)).toBe(false);
  });

  it('fails explicitly if forced termination leaves the process alive', async () => {
    const child = spawnSleeper();

    await expect(stopPackagedProcess(child, {
      timeoutMs: 20,
      terminate: () => undefined,
    })).rejects.toThrow('PACKAGED_PROCESS_STILL_RUNNING');
    expect(packagedProcessIsRunning(child)).toBe(true);
  });

  it('stops the process before reporting a CDP timeout', async () => {
    const child = spawnSleeper();

    await expect(waitForPackagedConnection(
      child,
      async () => { throw new Error('CDP_NOT_READY'); },
      { attempts: 1, intervalMs: 0, stopTimeoutMs: 500 },
    )).rejects.toThrow('PACKAGED_APP_CDP_TIMEOUT');
    expect(packagedProcessIsRunning(child)).toBe(false);
  }, 10_000);

  it('terminates descendants in the packaged process tree', async () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'quiz-stage-process-fixture-'));
    temporaryDirectories.push(directory);
    const pidFile = path.join(directory, 'child.pid');
    const processTree = spawnSleeper(`
      const { spawn } = require('node:child_process');
      const { writeFileSync } = require('node:fs');
      const child = spawn(process.execPath, ['-e', 'setInterval(() => undefined, 1000)'], { stdio: 'ignore' });
      writeFileSync(process.argv[1], String(child.pid));
      setInterval(() => undefined, 1000);
    `, [pidFile]);
    await waitFor(() => existsSync(pidFile));
    const descendantPid = Number(readFileSync(pidFile, 'utf8'));

    await stopPackagedProcess(processTree, { timeoutMs: 250 });

    expect(packagedProcessIsRunning(processTree)).toBe(false);
    expect(processExists(descendantPid)).toBe(false);
  }, 10_000);
});
