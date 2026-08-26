import { execFile, type ChildProcess } from 'node:child_process';

export interface StopPackagedProcessOptions {
  timeoutMs?: number;
  processTreeIsRunning?: (child: ChildProcess) => boolean;
  terminate?: (child: ChildProcess, force: boolean) => Promise<void> | void;
}

export interface PackagedConnectionOptions extends Omit<StopPackagedProcessOptions, 'timeoutMs'> {
  attempts?: number;
  intervalMs?: number;
  stopTimeoutMs?: number;
}

export function packagedProcessIsRunning(child: ChildProcess): boolean {
  return child.pid !== undefined && child.exitCode === null && child.signalCode === null;
}

function packagedProcessTreeIsRunning(child: ChildProcess): boolean {
  if (globalThis.process.platform === 'win32') return packagedProcessIsRunning(child);
  if (child.pid === undefined) return false;
  try {
    globalThis.process.kill(-child.pid, 0);
    return true;
  } catch (error: unknown) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ESRCH') return false;
    if (code === 'EPERM') return true;
    throw error;
  }
}

async function waitForProcessTreeExit(
  child: ChildProcess,
  timeoutMs: number,
  processTreeIsRunning: (child: ChildProcess) => boolean,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (processTreeIsRunning(child)) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) return false;
    await new Promise((resolve) => setTimeout(resolve, Math.min(25, remainingMs)));
  }
  return true;
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
  const signal = force ? 'SIGKILL' : 'SIGTERM';
  const pid = child.pid;
  if (pid === undefined) return;

  if (globalThis.process.platform === 'win32') {
    if (!packagedProcessIsRunning(child)) return;
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
  const timeoutMs = options.timeoutMs ?? 5_000;
  const processTreeIsRunning = options.processTreeIsRunning ?? packagedProcessTreeIsRunning;
  const terminate = options.terminate ?? terminateProcessTree;
  if (!processTreeIsRunning(child)) return;

  await terminate(child, false);
  if (await waitForProcessTreeExit(child, timeoutMs, processTreeIsRunning)) return;
  await terminate(child, true);
  if (await waitForProcessTreeExit(child, timeoutMs, processTreeIsRunning)) return;
  throw new Error(`PACKAGED_PROCESS_STILL_RUNNING:${child.pid ?? 'unknown'}`);
}

export async function waitForPackagedConnection<T>(
  child: ChildProcess,
  connect: () => Promise<T>,
  options: PackagedConnectionOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? 100;
  const intervalMs = options.intervalMs ?? 100;
  const stopOptions: StopPackagedProcessOptions = {
    timeoutMs: options.stopTimeoutMs,
    processTreeIsRunning: options.processTreeIsRunning,
    terminate: options.terminate,
  };
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (!packagedProcessIsRunning(child)) {
      const exitStatus = child.exitCode ?? child.signalCode ?? 'unknown';
      await stopPackagedProcess(child, stopOptions);
      throw new Error(`PACKAGED_APP_EXITED:${exitStatus}`);
    }
    try {
      return await connect();
    } catch { /* CDP is not ready yet. */ }
    if (attempt + 1 < attempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }
  await stopPackagedProcess(child, stopOptions);
  throw new Error('PACKAGED_APP_CDP_TIMEOUT');
}
