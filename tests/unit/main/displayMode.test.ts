import { describe, expect, it } from 'vitest';
import { automaticDisplayMode } from '../../../src/main/displayMode';

describe('automaticDisplayMode', () => {
  it('uses dual mode only when at least two displays are available', () => {
    expect(automaticDisplayMode(0)).toBe('single');
    expect(automaticDisplayMode(1)).toBe('single');
    expect(automaticDisplayMode(2)).toBe('dual');
    expect(automaticDisplayMode(3)).toBe('dual');
  });
});
