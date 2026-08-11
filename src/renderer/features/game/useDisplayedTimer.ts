import { useEffect, useState } from 'react';
import type { GameTimer } from '../../../shared/game/types';

const systemNow = () => Date.now();

export function displayedTimerMs(timer: GameTimer, now: number): number {
  if (timer.status !== 'running' || timer.startedAt === null) return timer.remainingMs;
  return Math.max(0, timer.remainingMs - Math.max(0, now - timer.startedAt));
}

export function useDisplayedTimer(timer: GameTimer, now: () => number = systemNow): number {
  const [, refresh] = useState(0);
  useEffect(() => {
    if (timer.status !== 'running' || timer.startedAt === null) return;
    const interval = window.setInterval(() => refresh((value) => value + 1), 100);
    return () => window.clearInterval(interval);
  }, [timer.startedAt, timer.status]);
  return displayedTimerMs(timer, now());
}
