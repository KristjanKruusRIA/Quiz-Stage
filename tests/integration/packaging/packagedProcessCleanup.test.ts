import { spawn } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { terminatePackagedProcess } from '../../e2e/support/packagedProcess';

function processExists(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function spawnedChildPid(parent: ReturnType<typeof spawn>): Promise<number> {
  return new Promise((resolve, reject) => {
    let output = '';
    parent.stdout?.on('data', (chunk: Buffer) => {
      output += chunk.toString();
      const line = output.split(/\r?\n/, 1)[0];
      if (/^\d+$/.test(line)) resolve(Number(line));
    });
    parent.once('error', reject);
    parent.once('exit', (code) => reject(new Error(`Parent exited before reporting child PID: ${code}`)));
  });
}

describe.skipIf(process.platform !== 'win32')('packaged process cleanup', () => {
  it('terminates the spawned Electron-style process tree', async () => {
    const parent = spawn(process.execPath, ['-e', [
      "const { spawn } = require('node:child_process');",
      "const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });",
      'console.log(child.pid);',
      'setInterval(() => {}, 1000);',
    ].join(' ')], { stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true });
    const childPid = await spawnedChildPid(parent);

    terminatePackagedProcess(parent);

    await expect.poll(() => ({ parent: processExists(parent.pid!), child: processExists(childPid) })).toEqual({
      parent: false,
      child: false,
    });
  });
});
