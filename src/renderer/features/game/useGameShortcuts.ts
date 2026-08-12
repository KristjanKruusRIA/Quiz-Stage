import { useEffect, useRef } from 'react';

type Handled = () => boolean;

export interface GameShortcutHandlers {
  onTeam(index: number): boolean;
  onCorrect: Handled;
  onIncorrect: Handled;
  onToggleTimer: Handled;
  onReveal: Handled;
  onUndo: Handled;
  onMute: Handled;
}

function isInteractive(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return target.closest('button, a[href], input, textarea, select, [contenteditable="true"], [role="button"], [role="checkbox"], [role="radio"], [role="slider"], [role="spinbutton"]') !== null;
}

export function useGameShortcuts(handlers: GameShortcutHandlers): void {
  const current = useRef(handlers);
  current.current = handlers;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || isInteractive(event.target) || event.altKey || event.metaKey || event.shiftKey) return;
      const key = event.key.toLowerCase();
      let handled = false;
      if (/^[1-8]$/.test(key) && !event.ctrlKey) handled = current.current.onTeam(Number(key) - 1);
      else if (key === 'c' && !event.ctrlKey) handled = current.current.onCorrect();
      else if (key === 'x' && !event.ctrlKey) handled = current.current.onIncorrect();
      else if ((key === ' ' || key === 'spacebar') && !event.ctrlKey) handled = current.current.onToggleTimer();
      else if (key === 'r' && !event.ctrlKey) handled = current.current.onReveal();
      else if ((key === 'u' && !event.ctrlKey) || (key === 'z' && event.ctrlKey)) handled = current.current.onUndo();
      else if (key === 'm' && !event.ctrlKey) handled = current.current.onMute();
      if (handled) event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
