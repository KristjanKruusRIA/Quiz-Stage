import { spawnSync, type ChildProcess } from 'node:child_process';

export function terminatePackagedProcess(child: ChildProcess): void {
  if (child.exitCode !== null) return;
  if (process.platform === 'win32' && child.pid !== undefined) {
    const result = spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    if (result.status !== 0 && child.exitCode === null) child.kill();
    return;
  }
  child.kill();
}
