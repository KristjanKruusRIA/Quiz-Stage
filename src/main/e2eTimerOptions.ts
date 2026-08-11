import type { ApplicationOptions } from './application';

export function acceleratedE2eTimerOptions(enabled: boolean, isPackaged: boolean): ApplicationOptions {
  if (!enabled || isPackaged) return {};
  let logicalNow = Date.now();
  return {
    now: () => Math.max(logicalNow, Date.now()),
    setTimeout: (callback, delayMs) => {
      const accelerated = delayMs >= 20_000;
      const handle = globalThis.setTimeout(() => {
        if (accelerated) logicalNow = Math.max(logicalNow, Date.now()) + delayMs;
        callback();
      }, accelerated ? 50 : delayMs);
      handle.unref();
      return handle;
    },
    clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
  };
}
