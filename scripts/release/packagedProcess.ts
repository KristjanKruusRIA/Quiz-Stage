import { execFile, type ChildProcess } from 'node:child_process';

export interface StopPackagedProcessOptions {
  timeoutMs?: number;
  terminate?: (child: ChildProcess, force: boolean) => Promise<void> | void;
}

export interface PackagedConnectionOptions {
  attempts?: number;
  intervalMs?: number;
  stopTimeoutMs?: number;
}

export function packagedProcessIsRunning(child: ChildProcess): boolean {
  return child.pid !== undefined && child.exitCode === null && child.signalCode === null;
}

function waitForExit(child: ChildProcess, timeoutMs: number): Promise<boolean> {
  if (!packagedProcessIsRunning(child)) return Promise.resolve(true);
  return new Promise((resolve) => {
    const onExit = () => finish(true);
    const timer = setTimeout(() => finish(false), timeoutMs);
    const finish = (exited: boolean) => {
      clearTimeout(timer);
      child.off('exit', onExit);
      resolve(exited || !packagedProcessIsRunning(child));
    };
    child.once('exit', onExit);
    if (!packagedProcessIsRunning(child)) finish(true);
  });
}

function runTaskkill(pid: number, force: boolean): Promise<void> {
  return new Promise((resolve) => {
    execFile('taskkill.exe', [
      '/PID',
      String(pid),
      '/T',
      ...(force ? ['/F'] : []),
    ], { windowsHide: true }, () => resolve());
  });
}

async function terminateProcessTree(child: ChildProcess, force: boolean): Promise<void> {
  if (!packagedProcessIsRunning(child)) return;
  const signal = force ? 'SIGKILL' : 'SIGTERM';
  const pid = child.pid;
  if (pid === undefined) return;

  if (globalThis.process.platform === 'win32') {
    await runTaskkill(pid, force);
    if (packagedProcessIsRunning(child) && force) child.kill('SIGKILL');
    return;
  }

  try {
    globalThis.process.kill(-pid, signal);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== 'ESRCH') child.kill(signal);
  }
}

export async function stopPackagedProcess(
  child: ChildProcess,
  options: StopPackagedProcessOptions = {},
): Promise<void> {
  if (!packagedProcessIsRunning(child)) return;
  const timeoutMs = options.timeoutMs ?? 5_000;
  const terminate = options.terminate ?? terminateProcessTree;

  await terminate(child, false);
  if (await waitForExit(child, timeoutMs)) return;
  await terminate(child, true);
  if (await waitForExit(child, timeoutMs)) return;
  throw new Error(`PACKAGED_PROCESS_STILL_RUNNING:${child.pid ?? 'unknown'}`);
}

export async function waitForPackagedConnection<T>(
  child: ChildProcess,
  connect: () => Promise<T>,
  options: PackagedConnectionOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? 100;
  const intervalMs = options.intervalMs ?? 100;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (!packagedProcessIsRunning(child)) {
      throw new Error(`PACKAGED_APP_EXITED:${child.exitCode ?? child.signalCode ?? 'unknown'}`);
    }
    try {
      return await connect();
    } catch { /* CDP is not ready yet. */ }
    if (attempt + 1 < attempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  await stopPackagedProcess(child, { timeoutMs: options.stopTimeoutMs });
  throw new Error('PACKAGED_APP_CDP_TIMEOUT');
}
