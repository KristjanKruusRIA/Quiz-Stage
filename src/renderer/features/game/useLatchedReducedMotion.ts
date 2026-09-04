import { useState } from 'react';

export function useLatchedReducedMotion(reducedMotion: boolean): boolean {
  const [state, setState] = useState({ input: reducedMotion, latched: reducedMotion });
  if (state.input !== reducedMotion) {
    setState({ input: reducedMotion, latched: state.latched || reducedMotion });
  }
  return reducedMotion || state.latched;
}
