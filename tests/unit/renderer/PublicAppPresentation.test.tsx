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

  it('uses the operating-system reduced-motion preference for JavaScript presentation timing', () => {
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

    expect(screen.getByRole('grid', { name: 'Round One board' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Category 6' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Quiz Stage' })).not.toBeInTheDocument();
  });

  it('abandons a running intro when the operating-system preference changes', () => {
    let matches = false;
    let changeListener: (() => void) | undefined;
    const preference = mediaQuery(false);
    Object.defineProperty(preference, 'matches', { get: () => matches });
    vi.mocked(preference.addEventListener).mockImplementation((_type, listener) => {
      changeListener = listener as () => void;
    });
    vi.stubGlobal('matchMedia', vi.fn(() => preference));
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
    const { unmount } = render(<App api={api} />);
    expect(screen.getByRole('img', { name: 'Quiz Stage' })).toBeInTheDocument();

    matches = true;
    act(() => changeListener?.());
    expect(screen.getByRole('columnheader', { name: 'Category 6' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Quiz Stage' })).not.toBeInTheDocument();

    matches = false;
    act(() => changeListener?.());
    expect(screen.getByRole('columnheader', { name: 'Category 6' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Quiz Stage' })).not.toBeInTheDocument();
    unmount();
    expect(preference.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('fails closed when persisted appearance settings cannot be loaded', () => {
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

    expect(screen.getByRole('grid', { name: 'Round One board' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Category 6' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Quiz Stage' })).not.toBeInTheDocument();
    expect(screen.getByRole('grid').parentElement?.parentElement).toHaveAttribute('data-reduced-motion', 'true');
  });
});
