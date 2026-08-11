import { describe, expect, it } from 'vitest';
import { editorSourceSchema } from '../../../src/shared/content/editor';
import { isHttpSourceUrl, sourceUrlSchema } from '../../../src/shared/content/sourceUrl';

describe('HTTP(S) source URLs', () => {
  it.each(['https://example.com/source', 'http://localhost/source'])('accepts %s consistently', (url) => {
    expect(isHttpSourceUrl(url)).toBe(true);
    expect(sourceUrlSchema.parse(url)).toBe(url);
    expect(editorSourceSchema.parse({ title: 'S', url, license: 'CC0', retrievedAt: '2026-08-12', translationStatus: 'reviewed' }).url).toBe(url);
  });

  it.each(['javascript:alert(1)', 'file:///tmp/source', 'mailto:a@example.com', 'https://user:pass@example.com/source'])
    ('rejects %s consistently', (url) => {
      expect(isHttpSourceUrl(url)).toBe(false);
      expect(sourceUrlSchema.safeParse(url).success).toBe(false);
      expect(editorSourceSchema.safeParse({ title: 'S', url, license: 'CC0', retrievedAt: '2026-08-12', translationStatus: 'reviewed' }).success).toBe(false);
    });
});
