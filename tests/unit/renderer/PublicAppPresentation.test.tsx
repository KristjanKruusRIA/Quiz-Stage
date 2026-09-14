import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../../../src/renderer/App';
import type { PublicDesktopApi } from '../../../src/renderer/api/desktopApi';
import type { AppearanceSettings } from '../../../src/shared/settings/appearance';
import { defaultAppearanceSettings } from '../../../src/shared/settings/appearance';
import { publicView } from './game/fixtures';

function mediaQuery(matches: boolean): MediaQueryList {
  return {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('public App presentation accessibility', () => {
  it('does not start a one-shot intro before persisted appearance settings resolve', () => {
    let stateListener: Parameters<PublicDesktopApi['subscribeToState']>[0] | undefined;
    let appearanceListener: ((settings: AppearanceSettings) => void) | undefined;
    const api: PublicDesktopApi = {
      surface: 'public',
      subscribeToState: (listener) => { stateListener = listener; return vi.fn(); },
      subscribeToAppearance: (listener) => { appearanceListener = listener; return vi.fn(); },
    };
    vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery(false)));
    render(<App api={api} />);

    expect(stateListener).toBeUndefined();
    act(() => stateListener?.(publicView(), 'round-intro'));
    expect(screen.getByRole('status')).toHaveTextContent('Waiting for the host');
    expect(screen.queryByRole('img', { name: 'Quiz Stage' })).not.toBeInTheDocument();

    act(() => appearanceListener?.(defaultAppearanceSettings));
    act(() => stateListener?.(publicView(), 'round-intro'));
    expect(screen.getByRole('img', { name: 'Quiz Stage' })).toBeInTheDocument();
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  it('ignores operating-system reduced motion when the app setting is disabled', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery(true)));
    const api: PublicDesktopApi = {
      surface: 'public',
      subscribeToState: (listener) => {
        listener(publicView(), 'round-intro');
        return vi.fn();
      },
      subscribeToAppearance: (listener) => {
        listener(defaultAppearanceSettings);
        return vi.fn();
      },
    };

    render(<App api={api} />);

    expect(screen.getByRole('img', { name: 'Quiz Stage' })).toBeInTheDocument();
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Quiz Stage' }).closest('[data-reduced-motion]'))
      .toHaveAttribute('data-reduced-motion', 'false');
  });

  it('enables reduced motion when the persisted app setting requests it', () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery(false)));
    const api: PublicDesktopApi = {
      surface: 'public',
      subscribeToState: (listener) => {
        listener(publicView(), 'round-intro');
        return vi.fn();
      },
      subscribeToAppearance: (listener) => {
        listener({ ...defaultAppearanceSettings, reducedMotion: true });
        return vi.fn();
      },
    };
    try {
      render(<App api={api} />);

      expect(screen.getByRole('img', { name: 'Quiz Stage' })).toBeInTheDocument();
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Quiz Stage' }).closest('[data-reduced-motion]'))
        .toHaveAttribute('data-reduced-motion', 'true');

      act(() => { vi.advanceTimersByTime(6_000); });
      expect(screen.getByRole('columnheader', { name: 'Category 1' })).toBeInTheDocument();
      expect(screen.queryByRole('columnheader', { name: 'Category 2' })).not.toBeInTheDocument();

      act(() => { vi.advanceTimersByTime(3_000); });
      expect(screen.getByRole('columnheader', { name: 'Category 2' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('defaults to motion when persisted appearance settings cannot be loaded', () => {
    let stateListener: Parameters<PublicDesktopApi['subscribeToState']>[0] | undefined;
    let appearanceError: (() => void) | undefined;
    const api: PublicDesktopApi = {
      surface: 'public',
      subscribeToState: (listener) => { stateListener = listener; return vi.fn(); },
      subscribeToAppearance: (_listener, onError) => { appearanceError = onError; return vi.fn(); },
    };
    vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery(false)));
    render(<App api={api} />);

    act(() => appearanceError?.());
    act(() => stateListener?.(publicView(), 'round-intro'));

    expect(screen.getByRole('img', { name: 'Quiz Stage' })).toBeInTheDocument();
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Quiz Stage' }).closest('[data-reduced-motion]'))
      .toHaveAttribute('data-reduced-motion', 'false');
  });
});
