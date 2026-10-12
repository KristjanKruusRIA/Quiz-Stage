import { spawn } from 'node:child_process';

export async function holdWindowsFile(file: string): Promise<{
  release: () => void;
  exited: Promise<number | null>;
}> {
  const locker = spawn('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    [
      '$handle = [System.IO.File]::Open($env:QUIZ_STAGE_LOCKED_FILE, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::Read);',
      'try { [Console]::Out.WriteLine("LOCKED"); [Console]::Out.Flush(); [Console]::In.ReadLine() | Out-Null; Start-Sleep -Milliseconds 3200 } finally { $handle.Dispose() }',
    ].join(' '),
  ], {
    env: { ...process.env, QUIZ_STAGE_LOCKED_FILE: file },
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true,
  });
  const release = () => {
    if (!locker.stdin.writableEnded) locker.stdin.end('RELEASE\n');
  };
  const exited = new Promise<number | null>((resolve, reject) => {
    locker.once('error', reject);
    locker.once('exit', resolve);
  });

  try {
    const ready = await new Promise<string>((resolve, reject) => {
      locker.stdout.once('data', (chunk: Buffer) => resolve(chunk.toString().trim()));
      locker.once('error', reject);
      locker.once('exit', () => reject(new Error('FILE_LOCKER_EXITED_BEFORE_READY')));
    });
    if (ready !== 'LOCKED') throw new Error(`UNEXPECTED_FILE_LOCKER_OUTPUT:${ready}`);
  } catch (error) {
    release();
    await exited.catch(() => undefined);
    throw error;
  }

  return { release, exited };
}
