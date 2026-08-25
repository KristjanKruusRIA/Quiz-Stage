import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Electron hardening', () => {
  it('applies the fuse and CSP policy from application startup', () => {
    const forgeConfig = readFileSync('forge.config.ts', 'utf8');
    const main = readFileSync('src/main/main.ts', 'utf8');
    const rendererHtml = readFileSync('src/renderer/index.html', 'utf8');

    expect(forgeConfig).toContain('[FuseV1Options.RunAsNode]: false');
    expect(forgeConfig).toContain('[FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false');
    expect(forgeConfig).toContain('[FuseV1Options.EnableNodeCliInspectArguments]: false');
    expect(forgeConfig).toContain('[FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true');
    expect(forgeConfig).toContain('[FuseV1Options.OnlyLoadAppFromAsar]: true');
    expect(rendererHtml).toContain("default-src 'self'");
    expect(rendererHtml).toContain('quiz-stage-media:');
    expect(main).toContain('registerContentPolicy(session.defaultSession');
  });
});
