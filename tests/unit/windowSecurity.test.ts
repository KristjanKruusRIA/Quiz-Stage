import { describe, expect, it } from 'vitest';
import {
  blockNavigationAndWindows,
  type WindowSecurityPort,
} from '../../src/main/windowSecurity';

describe('window security', () => {
  it('prevents navigation and denies unexpected windows', () => {
    let prevented = false;
    let willNavigate: ((event: { preventDefault: () => void }) => void) | undefined;
    let windowOpenHandler: (() => { action: 'deny' }) | undefined;

    const webContents: WindowSecurityPort = {
      on: (_event, listener) => {
        willNavigate = listener;
      },
      setWindowOpenHandler: (handler) => {
        windowOpenHandler = handler;
      },
    };

    blockNavigationAndWindows(webContents);

    willNavigate?.({
      preventDefault: () => {
        prevented = true;
      },
    });

    expect(prevented).toBe(true);
    expect(windowOpenHandler?.()).toEqual({ action: 'deny' });
  });
});
