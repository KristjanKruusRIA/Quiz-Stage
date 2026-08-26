import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as offlineRenderer from '../../../src/main/offlineRenderer';

describe('development renderer root', () => {
  it('falls back to the working directory when Electron Forge runs the main bundle from .vite', () => {
    const resolveDevRendererRoot = (offlineRenderer as Record<string, unknown>).resolveDevRendererRoot;

    expect(resolveDevRendererRoot).toBeTypeOf('function');
    expect((resolveDevRendererRoot as (appPath: string, workingDirectory: string) => string)(
      'E:\\git\\jeopardy\\.vite\\build',
      'E:\\git\\jeopardy',
    )).toBe(join('E:\\git\\jeopardy', 'src', 'renderer'));
  });
});
