import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useGameShortcuts, type GameShortcutHandlers } from '../../../../src/renderer/features/game/useGameShortcuts';

function Harness({ handlers }: { handlers: GameShortcutHandlers }) {
  useGameShortcuts(handlers);
  return <><button type="button">button</button><a href="#target">link</a><div role="button" tabIndex={0}>role button</div><input aria-label="input" /><textarea aria-label="textarea" /><select aria-label="select"><option>A</option></select><div contentEditable suppressContentEditableWarning>editable</div></>;
}

function handlers(): GameShortcutHandlers {
  return {
    onTeam: vi.fn(() => true), onCorrect: vi.fn(() => true), onIncorrect: vi.fn(() => true),
    onToggleTimer: vi.fn(() => true), onReveal: vi.fn(() => true), onUndo: vi.fn(() => true), onMute: vi.fn(() => true),
  };
}

describe('game shortcuts', () => {
  it('maps exact safe keys and prevents default only when handled', () => {
    const callbacks = handlers(); render(<Harness handlers={callbacks} />);
    for (const key of ['1', '8', 'c', 'X', ' ', 'r', 'u', 'm']) window.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, cancelable: true }));
    expect(callbacks.onTeam).toHaveBeenNthCalledWith(1, 0);
    expect(callbacks.onTeam).toHaveBeenNthCalledWith(2, 7);
    expect(callbacks.onCorrect).toHaveBeenCalledOnce();
    expect(callbacks.onIncorrect).toHaveBeenCalledOnce();
    expect(callbacks.onToggleTimer).toHaveBeenCalledOnce();
    expect(callbacks.onReveal).toHaveBeenCalledOnce();
    expect(callbacks.onUndo).toHaveBeenCalledTimes(2);
    expect(callbacks.onMute).toHaveBeenCalledOnce();
  });

  it('ignores editable focus, modifier conflicts, unsafe repeats, and cleans up', () => {
    const callbacks = handlers(); const { unmount } = render(<Harness handlers={callbacks} />);
    for (const selector of ['input', 'textarea', 'select', '[contenteditable="true"]']) {
      const target = document.querySelector(selector)!;
      target.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
      target.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }));
    }
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', altKey: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', metaKey: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', repeat: true }));
    expect(callbacks.onTeam).not.toHaveBeenCalled();
    expect(callbacks.onCorrect).not.toHaveBeenCalled();
    expect(callbacks.onIncorrect).not.toHaveBeenCalled();
    expect(callbacks.onToggleTimer).not.toHaveBeenCalled();
    expect(callbacks.onMute).not.toHaveBeenCalled();
    unmount(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }));
    expect(callbacks.onMute).not.toHaveBeenCalled();
  });

  it('leaves Space to native and ARIA interactive controls while body Space toggles the timer', () => {
    const callbacks = handlers(); render(<Harness handlers={callbacks} />);
    for (const selector of ['button', 'a', '[role="button"]', 'input', 'select']) {
      document.querySelector(selector)!.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    }
    expect(callbacks.onToggleTimer).not.toHaveBeenCalled();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    expect(callbacks.onToggleTimer).toHaveBeenCalledOnce();
  });
});
